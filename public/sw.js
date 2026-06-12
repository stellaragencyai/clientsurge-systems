const CACHE_NAME = "clientsurge-shell-v2";
const CORE_ASSETS = ["/manifest.json", "/pwa-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never intercept cross-origin requests, preview-sandbox, or Base44 editor URLs
  if (url.origin !== self.location.origin) return;
  if (url.hostname.includes("preview-sandbox") || url.hostname.includes("base44")) return;

  // For navigation/HTML requests, fetch from network with a graceful fallback
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/") || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => Response.error())),
  );
});
