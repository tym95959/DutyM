// firebase-messaging-sw.js - SIMPLE WORKING VERSION
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Your Firebase config - MUST be complete
const firebaseConfig = {
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",  // REQUIRED
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a",
    measurementId: "G-3KD6ZYS599"
};

console.log('[SW] Initializing Firebase with config:', firebaseConfig);

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
        console.log('[SW] Firebase initialized');
    } else {
        console.log('[SW] Using existing Firebase app');
    }
} catch (error) {
    console.error('[SW] Firebase init error:', error);
}

// Get messaging instance
const messaging = firebase.messaging();

// Background message handler - USE setBackgroundMessageHandler (not onBackgroundMessage)
messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[SW] Received background message:', payload);
    
    // Extract notification data
    const notificationTitle = payload.data?.title || 'Duty Manager';
    const notificationBody = payload.data?.body || 'New notification';
    
    // Notification options
    const notificationOptions = {
        body: notificationBody,
        icon: '/icon-192x192.png',  // Use absolute path
        badge: '/icon-192x192.png',
        data: payload.data || {},
        tag: 'duty-manager-notification',
        requireInteraction: false,
        vibrate: [200, 100, 200]
    };
    
    console.log('[SW] Showing notification:', notificationTitle);
    
    // Show notification
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
    console.log('[SW] Notification clicked:', event.notification);
    
    event.notification.close();
    
    // Focus or open the app
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
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Service Worker Lifecycle
self.addEventListener('install', function(event) {
    console.log('[SW] Installing...');
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', function(event) {
    console.log('[SW] Activating...');
    event.waitUntil(clients.claim()); // Take control immediately
});
