// Gráficas en SVG. Siguen las mismas reglas en todas: una sola serie por gráfica (el color de
// la sección), marcas finas con el extremo redondeado y la base recta, rejilla fina y textos en
// colores de texto. Cada marca tiene una zona táctil grande (data-*) para ver su detalle.
import { fmtGrade, isoToDate, weekdayLetter, MAX_GRADE, PASS_GRADE } from "./logic.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

let gradientId = 0;
const nextId = (name) => `${name}${++gradientId}`;

/**
 * Columnas por día (la última es hoy). `days`: [{date, value, label?}].
 * `unit` se usa en el texto accesible ("págs", "min").
 */
export function dayColumns(days, { width, height = 170, unit, selected = null, hitAttr = "data-day" }) {
  const top = 22;
  const bottom = 36;
  const plotH = height - top - bottom;
  const max = Math.max(1, ...days.map((d) => d.value));
  const slot = width / days.length;
  const barW = Math.min(24, slot * 0.46);
  const grad = nextId("col");
  const todayIdx = days.length - 1;
  let out = `<svg viewBox="0 0 ${width} ${height}" height="${height}" role="img" aria-label="${esc(
    days.map((d) => `${d.date}: ${d.value} ${unit}`).join("; ")
  )}"><defs><linearGradient id="${grad}" x1="0" x2="0" y1="1" y2="0">
    <stop offset="0" stop-color="var(--accent-2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>`;
  out += `<line class="grid" x1="0" x2="${width}" y1="${top + plotH}" y2="${top + plotH}"/>`;
  days.forEach((d, i) => {
    const cx = slot * i + slot / 2;
    const h = d.value > 0 ? Math.max(4, (d.value / max) * plotH) : 0;
    const y = top + plotH - h;
    const isToday = i === todayIdx;
    if (d.date === selected) out += `<rect class="sel" x="${cx - slot / 2 + 2}" y="0" width="${slot - 4}" height="${height - 4}" rx="12"/>`;
    if (h > 0) {
      const r = Math.min(5, h / 2, barW / 2);
      const x0 = cx - barW / 2;
      const x1 = cx + barW / 2;
      const yb = top + plotH;
      out += `<path class="col${isToday ? " today" : ""}" fill="url(#${grad})" style="animation-delay:${i * 40}ms" d="M${x0},${yb} V${y + r} Q${x0},${y} ${x0 + r},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${yb} Z"/>`;
      out += `<text class="value" x="${cx}" y="${y - 7}" text-anchor="middle">${d.value}</text>`;
    } else {
      out += `<circle class="zero" cx="${cx}" cy="${top + plotH - 3}" r="2.5"/>`;
    }
    out += `<text class="axis${isToday ? " today-label" : ""}" x="${cx}" y="${height - 18}" text-anchor="middle">${isToday ? "Hoy" : weekdayLetter(d.date)}</text>`;
    out += `<text class="axis" x="${cx}" y="${height - 4}" text-anchor="middle">${isoToDate(d.date).getDate()}</text>`;
    out += `<rect class="hit" ${hitAttr}="${d.date}" x="${cx - slot / 2}" y="0" width="${slot}" height="${height}"><title>${d.value} ${unit}</title></rect>`;
  });
  return `${out}</svg>`;
}

/** Línea con área suave para la media general a lo largo del tiempo (escala fija de 0 a 10). */
export function averageLine(points, { width, height = 190, selected = null }) {
  const left = 26;
  const right = 34;
  const top = 14;
  const bottom = 26;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const x = (i) => left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v) => top + plotH - (v / MAX_GRADE) * plotH;
  const area = nextId("area");
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  let out = `<svg viewBox="0 0 ${width} ${height}" height="${height}" role="img" aria-label="Media general después de cada nota: ${esc(
    points.map((p) => fmtGrade(p.value)).join(", ")
  )}"><defs><linearGradient id="${area}" x1="0" x2="0" y1="0" y2="1">
    <stop offset="0" stop-color="var(--accent)" stop-opacity="0.28"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
  for (const tick of [0, MAX_GRADE]) {
    out += `<line class="grid" x1="${left}" x2="${width - right}" y1="${y(tick)}" y2="${y(tick)}"/>`;
  }
  out += `<line class="pass" x1="${left}" x2="${width - right}" y1="${y(PASS_GRADE)}" y2="${y(PASS_GRADE)}"/>`;
  for (const tick of [0, PASS_GRADE, MAX_GRADE]) {
    out += `<text class="axis" x="${left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`;
  }
  if (points.length > 1) {
    out += `<path class="area" fill="url(#${area})" d="${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z"/>`;
    out += `<path class="line" pathLength="1" d="${line}"/>`;
  }
  points.forEach((p, i) => {
    const last = i === points.length - 1;
    const isSel = p.grade.id === selected;
    out += `<circle class="dot${last ? " last" : ""}${isSel ? " picked" : ""}" cx="${x(i)}" cy="${y(p.value)}" r="${last || isSel ? 5.5 : 4}"/>`;
  });
  const lastPoint = points[points.length - 1];
  out += `<text class="value" x="${x(points.length - 1) + 8}" y="${y(lastPoint.value) + 5}">${fmtGrade(lastPoint.value)}</text>`;
  const first = points[0].date;
  const lastDate = lastPoint.date;
  const fmt = (iso) => { const d = isoToDate(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };
  out += `<text class="axis" x="${x(0)}" y="${height - 6}" text-anchor="${points.length === 1 ? "middle" : "start"}">${fmt(first)}</text>`;
  if (points.length > 1) out += `<text class="axis" x="${x(points.length - 1)}" y="${height - 6}" text-anchor="end">${fmt(lastDate)}</text>`;
  const slot = points.length === 1 ? plotW : plotW / (points.length - 1);
  points.forEach((p, i) => {
    out += `<rect class="hit" data-point="${esc(p.grade.id)}" x="${x(i) - slot / 2}" y="0" width="${slot}" height="${height}"/>`;
  });
  return `${out}</svg>`;
}

/** Minigráfica de las notas de una asignatura (de 0 a 10), con el último punto marcado. */
export function sparkline(values, { width = 84, height = 30, color = "var(--accent)" } = {}) {
  if (values.length < 2) return "";
  const pad = 4;
  const x = (i) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v) => pad + (height - pad * 2) * (1 - v / MAX_GRADE);
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const last = values.length - 1;
  return `<svg class="spark" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" aria-hidden="true">
    <line class="pass" x1="${pad}" x2="${width - pad}" y1="${y(PASS_GRADE)}" y2="${y(PASS_GRADE)}"/>
    <path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${x(last)}" cy="${y(values[last])}" r="3.5" fill="${color}"/></svg>`;
}
