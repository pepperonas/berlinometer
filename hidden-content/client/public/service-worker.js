// Service Worker für die Secret Content PWA
const CACHE_NAME = 'secret-content-cache-v1';
const urlsToCache = [
    '/secret-content/',
    '/secret-content/index.html',
    '/secret-content/static/css/main.css',
    '/secret-content/static/js/main.js',
    '/secret-content/favicon.ico',
    '/secret-content/logo192.png',
    '/secret-content/logo512.png',
    '/secret-content/manifest.json'
];

// Installation des Service Workers
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache geöffnet');
                return cache.addAll(urlsToCache);
            })
    );
});

// Aktivierung des Service Workers und Bereinigung alter Caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch-Handler für Netzwerkanfragen
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache-Hit - Rückgabe der Antwort aus dem Cache
                if (response) {
                    return response;
                }

                // Sonstiges: Anfrage an das Netzwerk senden
                return fetch(event.request)
                    .then(response => {
                        // Wichtig: Antwort klonen (da sie nur einmal verwendet werden kann)
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Wenn die Netzwerkanfrage fehlschlägt und es sich um eine GET-Anfrage handelt,
                        // versuchen wir, eine offline-Fallback-Seite zu liefern
                        if (event.request.method === 'GET') {
                            return caches.match('/secret-content/index.html');
                        }
                    });
            })
    );
});