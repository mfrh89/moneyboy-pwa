# Push Notifications Setup Guide

## Was wurde implementiert

Die Push-Notification-Funktionalität ist vollständig im Frontend integriert:

- ✅ Service Worker für Firebase Cloud Messaging
- ✅ Notification-Service mit Permission-Handling
- ✅ UI für Notification-Einstellungen im Settings-Tab
- ✅ Automatische Erkennung bald auslaufender Abos (2 Tage Vorlauf)
- ✅ iOS-Kompatibilität mit Hinweisen

## Was noch fehlt

### 1. VAPID Key konfigurieren

In `services/notifications.ts` Zeile 22 muss der VAPID Key eingetragen werden:

```typescript
const token = await getToken(messaging, {
  vapidKey: 'YOUR_VAPID_KEY' // <-- Hier eintragen!
});
```

**VAPID Key generieren:**
1. Firebase Console öffnen: https://console.firebase.google.com
2. Projekt auswählen
3. Settings → Cloud Messaging
4. Unter "Web Push certificates" → "Generate key pair"
5. Key kopieren und in Code einfügen

### 2. PWA Icons hinzufügen

Die Notification-Komponenten referenzieren `/icon-192.png` und `/icon-512.png`:

```bash
# Icons in public/ Verzeichnis ablegen:
public/
  ├── icon-192.png  (192x192 px)
  └── icon-512.png  (512x512 px)
```

**Empfehlung:** Logo von Moneyboy in entsprechenden Größen exportieren.

### 3. Firebase Cloud Function erstellen

Erstelle eine neue Cloud Function für den täglichen Check:

```bash
# Firebase Functions initialisieren
firebase init functions

# Wähle TypeScript/JavaScript
```

**Function-Code (`functions/src/index.ts`):**

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const checkSubscriptionsDaily = functions.pubsub
  .schedule('0 9 * * *') // Täglich um 9 Uhr
  .timeZone('Europe/Berlin')
  .onRun(async (context) => {
    const db = admin.firestore();
    const messaging = admin.messaging();
    
    const now = Date.now();
    const twoDaysFromNow = now + (2 * 24 * 60 * 60 * 1000);
    
    // Alle User durchgehen
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Items des Users abrufen
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
        
        if (nextBilling && nextBilling >= now && nextBilling <= twoDaysFromNow) {
          upcomingSubscriptions.push({ ...item, id: doc.id, type: 'billing' });
        }
        if (cancellationDeadline && cancellationDeadline >= now && cancellationDeadline <= twoDaysFromNow) {
          upcomingSubscriptions.push({ ...item, id: doc.id, type: 'cancellation' });
        }
      });
      
      // Wenn bald auslaufende Abos gefunden: Push senden
      if (upcomingSubscriptions.length > 0) {
        const tokensSnapshot = await db
          .collection('users')
          .doc(userId)
          .collection('fcmTokens')
          .get();
        
        const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
        
        if (tokens.length > 0) {
          const message = {
            notification: {
              title: '⚠️ Abo-Erinnerung',
              body: `${upcomingSubscriptions.length} Abo(s) laufen in den nächsten 2 Tagen ab!`
            },
            tokens: tokens
          };
          
          try {
            await messaging.sendMulticast(message);
            console.log(`Sent notification to user ${userId}`);
          } catch (error) {
            console.error(`Error sending to user ${userId}:`, error);
          }
        }
      }
    }
    
    return null;
  });
```

**Function deployen:**

```bash
firebase deploy --only functions
```

### 4. Firestore Security Rules erweitern

In `firestore.rules` folgendes hinzufügen:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /items/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      // NEU: FCM Token collection
      match /fcmTokens/{tokenId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Deployen:

```bash
firebase deploy --only firestore:rules
```

## Testing

### Lokales Testen

1. **Dev-Server starten:**
   ```bash
   npm run dev
   ```

2. **HTTPS aktivieren** (Service Worker braucht HTTPS):
   ```bash
   # Option 1: ngrok
   ngrok http 3000
   
   # Option 2: Vite mit self-signed cert
   # vite.config.ts erweitern mit https: true
   ```

3. **In Settings → Push-Benachrichtigungen:**
   - "Aktivieren" klicken
   - Browser-Permission erlauben
   - "Test senden" klicken

### iOS Testing

1. **PWA zum Home-Bildschirm hinzufügen:**
   - Safari öffnen
   - Share-Button → "Zum Home-Bildschirm"

2. **App vom Home-Screen öffnen** (nicht im Browser!)

3. **Notification Permission geben**

4. **Wichtig:** iOS zeigt Notifications nur wenn App im Hintergrund ist!

## Troubleshooting

### "Messaging not initialized"
→ Firebase Config hat keinen `messagingSenderId` oder Service Worker wurde nicht registriert

### "Permission denied"
→ User hat Notifications in Browser-Settings blockiert. Muss dort manuell aktiviert werden.

### iOS: Keine Notifications
→ App muss als PWA installiert sein (Home-Screen) und im Hintergrund laufen

### Cloud Function läuft nicht
→ Firebase Blaze Plan (Pay-as-you-go) erforderlich für Scheduled Functions

## Production Deployment

1. **VAPID Key setzen** ✓
2. **Icons hinzufügen** ✓
3. **Firebase Functions deployen** ✓
4. **Security Rules deployen** ✓
5. **App bauen & deployen:**
   ```bash
   npm run build
   docker build -t moneyboy .
   docker push mfrh/moneyboy:latest
   ```

## Kosten-Übersicht

- **Firebase Cloud Messaging:** Kostenlos
- **Firestore Reads/Writes:** Free Tier: 50k/Tag (ausreichend)
- **Cloud Functions:** 
  - Free Tier: 2M Aufrufe/Monat
  - Scheduled Function 1x täglich = 30 Aufrufe/Monat → **kostenlos**

**Fazit:** Bei normalem Gebrauch (< 100 User) komplett kostenlos!
