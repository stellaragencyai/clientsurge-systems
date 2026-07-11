import baseSecurityEdge from "./clientsurge-security-edge-worker.mjs";
import productSignupHotfix from "./clientsurge-product-signup-edge-hotfix.mjs";

const SAFE_ENTRY_VERSION = "2026-07-11-preserve-react-v2";
const SANITIZED_HEADER = "x-clientsurge-route-exposure-sanitized";

const GENERATED_DIRECTORY_SIGNAL = /(?:ClientSurge Systems manages\s+\d+\s+data types|manages\s+\d+\s+data types|including launch gates|organize, track, and share your work|available pages|app pages)/i;
const PAGES_HEADING_PATTERN = /<h[1-4][^>]*>\s*(?:Pages|Available Pages|App Pages|All Pages)\s*<\/h[1-4]>/i;
const STATIC_FALLBACK_PATTERN = /<main\b[^>]*class=["'][^"']*\bstatic-fallback\b[^"']*["'][^>]*>/i;
const ROOT_OPEN_PATTERN = /<div\b[^>]*\bid=["']root["'][^>]*>/i;
const REACT_BOOTSTRAP_PATTERN = /<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["'][^"']+["'][^>]*><\/script>/i;

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0];
  return value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value || "/";
}

function isProductSignupRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const pathname = normalizePathname(new URL(request.url).pathname);
  return pathname === "/product-signup" || pathname === "/product-sign-up";
}

function isHtmlResponse(response) {
  return (response.headers.get("content-type") || "").includes("text/html");
}

function containsGeneratedDirectory(value = "") {
  const text = String(value || "");
  return GENERATED_DIRECTORY_SIGNAL.test(text) || PAGES_HEADING_PATTERN.test(text);
}

/**
 * Base44 can inject a generated page directory as a sibling immediately before
 * the app's static fallback inside #root. Remove only that injected segment.
 * Never replace <body>, #root, the static fallback, or the module bootstrap.
 */
export function stripInjectedDirectoryBeforeFallback(html = "") {
  const source = String(html || "");
  const rootMatch = ROOT_OPEN_PATTERN.exec(source);
  const fallbackMatch = STATIC_FALLBACK_PATTERN.exec(source);

  if (!rootMatch || !fallbackMatch) {
    return { html: source, changed: false, reason: "markers_missing" };
  }

  const rootContentStart = rootMatch.index + rootMatch[0].length;
  const fallbackStart = fallbackMatch.index;
  if (fallbackStart <= rootContentStart) {
    return { html: source, changed: false, reason: "invalid_marker_order" };
  }

  const injectedSegment = source.slice(rootContentStart, fallbackStart);
  if (!containsGeneratedDirectory(injectedSegment)) {
    return { html: source, changed: false, reason: "no_directory_before_fallback" };
  }

  return {
    html: source.slice(0, rootContentStart) + "\n" + source.slice(fallbackStart),
    changed: true,
    reason: "removed_directory_before_fallback",
  };
}

function removeResidualDirectoryBlocks(html = "") {
  let next = String(html || "");

  next = next.replace(
    /<h[1-4][^>]*>\s*(?:Pages|Available Pages|App Pages|All Pages)\s*<\/h[1-4]>\s*<(?:ul|ol|nav|section)\b[^>]*>[\s\S]*?<\/(?:ul|ol|nav|section)>/gi,
    "",
  );

  next = next.replace(
    /<p\b[^>]*>[^<]*(?:ClientSurge Systems manages\s+\d+\s+data types|manages\s+\d+\s+data types|including launch gates|organize, track, and share your work)[\s\S]*?<\/p>/gi,
    "",
  );

  return next;
}

export async function sanitizeHtmlResponse(request, response) {
  if (!isHtmlResponse(response)) return response;

  const originalHtml = await response.text();
  const firstPass = stripInjectedDirectoryBeforeFallback(originalHtml);
  const sanitizedHtml = removeResidualDirectoryBlocks(firstPass.html);
  const changed = sanitizedHtml !== originalHtml;

  // Safety invariant: never ship a "repair" that deletes the React bootstrap.
  // If the origin had a module bootstrap but the sanitized output does not,
  // return the untouched origin response instead of breaking the website.
  if (REACT_BOOTSTRAP_PATTERN.test(originalHtml) && !REACT_BOOTSTRAP_PATTERN.test(sanitizedHtml)) {
    const rollbackHeaders = new Headers(response.headers);
    rollbackHeaders.set(SANITIZED_HEADER, "aborted-bootstrap-protection");
    rollbackHeaders.set("x-clientsurge-safe-entry-version", SAFE_ENTRY_VERSION);
    return new Response(request.method === "HEAD" ? null : originalHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: rollbackHeaders,
    });
  }

  const headers = new Headers(response.headers);
  headers.set(SANITIZED_HEADER, changed ? "removed-preserved-react" : "not-detected");
  headers.set("x-clientsurge-safe-entry-version", SAFE_ENTRY_VERSION);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("Cache-Control", "no-store, max-age=0");

  return new Response(request.method === "HEAD" ? null : sanitizedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    // Preserve the existing emergency checkout route without sending every
    // other public page through the destructive full-replacement wrapper.
    if (isProductSignupRequest(request)) {
      return productSignupHotfix.fetch(request, env, ctx);
    }

    const response = await baseSecurityEdge.fetch(request, env, ctx);
    return sanitizeHtmlResponse(request, response);
  },
};
