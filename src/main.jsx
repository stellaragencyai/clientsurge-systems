import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'
import '@/theme-restore.css'
import '@/no-ios-theme.css'
import { installLightThemeGuard } from '@/lib/restoreLightTheme'
import { installScrollExperienceGuard } from '@/lib/scrollExperienceGuard'
import { installAnimationRestoreGuard } from '@/lib/restoreAnimations'
import { installIosThemeArtifactGuard } from '@/lib/neutralizeIosThemeArtifacts'

installLightThemeGuard()
installScrollExperienceGuard()
installAnimationRestoreGuard()
installIosThemeArtifactGuard()

function hideStaticShell() {
  document.documentElement.classList.add('app-hydrated')
  document.querySelectorAll('.static-fallback, .static-shell').forEach((node) => {
    node.setAttribute('aria-hidden', 'true')
    node.style.display = 'none'
  })
}

// Hide static fallback immediately if the bundle is executing.
hideStaticShell()

// Initialize with error boundary for debugging
function initApp() {
  try {
    const root = document.getElementById('root')
    if (!root) throw new Error('Missing #root element')

    // Clear emergency fallback before mounting so React does not coexist with stale static HTML.
    root.innerHTML = ''

    const app = <App />
    ReactDOM.createRoot(root).render(
      import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
    )
    requestAnimationFrame(hideStaticShell)
  } catch (err) {
    console.error('Critical error rendering App:', err);
    const root = document.getElementById('root');
    if (root) {
      root.innerHTML = `<div style="min-height:100vh;padding:32px;font-family:Inter,system-ui,sans-serif;background:#f8fafc;color:#0f172a"><h1>ClientSurge Systems</h1><p>The interactive app is having trouble loading. Use the public navigation links or contact support@clientsurgesystems.com.</p><pre style="white-space:pre-wrap;color:#b91c1c">${err.stack || err.message}</pre></div>`;
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
