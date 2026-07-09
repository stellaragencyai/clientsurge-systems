export const INTERNAL_PAGE_PATTERNS = [
  /admin/i,
  /dashboard/i,
  /deployment/i,
  /automation activity/i,
  /conversion insights/i,
  /system runbook/i,
  /mission control/i,
  /onboarding/i,
  /setup/i,
  /client portal/i,
  /client dashboard/i,
  /client saas/i,
  /reconciliation/i,
  /observability/i,
  /saas admin/i,
  /lead intelligence/i,
  /function audit/i,
  /operations verification/i,
  /business setup/i,
  /credentials setup/i,
  /website preview/i,
  /performance wars/i,
];

export const GENERATED_DIRECTORY_PATTERNS = [
  /ClientSurge Systems manages\s+\d+\s+data types/i,
  /manages\s+\d+\s+data types/i,
  /including launch gates/i,
  /organize, track, and share your work/i,
  /available pages/i,
  /app pages/i,
  /\bPages\b/i,
];

const PUBLIC_MARKETING_ROUTES = new Set([
  "/",
  "/pricing",
  "/automations",
  "/industries",
  "/proof",
  "/faq",
  "/how-it-works",
  "/about",
  "/blog",
  "/testimonials",
  "/roadmap",
  "/contact",
  "/privacy",
  "/terms",
  "/sms-terms",
  "/refund-policy",
]);

const BASE44_EDITOR_BADGE_TEXT = /edit\s+with\s+base44/i;
const PRIVATE_PATH_PATTERN = /^\/(admin|dashboard|client|client-portal|client-dashboard|client-saas|dashboard-entry|setup|functions|function|internal|private|onboarding|install|audit|observability|reconciliation|mission-control|saas|lead-intelligence|sam|medspa-dashboard|api|base44)(\/|$)/i;

const ROUTE_COPY = {
  "/": {
    eyebrow: "AI Growth System for Service Businesses",
    title: "Turn your website into an AI-powered sales system.",
    body: "ClientSurge installs lead capture, instant response, booking, follow-up, review, and reactivation workflows for local service businesses.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/automations",
    secondaryLabel: "See Automations",
  },
  "/pricing": {
    eyebrow: "Packages",
    title: "Choose the automation system your business needs next.",
    body: "Compare Starter, Growth, and Pro packages with clear setup fees, monthly pricing, installation expectations, and support paths.",
    primaryHref: "/product-signup?package=growth_system",
    primaryLabel: "Start Growth System",
    secondaryHref: "/automations",
    secondaryLabel: "Review Automations",
  },
  "/automations": {
    eyebrow: "Automations",
    title: "Six core automations that stop leads from slipping away.",
    body: "Lead capture, missed-call recovery, AI follow-up, booking, review requests, and lead reactivation work together as one conversion system.",
    primaryHref: "/pricing",
    primaryLabel: "Compare Packages",
    secondaryHref: "/how-it-works",
    secondaryLabel: "See How It Works",
  },
  "/proof": {
    eyebrow: "Proof Standards",
    title: "Truthful proof only. No fake testimonials. No fake live stats.",
    body: "ClientSurge separates verified production proof, internal test evidence, demo screenshots, and claims that still need validation.",
    primaryHref: "/how-it-works",
    primaryLabel: "See The System",
    secondaryHref: "/contact",
    secondaryLabel: "Ask A Question",
  },
  "/contact": {
    eyebrow: "Contact",
    title: "Talk to ClientSurge about your automation setup.",
    body: "Ask about packages, setup, AI voice agents, lead follow-up, booking automation, or the best starting point for your business.",
    primaryHref: "mailto:support@clientsurgesystems.com",
    primaryLabel: "Email Support",
    secondaryHref: "/pricing",
    secondaryLabel: "Compare Packages",
  },
};

const DEFAULT_COPY = {
  eyebrow: "ClientSurge Systems",
  title: "AI automation systems for local service businesses.",
  body: "ClientSurge helps local businesses respond faster, follow up consistently, book more qualified conversations, and recover leads that normally go cold.",
  primaryHref: "/pricing",
  primaryLabel: "Compare Packages",
  secondaryHref: "/contact",
  secondaryLabel: "Contact Support",
};

function textOf(node) {
  return (node?.textContent || "").replace(/\s+/g, " ").trim();
}

function normalizePathname(pathname = "/") {
  const value = String(pathname || "/").split("?")[0].split("#")[0];
  const normalized = value.length > 1 && value.endsWith("/") ? value.slice(0, -1) : value;
  return normalized || "/";
}

function isPublicMarketingPath() {
  const pathname = normalizePathname(window.location.pathname || "/");
  return PUBLIC_MARKETING_ROUTES.has(pathname) || /^\/(med-spa|dental|hvac|plumbing|roofing|chiropractic|contractors|real-estate|personal-injury|property-services|veterinary|electrician|landscaping|tree-service|painting|pest-control|salon|auto-repair|accounting|fitness|law-firm)$/.test(pathname);
}

function isPrivatePath() {
  return PRIVATE_PATH_PATTERN.test(normalizePathname(window.location.pathname || "/"));
}

function isInternalGeneratedLink(link) {
  const label = `${textOf(link)} ${link?.getAttribute?.("href") || ""}`;
  let internalByPath = false;
  try {
    internalByPath = PRIVATE_PATH_PATTERN.test(new URL(link.getAttribute("href") || "", window.location.origin).pathname);
  } catch {}
  return internalByPath || INTERNAL_PAGE_PATTERNS.some((pattern) => pattern.test(label));
}

function hasGeneratedCopy(text) {
  return GENERATED_DIRECTORY_PATTERNS.some((pattern) => pattern.test(text));
}

function hasPagesHeading(root) {
  return Array.from(root?.querySelectorAll?.("h1,h2,h3,h4") || []).some((heading) =>
    /^pages$/i.test(textOf(heading)) || /available pages/i.test(textOf(heading))
  );
}

export function looksLikeGeneratedDirectory(root) {
  if (!root) return false;

  const text = textOf(root);
  const links = Array.from(root.querySelectorAll?.("a[href]") || []);
  const internalLinkCount = links.filter(isInternalGeneratedLink).length;

  return (
    (hasGeneratedCopy(text) && (hasPagesHeading(root) || internalLinkCount >= 3)) ||
    (hasPagesHeading(root) && internalLinkCount >= 5)
  );
}

function buildSafeFallback() {
  const pathname = normalizePathname(window.location.pathname || "/");
  const copy = ROUTE_COPY[pathname] || DEFAULT_COPY;
  const wrapper = document.createElement("main");
  wrapper.setAttribute("id", "main-content");
  wrapper.setAttribute("data-clientsurge-generated-directory-fallback", "true");
  wrapper.style.minHeight = "100svh";
  wrapper.style.background = "linear-gradient(135deg, #f8fafc 0%, #eff6ff 45%, #ffffff 100%)";
  wrapper.style.fontFamily = 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  wrapper.innerHTML = `
    <section style="max-width:1120px;width:calc(100% - 32px);margin:0 auto;padding:32px 0 56px;">
      <header style="display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:clamp(40px,7vw,72px);">
        <a href="/" style="color:#07111f;font-weight:950;letter-spacing:-.04em;text-decoration:none;font-size:21px;">ClientSurge Systems</a>
        <nav aria-label="Public navigation" style="display:flex;gap:14px;flex-wrap:wrap;font-size:14px;">
          <a href="/pricing" style="color:#075985;font-weight:800;text-decoration:none;">Pricing</a>
          <a href="/automations" style="color:#075985;font-weight:800;text-decoration:none;">Automations</a>
          <a href="/proof" style="color:#075985;font-weight:800;text-decoration:none;">Proof</a>
          <a href="/contact" style="color:#075985;font-weight:800;text-decoration:none;">Contact</a>
        </nav>
      </header>
      <div style="display:grid;grid-template-columns:1.05fr .95fr;gap:42px;align-items:center;">
        <section>
          <p style="margin:0 0 14px;color:#006bb0;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:.15em;">${copy.eyebrow}</p>
          <h1 style="margin:0 0 20px;color:#0f172a;font-size:clamp(34px,5vw,60px);line-height:1;letter-spacing:-.055em;font-weight:950;">${copy.title}</h1>
          <p style="margin:0 0 28px;color:#475569;font-size:clamp(17px,1.7vw,20px);line-height:1.65;max-width:720px;">${copy.body}</p>
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <a href="${copy.primaryHref}" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:linear-gradient(135deg,#003b8f,#00aeef);color:white;padding:13px 20px;font-weight:900;text-decoration:none;box-shadow:0 14px 32px rgba(0,107,176,.22);">${copy.primaryLabel}</a>
            <a href="${copy.secondaryHref}" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(15,23,42,.18);color:#0f172a;padding:13px 20px;font-weight:900;text-decoration:none;background:white;">${copy.secondaryLabel}</a>
          </div>
        </section>
        <aside style="border:1px solid rgba(15,23,42,.12);border-radius:30px;background:rgba(255,255,255,.94);box-shadow:0 24px 80px rgba(15,23,42,.12);padding:32px;">
          <p style="margin:0 0 12px;color:#006bb0;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.14em;">Public Shell Protected</p>
          <h2 style="margin:0 0 14px;color:#0f172a;font-size:30px;letter-spacing:-.045em;">No internal app directory shown.</h2>
          <p style="margin:0;color:#475569;line-height:1.65;">The generated Base44 page directory was blocked. Internal admin, setup, and client routes are not public marketing pages.</p>
        </aside>
      </div>
    </section>
  `;

  return wrapper;
}

function removeNode(node) {
  if (!node || !node.parentNode) return false;
  node.parentNode.removeChild(node);
  return true;
}

function hideNode(node) {
  if (!node) return false;
  node.setAttribute?.("aria-hidden", "true");
  node.style?.setProperty?.("display", "none", "important");
  node.style?.setProperty?.("visibility", "hidden", "important");
  node.style?.setProperty?.("pointer-events", "none", "important");
  return true;
}

export function removeBase44EditorBadge() {
  if (typeof document === "undefined") return 0;
  let hidden = 0;

  const elements = Array.from(document.body?.querySelectorAll?.("button,a,div,aside,section") || []);
  for (const element of elements) {
    const text = textOf(element);
    if (!BASE44_EDITOR_BADGE_TEXT.test(text)) continue;

    const fixedAncestor = element.closest?.('[style*="fixed"], [class*="fixed"]');
    const target = fixedAncestor || element;

    if ((target.textContent || "").length > 300) {
      hidden += hideNode(element) ? 1 : 0;
    } else {
      hidden += hideNode(target) ? 1 : 0;
    }
  }

  return hidden;
}

function removeGeneratedDirectoryHeadingBlock(root) {
  let removed = 0;
  const headings = Array.from(root.querySelectorAll?.("h1,h2,h3,h4") || []);

  for (const heading of headings) {
    const label = textOf(heading);
    if (!/^pages$/i.test(label) && !/available pages/i.test(label)) continue;

    const next = heading.nextElementSibling;
    if (next && /^(UL|OL|NAV|SECTION|DIV)$/i.test(next.tagName)) {
      removed += removeNode(next) ? 1 : 0;
    }

    let prev = heading.previousElementSibling;
    let scanned = 0;
    while (prev && scanned < 4) {
      const previous = prev;
      prev = prev.previousElementSibling;
      scanned += 1;
      const previousText = textOf(previous);
      if (hasGeneratedCopy(previousText) || /^ClientSurge Systems$/i.test(previousText)) {
        removed += removeNode(previous) ? 1 : 0;
      }
    }

    removed += removeNode(heading) ? 1 : 0;
  }

  return removed;
}

function removeInternalGeneratedLinks(root) {
  let removed = 0;
  const links = Array.from(root.querySelectorAll?.("a[href]") || []);

  for (const link of links) {
    if (!isInternalGeneratedLink(link)) continue;
    const candidate = link.closest?.("li") || link.closest?.("p") || link;
    removed += removeNode(candidate) ? 1 : 0;
  }

  return removed;
}

function removeGeneratedCopyNodes(root) {
  let removed = 0;
  const nodes = Array.from(root.querySelectorAll?.("p,h1,h2,h3,h4") || []);

  for (const node of nodes) {
    const text = textOf(node);
    if (
      /ClientSurge Systems manages\s+\d+\s+data types/i.test(text) ||
      /organize, track, and share your work/i.test(text) ||
      /including launch gates/i.test(text)
    ) {
      removed += removeNode(node) ? 1 : 0;
    }
  }

  return removed;
}

export function sanitizeGeneratedDirectory(root) {
  if (!root) return 0;
  let removed = 0;
  removed += removeGeneratedDirectoryHeadingBlock(root);
  removed += removeInternalGeneratedLinks(root);
  removed += removeGeneratedCopyNodes(root);
  return removed;
}

function setRobots(value) {
  let robotsMeta = document.head.querySelector('meta[name="robots"]');
  if (!robotsMeta) {
    robotsMeta = document.createElement("meta");
    robotsMeta.setAttribute("name", "robots");
    document.head.appendChild(robotsMeta);
  }
  robotsMeta.setAttribute("content", value);
}

export function runPublicPageDirectoryGuard() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.location.hostname.includes("preview-sandbox")) return false;

  removeBase44EditorBadge();

  const body = document.body;
  const root = document.getElementById("root");
  const scopes = Array.from(new Set([body, root].filter(Boolean)));
  const generatedScope = scopes.find(looksLikeGeneratedDirectory);

  if (!generatedScope) return false;

  console.error("[ClientSurge] Blocked generated Base44 page directory from public render.");
  document.documentElement.setAttribute("data-clientsurge-route-exposure-guard", "blocked-generated-directory");
  document.title = "ClientSurge Systems | AI Automation for Service Businesses";

  if (isPublicMarketingPath()) {
    setRobots("index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1");
    body.replaceChildren(buildSafeFallback());
    return true;
  }

  if (isPrivatePath()) {
    setRobots("noindex,nofollow");
  }

  for (const scope of scopes) {
    sanitizeGeneratedDirectory(scope);
  }

  if (looksLikeGeneratedDirectory(body)) {
    setRobots("noindex,nofollow");
    body.replaceChildren(buildSafeFallback());
  }

  return true;
}

export function installPublicPageDirectoryGuard() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__clientsurgePublicPageDirectoryGuardInstalled) return;
  window.__clientsurgePublicPageDirectoryGuardInstalled = true;

  const runGuard = () => runPublicPageDirectoryGuard();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runGuard, { once: true });
  } else {
    runGuard();
  }

  window.requestAnimationFrame?.(runGuard);
  window.setTimeout(runGuard, 0);
  window.setTimeout(runGuard, 250);
  window.setTimeout(runGuard, 1000);

  const observer = new MutationObserver(runGuard);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.setTimeout(() => observer.disconnect(), 120000);
}
