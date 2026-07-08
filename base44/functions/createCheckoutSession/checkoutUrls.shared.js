export const CANONICAL_CHECKOUT_ORIGIN = "https://clientsurgesystems.com";

const TRUSTED_CHECKOUT_HOSTS = new Set([
  "clientsurgesystems.com",
  "www.clientsurgesystems.com",
  "grinning-apex-flow-growth.base44.app",
  "localhost",
  "127.0.0.1",
]);

function isTrustedCheckoutUrl(url) {
  if (!url) return false;
  if (!TRUSTED_CHECKOUT_HOSTS.has(url.hostname)) return false;
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
    return url.protocol === "http:" || url.protocol === "https:";
  }
  return url.protocol === "https:";
}

export function resolveTrustedCheckoutOrigin({ originHeader = "", requestUrl = "" } = {}) {
  for (const candidate of [originHeader, requestUrl]) {
    try {
      if (!candidate) continue;
      const url = new URL(candidate);
      if (isTrustedCheckoutUrl(url)) return url.origin;
    } catch {
      // Try the next candidate.
    }
  }

  return CANONICAL_CHECKOUT_ORIGIN;
}

function normalizePath(pathname = "/") {
  const value = String(pathname || "/");
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//")) return "/";
  return value;
}

function candidateUrlFor(candidate, trustedOrigin) {
  if (!candidate) return null;

  try {
    const url = new URL(String(candidate), trustedOrigin);
    if (url.origin !== trustedOrigin) return null;
    return url;
  } catch {
    return null;
  }
}

export function safeCheckoutUrl({
  candidate,
  trustedOrigin,
  fallbackPath,
  allowedPathPrefixes,
  requireSessionPlaceholder = false,
}) {
  const fallback = new URL(normalizePath(fallbackPath), trustedOrigin);
  const url = candidateUrlFor(candidate, trustedOrigin) || fallback;
  const allowed = (allowedPathPrefixes || [fallback.pathname]).some((prefix) =>
    url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
  );

  if (!allowed) return fallback.toString();

  if (requireSessionPlaceholder && !url.search.includes("{CHECKOUT_SESSION_ID}")) {
    return fallback.toString();
  }

  return url.toString();
}

export function buildCheckoutRedirectUrls({
  originHeader = "",
  requestUrl = "",
  packageKey = "growth_system",
  successUrl = "",
  cancelUrl = "",
} = {}) {
  const trustedOrigin = resolveTrustedCheckoutOrigin({ originHeader, requestUrl });
  const normalizedPackageKey = String(packageKey || "growth_system").trim() || "growth_system";
  const encodedPackage = encodeURIComponent(normalizedPackageKey);

  const defaultSuccessPath = "/order-success?session_id={CHECKOUT_SESSION_ID}";
  const defaultCancelPath = `/product-signup?package=${encodedPackage}`;

  return {
    origin: trustedOrigin,
    success_url: safeCheckoutUrl({
      candidate: successUrl,
      trustedOrigin,
      fallbackPath: defaultSuccessPath,
      allowedPathPrefixes: ["/order-success"],
      requireSessionPlaceholder: true,
    }),
    cancel_url: safeCheckoutUrl({
      candidate: cancelUrl,
      trustedOrigin,
      fallbackPath: defaultCancelPath,
      allowedPathPrefixes: ["/product-signup", "/pricing"],
      requireSessionPlaceholder: false,
    }),
  };
}

export const __testing = {
  TRUSTED_CHECKOUT_HOSTS,
  isTrustedCheckoutUrl,
};
