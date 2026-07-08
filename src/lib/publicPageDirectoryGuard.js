const INTERNAL_PAGE_PATTERNS = [
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
  /reconciliation/i,
  /observability/i,
  /saas admin/i,
  /lead intelligence/i,
  /function audit/i,
  /operations verification/i,
];

const GENERATED_DIRECTORY_PATTERNS = [
  /manages\s+\d+\s+data types/i,
  /including launch gates/i,
  /available pages/i,
  /app pages/i,
  /data types/i,
];

function looksLikeGeneratedDirectory(root) {
  if (!root) return false;

  const text = root.textContent || "";
  const links = Array.from(root.querySelectorAll("a"));

  const hasGeneratedCopy = GENERATED_DIRECTORY_PATTERNS.some((pattern) =>
    pattern.test(text)
  );

  const internalLinkCount = links.filter((link) => {
    const label = `${link.textContent || ""} ${link.getAttribute("href") || ""}`;
    return INTERNAL_PAGE_PATTERNS.some((pattern) => pattern.test(label));
  }).length;

  return hasGeneratedCopy && internalLinkCount >= 3;
}

function buildSafeFallback() {
  const wrapper = document.createElement("main");
  wrapper.setAttribute("id", "main-content");
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
    <section style="max-width:720px;width:100%;border:1px solid rgba(15,23,42,.12);border-radius:28px;background:rgba(255,255,255,.94);box-shadow:0 24px 80px rgba(15,23,42,.12);padding:40px;text-align:left;">
      <p style="margin:0 0 12px;color:#006bb0;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;">ClientSurge Systems</p>
      <h1 style="margin:0 0 16px;color:#0f172a;font-size:clamp(32px,5vw,54px);line-height:1.02;font-weight:900;">AI automation systems for service businesses.</h1>
      <p style="margin:0 0 28px;color:#475569;font-size:18px;line-height:1.7;">We are updating the live app shell. Internal admin, setup, and client routes are not public pages. Continue to the verified public paths below.</p>
      <div style="display:flex;flex-wrap:wrap;gap:12px;">
        <a href="/pricing" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#003b8f;color:white;padding:13px 20px;font-weight:800;text-decoration:none;">Compare Packages</a>
        <a href="/contact" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(15,23,42,.18);color:#0f172a;padding:13px 20px;font-weight:800;text-decoration:none;background:white;">Contact Support</a>
        <a href="/" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid rgba(15,23,42,.18);color:#0f172a;padding:13px 20px;font-weight:800;text-decoration:none;background:white;">Home</a>
      </div>
    </section>
  `;

  return wrapper;
}

export function installPublicPageDirectoryGuard() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.location.hostname.includes("preview-sandbox")) return;

  const runGuard = () => {
    const root = document.getElementById("root") || document.body;
    if (!looksLikeGeneratedDirectory(root)) return;

    console.error(
      "[ClientSurge] Blocked generated Base44 page directory from public render."
    );

    document.title = "ClientSurge Systems | AI Automation for Service Businesses";

    let robotsMeta = document.head.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement("meta");
      robotsMeta.setAttribute("name", "robots");
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute("content", "noindex,nofollow");

    root.replaceChildren(buildSafeFallback());
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runGuard, { once: true });
  } else {
    runGuard();
  }

  const observer = new MutationObserver(runGuard);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  window.setTimeout(() => observer.disconnect(), 8000);
}
