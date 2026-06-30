import edgeWorker from "./clientsurge-security-edge-worker.mjs";

export const ROUTE_EXPOSURE_SANITIZED_HEADER = "x-clientsurge-route-exposure-sanitized";
export const ROUTE_EXPOSURE_GUARD_SCRIPT_ID = "clientsurge-edge-route-exposure-guard";

const INTERNAL_ROUTE_WORDS = [
  "Admin Dashboard",
  "Business Setup",
  "Client Portal",
  "Client Dashboard",
  "Setup Status",
  "Website Preview",
  "Function Audit",
  "System Observability",
  "Reconciliation",
  "Mission Control",
  "SaaS Admin",
  "AI Status Dashboard",
  "Onboarding Pipeline",
];

const GENERATED_DIRECTORY_PATTERN = /(?:ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates|<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>)/i;
const INTERNAL_TEXT_PATTERN = new RegExp(INTERNAL_ROUTE_WORDS.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i");

export function looksLikeRouteExposureHtml(html = "") {
  return GENERATED_DIRECTORY_PATTERN.test(html) && INTERNAL_TEXT_PATTERN.test(html);
}

export function sanitizeGeneratedPagesDirectoryHtml(html = "") {
  let nextHtml = String(html || "");

  const patterns = [
    /<section\b[^>]*>[\s\S]{0,6000}<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>[\s\S]{0,9000}?(?:Admin Dashboard|Business Setup|Client Portal|Function Audit|System Observability)[\s\S]{0,6000}?<\/section>/gi,
    /<main\b[^>]*>[\s\S]{0,6000}<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>[\s\S]{0,9000}?(?:Admin Dashboard|Business Setup|Client Portal|Function Audit|System Observability)[\s\S]{0,6000}?<\/main>/gi,
    /<h[1-4][^>]*>\s*Pages\s*<\/h[1-4]>\s*<(?:ul|ol|nav|div|section)\b[^>]*>[\s\S]{0,12000}?(?:Admin Dashboard|Business Setup|Client Portal|Function Audit|System Observability)[\s\S]{0,12000}?<\/(?:ul|ol|nav|div|section)>/gi,
  ];

  for (const pattern of patterns) {
    nextHtml = nextHtml.replace(pattern, "");
  }

  nextHtml = nextHtml.replace(/<a\b[^>]*href=["']\/(?:admin|dashboard|client-portal|client-dashboard|setup|internal|functions|mission-control|observability|reconciliation)[^"']*["'][\s\S]*?<\/a>/gi, "");
  return nextHtml;
}

const EDGE_GUARD_SCRIPT = `<script id="${ROUTE_EXPOSURE_GUARD_SCRIPT_ID}">
(() => {
  if (window.__clientsurgeEdgeRouteExposureGuard) return;
  window.__clientsurgeEdgeRouteExposureGuard = true;
  const INTERNAL_PATH = /^\/(admin|dashboard|client|client-portal|client-dashboard|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|base44|api|saas|mission-control|lead-intelligence|sam|medspa-dashboard)(\/|$)/i;
  const INTERNAL_TEXT = /\b(Admin Dashboard|Business Setup|Client Portal|Client Dashboard|Function Audit|System Observability|Reconciliation|Onboarding Pipeline|Install Guide|Mission Control|SaaS Admin|AI Status Dashboard|Performance Wars|Admin Settings|Lead Intelligence|Credentials Setup|Website Preview|Automation Health|Opportunity Review Queue)\b/i;
  const GENERATED_COPY = /ClientSurge Systems manages \d+ data types|organize, track, and share your work in 1 place|including launch gates/i;
  const text = (node) => (node && node.textContent || '').replace(/\s+/g, ' ').trim();
  const hasInternalLink = (root) => Array.from(root.querySelectorAll?.('a[href]') || []).some((a) => {
    try { return INTERNAL_PATH.test(new URL(a.getAttribute('href'), location.origin).pathname); } catch { return false; }
  });
  const removeGeneratedDirectory = () => {
    const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
    for (const heading of headings) {
      if (text(heading).toLowerCase() !== 'pages') continue;
      const container = heading.closest('main,section,aside,nav,div');
      const candidateText = text(container || heading.parentElement || heading);
      if (container && (hasInternalLink(container) || INTERNAL_TEXT.test(candidateText) || GENERATED_COPY.test(candidateText))) {
        container.setAttribute('data-clientsurge-edge-route-exposure-removed', 'true');
        container.remove();
        continue;
      }
      const next = heading.nextElementSibling;
      if (next && (hasInternalLink(next) || INTERNAL_TEXT.test(text(next)))) {
        next.remove();
        heading.remove();
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
    headers.set("Cache-Control", "no-store, max-age=0");

    return new Response(guardedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
