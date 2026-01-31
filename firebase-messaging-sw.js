// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
  authDomain: "leelidc-1f753.firebaseapp.com",
  projectId: "leelidc-1f753",
  storageBucket: "leelidc-1f753.firebasestorage.app",
  messagingSenderId: "43622932335",
  appId: "1:43622932335:web:a7529bce1f19714687129a",
  measurementId: "G-3KD6ZYS599",
  databaseURL: "https://leelidc-1f753-default-rtdb.firebaseio.com/"
});

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'Pushup Reminder';
    const notificationOptions = {
        body: payload.notification?.body || 'Time for pushups! 💪',
        icon: '/icon.png',
        badge: '/badge.png',
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true})
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});
