const cacheName = "my-pwa-cache-v1";
const assets = ["/", "/myapps.html", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(
    caches.open(cacheName).then(cache=>cache.addAll(assets)).catch(err=>console.error("Cache error:", err))
  );
});

self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(res=>res || fetch(e.request)));
});
