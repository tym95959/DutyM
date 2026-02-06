// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Default Firebase config (will be updated from main thread)
const defaultFirebaseConfig = {
    apiKey: "AIzaSyAf_sjwVHG65vKhezpS_L7KC2j0WHIDaWc",
    authDomain: "leelidc-1f753.firebaseapp.com",
    projectId: "leelidc-1f753",
    storageBucket: "leelidc-1f753.firebasestorage.app",
    messagingSenderId: "43622932335",
    appId: "1:43622932335:web:a7529bce1f19714687129a"
};

let messaging = null;
let currentConfig = null;

async function initializeFirebase(config) {
    try {
        if (firebase.apps.length > 0) {
            await firebase.app().delete();
        }
        const app = firebase.initializeApp(config);
        messaging = firebase.messaging(app);
        currentConfig = config;
        setupMessageHandlers();
        return true;
    } catch (error) {
        console.error('[Service Worker] Firebase initialization error:', error);
        return false;
    }
}

function setupMessageHandlers() {
    if (!messaging) return;
    
    messaging.onBackgroundMessage((payload) => {
        console.log('[Service Worker] Received background message:', payload);
        
        const notificationTitle = payload.notification?.title || 'Duty Manager Notification';
        const notificationBody = payload.notification?.body || 'You have a new notification';
        
        let icon = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M50,55 C65,55 70,70 70,70 L30,70 C30,70 35,55 50,55 Z\' fill=\'white\'/%3E%3Cpath d=\'M35,75 L65,75 L65,85 C65,90 60,95 50,95 C40,95 35,90 35,85 Z\' fill=\'white\'/%3E%3Cpath d=\'M20,20 L20,40 L30,30 Z\' fill=\'%2327ae60\'/%3E%3C/svg%3E';
        let badge = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3C/svg%3E';
        let actions = [];
        
        switch(payload.data?.type) {
            case 'duty_change_request':
                icon = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%23f39c12\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'30\' font-family=\'Arial\'%3E🔄%3C/text%3E%3C/svg%3E';
                actions = [
                    { action: 'accept', title: 'Accept' },
                    { action: 'reject', title: 'Reject' },
                    { action: 'view', title: 'View' }
                ];
                break;
            case 'leave_request':
                icon = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%2327ae60\'/%3E%3Ctext x=\'50\' y=\'55\' text-anchor=\'middle\' fill=\'white\' font-size=\'30\' font-family=\'Arial\'%3E📅%3C/text%3E%3C/svg%3E';
                actions = [
                    { action: 'approve', title: 'Approve' },
                    { action: 'reject', title: 'Reject' },
                    { action: 'view', title: 'View' }
                ];
                break;
            case 'announcement':
                const priority = payload.data?.priority;
                let bgColor = '#3498db';
                if (priority === 'high') bgColor = '#e74c3c';
                if (priority === 'medium') bgColor = '#f39c12';
                icon = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='${bgColor}'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='white' font-size='30' font-family='Arial'%3E📢%3C/text%3E%3C/svg%3E`;
                actions = [
                    { action: 'read', title: 'Read' },
                    { action: 'dismiss', title: 'Dismiss' }
                ];
                break;
            default:
                actions = [
                    { action: 'open', title: 'Open App' },
                    { action: 'dismiss', title: 'Dismiss' }
                ];
        }
        
        const notificationOptions = {
            body: notificationBody,
            icon: icon,
            badge: badge,
            data: payload.data || {},
            actions: actions,
            tag: payload.data?.type || 'general',
            renotify: true
        };
        
        if (payload.data?.priority === 'high') {
            notificationOptions.requireInteraction = true;
        }
        
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event.notification.data);
    event.notification.close();
    
    const data = event.notification.data || {};
    const action = event.action || 'open';
    
    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true})
        .then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('/') && 'focus' in client) {
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        data: data
                    });
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

self.addEventListener('message', (event) => {
    console.log('[Service Worker] Received message:', event.data.type);
    switch(event.data.type) {
        case 'UPDATE_FIREBASE_CONFIG':
            console.log('[Service Worker] Updating Firebase config');
            initializeFirebase(event.data.config);
            break;
        case 'TEST_NOTIFICATION':
            self.registration.showNotification('Test Notification', {
                body: 'This is a test notification from Service Worker',
                icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M50,55 C65,55 70,70 70,70 L30,70 C30,70 35,55 50,55 Z\' fill=\'white\'/%3E%3Cpath d=\'M35,75 L65,75 L65,85 C65,90 60,95 50,95 C40,95 35,90 35,85 Z\' fill=\'white\'/%3E%3Cpath d=\'M20,20 L20,40 L30,30 Z\' fill=\'%2327ae60\'/%3E%3C/svg%3E',
                data: { type: 'test' }
            });
            break;
    }
});

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(clients.claim());
});
