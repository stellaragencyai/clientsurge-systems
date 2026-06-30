import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'
import '@/admin-mobile-hotfix.css'

// Fix 3: Hide static fallback WITHOUT removing it — preserves visual editor DOM references
const staticFallback = document.querySelector('.static-fallback');
if (staticFallback) {
  staticFallback.style.display = 'none';
}

function closeInitialAdminMobileDrawer() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!/^\/(admin|dashboard|admin-settings)(\/|$)/i.test(window.location.pathname)) return;
  if (!window.matchMedia || !window.matchMedia('(max-width: 1023px)').matches) return;

  let closed = false;
  let attempts = 0;

  const closeIfOpen = () => {
    if (closed || attempts > 20) return;
    attempts += 1;

    const overlay = Array.from(document.querySelectorAll('div[class*="z-30"]')).find((el) => {
      const className = String(el.className || '');
      return className.includes('fixed') && className.includes('inset-0') && className.includes('lg:hidden') && className.includes('bg-black');
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

// Initialize with error boundary for debugging
function initApp() {
  try {
    const app = <App />
    ReactDOM.createRoot(document.getElementById('root')).render(
      import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
    )
    closeInitialAdminMobileDrawer();
  } catch (err) {
    console.error('Critical error rendering App:', err);
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="padding:20px;color:red;font-family:monospace"><h1>App Failed to Load</h1><pre>${err.stack || err.message}</pre></div>`;
    }
  }
}

initApp()

// Launch hardening: do not register a service worker while custom-domain routing
// and Base44 publishing are being stabilized. A stale worker can keep serving old
// app shells after rollback/publish events. Clear existing workers safely.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});
  });
}
