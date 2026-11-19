/* PHARM MASTER progressive-web-app offline support */
const CACHE = "pharm-master-offline-v1";
const ROOT = new URL("./", self.registration.scope).href;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("pharm-master-offline-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(ROOT)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request, { ignoreSearch: true });
      if (cached) return cached;
      if (event.request.mode === "navigate") {
        const fallback = await caches.match(new URL("./index.html", ROOT).href);
        if (fallback) return fallback;
      }
      throw error;
    }
  })());
});
