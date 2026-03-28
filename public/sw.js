const CACHE_NAME = 'liberdade-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        'https://picsum.photos/seed/liberdade-icon-192/192/192',
        'https://picsum.photos/seed/liberdade-icon-512/512/512'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle GET requests for static assets and the root page
  if (event.request.method !== 'GET') return;

  // Ignore Next.js internal requests, API routes, and RSC requests
  if (
    url.pathname.startsWith('/_next/') || 
    url.pathname.startsWith('/api/') ||
    event.request.headers.get('RSC') === '1'
  ) {
    return;
  }

  // For other requests, try cache then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response;

      return fetch(event.request).then((networkResponse) => {
        // Only cache valid responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Don't cache if it's not a file we want to cache (e.g. don't cache HTML pages other than root)
        const contentType = networkResponse.headers.get('content-type');
        if (contentType && contentType.includes('text/html') && url.pathname !== '/') {
          return networkResponse;
        }

        return networkResponse;
      }).catch(() => {
        // If fetch fails and it's a navigation request, return the cached root
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        return null;
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Mensageiro do Reino', body: 'Uma nova quest espera por você!' };
  const options = {
    body: data.body,
    icon: 'https://picsum.photos/seed/liberdade-icon-192/192/192',
    badge: 'https://picsum.photos/seed/liberdade-icon-192/192/192',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
