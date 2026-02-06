// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');
// Default Firebase config (will be updated from main thread)
const defaultFirebaseConfig = {
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Background message handler - THIS IS CRITICAL!
messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[Service Worker] Received background message:', payload);
    
    // Customize notification here
    const notificationTitle = payload.data.title || 'Duty Manager';
    const notificationOptions = {
        body: payload.data.body || 'You have a new notification',
        icon: '/icon-192x192.png', // Use absolute path
        badge: '/icon-192x192.png',
        data: payload.data,
        tag: payload.data.type || 'general',
        requireInteraction: payload.data.priority === 'high',
        vibrate: [200, 100, 200]
    };
    
    // Add actions based on notification type
    if (payload.data.type === 'duty_change_request') {
        notificationOptions.actions = [
            { action: 'accept', title: 'Accept' },
            { action: 'reject', title: 'Reject' }
        ];
    }
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked:', event.notification.data);
    
    event.notification.close();
    
    const data = event.notification.data || {};
    const action = event.action || 'open';
    
    // Open the app
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            // Check if app is already open
            for (const client of clientList) {
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not open, open new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Listen for messages from main thread
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'UPDATE_FIREBASE_CONFIG') {
        console.log('Updating Firebase config in service worker');
        // Reinitialize with new config
        const app = firebase.app();
        if (app) {
            app.delete().then(() => {
                firebase.initializeApp(event.data.config);
                console.log('Firebase reinitialized in service worker');
            });
        }
    }
});

// Service Worker Installation
self.addEventListener('install', function(event) {
    console.log('Service Worker installing...');
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(clients.claim()); // Take control immediately
});
