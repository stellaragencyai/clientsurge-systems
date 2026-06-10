import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Fix 3: Hide static fallback WITHOUT removing it — preserves visual editor DOM references
const staticFallback = document.querySelector('.static-fallback');
if (staticFallback) {
  staticFallback.style.display = 'none';
}

const app = <App />

ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update().catch(() => {});
    }).catch(() => {});
  });
}