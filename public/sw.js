/*
 * Handoff service worker — the minimum that makes the app installable and
 * survivable on a bad campus connection, and nothing more.
 *
 * Rules:
 *   · Navigations are network-first, falling back to the cached shell. A board
 *     is a live thing; showing a stale one when the network works would be a
 *     lie about what is still available.
 *   · Built assets (hashed filenames) are cache-first — they never change under
 *     a given name.
 *   · Supabase and every other API call is left alone entirely. Nothing about
 *     listings, threads or auth is ever cached here.
 */
const VERSION = 'handoff-' + (new URL(self.location.href).searchParams.get('v') || 'dev')
const SHELL = '/app'

self.addEventListener('install', (event) => {
  // Fetch the shell past the HTTP cache: a fresh worker exists precisely because
  // the app changed, so anything it stores now must be the new build.
  event.waitUntil(
    caches
      .open(VERSION)
      .then((c) =>
        Promise.all(
          [SHELL, '/', '/icon-192.png', '/icon-512.png'].map((url) =>
            fetch(url, { cache: 'reload' })
              .then((res) => (res.ok ? c.put(url, res) : null))
              .catch(() => null),
          ),
        ),
      )
      .catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // Supabase, fonts, anything else

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(VERSION).then((c) => c.put(SHELL, copy)).catch(() => {})
          return res
        })
        .catch(() => caches.match(SHELL).then((hit) => hit || caches.match('/'))),
    )
    return
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {})
            return res
          }),
      ),
    )
  }
})
