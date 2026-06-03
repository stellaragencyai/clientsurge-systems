const CANONICAL_ORIGIN = "https://clientsurgesystems.com";
const CANONICAL_HOST = "clientsurgesystems.com";
const ALTERNATE_HOST = "www.clientsurgesystems.com";
const BASE44_ORIGIN_HOST = "grinning-apex-flow-growth.base44.app";
export const EDGE_HEALTH_PATH = "/.well-known/clientsurge-edge-health.json";
export const EDGE_HEALTH_HEADER = "x-clientsurge-security-edge";
export const TRUST_SECURITY_SCRIPT_PATH = "/.well-known/clientsurge-trust-security.js";

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
export const TRUST_SECURITY_STYLE_ID = "clientsurge-edge-trust-security";
export const TRUST_SECURITY_SECTION_ID = "clientsurge-trust-security";

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

export const TRUST_SECURITY_STYLE = `<style id="${TRUST_SECURITY_STYLE_ID}">
#${TRUST_SECURITY_SECTION_ID} {
  background: #ffffff;
  color: #050b14;
  padding: clamp(72px, 9vw, 124px) 24px clamp(68px, 8vw, 112px);
  border-top: 1px solid rgba(0, 174, 239, 0.08);
  overflow: hidden;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-inner {
  max-width: 1200px;
  margin: 0 auto;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-header {
  max-width: 860px;
  margin: 0 auto clamp(54px, 7vw, 86px);
  text-align: center;
}
#${TRUST_SECURITY_SECTION_ID} h2 {
  margin: 0;
  color: #050b14;
  font-size: clamp(34px, 5vw, 58px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.06;
}
#${TRUST_SECURITY_SECTION_ID} h2 span {
  color: #00aeef;
  white-space: nowrap;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-header p {
  max-width: 840px;
  margin: 22px auto 0;
  color: rgba(5, 11, 20, 0.72);
  font-size: clamp(18px, 2.2vw, 24px);
  line-height: 1.55;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(20px, 3vw, 34px);
  align-items: start;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-item {
  min-width: 0;
  text-align: center;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-badge {
  width: clamp(100px, 9vw, 132px);
  aspect-ratio: 1;
  margin: 0 auto 28px;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-art {
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 20px 28px rgba(15, 23, 42, 0.12));
}
#${TRUST_SECURITY_SECTION_ID} .cs-art-text,
#${TRUST_SECURITY_SECTION_ID} .cs-art-small,
#${TRUST_SECURITY_SECTION_ID} .cs-seal-arc,
#${TRUST_SECURITY_SECTION_ID} .cs-days,
#${TRUST_SECURITY_SECTION_ID} .cs-money,
#${TRUST_SECURITY_SECTION_ID} .cs-verified-word,
#${TRUST_SECURITY_SECTION_ID} .cs-verified-ring,
#${TRUST_SECURITY_SECTION_ID} .cs-gdpr-ring,
#${TRUST_SECURITY_SECTION_ID} .cs-gdpr-word {
  font-family: Arial, Helvetica, sans-serif;
  font-weight: 900;
  letter-spacing: 0.04em;
}
#${TRUST_SECURITY_SECTION_ID} .cs-art-text { fill: #f8cf5a; font-size: 11px; }
#${TRUST_SECURITY_SECTION_ID} .cs-art-small { fill: #f8cf5a; font-size: 6px; }
#${TRUST_SECURITY_SECTION_ID} .cs-stripe-word {
  fill: #6f8dff;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 44px;
  font-weight: 900;
  letter-spacing: -0.06em;
}
#${TRUST_SECURITY_SECTION_ID} .cs-stripe-payment {
  fill: #4b5563;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 18px;
  font-weight: 700;
}
#${TRUST_SECURITY_SECTION_ID} .cs-seal-arc { fill: #f3cf62; font-size: 6px; }
#${TRUST_SECURITY_SECTION_ID} .cs-thirty {
  fill: #f8d569;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 48px;
  font-weight: 900;
}
#${TRUST_SECURITY_SECTION_ID} .cs-days { fill: #f8d569; font-size: 14px; }
#${TRUST_SECURITY_SECTION_ID} .cs-money { fill: #2b1d08; font-size: 9px; }
#${TRUST_SECURITY_SECTION_ID} .cs-verified-word { fill: #ffffff; font-size: 23px; }
#${TRUST_SECURITY_SECTION_ID} .cs-verified-ring { fill: #15803d; font-size: 8px; letter-spacing: 0.22em; }
#${TRUST_SECURITY_SECTION_ID} .cs-gdpr-ring { fill: #303844; font-size: 7px; }
#${TRUST_SECURITY_SECTION_ID} .cs-gdpr-word { fill: #111827; font-size: 10px; }
#${TRUST_SECURITY_SECTION_ID} h3 {
  margin: 0 auto 18px;
  color: #050b14;
  font-size: clamp(20px, 2.1vw, 28px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.25;
  text-wrap: balance;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-item p {
  max-width: 260px;
  margin: 0 auto;
  color: rgba(5, 11, 20, 0.7);
  font-size: clamp(15px, 1.6vw, 20px);
  line-height: 1.6;
}
@media (max-width: 1024px) {
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: 48px;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item:last-child {
    grid-column: 1 / -1;
  }
}
@media (max-width: 640px) {
  #${TRUST_SECURITY_SECTION_ID} {
    padding-inline: 20px;
  }
  #${TRUST_SECURITY_SECTION_ID} h2 span {
    display: block;
    white-space: normal;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-grid {
    grid-template-columns: 1fr;
    gap: 44px;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item:last-child {
    grid-column: auto;
  }
}
</style>`;

export const TRUST_SECURITY_SCRIPT = `<script>
(() => {
  const sectionId = "${TRUST_SECURITY_SECTION_ID}";
  const ssl = '<svg class="cs-trust-art" viewBox="0 0 160 160" role="img" aria-label="SSL secure shield"><defs><linearGradient id="csSslGold" x1="24" x2="136" y1="20" y2="142" gradientUnits="userSpaceOnUse"><stop stop-color="#fff3a7"/><stop offset="0.27" stop-color="#f7bb35"/><stop offset="0.62" stop-color="#9b6414"/><stop offset="1" stop-color="#ffd76a"/></linearGradient><linearGradient id="csSslDark" x1="40" x2="120" y1="36" y2="122" gradientUnits="userSpaceOnUse"><stop stop-color="#111827"/><stop offset="1" stop-color="#05070c"/></linearGradient></defs><path fill="url(#csSslGold)" d="M80 12c17 14 37 17 57 15v44c0 38-24 61-57 77-33-16-57-39-57-77V27c20 2 40-1 57-15Z"/><path fill="url(#csSslDark)" d="M80 25c14 11 31 13 47 12v34c0 30-18 49-47 64-29-15-47-34-47-64V37c16 1 33-1 47-12Z"/><path fill="#f8cf5a" d="M42 45c14 1 27-2 38-11 11 9 24 12 38 11v8c-14 1-27-2-38-10-11 8-24 11-38 10v-8Z"/><path fill="#f8cf5a" d="M45 104c9 11 21 20 35 28 14-8 26-17 35-28-10 7-21 11-35 16-14-5-25-9-35-16Z" opacity=".9"/><path fill="#f8cf5a" d="M64 72h32a7 7 0 0 1 7 7v27a7 7 0 0 1-7 7H64a7 7 0 0 1-7-7V79a7 7 0 0 1 7-7Zm6 0V61a10 10 0 0 1 20 0v11h-8V61a2 2 0 0 0-4 0v11h-8Z"/><circle cx="80" cy="91" r="5" fill="#0b111e"/><path fill="#0b111e" d="M78 94h4l2 12h-8l2-12Z"/><text x="80" y="53" text-anchor="middle" class="cs-art-text">SECURE</text><text x="80" y="124" text-anchor="middle" class="cs-art-small">SSL ENCRYPTION</text></svg>';
  const stripe = '<svg class="cs-trust-art" viewBox="0 0 170 150" role="img" aria-label="Stripe secure payment"><text x="18" y="46" class="cs-stripe-word">stripe</text><rect x="18" y="58" width="88" height="62" rx="10" fill="#3b3b3b"/><rect x="25" y="68" width="75" height="12" rx="2" fill="#101318"/><circle cx="42" cy="101" r="9" fill="none" stroke="#6b7280" stroke-width="4"/><circle cx="52" cy="101" r="9" fill="none" stroke="#4b5563" stroke-width="4"/><path fill="#f59f33" d="M113 84h29a6 6 0 0 1 6 6v31a6 6 0 0 1-6 6h-29a6 6 0 0 1-6-6V90a6 6 0 0 1 6-6Zm6 0V73a10 10 0 0 1 20 0v11h-7V73a3 3 0 0 0-6 0v11h-7Z"/><circle cx="128" cy="105" r="4" fill="#263241"/><path fill="#263241" d="M126 108h4l2 9h-8l2-9Z"/><text x="78" y="140" text-anchor="middle" class="cs-stripe-payment">Payment</text></svg>';
  const guarantee = '<svg class="cs-trust-art" viewBox="0 0 160 160" role="img" aria-label="30 days money back guarantee"><defs><radialGradient id="csGuaranteeGold" cx="45%" cy="35%" r="62%"><stop stop-color="#fff6ad"/><stop offset="0.43" stop-color="#d59b21"/><stop offset="0.76" stop-color="#875414"/><stop offset="1" stop-color="#f5ce57"/></radialGradient></defs><polygon points="80,11 86,21 94,13 98,25 108,19 109,32 121,29 119,42 132,42 127,54 140,58 132,68 143,74 132,82 142,91 130,96 136,108 123,109 124,122 112,119 109,132 99,126 94,139 86,130 80,149 74,130 66,139 62,126 52,132 51,119 39,122 41,109 28,108 33,96 21,91 28,82 17,74 28,68 20,58 33,54 28,42 41,42 39,29 51,32 52,19 62,25 66,13 74,21" fill="url(#csGuaranteeGold)"/><circle cx="80" cy="80" r="51" fill="#332615" stroke="#f6d76d" stroke-width="4"/><circle cx="80" cy="80" r="42" fill="#503916" stroke="#bd8420" stroke-width="2"/><text x="80" y="40" text-anchor="middle" class="cs-seal-arc">SATISFACTION GUARANTEE</text><text x="80" y="82" text-anchor="middle" class="cs-thirty">30</text><text x="80" y="103" text-anchor="middle" class="cs-days">DAYS</text><rect x="42" y="109" width="76" height="20" rx="2" fill="#f0c04b"/><text x="80" y="123" text-anchor="middle" class="cs-money">MONEY BACK</text></svg>';
  const verified = '<svg class="cs-trust-art" viewBox="0 0 160 160" role="img" aria-label="Verified seal"><polygon points="80,12 87,24 96,15 100,29 112,22 113,37 127,34 123,48 138,50 130,63 143,70 130,80 143,90 130,97 138,110 123,112 127,126 113,123 112,138 100,131 96,145 87,136 80,148 73,136 64,145 60,131 48,138 47,123 33,126 37,112 22,110 30,97 17,90 30,80 17,70 30,63 22,50 37,48 33,34 47,37 48,22 60,29 64,15 73,24" fill="#15964a"/><circle cx="80" cy="80" r="56" fill="#eaffee" stroke="#14904b" stroke-width="6"/><circle cx="80" cy="80" r="45" fill="#ffffff" stroke="#2dae5a" stroke-width="3"/><path fill="#14904b" d="M28 64h104a11 11 0 0 1 11 11v10a11 11 0 0 1-11 11H28a11 11 0 0 1-11-11V75a11 11 0 0 1 11-11Z"/><text x="80" y="88" text-anchor="middle" class="cs-verified-word">VERIFIED</text><text x="80" y="36" text-anchor="middle" class="cs-verified-ring">VERIFIED</text><text x="80" y="128" text-anchor="middle" class="cs-verified-ring">VERIFIED</text></svg>';
  const gdpr = '<svg class="cs-trust-art" viewBox="0 0 160 160" role="img" aria-label="GDPR compliant badge"><defs><radialGradient id="csGdprCenter" cx="48%" cy="42%" r="64%"><stop stop-color="#1f5fff"/><stop offset="1" stop-color="#002b89"/></radialGradient></defs><circle cx="80" cy="80" r="67" fill="#d7dbe2"/><circle cx="80" cy="80" r="55" fill="#ffffff"/><circle cx="80" cy="80" r="43" fill="url(#csGdprCenter)"/><circle cx="80" cy="50" r="2.4" fill="#ffe24f"/><circle cx="95" cy="54" r="2.4" fill="#ffe24f"/><circle cx="106" cy="65" r="2.4" fill="#ffe24f"/><circle cx="110" cy="80" r="2.4" fill="#ffe24f"/><circle cx="106" cy="95" r="2.4" fill="#ffe24f"/><circle cx="95" cy="106" r="2.4" fill="#ffe24f"/><circle cx="80" cy="110" r="2.4" fill="#ffe24f"/><circle cx="65" cy="106" r="2.4" fill="#ffe24f"/><circle cx="54" cy="95" r="2.4" fill="#ffe24f"/><circle cx="50" cy="80" r="2.4" fill="#ffe24f"/><circle cx="54" cy="65" r="2.4" fill="#ffe24f"/><circle cx="65" cy="54" r="2.4" fill="#ffe24f"/><circle cx="80" cy="80" r="18" fill="#ffffff"/><path fill="none" stroke="#0c4ee8" stroke-linecap="round" stroke-linejoin="round" stroke-width="7" d="m68 80 8 8 17-19"/><text x="80" y="23" text-anchor="middle" class="cs-gdpr-ring">General Data Protection Regulation</text><text x="80" y="141" text-anchor="middle" class="cs-gdpr-word">GDPR COMPLIANT</text></svg>';
  const items = [
    [ssl, "SSL Secure", "Your data is protected with bank-level SSL security protocols."],
    [stripe, "Stripe Secure Payment", "We use Stripe, a global leader in online payments, to keep transactions safe and secure."],
    [guarantee, "30-Day Money-Back Guarantee", "Not satisfied? Get a full refund within 30 days, no questions asked. Your investment is safe."],
    [verified, "Verified & Trusted", "Our platform and automation systems are trusted by local service businesses that rely on fast follow-up."],
    [gdpr, "GDPR Compliant", "We follow privacy-first data practices so your customer information is handled with care."]
  ];
  const buildSection = () => {
    const section = document.createElement("section");
    section.id = sectionId;
    section.setAttribute("aria-labelledby", "clientsurge-trust-security-title");
    section.innerHTML = '<div class="cs-trust-inner"><div class="cs-trust-header"><h2 id="clientsurge-trust-security-title">Your Trust & Security <span>Are Our Priority</span></h2><p>We are committed to providing a secure and reliable platform. Your success and safety are the cornerstones of ClientSurge Systems.</p></div><div class="cs-trust-grid">' + items.map(([icon, title, body]) => '<article class="cs-trust-item"><div class="cs-trust-badge">' + icon + '</div><h3>' + title + '</h3><p>' + body + '</p></article>').join("") + '</div></div>';
    return section;
  };
  const insert = () => {
    if (document.getElementById(sectionId)) return true;
    const footer = document.querySelector("footer");
    if (!footer || !footer.parentNode) return false;
    footer.parentNode.insertBefore(buildSection(), footer);
    return true;
  };
  if (insert()) return;
  let attempts = 0;
  const observer = new MutationObserver(() => {
    if (insert()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const interval = window.setInterval(() => {
    attempts += 1;
    if (insert() || attempts > 120) {
      window.clearInterval(interval);
      observer.disconnect();
    }
  }, 500);
  window.setTimeout(() => {
    window.clearInterval(interval);
    observer.disconnect();
  }, 65000);
})();
</script>`;

export const TRUST_SECURITY_CLIENT_JS = TRUST_SECURITY_SCRIPT
  .replace(/^<script>\n?/, "")
  .replace(/\n?<\/script>$/, "");

export const TRUST_SECURITY_SCRIPT_TAG = `<script src="${TRUST_SECURITY_SCRIPT_PATH}" defer></script>`;

export const TRUST_SECURITY_INJECTION = `${TRUST_SECURITY_STYLE}${TRUST_SECURITY_SCRIPT_TAG}`;

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
  let nextHtml = html;

  if (!nextHtml.includes(HOMEPAGE_MOTION_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${HOMEPAGE_MOTION_STYLE}</head>`)
      : `${HOMEPAGE_MOTION_STYLE}${nextHtml}`;

    nextHtml = nextHtml.includes("</body>")
      ? nextHtml.replace("</body>", `${HOMEPAGE_MOTION_SCRIPT}</body>`)
      : `${nextHtml}${HOMEPAGE_MOTION_SCRIPT}`;
  }

  if (!nextHtml.includes(TRUST_SECURITY_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${TRUST_SECURITY_STYLE}</head>`)
      : `${TRUST_SECURITY_STYLE}${nextHtml}`;

    nextHtml = nextHtml.includes("</body>")
      ? nextHtml.replace("</body>", `${TRUST_SECURITY_SCRIPT_TAG}</body>`)
      : `${nextHtml}${TRUST_SECURITY_SCRIPT_TAG}`;
  }

  return nextHtml;
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

function trustSecurityScriptResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "text/javascript; charset=utf-8",
    "Cache-Control": "no-store, max-age=0",
  }), TRUST_SECURITY_SCRIPT_PATH);
  return new Response(TRUST_SECURITY_CLIENT_JS, { status: 200, headers });
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

    if (url.pathname === TRUST_SECURITY_SCRIPT_PATH) {
      return trustSecurityScriptResponse();
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
