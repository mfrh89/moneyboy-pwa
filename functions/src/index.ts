import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * HTTP function that checks all users for subscriptions expiring within 2 days
 * and sends push notifications. Can be triggered via HTTP request or cronjob.
 * 
 * Security: Add a secret token in query parameter: ?token=YOUR_SECRET_TOKEN
 */
export const checkSubscriptionsDaily = functions
  .region('europe-west1')
  .https
  .onRequest(async (request, response) => {
    // Simple security: Check for secret token
    const expectedToken = process.env.CRON_SECRET || 'change-this-secret-token';
    const providedToken = request.query.token;
    
    if (providedToken !== expectedToken) {
      response.status(401).send('Unauthorized');
      return;
    }
    const db = admin.firestore();
    const messaging = admin.messaging();
    
    const now = Date.now();
    const twoDaysFromNow = now + (2 * 24 * 60 * 60 * 1000);
    
    console.log('Starting subscription check...');
    
    try {
      // Get all users
      const usersSnapshot = await db.collection('users').get();
      let totalNotificationsSent = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Get user's subscriptions
        const itemsSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('items')
          .where('isSubscription', '==', true)
          .get();
        
        const upcomingSubscriptions: any[] = [];
        
        itemsSnapshot.forEach(doc => {
          const item = doc.data();
          const nextBilling = item.subscriptionNextBilling;
          const cancellationDeadline = item.subscriptionCancellationDeadline;
          
          // Check if next billing is within 2 days
          if (nextBilling && nextBilling >= now && nextBilling <= twoDaysFromNow) {
            upcomingSubscriptions.push({
              ...item,
              id: doc.id,
              type: 'billing',
              date: nextBilling
            });
          }
          
          // Check if cancellation deadline is within 2 days
          if (cancellationDeadline && cancellationDeadline >= now && cancellationDeadline <= twoDaysFromNow) {
            upcomingSubscriptions.push({
              ...item,
              id: doc.id,
              type: 'cancellation',
              date: cancellationDeadline
            });
          }
        });
        
        // Send notification if there are upcoming subscriptions
        if (upcomingSubscriptions.length > 0) {
          console.log(`Found ${upcomingSubscriptions.length} upcoming subscriptions for user ${userId}`);
          
          // Get user's FCM tokens
          const tokensSnapshot = await db
            .collection('users')
            .doc(userId)
            .collection('fcmTokens')
            .get();
          
          const tokens = tokensSnapshot.docs.map(doc => doc.data().token).filter(Boolean);
          
          if (tokens.length > 0) {
            // Sort by date to get the most urgent one
            upcomingSubscriptions.sort((a, b) => a.date - b.date);
            const mostUrgent = upcomingSubscriptions[0];
            
            const daysUntil = Math.ceil((mostUrgent.date - now) / (24 * 60 * 60 * 1000));
            const timeText = daysUntil === 0 ? 'heute' : daysUntil === 1 ? 'morgen' : `in ${daysUntil} Tagen`;
            
            const notificationTitle = mostUrgent.type === 'cancellation' 
              ? '⚠️ Kündigungsfrist läuft ab!'
              : '💳 Abo-Verlängerung';
            
            const notificationBody = mostUrgent.type === 'cancellation'
              ? `${mostUrgent.title} muss ${timeText} gekündigt werden`
              : `${mostUrgent.title} verlängert sich ${timeText}`;
            
            const message = {
              notification: {
                title: notificationTitle,
                body: upcomingSubscriptions.length > 1 
                  ? `${notificationBody} (+${upcomingSubscriptions.length - 1} weitere)`
                  : notificationBody
              },
              data: {
                subscriptionId: mostUrgent.id,
                type: mostUrgent.type,
                count: upcomingSubscriptions.length.toString()
              },
              tokens: tokens
            };
            
            try {
              const response = await messaging.sendEachForMulticast(message);
              console.log(`Sent ${response.successCount} notifications to user ${userId}`);
              totalNotificationsSent += response.successCount;
              
              // Clean up invalid tokens
              if (response.failureCount > 0) {
                const failedTokens: string[] = [];
                response.responses.forEach((resp, idx) => {
                  if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                  }
                });
                
                // Delete invalid tokens
                const batch = db.batch();
                for (const token of failedTokens) {
                  const tokenDoc = await db
                    .collection('users')
                    .doc(userId)
                    .collection('fcmTokens')
                    .where('token', '==', token)
                    .limit(1)
                    .get();
                  
                  if (!tokenDoc.empty) {
                    batch.delete(tokenDoc.docs[0].ref);
                  }
                }
                await batch.commit();
                console.log(`Cleaned up ${failedTokens.length} invalid tokens for user ${userId}`);
              }
            } catch (error) {
              console.error(`Error sending notification to user ${userId}:`, error);
            }
          } else {
            console.log(`User ${userId} has upcoming subscriptions but no FCM tokens`);
          }
        }
      }
      
      console.log(`Subscription check completed. Sent ${totalNotificationsSent} notifications.`);
      response.status(200).json({
        success: true,
        notificationsSent: totalNotificationsSent,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error in subscription check:', error);
      response.status(500).json({
        success: false,
        error: String(error)
      });
    }
  });
