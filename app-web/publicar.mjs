// Pone la web generada en docs/ (lo que sirve githack):
//   node publicar.mjs <salida>/web <repo>/docs
// Sustituye todo menos los app.<huella>.js y styles.<huella>.css de las últimas versiones: durante unos
// minutos githack aún puede dar el index.html de antes, y ese tiene que seguir encontrando los suyos.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [web, docs] = process.argv.slice(2);
if (!web || !docs) throw new Error("uso: node publicar.mjs <salida>/web <repo>/docs");
const KEEP = 3; // versiones anteriores que se dejan

const assetsOf = (html) => [...html.matchAll(/(?:src|href)="((?:app|styles)[^"/]*\.(?:js|css))"/g)].map((m) => m[1]);
const listFile = join(docs, "versiones.json");
let previous = [];
if (existsSync(listFile)) previous = JSON.parse(readFileSync(listFile, "utf8"));
else if (existsSync(join(docs, "index.html"))) previous = [assetsOf(readFileSync(join(docs, "index.html"), "utf8"))];

const current = assetsOf(readFileSync(join(web, "index.html"), "utf8"));
if (current.length !== 2) throw new Error(`index.html nuevo: se esperaban app y styles, hay ${current}`);
const versions = [current, ...previous.filter((v) => v.join() !== current.join())].slice(0, KEEP + 1);
const kept = new Map();
for (const name of new Set(versions.slice(1).flat())) {
  if (existsSync(join(docs, name))) kept.set(name, readFileSync(join(docs, name)));
}

rmSync(docs, { recursive: true, force: true });
cpSync(web, docs, { recursive: true });
rmSync(join(docs, "vercel.json"), { force: true });
for (const [name, data] of kept) writeFileSync(join(docs, name), data);
writeFileSync(listFile, JSON.stringify(versions) + "\n");
console.log(`docs/: ${current.join(", ")} · se dejan de antes: ${[...kept.keys()].join(", ") || "nada"}`);
