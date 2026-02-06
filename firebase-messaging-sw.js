// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase with your config
const firebaseConfig = {
    // Your Firebase config will be injected here by app.js
};

// Initialize only if config is available
if (firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    
    const messaging = firebase.messaging();

    // Background message handler
    messaging.onBackgroundMessage((payload) => {
        console.log('[firebase-messaging-sw.js] Received background message:', payload);
        
        const notificationTitle = payload.notification?.title || 'Duty Manager Notification';
        const notificationOptions = {
            body: payload.notification?.body || 'New notification',
            icon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M50,55 C65,55 70,70 70,70 L30,70 C30,70 35,55 50,55 Z\' fill=\'white\'/%3E%3Cpath d=\'M35,75 L65,75 L65,85 C65,90 60,95 50,95 C40,95 35,90 35,85 Z\' fill=\'white\'/%3E%3Cpath d=\'M20,20 L20,40 L30,30 Z\' fill=\'%2327ae60\'/%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'%233498db\'/%3E%3Ccircle cx=\'50\' cy=\'35\' r=\'12\' fill=\'white\'/%3E%3Cpath d=\'M50,55 C65,55 70,70 70,70 L30,70 C30,70 35,55 50,55 Z\' fill=\'white\'/%3E%3Cpath d=\'M35,75 L65,75 L65,85 C65,90 60,95 50,95 C40,95 35,90 35,85 Z\' fill=\'white\'/%3E%3Cpath d=\'M20,20 L20,40 L30,30 Z\' fill=\'%2327ae60\'/%3E%3C/svg%3E',
            data: payload.data || {},
            actions: [
                {
                    action: 'open',
                    title: 'Open App'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        self.registration.showNotification(notificationTitle, notificationOptions);
    });

    // Handle notification click
    self.addEventListener('notificationclick', (event) => {
        console.log('Notification clicked:', event.notification);
        event.notification.close();
        
        if (event.action === 'open' || event.action === '') {
            // Open the app
            event.waitUntil(
                clients.matchAll({type: 'window', includeUncontrolled: true})
                .then((clientList) => {
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
        }
        // Handle dismiss action
    });
}
