const CACHE_NAME = 'xchange-v1.0.0';
const STATIC_CACHE_URLS = [
    '/xchange/',
    '/xchange/index.html',
    '/xchange/manifest.json',
    '/xchange/android-chrome-192x192.png',
    '/xchange/android-chrome-512x512.png',
    '/xchange/apple-touch-icon.png',
    '/xchange/favicon-32x32.png',
    '/xchange/favicon-16x16.png',
    '/xchange/xchange.png',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-icons/3.0.1/iconfont/material-icons.min.css'
];

// Install Event - Cache static resources
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching App Shell');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker: Installed');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Cache failed', error);
            })
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch Event - Serve cached content when offline
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Handle API requests with network-first strategy
    if (event.request.url.includes('/xchange/') && 
        (event.request.url.includes('/upload') || 
         event.request.url.includes('/files') || 
         event.request.url.includes('/download') ||
         event.request.url.includes('/status'))) {
        
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // If request is successful, cache the response
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseClone);
                            });
                    }
                    return response;
                })
                .catch(() => {
                    // If network fails, try to serve from cache
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // If not in cache, return offline page or error response
                            if (event.request.url.includes('/status')) {
                                return new Response(
                                    JSON.stringify({ status: 'offline', message: 'Service Worker: Offline mode' }),
                                    { 
                                        headers: { 'Content-Type': 'application/json' },
                                        status: 503
                                    }
                                );
                            }
                            return new Response('Offline - No cached version available', { status: 503 });
                        });
                })
        );
        return;
    }

    // Handle static resources with cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Return fallback for HTML requests
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/xchange/index.html');
                        }
                        return new Response('Offline', { status: 503 });
                    });
            })
    );
});

// Background Sync - for uploading files when back online
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'upload-sync') {
        event.waitUntil(
            // Here you could implement background sync for uploads
            // This would require storing pending uploads in IndexedDB
            Promise.resolve()
        );
    }
});

// Push notifications (optional for future features)
self.addEventListener('push', event => {
    console.log('Service Worker: Push received', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from xchange',
        icon: '/xchange/android-chrome-192x192.png',
        badge: '/xchange/favicon-32x32.png',
        vibrate: [200, 100, 200],
        tag: 'xchange-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('xchange', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('Service Worker: Notification clicked', event);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/xchange/')
    );
});