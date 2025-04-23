const CACHE_NAME = 'weather-app-v1';
const urlsToCache = [
    '/weather',
    '/weather/index.html',
    '/weather/static/js/main.js',
    '/weather/static/css/main.css',
    '/weather/manifest.json',
    '/weather/favicon.ico',
    '/weather/logo192.png',
    '/weather/logo512.png',
    'https://openweathermap.org/img/wn/01d@2x.png',
    'https://openweathermap.org/img/wn/01n@2x.png',
    'https://openweathermap.org/img/wn/02d@2x.png',
    'https://openweathermap.org/img/wn/02n@2x.png',
    'https://openweathermap.org/img/wn/03d@2x.png',
    'https://openweathermap.org/img/wn/03n@2x.png',
    'https://openweathermap.org/img/wn/04d@2x.png',
    'https://openweathermap.org/img/wn/04n@2x.png',
    'https://openweathermap.org/img/wn/09d@2x.png',
    'https://openweathermap.org/img/wn/09n@2x.png',
    'https://openweathermap.org/img/wn/10d@2x.png',
    'https://openweathermap.org/img/wn/10n@2x.png',
    'https://openweathermap.org/img/wn/11d@2x.png',
    'https://openweathermap.org/img/wn/11n@2x.png',
    'https://openweathermap.org/img/wn/13d@2x.png',
    'https://openweathermap.org/img/wn/13n@2x.png',
    'https://openweathermap.org/img/wn/50d@2x.png',
    'https://openweathermap.org/img/wn/50n@2x.png'
];

// Installation: Cache wichtige Ressourcen
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

// Fetch-Handling: Strategien für verschiedene Anfragen
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Für API-Anfragen: Network-First-Strategie
    if (requestUrl.origin === 'https://api.openweathermap.org') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Response klonen und cachen
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    return response;
                })
                .catch(() => {
                    // Bei Netzwerkfehler aus dem Cache laden
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache-First für alle anderen Anfragen
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }

                    // Wenn nicht im Cache, dann vom Netzwerk holen
                    return fetch(event.request)
                        .then(response => {
                            // Cache nur gültige Responses
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            // Response klonen und cachen
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                            return response;
                        });
                })
        );
    }
});