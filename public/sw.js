/**
 * Êxodo — Service Worker
 * Preparado para notificações push e cache offline.
 */

const CACHE_NAME = 'exodo-v2';
const PRECACHE_URLS = ['./', './manifest.json', './logo-192.png', './logo-512.png'];

// Install: pré-cache dos recursos principais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network-first com fallback para cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push: exibe notificação quando o servidor enviar
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? 'Êxodo';
  const iconUrl = new URL('./logo-192.png', self.registration.scope).toString();
  const options = {
    body: data.body ?? 'Nova mensagem do Êxodo.',
    icon: iconUrl,
    badge: iconUrl,
    data: { url: data.url ?? './' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click: abre a URL associada
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const target = event.notification.data?.url ?? './';
      for (const client of clientList) {
        if (client.url === target && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
