import edgeWorker, {
  repairPublicRouteMetadata,
} from "./clientsurge-security-edge-worker.mjs";

export const ROUTE_EXPOSURE_SANITIZED_HEADER = "x-clientsurge-route-exposure-sanitized";
export const ROUTE_EXPOSURE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";
export const ROUTE_EXPOSURE_SANITIZER_VERSION = "2026-06-30T23-12Z";
export const APP_SHELL_FALLBACK_HEADER = "x-clientsurge-app-shell-fallback";
export const APP_SHELL_FALLBACK_VERSION = "2026-06-30T23-47Z";
export const HOMEPAGE_REPAIR_HEADER = "x-clientsurge-homepage-repair";
export const HOMEPAGE_REPAIR_VERSION = "2026-06-30T23-58Z";

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

const EMERGENCY_HOMEPAGE_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#ffffff" />
    <meta name="robots" content="index,follow" />
    <meta name="description" content="ClientSurge Systems installs AI automation for local service businesses: lead capture, missed-call recovery, AI follow-up, booking automation, reviews, and lead reactivation." />
    <link rel="canonical" href="https://clientsurgesystems.com/" />
    <meta property="og:title" content="ClientSurge Systems | AI Automation for Local Businesses" />
    <meta property="og:description" content="Capture leads, follow up instantly, book appointments, and recover revenue that normally slips through the cracks." />
    <meta property="og:url" content="https://clientsurgesystems.com/" />
    <meta property="og:type" content="website" />
    <title>ClientSurge Systems | AI Automation for Local Businesses</title>
    <style>
      :root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; background: radial-gradient(circle at 20% 10%, rgba(0,174,239,.13), transparent 35%), linear-gradient(135deg,#f7fbff 0%,#ffffff 48%,#eef8ff 100%); color: #07111f; }
      .shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }
      header, footer { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 24px 0; }
      .brand { color: #07111f; font-weight: 950; letter-spacing: -.04em; text-decoration: none; font-size: 21px; }
      nav { display: flex; flex-wrap: wrap; gap: 14px; }
      a { color: #075985; font-weight: 800; text-decoration: none; }
      .hero { display: grid; grid-template-columns: minmax(0,1.08fr) minmax(280px,.92fr); gap: 42px; align-items: center; padding: clamp(56px, 8vw, 96px) 0 clamp(44px, 7vw, 72px); }
      .eyebrow { margin: 0 0 14px; color: #0079cc; font-size: 13px; font-weight: 950; letter-spacing: .15em; text-transform: uppercase; }
      h1 { margin: 0; max-width: 820px; font-size: clamp(42px, 7vw, 82px); line-height: .94; letter-spacing: -.07em; }
      .lede { max-width: 760px; margin: 22px 0 0; color: #475569; font-size: clamp(18px, 2vw, 22px); line-height: 1.65; }
      .actions, .bullets { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
      .button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; border-radius: 999px; padding: 0 22px; background: linear-gradient(135deg,#003b8f,#00aeef); color: #fff !important; font-weight: 950; box-shadow: 0 14px 32px rgba(0, 109, 255, .22); }
      .button.secondary { background: #fff; color: #0f172a !important; border: 1px solid #cbd5e1; box-shadow: none; }
      .bullets span, .panel { border: 1px solid #dbe7e4; background: rgba(255,255,255,.9); }
      .bullets span { border-radius: 999px; padding: 8px 12px; color: #334155; font-size: 14px; font-weight: 700; }
      .panel { border-radius: 28px; padding: 30px; box-shadow: 0 24px 70px rgba(15,23,42,.12); }
      .panel h2 { margin: 0 0 14px; color: #0f172a; font-size: 30px; letter-spacing: -.045em; }
      .panel p, footer p { color: #475569; line-height: 1.65; }
      ul { margin: 18px 0 0; padding: 0; list-style: none; display: grid; gap: 12px; color: #334155; }
      li strong { color: #0f172a; }
      .warning { margin-top: 18px; padding: 14px 16px; border-radius: 18px; background: #eff6ff; color: #1e3a8a; font-size: 14px; font-weight: 750; }
      @media (max-width: 820px) { header, footer, .hero { display: block; } nav { margin-top: 16px; } .hero { padding-top: 42px; } .panel { margin-top: 28px; } }
    </style>
  </head>
  <body>
    <main class="shell" aria-label="ClientSurge Systems homepage">
      <header>
        <a class="brand" href="/">ClientSurge Systems</a>
        <nav aria-label="Public navigation">
          <a href="/pricing">Pricing</a>
          <a href="/automations">Automations</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>
      <section class="hero" aria-labelledby="home-heading">
        <div>
          <p class="eyebrow">Automate Your Lead Flow</p>
          <h1 id="home-heading">Capture. Follow Up. Book.</h1>
          <p class="lede">ClientSurge installs AI automation systems for local service businesses that need faster lead response, missed-call recovery, follow-up, booking, reviews, and reactivation.</p>
          <div class="actions">
            <a class="button" href="/pricing">Compare Packages</a>
            <a class="button secondary" href="/contact">Start With Contact</a>
          </div>
          <div class="bullets" aria-label="Key automations">
            <span>Lead capture</span>
            <span>Missed-call recovery</span>
            <span>AI follow-up</span>
            <span>Booking automation</span>
            <span>Review requests</span>
            <span>Lead reactivation</span>
          </div>
        </div>
        <aside class="panel" aria-label="ClientSurge packages">
          <h2>Starter, Growth, and Pro</h2>
          <p>Clear AI automation packages for local service businesses that cannot afford to lose leads to slow response.</p>
          <ul>
            <li><strong>Starter System:</strong> $797 setup + $497/month.</li>
            <li><strong>Growth System:</strong> $1,297 setup + $997/month.</li>
            <li><strong>Pro System:</strong> $2,497 setup + $1,997/month.</li>
          </ul>
          <p class="warning">Emergency edge fallback is active while the Base44 route shell is being repaired.</p>
        </aside>
      </section>
      <footer>
        <p>ClientSurge Systems builds AI automation systems for local service businesses.</p>
        <nav aria-label="Legal navigation">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
          <a href="/sms-terms">SMS Terms</a>
          <a href="/refund-policy">Refund Policy</a>
        </nav>
      </footer>
    </main>
  </body>
</html>`;

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
    (GENERATED_BASE44_COPY.test(text) && INTERNAL_TEXT_PATTERN.test(text)) ||
    (GENERATED_DIRECTORY_PATTERN.test(text) && /<a\b[^>]*href=["']\/(?:admin|dashboard|client|setup|store|book|login)[^"']*["']/i.test(text))
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

  nextHtml = removePatterns(nextHtml, [
    new RegExp(`<section\\b[^>]*>[\\s\\S]{0,12000}<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>[\\s\\S]{0,24000}?(?:${internalTermsSource})[\\s\\S]{0,12000}?<\\/section>`, "gi"),
    new RegExp(`<main\\b[^>]*>[\\s\\S]{0,12000}<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>[\\s\\S]{0,24000}?(?:${internalTermsSource})[\\s\\S]{0,12000}?<\\/main>`, "gi"),
    new RegExp(`<h[1-4][^>]*>\\s*ClientSurge Systems\\s*<\\/h[1-4]>\\s*<(?:p|div)[^>]*>[\\s\\S]{0,3000}?(?:${generatedCopySource})[\\s\\S]{0,3000}?<\\/(?:p|div)>`, "gi"),
    /<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>\s*<(ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi,
    new RegExp(`<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>\\s*<(nav|section|div)\\b[^>]*>[\\s\\S]{0,36000}?(?:${internalTermsSource}|${generatedCopySource})[\\s\\S]{0,36000}?<\\/\\1>`, "gi"),
    INTERNAL_HREF_PATTERN,
  ]);

  return nextHtml;
}

export function shouldRepairHomepage(request, html = "") {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (normalizePathname(new URL(request.url).pathname) !== "/") return false;
  return looksLikeRouteExposureHtml(html);
}

export function buildEmergencyHomepageHtml() {
  return EMERGENCY_HOMEPAGE_HTML;
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

    const originalHtml = await response.text();
    const homepageRepaired = shouldRepairHomepage(request, originalHtml);
    const html = homepageRepaired
      ? buildEmergencyHomepageHtml()
      : sanitizeGeneratedPagesDirectoryHtml(originalHtml);
    const guardedHtml = injectEdgeRouteExposureGuard(html);
    const headers = new Headers(response.headers);
    headers.set(ROUTE_EXPOSURE_SANITIZED_HEADER, homepageRepaired ? "homepage-repaired" : looksLikeRouteExposureHtml(originalHtml) ? "removed" : "armed");
    headers.set("x-clientsurge-route-exposure-version", ROUTE_EXPOSURE_SANITIZER_VERSION);
    headers.set("Cache-Control", "no-store, max-age=0");

    if (homepageRepaired) {
      headers.set(HOMEPAGE_REPAIR_HEADER, HOMEPAGE_REPAIR_VERSION);
    }

    return new Response(guardedHtml, {
      status: homepageRepaired ? 200 : response.status,
      statusText: homepageRepaired ? "OK" : response.statusText,
      headers,
    });
  },
};