// Service Worker for UniSync App
// Manages background caching and beautiful Sinhala push notifications

const CACHE_NAME = 'unisync-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html'
];

// Install Event: Cache essential files and force waiting worker to become active
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Instantly activate the new service worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event: Clean up old caches and take control of all pages
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Serve cached assets when offline
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

// Message Event: Listen for notification data from the main index.html file
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        // Display the conversational Sinhala notification received from the app
        const promiseChain = self.registration.showNotification(
            event.data.title, 
            event.data.options
        );
        event.waitUntil(promiseChain);
    }
});

// Notification Click Event: What happens when the user taps the notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification

    // Check if the app is already open and focus it, otherwise open a new window
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                // If app is already open, just focus on it
                if (client.url.includes('/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If app is closed, open it
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
