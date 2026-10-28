// La app abre al momento desde la copia guardada, como una app normal, y funciona sin conexión.
// Cada versión publicada tiene su propia caché (VERSION la pone el build): cuando hay una nueva se
// descarga entera de una vez en segundo plano, así nunca se mezclan archivos de dos versiones.
const VERSION = "f377846af7";
// Huella (SHA-256) de cada archivo de esta versión, también del build. GitHub y githack tardan unos
// minutos en servir lo nuevo, y cada archivo a su ritmo: si llega uno de antes, no se instala nada
// y se vuelve a intentar más tarde (si no, la app se quedaría con media versión vieja).
const HASHES = {"index.html":"c48c161a05d9821276850a665a0b83b7de9aa9645b99d65da2e423a998a99a58","styles.css":"193138f519096007e9b7dbfb3f13931529b1e1d8546aa3b298a0ddd3a543c2cf","app.js":"f8a81da1921e19f56d32dd19dd426d2a578034ab478ef079bf7814208b347003","manifest.webmanifest":"61b9c3993de21af62b1f15bd9320da21f480712a21a9ccd74d87ccccf0806600","icons/apple-touch-icon.png":"8f2c3cfb29c6bd8fafc5046faef9a41347d5d49ca8b19ebae90d731d74059fa7","icons/atajo-dinero.png":"f6339771aff367680132a0f65213848e4570f32abad74d168efc1792760de733","icons/atajo-foco.png":"0442fb734cb79996b43640a02ee3443f68fa903431ea698acab1f4b7ff94869d","icons/atajo-qr.png":"05c09d9d125a97685035b6f8ed1f896a35683eaedd601bf2bca5d871a9528f41","icons/atajo-tareas.png":"86e9812d9659a11896c24f78167229844878db0b0c56fa3988067fc54149471f","icons/icon-192.png":"d3b8e997cf68c0b09c2e5ab4d0f5aca23d653756984b49f75f65db4d8bf8a87a","icons/icon-512.png":"c2f05eda8ea8e6e302ccace7230b6b70f14dd5c50eb8d7a0f49f3ace5fed55f3","icons/icon-maskable-512.png":"cd16854191f3098616384f080f3c744707f2c457522dc135ca12483627cfa0cc","icons/icon-monochrome-512.png":"99b8d321f1aa37fa2b43cb3d705475a912698695bc0d10b6f0f5bd472ef0a04a","icons/icon.svg":"519c05a398d2538949446945ef69d844dc18b96362cbf8b51c3e74ff47d578d0"};
const CACHE = `mipanel-${VERSION}`;
const FONTS = "mipanel-fuentes";
const SHARED = "mipanel-compartido";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];
const SHELL = [
  "index.html", "styles.css", "app.js", "manifest.webmanifest",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png",
];

const hex = (buffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Baja un archivo sin pasar por ninguna caché y comprueba que es el de esta versión. */
async function fetchVerified(url) {
  const expected = HASHES[url];
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(new Request(attempt ? `${url}?nocache=${Date.now()}-${attempt}` : url, { cache: "reload" }));
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    if (!expected) return res;
    if (hex(await crypto.subtle.digest("SHA-256", await res.clone().arrayBuffer())) === expected) return res;
  }
  throw new Error(`${url}: el servidor todavía da la versión anterior`);
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    // Primero se bajan y se comprueban todos; solo entonces se guardan (nunca media versión).
    const responses = await Promise.all(SHELL.map(fetchVerified));
    const cache = await caches.open(CACHE);
    await Promise.all(SHELL.map((url, i) => cache.put(url, responses[i])));
    await self.skipWaiting();
  })());
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
