// Gráficas en SVG. Siguen las mismas reglas en todas: una sola serie por gráfica (el color de
// la sección), marcas finas con el extremo redondeado y la base recta, rejilla fina y textos en
// colores de texto. Cada marca tiene una zona táctil grande (data-*) para ver su detalle.
// Todo va en colores lisos y sin contornos oscuros: el modo oscuro de Samsung Internet oscurece
// los degradados y convierte los contornos oscuros en manchas claras encima de los números.
import { fmtGrade, isoToDate, weekdayLetter, MAX_GRADE, PASS_GRADE } from "./logic.js";

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/**
 * Columnas por día (la última es hoy). `days`: [{date, value, label?}].
 * `unit` se usa en el texto accesible ("págs", "min").
 */
export function dayColumns(days, { width, height = 170, unit, selected = null, hitAttr = "data-day", fmt = String }) {
  const top = 22;
  const bottom = 36;
  const plotH = height - top - bottom;
  const max = Math.max(1, ...days.map((d) => d.value));
  const slot = width / days.length;
  const barW = Math.min(24, slot * 0.46);
  const todayIdx = days.length - 1;
  let out = `<svg viewBox="0 0 ${width} ${height}" height="${height}" role="img" aria-label="${esc(
    days.map((d) => `${d.date}: ${fmt(d.value)} ${unit}`).join("; ")
  )}">`;
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
      out += `<path class="col${isToday ? " today" : ""}" style="animation-delay:${i * 40}ms" d="M${x0},${yb} V${y + r} Q${x0},${y} ${x0 + r},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${yb} Z"/>`;
      out += `<text class="value" x="${cx}" y="${y - 7}" text-anchor="middle">${fmt(d.value)}</text>`;
    } else {
      out += `<circle class="zero" cx="${cx}" cy="${top + plotH - 3}" r="2.5"/>`;
    }
    out += `<text class="axis${isToday ? " today-label" : ""}" x="${cx}" y="${height - 18}" text-anchor="middle">${isToday ? "Hoy" : weekdayLetter(d.date)}</text>`;
    out += `<text class="axis" x="${cx}" y="${height - 4}" text-anchor="middle">${isoToDate(d.date).getDate()}</text>`;
    out += `<rect class="hit" ${hitAttr}="${d.date}" x="${cx - slot / 2}" y="0" width="${slot}" height="${height}"><title>${fmt(d.value)} ${unit}</title></rect>`;
  });
  return `${out}</svg>`;
}

/** Línea con área suave para la media general a lo largo del tiempo (escala fija de 0 a 10). */
export function averageLine(points, { width, height = 190, selected = null }) {
  const left = 26;
  const right = 44;
  const top = 14;
  const bottom = 26;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const x = (i) => left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v) => top + plotH - (v / MAX_GRADE) * plotH;
  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  let out = `<svg viewBox="0 0 ${width} ${height}" height="${height}" role="img" aria-label="Media general después de cada nota: ${esc(
    points.map((p) => fmtGrade(p.value)).join(", ")
  )}">`;
  for (const tick of [0, MAX_GRADE]) {
    out += `<line class="grid" x1="${left}" x2="${width - right}" y1="${y(tick)}" y2="${y(tick)}"/>`;
  }
  out += `<line class="pass" x1="${left}" x2="${width - right}" y1="${y(PASS_GRADE)}" y2="${y(PASS_GRADE)}"/>`;
  for (const tick of [0, PASS_GRADE, MAX_GRADE]) {
    out += `<text class="axis" x="${left - 8}" y="${y(tick) + 4}" text-anchor="end">${tick}</text>`;
  }
  if (points.length > 1) {
    out += `<path class="area" d="${line} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z"/>`;
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
  if (lastDate === first) {
    // Todas las notas del mismo día: una sola fecha en el centro.
    out += `<text class="axis" x="${left + plotW / 2}" y="${height - 6}" text-anchor="middle">${fmt(first)}</text>`;
  } else {
    out += `<text class="axis" x="${x(0)}" y="${height - 6}" text-anchor="start">${fmt(first)}</text>`;
    out += `<text class="axis" x="${x(points.length - 1)}" y="${height - 6}" text-anchor="end">${fmt(lastDate)}</text>`;
  }
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

/** Barras horizontales: etiqueta a la izquierda, barra con el extremo redondeado y el valor al final. */
export function hbars(items, { width, fmt = String, label = "" }) {
  const rowH = 40;
  const labelW = Math.min(width * 0.4, 160);
  const x0 = labelW + 8;
  const x1 = width - 72;
  const max = Math.max(1, ...items.map((i) => i.value));
  const x = (v) => x0 + (v / max) * (x1 - x0);
  let out = `<svg viewBox="0 0 ${width} ${rowH * items.length}" height="${rowH * items.length}" role="img" aria-label="${esc(
    `${label}${items.map((i) => `${i.label}: ${fmt(i.value)}`).join("; ")}`
  )}">`;
  items.forEach((it, i) => {
    const cy = i * rowH + rowH / 2;
    const end = Math.max(x0 + 4, x(it.value));
    const r = Math.min(5, (end - x0) / 2);
    out += `<text x="0" y="${cy + 5}">${esc(it.label)}</text>`;
    out += `<path class="bar" style="animation-delay:${i * 50}ms" d="M${x0},${cy - 9} H${end - r} Q${end},${cy - 9} ${end},${cy - 9 + r} V${cy + 9 - r} Q${end},${cy + 9} ${end - r},${cy + 9} H${x0} Z"/>`;
    out += `<text class="value" x="${end + 7}" y="${cy + 5}">${esc(fmt(it.value))}</text>`;
  });
  return `${out}</svg>`;
}
