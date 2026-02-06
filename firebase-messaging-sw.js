importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);
    
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png',
        badge: '/icon.png',
        vibrate: [200, 100, 200],
        data: payload.data || {},
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification);
    event.notification.close();
    
    if (event.action === 'open') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
    // Handle other actions...
});
