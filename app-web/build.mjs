// Genera las dos versiones a partir del mismo código:
//   node build.mjs <carpeta-salida>
//   - <salida>/web/        → web instalable (PWA), con test de velocidad y Bluetooth
//   - <salida>/mi-panel.html → página para claude.ai (datos en la cuenta de Claude)
// Necesita esbuild (npx esbuild o node_modules/.bin/esbuild en la carpeta del build).
import { execFileSync } from "node:child_process";
import { deflateSync, crc32 } from "node:zlib";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, "build");
const esbuild = process.env.ESBUILD || "esbuild";
const run = (args) => execFileSync(esbuild, args, { cwd: here, stdio: ["ignore", "pipe", "inherit"] }).toString();

// Fecha de esta versión (se ve en Inicio y en "Buscar actualización"), en hora de España.
const builtAt = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  .format(new Date())
  .replace(",", "");
const buildDefine = `--define:__BUILD__=${JSON.stringify(builtAt)}`;

// Web instalable
const web = join(out, "web");
mkdirSync(join(web, "icons"), { recursive: true });
const sha = (data) => createHash("sha256").update(data).digest("hex");
// El JS y el CSS llevan su huella en el nombre (app.<huella>.js): githack y GitHub tardan unos minutos
// en servir lo nuevo, cada archivo a su ritmo, pero un nombre nuevo no lo tiene guardado nadie. Así un
// index.html nuevo siempre carga su app.js, y uno de antes el suyo (publicar.mjs deja los de antes).
const hashedName = (code, base, ext) => {
  const name = `${base}.${sha(code).slice(0, 10)}.${ext}`;
  writeFileSync(join(web, name), code);
  return name;
};
const jsName = hashedName(run(["app.js", "--bundle", "--minify", "--format=esm", "--target=chrome100", buildDefine, "--log-level=warning"]), "app", "js");
const cssName = hashedName(run(["styles.css", "--minify", "--log-level=warning"]), "styles", "css");
const indexHtml = readFileSync(join(here, "index.html"), "utf8")
  .replace('href="styles.css"', `href="${cssName}"`)
  .replace('src="app.js"', `src="${jsName}"`);
if (!indexHtml.includes(jsName) || !indexHtml.includes(cssName)) throw new Error("index.html: no se han podido poner los nombres con huella");
writeFileSync(join(web, "index.html"), indexHtml);
for (const f of ["manifest.webmanifest", "vercel.json"]) copyFileSync(join(here, f), join(web, f));
for (const f of readdirSync(join(here, "icons"))) copyFileSync(join(here, "icons", f), join(web, "icons", f));
// Huella de cada archivo: el service worker comprueba que lo que baja es justo esta versión.
const shellFiles = ["index.html", cssName, jsName, "manifest.webmanifest", ...readdirSync(join(web, "icons")).map((f) => `icons/${f}`)];
const hashes = Object.fromEntries(shellFiles.map((f) => [f, sha(readFileSync(join(web, f)))]));
// Cada versión publicada lleva su propio nombre de caché: así el móvil sabe que hay una nueva y la baja entera.
const version = sha(JSON.stringify(hashes)).slice(0, 10);
const sw = readFileSync(join(here, "sw.js"), "utf8")
  .replace('const VERSION = "dev";', `const VERSION = "${version}";`)
  .replace("const HASHES = {};", `const HASHES = ${JSON.stringify(hashes)};`)
  .replace('"styles.css", "app.js", "logic.js", "charts.js", "importers.js",', `"${cssName}", "${jsName}",`);
if (!sw.includes(version) || !sw.includes(`"${jsName}", "manifest`) || sw.includes('"logic.js"')) throw new Error("sw.js: no se ha podido poner la versión");
writeFileSync(join(web, "sw.js"), sw);
writeFileSync(join(web, ".nojekyll"), ""); // GitHub Pages: servir los archivos tal cual

// Página de claude.ai: un solo archivo con el CSS y el JS dentro
const js = run(["app.js", "--bundle", "--minify", "--format=esm", "--target=chrome100", "--define:__ARTIFACT__=true", buildDefine, "--log-level=warning"]);
const css = run(["styles.css", "--minify", "--log-level=warning"]);
const html = readFileSync(join(here, "index.html"), "utf8");
const body = html.slice(html.indexOf(">", html.indexOf("<body")) + 1, html.indexOf("</body>")).trim();
const page = `<title>Mi Panel</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="color-scheme" content="dark">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap">
<style>${css.trim()}</style>
${body}
<script type="module">${js.trim().replace(/<\/script/gi, "<\\/script")}</script>
`;
writeFileSync(join(out, "mi-panel.html"), page);

// Archivos del test de velocidad de la versión de claude.ai (allí solo se puede descargar de la propia
// página): una imagen de ruido que no se puede comprimir y un archivo mínimo para el ping.
mkdirSync(join(out, "prueba"), { recursive: true });
writeFileSync(join(out, "prueba", "ping.txt"), "1");
writeFileSync(join(out, "prueba", "descarga.png"), noisePng(1200, 1200));

function noisePng(width, height) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bits
  ihdr[9] = 2; // RGB
  const rows = [];
  for (let y = 0; y < height; y++) rows.push(Buffer.from([0]), randomBytes(width * 3));
  const idat = deflateSync(Buffer.concat(rows), { level: 0 });
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}
console.log(`web: ${web}\nclaude.ai: ${join(out, "mi-panel.html")} (${page.length} bytes)`);
