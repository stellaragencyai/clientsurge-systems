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

function markAppHydrated() {
  document.documentElement.classList.add('app-hydrated')
  document.documentElement.classList.remove('no-js')
  document.documentElement.classList.add('js')
}

function hideStaticShell() {
  markAppHydrated()
  document.querySelectorAll('#static-root, .static-fallback, .static-shell').forEach((node) => {
    node.setAttribute('aria-hidden', 'true')
    node.style.display = 'none'
    node.style.visibility = 'hidden'
    node.style.pointerEvents = 'none'
  })
}

function hideStaticShellIfAppMounted(root) {
  const attempts = [0, 50, 150, 500, 1200]
  attempts.forEach((delay) => {
    window.setTimeout(() => {
      if (!root || root.childElementCount === 0) return
      hideStaticShell()
    }, delay)
  })
}

function disableStaleServiceWorkerCaches() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister?.().catch(() => {}))
  }).catch(() => {})

  if (typeof caches !== 'undefined') {
    caches.keys?.().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {})
  }
}

async function initApp() {
  const root = document.getElementById('root')
  try {
    if (!root) throw new Error('Missing #root element')

    markAppHydrated()

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

disableStaleServiceWorkerCaches()
initApp()
