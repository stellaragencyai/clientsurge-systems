import edgeWorker from "./clientsurge-security-edge-worker.mjs";

export const ROUTE_EXPOSURE_SANITIZED_HEADER = "x-clientsurge-route-exposure-sanitized";
export const ROUTE_EXPOSURE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";
export const ROUTE_EXPOSURE_SANITIZER_VERSION = "2026-06-30T20-42Z";

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

const GENERATED_BASE44_COPY = /ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates/i;
const GENERATED_DIRECTORY_PATTERN = /(?:ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates|<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>|>\s*Pages\s*</i;
const INTERNAL_TEXT_PATTERN = new RegExp(INTERNAL_ROUTE_WORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");
const INTERNAL_ROUTE_TERMS = /Admin\s*(?:\/\s*)?(?:Dashboard|AI Status Dashboard|System Runbook|Task Status Dashboard|Conversion Insights)|Business Setup|Client Portal|Client Dashboard|Client Saas Dashboard|Client Setup Lookup|Setup Status|Website Preview|Function Audit|System Observability|Reconciliation|Mission Control|SaaS Admin|AI Status Dashboard|Onboarding Pipeline|Opportunity Review Queue|Automation Health/i;
const INTERNAL_HREF_PATTERN = /<a\b[^>]*href=["']\/(?:admin|dashboard|client-portal|client-dashboard|client-saas|dashboard-entry|setup|internal|functions|function|mission-control|observability|reconciliation|saas|lead-intelligence|sam|medspa-dashboard)[^"']*["'][\s\S]*?<\/a>/gi;

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

  // Remove complete generated app-builder directory wrappers when the Pages heading
  // and internal route terms appear inside the same wrapper.
  nextHtml = removePatterns(nextHtml, [
    new RegExp(`<section\\b[^>]*>[\\s\\S]{0,12000}<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>[\\s\\S]{0,24000}?(?:${internalTermsSource})[\\s\\S]{0,12000}?<\\/section>`, "gi"),
    new RegExp(`<main\\b[^>]*>[\\s\\S]{0,12000}<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>[\\s\\S]{0,24000}?(?:${internalTermsSource})[\\s\\S]{0,12000}?<\\/main>`, "gi"),
  ]);

  // Remove the common Base44 public directory shape while preserving the real
  // marketing content that follows it in the same main document.
  nextHtml = removePatterns(nextHtml, [
    new RegExp(`(?:<h[1-4][^>]*>\\s*ClientSurge Systems\\s*<\\/h[1-4]>\\s*<(?:p|div)[^>]*>[\\s\\S]{0,2400}?(?:${generatedCopySource})[\\s\\S]{0,2400}?<\\/(?:p|div)>\\s*)?<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>\\s*<(ul|ol|nav|section|div)\\b[^>]*>[\\s\\S]{0,36000}?(?:${internalTermsSource})[\\s\\S]{0,36000}?<\\/\\1>`, "gi"),
    new RegExp(`<h[1-4][^>]*>\\s*Pages\\s*<\\/h[1-4]>\\s*<(?:ul|ol|nav|div|section)\\b[^>]*>[\\s\\S]{0,24000}?(?:${internalTermsSource})[\\s\\S]{0,24000}?<\\/(?:ul|ol|nav|div|section)>`, "gi"),
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
  const GENERATED_COPY = /ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates/i;
  const MARKETING_START = /Automate Your Lead Flow|Capture\. Follow Up\. Book\.|Compare Packages|Included Automations/i;
  const text = (node) => (node && node.textContent || '').replace(/\s+/g, ' ').trim();
  const hasInternalLink = (root) => Array.from(root.querySelectorAll?.('a[href]') || []).some((a) => {
    try { return INTERNAL_PATH.test(new URL(a.getAttribute('href'), location.origin).pathname); } catch { return false; }
  });
  const removeGeneratedDirectory = () => {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    for (const heading of headings) {
      if (text(heading).toLowerCase() !== 'pages') continue;
      const next = heading.nextElementSibling;
      const nextText = text(next);
      const looksGenerated = next && (hasInternalLink(next) || INTERNAL_TEXT.test(nextText) || GENERATED_COPY.test(nextText));
      if (looksGenerated) {
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
    const response = await edgeWorker.fetch(request, env, ctx);
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
