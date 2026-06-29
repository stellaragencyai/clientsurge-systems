import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'
import '@/theme-restore.css'
import '@/no-ios-theme.css'
import App from './App.jsx'
import { installLightThemeGuard } from '@/lib/restoreLightTheme'
import { installScrollExperienceGuard } from '@/lib/scrollExperienceGuard'
import { installAnimationRestoreGuard } from '@/lib/restoreAnimations'
import { installIosThemeArtifactGuard } from '@/lib/neutralizeIosThemeArtifacts'

installLightThemeGuard()
installScrollExperienceGuard()
installAnimationRestoreGuard()
installIosThemeArtifactGuard()

document.documentElement.classList.add('app-hydrated')
document.documentElement.classList.remove('no-js')
document.documentElement.classList.add('js')

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((registrations) => {
    registrations.forEach((registration) => registration.unregister?.().catch(() => {}))
  }).catch(() => {})
}

if (typeof caches !== 'undefined') {
  caches.keys?.().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => {})
}

const root = document.getElementById('root')
if (!root) {
  throw new Error('ClientSurge boot failed: missing #root element')
}

ReactDOM.createRoot(root).render(
  import.meta.env.DEV ? <React.StrictMode><App /></React.StrictMode> : <App />
)
