// Minimal service worker: caches the app shell so the PWA opens instantly.
// Strategy: network first, cache as fallback (fresh code after every deploy, no stale JS).
// Offline editing is deliberately out of scope; Supabase requests are never cached.
// BUILD is stamped with the commit SHA by .github/workflows/pages.yml (docs/changes/003);
// locally the placeholder stays, which is fine – it is just a fixed dev cache name.
const BUILD = '__BUILD__';
// docs/changes/010: main ("/") and preview ("/preview/") are two independent deployments of the
// same origin. Cache Storage is per-origin, not per service-worker scope, so without a distinct
// tag here a redeploy of one would delete the other's cache on activate() (both use the same
// VERSION name otherwise, e.g. right after preview is first branched off main).
const SCOPE_TAG = self.location.pathname.includes('/preview/') ? 'preview' : 'live';
const VERSION = 'spatzlbau-' + SCOPE_TAG + '-' + BUILD;
const SHELL = [
  './',
  './index.html',
  './app.css',
  './manifest.json',
  './changelog.json',
  './app/main.js',
  './app/config.js',
  './app/supabase.js',
  './app/state.js',
  './app/auth.js',
  './app/ui/dom.js',
  './app/ui/labels.js',
  './app/ui/task.js',
  './app/ui/detail.js',
  './app/filters.js',
  './app/costs.js',
  './app/changelog.js',
  './app/views/dashboard.js',
  './app/views/print.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' bypasses the HTTP cache so a fresh deploy never precaches stale files
  e.waitUntil(
    caches
      .open(VERSION)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase, CDN: untouched
  e.respondWith(
    // no-cache = revalidate with the server (ETag) instead of trusting the 10-minute HTTP cache of GitHub Pages
    fetch(e.request, { cache: 'no-cache' })
      .then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});
