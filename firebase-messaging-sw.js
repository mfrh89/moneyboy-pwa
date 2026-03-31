/* eslint-disable no-undef */

// Workbox precaching — manifest injected by vite-plugin-pwa at build time
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
workbox.precaching.cleanupOutdatedCaches();
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Skip waiting immediately — new SW becomes active without delay
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Claim all open clients immediately so controllerchange fires → App.tsx triggers reload
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// This will be dynamically set by the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    const firebaseConfig = event.data.config;
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Get messaging instance
    const messaging = firebase.messaging();
    
    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      
      const notificationTitle = payload.notification?.title || 'Moneyboy';
      const notificationOptions = {
        body: payload.notification?.body || 'Du hast eine neue Benachrichtigung',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.data?.subscriptionId || 'subscription-reminder',
        data: payload.data,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };
      
      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // Open the app or focus existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
