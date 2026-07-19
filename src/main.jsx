import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import '@/design-tokens.css'
import '@/design-system.css'
import '@/styles/clientsurge-os-tokens.css'
import '@/styles/clientsurge-os-shell.css'
import '@/styles/clientsurge-os-primitives.css'
import '@/styles/clientsurge-os-interactions.css'
import '@/styles/clientsurge-os-data-display.css'
import '@/styles/clientsurge-os-auth.css'
import '@/styles/clientsurge-os-pricing.css'
import '@/styles/clientsurge-os-gallery.css'
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

  const wrapper = document.createElement('div')
  wrapper.setAttribute('role', 'alert')
  wrapper.setAttribute('aria-live', 'assertive')
  wrapper.setAttribute('aria-label', 'Application failed to load')
  wrapper.setAttribute('data-clientsurge-fatal-error', 'true')
  Object.assign(wrapper.style, {
    minHeight: '100svh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'max(24px, env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) max(24px, env(safe-area-inset-bottom, 0px)) max(24px, env(safe-area-inset-left, 0px))',
    fontFamily: 'Inter, system-ui, sans-serif',
    background: '#fff',
  })

  const card = document.createElement('div')
  Object.assign(card.style, { maxWidth: '480px', textAlign: 'center' })

  const icon = document.createElement('div')
  icon.setAttribute('aria-hidden', 'true')
  Object.assign(icon.style, {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg,#007ABF,#00A1EA 55%,#1DB6F0)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  })

  const iconSpan = document.createElement('span')
  Object.assign(iconSpan.style, { color: '#fff', fontSize: '24px', fontWeight: '900' })
  iconSpan.textContent = '!'
  icon.appendChild(iconSpan)

  const heading = document.createElement('h1')
  Object.assign(heading.style, { fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px' })
  heading.textContent = 'Application failed to load'

  const para = document.createElement('p')
  Object.assign(para.style, { fontSize: '16px', color: '#64748b', lineHeight: '1.6', margin: '0 0 24px' })
  para.textContent = message

  const buttonRow = document.createElement('div')
  Object.assign(buttonRow.style, { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' })

  const refreshBtn = document.createElement('button')
  refreshBtn.type = 'button'
  refreshBtn.setAttribute('aria-label', 'Refresh the page')
  Object.assign(refreshBtn.style, {
    minHeight: '44px',
    minWidth: '44px',
    padding: '10px 24px',
    borderRadius: '999px',
    background: 'linear-gradient(135deg,#007ABF,#00A1EA 55%,#1DB6F0)',
    color: '#fff',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  })
  refreshBtn.textContent = 'Refresh Page'
  refreshBtn.addEventListener('click', () => window.location.reload())

  const homeLink = document.createElement('a')
  homeLink.href = '/'
  homeLink.setAttribute('aria-label', 'Go to the homepage')
  Object.assign(homeLink.style, {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '44px',
    minWidth: '44px',
    padding: '10px 24px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    color: '#0f172a',
    fontWeight: '700',
    textDecoration: 'none',
    fontSize: '14px',
  })
  homeLink.textContent = 'Go Home'

  buttonRow.appendChild(refreshBtn)
  buttonRow.appendChild(homeLink)
  card.appendChild(icon)
  card.appendChild(heading)
  card.appendChild(para)
  card.appendChild(buttonRow)
  wrapper.appendChild(card)
  body.appendChild(wrapper)
}

function closeInitialAdminMobileDrawer() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (!/^\/(admin|dashboard|admin-settings)(\/|$)/i.test(window.location.pathname)) return
  if (!window.matchMedia || !window.matchMedia('(max-width: 1023px)').matches) return

  let closed = false
  let attempts = 0

  const closeIfOpen = () => {
    if (closed || attempts > 20) return
    attempts += 1

    const overlay = Array.from(document.querySelectorAll('div[class*="z-30"]')).find((el) => {
      const className = String(el.className || '')
      return className.includes('fixed') && className.includes('inset-0') && className.includes('lg:hidden') && className.includes('bg-black')
    })

    if (overlay) {
      closed = true
      overlay.click()
      return
    }

    window.setTimeout(closeIfOpen, 75)
  }

  window.setTimeout(closeIfOpen, 0)
}

function installClientSurgeRuntimeOnce() {
  if (window[CLIENTSURGE_RUNTIME_KEY]) return
  window[CLIENTSURGE_RUNTIME_KEY] = true
  closeInitialAdminMobileDrawer()
  installAdminMobileRuntime()
}

function markAppMounted() {
  document.documentElement.classList.add('clientsurge-app-mounted')
  document.documentElement.removeAttribute('data-clientsurge-boot-error')
  installClientSurgeRuntimeOnce()
}

function rootAlreadyManaged(rootElement) {
  return Object.getOwnPropertyNames(rootElement).some(
    (key) => key === '_reactRootContainer' || key.startsWith('__reactContainer$'),
  )
}

function getOrCreateClientSurgeRoot(rootElement) {
  const cachedRoot = window[CLIENTSURGE_ROOT_KEY]
  if (cachedRoot && typeof cachedRoot.render === 'function') return cachedRoot

  if (rootAlreadyManaged(rootElement)) return null

  const root = ReactDOM.createRoot(rootElement)
  window[CLIENTSURGE_ROOT_KEY] = root
  return root
}

function fallbackIsDirectRootChild(rootElement) {
  return Array.from(rootElement.children).some((child) => child.classList?.contains('static-fallback'))
}

function watchExternallyManagedRoot(rootElement) {
  const finalizeIfMounted = () => {
    if (rootElement.childElementCount === 0 || fallbackIsDirectRootChild(rootElement)) return false
    markAppMounted()
    return true
  }

  if (finalizeIfMounted()) return

  const observer = new MutationObserver(() => {
    if (!finalizeIfMounted()) return
    observer.disconnect()
  })

  observer.observe(rootElement, { childList: true })

  window.setTimeout(() => {
    observer.disconnect()
    if (!finalizeIfMounted()) {
      console.error('[ClientSurge] An existing React root did not finish mounting within 8 seconds.')
    }
  }, 8000)
}

function ClientSurgeBoot() {
  React.useEffect(() => {
    markAppMounted()
  }, [])

  return <App />
}

function initApp() {
  const rootElement = document.getElementById('root')

  if (!rootElement) {
    console.error('[ClientSurge] Fatal: #root element not found in DOM. index.html may have been modified by an edge worker or is stale.')
    showFatalError('The page container could not be found. This may be caused by a stale cache or network issue. Please refresh the page.')
    return
  }

  try {
    const root = getOrCreateClientSurgeRoot(rootElement)

    if (!root) {
      console.warn('[ClientSurge] Reusing an existing React-managed root created by another bootstrap instance.')
      watchExternallyManagedRoot(rootElement)
      return
    }

    const app = <ClientSurgeBoot />
    root.render(import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app)
  } catch (err) {
    document.documentElement.classList.remove('clientsurge-app-mounted')
    console.error('[ClientSurge] Critical error rendering App:', err)
    showFatalError('An unexpected error occurred while loading the application. Please refresh the page or contact support if the problem persists.')
  }
}

initApp()

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.update().catch(() => {})
        window.setInterval(() => registration.update().catch(() => {}), 60 * 60 * 1000)
      })
      .catch((error) => {
        console.warn('Service worker registration failed:', error?.message)
      })
  })
} else if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {})
  })
}
