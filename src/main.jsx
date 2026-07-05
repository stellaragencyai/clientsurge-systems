import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'
import '@/admin-mobile-hotfix.css'
import { installAdminMobileRuntime } from '@/lib/adminMobileRuntime'

// ── Standard React 18 mount — no repair hacks, no nested mount divs ──
// If #root is missing from index.html, show a visible error instead of
// silently creating an empty div that leaves a blank white page.

function showFatalError(message) {
  const body = document.body;
  if (!body) return;
  body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,sans-serif;background:#fff;">
      <div style="max-width:480px;text-align:center;">
        <div style="width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#003B8F,#00AEEF);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
          <span style="color:#fff;font-size:24px;font-weight:900;">!</span>
        </div>
        <h1 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 8px;">Application failed to load</h1>
        <p style="font-size:14px;color:#64748b;line-height:1.6;margin:0 0 24px;">${message}</p>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button onclick="window.location.reload()" style="padding:10px 24px;border-radius:999px;background:linear-gradient(90deg,#0079c1,#005691);color:#fff;font-weight:700;border:none;cursor:pointer;font-size:14px;">Refresh Page</button>
          <a href="/" style="padding:10px 24px;border-radius:999px;border:1px solid #cbd5e1;color:#0f172a;font-weight:700;text-decoration:none;font-size:14px;">Go Home</a>
        </div>
      </div>
    </div>
  `;
}

function closeInitialAdminMobileDrawer() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!/^\/(admin|dashboard|admin-settings)(\/|$)/i.test(window.location.pathname)) return;
  if (!window.matchMedia || !window.matchMedia("(max-width: 1023px)").matches) return;

  let closed = false;
  let attempts = 0;

  const closeIfOpen = () => {
    if (closed || attempts > 20) return;
    attempts += 1;

    const overlay = Array.from(document.querySelectorAll('div[class*="z-30"]')).find((el) => {
      const className = String(el.className || "");
      return className.includes("fixed") && className.includes("inset-0") && className.includes("lg:hidden") && className.includes("bg-black");
    });

    if (overlay) {
      closed = true;
      overlay.click();
      return;
    }

    window.setTimeout(closeIfOpen, 75);
  };

  window.setTimeout(closeIfOpen, 0);
}

function initApp() {
  const rootElement = document.getElementById("root");

  if (!rootElement) {
    console.error("[ClientSurge] Fatal: #root element not found in DOM. index.html may have been modified by an edge worker or is stale.");
    showFatalError("The page container could not be found. This may be caused by a stale cache or network issue. Please refresh the page.");
    return;
  }

  try {
    // Do NOT manually hide the static fallback — React's createRoot().render()
    // will naturally replace #root's children when it mounts. The static fallback
    // stays visible until React takes over, preventing a blank white page if
    // the mount fails or is delayed.
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      import.meta.env.DEV ? <React.StrictMode><App /></React.StrictMode> : <App />
    );

    // Mark as mounted so the static fallback CSS knows to stay hidden
    document.documentElement.classList.add("clientsurge-app-mounted");

    // Install admin mobile runtime helpers
    closeInitialAdminMobileDrawer();
    installAdminMobileRuntime();
  } catch (err) {
    console.error("[ClientSurge] Critical error rendering App:", err);
    showFatalError("An unexpected error occurred while loading the application. Please refresh the page or contact support if the problem persists.");
  }
}

initApp();

// Register service worker for static asset caching in production only
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch((error) => {
        console.warn("Service worker registration failed:", error?.message);
      });
  });
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});
  });
}