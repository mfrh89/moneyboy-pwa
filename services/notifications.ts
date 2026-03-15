import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

let messaging: Messaging | null = null;

export const initializeMessaging = (firebaseApp: any) => {
  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return null;
  }
};

export const requestNotificationPermission = async (userId: string): Promise<string | null> => {
  if (!messaging) {
    console.error('Messaging not initialized');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'YOUR_VAPID_KEY' // This will need to be configured
      });
      
      if (token) {
        console.log('FCM Token:', token);
        
        // Save token to Firestore
        const db = getFirestore();
        await setDoc(doc(db, 'users', userId, 'fcmTokens', token), {
          token,
          createdAt: Date.now(),
          userAgent: navigator.userAgent,
          platform: navigator.platform
        });
        
        return token;
      }
    } else {
      console.log('Notification permission denied');
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
  }
  
  return null;
};

export const setupForegroundMessageHandler = (callback: (payload: any) => void) => {
  if (!messaging) {
    console.error('Messaging not initialized');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};

export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermissionStatus = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};
