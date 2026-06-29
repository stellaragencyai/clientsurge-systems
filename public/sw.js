const CACHE_NAME = "clientsurge-shell-v2";
const CORE_ASSETS = ["/manifest.json", "/pwa-icon.svg"];

// Detect if we are running inside the Base44 visual editor sandbox.
// In that environment we must not intercept ANY requests.
function isEditorSandbox() {
  try {
    return (
      self.location.hostname.includes("preview-sandbox") ||
      self.location.hostname.includes("base44")
    );
  } catch {
    return false;
  }
}

self.addEventListener("install", (event) => {
  if (isEditorSandbox()) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  if (isEditorSandbox()) {
    event.waitUntil(self.clients.claim());
    return;
  }
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Never intercept anything in the editor sandbox
  if (isEditorSandbox()) return;

  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never intercept cross-origin, preview-sandbox, or base44 URLs
  if (url.origin !== self.location.origin) return;
  if (url.hostname.includes("preview-sandbox") || url.hostname.includes("base44")) return;

  // For navigation/HTML, always go to network with a safe fallback
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
