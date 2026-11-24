/* Service worker : rend le site installable et utilisable hors connexion.
   Stratégie « réseau d'abord » : on charge toujours la dernière version en ligne,
   et on se rabat sur la copie en cache si Internet est coupé. */
const CACHE = "haya-v9";
const ASSETS = ["/", "/index.html", "/style.css?v=9", "/data.js?v=9", "/checkout.js?v=9", "/assistant.js?v=9", "/tv.js?v=9", "/logo.svg", "/status.html",
                "/client.html", "/mentions-legales.html", "/404.html", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return; // ni formulaires, ni sites externes, ni API (commandes)
  e.respondWith(
    fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match("/404.html")))
  );
});
