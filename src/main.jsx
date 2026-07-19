import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'
import '@/styles/clientsurge-os-tokens.css'
import '@/styles/clientsurge-os-shell.css'
import '@/styles/clientsurge-os-primitives.css'
import '@/styles/clientsurge-os-auth.css'
import '@/styles/public-electric-blue-audit.css'
import '@/admin-mobile-hotfix.css'
import '@/area10-mobile-a11y.css'
import { installAdminMobileRuntime } from '@/lib/adminMobileRuntime'

const CLIENTSURGE_ROOT_KEY = '__clientsurgeReactRoot__'
const CLIENTSURGE_RUNTIME_KEY = '__clientsurgeRuntimeInstalled__'
const CLIENTSURGE_FATAL_KEY = '__clientsurgeFatalShown__'

function hasStaticFallback() {
  return Boolean(document.querySelector('.static-fallback'))
}

function showFatalError(message) {
  if (hasStaticFallback()) {
    document.documentElement.setAttribute('data-clientsurge-boot-error', 'react-bootstrap-failed')
    return
  }

  if (window[CLIENTSURGE_FATAL_KEY]) return
  window[CLIENTSURGE_FATAL_KEY] = true

  const body = document.body
  if (!body) return

  body.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;font-family:Inter,system-ui,sans-serif;color:#0f172a">
      <section style="max-width:560px;padding:28px;border:1px solid #e2e8f0;border-radius:16px;background:white;box-shadow:0 12px 30px rgba(15,23,42,.08)">
        <h1 style="margin:0 0 12px;font-size:24px">ClientSurge could not start</h1>
        <p style="margin:0;color:#475569;line-height:1.6">${message}</p>
      </section>
    </main>`
}

function installRuntimeOnce() {
  if (window[CLIENTSURGE_RUNTIME_KEY]) return
  window[CLIENTSURGE_RUNTIME_KEY] = true
  installAdminMobileRuntime()
}

try {
  installRuntimeOnce()

  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('The application root element is missing.')

  if (!window[CLIENTSURGE_ROOT_KEY]) {
    window[CLIENTSURGE_ROOT_KEY] = ReactDOM.createRoot(rootElement)
  }

  window[CLIENTSURGE_ROOT_KEY].render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  console.error('[ClientSurge] Application bootstrap failed', error)
  showFatalError('Please refresh the page. If the problem continues, contact ClientSurge support.')
}
