import { openDB } from 'idb';

const CACHE_NAME = 'learning-platform-v1';
const API_CACHE_NAME = 'api-cache-v1';

// Files to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/learning/generate-learning-questions',
  '/learning/evaluate-learning-style'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error('Service Worker: Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event - serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/quiz/') || url.pathname.startsWith('/learning/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request);
        })
    );
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(request).then((networkResponse) => {
          // Cache successful GET requests
          if (request.method === 'GET' && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Return offline fallback
        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
      })
  );
});

/**
 * Handle API requests with offline support
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // For quiz generation and content generation, try network first, fallback to offline message
  if (url.pathname.includes('/generate') || url.pathname.includes('/score')) {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Cache successful responses for offline use
        const responseClone = networkResponse.clone();
        caches.open(API_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });
        return networkResponse;
      }
    } catch (error) {
      console.log('Network failed, checking cache for:', request.url);
    }

    // Check cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline error for generation requests
    return new Response(JSON.stringify({
      error: 'Offline Mode',
      message: 'Content generation requires internet connection. Please check your connection and try again.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // For other API calls, try network, then cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseClone = response.clone();
      caches.open(API_CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(JSON.stringify({
      error: 'Offline Mode',
      message: 'This feature requires internet connection.',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);

  if (event.tag === 'sync-quiz-results') {
    event.waitUntil(syncQuizResults());
  }

  if (event.tag === 'sync-progress') {
    event.waitUntil(syncLearningProgress());
  }
});

/**
 * Sync quiz results when back online
 */
async function syncQuizResults() {
  try {
    const db = await openDB('learning-platform', 1);
    const pendingResults = await db.getAll('pending-quiz-results');

    for (const result of pendingResults) {
      try {
        const response = await fetch('/quiz/score-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result.data)
        });

        if (response.ok) {
          await db.delete('pending-quiz-results', result.id);
          console.log('Synced quiz result:', result.id);
        }
      } catch (error) {
        console.error('Failed to sync quiz result:', result.id, error);
      }
    }
  } catch (error) {
    console.error('Quiz sync failed:', error);
  }
}

/**
 * Sync learning progress when back online
 */
async function syncLearningProgress() {
  try {
    const db = await openDB('learning-platform', 1);
    const pendingProgress = await db.getAll('pending-progress');

    for (const progress of pendingProgress) {
      try {
        const response = await fetch('/learning/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(progress.data)
        });

        if (response.ok) {
          await db.delete('pending-progress', progress.id);
          console.log('Synced progress:', progress.id);
        }
      } catch (error) {
        console.error('Failed to sync progress:', progress.id, error);
      }
    }
  } catch (error) {
    console.error('Progress sync failed:', error);
  }
}

/**
 * Handle push notifications (future enhancement)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: data.url
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
