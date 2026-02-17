// Velcuri Service Worker — URL-pattern-aware caching strategy
const CACHE_NAME = 'velcuri-v1';
const STATIC_ASSETS = [
  '/styles/main.css',
  '/styles/components.css',
  '/scripts/player.js',
  '/scripts/countdown.js',
  '/manifest.json',
];

// Install: pre-cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: URL-pattern-aware caching
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Match pages (/ver-*-en-vivo/) — Network-first (data changes frequently)
  if (url.pathname.startsWith('/ver-') && url.pathname.includes('-en-vivo')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CSS, JS, manifest — Cache-first (versioned via build)
  if (url.pathname.match(/\.(css|js|json)$/) && !url.pathname.includes('search-index')) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // OG images and icons — Cache-first (rarely change)
  if (url.pathname.startsWith('/og/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Blog pages — Cache-first (rarely change)
  if (url.pathname.startsWith('/blog/')) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Liga, canal, equipo pages — Stale-while-revalidate (24h tolerance)
  if (url.pathname.startsWith('/liga/') || url.pathname.startsWith('/canal/') || url.pathname.startsWith('/equipo/')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // All other HTML pages (homepage, hubs, country pages) — Network-first
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});
