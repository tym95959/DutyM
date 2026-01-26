// Service Worker for Duty Manager PWA
const CACHE_NAME = 'duty-manager-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dcfire.js',
  '/user.js',
  '/manifest.json',
  // Add other static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
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
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
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

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Push event received:', event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Duty Manager', body: event.data.text() };
    }
  }
  
  const options = {
    body: data.body || 'New notification from Duty Manager',
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    tag: data.tag || 'duty-manager-notification',
    renotify: true,
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Duty Manager',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windowClients => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If not, then open the target URL in a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

// Sync pending requests when back online
function syncPendingRequests() {
  // This would sync any pending requests that were made offline
  // For now, just log
  console.log('Syncing pending requests...');
  return Promise.resolve();
}

// Periodic sync for updates (requires periodic-background-sync permission)
self.addEventListener('periodicsync', event => {
  console.log('Periodic sync:', event.tag);
  
  if (event.tag === 'update-content') {
    event.waitUntil(updateContent());
  }
});

function updateContent() {
  console.log('Updating content in background...');
  // Update cached content
  return caches.open(CACHE_NAME)
    .then(cache => {
      return cache.addAll(urlsToCache);
    })
    .catch(error => {
      console.error('Background update failed:', error);
    });
}
