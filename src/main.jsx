import React from 'react'
import ReactDOM from 'react-dom/client'
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

function hideStaticShellIfAppMounted(root) {
  window.setTimeout(() => {
    if (!root || root.childElementCount === 0) return
    document.documentElement.classList.add('app-hydrated')
    document.querySelectorAll('#static-root, .static-fallback, .static-shell').forEach((node) => {
      node.setAttribute('aria-hidden', 'true')
      node.style.display = 'none'
    })
  }, 1200)
}

function clearStaleServiceWorkerCaches() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.update?.().catch(() => {}))
  }).catch(() => {})
}

async function initApp() {
  const root = document.getElementById('root')
  try {
    if (!root) throw new Error('Missing #root element')

    const module = await import('@/App.jsx')
    const App = module.default
    if (!App) throw new Error('App module loaded without a default export')

    const app = <App />
    ReactDOM.createRoot(root).render(
      import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
    )
    hideStaticShellIfAppMounted(root)
  } catch (err) {
    console.error('ClientSurge interactive app failed to load. Static public shell remains visible.', err)
    document.documentElement.classList.remove('app-hydrated')
    if (root) root.innerHTML = ''
  }
}

clearStaleServiceWorkerCaches()
initApp()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update().catch(() => {})
    }).catch(() => {})
  })
}
