import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import worker, {
  ANONYMOUS_USER_ME_HEADER,
  applySecurityHeaders,
  DEMO_BOOKING_MODAL_PATCH_HEADER,
  DEMO_BOOKING_MODAL_PATCH_SCRIPT_ID,
  EDGE_HEALTH_HEADER,
  EDGE_HEALTH_PATH,
  HEADER_TRANSPARENCY_STYLE,
  HEADER_TRANSPARENCY_STYLE_ID,
  HOMEPAGE_MOTION_HEADER,
  HOMEPAGE_MOTION_INJECTION,
  HOMEPAGE_MOTION_STYLE_ID,
  HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT,
  HOMEPAGE_INDUSTRY_DROPDOWN_STYLE,
  HOMEPAGE_INDUSTRY_DROPDOWN_STYLE_ID,
  HOMEPAGE_INDUSTRY_GALLERY_SCRIPT,
  HOMEPAGE_INDUSTRY_GALLERY_STYLE,
  HOMEPAGE_INDUSTRY_GALLERY_STYLE_ID,
  HOMEPAGE_ORDER_SCRIPT,
  HOMEPAGE_ORDER_STYLE,
  HOMEPAGE_ORDER_STYLE_ID,
  HOMEPAGE_PHONE_ALIGNMENT_SCRIPT,
  HOMEPAGE_PHONE_ALIGNMENT_STYLE,
  HOMEPAGE_PHONE_ALIGNMENT_STYLE_ID,
  injectHomepageMotion,
  isAnonymousUserMeRequest,
  isNoindexRoutePath,
  isSensitivePath,
  isPrivateRoutePath,
  originRequestFor,
  PRIVATE_ROUTE_BLOCK_HEADER,
  injectDemoBookingModalPatch,
  repairStaleDemoBookingModalAsset,
  repairPublicRouteMetadata,
  SENSITIVE_HEADERS,
  SERVICE_WORKER_JS,
  SECURITY_TXT,
  shouldInjectHomepageMotion,
  shouldInjectStaticFallbackPaintGuard,
  STATIC_FALLBACK_PAINT_GUARD_HEADER,
  STATIC_FALLBACK_PAINT_GUARD_SCRIPT_ID,
  STATIC_FALLBACK_PAINT_GUARD_STYLE_ID,
  injectStaticFallbackPaintGuard,
  TRUST_SECURITY_INJECTION,
  TRUST_SECURITY_CLIENT_JS,
  TRUST_SECURITY_SECTION_ID,
  TRUST_SECURITY_SCRIPT_PATH,
  TRUST_SECURITY_STYLE,
  TRUST_SECURITY_STYLE_ID,
  trustSecurityAssetResponse,
} from "../cloudflare/clientsurge-security-edge-worker.mjs";
import {
  evaluateEdgeHealthProbe,
  isCloudflareAnycastAddress,
  TRANSFORM_FALLBACK_HEADER,
} from "../scripts/verify-production-security.mjs";
import {
  diagnoseRouteBypass,
  formatRouteBypassDiagnosis,
} from "../scripts/cloudflare/diagnose-route-bypass.mjs";
import {
  buildSecurityHeaderRules,
  TRANSFORM_HEADER,
} from "../scripts/cloudflare/upsert-security-header-transform.mjs";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Cloudflare security edge worker identifies sensitive app routes", () => {
  for (const path of ["/admin", "/admin/leads", "/AdminDashboard", "/ClientDashboard", "/CredentialsSetup", "/SetupStatus", "/BusinessSetup", "/onboarding", "/setup/preview/security-check", "/motion-lab", "/MotionLab", "/client-portal"]) {
    assert.equal(isSensitivePath(path), true, `${path} should be sensitive`);
    assert.equal(isPrivateRoutePath(path), true, `${path} should be private`);
  }

  for (const path of ["/", "/store", "/book", "/contact", "/roofing", "/login", "/start"]) {
    assert.equal(isSensitivePath(path), false, `${path} should stay public`);
  }

  for (const path of ["/login", "/order-success", "/success", "/thank-you"]) {
    assert.equal(isNoindexRoutePath(path), true, `${path} should be noindex`);
  }

  for (const path of ["/", "/store", "/book", "/contact", "/roofing", "/start"]) {
    assert.equal(isNoindexRoutePath(path), false, `${path} should be indexable`);
  }
});

test("Cloudflare security edge worker blocks private route aliases before Base44", async () => {
  for (const path of ["/ClientDashboard", "/AdminDashboard", "/CredentialsSetup", "/SetupStatus", "/BusinessSetup", "/setup/status", "/MotionLab"]) {
    const response = await worker.fetch(new Request(`https://clientsurgesystems.com${path}`));
    const body = await response.text();

    assert.equal(response.status, 403, `${path} should fail closed`);
    assert.equal(response.headers.get(PRIVATE_ROUTE_BLOCK_HEADER), "edge-v1");
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.match(body, /Login required/);
  }
});

test("Cloudflare security edge worker suppresses anonymous public User/me noise", async () => {
  const anonymousRequest = new Request(
    "https://clientsurgesystems.com/api/apps/69dc4a79656fdba136d413d3/entities/User/me"
  );
  const authenticatedRequest = new Request(
    "https://clientsurgesystems.com/api/apps/69dc4a79656fdba136d413d3/entities/User/me",
    { headers: { cookie: "base44_session=example" } }
  );

  assert.equal(isAnonymousUserMeRequest(anonymousRequest), true);
  assert.equal(isAnonymousUserMeRequest(authenticatedRequest), false);

  const response = await worker.fetch(anonymousRequest);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get(ANONYMOUS_USER_ME_HEADER), "edge-v1");
  assert.equal(await response.text(), "null");
});

test("Cloudflare security edge worker applies required public and sensitive headers", () => {
  const publicHeaders = applySecurityHeaders(new Headers(), "/");
  assert.ok(publicHeaders.get("content-security-policy")?.includes("default-src"));
  assert.ok(publicHeaders.get("content-security-policy")?.includes("base-uri"));
  assert.ok(publicHeaders.get("content-security-policy")?.includes("object-src"));
  assert.match(
    publicHeaders.get("content-security-policy") || "",
    /frame-ancestors[^;]*https:\/\/base44\.app[^;]*https:\/\/\*\.base44\.app[^;]*https:\/\/base44\.com[^;]*https:\/\/\*\.base44\.com/
  );
  assert.ok(publicHeaders.get("permissions-policy"));
  assert.ok(publicHeaders.get("cross-origin-opener-policy"));
  assert.equal(publicHeaders.get("x-robots-tag"), null);

  const sensitiveHeaders = applySecurityHeaders(new Headers(), "/client-portal");
  assert.match(sensitiveHeaders.get("x-robots-tag") || "", /noindex/);
  assert.match(sensitiveHeaders.get("cache-control") || "", /no-store/);

  const loginHeaders = applySecurityHeaders(new Headers(), "/login");
  assert.equal(loginHeaders.get("x-robots-tag"), "noindex, nofollow");
});

test("Cloudflare security edge worker serves canonical security.txt at the edge", async () => {
  const response = await worker.fetch(new Request("https://clientsurgesystems.com/.well-known/security.txt"));
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/plain/);
  assert.match(body, /https:\/\/clientsurgesystems\.com\/\.well-known\/security\.txt/);
  assert.equal(body, SECURITY_TXT);
});

test("Cloudflare security edge worker redirects alternate host to canonical", async () => {
  const response = await worker.fetch(new Request("https://www.clientsurgesystems.com/store"));

  assert.equal(response.status, 301);
  assert.equal(response.headers.get("location"), "https://clientsurgesystems.com/store");
});

test("Cloudflare security edge worker serves a Worker-only health probe", async () => {
  const response = await worker.fetch(new Request(`https://clientsurgesystems.com${EDGE_HEALTH_PATH}`));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get(EDGE_HEALTH_HEADER), "active");
  assert.equal(body.ok, true);
  assert.equal(body.edge, "clientsurge-security-edge");
});

test("Cloudflare security edge worker serves the fresh service worker at the edge", async () => {
  const response = await worker.fetch(new Request("https://clientsurgesystems.com/sw.js"));
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/javascript/);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  assert.equal(response.headers.get("service-worker-allowed"), "/");
  assert.equal(body, SERVICE_WORKER_JS);
  assert.match(body, /clientsurge-shell-v2/);
  assert.doesNotMatch(body, /clientsurge-shell-v1/);
});

test("Cloudflare security edge worker serves the trust section inserter script", async () => {
  const response = await worker.fetch(new Request(`https://clientsurgesystems.com${TRUST_SECURITY_SCRIPT_PATH}`));
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/javascript/);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  assert.match(body, new RegExp(TRUST_SECURITY_SECTION_ID));
  assert.match(body, /Stripe Secure Payment/);
  assert.match(body, /GDPR Compliant/);
});

test("Cloudflare security edge worker serves trust badge WebP assets", async () => {
  const response = await worker.fetch(new Request("https://clientsurgesystems.com/trust-security/satisfaction-guarantee.webp"));

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /image\/webp/);
  assert.match(response.headers.get("cache-control") || "", /immutable/);
  assert.equal((await response.arrayBuffer()).byteLength > 1000, true);
  assert.equal(trustSecurityAssetResponse("/trust-security/not-real.webp"), null);
});

test("Cloudflare security edge worker proxies application traffic to the Base44 origin host", () => {
  const originRequest = originRequestFor(new Request("https://clientsurgesystems.com/store?plan=starter"));
  const originUrl = new URL(originRequest.url);

  assert.equal(originUrl.hostname, "grinning-apex-flow-growth.base44.app");
  assert.equal(originUrl.pathname, "/store");
  assert.equal(originUrl.search, "?plan=starter");
});

test("Cloudflare security edge worker injects the simplified homepage cinematic motion hooks", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("<!doctype html><html><head><title>ClientSurge</title></head><body><main id=\"root\"></main></body></html>", {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  try {
    const response = await worker.fetch(new Request("https://clientsurgesystems.com/"));
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(HOMEPAGE_MOTION_HEADER), "edge-v1");
    assert.equal(response.headers.get(STATIC_FALLBACK_PAINT_GUARD_HEADER), "edge-v1");
    assert.match(response.headers.get("cache-control") || "", /no-store/);
    assert.match(body, new RegExp(STATIC_FALLBACK_PAINT_GUARD_STYLE_ID));
    assert.match(body, new RegExp(STATIC_FALLBACK_PAINT_GUARD_SCRIPT_ID));
    assert.match(body, new RegExp(HEADER_TRANSPARENCY_STYLE_ID));
    assert.match(body, new RegExp(HOMEPAGE_MOTION_STYLE_ID));
    assert.match(body, new RegExp(HOMEPAGE_ORDER_STYLE_ID));
    assert.match(body, new RegExp(HOMEPAGE_PHONE_ALIGNMENT_STYLE_ID));
    assert.match(body, new RegExp(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE_ID));
    assert.match(body, new RegExp(HOMEPAGE_INDUSTRY_GALLERY_STYLE_ID));
    assert.match(body, /ambient-sweep/);
    assert.match(body, /headline-sheen/);
    assert.match(body, /dashboard-float-scan/);
    assert.match(body, /data-clientsurge-homepage-order/);
    assert.match(body, /data-clientsurge-phone-alignment/);
    assert.match(body, /data-clientsurge-industry-dropdown/);
    assert.match(body, /data-clientsurge-industry-gallery/);
    assert.doesNotMatch(body, /checklist-cascade/);
    assert.doesNotMatch(body, /cta-energy/);
    assert.match(body, /MutationObserver/);
    assert.match(body, /prefers-reduced-motion/);
    assert.match(body, /max-width: 640px/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare static fallback paint guard is scoped to HTML and idempotent", () => {
  const htmlResponse = new Response("<html></html>", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
  const assetResponse = new Response("body{}", {
    headers: { "Content-Type": "text/css" },
  });

  assert.equal(shouldInjectStaticFallbackPaintGuard(new Request("https://clientsurgesystems.com/book"), htmlResponse), true);
  assert.equal(shouldInjectStaticFallbackPaintGuard(new Request("https://clientsurgesystems.com/book", { method: "POST" }), htmlResponse), false);
  assert.equal(shouldInjectStaticFallbackPaintGuard(new Request("https://clientsurgesystems.com/assets/index.css"), assetResponse), false);

  const injected = injectStaticFallbackPaintGuard("<html><head></head><body><div id=\"root\"><main class=\"static-fallback\"></main></div></body></html>");
  assert.match(injected, new RegExp(STATIC_FALLBACK_PAINT_GUARD_STYLE_ID));
  assert.match(injected, new RegExp(STATIC_FALLBACK_PAINT_GUARD_SCRIPT_ID));
  assert.match(injected, new RegExp(HEADER_TRANSPARENCY_STYLE_ID));
  assert.match(injected, /html\.js:not\(\.app-fallback-visible\) #root > \.static-fallback/);
  assert.match(injected, /nav\[aria-label="Main navigation"\]/);
  assert.match(injected, /classList\.add\("app-fallback-visible"\)/);
  assert.equal(injectStaticFallbackPaintGuard(injected), injected);
});

test("Cloudflare static HTML injection repairs public route metadata and canonical host", () => {
  const staleHtml = [
    "<html><head>",
    "<title>Store | Base44</title>",
    '<meta name="description" content="Store on ClientSurge Systems. Premium AI-driven automation systems built to increase bookings, recover missed ." />',
    '<link rel="canonical" href="https://grinning-apex-flow-growth.base44.app/store" />',
    '<meta property="og:url" content="https://grinning-apex-flow-growth.base44.app/store" />',
    '<meta property="og:title" content="Store | ClientSurge Systems" />',
    '<meta property="og:description" content="old" />',
    '<meta property="twitter:url" content="https://grinning-apex-flow-growth.base44.app/store" />',
    "</head><body></body></html>",
  ].join("");
  const repaired = repairPublicRouteMetadata(staleHtml, "/store");

  assert.match(repaired, /<title>AI Automation Store \| ClientSurge Systems<\/title>/);
  assert.match(repaired, /<link rel="canonical" href="https:\/\/clientsurgesystems\.com\/store" \/>/);
  assert.match(repaired, /<meta property="og:url" content="https:\/\/clientsurgesystems\.com\/store" \/>/);
  assert.match(repaired, /Compare ClientSurge packages, automation systems/);
  assert.doesNotMatch(repaired, /grinning-apex-flow-growth\.base44\.app/);
});

test("Cloudflare static HTML injection patches stale demo booking modal behavior", () => {
  const html = "<html><head></head><body><div id=\"root\"></div></body></html>";
  const injected = injectDemoBookingModalPatch(html);

  assert.match(injected, new RegExp(DEMO_BOOKING_MODAL_PATCH_SCRIPT_ID));
  assert.match(injected, /submitContactInquiry/);
  assert.match(injected, /Request your free audit/);
  assert.match(injected, /ClientSurge Systems Demo/);
  assert.equal(injectDemoBookingModalPatch(injected), injected);
});

test("Cloudflare asset rewrite strips stale rickroll demo URL", () => {
  const staleAsset = 'const Bh="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0";';
  const repaired = repairStaleDemoBookingModalAsset(staleAsset);

  assert.doesNotMatch(repaired, /dQw4w9WgXcQ/);
  assert.match(repaired, /about:blank#clientsurge-audit-form/);
  assert.equal(repairStaleDemoBookingModalAsset("const ok = true;"), "const ok = true;");
});

test("Cloudflare worker rewrites stale demo modal JavaScript assets", async () => {
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    'const Bh="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0";',
    {
      status: 200,
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    }
  );

  try {
    const response = await worker.fetch(new Request("https://clientsurgesystems.com/assets/index-old.js"));
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get(DEMO_BOOKING_MODAL_PATCH_HEADER), "asset-v1");
    assert.doesNotMatch(body, /dQw4w9WgXcQ/);
    assert.match(body, /about:blank#clientsurge-audit-form/);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Cloudflare static HTML injection makes the header and nav menus transparent", () => {
  assert.match(HEADER_TRANSPARENCY_STYLE, new RegExp(HEADER_TRANSPARENCY_STYLE_ID));
  assert.match(HEADER_TRANSPARENCY_STYLE, /nav\[aria-label="Main navigation"\]/);
  assert.match(HEADER_TRANSPARENCY_STYLE, /background: rgba\(255, 255, 255, 0\.06\) !important/);
  assert.match(HEADER_TRANSPARENCY_STYLE, /background: rgba\(255, 255, 255, 0\.10\) !important/);
  assert.match(HEADER_TRANSPARENCY_STYLE, /blur\(3px\) saturate\(1\.05\)/);
  assert.match(HEADER_TRANSPARENCY_STYLE, /box-shadow: none !important/);
  assert.match(HEADER_TRANSPARENCY_STYLE, /\[role="menu"\]\[aria-label="Industries"\]/);
  assert.match(HEADER_TRANSPARENCY_STYLE, /Open navigation menu/);
  assert.match(HEADER_TRANSPARENCY_STYLE, /Close navigation menu/);
});

test("Cloudflare homepage motion injection is scoped and idempotent", () => {
  const homeResponse = new Response("<html></html>", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
  const assetResponse = new Response("body{}", {
    headers: { "Content-Type": "text/css" },
  });

  assert.equal(shouldInjectHomepageMotion(new Request("https://clientsurgesystems.com/"), new URL("https://clientsurgesystems.com/"), homeResponse), true);
  assert.equal(shouldInjectHomepageMotion(new Request("https://clientsurgesystems.com/book"), new URL("https://clientsurgesystems.com/book"), homeResponse), false);
  assert.equal(shouldInjectHomepageMotion(new Request("https://clientsurgesystems.com/", { method: "POST" }), new URL("https://clientsurgesystems.com/"), homeResponse), false);
  assert.equal(shouldInjectHomepageMotion(new Request("https://clientsurgesystems.com/"), new URL("https://clientsurgesystems.com/"), assetResponse), false);

  const injected = injectHomepageMotion("<html><head></head><body></body></html>");
  assert.equal(injectHomepageMotion(injected), injected);
  assert.equal((injected.match(new RegExp(HOMEPAGE_MOTION_STYLE_ID, "g")) || []).length, 1);
  assert.equal((injected.match(new RegExp(HOMEPAGE_ORDER_STYLE_ID, "g")) || []).length, 1);
  assert.equal((injected.match(new RegExp(HOMEPAGE_PHONE_ALIGNMENT_STYLE_ID, "g")) || []).length, 1);
  assert.equal((injected.match(new RegExp(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE_ID, "g")) || []).length, 1);
  assert.equal((injected.match(new RegExp(`<style id="${HOMEPAGE_INDUSTRY_GALLERY_STYLE_ID}"`, "g")) || []).length, 1);
  assert.equal(HOMEPAGE_MOTION_INJECTION.includes(HOMEPAGE_MOTION_STYLE_ID), true);
  assert.equal(HOMEPAGE_MOTION_INJECTION.includes(HOMEPAGE_ORDER_STYLE_ID), true);
  assert.equal(HOMEPAGE_MOTION_INJECTION.includes(HOMEPAGE_PHONE_ALIGNMENT_STYLE_ID), true);
  assert.equal(HOMEPAGE_MOTION_INJECTION.includes(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE_ID), true);
  assert.equal(HOMEPAGE_MOTION_INJECTION.includes(HOMEPAGE_INDUSTRY_GALLERY_STYLE_ID), true);
});

test("Cloudflare homepage injection adds the trust and security section before the footer", () => {
  const injected = injectHomepageMotion("<html><head></head><body><main id=\"root\"></main><footer>Footer</footer></body></html>");

  assert.match(injected, new RegExp(TRUST_SECURITY_STYLE_ID));
  assert.match(injected, new RegExp(TRUST_SECURITY_SCRIPT_PATH));
  assert.match(TRUST_SECURITY_CLIENT_JS, new RegExp(TRUST_SECURITY_SECTION_ID));
  assert.match(TRUST_SECURITY_CLIENT_JS, /\.security-priority/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /Your Trust & Security/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /Are Our Priority/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /SSL Secure/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /Stripe Secure Payment/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /30-Day Money-Back Guarantee/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /Verified & Trusted/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /GDPR Compliant/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /\/trust-security\/satisfaction-guarantee\.webp/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /\/trust-security\/secure-ssl-encryption\.webp/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /\/trust-security\/stripe-secure-payment\.webp/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /\/trust-security\/verified-seal\.webp/);
  assert.match(TRUST_SECURITY_CLIENT_JS, /\/trust-security\/gdpr-compliant\.webp/);
  assert.match(TRUST_SECURITY_STYLE, /background: transparent/);
  assert.match(TRUST_SECURITY_STYLE, /box-shadow: none/);
  assert.equal(injectHomepageMotion(injected), injected);
  assert.equal(TRUST_SECURITY_INJECTION.includes(TRUST_SECURITY_STYLE_ID), true);
});

test("Cloudflare homepage order patch removes only sections between hero and industries", () => {
  assert.match(HOMEPAGE_ORDER_STYLE, /\.landing-hero__actions/);
  assert.match(HOMEPAGE_ORDER_STYLE, /\.hero-checklist/);
  assert.match(HOMEPAGE_ORDER_STYLE, /\.landing-hero__trustRow/);
  assert.match(HOMEPAGE_ORDER_STYLE, /min-height: 76svh/);
  assert.match(HOMEPAGE_ORDER_SCRIPT, /document\.querySelector\("\.landing-hero"\)/);
  assert.match(HOMEPAGE_ORDER_SCRIPT, /document\.querySelector\("#industries"\)/);
  assert.match(HOMEPAGE_ORDER_SCRIPT, /while \(node && node !== industries\)/);
  assert.match(HOMEPAGE_ORDER_SCRIPT, /node\.remove\(\)/);
  assert.match(HOMEPAGE_ORDER_SCRIPT, /\.security-priority, #clientsurge-trust-security/);
  assert.match(HOMEPAGE_ORDER_SCRIPT, /insertBefore\(trust, footer\)/);
});

test("Cloudflare homepage phone alignment patch centers the SMS demo row", () => {
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_STYLE, /#services \.clientsurge-edge-phone-centered-row/);
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_STYLE, /max-width: 320px/);
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_STYLE, /margin: clamp\(2rem, 4vw, 2\.75rem\) auto 0/);
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_SCRIPT, /document\.querySelector\("#services"\)/);
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_SCRIPT, /\.core-offer-phone/);
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_SCRIPT, /insertBefore\(phone, row\.firstElementChild\)/);
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_SCRIPT, /data-clientsurge-phone-alignment/);
  assert.match(HOMEPAGE_PHONE_ALIGNMENT_SCRIPT, /Math\.abs\(delta\) <= 12/);
});

test("Cloudflare homepage industry dropdown patch prevents the stale Base44 menu squeeze", () => {
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE, /data-clientsurge-edge-industries-menu/);
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE, /width: min\(560px, calc\(100vw - 32px\)\)/);
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_STYLE, /white-space: nowrap/);
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT, /Med Spas & Aesthetic Clinics/);
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT, /Dental & Orthodontics/);
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT, /data-clientsurge-industry-dropdown/);
  assert.match(HOMEPAGE_INDUSTRY_DROPDOWN_SCRIPT, /MutationObserver/);
});

test("Cloudflare homepage industry gallery patch removes stale blue overlays and fills the viewport", () => {
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_STYLE, /clientsurge-edge-industry-gallery/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_STYLE, /max-width: none/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_STYLE, /min-height: 50svh/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_STYLE, /min-height: 100svh/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_STYLE, /color: #ffffff/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_STYLE, /box-shadow: none/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_STYLE, /rgba\(3, 7, 18/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_SCRIPT, /Med Spas & Aesthetic Clinics/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_SCRIPT, /data-clientsurge-industry-gallery/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_SCRIPT, /data-clientsurge-industry-tile/);
  assert.match(HOMEPAGE_INDUSTRY_GALLERY_SCRIPT, /MutationObserver/);
});

test("production security verifier checks the Cloudflare security layer probe", () => {
  const pass = evaluateEdgeHealthProbe({
    target: `https://clientsurgesystems.com${EDGE_HEALTH_PATH}`,
    status: 200,
    headers: { [EDGE_HEALTH_HEADER]: "active" },
  });
  assert.equal(pass.status, "pass");

  const fail = evaluateEdgeHealthProbe({
    target: `https://clientsurgesystems.com${EDGE_HEALTH_PATH}`,
    status: 200,
    headers: { "content-type": "text/html" },
  });
  assert.equal(fail.status, "fail");
});

test("production security verifier accepts Cloudflare transform fallback when Worker route is bypassed", () => {
  const pass = evaluateEdgeHealthProbe({
    target: `https://clientsurgesystems.com${EDGE_HEALTH_PATH}`,
    status: 200,
    headers: { [TRANSFORM_FALLBACK_HEADER]: "active" },
  });
  assert.equal(pass.status, "pass");
  assert.match(pass.message, /transform fallback is active/);
});

test("Cloudflare transform fallback rule mirrors Worker security headers", () => {
  const [globalRule, sensitiveRule] = buildSecurityHeaderRules("clientsurgesystems.com");

  assert.equal(globalRule.action, "rewrite");
  assert.equal(globalRule.action_parameters.headers[TRANSFORM_HEADER].value, "active");
  assert.equal(
    globalRule.action_parameters.headers["Content-Security-Policy"].value,
    applySecurityHeaders(new Headers(), "/").get("content-security-policy")
  );
  assert.equal(
    globalRule.action_parameters.headers["Permissions-Policy"].value,
    applySecurityHeaders(new Headers(), "/").get("permissions-policy")
  );
  assert.match(globalRule.expression, /clientsurgesystems\.com/);

  assert.equal(sensitiveRule.action, "rewrite");
  assert.match(sensitiveRule.expression, /\/client-portal/);
  assert.equal(sensitiveRule.action_parameters.headers["X-Robots-Tag"].value, SENSITIVE_HEADERS["X-Robots-Tag"]);
  assert.equal(sensitiveRule.action_parameters.headers["Cache-Control"].value, SENSITIVE_HEADERS["Cache-Control"]);
});

test("Cloudflare security release and monitor scripts keep auth and verification guarded", () => {
  const packageJson = read("package.json");
  const release = read("scripts/cloudflare/deploy-security-edge.ps1");
  const monitor = read("scripts/cloudflare/monitor-security-edge.ps1");
  const installer = read("scripts/cloudflare/install-security-edge-monitor-task.ps1");

  assert.match(packageJson, /"cloudflare:security:release": "pwsh -File scripts\/cloudflare\/deploy-security-edge\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:monitor": "pwsh -File scripts\/cloudflare\/monitor-security-edge\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:install-monitor": "pwsh -File scripts\/cloudflare\/install-security-edge-monitor-task\.ps1"/);
  assert.match(packageJson, /"cloudflare:security:diagnose-route": "node scripts\/cloudflare\/diagnose-route-bypass\.mjs"/);

  assert.match(release, /npx wrangler whoami/);
  assert.match(release, /npm run verify:production-security/);
  assert.match(release, /wrangler deploy --config \$ConfigPath --dry-run/);

  assert.match(monitor, /npm run verify:production-security/);
  assert.match(monitor, /npx wrangler whoami/);
  assert.match(monitor, /auth_required/);
  assert.match(monitor, /route_bypassed/);
  assert.match(monitor, /orange-to-orange/);
  assert.match(monitor, /edge-probe:\(worker\|security-layer\)/);
  assert.match(monitor, /Test-RouteBypassFailure/);
  assert.match(monitor, /npm run cloudflare:security:release/);
  assert.match(monitor, /npm run cloudflare:security:diagnose-route -- --json/);
  assert.match(monitor, /route_diagnosis/);
  assert.match(monitor, /latest-security-edge-status\.json/);

  assert.match(installer, /New-ScheduledTaskTrigger/);
  assert.match(installer, /monitor-security-edge\.ps1/);
  assert.match(installer, /MultipleInstances IgnoreNew/);
});

test("production security verifier recognizes Cloudflare anycast DNS evidence", () => {
  assert.equal(isCloudflareAnycastAddress("104.21.24.127"), true);
  assert.equal(isCloudflareAnycastAddress("172.67.218.204"), true);
  assert.equal(isCloudflareAnycastAddress("2606:4700:3032::ac43:dacc"), true);
  assert.equal(isCloudflareAnycastAddress("203.0.113.10"), false);
});

test("Cloudflare route-bypass diagnostic identifies missing DNS/custom-hostname permissions without exposing tokens", async () => {
  const calls = [];
  const report = await diagnoseRouteBypass({
    configPath: new URL("./fixtures/wrangler-oauth.toml", import.meta.url),
    fetchImpl: async (url) => {
      calls.push(url);
      const path = new URL(url).pathname;
      if (path === "/client/v4/zones") {
        return Response.json({ success: true, result: [{ id: "zone-123", name: "clientsurgesystems.com" }] });
      }
      if (path === "/client/v4/zones/zone-123/workers/routes") {
        return Response.json({
          success: true,
          result: [
            { id: "route-1", pattern: "clientsurgesystems.com/*", script: "clientsurge-security-edge" },
            { id: "route-2", pattern: "www.clientsurgesystems.com/*", script: "clientsurge-security-edge" },
          ],
        });
      }
      return Response.json(
        { success: false, errors: [{ code: 10000, message: "Authentication error" }] },
        { status: 403 }
      );
    },
  });

  assert.equal(report.ok, false);
  assert.equal(report.wrangler.has_oauth_token, true);
  assert.equal(report.wrangler.oauth_token, undefined);
  assert.deepEqual(report.routes.map((route) => route.matches_worker), [true, true]);
  assert.equal(report.probes.dns_records.ok, false);
  assert.equal(report.probes.custom_hostnames.ok, false);
  assert.equal(report.probes.rulesets.ok, false);
  assert.equal(report.next_action.status, "needs_cloudflare_dns_custom_hostname_ruleset_access");
  assert.match(report.next_action.message, /cannot inspect dns-records, custom-hostnames, rulesets/);
  assert.deepEqual(report.next_action.denied_probes, ["dns-records", "custom-hostnames", "rulesets"]);
  assert.ok(calls.some((url) => String(url).includes("/workers/routes")));

  const formatted = formatRouteBypassDiagnosis(report);
  assert.match(formatted, /Cloudflare route-bypass diagnosis/);
  assert.match(formatted, /clientsurgesystems\.com\/\*: clientsurge-security-edge \(ok\)/);
  assert.match(formatted, /dns_records: denied/);
  assert.doesNotMatch(formatted, /test-token/);
});

test("Cloudflare route-bypass diagnostic falls back across env and Wrangler token sources per endpoint", async () => {
  const previous = process.env.CLOUDFLARE_API_TOKEN;
  process.env.CLOUDFLARE_API_TOKEN = "env-token";
  try {
    const report = await diagnoseRouteBypass({
      configPath: new URL("./fixtures/wrangler-oauth.toml", import.meta.url),
      fetchImpl: async (url, options = {}) => {
        const auth = options.headers?.authorization || "";
        const path = new URL(url).pathname;
        if (path === "/client/v4/zones") {
          return Response.json({ success: true, result: [{ id: "zone-123", name: "clientsurgesystems.com" }] });
        }
        if (path === "/client/v4/zones/zone-123/workers/routes" && auth.includes("env-token")) {
          return Response.json(
            { success: false, errors: [{ code: 10000, message: "Authentication error" }] },
            { status: 403 }
          );
        }
        if (path === "/client/v4/zones/zone-123/workers/routes") {
          return Response.json({
            success: true,
            result: [
              { id: "route-1", pattern: "clientsurgesystems.com/*", script: "clientsurge-security-edge" },
              { id: "route-2", pattern: "www.clientsurgesystems.com/*", script: "clientsurge-security-edge" },
            ],
          });
        }
        if (path === "/client/v4/zones/zone-123/rulesets" && auth.includes("env-token")) {
          return Response.json({ success: true, result: [] });
        }
        return Response.json(
          { success: false, errors: [{ code: 10000, message: "Authentication error" }] },
          { status: 403 }
        );
      },
    });

    assert.equal(report.probes.zone.token_source, "env");
    assert.equal(report.probes.worker_routes.token_source, "wrangler_oauth");
    assert.deepEqual(report.probes.worker_routes.attempted_sources, ["env", "wrangler_oauth"]);
    assert.equal(report.probes.rulesets.token_source, "env");
    assert.deepEqual(report.next_action.denied_probes, ["dns-records", "custom-hostnames"]);
    assert.deepEqual(report.next_action.readable_probes, ["rulesets"]);
    assert.doesNotMatch(JSON.stringify(report), /env-token|test-token/);
  } finally {
    if (previous === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
    else process.env.CLOUDFLARE_API_TOKEN = previous;
  }
});

test("Cloudflare route-bypass diagnostic surfaces concrete DNS custom-hostname and ruleset candidates when readable", async () => {
  const report = await diagnoseRouteBypass({
    configPath: new URL("./fixtures/wrangler-oauth.toml", import.meta.url),
    fetchImpl: async (url) => {
      const requestUrl = new URL(url);
      const path = requestUrl.pathname;
      if (path === "/client/v4/zones") {
        return Response.json({ success: true, result: [{ id: "zone-123", name: "clientsurgesystems.com" }] });
      }
      if (path === "/client/v4/zones/zone-123/workers/routes") {
        return Response.json({
          success: true,
          result: [
            { id: "route-1", pattern: "clientsurgesystems.com/*", script: "clientsurge-security-edge" },
            { id: "route-2", pattern: "www.clientsurgesystems.com/*", script: "clientsurge-security-edge" },
          ],
        });
      }
      if (path === "/client/v4/zones/zone-123/dns_records") {
        return Response.json({
          success: true,
          result: [
            {
              id: "dns-1",
              type: "CNAME",
              name: "clientsurgesystems.com",
              content: "client-surge.base44.app",
              proxied: true,
              ttl: 1,
            },
            {
              id: "dns-2",
              type: "TXT",
              name: "_verification.clientsurgesystems.com",
              content: "safe-to-ignore",
              proxied: false,
            },
          ],
        });
      }
      if (path === "/client/v4/zones/zone-123/custom_hostnames") {
        return Response.json({
          success: true,
          result: [
            {
              id: "host-1",
              hostname: "clientsurgesystems.com",
              status: "active",
              ssl: { status: "active" },
              custom_origin_server: "client-surge.base44.app",
            },
          ],
        });
      }
      if (path === "/client/v4/zones/zone-123/rulesets") {
        return Response.json({
          success: true,
          result: [
            {
              id: "ruleset-1",
              name: "redirects",
              phase: "http_request_dynamic_redirect",
              rules: [
                {
                  id: "rule-1",
                  description: "www canonical redirect for clientsurgesystems.com",
                  action: "redirect",
                  expression: '(http.host eq "www.clientsurgesystems.com")',
                  enabled: true,
                },
              ],
            },
          ],
        });
      }
      return Response.json({ success: true, result: [] });
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.next_action.status, "inspect_bypass_candidates");
  assert.equal(report.analysis.dns_records.length, 1);
  assert.deepEqual(report.analysis.dns_records[0].risk_flags, ["proxied", "proxied_cname", "base44_target"]);
  assert.equal(report.analysis.custom_hostnames.length, 1);
  assert.equal(report.analysis.rulesets.length, 1);
  assert.ok(report.analysis.candidates.some((candidate) => candidate.source === "dns_records"));
  assert.ok(report.analysis.candidates.some((candidate) => candidate.source === "custom_hostnames"));
  assert.ok(report.analysis.candidates.some((candidate) => candidate.source === "rulesets"));

  const formatted = formatRouteBypassDiagnosis(report);
  assert.match(formatted, /Bypass candidates:/);
  assert.match(formatted, /CNAME clientsurgesystems\.com -> client-surge\.base44\.app/);
  assert.match(formatted, /http_request_dynamic_redirect/);
});
