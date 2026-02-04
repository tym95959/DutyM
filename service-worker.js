// service-worker.js
const CACHE_NAME = 'leave-management-v2.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/admin.html',
    '/general.html',
    '/styles.css',
    '/users.js',
    '/auth.js',
    '/app.js',
    '/admin-functions.js',
    '/firebase-config.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-192x192.png'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip Chrome extensions
    if (event.request.url.startsWith('chrome-extension://')) return;
    
    // DevTools opening in Firefox
    if (event.request.url.includes('firefox-dev.tools')) return;
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-leaves') {
        event.waitUntil(syncLeaves());
    }
});

async function syncLeaves() {
    // Get pending leaves from IndexedDB
    // Process and sync with server
    console.log('Syncing leaves...');
}

// Push notifications
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New notification from Leave Management System',
        icon: 'icons/icon-192x192.png',
        badge: 'icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: 'icons/check-72x72.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: 'icons/x-72x72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Leave Management System', options)
    );
});

self.addEventListener('notificationclick', event => {
    console.log('Notification click received.', event.notification.tag);
    event.notification.close();

    if (event.action === 'view') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Notification already closed
    } else {
        // Default action - open app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Background periodic sync (requires Chrome 80+)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-data') {
        event.waitUntil(updateData());
    }
});

async function updateData() {
    // Periodic data update logic
    console.log('Periodic data update...');
}

// Message handling
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
