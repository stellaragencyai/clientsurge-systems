import baseSecurityEdge, {
  repairPublicRouteMetadata,
} from "./clientsurge-security-edge-worker.mjs";
import productSignupHotfix from "./clientsurge-product-signup-edge-hotfix.mjs";

const SAFE_ENTRY_VERSION = "2026-07-17-client-portal-edge-v1";
const SANITIZED_HEADER = "x-clientsurge-route-exposure-sanitized";
const APP_SHELL_FALLBACK_HEADER = "x-clientsurge-app-shell-fallback";
const CLIENT_PORTAL_EDGE_HEADER = "x-clientsurge-client-portal-edge";
const CLIENT_DASHBOARD_REDIRECT_HEADER = "x-clientsurge-client-dashboard-redirect";

const GENERATED_DIRECTORY_SIGNAL = /(?:ClientSurge Systems manages\s+\d+\s+data types|manages\s+\d+\s+data types|including launch gates|organize, track, and share your work|available pages|app pages|Premium AI-driven automation systems built to increase bookings)/i;
const PAGES_HEADING_PATTERN = /<h[1-4][^>]*>\s*(?:Pages|Available Pages|App Pages|All Pages)\s*<\/h[1-4]>/i;
const STATIC_FALLBACK_PATTERN = /<main\b[^>]*class=["'][^"']*\bstatic-fallback\b[^"']*["'][^>]*>/i;
const ROOT_OPEN_PATTERN = /<div\b[^>]*\bid=["']root["'][^>]*>/i;
const BODY_OPEN_PATTERN = /<body\b[^>]*>/i;
const REACT_BOOTSTRAP_PATTERN = /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["'][^"']+["'][^>]*><\/script>/i;

// Private/internal routes still fail closed. The canonical client portal is
// intentionally excluded so the SPA shell can render and Base44 auth can gate it.
const PRIVATE_PATH_PATTERN = /^\/(?:admin|dashboard|client-saas|dashboard-entry|onboarding|setup|functions?|function|internal|private|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44)(?:\/|$)/i;
const CLIENT_PORTAL_PATH_PATTERN = /^\/(?:client-portal|ClientPortal)\/?$/;
const CLIENT_DASHBOARD_PATH_PATTERN = /^\/(?:client-dashboard|ClientDashboard)\/?$/;
const ASSET_PATH_PATTERN = /\.(?:js|mjs|css|map|json|png|jpe?g|gif|svg|webp|ico|txt|xml|woff2?|ttf|otf|wasm|pdf|zip)(?:$|\?)/i;

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0];
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value || "/";
}

function isProductSignupRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const pathname = normalizePathname(new URL(request.url).pathname);
  return pathname === "/product-signup" || pathname === "/product-sign-up";
}

function isClientPortalPath(pathname = "/") {
  return CLIENT_PORTAL_PATH_PATTERN.test(normalizePathname(pathname));
}

function isLegacyClientDashboardPath(pathname = "/") {
  return CLIENT_DASHBOARD_PATH_PATTERN.test(normalizePathname(pathname));
}

function isHtmlResponse(response) {
  return (response.headers.get("content-type") || "").includes("text/html");
}

function containsGeneratedDirectory(value = "") {
  const text = String(value || "");
  return GENERATED_DIRECTORY_SIGNAL.test(text) || PAGES_HEADING_PATTERN.test(text);
}

function visibleHtmlOnly(html = "") {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function containsVisibleGeneratedDirectory(html = "") {
  return containsGeneratedDirectory(visibleHtmlOnly(html));
}

export function stripInjectedDirectoryBeforeRoot(html = "") {
  const source = String(html || "");
  const bodyMatch = BODY_OPEN_PATTERN.exec(source);
  const rootMatch = ROOT_OPEN_PATTERN.exec(source);

  if (!bodyMatch || !rootMatch) return { html: source, changed: false, reason: "markers_missing" };

  const bodyContentStart = bodyMatch.index + bodyMatch[0].length;
  const rootStart = rootMatch.index;
  if (rootStart <= bodyContentStart) return { html: source, changed: false, reason: "invalid_marker_order" };

  const injectedSegment = source.slice(bodyContentStart, rootStart);
  if (!containsGeneratedDirectory(injectedSegment)) return { html: source, changed: false, reason: "no_directory_before_root" };

  return {
    html: source.slice(0, bodyContentStart) + "\n" + source.slice(rootStart),
    changed: true,
    reason: "removed_directory_before_root",
  };
}

export function stripInjectedDirectoryBeforeFallback(html = "") {
  const source = String(html || "");
  const rootMatch = ROOT_OPEN_PATTERN.exec(source);
  const fallbackMatch = STATIC_FALLBACK_PATTERN.exec(source);

  if (!rootMatch || !fallbackMatch) return { html: source, changed: false, reason: "markers_missing" };

  const rootContentStart = rootMatch.index + rootMatch[0].length;
  const fallbackStart = fallbackMatch.index;
  if (fallbackStart <= rootContentStart) return { html: source, changed: false, reason: "invalid_marker_order" };

  const injectedSegment = source.slice(rootContentStart, fallbackStart);
  if (!containsGeneratedDirectory(injectedSegment)) return { html: source, changed: false, reason: "no_directory_before_fallback" };

  return {
    html: source.slice(0, rootContentStart) + "\n" + source.slice(fallbackStart),
    changed: true,
    reason: "removed_directory_before_fallback",
  };
}

function removeResidualDirectoryBlocks(html = "") {
  let next = String(html || "");

  next = next.replace(
    /<h[1-4][^>]*>\s*(?:Pages|Available Pages|App Pages|All Pages)\s*<\/h[1-4]>\s*<(ul|ol|nav|section)\b[^>]*>[\s\S]*?<\/\1>/gi,
    "",
  );

  next = next.replace(
    /<(p|div|span)\b[^>]*>[^<]*(?:ClientSurge Systems manages\s+\d+\s+data types|manages\s+\d+\s+data types|including launch gates|organize, track, and share your work|Premium AI-driven automation systems built to increase bookings)[\s\S]*?<\/\1>/gi,
    "",
  );

  return next;
}

function sanitizeHtmlString(html = "", pathname = "/") {
  const originalHtml = String(html || "");
  const outsideRoot = stripInjectedDirectoryBeforeRoot(originalHtml);
  const beforeFallback = stripInjectedDirectoryBeforeFallback(outsideRoot.html);
  const withoutResiduals = removeResidualDirectoryBlocks(beforeFallback.html);
  const sanitizedHtml = repairPublicRouteMetadata(withoutResiduals, pathname);

  if (REACT_BOOTSTRAP_PATTERN.test(originalHtml) && !REACT_BOOTSTRAP_PATTERN.test(sanitizedHtml)) {
    return {
      html: repairPublicRouteMetadata(originalHtml, pathname),
      changed: false,
      reason: "aborted-bootstrap-protection",
      exposureRemaining: containsVisibleGeneratedDirectory(originalHtml),
    };
  }

  return {
    html: sanitizedHtml,
    changed: sanitizedHtml !== originalHtml,
    reason: beforeFallback.changed
      ? beforeFallback.reason
      : outsideRoot.changed
        ? outsideRoot.reason
        : sanitizedHtml !== originalHtml
          ? "removed_residual_or_repaired_metadata"
          : "not_detected",
    exposureRemaining: containsVisibleGeneratedDirectory(sanitizedHtml),
  };
}

export async function sanitizeHtmlResponse(request, response, options = {}) {
  if (!isHtmlResponse(response)) return response;

  const pathname = normalizePathname(options.pathname || new URL(request.url).pathname);
  const originalHtml = await response.text();
  const result = sanitizeHtmlString(originalHtml, pathname);
  const headers = new Headers(response.headers);
  const clientPortal = options.clientPortal === true || isClientPortalPath(pathname);

  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.delete("last-modified");
  headers.set(
    SANITIZED_HEADER,
    result.exposureRemaining
      ? "exposure-remains"
      : result.changed
        ? "removed-preserved-react"
        : "not-detected",
  );
  headers.set("x-clientsurge-safe-entry-version", SAFE_ENTRY_VERSION);
  headers.set("x-clientsurge-safe-entry-reason", result.reason);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("Cache-Control", "no-store, max-age=0");

  if (options.appShellFallback) {
    headers.set(APP_SHELL_FALLBACK_HEADER, `${SAFE_ENTRY_VERSION}; from=${pathname}`);
  }

  if (clientPortal || options.noindex) {
    headers.set("x-robots-tag", "noindex, nofollow");
  }

  if (clientPortal) {
    headers.set(CLIENT_PORTAL_EDGE_HEADER, "app-shell");
  }

  return new Response(request.method === "HEAD" ? null : result.html, {
    status: options.status || response.status,
    statusText: options.status ? "OK" : response.statusText,
    headers,
  });
}

function acceptsHtmlNavigation(request) {
  const accept = request.headers.get("accept") || "";
  const mode = request.headers.get("sec-fetch-mode") || "";
  return accept.includes("text/html") || mode === "navigate" || accept === "";
}

function isRecoverablePublicNavigation(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (!acceptsHtmlNavigation(request)) return false;

  const pathname = normalizePathname(new URL(request.url).pathname);
  if (isClientPortalPath(pathname)) return true;
  if (pathname === "/") return false;
  if (PRIVATE_PATH_PATTERN.test(pathname)) return false;
  if (ASSET_PATH_PATTERN.test(pathname)) return false;
  if (pathname.startsWith("/.well-known/")) return false;
  return true;
}

function shouldRecoverAppShell(request, response) {
  if (!isRecoverablePublicNavigation(request)) return false;
  if (!response) return true;
  if (response.status >= 400) return true;
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("text/plain") && /cache|miss|not found|error/i.test(response.statusText || "");
}

async function fetchRootAppShell(request, env, ctx) {
  const originalPathname = normalizePathname(new URL(request.url).pathname);
  const rootUrl = new URL(request.url);
  rootUrl.pathname = "/";
  rootUrl.search = "";
  rootUrl.hash = "";

  const rootRequest = new Request(rootUrl.toString(), {
    method: "GET",
    headers: request.headers,
    redirect: "manual",
  });
  const rootResponse = await baseSecurityEdge.fetch(rootRequest, env, ctx);

  if (rootResponse.status >= 400 || !isHtmlResponse(rootResponse)) return null;

  return sanitizeHtmlResponse(request, rootResponse, {
    pathname: originalPathname,
    status: 200,
    appShellFallback: true,
    clientPortal: isClientPortalPath(originalPathname),
    noindex: isClientPortalPath(originalPathname),
  });
}

function buildClientDashboardRedirect(request) {
  const url = new URL(request.url);
  url.pathname = "/client-portal";
  const headers = new Headers({
    Location: url.toString(),
    "Cache-Control": "no-store, max-age=0",
    "x-robots-tag": "noindex, nofollow",
  });
  headers.set(CLIENT_DASHBOARD_REDIRECT_HEADER, "canonical-client-portal");
  return new Response(null, { status: 308, statusText: "Permanent Redirect", headers });
}

export default {
  async fetch(request, env, ctx) {
    const pathname = normalizePathname(new URL(request.url).pathname);

    if (isLegacyClientDashboardPath(pathname)) {
      return buildClientDashboardRedirect(request);
    }

    if (isProductSignupRequest(request)) {
      const response = await productSignupHotfix.fetch(request, env, ctx);
      return sanitizeHtmlResponse(request, response, { pathname });
    }

    let response;
    try {
      response = await baseSecurityEdge.fetch(request, env, ctx);
    } catch (error) {
      const fallback = await fetchRootAppShell(request, env, ctx).catch(() => null);
      if (fallback) return fallback;
      throw error;
    }

    if (shouldRecoverAppShell(request, response)) {
      const fallback = await fetchRootAppShell(request, env, ctx).catch(() => null);
      if (fallback) return fallback;
    }

    return sanitizeHtmlResponse(request, response, {
      pathname,
      clientPortal: isClientPortalPath(pathname),
      noindex: isClientPortalPath(pathname),
    });
  },
};
