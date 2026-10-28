// Lectura de extractos bancarios (CSV y Excel .xlsx) sin librerías: el .xlsx es un ZIP con XML
// dentro, que se descomprime con DecompressionStream. Funciona igual en el navegador y en Node.

/** CSV → filas. Detecta si separa con comas o con punto y coma y respeta las comillas. */
export function parseCsv(text) {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.slice(0, src.indexOf("\n") >>> 0);
  const sep = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

/** Los archivos de un ZIP: { nombre: Uint8Array }. Solo los que pide `wanted` (para no descomprimir de más). */
async function unzip(buffer, wanted) {
  const b = new Uint8Array(buffer);
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
    if (u32(b, i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("no es un zip");
  const count = u16(b, eocd + 10);
  let p = u32(b, eocd + 16);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (u32(b, p) !== 0x02014b50) break;
    const method = u16(b, p + 10);
    const size = u32(b, p + 20);
    const nameLen = u16(b, p + 28);
    const extraLen = u16(b, p + 30);
    const commentLen = u16(b, p + 32);
    const local = u32(b, p + 42);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!wanted(name)) continue;
    const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    const data = b.subarray(start, start + size);
    if (method === 0) files[name] = data;
    else if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      files[name] = new Uint8Array(await new Response(stream).arrayBuffer());
    }
  }
  return files;
}

const unescapeXml = (s) =>
  s.replace(/&(lt|gt|quot|apos|amp|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
    const map = { lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" };
    if (map[e.toLowerCase()]) return map[e.toLowerCase()];
    return String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  });
const texts = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unescapeXml(m[1])).join("");
const colIndex = (ref) => {
  let n = 0;
  for (const ch of ref.replace(/\d+/g, "")) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

/** Primera hoja de un .xlsx → filas (texto o número en cada celda). */
export async function readXlsx(buffer) {
  const files = await unzip(buffer, (n) => n === "xl/sharedStrings.xml" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const dec = new TextDecoder();
  const shared = files["xl/sharedStrings.xml"] ? [...dec.decode(files["xl/sharedStrings.xml"]).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => texts(m[1])) : [];
  const sheetName = Object.keys(files).filter((n) => n.startsWith("xl/worksheets/")).sort()[0];
  if (!sheetName) throw new Error("sin hojas");
  const xml = dec.decode(files[sheetName]);
  const rows = [];
  for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const c of r[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1];
      const body = c[2] || "";
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      const v = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value = "";
      if (type === "s") value = shared[Number(v)] ?? "";
      else if (type === "inlineStr") value = texts(body);
      else if (type === "str" || type === "b") value = unescapeXml(v ?? "");
      else if (v != null) value = Number(v);
      row[ref ? colIndex(ref) : row.length] = value;
    }
    for (let i = 0; i < row.length; i++) if (row[i] === undefined) row[i] = "";
    if (row.some((x) => String(x).trim() !== "")) rows.push(row);
  }
  return rows;
}

/** Un archivo (File/Blob) → filas, sea CSV o Excel. */
export async function readTable(file) {
  const buffer = await file.arrayBuffer();
  const b = new Uint8Array(buffer, 0, Math.min(4, buffer.byteLength));
  if (b[0] === 0x50 && b[1] === 0x4b) return readXlsx(buffer); // "PK": es un .xlsx
  return parseCsv(new TextDecoder().decode(buffer));
}
