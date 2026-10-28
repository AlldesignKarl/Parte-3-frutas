// La app abre al momento desde la copia guardada, como una app normal, y funciona sin conexión.
// Cada versión publicada tiene su propia caché (VERSION la pone el build): cuando hay una nueva se
// descarga entera de una vez en segundo plano, así nunca se mezclan archivos de dos versiones.
const VERSION = "04fc732dbd";
const CACHE = `mipanel-${VERSION}`;
const FONTS = "mipanel-fuentes";
const SHARED = "mipanel-compartido";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const SHELL = [
  "index.html", "styles.css", "app.js", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => ![CACHE, FONTS, SHARED].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Un extracto compartido con Mi Panel (desde Revolut, Archivos…): se guarda y se abre la app.
  if (req.method === "POST" && url.origin === self.location.origin && url.pathname.endsWith("/compartir")) {
    event.respondWith((async () => {
      try {
        const form = await req.formData();
        const file = form.get("archivo");
        if (file && typeof file !== "string") {
          const cache = await caches.open(SHARED);
          await cache.put("compartido", new Response(file, { headers: { "content-type": file.type || "application/octet-stream" } }));
        }
      } catch {
        // si no llega bien, la app se abre igual
      }
      return Response.redirect("./index.html?importar=1", 303);
    })());
    return;
  }
  if (req.method !== "GET") return;

  // Tipografías: se guardan la primera vez para que la app se vea igual sin conexión.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(FONTS).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res.ok) c.put(req, res.clone());
        return res;
      })))
    );
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Abrir la app (o cambiar de pestaña con ?pestana=…): siempre la copia de esta versión.
  if (req.mode === "navigate") {
    event.respondWith(caches.match("index.html").then((hit) => hit || fetch(req)));
    return;
  }
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }))
  );
});
