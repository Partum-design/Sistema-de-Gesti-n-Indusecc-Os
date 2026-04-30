/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'sog-v3'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`

const sameOrigin = (url) => {
  try {
    return new URL(url).origin === self.location.origin
  } catch {
    return false
  }
}

const isAsset = (request) => {
  const url = new URL(request.url)
  return (
    sameOrigin(request.url) &&
    (url.pathname.startsWith('/assets/') ||
      /\.(?:js|css|png|jpg|jpeg|webp|svg|gif|ico|json|woff2?)$/i.test(url.pathname))
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    self.skipWaiting()
    const scopeUrl = new URL(self.registration.scope)
    const precachePaths = [
      '',
      'index.html',
      'manifest.webmanifest',
      'Logotipo-07.png',
      'logo pwa.png',
      'pwa-192x192.png',
      'pwa-512x512.png',
    ]
    const precacheUrls = precachePaths.map((p) => new URL(p, scopeUrl).toString())
    const cache = await caches.open(STATIC_CACHE)
    await cache.addAll(precacheUrls)
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => {
      if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) return caches.delete(key)
      return undefined
    }))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request)
        const cache = await caches.open(STATIC_CACHE)
        cache.put(new URL('index.html', self.registration.scope).toString(), fresh.clone())
        return fresh
      } catch {
        const cache = await caches.open(STATIC_CACHE)
        const cached = await cache.match(new URL('index.html', self.registration.scope).toString())
        return cached || Response.error()
      }
    })())
    return
  }

  if (!sameOrigin(request.url) || !isAsset(request)) return

  event.respondWith((async () => {
    const cache = await caches.open(RUNTIME_CACHE)
    const cached = await cache.match(request)
    if (cached) return cached
    const fresh = await fetch(request)
    cache.put(request, fresh.clone())
    return fresh
  })())
})

self.addEventListener('push', (event) => {
  const defaultPayload = {
    title: 'INDUSECC OS',
    body: 'Tienes una nueva notificacion.',
    icon: '/Logotipo-07.png',
    badge: '/Logotipo-07.png',
    url: '/',
  };

  let payload = defaultPayload;
  try {
    payload = event.data ? { ...defaultPayload, ...event.data.json() } : defaultPayload;
  } catch {
    payload = defaultPayload;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
