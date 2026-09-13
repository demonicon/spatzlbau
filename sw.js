// Minimal service worker: caches the app shell so the PWA opens instantly.
// Strategy: network first, cache as fallback (fresh code after every deploy, no stale JS).
// Offline editing is deliberately out of scope; Supabase requests are never cached.
const VERSION = 'spatzlbau-v0.1.1';
const SHELL = [
  './',
  './index.html',
  './app.css',
  './manifest.json',
  './seed.json',
  './app/main.js',
  './app/config.js',
  './app/supabase.js',
  './app/state.js',
  './app/auth.js',
  './app/seed-merge.js',
  './app/ui/dom.js',
  './app/ui/labels.js',
  './app/ui/task.js',
  './app/ui/detail.js',
  './app/views/week.js',
  './app/views/focus.js',
  './app/views/claude.js',
  './app/views/phases.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
    fetch(e.request)
      .then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html'))),
  );
});
