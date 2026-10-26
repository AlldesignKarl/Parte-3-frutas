// Cálculos de tareas y notas (los mismos que la app Android).

const DAY_MS = 86_400_000;

/** Fecha local de hoy en formato ISO "2026-10-26". */
export function todayIso(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Días entre dos fechas ISO (b - a). */
export function daysBetween(aIso, bIso) {
  const a = isoToDate(aIso);
  const b = isoToDate(bIso);
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) -
    Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY_MS);
}

export function addDays(iso, n) {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + n);
  return todayIso(d);
}

const ceilDiv = (a, b) => (a <= 0 ? 0 : Math.ceil(a / b));

// ---------------------------------------------------------------- Tareas

export const hasPages = (t) => t.totalPages > 0;
export const isDone = (t) => t.completedAt != null;
export const remainingPages = (t) => Math.max(0, t.totalPages - t.pagesDone);
export const progress = (t) =>
  hasPages(t) ? Math.min(1, Math.max(0, t.pagesDone / t.totalPages)) : isDone(t) ? 1 : 0;

export const daysUntilExam = (t, today) => (t.examDate ? daysBetween(today, t.examDate) : null);
export const pagesOn = (t, day) => (t.dailyLog && t.dailyLog[day]) || 0;

/** Días para estudiar contando hoy y sin contar el del examen (examen hoy = 1). Si ya pasó, null. */
export function studyDaysLeft(t, today) {
  const days = daysUntilExam(t, today);
  if (days == null || days < 0) return null;
  return Math.max(1, days);
}

/** Páginas que tocan hoy, calculadas con lo que quedaba al empezar el día. */
export function goalToday(t, today) {
  if (!hasPages(t) || isDone(t)) return null;
  const days = studyDaysLeft(t, today);
  if (days == null) return null;
  const remainingAtStart = Math.min(t.totalPages, Math.max(0, t.totalPages - (t.pagesDone - pagesOn(t, today))));
  return ceilDiv(remainingAtStart, days);
}

export function pagesPerDayFromNow(t, today) {
  if (!hasPages(t) || isDone(t)) return null;
  const days = studyDaysLeft(t, today);
  if (days == null) return null;
  return ceilDiv(remainingPages(t), days);
}

export function withPagesDone(t, value, today, now) {
  if (!hasPages(t)) return t;
  const clamped = Math.min(t.totalPages, Math.max(0, Math.round(value)));
  const delta = clamped - t.pagesDone;
  if (delta === 0) return t;
  const log = { ...(t.dailyLog || {}) };
  log[today] = (log[today] || 0) + delta;
  const finished = clamped >= t.totalPages;
  return { ...t, pagesDone: clamped, dailyLog: log, completedAt: finished ? t.completedAt ?? now : null };
}

export const withPagesAdded = (t, delta, today, now) => withPagesDone(t, t.pagesDone + delta, today, now);

export const toggledDone = (t, now) => ({ ...t, completedAt: isDone(t) ? null : now });

export function edited(t, { title, notes, examDate, totalPages, pagesDone }, now) {
  const total = Math.max(0, totalPages | 0);
  const done = total > 0 ? Math.min(total, Math.max(0, pagesDone | 0)) : 0;
  let completedAt;
  if (total > 0) completedAt = done >= total ? t.completedAt ?? now : null;
  else if (t.totalPages > 0) completedAt = null;
  else completedAt = t.completedAt ?? null;
  return { ...t, title: title.trim(), notes: notes.trim(), examDate: examDate || null, totalPages: total, pagesDone: done, completedAt };
}

export function pendingSorted(tasks) {
  return tasks.filter((t) => !isDone(t)).sort((a, b) => {
    if (!a.examDate !== !b.examDate) return a.examDate ? -1 : 1;
    if (a.examDate && b.examDate && a.examDate !== b.examDate) return a.examDate < b.examDate ? -1 : 1;
    return a.createdAt - b.createdAt;
  });
}

export const doneSorted = (tasks) => tasks.filter(isDone).sort((a, b) => b.completedAt - a.completedAt);

export function dayOverview(tasks, today) {
  let studied = 0;
  let goal = 0;
  for (const t of tasks) {
    if (!hasPages(t)) continue;
    const g = isDone(t) ? null : goalToday(t, today);
    const pages = Math.max(0, pagesOn(t, today));
    if (g != null) {
      goal += g;
      studied += pages;
    } else if (isDone(t) && pages > 0) {
      goal += pages;
      studied += pages;
    }
  }
  return { pagesToday: studied, goalToday: goal };
}

export function relativeDay(days) {
  if (days === 0) return "hoy";
  if (days === 1) return "mañana";
  if (days === -1) return "ayer";
  return days > 1 ? `en ${days} días` : `hace ${-days} días`;
}

// ---------------------------------------------------------------- Notas

export const MAX_GRADE = 10;
export const PASS_GRADE = 5;

/** "Matemáticas", " matematicas " y "MATEMÁTICAS" son la misma asignatura. */
export function subjectKey(name) {
  return name.trim().replace(/\s+/g, " ").normalize("NFD").replace(/\p{Mn}+/gu, "").toLowerCase();
}

export function cleanSubjectName(name) {
  const s = name.trim().replace(/\s+/g, " ");
  return s.charAt(0).toLocaleUpperCase("es-ES") + s.slice(1);
}

/** El nombre que más se ha escrito; si empatan, el que lleva tildes y, si no, el más reciente. */
function preferredName(list) {
  const counts = new Map();
  for (const g of list) {
    const name = cleanSubjectName(g.subject);
    const c = counts.get(name) || { n: 0, last: 0 };
    counts.set(name, { n: c.n + 1, last: Math.max(c.last, g.createdAt) });
  }
  const accents = (s) => (s.match(/[^\x00-\x7F]/g) || []).length;
  return [...counts.entries()].sort(([a, x], [b, y]) => y.n - x.n || accents(b) - accents(a) || y.last - x.last)[0][0];
}

const collator = new Intl.Collator("es-ES", { sensitivity: "base" });

/** Agrupa por asignatura con la media aritmética de sus notas (un 4 y un 5 dan 4,5). */
export function bySubject(grades) {
  const groups = new Map();
  for (const g of grades) {
    const key = subjectKey(g.subject);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(g);
  }
  return [...groups.entries()]
    .map(([key, list]) => {
      const sorted = [...list].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
      return {
        key,
        name: preferredName(list),
        average: list.reduce((s, g) => s + g.value, 0) / list.length,
        grades: sorted,
      };
    })
    .sort((a, b) => collator.compare(a.name, b.name));
}

export const overallAverage = (subjects) =>
  subjects.length ? subjects.reduce((s, x) => s + x.average, 0) / subjects.length : null;

export function gradeLabel(v) {
  if (v < PASS_GRADE) return "Suspenso";
  if (v < 6) return "Aprobado";
  if (v < 7) return "Bien";
  if (v < 9) return "Notable";
  return "Sobresaliente";
}

/** Acepta "4,5" o "4.5"; null si no es un número entre 0 y 10. */
export function parseGrade(text) {
  const t = String(text).trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const v = Number(t);
  return v >= 0 && v <= MAX_GRADE ? v : null;
}

/** 4.5 -> "4,5", 7 -> "7", 7.666 -> "7,67" */
export function fmtGrade(v) {
  const r = Math.round(v * 100) / 100;
  return String(r).replace(".", ",");
}

// ---------------------------------------------------------------- Formatos

const SHORT_DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const SHORT_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const LONG_MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const LONG_DAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function fmtDateShort(iso) {
  const d = isoToDate(iso);
  return `${SHORT_DAYS[d.getDay()]} ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;
}

export function fmtDateLong(iso) {
  const d = isoToDate(iso);
  return `${LONG_DAYS[d.getDay()]}, ${d.getDate()} de ${LONG_MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function fmtTime(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtMoment(ms, today) {
  const day = todayIso(new Date(ms));
  const label = day === today ? "hoy" : day === addDays(today, -1) ? "ayer" : `el ${isoToDate(day).getDate()} ${SHORT_MONTHS[isoToDate(day).getMonth()]}`;
  return `${label} a las ${fmtTime(ms)}`;
}

export function fmtDuration(ms) {
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor(totalMin / 60) % 24;
  const m = totalMin % 60;
  if (d > 0) return h > 0 ? `${d} d ${h} h` : `${d} d`;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  return `${Math.max(1, m)} min`;
}

export const fmtPages = (n) => (Math.abs(n) === 1 ? `${n} pág` : `${n} págs`);

export const fmtDecimal = (v, decimals = 1) =>
  v.toLocaleString("es-ES", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Texto del día del examen y "urgencia" para el color de la etiqueta. */
export function examChip(t, today) {
  if (!t.examDate) return null;
  const days = daysUntilExam(t, today);
  const date = fmtDateShort(t.examDate);
  if (days < 0) return { text: `Examen: ${date} (ya pasó)`, level: "neutral" };
  if (days === 0) return { text: "¡Examen hoy!", level: "bad" };
  if (days === 1) return { text: `Examen mañana · ${date}`, level: "bad" };
  return { text: `Examen ${date} · en ${days} días`, level: days <= 3 ? "warning" : "primary" };
}

export function completionLine(t, today) {
  if (t.completedAt == null) return "Terminada";
  const parts = [`Terminada ${fmtMoment(t.completedAt, today)}`];
  if (hasPages(t)) parts.push(fmtPages(t.totalPages));
  if (t.examDate) {
    const margin = daysBetween(todayIso(new Date(t.completedAt)), t.examDate);
    parts.push(margin > 0 ? `${margin === 1 ? "1 día" : `${margin} días`} antes del examen` : margin === 0 ? "el día del examen" : "después del examen");
  }
  return parts.join(" · ");
}
