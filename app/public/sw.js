// Offline support. Two caches with different strategies:
//
//   shell — the app itself. Network-first, so a deploy takes effect
//           immediately when there is signal, with the cache as fallback.
//   tiles — satellite imagery. Cache-first, because tiles never change
//           and re-fetching them over a weak connection is the slowest
//           part of loading the map.
//
// Mobile signal is unreliable across parts of the Harohalli campus, and
// a navigation app that fails where it is most needed is not much use.

const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;
const TILES = `tiles-${VERSION}`;

// Roughly 60 MB of imagery at typical tile sizes. Enough for the whole
// campus at usable zoom levels without filling the device.
const TILE_LIMIT = 1200;

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL && k !== TILES)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Evict oldest entries once the tile cache outgrows its budget.
async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map(k => cache.delete(k)));
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isTile = url.hostname.endsWith('arcgisonline.com');

  if (isTile) {
    event.respondWith(
      caches.open(TILES).then(async cache => {
        const hit = await cache.match(request);
        if (hit) return hit;
        try {
          const res = await fetch(request);
          if (res.ok) {
            cache.put(request, res.clone());
            trim(TILES, TILE_LIMIT);
          }
          return res;
        } catch {
          // No signal and no cached tile: let Leaflet show its blank
          // square rather than breaking the whole map.
          return Response.error();
        }
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(res => {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(request, copy));
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(request);
        if (hit) return hit;
        // Navigations that miss the cache fall back to the entry point,
        // which is cached after the first successful visit.
        if (request.mode === 'navigate') {
          const root = await caches.match('./');
          if (root) return root;
        }
        return Response.error();
      })
  );
});

// Lets the app ask how much imagery is stored, so the user can be told.
self.addEventListener('message', async e => {
  if (e.data === 'tile-count') {
    const cache = await caches.open(TILES);
    const keys = await cache.keys();
    e.source?.postMessage({ tiles: keys.length });
  }
  if (e.data === 'clear-tiles') {
    await caches.delete(TILES);
    e.source?.postMessage({ tiles: 0 });
  }
});
