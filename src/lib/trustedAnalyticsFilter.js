/**
 * Trusted internal analytics filter — Step 1 cleanup.
 *
 * Prevents non-page technical requests and obvious automated traffic from
 * being counted as business website visitors in the app's internal
 * (Base44) analytics tracking.
 *
 * This filter is applied at the tracking call site (before
 * base44.analytics.track is invoked). It does NOT alter Base44 platform
 * analytics, GA4, Stripe, orders, leads, customers, or any production
 * records. It never fabricates metrics — when insufficient trusted data
 * exists, callers should surface "Insufficient trusted data." instead.
 *
 * The filter evaluates three signals:
 *   1. path     — the page/route being tracked
 *   2. userAgent — the browser/client identity
 *   3. referrer  — the referring URL (used for awareness, not auto-exclusion,
 *                  since same-site SPA navigation legitimately produces an
 *                  internal referrer)
 */

// Path prefixes that are never business page views.
const EXCLUDED_PATH_PREFIXES = [
  "/api",
  "/_functions",
  "/assets",
  "/static",
  "/_app",
  "/__",
  "/_generated",
];

// Exact paths that are infrastructure / SEO assets, not pages.
const EXCLUDED_EXACT_PATHS = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/site.webmanifest",
  "/manifest.json",
  "/sw.js",
  "/health",
  "/healthz",
  "/health-check",
  "/_health",
  "/ping",
  "/status",
]);

// Static asset file extensions — never a page view.
const EXCLUDED_STATIC_EXTENSIONS = [
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".css", ".map",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".avif",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".zip", ".txt", ".xml", ".json",
  ".mp4", ".webm", ".mp3", ".wav", ".ogg",
];

// Obvious automated / synthetic user agents.
const BOT_UA_PATTERNS = [
  "bot",
  "crawler",
  "spider",
  "headless",
  "curl",
  "wget",
  "lighthouse",
  "pagespeed",
  "preview",
  "monitor",
];

function normalizePath(path) {
  if (!path || typeof path !== "string") return "";
  return path.split("?")[0].split("#")[0].toLowerCase();
}

function hasExcludedExtension(path) {
  if (!path) return false;
  const lower = path.toLowerCase();
  return EXCLUDED_STATIC_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Returns true if the given path is a non-page technical request
 * (API route, static asset, favicon, robots.txt, sitemap, health check, etc.).
 */
export function isExcludedAnalyticsPath(path) {
  const normalized = normalizePath(path);
  if (!normalized) return true;
  if (EXCLUDED_EXACT_PATHS.has(normalized)) return true;
  if (EXCLUDED_PATH_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
    return true;
  }
  if (hasExcludedExtension(normalized)) return true;
  return false;
}

/**
 * Returns true if the user agent string matches obvious automated traffic
 * (bots, crawlers, spiders, headless browsers, curl/wget, lighthouse,
 * pagespeed, preview renderers, monitors). A missing user agent is also
 * treated as automated since real browsers always send one.
 */
export function isAutomatedUserAgent(userAgent) {
  const ua = String(userAgent || "").toLowerCase();
  if (!ua) return true;
  return BOT_UA_PATTERNS.some((pattern) => ua.includes(pattern));
}

/**
 * Returns true if the referrer is the same site (internal navigation).
 * This is exposed for dashboard awareness only — internal referrers are NOT
 * used to disqualify events, because legitimate SPA page-to-page navigation
 * produces an internal referrer.
 */
export function isInternalReferrer(referrer) {
  if (!referrer) return false;
  try {
    const ref = String(referrer).toLowerCase();
    const currentHost =
      typeof window !== "undefined" && window.location
        ? window.location.hostname
        : "";
    if (currentHost && ref.includes(currentHost)) return true;
    if (
      ref.includes("://localhost") ||
      ref.includes("127.0.0.1") ||
      ref.includes("preview-sandbox")
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function resolvePath(input) {
  if (input && typeof input.path === "string") return input.path;
  if (typeof window !== "undefined" && window.location) {
    return window.location.pathname;
  }
  return "";
}

function resolveUserAgent(input) {
  if (input && typeof input.userAgent === "string") return input.userAgent;
  if (typeof navigator !== "undefined" && navigator) {
    return navigator.userAgent || "";
  }
  return "";
}

function resolveReferrer(input) {
  if (input && typeof input.referrer === "string") return input.referrer;
  if (typeof document !== "undefined" && document) {
    return document.referrer || "";
  }
  return "";
}

/**
 * Returns the reason an event is disqualified from trusted analytics,
 * or null if the event is trusted.
 *
 * @param {{ path?: string, userAgent?: string, referrer?: string }} input
 * @returns {"excluded_path" | "automated_user_agent" | null}
 */
export function getTrustDisqualificationReason(input = {}) {
  const path = resolvePath(input);
  const userAgent = resolveUserAgent(input);

  if (isExcludedAnalyticsPath(path)) {
    return "excluded_path";
  }
  if (isAutomatedUserAgent(userAgent)) {
    return "automated_user_agent";
  }
  // Internal referrer alone does NOT disqualify — see isInternalReferrer docs.
  return null;
}

/**
 * Returns true if the event should be counted in trusted internal analytics.
 */
export function isTrustedAnalyticsEvent(input = {}) {
  return getTrustDisqualificationReason(input) === null;
}

/**
 * Convenience wrapper for page-view style checks.
 */
export function shouldTrackTrustedPageView(path) {
  return isTrustedAnalyticsEvent({ path });
}