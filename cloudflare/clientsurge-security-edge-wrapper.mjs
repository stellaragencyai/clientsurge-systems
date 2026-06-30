import edgeWorker, {
  repairPublicRouteMetadata,
} from "./clientsurge-security-edge-worker.mjs";

export const ROUTE_EXPOSURE_SANITIZED_HEADER = "x-clientsurge-route-exposure-sanitized";
export const ROUTE_EXPOSURE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";
export const ROUTE_EXPOSURE_SANITIZER_VERSION = "2026-06-30T23-12Z";
export const APP_SHELL_FALLBACK_HEADER = "x-clientsurge-app-shell-fallback";
export const APP_SHELL_FALLBACK_VERSION = "2026-06-30T23-47Z";

const INTERNAL_ROUTE_WORDS = [
  "Admin Dashboard",
  "Admin / AI Status Dashboard",
  "Admin / System Runbook",
  "Admin / Task Status Dashboard",
  "Admin / Conversion Insights",
  "Business Setup",
  "Client Portal",
  "Client Dashboard",
  "Client Dashboard Entry",
  "Client Saas Dashboard",
  "Client Setup Lookup",
  "Setup Status",
  "Website Preview",
  "Function Audit",
  "System Observability",
  "Reconciliation",
  "Mission Control",
  "SaaS Admin",
  "AI Status Dashboard",
  "Onboarding Pipeline",
  "Opportunity Review Queue",
  "Automation Health",
];

const GENERATED_BASE44_COPY = /ClientSurge Systems manages \d+ data types|Premium AI-driven automation systems built to increase bookings|organize, track, and share your work in 1 place|including launch gates/i;
const GENERATED_DIRECTORY_PATTERN = /(?:ClientSurge Systems manages \d+ data types|Premium AI-driven automation systems built to increase bookings|organize, track, and share your work in 1 place|including launch gates|<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>|>\s*Pages\s*<)/i;
const INTERNAL_TEXT_PATTERN = new RegExp(INTERNAL_ROUTE_WORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const INTERNAL_ROUTE_TERMS = /Admin\s*(?:\/\s*)?(?:Dashboard|AI Status Dashboard|System Runbook|Task Status Dashboard|Conversion Insights)|Business Setup|Client Portal|Client Dashboard|Client Saas Dashboard|Client Setup Lookup|Setup Status|Website Preview|Function Audit|System Observability|Reconciliation|Mission Control|SaaS Admin|AI Status Dashboard|Onboarding Pipeline|Opportunity Review Queue|Automation Health/i;
const INTERNAL_HREF_PATTERN = /<a\b[^>]*href=["']\/(?:admin|dashboard|client-portal|client-dashboard|client-saas|dashboard-entry|setup|internal|functions|function|mission-control|observability|reconciliation|saas|lead-intelligence|sam|medspa-dashboard)[^"']*["'][\s\S]*?<\/a>/gi;

const APP_SHELL_BLOCKED_PATH_PATTERN = /^\/(?:admin|dashboard|client|client-portal|client-dashboard|client-saas|dashboard-entry|onboarding|setup|functions?|function|internal|private|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard|motion-lab)(?:\/|$)/i;
const APP_SHELL_ASSET_PATH_PATTERN = /\.(?:js|mjs|css|map|json|png|jpe?g|gif|svg|webp|ico|txt|xml|woff2?|ttf|otf|wasm|pdf|zip)(?:$|\?)/i;

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0];
  const normalized = value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  return normalized || "/";
}

function acceptsHtmlNavigation(request) {
  const accept = request.headers.get("accept") || "";
  const mode = request.headers.get("sec-fetch-mode") || "";
  return accept.includes("text/html") || mode === "navigate" || accept === "";
}

function isAppShellFallbackEligibleRequest(request) {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (!acceptsHtmlNavigation(request)) return false;

  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);
  if (pathname === "/") return false;
  if (APP_SHELL_ASSET_PATH_PATTERN.test(pathname)) return false;
  if (APP_SHELL_BLOCKED_PATH_PATTERN.test(pathname)) return false;
  if (pathname.startsWith("/.well-known/")) return false;
  return true;
}

function shouldUseAppShellFallback(request, response, error = null) {
  if (!isAppShellFallbackEligibleRequest(request)) return false;
  if (error) return true;
  if (!response) return true;

  const contentType = response.headers.get("content-type") || "";
  if (response.status >= 400) return true;
  if (contentType.includes("text/plain") && /cache|miss|not found|error/i.test(response.statusText || "")) return true;
  return false;
}

async function fetchAppShellFallback(request, env, ctx) {
  const originalUrl = new URL(request.url);
  const originalPathname = normalizePathname(originalUrl.pathname);
  const fallbackUrl = new URL(request.url);
  fallbackUrl.pathname = "/";
  fallbackUrl.search = "";
  fallbackUrl.hash = "";

  const fallbackRequest = new Request(fallbackUrl.toString(), request);
  const fallbackResponse = await edgeWorker.fetch(fallbackRequest, env, ctx);
  const headers = new Headers(fallbackResponse.headers);
  const contentType = headers.get("content-type") || "";

  headers.set(APP_SHELL_FALLBACK_HEADER, `${APP_SHELL_FALLBACK_VERSION}; from=${originalPathname}`);
  headers.set("Cache-Control", "no-store, max-age=0");

  if (!contentType.includes("text/html")) {
    return new Response(fallbackResponse.body, {
      status: fallbackResponse.status,
      statusText: fallbackResponse.statusText,
      headers,
    });
  }

  let html = await fallbackResponse.text();
  html = repairPublicRouteMetadata(html, originalPathname);

  return new Response(html, {
    status: 200,
    statusText: "OK",
    headers,
  });
}

export function looksLikeRouteExposureHtml(html = "") {
  const text = String(html || "");
  return (
    (GENERATED_DIRECTORY_PATTERN.test(text) && (INTERNAL_TEXT_PATTERN.test(text) || GENERATED_BASE44_COPY.test(text))) ||
    (GENERATED_BASE44_COPY.test(text) && INTERNAL_TEXT_PATTERN.test(text))
  );
}

function removePatterns(html, patterns) {
  let nextHtml = html;
  for (const pattern of patterns) {
    nextHtml = nextHtml.replace(pattern, "");
  }
  return nextHtml;
}

export function sanitizeGeneratedPagesDirectoryHtml(html = "") {
  let nextHtml = String(html || "");
  const internalTermsSource = INTERNAL_ROUTE_TERMS.source;
  const generatedCopySource = GENERATED_BASE44_COPY.source;

  // Remove full generated app-builder wrappers when possible.
  nextHtml = removePatterns(nextHtml, [
    new RegExp(`<section\\b[^>]*>[\\s\\S]{0,12000}<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>[\\s\\S]{0,24000}?(?:${internalTermsSource})[\\s\\S]{0,12000}?<\\/section>`, "gi"),
    new RegExp(`<main\\b[^>]*>[\\s\\S]{0,12000}<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>[\\s\\S]{0,24000}?(?:${internalTermsSource})[\\s\\S]{0,12000}?<\\/main>`, "gi"),
  ]);

  // Remove the common Base44 generated intro that appears immediately before the Pages directory.
  nextHtml = nextHtml.replace(
    new RegExp(`<h[1-4][^>]*>\\s*ClientSurge Systems\\s*<\\/h[1-4]>\\s*<(?:p|div)[^>]*>[\\s\\S]{0,2600}?(?:${generatedCopySource})[\\s\\S]{0,2600}?<\\/(?:p|div)>\\s*(?=<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>)`, "gi"),
    "",
  );

  // Hard remove any generated Pages list. There should be no public-facing Pages
  // directory on the production homepage, regardless of whether the list includes
  // only public links or a mix of public and internal links.
  nextHtml = removePatterns(nextHtml, [
    /<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>\s*<(ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi,
    new RegExp(`<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>\\s*<(nav|section|div)\\b[^>]*>[\\s\\S]{0,36000}?(?:${internalTermsSource})[\\s\\S]{0,36000}?<\\/\\1>`, "gi"),
    new RegExp(`(?:<h[1-4][^>]*>\\s*ClientSurge Systems\\s*<\\/h[1-4]>\\s*<(?:p|div)[^>]*>[\\s\\S]{0,2400}?(?:${generatedCopySource})[\\s\\S]{0,2400}?<\\/(?:p|div)>\\s*)?<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>\\s*<(ul|ol|nav|section|div)\\b[^>]*>[\\s\\S]{0,36000}?(?:${internalTermsSource})[\\s\\S]{0,36000}?<\\/\\1>`, "gi"),
  ]);

  // If the generated intro survived because the list was removed separately,
  // remove only that intro block.
  nextHtml = nextHtml.replace(
    new RegExp(`<h[1-4][^>]*>\\s*ClientSurge Systems\\s*<\\/h[1-4]>\\s*<(?:p|div)[^>]*>[\\s\\S]{0,2400}?(?:${generatedCopySource})[\\s\\S]{0,2400}?<\\/(?:p|div)>`, "gi"),
    "",
  );

  // Defense in depth: remove any remaining public anchor to private/internal
  // surfaces from the raw HTML.
  nextHtml = nextHtml.replace(INTERNAL_HREF_PATTERN, "");
  return nextHtml;
}

const EDGE_GUARD_SCRIPT = `<script id="${ROUTE_EXPOSURE_GUARD_SCRIPT_ID}">
(() => {
  if (window.__clientsurgeEdgeRouteExposureGuard) return;
  window.__clientsurgeEdgeRouteExposureGuard = true;
  const INTERNAL_PATH = /^\/(admin|dashboard|client|client-portal|client-dashboard|client-saas|dashboard-entry|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|$)/i;
  const INTERNAL_TEXT = /\b(Admin Dashboard|Admin\s*\/\s*AI Status Dashboard|Admin\s*\/\s*System Runbook|Admin\s*\/\s*Task Status Dashboard|Admin\s*\/\s*Conversion Insights|Business Setup|Client Portal|Client Dashboard|Client Saas Dashboard|Client Setup Lookup|Function Audit|System Observability|Reconciliation|Onboarding Pipeline|Install Guide|Mission Control|SaaS Admin|AI Status Dashboard|Performance Wars|Admin Settings|Lead Intelligence|Credentials Setup|Website Preview|Automation Health|Opportunity Review Queue)\b/i;
  const GENERATED_COPY = /ClientSurge Systems manages \d+ data types|Premium AI-driven automation systems built to increase bookings|organize, track, and share your work in 1 place|including launch gates/i;
  const MARKETING_START = /Automate Your Lead Flow|AI automation for local service businesses|Capture\. Follow Up\. Book\.|Compare Packages|Included Automations/i;
  const text = (node) => (node && node.textContent || '').replace(/\s+/g, ' ').trim();
  const hasInternalLink = (root) => Array.from(root.querySelectorAll?.('a[href]') || []).some((a) => {
    try { return INTERNAL_PATH.test(new URL(a.getAttribute('href'), location.origin).pathname); } catch { return false; }
  });
  const removeGeneratedDirectory = () => {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    for (const heading of headings) {
      if (text(heading).toLowerCase() !== 'pages') continue;
      const next = heading.nextElementSibling;
      if (next && /^(UL|OL|NAV|SECTION|DIV)$/i.test(next.tagName)) {
        let prev = heading.previousElementSibling;
        const previousNodes = [];
        while (prev && previousNodes.length < 3 && (GENERATED_COPY.test(text(prev)) || /^ClientSurge Systems$/i.test(text(prev)))) {
          previousNodes.push(prev);
          prev = prev.previousElementSibling;
        }
        next.remove();
        heading.remove();
        previousNodes.forEach((node) => node.remove());
        continue;
      }

      const container = heading.closest('section,aside,nav,div');
      const candidateText = text(container || heading.parentElement || heading);
      if (container && (hasInternalLink(container) || INTERNAL_TEXT.test(candidateText) || GENERATED_COPY.test(candidateText)) && !MARKETING_START.test(candidateText)) {
        container.setAttribute('data-clientsurge-edge-route-exposure-removed', 'true');
        container.remove();
      }
    }
    for (const a of Array.from(document.querySelectorAll('a[href]'))) {
      let url;
      try { url = new URL(a.getAttribute('href'), location.origin); } catch { continue; }
      if (!INTERNAL_PATH.test(url.pathname)) continue;
      a.setAttribute('rel', 'nofollow noopener noreferrer');
      a.setAttribute('aria-hidden', 'true');
      a.tabIndex = -1;
      a.style.display = 'none';
    }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', removeGeneratedDirectory, { once: true });
  else removeGeneratedDirectory();
  const observer = new MutationObserver(removeGeneratedDirectory);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 120000);
})();
</script>`;

export function injectEdgeRouteExposureGuard(html = "") {
  if (html.includes(ROUTE_EXPOSURE_GUARD_SCRIPT_ID)) return html;
  if (html.includes("</body>")) return html.replace("</body>", `${EDGE_GUARD_SCRIPT}\n</body>`);
  return `${html}\n${EDGE_GUARD_SCRIPT}`;
}

function shouldSanitizeHtml(request, response) {
  if (request.method !== "GET") return false;
  return (response.headers.get("content-type") || "").includes("text/html");
}

export default {
  async fetch(request, env, ctx) {
    let response;
    try {
      response = await edgeWorker.fetch(request, env, ctx);
    } catch (error) {
      if (!shouldUseAppShellFallback(request, null, error)) throw error;
      response = await fetchAppShellFallback(request, env, ctx);
    }

    if (shouldUseAppShellFallback(request, response)) {
      response = await fetchAppShellFallback(request, env, ctx);
    }

    if (!shouldSanitizeHtml(request, response)) return response;

    const html = await response.text();
    const sanitizedHtml = sanitizeGeneratedPagesDirectoryHtml(html);
    const guardedHtml = injectEdgeRouteExposureGuard(sanitizedHtml);
    const headers = new Headers(response.headers);
    headers.set(ROUTE_EXPOSURE_SANITIZED_HEADER, looksLikeRouteExposureHtml(html) ? "removed" : "armed");
    headers.set("x-clientsurge-route-exposure-version", ROUTE_EXPOSURE_SANITIZER_VERSION);
    headers.set("Cache-Control", "no-store, max-age=0");

    return new Response(guardedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};