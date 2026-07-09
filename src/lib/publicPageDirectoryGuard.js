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

const SAFE_MARKETING_PATTERNS = [
  /Turn your website into an AI-powered sales system/i,
  /AI automation systems for service businesses/i,
  /Compare Packages/i,
  /Automate Your Lead Flow/i,
  /Capture\. Follow Up\. Book\./i,
];

const BASE44_EDITOR_BADGE_TEXT = /edit\s+with\s+base44/i;

function textOf(node) {
  return (node?.textContent || "").replace(/\s+/g, " ").trim();
}

function isInternalGeneratedLink(link) {
  const label = `${textOf(link)} ${link?.getAttribute?.("href") || ""}`;
  return INTERNAL_PAGE_PATTERNS.some((pattern) => pattern.test(label));
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
  const wrapper = document.createElement("main");
  wrapper.setAttribute("id", "main-content");
  wrapper.setAttribute("data-clientsurge-generated-directory-fallback", "true");
  wrapper.style.minHeight = "100svh";
  wrapper.style.display = "flex";
  wrapper.style.alignItems = "center";
  wrapper.style.justifyContent = "center";
  wrapper.style.padding = "32px";
  wrapper.style.background =
    "linear-gradient(135deg, #f8fafc 0%, #eff6ff 45%, #ffffff 100%)";
  wrapper.style.fontFamily =
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  wrapper.innerHTML = `
    <section style="max-width:760px;width:100%;border:1px solid rgba(15,23,42,.12);border-radius:28px;background:rgba(255,255,255,.94);box-shadow:0 24px 80px rgba(15,23,42,.12);padding:40px;text-align:left;">
      <p style="margin:0 0 12px;color:#006bb0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;">ClientSurge Systems</p>
      <h1 style="margin:0 0 16px;color:#0f172a;font-size:clamp(24px,3.2vw,36px);line-height:1.12;font-weight:900;">AI automation systems for service businesses.</h1>
      <p style="margin:0 0 28px;color:#475569;font-size:18px;line-height:1.7;">The generated Base44 page directory was blocked because internal admin, setup, and client routes are not public marketing pages. Continue through the verified public paths below.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        <a href="/pricing" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#003b8f;color:white;padding:13px 20px;font-weight:800;text-decoration:none;">Compare Packages</a>
        <a href="/automations" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(15,23,42,.18);color:#0f172a;padding:13px 20px;font-weight:800;text-decoration:none;background:white;">View Automations</a>
        <a href="/contact" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(15,23,42,.18);color:#0f172a;padding:13px 20px;font-weight:800;text-decoration:none;background:white;">Contact Support</a>
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

    // Avoid hiding the whole app if a large ancestor happens to contain the words.
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
      if (
        hasGeneratedCopy(previousText) ||
        /^ClientSurge Systems$/i.test(previousText) ||
        /organize, track, and share your work/i.test(previousText)
      ) {
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

function hasUsefulPublicMarketing(root) {
  const text = textOf(root);
  if (SAFE_MARKETING_PATTERNS.some((pattern) => pattern.test(text))) return true;
  return Boolean(
    root.querySelector?.('a[href="/pricing"], a[href="/automations"], a[href="/contact"], nav[aria-label="Public navigation"]')
  );
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

  for (const scope of scopes) {
    sanitizeGeneratedDirectory(scope);
  }

  if (!hasUsefulPublicMarketing(body)) {
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
