// Service Worker for handling background notifications
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a",
    measurementId: "G-3KD6ZYS599"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png',
        data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification);
    
    event.notification.close();
    
    // Handle click action
    const urlToOpen = event.notification.data.click_action || 'http://localhost';
    
    event.waitUntil(
        clients.matchAll({type: 'window'}).then((windowClients) => {
            // Check if there's already a window/tab open
            for (let client of windowClients) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new tab
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
