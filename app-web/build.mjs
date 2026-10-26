// Genera las dos versiones a partir del mismo código:
//   node build.mjs <carpeta-salida>
//   - <salida>/web/        → web instalable (PWA), con test de velocidad y Bluetooth
//   - <salida>/mi-panel.html → página para claude.ai (datos en la cuenta de Claude)
// Necesita esbuild (npx esbuild o node_modules/.bin/esbuild en la carpeta del build).
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || join(here, "build");
const esbuild = process.env.ESBUILD || "esbuild";
const run = (args) => execFileSync(esbuild, args, { cwd: here, stdio: ["ignore", "pipe", "inherit"] }).toString();

// Web instalable
const web = join(out, "web");
mkdirSync(join(web, "icons"), { recursive: true });
run(["app.js", "--bundle", "--minify", "--format=esm", "--target=chrome100", `--outfile=${join(web, "app.js")}`, "--log-level=warning"]);
run(["styles.css", "--minify", `--outfile=${join(web, "styles.css")}`, "--log-level=warning"]);
for (const f of ["index.html", "manifest.webmanifest", "vercel.json"]) copyFileSync(join(here, f), join(web, f));
for (const f of readdirSync(join(here, "icons"))) copyFileSync(join(here, "icons", f), join(web, "icons", f));
writeFileSync(join(web, "sw.js"), readFileSync(join(here, "sw.js"), "utf8").replace('"app.js", "logic.js",', '"app.js",'));

// Página de claude.ai: un solo archivo con el CSS y el JS dentro
const js = run(["app.js", "--bundle", "--minify", "--format=esm", "--target=chrome100", "--define:__ARTIFACT__=true", "--log-level=warning"]);
const css = run(["styles.css", "--minify", "--log-level=warning"]);
const html = readFileSync(join(here, "index.html"), "utf8");
const body = html.slice(html.indexOf(">", html.indexOf("<body")) + 1, html.indexOf("</body>")).trim();
const page = `<title>Mi Panel</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap">
<style>${css.trim()}</style>
${body}
<script type="module">${js.trim().replace(/<\/script/gi, "<\\/script")}</script>
`;
writeFileSync(join(out, "mi-panel.html"), page);
console.log(`web: ${web}\nclaude.ai: ${join(out, "mi-panel.html")} (${page.length} bytes)`);
