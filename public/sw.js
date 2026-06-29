// Emergency recovery service worker.
// This intentionally avoids caching app shell HTML or JS so the custom domain cannot get trapped on a stale Base44/static fallback deploy.

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', () => {
  // Let the network handle every request. Do not intercept navigation, app shell, JS, CSS, images, or functions.
})
