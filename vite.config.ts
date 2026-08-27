import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * `__BUILD_ID__` is stamped at build time and used as the service-worker
 * registration query and its cache name. Without it the worker file is
 * byte-identical between deploys, the browser never notices a new one, and the
 * old cache keeps serving yesterday's app shell — which is exactly the bug that
 * made a shipped desktop layout invisible.
 */
export default defineConfig({
  plugins: [react()],
  define: { __BUILD_ID__: JSON.stringify(String(Date.now())) },
})
