import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'
import '@/admin-mobile-hotfix.css'
import { installAdminMobileRuntime } from '@/lib/adminMobileRuntime'

const CLIENTSURGE_ROOT_KEY = '__clientsurgeReactRoot__';
const CLIENTSURGE_RUNTIME_KEY = '__clientsurgeRuntimeInstalled__';

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

function getClientSurgeRoot(rootElement) {
  if (!rootElement) {
    throw new Error('ClientSurge root element #root was not found.');
  }

  // Production hardening: Base44/admin/editor/runtime scripts can cause the app
  // bundle to initialize more than once on the same DOM container. React 18
  // throws minified error #299 when createRoot is called twice. Reuse the root.
  if (!window[CLIENTSURGE_ROOT_KEY]) {
    window[CLIENTSURGE_ROOT_KEY] = ReactDOM.createRoot(rootElement);
  }

  return window[CLIENTSURGE_ROOT_KEY];
}

function installClientSurgeRuntimeOnce() {
  if (window[CLIENTSURGE_RUNTIME_KEY]) return;
  window[CLIENTSURGE_RUNTIME_KEY] = true;
  closeInitialAdminMobileDrawer();
  installAdminMobileRuntime();
}

// Initialize with error boundary for debugging
function initApp() {
  const rootElement = document.getElementById('root');

  try {
    const app = <App />
    getClientSurgeRoot(rootElement).render(
      import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
    )
    installClientSurgeRuntimeOnce();
  } catch (err) {
    console.error('Critical error rendering App:', err);
    if (rootElement) {
      rootElement.innerHTML = `<div style="padding:20px;color:red;font-family:monospace"><h1>App Failed to Load</h1><pre>${err.stack || err.message}</pre></div>`;
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
