import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './styles/tokens.css'
import './styles/app.css'

// Installable, and able to open on a bad connection. Registered after load so
// it never competes with the first paint, and only in production — a service
// worker in front of the dev server caches things you are still editing.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
