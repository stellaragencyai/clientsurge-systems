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

export const HOMEPAGE_MOTION_HEADER = "x-clientsurge-homepage-motion";
export const HOMEPAGE_MOTION_STYLE_ID = "clientsurge-edge-cinematic-motion";

export const HOMEPAGE_MOTION_STYLE = `<style id="${HOMEPAGE_MOTION_STYLE_ID}">
@keyframes csEdgeAmbientSweep {
  0%, 100% { transform: translate3d(-18%, 8%, 0) rotate(-8deg); opacity: 0.14; }
  45% { transform: translate3d(18%, -10%, 0) rotate(8deg); opacity: 0.32; }
}
@keyframes csEdgeHeadlineSheen {
  0% { background-position: 0% 50%; }
  55% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes csEdgeHeadlineBeam {
  0%, 100% { transform: translateX(-18%) scaleX(0.72); opacity: 0.16; }
  48% { transform: translateX(18%) scaleX(1); opacity: 0.44; }
}
@keyframes csEdgeChecklistCascade {
  from { opacity: 0; transform: translate3d(-18px, 16px, 0); filter: blur(8px); }
  to { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
}
@keyframes csEdgeCtaEnergy {
  0% { transform: translateX(-140%) skewX(-18deg); opacity: 0; }
  35% { opacity: 0.65; }
  75% { transform: translateX(140%) skewX(-18deg); opacity: 0; }
  100% { transform: translateX(140%) skewX(-18deg); opacity: 0; }
}
@keyframes csEdgeDashboardFloat {
  0%, 100% { transform: translate3d(0, 0, 0) rotateX(0deg); }
  48% { transform: translate3d(0, -10px, 0) rotateX(1.5deg); }
}
@keyframes csEdgeDashboardScan {
  0% { transform: translateY(-120%); opacity: 0; }
  25% { opacity: 0.55; }
  72% { opacity: 0.28; }
  100% { transform: translateY(180%); opacity: 0; }
}
.landing-hero {
  position: relative;
  overflow: hidden;
}
.landing-hero::before {
  content: "";
  position: absolute;
  inset: -24%;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 18% 22%, rgba(34, 211, 238, 0.22), transparent 34%),
    linear-gradient(110deg, transparent 18%, rgba(255, 255, 255, 0.24) 42%, transparent 63%);
  mix-blend-mode: screen;
  animation: csEdgeAmbientSweep 11s cubic-bezier(.22,.8,.24,1) infinite;
}
.landing-hero > * {
  position: relative;
  z-index: 1;
}
.landing-hero__headline {
  position: relative;
  background: linear-gradient(110deg, currentColor 0%, currentColor 30%, #22d3ee 48%, #f8fafc 56%, currentColor 72%, currentColor 100%);
  background-size: 240% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: csEdgeHeadlineSheen 6.5s cubic-bezier(.22,.8,.24,1) infinite;
}
.landing-hero__headline::after {
  content: "";
  position: absolute;
  left: 6%;
  right: 10%;
  bottom: -0.18em;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.72), rgba(255, 255, 255, 0.72), transparent);
  animation: csEdgeHeadlineBeam 5.4s cubic-bezier(.22,.8,.24,1) infinite;
}
.hero-check-item {
  opacity: 0;
  animation: csEdgeChecklistCascade 760ms cubic-bezier(.22,.8,.24,1) forwards;
}
.hero-check-item:nth-child(1) { animation-delay: 120ms; }
.hero-check-item:nth-child(2) { animation-delay: 250ms; }
.hero-check-item:nth-child(3) { animation-delay: 380ms; }
.landing-hero__actions a:first-child,
.landing-hero__actions button:first-child {
  position: relative;
  overflow: hidden;
  transform: translateZ(0);
}
.landing-hero__actions a:first-child::before,
.landing-hero__actions button:first-child::before {
  content: "";
  position: absolute;
  top: -30%;
  bottom: -30%;
  left: 0;
  width: 42%;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.55), transparent);
  animation: csEdgeCtaEnergy 3.8s cubic-bezier(.22,.8,.24,1) infinite;
}
.hero-dashboard-static-preview {
  position: relative;
  overflow: hidden;
  animation: csEdgeDashboardFloat 7.5s cubic-bezier(.22,.8,.24,1) infinite;
  transform-origin: center;
}
.hero-dashboard-static-preview::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, transparent 0%, rgba(34, 211, 238, 0.2) 46%, rgba(255,255,255,0.22) 50%, transparent 55%);
  animation: csEdgeDashboardScan 4.8s cubic-bezier(.22,.8,.24,1) infinite;
}
@media (prefers-reduced-motion: reduce) {
  .landing-hero::before,
  .landing-hero__headline,
  .landing-hero__headline::after,
  .hero-check-item,
  .landing-hero__actions a:first-child::before,
  .landing-hero__actions button:first-child::before,
  .hero-dashboard-static-preview,
  .hero-dashboard-static-preview::before {
    animation: none !important;
    opacity: 1;
    transform: none !important;
  }
}
@media (max-width: 640px) {
  html,
  body,
  #root {
    max-width: 100%;
    overflow-x: hidden;
  }
  .landing-hero {
    box-sizing: border-box;
    max-width: 100vw;
    overflow: hidden !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  .landing-hero__inner {
    box-sizing: border-box;
    display: flex !important;
    flex-direction: column !important;
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 28px !important;
    width: min(390px, 100vw) !important;
    max-width: min(390px, 100vw) !important;
    min-height: auto !important;
    margin-left: 0 !important;
    margin-right: auto !important;
    padding: 5rem 20px 3rem !important;
  }
  .landing-hero__copy {
    grid-column: auto !important;
    width: 100% !important;
    max-width: 100% !important;
    text-align: center !important;
  }
  .landing-hero__headline {
    width: 100%;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
    font-size: clamp(1.9rem, 8vw, 2.15rem) !important;
    line-height: 1.09 !important;
    overflow-wrap: break-word;
  }
  .landing-hero__headline span {
    display: block !important;
  }
  .landing-hero__body {
    width: 100%;
    max-width: 350px !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .landing-hero__checklist,
  .hero-checklist {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) !important;
    max-width: 100% !important;
    width: 100%;
  }
  .hero-check-item {
    min-width: 0;
    width: 100%;
  }
  .landing-hero__actions {
    display: flex !important;
    flex-direction: column;
    align-items: stretch !important;
    width: 100%;
  }
  .landing-hero__actions a,
  .landing-hero__actions button {
    width: 100%;
    justify-content: center;
  }
  .landing-hero__visualWrap {
    grid-column: auto !important;
    width: 100% !important;
    min-height: auto !important;
  }
  .hero-dashboard-static-preview {
    max-width: 100% !important;
  }
}
</style>`;

export const HOMEPAGE_MOTION_SCRIPT = `<script>
(() => {
  const hooks = [
    ["ambient-sweep", ".landing-hero"],
    ["headline-sheen", ".landing-hero__headline"],
    ["checklist-cascade", ".landing-hero__checklist, .hero-checklist"],
    ["cta-energy", ".landing-hero__actions"],
    ["dashboard-float-scan", ".hero-dashboard-static-preview"]
  ];
  const applyHooks = () => {
    let found = 0;
    for (const [name, selector] of hooks) {
      const node = document.querySelector(selector);
      if (node) {
        node.setAttribute("data-cinematic-animation", name);
        found += 1;
      }
    }
    document.documentElement.setAttribute("data-clientsurge-edge-cinematic-count", String(found));
    return found === hooks.length;
  };
  if (applyHooks()) return;
  let attempts = 0;
  const observer = new MutationObserver(() => {
    attempts += 1;
    if (applyHooks() || attempts > 80) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(() => observer.disconnect(), 8000);
})();
</script>`;

export const HOMEPAGE_MOTION_INJECTION = `${HOMEPAGE_MOTION_STYLE}${HOMEPAGE_MOTION_SCRIPT}`;

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

export function shouldInjectHomepageMotion(request, url, response) {
  if (request.method !== "GET") return false;
  if (url.pathname !== "/") return false;
  return (response.headers.get("content-type") || "").includes("text/html");
}

export function injectHomepageMotion(html) {
  if (html.includes(HOMEPAGE_MOTION_STYLE_ID)) return html;

  const withStyle = html.includes("</head>")
    ? html.replace("</head>", `${HOMEPAGE_MOTION_STYLE}</head>`)
    : `${HOMEPAGE_MOTION_STYLE}${html}`;

  return withStyle.includes("</body>")
    ? withStyle.replace("</body>", `${HOMEPAGE_MOTION_SCRIPT}</body>`)
    : `${withStyle}${HOMEPAGE_MOTION_SCRIPT}`;
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

    if (shouldInjectHomepageMotion(request, url, originResponse)) {
      headers.set(HOMEPAGE_MOTION_HEADER, "edge-v1");
      headers.set("Cache-Control", "no-store, max-age=0");

      return new Response(injectHomepageMotion(await originResponse.text()), {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers,
      });
    }

    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers,
    });
  },
};
