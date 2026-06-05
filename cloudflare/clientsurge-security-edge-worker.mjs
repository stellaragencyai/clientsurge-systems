import { TRUST_SECURITY_WEBP_BASE64 } from "./trust-security-assets.mjs";
import { buildRobotsTxt, buildSitemapXml } from "../src/lib/siteDocuments.js";
import {
  NOINDEX_ROUTE_PREFIXES,
  PUBLIC_ROUTE_METADATA,
  STATIC_ROUTE_ALIASES,
} from "../src/lib/publicRouteMetadata.js";

const CANONICAL_ORIGIN = "https://clientsurgesystems.com";
const CANONICAL_HOST = "clientsurgesystems.com";
const ALTERNATE_HOST = "www.clientsurgesystems.com";
const BASE44_ORIGIN_HOST = "grinning-apex-flow-growth.base44.app";
export const EDGE_HEALTH_PATH = "/.well-known/clientsurge-edge-health.json";
export const EDGE_HEALTH_HEADER = "x-clientsurge-security-edge";
export const TRUST_SECURITY_SCRIPT_PATH = "/.well-known/clientsurge-trust-security.js";
export const EDGE_ROUTE_METADATA_HEADER = "x-clientsurge-route-metadata";
export const PRIVATE_ROUTE_BLOCK_HEADER = "x-clientsurge-private-route-block";
export const ANONYMOUS_USER_ME_HEADER = "x-clientsurge-anonymous-user-me";
export const DEMO_BOOKING_MODAL_PATCH_HEADER = "x-clientsurge-demo-modal-patch";
export const DEMO_BOOKING_MODAL_PATCH_SCRIPT_ID = "clientsurge-stale-demo-modal-patch";
export const PUBLIC_NAV_POLISH_HEADER = "x-clientsurge-public-nav-polish";
export const PUBLIC_NAV_POLISH_STYLE_ID = "clientsurge-public-nav-polish-style";
export const PUBLIC_NAV_POLISH_SCRIPT_ID = "clientsurge-public-nav-polish-script";

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
export const STATIC_FALLBACK_PAINT_GUARD_HEADER = "x-clientsurge-static-fallback-guard";
export const STATIC_FALLBACK_PAINT_GUARD_STYLE_ID = "clientsurge-static-fallback-paint-guard";
export const STATIC_FALLBACK_PAINT_GUARD_SCRIPT_ID = "clientsurge-static-fallback-guard-script";
export const HEADER_TRANSPARENCY_STYLE_ID = "clientsurge-edge-header-transparency";
export const HOMEPAGE_MOTION_STYLE_ID = "clientsurge-edge-cinematic-motion";
export const HOMEPAGE_ORDER_STYLE_ID = "clientsurge-edge-homepage-order";
export const HOMEPAGE_PHONE_ALIGNMENT_STYLE_ID = "clientsurge-edge-phone-alignment";
export const HOMEPAGE_INDUSTRY_DROPDOWN_STYLE_ID = "clientsurge-edge-industry-dropdown";
export const HOMEPAGE_INDUSTRY_GALLERY_STYLE_ID = "clientsurge-edge-industry-gallery";
export const TRUST_SECURITY_STYLE_ID = "clientsurge-edge-trust-security";
export const TRUST_SECURITY_SECTION_ID = "clientsurge-trust-security";

export const STATIC_FALLBACK_PAINT_GUARD_STYLE = `<style id="${STATIC_FALLBACK_PAINT_GUARD_STYLE_ID}">
html.js:not(.app-fallback-visible) #root > .static-fallback {
  display: none !important;
}
</style>`;

export const STATIC_FALLBACK_PAINT_GUARD_SCRIPT = `<script id="${STATIC_FALLBACK_PAINT_GUARD_SCRIPT_ID}">
(() => {
  document.documentElement.classList.add("js");
  window.setTimeout(() => {
    if (document.querySelector("#root > .static-fallback")) {
      document.documentElement.classList.add("app-fallback-visible");
    }
  }, 6000);
})();
</script>`;

export const HEADER_TRANSPARENCY_STYLE = `<style id="${HEADER_TRANSPARENCY_STYLE_ID}">
nav[aria-label="Main navigation"] {
  background: rgba(255, 255, 255, 0.06) !important;
  -webkit-backdrop-filter: blur(3px) saturate(1.05) !important;
  backdrop-filter: blur(3px) saturate(1.05) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16) !important;
  box-shadow: none !important;
}
nav[aria-label="Main navigation"]:has([aria-expanded="true"]) {
  background: rgba(255, 255, 255, 0.12) !important;
}
nav[aria-label="Main navigation"] [role="menu"][aria-label="Industries"] {
  background: rgba(255, 255, 255, 0.10) !important;
  -webkit-backdrop-filter: blur(3px) saturate(1.05) !important;
  backdrop-filter: blur(3px) saturate(1.05) !important;
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.24) !important;
}
nav[aria-label="Main navigation"] button[aria-label="Open navigation menu"],
nav[aria-label="Main navigation"] button[aria-label="Close navigation menu"] {
  background: rgba(255, 255, 255, 0.14) !important;
  -webkit-backdrop-filter: blur(3px) saturate(1.05) !important;
  backdrop-filter: blur(3px) saturate(1.05) !important;
  box-shadow: none !important;
  border-color: rgba(255, 255, 255, 0.24) !important;
}
nav[aria-label="Main navigation"] > div.xl\\:hidden {
  background: rgba(255, 255, 255, 0.10) !important;
  -webkit-backdrop-filter: blur(3px) saturate(1.05) !important;
  backdrop-filter: blur(3px) saturate(1.05) !important;
  border-color: rgba(255, 255, 255, 0.18) !important;
}
</style>`;

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

export const HOMEPAGE_ORDER_STYLE = `<style id="${HOMEPAGE_ORDER_STYLE_ID}">
.landing-hero {
  min-height: 76svh !important;
  padding-bottom: clamp(2.25rem, 4vw, 3.5rem) !important;
}
.landing-hero__actions,
.hero-checklist,
.landing-hero__trustRow {
  display: none !important;
}
</style>`;

export const HOMEPAGE_MOTION_SCRIPT = `<script>
(() => {
  const hooks = [
    ["ambient-sweep", ".landing-hero"],
    ["headline-sheen", ".landing-hero__headline"],
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

export const HOMEPAGE_ORDER_SCRIPT = `<script>
(() => {
  const mark = (status) => {
    document.documentElement.setAttribute("data-clientsurge-homepage-order", status);
  };

  const removeHeroExtras = (hero) => {
    for (const selector of [".landing-hero__actions", ".hero-checklist", ".landing-hero__trustRow"]) {
      hero.querySelectorAll(selector).forEach((node) => node.remove());
    }
  };

  const moveTrustBeforeFooter = () => {
    const footer = document.querySelector("footer");
    const trust = document.querySelector(".security-priority, #${TRUST_SECURITY_SECTION_ID}");
    if (footer && trust && footer.parentNode && trust.nextElementSibling !== footer) {
      footer.parentNode.insertBefore(trust, footer);
    }
  };

  const applyOrder = () => {
    const hero = document.querySelector(".landing-hero");
    const industries = document.querySelector("#industries");
    if (!hero || !industries || !hero.parentNode || hero.parentNode !== industries.parentNode) {
      moveTrustBeforeFooter();
      mark("waiting");
      return false;
    }

    removeHeroExtras(hero);

    let removed = 0;
    let node = hero.nextElementSibling;
    while (node && node !== industries) {
      const next = node.nextElementSibling;
      node.remove();
      removed += 1;
      node = next;
    }

    moveTrustBeforeFooter();
    mark("applied:" + removed);
    return hero.nextElementSibling === industries;
  };

  if (applyOrder()) return;

  let attempts = 0;
  const observer = new MutationObserver(() => {
    attempts += 1;
    if (applyOrder() || attempts > 160) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const interval = window.setInterval(() => {
    attempts += 1;
    if (applyOrder() || attempts > 160) {
      window.clearInterval(interval);
      observer.disconnect();
    }
  }, 250);

  window.setTimeout(() => {
    window.clearInterval(interval);
    observer.disconnect();
    applyOrder();
  }, 45000);
})();
</script>`;

export const HOMEPAGE_PHONE_ALIGNMENT_STYLE = `<style id="${HOMEPAGE_PHONE_ALIGNMENT_STYLE_ID}">
#services .clientsurge-edge-phone-centered-row {
  display: block !important;
}
#services .clientsurge-edge-phone-centered-row > .core-offer-phone {
  width: 100% !important;
  max-width: 320px !important;
  margin: clamp(2rem, 4vw, 2.75rem) auto 0 !important;
  position: relative !important;
  left: auto !important;
  right: auto !important;
  justify-content: center !important;
}
#services .clientsurge-edge-phone-centered-row > .clientsurge-edge-timeline-row {
  max-width: 64rem !important;
  margin: clamp(2.25rem, 4vw, 3rem) auto 0 !important;
  min-width: 0 !important;
}
</style>`;

export const HOMEPAGE_PHONE_ALIGNMENT_SCRIPT = `<script>
(() => {
  const mark = (status) => {
    document.documentElement.setAttribute("data-clientsurge-phone-alignment", status);
  };

  const applyPhoneAlignment = () => {
    const services = document.querySelector("#services");
    const phone = services?.querySelector(".core-offer-phone");
    const row = phone?.parentElement;
    if (!services || !phone || !row) {
      mark("waiting");
      return false;
    }

    const timeline = Array.from(row.children).find((child) => child !== phone);
    row.classList.add("clientsurge-edge-phone-centered-row");
    phone.classList.remove("lg:sticky", "lg:top-24", "self-start", "lg:w-auto");
    phone.classList.add("w-full", "max-w-[320px]", "items-center");
    if (row.firstElementChild !== phone) {
      row.insertBefore(phone, row.firstElementChild);
    }

    if (timeline) {
      timeline.classList.add("clientsurge-edge-timeline-row");
    }

    const rect = phone.getBoundingClientRect();
    const delta = Math.round(rect.left + rect.width / 2 - window.innerWidth / 2);
    mark("applied:" + delta);
    return Math.abs(delta) <= 12;
  };

  if (applyPhoneAlignment()) return;

  let attempts = 0;
  const observer = new MutationObserver(() => {
    attempts += 1;
    if (applyPhoneAlignment() || attempts > 180) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const interval = window.setInterval(() => {
    attempts += 1;
    if (applyPhoneAlignment() || attempts > 180) {
      window.clearInterval(interval);
      observer.disconnect();
    }
  }, 250);

  window.setTimeout(() => {
    window.clearInterval(interval);
    observer.disconnect();
    applyPhoneAlignment();
  }, 45000);
})();
</script>`;

export const HOMEPAGE_INDUSTRY_DROPDOWN_STYLE = `<style id="${HOMEPAGE_INDUSTRY_DROPDOWN_STYLE_ID}">
@media (min-width: 1280px) {
  nav [data-clientsurge-edge-industries-menu] {
    width: min(560px, calc(100vw - 32px)) !important;
    max-width: min(560px, calc(100vw - 32px)) !important;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    z-index: 200 !important;
  }
  nav [data-clientsurge-edge-industries-menu] > div {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 8px !important;
  }
  nav [data-clientsurge-edge-industries-menu] .grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }
  nav [data-clientsurge-edge-industries-menu] button {
    box-sizing: border-box !important;
    display: flex !important;
    align-items: center !important;
    width: 100% !important;
    min-width: 0 !important;
    min-height: 44px !important;
    white-space: nowrap !important;
    overflow: visible !important;
  }
}
</style>`;

export const HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT = `<script>
(() => {
  const labels = [
    "Med Spas & Aesthetic Clinics",
    "Dental & Orthodontics",
    "Chiropractic & Physical Therapy",
    "HVAC, Plumbing & Home Services",
    "Roofing & Restoration",
    "Contractors & Trades"
  ];

  const mark = (status) => {
    document.documentElement.setAttribute("data-clientsurge-industry-dropdown", status);
  };

  const findMenu = () => {
    const buttons = Array.from(document.querySelectorAll("nav button"));
    const firstIndustryButton = buttons.find((button) => labels.includes(button.textContent.trim()));
    if (!firstIndustryButton) return null;
    return firstIndustryButton.closest("[style*='z-index: 200'], .absolute");
  };

  const applyDropdownFix = () => {
    const menu = findMenu();
    if (!menu) {
      mark("waiting");
      return false;
    }

    menu.setAttribute("data-clientsurge-edge-industries-menu", "true");
    const card = menu.firstElementChild;
    if (card) {
      card.style.width = "100%";
      card.style.maxWidth = "100%";
    }

    const itemProblems = Array.from(menu.querySelectorAll("button")).filter((button) => {
      const text = button.textContent.trim();
      if (!labels.includes(text)) return false;
      return button.scrollWidth > button.clientWidth + 1 || button.scrollHeight > button.clientHeight + 2;
    });

    mark(itemProblems.length ? "applied:needs-layout" : "applied");
    return itemProblems.length === 0;
  };

  if (applyDropdownFix()) return;

  let attempts = 0;
  const observer = new MutationObserver(() => {
    attempts += 1;
    if (applyDropdownFix() || attempts > 180) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const interval = window.setInterval(() => {
    attempts += 1;
    if (applyDropdownFix() || attempts > 180) {
      window.clearInterval(interval);
      observer.disconnect();
    }
  }, 250);

  window.setTimeout(() => {
    window.clearInterval(interval);
    observer.disconnect();
    applyDropdownFix();
  }, 45000);
})();
</script>`;

export const HOMEPAGE_INDUSTRY_GALLERY_STYLE = `<style id="${HOMEPAGE_INDUSTRY_GALLERY_STYLE_ID}">
#industries > div[class*="grid-cols-1"][class*="z-10"] {
  width: 100% !important;
  max-width: none !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}
#industries button[aria-label] {
  min-height: 50svh !important;
  height: auto !important;
}
#industries button[aria-label] img {
  filter: saturate(1) contrast(1.03) brightness(0.98) !important;
}
#industries button[aria-label] > div.absolute.inset-0:not(.border-2) {
  background: linear-gradient(to bottom, rgba(3, 7, 18, 0.01) 0%, rgba(3, 7, 18, 0.06) 50%, rgba(3, 7, 18, 0.54) 100%) !important;
}
#industries button[aria-label] > div.absolute.inset-0.border-2 {
  box-shadow: none !important;
}
#industries button[aria-label] > div.absolute.bottom-0 p:first-of-type {
  color: #ffffff !important;
  text-shadow: 0 1px 12px rgba(0, 0, 0, 0.76) !important;
}
@media (max-width: 767px) {
  #industries > div[class*="grid-cols-1"][class*="z-10"] {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  #industries button[aria-label] {
    min-height: 100svh !important;
  }
}
@media (min-width: 768px) {
  #industries > div[class*="grid-cols-1"][class*="z-10"] {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}
@media (min-width: 1024px) {
  #industries > div[class*="grid-cols-1"][class*="z-10"] {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
}
</style>`;

export const HOMEPAGE_INDUSTRY_GALLERY_SCRIPT = `<script>
(() => {
  const labels = [
    "Med Spas & Aesthetic Clinics",
    "Dental & Orthodontics",
    "Chiropractic & Physical Therapy",
    "HVAC, Plumbing & Home Services",
    "Roofing & Restoration",
    "Contractors & Trades"
  ];

  const mark = (status) => {
    document.documentElement.setAttribute("data-clientsurge-industry-gallery", status);
  };

  const setImportant = (node, property, value) => {
    if (node?.style?.setProperty) node.style.setProperty(property, value, "important");
  };

  const applyGalleryFix = () => {
    const section = document.querySelector("#industries");
    if (!section) {
      mark("waiting");
      return false;
    }

    const buttons = Array.from(section.querySelectorAll("button[aria-label]")).filter((button) =>
      labels.includes(button.getAttribute("aria-label") || "")
    );

    if (buttons.length < 6) {
      mark("waiting:" + buttons.length);
      return false;
    }

    const grid = buttons[0].parentElement;
    if (grid) {
      grid.setAttribute("data-clientsurge-edge-industry-gallery", "true");
      setImportant(grid, "width", "100%");
      setImportant(grid, "max-width", "none");
      setImportant(grid, "margin-left", "0");
      setImportant(grid, "margin-right", "0");
    }

    for (const button of buttons) {
      button.setAttribute("data-clientsurge-industry-tile", "true");
      setImportant(button, "height", "auto");
      setImportant(button, "min-height", window.matchMedia("(max-width: 767px)").matches ? "100svh" : "50svh");

      const image = button.querySelector("img");
      setImportant(image, "filter", "saturate(1) contrast(1.03) brightness(0.98)");

      const overlay = Array.from(button.children).find((child) =>
        child.tagName === "DIV" &&
        child.classList.contains("absolute") &&
        child.classList.contains("inset-0") &&
        !child.classList.contains("border-2")
      );
      setImportant(overlay, "background", "linear-gradient(to bottom, rgba(3, 7, 18, 0.01) 0%, rgba(3, 7, 18, 0.06) 50%, rgba(3, 7, 18, 0.54) 100%)");

      const frame = Array.from(button.children).find((child) =>
        child.tagName === "DIV" && child.classList.contains("border-2")
      );
      setImportant(frame, "box-shadow", "none");

      const title = Array.from(button.querySelectorAll("p")).find((node) =>
        labels.includes(node.textContent.trim())
      );
      setImportant(title, "color", "#ffffff");
      setImportant(title, "text-shadow", "0 1px 12px rgba(0, 0, 0, 0.76)");
    }

    mark("applied:" + buttons.length);
    return true;
  };

  if (applyGalleryFix()) return;

  let attempts = 0;
  const observer = new MutationObserver(() => {
    attempts += 1;
    if (applyGalleryFix() || attempts > 180) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const interval = window.setInterval(() => {
    attempts += 1;
    if (applyGalleryFix() || attempts > 180) {
      window.clearInterval(interval);
      observer.disconnect();
    }
  }, 250);

  window.setTimeout(() => {
    window.clearInterval(interval);
    observer.disconnect();
    applyGalleryFix();
  }, 45000);
})();
</script>`;

export const HOMEPAGE_MOTION_INJECTION = `${HOMEPAGE_MOTION_STYLE}${HOMEPAGE_ORDER_STYLE}${HOMEPAGE_PHONE_ALIGNMENT_STYLE}${HOMEPAGE_INDUSTRY_DROPDOWN_STYLE}${HOMEPAGE_INDUSTRY_GALLERY_STYLE}${HOMEPAGE_MOTION_SCRIPT}${HOMEPAGE_ORDER_SCRIPT}${HOMEPAGE_PHONE_ALIGNMENT_SCRIPT}${HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT}${HOMEPAGE_INDUSTRY_GALLERY_SCRIPT}`;

export const TRUST_SECURITY_STYLE = `<style id="${TRUST_SECURITY_STYLE_ID}">
#${TRUST_SECURITY_SECTION_ID} {
  background:
    radial-gradient(circle at 50% 16%, rgba(0, 174, 239, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: #050b14;
  padding: clamp(72px, 9vw, 124px) 24px clamp(68px, 8vw, 112px);
  border-top: 1px solid rgba(0, 174, 239, 0.08);
  overflow: hidden;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-inner {
  max-width: 1220px;
  margin: 0 auto;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-header {
  max-width: 860px;
  margin: 0 auto clamp(46px, 6vw, 74px);
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
  gap: clamp(18px, 2.2vw, 26px);
  align-items: stretch;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-item {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: clamp(18px, 2.2vw, 26px) 14px 0;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-badge {
  width: clamp(124px, 11vw, 156px);
  aspect-ratio: 1;
  margin: 0 auto clamp(22px, 2.4vw, 30px);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-badge img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 14px 20px rgba(15, 23, 42, 0.12));
}
#${TRUST_SECURITY_SECTION_ID} h3 {
  width: min(100%, 230px);
  min-height: 3.1em;
  margin: 0 auto 14px;
  color: #050b14;
  font-size: clamp(18px, 1.75vw, 24px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.28;
  text-wrap: balance;
}
#${TRUST_SECURITY_SECTION_ID} .cs-trust-item p {
  max-width: 245px;
  margin: 0 auto;
  color: rgba(5, 11, 20, 0.7);
  font-size: clamp(14px, 1.25vw, 16px);
  line-height: 1.55;
}
@media (max-width: 1120px) {
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
    row-gap: 44px;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item {
    grid-column: span 2;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item:nth-child(4) {
    grid-column: 2 / span 2;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item:nth-child(5) {
    grid-column: 4 / span 2;
  }
}
@media (max-width: 760px) {
  #${TRUST_SECURITY_SECTION_ID} {
    padding-inline: 20px;
  }
  #${TRUST_SECURITY_SECTION_ID} h2 span {
    display: block;
    white-space: normal;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-grid {
    grid-template-columns: 1fr;
    gap: 42px;
  }
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item,
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item:nth-child(4),
  #${TRUST_SECURITY_SECTION_ID} .cs-trust-item:nth-child(5) {
    grid-column: auto;
  }
  #${TRUST_SECURITY_SECTION_ID} h3 {
    min-height: 0;
  }
}
</style>`;

export const TRUST_SECURITY_SCRIPT = `<script>
(() => {
  const sectionId = "${TRUST_SECURITY_SECTION_ID}";
  const items = [
    ["/trust-security/satisfaction-guarantee.webp", "30-Day Money-Back Guarantee", "Not satisfied? Get a full refund within 30 days, no questions asked. Your investment is safe.", "30-day money-back satisfaction guarantee seal"],
    ["/trust-security/secure-ssl-encryption.webp", "SSL Secure", "Your data is protected with bank-level SSL security protocols.", "Secure SSL encryption shield"],
    ["/trust-security/stripe-secure-payment.webp", "Stripe Secure Payment", "We use Stripe, a global leader in online payments, to keep transactions safe and secure.", "Stripe secure payment badge"],
    ["/trust-security/verified-seal.webp", "Verified & Trusted", "Our platform and automation systems are trusted by local service businesses that rely on fast follow-up.", "Verified trust seal"],
    ["/trust-security/gdpr-compliant.webp", "GDPR Compliant", "We follow privacy-first data practices so your customer information is handled with care.", "GDPR compliant data protection seal"]
  ];
  const buildSection = () => {
    const section = document.createElement("section");
    section.id = sectionId;
    section.setAttribute("aria-labelledby", "clientsurge-trust-security-title");
    section.innerHTML = '<div class="cs-trust-inner"><div class="cs-trust-header"><h2 id="clientsurge-trust-security-title">Your Trust & Security <span>Are Our Priority</span></h2><p>We are committed to providing a secure and reliable platform. Your success and safety are the cornerstones of ClientSurge Systems.</p></div><div class="cs-trust-grid">' + items.map(([image, title, body, alt]) => '<article class="cs-trust-item"><div class="cs-trust-badge"><img src="' + image + '" alt="' + alt + '" width="512" height="512" loading="lazy" decoding="async"></div><h3>' + title + '</h3><p>' + body + '</p></article>').join("") + '</div></div>';
    return section;
  };
  const insert = () => {
    if (document.getElementById(sectionId)) return true;
    if (document.querySelector(".security-priority")) return true;
    const footer = document.querySelector("footer");
    if (!footer || !footer.parentNode) return false;
    footer.parentNode.insertBefore(buildSection(), footer);
    return true;
  };
  let attempts = 0;
  insert();
  const observer = new MutationObserver(() => {
    insert();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const interval = window.setInterval(() => {
    attempts += 1;
    insert();
    if (attempts > 120) {
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

export const TRUST_SECURITY_SCRIPT_TAG = `<script src="${TRUST_SECURITY_SCRIPT_PATH}"></script>`;

export const TRUST_SECURITY_INJECTION = `${TRUST_SECURITY_STYLE}${TRUST_SECURITY_SCRIPT_TAG}`;
export const EDGE_ROUTE_HEAD_HEADER = "x-clientsurge-edge-route-head";

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

const PRIVATE_ROUTE_PATTERNS = [
  /^\/admin(?:\/|$)/,
  /^\/admindashboard(?:\/|$)/,
  /^\/adminleads(?:\/|$)/,
  /^\/admininstallguide(?:\/|$)/,
  /^\/adminsettings(?:\/|$)/,
  /^\/adminleaddetail(?:\/|$)/,
  /^\/aistatusdashboard(?:\/|$)/,
  /^\/dashboard(?:\/|$)/,
  /^\/client-portal(?:\/|$)/,
  /^\/clientportal(?:\/|$)/,
  /^\/client-dashboard(?:\/|$)/,
  /^\/clientdashboard(?:\/|$)/,
  /^\/onboarding(?:\/|$)/,
  /^\/setup(?:\/|$)/,
  /^\/businesssetup(?:\/|$)/,
  /^\/credentialssetup(?:\/|$)/,
  /^\/setupstatus(?:\/|$)/,
  /^\/websitepreview(?:\/|$)/,
  /^\/websitespecpreview(?:\/|$)/,
  /^\/motion-lab(?:\/|$)/,
  /^\/motionlab(?:\/|$)/,
  /^\/performancewars(?:\/|$)/,
];

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0];
  const normalized = value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  return normalized || "/";
}

function normalizePathnameLower(pathname = "/") {
  return normalizePathname(pathname).toLowerCase();
}

export function isPrivateRoutePath(pathname) {
  const normalized = normalizePathnameLower(pathname);
  return PRIVATE_ROUTE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function isNoindexRoutePath(pathname) {
  const normalized = normalizePathnameLower(pathname);
  return NOINDEX_ROUTE_PREFIXES.some((prefix) => {
    const routePrefix = normalizePathnameLower(prefix);
    return normalized === routePrefix || normalized.startsWith(`${routePrefix}/`);
  });
}

export function isSensitivePath(pathname) {
  return isPrivateRoutePath(pathname);
}

export function applySecurityHeaders(headers, pathname) {
  for (const [name, value] of Object.entries(GLOBAL_SECURITY_HEADERS)) {
    headers.set(name, value);
  }

  if (isSensitivePath(pathname)) {
    for (const [name, value] of Object.entries(SENSITIVE_HEADERS)) {
      headers.set(name, value);
    }
  } else if (isNoindexRoutePath(pathname)) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  } else {
    headers.delete("X-Robots-Tag");
  }

  return headers;
}

export function shouldInjectHomepageMotion(request, url, response) {
  if (request.method !== "GET") return false;
  if (url.pathname !== "/") return false;
  return (response.headers.get("content-type") || "").includes("text/html");
}

export function shouldInjectStaticFallbackPaintGuard(request, response) {
  if (request.method !== "GET") return false;
  return (response.headers.get("content-type") || "").includes("text/html");
}

export function injectStaticFallbackPaintGuard(html) {
  let nextHtml = html;

  if (!nextHtml.includes(STATIC_FALLBACK_PAINT_GUARD_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${STATIC_FALLBACK_PAINT_GUARD_STYLE}</head>`)
      : `${STATIC_FALLBACK_PAINT_GUARD_STYLE}${nextHtml}`;
  }

  if (!nextHtml.includes(STATIC_FALLBACK_PAINT_GUARD_SCRIPT_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${STATIC_FALLBACK_PAINT_GUARD_SCRIPT}</head>`)
      : `${STATIC_FALLBACK_PAINT_GUARD_SCRIPT}${nextHtml}`;
  }

  if (!nextHtml.includes(HEADER_TRANSPARENCY_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${HEADER_TRANSPARENCY_STYLE}</head>`)
      : `${HEADER_TRANSPARENCY_STYLE}${nextHtml}`;
  }

  return nextHtml;
}

export const DEMO_BOOKING_MODAL_PATCH_SCRIPT = `<script id="${DEMO_BOOKING_MODAL_PATCH_SCRIPT_ID}">
(function(){
  if (window.__clientsurgeStaleDemoModalPatch) return;
  window.__clientsurgeStaleDemoModalPatch = true;
  var endpoint = "/api/functions/submitContactInquiry";
  function closeModal(wrapper) {
    var overlay = wrapper && wrapper.parentElement;
    var backdrop = overlay && overlay.firstElementChild;
    if (backdrop && backdrop !== wrapper && typeof backdrop.click === "function") {
      backdrop.click();
    } else if (overlay) {
      overlay.remove();
      document.body.classList.remove("nav-open");
      document.body.style.removeProperty("--scroll-lock-top");
    }
  }
  function modalMarkup() {
    return [
      '<button type="button" data-clientsurge-audit-close aria-label="Close audit request form" style="position:absolute;right:12px;top:12px;z-index:2;width:42px;height:42px;border-radius:999px;border:0;background:#0f172a;color:#fff;font-size:24px;line-height:1;cursor:pointer">x</button>',
      '<div data-clientsurge-audit-form-shell style="display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);max-height:calc(100svh - 32px);overflow:auto;border-radius:18px;background:#fff;box-shadow:0 28px 80px rgba(0,0,0,.35)">',
      '<section style="background:#020617;color:#fff;padding:32px">',
      '<p style="margin:0 0 12px;color:#7dd3fc;font:700 12px/1.2 system-ui;text-transform:uppercase;letter-spacing:.18em">Free Automation Audit</p>',
      '<h2 style="margin:0;font:700 34px/1.05 system-ui;color:#fff">Find the lead leaks costing you booked jobs.</h2>',
      '<p style="margin:18px 0 0;color:#cbd5e1;font:400 15px/1.6 system-ui">Send the request here and ClientSurge will review your follow-up, booking, and missed-call path before the walkthrough.</p>',
      '<ul style="margin:28px 0 0;padding:0;list-style:none;color:#e2e8f0;font:500 15px/1.5 system-ui;display:grid;gap:14px">',
      '<li>Lead capture and missed-call response review</li>',
      '<li>Fastest AI automation opportunities for your business type</li>',
      '<li>Plain-English next steps with no placeholder video detours</li>',
      '</ul>',
      '<div style="margin-top:28px;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.06);font:600 14px/1.6 system-ui">',
      '<a style="color:#fff;text-decoration:none;display:block" href="tel:+16025843227">(602) 584-3227</a>',
      '<a style="color:#fff;text-decoration:none;display:block;margin-top:6px" href="mailto:support@clientsurgesystems.com">support@clientsurgesystems.com</a>',
      '</div>',
      '</section>',
      '<section style="padding:32px">',
      '<form action="/contact" method="post" data-clientsurge-audit-form style="display:grid;gap:14px">',
      '<div><h3 style="margin:0;color:#020617;font:700 28px/1.15 system-ui">Request your free audit</h3><p style="margin:8px 0 0;color:#475569;font:400 15px/1.5 system-ui">This form feeds the ClientSurge lead workflow directly.</p></div>',
      '<input name="website_url" autocomplete="off" tabindex="-1" aria-hidden="true" style="display:none;position:absolute;left:-9999px" />',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="display:grid;gap:6px;color:#475569;font:700 12px/1.2 system-ui;text-transform:uppercase">Full name<input name="full_name" required autocomplete="name" style="min-height:48px;border:1px solid #cbd5e1;border-radius:10px;padding:0 14px;font:400 16px system-ui;color:#020617"></label><label style="display:grid;gap:6px;color:#475569;font:700 12px/1.2 system-ui;text-transform:uppercase">Email<input name="email" type="email" required autocomplete="email" style="min-height:48px;border:1px solid #cbd5e1;border-radius:10px;padding:0 14px;font:400 16px system-ui;color:#020617"></label></div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="display:grid;gap:6px;color:#475569;font:700 12px/1.2 system-ui;text-transform:uppercase">Phone<input name="phone" type="tel" autocomplete="tel" style="min-height:48px;border:1px solid #cbd5e1;border-radius:10px;padding:0 14px;font:400 16px system-ui;color:#020617"></label><label style="display:grid;gap:6px;color:#475569;font:700 12px/1.2 system-ui;text-transform:uppercase">Business<input name="business_name" autocomplete="organization" style="min-height:48px;border:1px solid #cbd5e1;border-radius:10px;padding:0 14px;font:400 16px system-ui;color:#020617"></label></div>',
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><label style="display:grid;gap:6px;color:#475569;font:700 12px/1.2 system-ui;text-transform:uppercase">Industry<input name="business_type" placeholder="Dental, roofing, med spa..." style="min-height:48px;border:1px solid #cbd5e1;border-radius:10px;padding:0 14px;font:400 16px system-ui;color:#020617"></label><label style="display:grid;gap:6px;color:#475569;font:700 12px/1.2 system-ui;text-transform:uppercase">Website<input name="business_website_url" type="url" placeholder="https://" autocomplete="url" style="min-height:48px;border:1px solid #cbd5e1;border-radius:10px;padding:0 14px;font:400 16px system-ui;color:#020617"></label></div>',
      '<label style="display:grid;gap:6px;color:#475569;font:700 12px/1.2 system-ui;text-transform:uppercase">What should we review?<textarea name="message" required style="min-height:112px;border:1px solid #cbd5e1;border-radius:10px;padding:12px 14px;font:400 16px/1.45 system-ui;color:#020617;resize:vertical">I would like a free automation audit for my business.</textarea></label>',
      '<p data-clientsurge-status role="status" style="min-height:20px;margin:0;color:#b91c1c;font:600 13px/1.4 system-ui"></p>',
      '<button type="submit" style="min-height:50px;border:0;border-radius:999px;background:#00aeef;color:#fff;font:800 16px system-ui;cursor:pointer">Send audit request</button>',
      '</form>',
      '</section>',
      '</div>',
      '<style>@media(max-width:760px){[data-clientsurge-audit-form-shell]{grid-template-columns:1fr!important}[data-clientsurge-audit-form] [style*="grid-template-columns:1fr 1fr"]{grid-template-columns:1fr!important}}</style>'
    ].join("");
  }
  function patchWrapper(wrapper) {
    if (!wrapper || wrapper.dataset.clientsurgeAuditPatched === "true") return;
    wrapper.dataset.clientsurgeAuditPatched = "true";
    wrapper.innerHTML = modalMarkup();
    var closeButton = wrapper.querySelector("[data-clientsurge-audit-close]");
    if (closeButton) closeButton.addEventListener("click", function(){ closeModal(wrapper); });
    var form = wrapper.querySelector("[data-clientsurge-audit-form]");
    var status = wrapper.querySelector("[data-clientsurge-status]");
    if (!form) return;
    form.addEventListener("submit", function(event) {
      event.preventDefault();
      status.textContent = "";
      var payload = Object.fromEntries(new FormData(form).entries());
      payload.business_type = payload.business_type || "Free Automation Audit";
      if (!payload.full_name || !payload.email || !payload.message) {
        status.textContent = "Please complete your name, email, and review notes.";
        return;
      }
      var button = form.querySelector('button[type="submit"]');
      if (button) { button.disabled = true; button.textContent = "Sending request"; }
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function(response) {
        return response.json().catch(function(){ return {}; }).then(function(body){ return { response: response, body: body }; });
      }).then(function(result) {
        if (!result.response.ok || result.body.success === false || (result.body.data && result.body.data.success === false)) {
          throw new Error("submit failed");
        }
        form.innerHTML = '<div style="min-height:360px;display:grid;place-items:center;text-align:center"><div><div style="width:64px;height:64px;border-radius:999px;background:#dcfce7;color:#16a34a;display:grid;place-items:center;margin:0 auto 18px;font-size:32px">OK</div><h3 style="margin:0;color:#020617;font:700 28px system-ui">Audit request sent</h3><p style="margin:12px auto 0;max-width:360px;color:#475569;font:400 15px/1.6 system-ui">We have your details. Expect a direct follow-up with practical next steps for your lead flow.</p><button type="button" data-clientsurge-audit-close-success style="margin-top:22px;min-height:44px;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#020617;font:700 14px system-ui;padding:0 18px;cursor:pointer">Back to site</button></div></div>';
        var successClose = form.querySelector("[data-clientsurge-audit-close-success]");
        if (successClose) successClose.addEventListener("click", function(){ closeModal(wrapper); });
      }).catch(function() {
        status.innerHTML = 'We could not send automatically. Please call <a href="tel:+16025843227">(602) 584-3227</a> or email <a href="mailto:support@clientsurgesystems.com">support@clientsurgesystems.com</a>.';
      }).finally(function() {
        if (button) { button.disabled = false; button.textContent = "Send audit request"; }
      });
    });
  }
  function scan() {
    var frames = document.querySelectorAll('iframe[title="ClientSurge Systems Demo"],iframe[src*="clientsurge-audit-form"]');
    frames.forEach(function(frame) {
      var wrapper = frame.closest(".relative.w-full.max-w-4xl.z-50") || frame.closest("[class*='max-w-4xl']");
      patchWrapper(wrapper);
    });
  }
  scan();
  var observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(function(){ observer.disconnect(); }, 90000);
})();
</script>`;

export function injectDemoBookingModalPatch(html) {
  if (!html || html.includes(DEMO_BOOKING_MODAL_PATCH_SCRIPT_ID)) {
    return html;
  }
  return html.includes("</body>")
    ? html.replace("</body>", `${DEMO_BOOKING_MODAL_PATCH_SCRIPT}\n</body>`)
    : `${html}\n${DEMO_BOOKING_MODAL_PATCH_SCRIPT}`;
}

export function repairStaleDemoBookingModalAsset(source) {
  if (!source || !source.includes("dQw4w9WgXcQ")) {
    return source;
  }
  return source.replace(
    /https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ\?autoplay=1&rel=0/g,
    "about:blank#clientsurge-audit-form"
  );
}

function shouldRepairStaleDemoBookingModalAsset(request, url, response) {
  if (request.method !== "GET") return false;
  if (!url.pathname.startsWith("/assets/")) return false;
  return (response.headers.get("content-type") || "").includes("javascript");
}

export const PUBLIC_NAV_POLISH_STYLE = `<style id="${PUBLIC_NAV_POLISH_STYLE_ID}">
footer.cs-footer{padding-bottom:env(safe-area-inset-bottom,0px)}
footer.cs-footer a:focus-visible,footer.cs-footer button:focus-visible{outline:2px solid #00AEEF;outline-offset:3px;box-shadow:0 0 0 4px rgba(0,174,239,.18)}
@media (max-width:768px){#root>div{padding-bottom:max(80px,calc(80px + env(safe-area-inset-bottom,0px)))}}
@media (max-width:700px){footer.cs-footer .cs-footer-main{padding-bottom:max(24px,calc(24px + env(safe-area-inset-bottom,0px)))}}
</style>`;

export const PUBLIC_NAV_POLISH_SCRIPT = `<script id="${PUBLIC_NAV_POLISH_SCRIPT_ID}">
(function(){
  if (window.__clientsurgePublicNavPolish) return;
  window.__clientsurgePublicNavPolish = true;
  var routes = {
    "roofing": "/roofing",
    "hvac": "/hvac",
    "dental": "/dental",
    "med spa": "/med-spa",
    "chiropractic": "/chiropractic",
    "contractors": "/contractors",
    "home services": "/hvac"
  };
  function sameOrigin(path) {
    return window.location.origin + path;
  }
  function patchLogo() {
    var logo = document.querySelector('nav img[alt="ClientSurge Systems"]');
    var trigger = logo && logo.closest("button,a");
    if (!trigger || trigger.dataset.clientsurgeLogoTop === "true") return;
    trigger.dataset.clientsurgeLogoTop = "true";
    trigger.addEventListener("click", function(event) {
      if (window.location.pathname === "/" && !window.location.hash) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      }
    }, true);
  }
  function linkForChip(node) {
    var label = (node.textContent || "").trim().toLowerCase();
    return routes[label] || null;
  }
  function patchIndustryChips() {
    var section = document.querySelector('[aria-labelledby="ai-automation-overview"]');
    var group = section && section.querySelector('[aria-label="Industries served"]');
    if (!group) return;
    Array.from(group.children).forEach(function(child) {
      if (child.dataset.clientsurgeIndustryChip === "true" || child.querySelector("a[href]")) return;
      var target = linkForChip(child);
      if (!target) return;
      var anchor = document.createElement("a");
      anchor.href = target;
      anchor.setAttribute("aria-label", "View " + child.textContent.trim() + " automation systems");
      anchor.className = "inline-flex rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";
      anchor.textContent = child.textContent.trim();
      anchor.addEventListener("click", function(){ window.scrollTo({ top: 0, left: 0, behavior: "auto" }); });
      child.textContent = "";
      child.appendChild(anchor);
      child.dataset.clientsurgeIndustryChip = "true";
      child.dataset.clientsurgeIndustryHref = sameOrigin(target);
    });
  }
  function run() {
    patchLogo();
    patchIndustryChips();
  }
  run();
  var observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(function(){ observer.disconnect(); }, 90000);
})();
</script>`;

export function injectPublicNavPolish(html) {
  let nextHtml = html;
  if (!nextHtml.includes(PUBLIC_NAV_POLISH_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${PUBLIC_NAV_POLISH_STYLE}</head>`)
      : `${PUBLIC_NAV_POLISH_STYLE}${nextHtml}`;
  }
  if (!nextHtml.includes(PUBLIC_NAV_POLISH_SCRIPT_ID)) {
    nextHtml = nextHtml.includes("</body>")
      ? nextHtml.replace("</body>", `${PUBLIC_NAV_POLISH_SCRIPT}\n</body>`)
      : `${nextHtml}\n${PUBLIC_NAV_POLISH_SCRIPT}`;
  }
  return nextHtml;
}

function escapeHtmlAttribute(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function resolvePublicRouteMetadata(pathname = "/") {
  const normalized = normalizePathname(pathname);
  const aliasTarget = STATIC_ROUTE_ALIASES[normalized] || STATIC_ROUTE_ALIASES[normalized.toLowerCase()];
  const canonicalPath = aliasTarget || normalized;
  const exactMeta = PUBLIC_ROUTE_METADATA[canonicalPath] || PUBLIC_ROUTE_METADATA[canonicalPath.toLowerCase()];
  const meta = exactMeta || (canonicalPath.startsWith("/blog/") ? PUBLIC_ROUTE_METADATA["/blog"] : PUBLIC_ROUTE_METADATA["/"]);
  return {
    canonicalPath,
    canonicalUrl: `${CANONICAL_ORIGIN}${canonicalPath === "/" ? "/" : canonicalPath}`,
    title: meta.title,
    description: meta.description,
  };
}

function upsertHeadTag(html, pattern, tag) {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }
  return html.includes("</head>") ? html.replace("</head>", `${tag}\n</head>`) : `${tag}\n${html}`;
}

export function repairPublicRouteMetadata(html, pathname = "/") {
  const meta = resolvePublicRouteMetadata(pathname);
  const robots = isNoindexRoutePath(meta.canonicalPath) ? "noindex,nofollow" : "index,follow";
  const title = escapeHtmlAttribute(meta.title);
  const description = escapeHtmlAttribute(meta.description);
  const canonicalUrl = escapeHtmlAttribute(meta.canonicalUrl);
  let nextHtml = html.replace(/https:\/\/grinning-apex-flow-growth\.base44\.app/gi, CANONICAL_ORIGIN);

  nextHtml = upsertHeadTag(nextHtml, /<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i,
    `<meta name="description" content="${description}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i,
    `<meta name="robots" content="${robots}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>/i,
    `<meta property="og:title" content="${title}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>/i,
    `<meta property="og:description" content="${description}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty=["']twitter:url["'])[^>]*>/i,
    `<meta property="twitter:url" content="${canonicalUrl}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty=["']twitter:title["'])[^>]*>/i,
    `<meta property="twitter:title" content="${title}" />`
  );
  nextHtml = upsertHeadTag(
    nextHtml,
    /<meta\b(?=[^>]*\bproperty=["']twitter:description["'])[^>]*>/i,
    `<meta property="twitter:description" content="${description}" />`
  );

  return nextHtml;
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

  if (!nextHtml.includes(HOMEPAGE_ORDER_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${HOMEPAGE_ORDER_STYLE}</head>`)
      : `${HOMEPAGE_ORDER_STYLE}${nextHtml}`;

    nextHtml = nextHtml.includes("</body>")
      ? nextHtml.replace("</body>", `${HOMEPAGE_ORDER_SCRIPT}</body>`)
      : `${nextHtml}${HOMEPAGE_ORDER_SCRIPT}`;
  }

  if (!nextHtml.includes(HOMEPAGE_PHONE_ALIGNMENT_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${HOMEPAGE_PHONE_ALIGNMENT_STYLE}</head>`)
      : `${HOMEPAGE_PHONE_ALIGNMENT_STYLE}${nextHtml}`;

    nextHtml = nextHtml.includes("</body>")
      ? nextHtml.replace("</body>", `${HOMEPAGE_PHONE_ALIGNMENT_SCRIPT}</body>`)
      : `${nextHtml}${HOMEPAGE_PHONE_ALIGNMENT_SCRIPT}`;
  }

  if (!nextHtml.includes(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${HOMEPAGE_INDUSTRY_DROPDOWN_STYLE}</head>`)
      : `${HOMEPAGE_INDUSTRY_DROPDOWN_STYLE}${nextHtml}`;

    nextHtml = nextHtml.includes("</body>")
      ? nextHtml.replace("</body>", `${HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT}</body>`)
      : `${nextHtml}${HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT}`;
  }

  if (!nextHtml.includes(HOMEPAGE_INDUSTRY_GALLERY_STYLE_ID)) {
    nextHtml = nextHtml.includes("</head>")
      ? nextHtml.replace("</head>", `${HOMEPAGE_INDUSTRY_GALLERY_STYLE}</head>`)
      : `${HOMEPAGE_INDUSTRY_GALLERY_STYLE}${nextHtml}`;

    nextHtml = nextHtml.includes("</body>")
      ? nextHtml.replace("</body>", `${HOMEPAGE_INDUSTRY_GALLERY_SCRIPT}</body>`)
      : `${nextHtml}${HOMEPAGE_INDUSTRY_GALLERY_SCRIPT}`;
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

function robotsTxtResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  }), "/robots.txt");
  return new Response(buildRobotsTxt(), { status: 200, headers });
}

function sitemapXmlResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  }), "/sitemap.xml");
  return new Response(buildSitemapXml(), { status: 200, headers });
}

function privateRouteBlockedResponse(pathname) {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "text/html; charset=utf-8",
    [PRIVATE_ROUTE_BLOCK_HEADER]: "edge-v1",
  }), pathname);
  return new Response(
    "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"robots\" content=\"noindex,nofollow,noarchive\"><title>ClientSurge Login Required</title></head><body><main><h1>Login required</h1><p>This ClientSurge area is private.</p><p><a href=\"/login\">Go to client login</a></p></main></body></html>",
    { status: 403, headers }
  );
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

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function trustSecurityAssetResponse(pathname) {
  const base64 = TRUST_SECURITY_WEBP_BASE64[pathname];
  if (!base64) return null;

  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
  }), pathname);
  return new Response(base64ToBytes(base64), { status: 200, headers });
}

export function originRequestFor(request, url = new URL(request.url)) {
  const originUrl = new URL(url.toString());
  originUrl.protocol = "https:";
  originUrl.hostname = BASE44_ORIGIN_HOST;
  return new Request(originUrl.toString(), request);
}

export function isAnonymousUserMeRequest(request, url = new URL(request.url)) {
  if (request.method !== "GET") return false;
  if (!/\/api\/apps\/[^/]+\/entities\/User\/me\/?$/.test(url.pathname)) return false;
  return !request.headers.get("authorization") && !request.headers.get("cookie");
}

function anonymousUserMeResponse() {
  const headers = applySecurityHeaders(new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    [ANONYMOUS_USER_ME_HEADER]: "edge-v1",
  }), "/login");
  return new Response("null", { status: 200, headers });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.protocol === "http:" || url.hostname === ALTERNATE_HOST) {
      return canonicalRedirect(url);
    }

    if (isPrivateRoutePath(url.pathname)) {
      return privateRouteBlockedResponse(url.pathname);
    }

    if (isAnonymousUserMeRequest(request, url)) {
      return anonymousUserMeResponse();
    }

    if (url.pathname === "/.well-known/security.txt") {
      return securityTxtResponse();
    }

    if (url.pathname === "/robots.txt") {
      return robotsTxtResponse();
    }

    if (url.pathname === "/sitemap.xml") {
      return sitemapXmlResponse();
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

    const trustSecurityAsset = trustSecurityAssetResponse(url.pathname);
    if (trustSecurityAsset) {
      return trustSecurityAsset;
    }

    const originResponse = await fetch(originRequestFor(request, url));
    const headers = applySecurityHeaders(new Headers(originResponse.headers), url.pathname);

    if (shouldRepairStaleDemoBookingModalAsset(request, url, originResponse)) {
      const source = await originResponse.text();
      const repaired = repairStaleDemoBookingModalAsset(source);
      if (repaired !== source) {
        headers.set(DEMO_BOOKING_MODAL_PATCH_HEADER, "asset-v1");
        headers.set("Cache-Control", "no-store, max-age=0");
      }
      return new Response(repaired, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers,
      });
    }

    if (shouldInjectStaticFallbackPaintGuard(request, originResponse)) {
      let html = repairPublicRouteMetadata(await originResponse.text(), url.pathname);
      html = injectDemoBookingModalPatch(html);
      html = injectPublicNavPolish(html);
      html = injectStaticFallbackPaintGuard(html);
      headers.set(STATIC_FALLBACK_PAINT_GUARD_HEADER, "edge-v1");
      headers.set(EDGE_ROUTE_METADATA_HEADER, "edge-v1");
      headers.set(DEMO_BOOKING_MODAL_PATCH_HEADER, "edge-v1");
      headers.set(PUBLIC_NAV_POLISH_HEADER, "edge-v1");
      headers.set("Cache-Control", "no-store, max-age=0");

      if (shouldInjectHomepageMotion(request, url, originResponse)) {
        headers.set(HOMEPAGE_MOTION_HEADER, "edge-v1");
        html = injectHomepageMotion(html);
      }

      return new Response(html, {
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
