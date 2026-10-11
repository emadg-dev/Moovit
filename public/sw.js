/**
 * Service Worker for «تکون بده» (Takoon Bede) PWA
 * Version: 1.0.0
 */

const CACHE_NAME = 'takoon-bede-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/mascot-idle.svg',
  '/mascot-stretch.svg',
  '/mascot-walking.svg',
  '/mascot-sleepy.svg',
  '/mascot-celebrate.svg',
  '/mascot-resting.svg'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial error (ignored for non-critical assets):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: stale-while-revalidate for assets, network-first with offline app shell fallback for navigation
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET, browser extensions, or API endpoints
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    return;
  }

  // Navigation requests (HTML pages & SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          // Return cached page, fallback to index.html (SPA shell), then offline.html
          const cachedResponse = await cache.match(request);
          if (cachedResponse) return cachedResponse;

          const shell = (await cache.match('/index.html')) || (await cache.match('/'));
          if (shell) return shell;

          const offlinePage = await cache.match('/offline.html');
          return offlinePage || new Response('آفلاین هستید', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // Static assets (images, fonts, scripts, styles)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            (networkResponse.status === 200 || networkResponse.type === 'opaque')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and not in cache, fallback to whatever we matched
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Web Push event: background push notifications received from server
self.addEventListener('push', (event) => {
  let data = {
    title: 'تکون بده! 💜',
    body: 'پاشو یه کوچولو راه بریم! وقت استراحت و کشوقوس رسیده ✨',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'takoon-bede-reminder',
    data: {
      url: '/'
    }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'takoon-bede-reminder',
    vibrate: [150, 80, 150],
    data: data.data || { url: '/' },
    actions: [
      { action: 'done', title: 'انجام دادم! 🌟' },
      { action: 'snooze', title: '۱۰ دقیقه بعد ⏳' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if an app window is already open and focus it
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if (event.action === 'done') {
            client.postMessage({ type: 'BREAK_COMPLETED_FROM_NOTIFICATION' });
          } else if (event.action === 'snooze') {
            client.postMessage({ type: 'SNOOZE_FROM_NOTIFICATION' });
          }
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Listen for skip waiting messages from the frontend
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
