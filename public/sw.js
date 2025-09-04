// Service Worker for Task Tracker App
const CACHE_NAME = 'task-tracker-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/index.css',
  '/assets/index-BumEUlWO.css',
  '/assets/index-KU6JM67P.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip unsupported schemes (chrome-extension, moz-extension, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Skip chrome-extension and other extension schemes
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'safari-extension:' ||
      url.protocol === 'ms-browser-extension:') {
    return;
  }

  // Handle font requests with special caching strategy
  if (url.pathname.includes('@fontsource') || url.pathname.includes('.woff2') || url.pathname.includes('.woff')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(request).then((response) => {
          if (response) {
            return response;
          }
          return fetch(request).then((fetchResponse) => {
            // Only cache successful responses
            if (fetchResponse && fetchResponse.status === 200) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch((error) => {
            console.warn('Failed to fetch font:', request.url, error);
            return fetchResponse;
          });
        });
      })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((fetchResponse) => {
        // Cache successful responses
        if (fetchResponse && fetchResponse.status === 200) {
          const responseClone = fetchResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return fetchResponse;
      }).catch((error) => {
        console.warn('Failed to fetch resource:', request.url, error);
        return fetchResponse;
      });
    })
  );
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Perform background sync operations
    console.log('Performing background sync');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
