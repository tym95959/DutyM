const cacheName = "my-pwa-cache-v1";
const assets = ["/", "/myapps.html", "/icon-192.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(assets)));
});

self.addEventListener("fetch", e=>{
  e.respondWith(caches.match(e.request).then(res=>res||fetch(e.request)));
});
