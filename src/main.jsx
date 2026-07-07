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

  // DOM-safe construction — no innerHTML injection to avoid XSS risk
  // and ensure the error screen renders even if the page state is degraded.
  const wrapper = document.createElement('div');
  Object.assign(wrapper.style, {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'Inter, system-ui, sans-serif',
    background: '#fff',
  });

  const card = document.createElement('div');
  Object.assign(card.style, { maxWidth: '480px', textAlign: 'center' });

  const icon = document.createElement('div');
  Object.assign(icon.style, {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg,#003B8F,#00AEEF)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  });
  const iconSpan = document.createElement('span');
  Object.assign(iconSpan.style, { color: '#fff', fontSize: '24px', fontWeight: '900' });
  iconSpan.textContent = '!';
  icon.appendChild(iconSpan);

  const heading = document.createElement('h1');
  Object.assign(heading.style, { fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' });
  heading.textContent = 'Application failed to load';

  const para = document.createElement('p');
  Object.assign(para.style, { fontSize: '14px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px' });
  para.textContent = message;

  const buttonRow = document.createElement('div');
  Object.assign(buttonRow.style, { display: 'flex', gap: '12px', justifyContent: 'center' });

  const refreshBtn = document.createElement('button');
  Object.assign(refreshBtn.style, {
    padding: '10px 24px',
    borderRadius: '999px',
    background: 'linear-gradient(90deg,#0079c1,#005691)',
    color: '#fff',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  });
  refreshBtn.textContent = 'Refresh Page';
  refreshBtn.addEventListener('click', () => window.location.reload());

  const homeLink = document.createElement('a');
  homeLink.href = '/';
  Object.assign(homeLink.style, {
    padding: '10px 24px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    fontWeight: '700',
    textDecoration: 'none',
    fontSize: '14px',
  });
  homeLink.textContent = 'Go Home';

  buttonRow.appendChild(refreshBtn);
  buttonRow.appendChild(homeLink);
  card.appendChild(icon);
  card.appendChild(heading);
  card.appendChild(para);
  card.appendChild(buttonRow);
  wrapper.appendChild(card);
  body.appendChild(wrapper);
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
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      import.meta.env.DEV ? <React.StrictMode><App /></React.StrictMode> : <App />
    );

    document.documentElement.classList.add("clientsurge-app-mounted");
    closeInitialAdminMobileDrawer();
    installAdminMobileRuntime();
  } catch (err) {
    console.error("[ClientSurge] Critical error rendering App:", err);
    showFatalError("An unexpected error occurred while loading the application. Please refresh the page or contact support if the problem persists.");
  }
}

initApp();

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