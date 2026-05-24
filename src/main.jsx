import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import App from '@/App.jsx'
import '@/index.css'

const app = (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    enableSystem
    storageKey="theme-preference"
    disableTransitionOnChange
  >
    <App />
  </ThemeProvider>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  import.meta.env.DEV ? <React.StrictMode>{app}</React.StrictMode> : app
)
