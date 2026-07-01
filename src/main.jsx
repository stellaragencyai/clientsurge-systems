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
const CLIENTSURGE_APP_ROOT_ID = 'clientsurge-app-root';

function getReactContainerMarkerCount(node) {
  if (!node) return 0;
  return Object.keys(node).filter((key) => key.startsWith('__reactContainer$')).length;
}

function getOrCreateClientSurgeMount(rootElement) {
  if (!rootElement) {
    throw new Error('ClientSurge root element #root was not found.');
  }

  let mountElement = document.getElementById(CLIENTSURGE_APP_ROOT_ID);
  if (!mountElement) {
    mountElement = document.createElement('div');
    mountElement.id = CLIENTSURGE_APP_ROOT_ID;
    rootElement.appendChild(mountElement);
  }

  // If Base44/editor/runtime code already claimed this mount with a React root but
  // our window handle was lost, React 18 throws minified error #299 on createRoot.
  // Replace the empty mount node and claim the fresh node instead of crashing the site.
  if (!window[CLIENTSURGE_ROOT_KEY] && getReactContainerMarkerCount(mountElement) > 0) {
    const freshMount = document.createElement('div');
    freshMount.id = CLIENTSURGE_APP_ROOT_ID;
    mountElement.replaceWith(freshMount);
    mountElement = freshMount;
  }

  return mountElement;
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
  const mountElement = getOrCreateClientSurgeMount(rootElement);

  if (!window[CLIENTSURGE_ROOT_KEY]) {
    window[CLIENTSURGE_ROOT_KEY] = ReactDOM.createRoot(mountElement);
  }

  return window[CLIENTSURGE_ROOT_KEY];
}

function installClientSurgeRuntimeOnce() {
  if (window[CLIENTSURGE_RUNTIME_KEY]) return;
  window[CLIENTSURGE_RUNTIME_KEY] = true;
  closeInitialAdminMobileDrawer();
  installAdminMobileRuntime();
}

function markClientSurgeMounted() {
  document.documentElement.classList.add('clientsurge-app-mounted');
  const staticFallback = document.querySelector('.static-fallback');
  if (staticFallback) {
    staticFallback.style.display = 'none';
  }
}

function showStaticFallback(rootElement) {
  document.documentElement.classList.remove('clientsurge-app-mounted');
  document.documentElement.classList.add('app-fallback-visible');
  const staticFallback = document.querySelector('.static-fallback');
  if (staticFallback) {
    staticFallback.style.display = 'block';
  } else if (rootElement) {
    rootElement.innerHTML = `<div style="padding:20px;color:#0f172a;font-family:Inter,system-ui,sans-serif"><h1>ClientSurge Systems</h1><p>The site shell loaded but the application runtime failed. Please refresh.</p></div>`;
  }
}

// Initialize with error boundary for debugging
function initApp() {
  const rootElement = document.getElementById('root');

  try {
    const app = <App />
    getClientSurgeRoot(rootElement).render(
      import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
    )
    markClientSurgeMounted();
    installClientSurgeRuntimeOnce();
  } catch (err) {
    console.error('Critical error rendering App:', err);
    showStaticFallback(rootElement);
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
