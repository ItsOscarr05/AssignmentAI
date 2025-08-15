const CACHE_NAME = 'assignment-ai-cache-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json', '/favicon.ico', '/assets/logo.svg'];

// Get API URL from environment or use production default
const API_URL =
  self.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://api.assignmentai.app';

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  // Skip API requests for caching
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncSubmissions());
  }
});



// Helper function to sync submissions
async function syncSubmissions() {
  const db = await openDB();
  const submissions = await db.getAll('submissions');

  for (const submission of submissions) {
    try {
      const response = await fetch(`${API_URL}/api/v1/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      if (response.ok) {
        await db.delete('submissions', submission.id);
      }
    } catch (error) {
      console.error('Failed to sync submission:', error);
    }
  }
}

// IndexedDB setup
const DB_NAME = 'assignmentai-db';
const DB_VERSION = 1;

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;

      // Create submissions store
      if (!db.objectStoreNames.contains('submissions')) {
        const store = db.createObjectStore('submissions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}
