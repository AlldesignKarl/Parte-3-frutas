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

// Tildes de las palabras habituales en nombres de asignaturas: se escribe "ingles" deprisa y se ve "Inglés".
const ACCENTED = Object.fromEntries(
  ("matemáticas inglés francés alemán catalán física química biología geología geografía educación música " +
    "tecnología informática filosofía economía latín religión plástica técnico técnica españa ética psicología " +
    "ingeniería artística comunicación programación robótica computación lógica estadística álgebra cálculo " +
    "análisis gramática ortografía física-química dibujo")
    .split(" ")
    .map((w) => [w.normalize("NFD").replace(/\p{Mn}+/gu, ""), w])
);

/** Pone las tildes que faltan en un nombre de asignatura. Si ya lleva alguna, se respeta tal cual. */
export function withAccents(name) {
  if (/[^\x00-\x7F]/.test(name)) return name;
  return name.replace(/[A-Za-z]+(?:-[A-Za-z]+)?/g, (w) => {
    const fixed = ACCENTED[w.toLowerCase()];
    if (!fixed || fixed === w.toLowerCase()) return w;
    if (w.length > 1 && w === w.toUpperCase()) return fixed.toLocaleUpperCase("es-ES");
    if (w[0] === w[0].toUpperCase()) return fixed.charAt(0).toLocaleUpperCase("es-ES") + fixed.slice(1);
    return fixed;
  });
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
  return withAccents([...counts.entries()].sort(([a, x], [b, y]) => y.n - x.n || accents(b) - accents(a) || y.last - x.last)[0][0]);
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

// ---------------------------------------------------------------- Estadísticas de estudio

/** Páginas estudiadas cada día de los últimos `n` días (el último es hoy), sumando todas las tareas. */
export function studyByDay(tasks, n, today, focus = {}) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    let pages = 0;
    for (const t of tasks) pages += Math.max(0, (t.dailyLog && t.dailyLog[date]) || 0);
    days.push({ date, pages, minutes: Math.max(0, focus[date] || 0) });
  }
  return days;
}

/** Días seguidos estudiando (páginas o minutos de foco). Si hoy aún no, cuenta hasta ayer. */
export function studyStreak(tasks, today, focus = {}) {
  const studied = (date) =>
    (focus[date] || 0) > 0 || tasks.some((t) => ((t.dailyLog && t.dailyLog[date]) || 0) > 0);
  let day = studied(today) ? today : addDays(today, -1);
  let streak = 0;
  while (studied(day) && streak < 3650) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

/** Exámenes que quedan (de tareas pendientes), del más cercano al más lejano. */
export function upcomingExams(tasks, today) {
  return tasks
    .filter((t) => !isDone(t) && t.examDate && daysBetween(today, t.examDate) >= 0)
    .sort((a, b) => (a.examDate < b.examDate ? -1 : a.examDate > b.examDate ? 1 : 0));
}

/** Etiqueta corta del día de la semana: "L", "M", "X"… */
export function weekdayLetter(iso) {
  return ["D", "L", "M", "X", "J", "V", "S"][isoToDate(iso).getDay()];
}

// ---------------------------------------------------------------- Notas: qué necesito y evolución

/**
 * Nota que hace falta en el próximo examen de una asignatura para que su media llegue a `target`.
 * Devuelve { needed, status }: "done" si ya se tiene aunque se saque un 0, "impossible" si haría falta más de un 10.
 */
export function neededGrade(subject, target) {
  const n = subject.grades.length;
  const sum = subject.grades.reduce((s, g) => s + g.value, 0);
  const needed = target * (n + 1) - sum;
  if (needed <= 0) return { needed: 0, status: "done" };
  if (needed > MAX_GRADE) return { needed, status: "impossible" };
  return { needed: Math.ceil(needed * 100) / 100, status: "ok" };
}

/** Media general (de las medias de cada asignatura) después de cada nota, en orden de fecha. */
export function averageTimeline(grades) {
  const sorted = [...grades].sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1));
  const points = [];
  const seen = [];
  for (const g of sorted) {
    seen.push(g);
    points.push({ date: g.date, value: overallAverage(bySubject(seen)), grade: g });
  }
  return points;
}

/** Notas de una asignatura de la más antigua a la más reciente (para su minigráfica). */
export const subjectTrend = (subject) => [...subject.grades].reverse().map((g) => g.value);

/** Nombre comercial a partir del código de modelo (Samsung y algunos más). */
export function friendlyModel(code) {
  if (!code) return null;
  const c = code.toUpperCase();
  const samsung = [
    ["SM-S93", { 1: "Galaxy S25", 6: "Galaxy S25+", 8: "Galaxy S25 Ultra", 7: "Galaxy S25 Edge" }],
    ["SM-S92", { 1: "Galaxy S24", 6: "Galaxy S24+", 8: "Galaxy S24 Ultra", 4: "Galaxy S24 FE" }],
    ["SM-S91", { 1: "Galaxy S23", 6: "Galaxy S23+", 8: "Galaxy S23 Ultra" }],
    ["SM-S90", { 1: "Galaxy S22", 6: "Galaxy S22+", 8: "Galaxy S22 Ultra" }],
    ["SM-S71", { 1: "Galaxy S23 FE" }],
  ];
  for (const [prefix, models] of samsung) {
    if (c.startsWith(prefix) && models[c[6]]) return `Samsung ${models[c[6]]}`;
  }
  const a = c.match(/^SM-A(\d{2})(\d)/);
  if (a) return `Samsung Galaxy A${a[1]}${a[2] === "6" ? " 5G" : ""}`;
  const z = { "SM-F94": "Galaxy Z Fold6", "SM-F74": "Galaxy Z Flip6", "SM-F95": "Galaxy Z Fold7", "SM-F76": "Galaxy Z Flip7", "SM-F93": "Galaxy Z Fold5", "SM-F73": "Galaxy Z Flip5" };
  for (const [prefix, name] of Object.entries(z)) if (c.startsWith(prefix)) return `Samsung ${name}`;
  return null;
}

// ---------------------------------------------------------------- Batería: tiempo estimado propio

/**
 * Añade una lectura de batería al registro si el nivel ha cambiado. El registro se reinicia al
 * enchufar/desenchufar o si la última lectura tiene más de 2 h.
 */
export function addBatterySample(log, level, charging, now) {
  const fresh = { charging, samples: [{ t: now, level }] };
  if (!log || log.charging !== charging || !log.samples.length) return fresh;
  const last = log.samples[log.samples.length - 1];
  if (now - last.t > 2 * 3600000) return fresh;
  if (Math.abs(last.level - level) < 0.005) return log;
  return { charging, samples: [...log.samples, { t: now, level }].slice(-40) };
}

/**
 * Tiempo hasta el 100 % (cargando) o hasta el 0 % (descargando) con el ritmo visto en este rato.
 * La primera lectura es al abrir (a mitad de un 1 %), así que se mide desde el primer cambio visto:
 * hace falta ver cambiar el nivel al menos dos veces. Devuelve milisegundos o null.
 */
export function batteryEstimate(log, level, charging) {
  if (!log || log.charging !== charging || log.samples.length < 3) return null;
  const from = log.samples[1];
  const to = log.samples[log.samples.length - 1];
  const dl = to.level - from.level;
  const dt = to.t - from.t;
  if (dt < 30000 || Math.abs(dl) < 0.009) return null;
  const perMs = dl / dt;
  if (charging && perMs > 0) return Math.round((1 - level) / perMs);
  if (!charging && perMs < 0) return Math.round(level / -perMs);
  return null;
}

// ---------------------------------------------------------------- Horario de clases

/** Días de la semana: 1 = lunes … 7 = domingo. */
export const WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const WEEKDAY_LETTERS = ["L", "M", "X", "J", "V", "S", "D"];

export function isoWeekday(iso) {
  const d = isoToDate(iso).getDay();
  return d === 0 ? 7 : d;
}

/** "08:30" → 510 (minutos desde medianoche). */
export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
}

/** "08:30" → "8:30". */
export const fmtHour = (hhmm) => String(hhmm).replace(/^0(\d)/, "$1");

/** Las clases de un día, por hora de empezar. */
export function classesOn(schedule, weekday) {
  return schedule
    .filter((c) => c.day === weekday)
    .sort((a, b) => toMinutes(a.start) - toMinutes(b.start) || toMinutes(a.end) - toMinutes(b.end));
}

/** Las clases del día y cuál toca ahora y cuál después, a una hora (minutos desde medianoche). */
export function classStatus(schedule, weekday, minute) {
  const list = classesOn(schedule, weekday);
  const current = list.find((c) => toMinutes(c.start) <= minute && minute < toMinutes(c.end)) || null;
  const next = list.find((c) => toMinutes(c.start) > minute) || null;
  return { list, current, next };
}

/** El próximo día con clase después de `weekday`: { day, offset (días), first (primera clase) }. */
export function nextSchoolDay(schedule, weekday) {
  for (let i = 1; i <= 7; i++) {
    const day = ((weekday - 1 + i) % 7) + 1;
    const list = classesOn(schedule, day);
    if (list.length) return { day, offset: i, first: list[0] };
  }
  return null;
}

// ---------------------------------------------------------------- Logros

/** Días en los que se estudió algo (páginas o minutos de foco), ordenados. */
function studiedDays(tasks, focus = {}) {
  const pages = {};
  for (const t of tasks) for (const [day, n] of Object.entries(t.dailyLog || {})) pages[day] = (pages[day] || 0) + n;
  const days = new Set(Object.keys(pages).filter((d) => pages[d] > 0));
  for (const [day, m] of Object.entries(focus)) if (m > 0) days.add(day);
  return [...days].sort();
}

/** La racha más larga de días seguidos estudiando en todo el historial. */
export function bestStreak(tasks, focus = {}) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const day of studiedDays(tasks, focus)) {
    run = prev && daysBetween(prev, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

/**
 * Logros calculados con lo que hay apuntado (nada inventado). Cada uno: { id, icon, title, desc,
 * cur, goal, done }. `cur` y `goal` sirven para la barra de progreso de los que tienen varios pasos.
 */
export function achievements(tasks, grades, focus = {}) {
  const done = tasks.filter(isDone);
  const pages = tasks.reduce((s, t) => s + Math.max(0, t.pagesDone || 0), 0);
  const early = done.filter((t) => t.examDate && todayIso(new Date(t.completedAt)) < t.examDate).length;
  const streak = bestStreak(tasks, focus);
  const minutes = Object.values(focus).reduce((s, m) => s + Math.max(0, m), 0);
  const top = grades.reduce((m, g) => Math.max(m, g.value), 0);
  const subjects = bySubject(grades);
  const passed = subjects.filter((s) => s.average >= PASS_GRADE).length;
  const list = [
    ["tarea-1", "📘", "Primera tarea", "Termina tu primera tarea", done.length, 1],
    ["tareas-10", "🏅", "Imparable", "Termina 10 tareas", done.length, 10],
    ["a-tiempo", "🎯", "Con tiempo", "Termina una tarea antes del día de su examen", early, 1],
    ["paginas-50", "📖", "Buen ritmo", "Estudia 50 páginas", pages, 50],
    ["paginas-250", "📚", "Ratón de biblioteca", "Estudia 250 páginas", pages, 250],
    ["paginas-1000", "🏛️", "Biblioteca andante", "Estudia 1000 páginas", pages, 1000],
    ["racha-3", "🔥", "Racha de 3", "Estudia 3 días seguidos", streak, 3],
    ["racha-7", "⚡", "Semana perfecta", "Estudia 7 días seguidos", streak, 7],
    ["racha-30", "👑", "Un mes sin fallar", "Estudia 30 días seguidos", streak, 30],
    ["foco-25", "⏱️", "Primera sesión", "Suma 25 minutos de foco", minutes, 25],
    ["foco-600", "🧘", "Mente zen", "Suma 10 horas de foco", minutes, 600],
    ["nota-9", "🌟", "Sobresaliente", "Saca un 9 o más", top >= 9 ? 1 : 0, 1],
    ["nota-10", "💯", "Un 10", "Saca un 10", top >= MAX_GRADE ? 1 : 0, 1],
    ["aprobado", "✅", "Todo aprobado", "Ten 3 asignaturas o más y todas aprobadas",
      subjects.length >= 3 && passed === subjects.length ? 1 : 0, 1],
  ];
  return list.map(([id, icon, title, desc, cur, goal]) => ({ id, icon, title, desc, cur: Math.min(cur, goal), goal, done: cur >= goal }));
}

// ---------------------------------------------------------------- Tiempo (códigos WMO de Open-Meteo)

/** Texto e icono para un código del tiempo de la OMM. */
export function weatherInfo(code, isDay = true) {
  const c = Number(code);
  if (c === 0) return { label: "Despejado", icon: isDay ? "☀️" : "🌙" };
  if (c === 1) return { label: "Casi despejado", icon: isDay ? "🌤️" : "🌙" };
  if (c === 2) return { label: "Algunas nubes", icon: isDay ? "⛅" : "☁️" };
  if (c === 3) return { label: "Nublado", icon: "☁️" };
  if (c === 45 || c === 48) return { label: "Niebla", icon: "🌫️" };
  if (c >= 51 && c <= 57) return { label: "Llovizna", icon: "🌦️" };
  if (c === 61 || c === 80) return { label: "Lluvia débil", icon: "🌦️" };
  if (c === 63 || c === 81) return { label: "Lluvia", icon: "🌧️" };
  if (c === 65 || c === 82) return { label: "Lluvia fuerte", icon: "🌧️" };
  if (c === 66 || c === 67) return { label: "Lluvia helada", icon: "🌧️" };
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return { label: "Nieve", icon: "🌨️" };
  if (c === 95 || c === 96 || c === 99) return { label: "Tormenta", icon: "⛈️" };
  return { label: "—", icon: "🌡️" };
}

// ---------------------------------------------------------------- Dinero (importes en céntimos)

export const EXPENSE_CATS = [
  { id: "comida", label: "Comida", icon: "🍔" },
  { id: "ocio", label: "Ocio", icon: "🎮" },
  { id: "ropa", label: "Ropa", icon: "👕" },
  { id: "transporte", label: "Transporte", icon: "🚌" },
  { id: "movil", label: "Móvil y apps", icon: "📱" },
  { id: "regalos", label: "Regalos", icon: "🎁" },
  { id: "estudios", label: "Estudios", icon: "📚" },
  { id: "otros", label: "Otros", icon: "📦" },
];
export const INCOME_CATS = [
  { id: "paga", label: "Paga", icon: "💶" },
  { id: "regalo", label: "Regalo", icon: "🎁" },
  { id: "trabajo", label: "Trabajos", icon: "💼" },
  { id: "venta", label: "Ventas", icon: "🏷️" },
  { id: "otros", label: "Otros", icon: "💰" },
];
export const moneyCat = (type, id) =>
  (type === "ingreso" ? INCOME_CATS : EXPENSE_CATS).find((c) => c.id === id) || { id: "otros", label: "Otros", icon: type === "ingreso" ? "💰" : "📦" };

export const emptyMoney = () => ({ entries: [], goals: [], budget: null });

/** "12,5" → 1250 céntimos. Vacío, cero, negativo o más de un millón → null. */
export function parseAmount(text) {
  let t = String(text).trim().replace(/\s|€/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", "."); // "1.234,50"
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const cents = Math.round(Number(t) * 100);
  return cents > 0 && cents <= 100000000 ? cents : null;
}

/** 123456 → "1.234,56 €" (con `sign`, "+1.234,56 €" o "−1.234,56 €"). Sin decimales si son ,00 y `short`. */
export function fmtMoney(cents, { sign = false, short = false } = {}) {
  const abs = Math.abs(Math.round(cents));
  const euros = Math.floor(abs / 100);
  const dec = String(abs % 100).padStart(2, "0");
  const int = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const num = short && dec === "00" ? int : `${int},${dec}`;
  const s = sign ? (cents > 0 ? "+" : cents < 0 ? "−" : "") : cents < 0 ? "−" : "";
  return `${s}${num} €`;
}

/** Lo que tienes: entra − sale; de eso, lo apartado en huchas y lo que queda libre. */
export function moneyTotals(money) {
  let income = 0;
  let spent = 0;
  for (const e of money.entries) {
    if (e.type === "ingreso") income += e.amount;
    else spent += e.amount;
  }
  const saved = money.goals.reduce((s, g) => s + Math.max(0, g.saved), 0);
  return { income, spent, total: income - spent, saved, available: income - spent - saved };
}

export const monthOf = (iso) => iso.slice(0, 7);

/** Gastos e ingresos de un mes ("2026-10") y los gastos por categoría, de más a menos. */
export function monthSummary(entries, month) {
  let spent = 0;
  let income = 0;
  const cats = {};
  for (const e of entries) {
    if (monthOf(e.date) !== month) continue;
    if (e.type === "ingreso") income += e.amount;
    else {
      spent += e.amount;
      cats[e.category] = (cats[e.category] || 0) + e.amount;
    }
  }
  const byCat = Object.entries(cats)
    .map(([id, amount]) => ({ cat: moneyCat("gasto", id), amount }))
    .sort((a, b) => b.amount - a.amount);
  return { spent, income, byCat };
}

/** Gasto de cada uno de los últimos `n` días (el último es hoy), en céntimos. */
export function spendByDay(entries, n, today) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    const value = entries.filter((e) => e.type !== "ingreso" && e.date === date).reduce((s, e) => s + e.amount, 0);
    days.push({ date, value });
  }
  return days;
}

/** Movimientos del más reciente al más antiguo, agrupados por día. */
export function entriesByDay(entries) {
  const sorted = [...entries].sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1));
  const groups = [];
  for (const e of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === e.date) last.items.push(e);
    else groups.push({ date: e.date, items: [e] });
  }
  return groups;
}

// ---------------------------------------------------------------- Cuentas atrás (cumpleaños y fechas)

/** Próxima vez que toca: los cumpleaños se repiten cada año (el 29 de febrero, el 28 si no es bisiesto). */
export function nextOccurrence(event, today) {
  if (event.type !== "cumple") return event.date;
  const [, m, d] = event.date.split("-").map(Number);
  const year = Number(today.slice(0, 4));
  const on = (y) => {
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const day = m === 2 && d === 29 && !leap ? 28 : d;
    return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };
  const thisYear = on(year);
  return thisYear >= today ? thisYear : on(year + 1);
}

/** Las que quedan (hoy incluido), de la más cercana a la más lejana, con días que faltan y años que cumple. */
export function upcomingEvents(events, today) {
  return events
    .map((e) => {
      const date = nextOccurrence(e, today);
      const birthYear = Number(e.date.slice(0, 4));
      const turns = e.type === "cumple" && birthYear > 1900 ? Number(date.slice(0, 4)) - birthYear : null;
      return { event: e, date, days: daysBetween(today, date), turns: turns > 0 ? turns : null };
    })
    .filter((x) => x.days >= 0)
    .sort((a, b) => a.days - b.days || a.event.name.localeCompare(b.event.name, "es"));
}

/** "hoy", "mañana", "en 5 días", "en 3 semanas"… */
export function countdownLabel(days) {
  if (days === 0) return "¡Hoy!";
  if (days === 1) return "Mañana";
  if (days < 14) return `En ${days} días`;
  if (days < 60) return `En ${Math.round(days / 7)} semanas`;
  return `En ${Math.round(days / 30.4)} meses`;
}

// ---------------------------------------------------------------- Extracto de Revolut → movimientos

const norm = (s) => String(s).trim().toLowerCase().normalize("NFD").replace(/\p{Mn}+/gu, "");
// Nombres de columna en inglés y en español (el extracto sale en el idioma de la app).
const COLUMNS = {
  type: ["type", "tipo"],
  product: ["product", "producto"],
  started: ["started date", "fecha de inicio", "fecha inicio"],
  completed: ["completed date", "fecha de finalizacion", "fecha de finalización", "fecha completada", "fecha"],
  description: ["description", "descripcion", "concepto"],
  amount: ["amount", "importe", "cantidad"],
  fee: ["fee", "comision", "comisiones"],
  currency: ["currency", "divisa", "moneda"],
  state: ["state", "estado"],
  balance: ["balance", "saldo"],
};

/** Número de una celda: 3.5, "-3.50", "-3,50", "1.234,50". */
function cellNumber(v) {
  if (typeof v === "number") return v;
  let t = String(v).trim().replace(/\s|€/g, "");
  if (!t) return null;
  if (t.includes(",")) t = t.includes(".") && t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(",", t.includes(".") ? "" : ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Fecha de una celda: "2026-10-27 14:03:22", "27/10/2026 14:03" o número de serie de Excel. */
function cellDate(v) {
  if (typeof v === "number") {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v * 86400000));
    return { date: d.toISOString().slice(0, 10), time: d.toISOString().slice(11, 19) };
  }
  const t = String(v).trim();
  let m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}:\d{2}(?::\d{2})?))?/.exec(t);
  if (m) return { date: `${m[1]}-${m[2]}-${m[3]}`, time: m[4] || "" };
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s+(\d{1,2}:\d{2}(?::\d{2})?))?/.exec(t);
  if (m) return { date: `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`, time: m[4] || "" };
  return null;
}

// Palabras que delatan la categoría de un pago.
const GUESS = [
  ["comida", /mcdonald|burger|kfc|telepizza|domino|glovo|just ?eat|uber ?eats|starbucks|mercadona|carrefour|lidl|dia\b|alcampo|eroski|aldi|panaderia|cafeteria|restaurante|bar\b|100 montaditos|goiko|tgb|foster|vips|kebab|pizza/],
  ["transporte", /renfe|metro|emt|tmb|bus\b|autobus|alsa|uber(?! ?eats)|cabify|bolt|bicing|taxi|tram|parking|gasolin|repsol|cepsa/],
  ["ropa", /zara|pull ?& ?bear|pull and bear|bershka|stradivarius|shein|primark|h ?& ?m|mango|jd sports|foot ?locker|decathlon|nike|adidas|springfield|lefties|vinted/],
  ["movil", /spotify|netflix|apple|itunes|google|play store|disney|hbo|max\.com|prime video|amazon prime|youtube|twitch|discord|movistar|vodafone|orange|digi|lowi|simyo|pepephone|o2/],
  ["ocio", /steam|playstation|psn|xbox|nintendo|epic games|roblox|fortnite|riot|cine|yelmo|cinesa|kinepolis|ocine|ticketmaster|entradas|fnac|game\b|bowling|karting/],
  ["estudios", /libreria|papeleria|casa del libro|abacus|copisteria|academia|escuela|instituto|colegio/],
  ["regalos", /regalo|gift/],
];

/** Categoría probable a partir del texto del extracto (o "otros"). */
export function guessCategory(description, income) {
  const d = norm(description);
  if (income) return /top.?up|recarga|ingreso de|pocket money|paga/.test(d) ? "paga" : /regalo|gift/.test(d) ? "regalo" : "otros";
  return GUESS.find(([, re]) => re.test(d))?.[0] || "otros";
}

/**
 * Filas del extracto (la primera, los títulos) → movimientos nuevos. Solo los terminados y en euros
 * de la cuenta principal; los que ya se habían metido antes (mismo `importId`) se saltan.
 * Devuelve { entries, balance: { balance, date } | null, opening, skipped: { repeated, otherCurrency, notDone } }.
 */
export function revolutEntries(rows, knownIds = new Set(), now = Date.now()) {
  if (!rows.length) throw new Error("vacío");
  const head = rows[0].map(norm);
  const col = {};
  for (const [key, names] of Object.entries(COLUMNS)) {
    const i = head.findIndex((h) => names.includes(h));
    if (i >= 0) col[key] = i;
  }
  if (col.amount == null || (col.completed == null && col.started == null) || col.description == null) throw new Error("columnas");
  const skipped = { repeated: 0, otherCurrency: 0, notDone: 0 };
  const parsed = [];
  for (const r of rows.slice(1)) {
    const amount = cellNumber(r[col.amount]);
    const when = cellDate(r[col.completed] ?? "") || cellDate(r[col.started] ?? "");
    if (amount == null || !when || amount === 0) continue;
    const stateText = col.state != null ? norm(r[col.state]) : "completed";
    if (stateText && !/^(completed|completado|completada)$/.test(stateText)) {
      skipped.notDone++;
      continue;
    }
    const currency = col.currency != null ? String(r[col.currency]).trim().toUpperCase() : "EUR";
    const product = col.product != null ? norm(r[col.product]) : "";
    if ((currency && currency !== "EUR") || (product && !/^(current|actual|cuenta corriente|corriente)$/.test(product))) {
      skipped.otherCurrency++;
      continue;
    }
    const fee = col.fee != null ? Math.abs(cellNumber(r[col.fee]) || 0) : 0;
    const balance = col.balance != null ? cellNumber(r[col.balance]) : null;
    const description = String(r[col.description]).trim();
    parsed.push({ ...when, amount, fee, balance, description, type: col.type != null ? String(r[col.type]).trim() : "" });
  }
  parsed.sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : a.date + a.time > b.date + b.time ? 1 : 0));
  const entries = [];
  parsed.forEach((p, i) => {
    const importId = `rv:${p.date} ${p.time}|${p.description}|${p.amount}|${p.balance ?? ""}`;
    if (knownIds.has(importId)) {
      skipped.repeated++;
      return;
    }
    const income = p.amount > 0;
    const cents = Math.round(Math.abs(p.amount) * 100) + (income ? -1 : 1) * Math.round(p.fee * 100);
    if (cents <= 0) return;
    entries.push({
      id: `rv-${now}-${i}`,
      createdAt: now + i,
      type: income ? "ingreso" : "gasto",
      amount: cents,
      category: guessCategory(`${p.type} ${p.description}`, income),
      note: p.description.slice(0, 60),
      date: p.date,
      importId,
    });
  });
  const withBalance = parsed.filter((p) => p.balance != null);
  const last = withBalance[withBalance.length - 1];
  const first = withBalance[0];
  return {
    entries,
    balance: last ? { balance: Math.round(last.balance * 100), date: last.date } : null,
    // Lo que había antes del primer movimiento del extracto (para que el total cuadre con Revolut).
    opening: first ? { amount: Math.round((first.balance - first.amount + first.fee) * 100), date: first.date } : null,
    skipped,
  };
}

// ---------------------------------------------------------------- Herramientas

/** QR de una red WiFi ("WIFI:T:WPA;S:MiCasa;P:clave;;") → { ssid, password, type } o null. */
export function parseWifiQr(text) {
  if (!/^WIFI:/i.test(text)) return null;
  const fields = {};
  const re = /([A-Z]+):((?:\\.|[^;\\])*);/gi;
  let m;
  while ((m = re.exec(text.slice(5)))) fields[m[1].toUpperCase()] = m[2].replace(/\\(.)/g, "$1");
  return fields.S == null ? null : { ssid: fields.S, password: fields.P ?? "", type: fields.T || "" };
}

/** Número entero al azar entre min y max (los dos incluidos), con el generador seguro del navegador. */
export function randomInt(min, max, rand = (n) => crypto.getRandomValues(new Uint32Array(n))) {
  const span = max - min + 1;
  const limit = Math.floor(0x100000000 / span) * span; // sin sesgo
  let v;
  do v = rand(1)[0];
  while (v >= limit);
  return min + (v % span);
}

// ---------------------------------------------------------------- Mensajes (app Android)

/**
 * Mensajes y llamadas perdidas (los manda la app Android) → llamadas y chats. Cada chat junta sus
 * mensajes (del más nuevo al más viejo) y cuenta los que han llegado después de `seen`.
 */
export function groupMessages(items, seen = 0) {
  const calls = [];
  const chats = new Map();
  for (const m of [...items].sort((a, b) => b.time - a.time)) {
    if (m.kind === "llamada") {
      calls.push(m);
      continue;
    }
    const key = `${m.pkg}|${m.chat}`;
    if (!chats.has(key)) chats.set(key, { key, app: m.app, pkg: m.pkg, chat: m.chat, items: [], unread: 0 });
    const c = chats.get(key);
    c.items.push(m);
    if (m.time > seen && m.sender !== "Tú") c.unread++;
  }
  const list = [...chats.values()].map((c) => ({ ...c, last: c.items[0] }));
  return {
    calls,
    chats: list,
    unread: list.reduce((s, c) => s + c.unread, 0) + calls.filter((c) => c.time > seen).length,
  };
}

/** "ahora", "hace 5 min", "10:24", "ayer 22:10", "lun 9:05" o "21 oct". */
export function relativeTime(ms, now = Date.now()) {
  const diff = Math.max(0, now - ms);
  if (diff < 60000) return "ahora";
  if (diff < 3600000) return `hace ${Math.floor(diff / 60000)} min`;
  const d = new Date(ms);
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  const days = daysBetween(todayIso(d), todayIso(new Date(now)));
  if (days === 0) return time;
  if (days === 1) return `ayer ${time}`;
  if (days < 7) return `${["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][d.getDay()]} ${time}`;
  return fmtDateShort(todayIso(d)).replace(/^\S+ /, ""); // "21 oct"
}
