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
  
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;

  // Ignore Next.js internal requests, API routes, and RSC requests
  if (
    url.pathname.startsWith('/_next/') || 
    url.pathname.startsWith('/api/') ||
    event.request.headers.get('RSC') === '1'
  ) {
    return; // Let the browser handle it natively
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Mensageiro do Reino', body: 'Uma nova quest espera por você!' };
  const options = {
    body: data.body,
    icon: '/https://picsum.photos/seed/liberdade-icon-192/192/192',
    badge: '/https://picsum.photos/seed/liberdade-icon-192/192/192',
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
