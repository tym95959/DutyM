const cacheName = "my-pwa-cache-v1";

// Make sure all paths exist at the root
const assets = [
  "/",
  "/myapps.html",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(cacheName)
      .then(cache => cache.addAll(assets))
      .catch(err => {
        console.error("Failed to cache assets:", err);
      })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
