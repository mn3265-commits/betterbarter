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
    // The build id in the URL is what makes the browser see a *new* worker on
    // every deploy; the worker reads it back and names its cache after it, so a
    // release can never be served out of the previous one.
    navigator.serviceWorker.register('/sw.js?v=' + __BUILD_ID__).catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
