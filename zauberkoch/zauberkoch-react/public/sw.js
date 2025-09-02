// ZauberKoch Service Worker
// Progressive Web App functionality

const CACHE_NAME = 'zauberkoch-v1';
const STATIC_CACHE_NAME = 'zauberkoch-static-v1';
const DYNAMIC_CACHE_NAME = 'zauberkoch-dynamic-v1';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Core app shell files would go here
];

// Routes that should work offline
const OFFLINE_ROUTES = [
  '/recipes',
  '/recipes/generate',
  '/profile',
  '/premium',
];

// API routes to cache
const CACHEABLE_APIS = [
  '/api/recipes/user',
  '/api/recipes/saved',
  '/api/user/profile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Pre-cache offline page
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.add('/offline');
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Force activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const deletePromises = cacheNames
        .filter((cacheName) => {
          return cacheName !== STATIC_CACHE_NAME && 
                 cacheName !== DYNAMIC_CACHE_NAME;
        })
        .map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      return Promise.all(deletePromises);
    }).then(() => {
      console.log('[SW] Activation complete');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle different types of requests with different strategies
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else if (isNavigationRequest(request)) {
    // Page navigation - network first with offline fallback
    event.respondWith(handleNavigationRequest(request));
  } else {
    // Other resources - network first
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses for offline use
      if (CACHEABLE_APIS.some(api => url.pathname.startsWith(api))) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed for API, trying cache:', url.pathname);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response for API calls
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Diese Funktion ist offline nicht verfügbar' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch static asset:', request.url);
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle page navigation with network-first strategy
async function handleNavigationRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache page for offline use
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('[SW] Network failed for navigation, trying cache');
    
    // Try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to offline page
    const offlinePage = await cache.match('/offline');
    return offlinePage || new Response('Offline', { status: 503 });
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('[SW] Request failed:', request.url);
    return new Response('Request failed', { status: 503 });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'recipe-save') {
    event.waitUntil(syncRecipeSaves());
  } else if (event.tag === 'recipe-rate') {
    event.waitUntil(syncRecipeRatings());
  }
});

// Sync offline recipe saves
async function syncRecipeSaves() {
  try {
    const db = await openIndexedDB();
    const pendingSaves = await getAllPendingSaves(db);
    
    for (const save of pendingSaves) {
      try {
        const response = await fetch('/api/recipes/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(save.data)
        });
        
        if (response.ok) {
          await deletePendingSave(db, save.id);
          console.log('[SW] Synced recipe save:', save.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync recipe save:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync offline recipe ratings
async function syncRecipeRatings() {
  try {
    const db = await openIndexedDB();
    const pendingRatings = await getAllPendingRatings(db);
    
    for (const rating of pendingRatings) {
      try {
        const response = await fetch('/api/recipes/rate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rating.data)
        });
        
        if (response.ok) {
          await deletePendingRating(db, rating.id);
          console.log('[SW] Synced recipe rating:', rating.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync recipe rating:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  if (!event.data) {
    return;
  }
  
  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'Neue Nachricht von ZauberKoch',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: data.tag || 'zauberkoch-notification',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Öffnen',
          icon: '/icons/icon-72x72.png'
        },
        {
          action: 'dismiss',
          title: 'Schließen'
        }
      ],
      requireInteraction: false,
      silent: false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'ZauberKoch', options)
    );
  } catch (error) {
    console.error('[SW] Failed to show notification:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Default action or 'open' action
  const targetUrl = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      
      // Open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Helper functions
function isStaticAsset(pathname) {
  return pathname.startsWith('/icons/') ||
         pathname.startsWith('/images/') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js');
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// IndexedDB helpers for offline sync
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('zauberkoch-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingSaves')) {
        db.createObjectStore('pendingSaves', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingRatings')) {
        db.createObjectStore('pendingRatings', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingSaves(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSaves'], 'readonly');
    const store = transaction.objectStore('pendingSaves');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllPendingRatings(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRatings'], 'readonly');
    const store = transaction.objectStore('pendingRatings');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingSave(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingSaves'], 'readwrite');
    const store = transaction.objectStore('pendingSaves');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deletePendingRating(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingRatings'], 'readwrite');
    const store = transaction.objectStore('pendingRatings');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}