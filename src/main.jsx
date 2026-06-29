import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'

// Fix 3: Hide static fallback WITHOUT removing it — preserves visual editor DOM references
const staticFallback = document.querySelector('.static-fallback');
if (staticFallback) {
  staticFallback.style.display = 'none';
}

// Initialize with error boundary for debugging
function initApp() {
  try {
    const app = <App />
    ReactDOM.createRoot(document.getElementById('root')).render(
      import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
    )
  } catch (err) {
    console.error('Critical error rendering App:', err);
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="padding:20px;color:red;font-family:monospace"><h1>⚠️ App Failed to Load</h1><pre>${err.stack || err.message}</pre></div>`;
    }
  }
}

initApp()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update().catch(() => {});
    }).catch(() => {});
  });
}