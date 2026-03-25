// Firebase Cloud Messaging Service Worker
// Replace with your actual Firebase config to enable push notifications

// importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// firebase.initializeApp({
//   apiKey: 'YOUR_API_KEY',
//   authDomain: 'YOUR_AUTH_DOMAIN',
//   projectId: 'YOUR_PROJECT_ID',
//   storageBucket: 'YOUR_STORAGE_BUCKET',
//   messagingSenderId: 'YOUR_SENDER_ID',
//   appId: 'YOUR_APP_ID',
// });

// const messaging = firebase.messaging();

// messaging.onBackgroundMessage((payload) => {
//   const { title, body } = payload.notification;
//   self.registration.showNotification(title, {
//     body,
//     icon: '/vite.svg',
//     badge: '/vite.svg',
//     data: payload.data,
//   });
// });

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
