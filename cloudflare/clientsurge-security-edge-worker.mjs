const CANONICAL_ORIGIN = "https://clientsurgesystems.com";
const CANONICAL_HOST = "clientsurgesystems.com";
const ALTERNATE_HOST = "www.clientsurgesystems.com";
const BASE44_ORIGIN_HOST = "grinning-apex-flow-growth.base44.app";
export const EDGE_HEALTH_PATH = "/.well-known/clientsurge-edge-health.json";
export const EDGE_HEALTH_HEADER = "x-clientsurge-security-edge";

export const SECURITY_TXT = `Contact: mailto:system@clientsurgesystems.com
Preferred-Languages: en
Canonical: https://clientsurgesystems.com/.well-known/security.txt
Policy: https://clientsurgesystems.com/privacy-policy
Expires: 2027-06-01T00:00:00Z
`;

export const SERVICE_WORKER_JS = `const CACHE_NAME = "clientsurge-shell-v2";
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
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});
`;

export const GLOBAL_SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: wss:",
    "frame-src https://calendly.com https://assets.calendly.com https://base44.app https://*.base44.app https://base44.com https://*.base44.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors https://base44.app https://*.base44.app https://base44.com https://*.base44.com 'self'",
  ].join("; "),
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), usb=(), bluetooth=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export const SENSITIVE_HEADERS = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "no-store",
};

export function isSensitivePath(pathname) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/onboarding" ||
    pathname === "/motion-lab" ||
    pathname === "/client-portal" ||
    pathname === "/setup/preview" ||
    pathname.startsWith("/setup/preview/")
  );
}

export function applySecurityHeaders(headers, pathname) {
  for (const [name, value] of Object.entries(GLOBAL_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  if (isSensitivePath(pathname)) {
    for (const [name, value] of Object.entries(SENSITIVE_HEADERS)) {
      headers.set(name, value);
    }
  }

  return headers;
}

function canonicalRedirect(url) {
  const target = new URL(url.toString());
  target.protocol = "https:";
  target.hostname = CANONICAL_HOST;
  return Response.redirect(target.toString(), 301);
}

function securityTxtResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  }), "/.well-known/security.txt");
  return new Response(SECURITY_TXT, { status: 200, headers });
}

function edgeHealthResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    [EDGE_HEALTH_HEADER]: "active",
  }), EDGE_HEALTH_PATH);
  return new Response(JSON.stringify({
    ok: true,
    edge: "clientsurge-security-edge",
    canonical: CANONICAL_ORIGIN,
  }), { status: 200, headers });
}

function serviceWorkerResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "text/javascript; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
    "Service-Worker-Allowed": "/",
  }), "/sw.js");
  return new Response(SERVICE_WORKER_JS, { status: 200, headers });
}

export function originRequestFor(request, url = new URL(request.url)) {
  const originUrl = new URL(url.toString());
  originUrl.protocol = "https:";
  originUrl.hostname = BASE44_ORIGIN_HOST;
  return new Request(originUrl.toString(), request);
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.protocol === "http:" || url.hostname === ALTERNATE_HOST) {
      return canonicalRedirect(url);
    }

    if (url.pathname === "/.well-known/security.txt") {
      return securityTxtResponse();
    }

    if (url.pathname === EDGE_HEALTH_PATH) {
      return edgeHealthResponse();
    }

    if (url.pathname === "/sw.js") {
      return serviceWorkerResponse();
    }

    const originResponse = await fetch(originRequestFor(request, url));
    const headers = applySecurityHeaders(new Headers(originResponse.headers), url.pathname);

    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers,
    });
  },
};
