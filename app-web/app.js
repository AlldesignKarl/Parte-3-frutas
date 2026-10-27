import * as L from "./logic.js";
import * as C from "./charts.js";

// ================================================================ Utilidades

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const today = () => L.todayIso();

// En la versión que se publica en claude.ai (__ARTIFACT__ lo define el build) los datos se guardan
// en la cuenta de Claude y no hay test de velocidad, Bluetooth ni service worker.
// eslint-disable-next-line no-undef
const ARTIFACT = typeof __ARTIFACT__ !== "undefined" && __ARTIFACT__;

const ICON = {
  battery: "M15.67,4H14V2h-4v2H8.33C7.6,4 7,4.6 7,5.33v15.33C7,21.4 7.6,22 8.33,22h7.33c0.74,0 1.34,-0.6 1.34,-1.33V5.33C17,4.6 16.4,4 15.67,4z",
  bolt: "M11,21h-1l1,-7H7.5c-0.88,0 -0.33,-0.75 -0.31,-0.78C8.48,10.94 10.42,7.54 13.01,3h1l-1,7h3.51c0.4,0 0.62,0.19 0.4,0.66C12.97,17.55 11,21 11,21z",
  headphones: "M12,1c-4.97,0 -9,4.03 -9,9v7c0,1.66 1.34,3 3,3h3v-8H5v-2c0,-3.87 3.13,-7 7,-7s7,3.13 7,7v2h-4v8h3c1.66,0 3,-1.34 3,-3v-7c0,-4.97 -4.03,-9 -9,-9z",
  wifi: "M1,9l2,2c4.97,-4.97 13.03,-4.97 18,0l2,-2C16.93,2.93 7.08,2.93 1,9zM9,17l3,3 3,-3c-1.65,-1.66 -4.34,-1.66 -6,0zM5,13l2,2c2.76,-2.76 7.24,-2.76 10,0l2,-2C15.14,9.14 8.87,9.14 5,13z",
  speed: "M20.38,8.57l-1.23,1.85a8,8 0,0 1,-0.22 7.58H5.07A8,8 0,0 1,15.58 6.85l1.85,-1.23A10,10 0,0 0,3.35 19a2,2 0,0 0,1.72 1h13.85a2,2 0,0 0,1.74 -1a10,10 0,0 0,-0.27 -10.44zM10.59,15.41a2,2 0,0 0,2.83 0l5.66,-8.49 -8.49,5.66a2,2 0,0 0,0 2.83z",
  phone: "M16,1H8C6.34,1 5,2.34 5,4v16c0,1.66 1.34,3 3,3h8c1.66,0 3,-1.34 3,-3V4c0,-1.66 -1.34,-3 -3,-3zM14,21h-4v-1h4v1zM17.25,18H6.75V4h10.5v14z",
  book: "M21,5c-1.11,-0.35 -2.33,-0.5 -3.5,-0.5c-1.95,0 -4.05,0.4 -5.5,1.5c-1.45,-1.1 -3.55,-1.5 -5.5,-1.5S2.45,4.9 1,6v14.65c0,0.25 0.25,0.5 0.5,0.5c0.1,0 0.15,-0.05 0.25,-0.05C3.1,20.45 5.05,20 6.5,20c1.95,0 4.05,0.4 5.5,1.5c1.35,-0.85 3.8,-1.5 5.5,-1.5c1.65,0 3.35,0.3 4.75,1.05c0.1,0.05 0.15,0.05 0.25,0.05c0.25,0 0.5,-0.25 0.5,-0.5V6C22.4,5.55 21.75,5.25 21,5zM21,18.5c-1.1,-0.35 -2.3,-0.5 -3.5,-0.5c-1.7,0 -4.15,0.65 -5.5,1.5V8c1.35,-0.85 3.8,-1.5 5.5,-1.5c1.2,0 2.4,0.15 3.5,0.5V18.5z",
  chart: "M5,9.2h3V19H5V9.2zM10.6,5h2.8v14h-2.8V5zM16.2,13H19v6h-2.8v-6z",
  school: "M5,13.18v4L12,21l7,-3.82v-4L12,17l-7,-3.82zM12,3L1,9l11,6 9,-4.91V17h2V9L12,3z",
  event: "M17,12h-5v5h5v-5zM16,1v2H8V1H6v2H5c-1.11,0 -1.99,0.9 -1.99,2L3,19c0,1.1 0.89,2 2,2h14c1.1,0 2,-0.9 2,-2V5c0,-1.1 -0.9,-2 -2,-2h-1V1h-2zM19,19H5V8h14v11z",
  more: "M12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,10c-1.1,0 -2,0.9 -2,2s0.9,2 2,2 2,-0.9 2,-2 -0.9,-2 -2,-2zM12,16c-1.1,0 -2,0.9 -2,2s0.9,2 2,2 2,-0.9 2,-2 -0.9,-2 -2,-2z",
  add: "M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  close: "M19,6.41L17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12z",
  check: "M12,2C6.48,2 2,6.48 2,12s4.48,10 10,10 10,-4.48 10,-10S17.52,2 12,2zM10,17l-5,-5 1.41,-1.41L10,14.17l7.59,-7.59L19,8l-9,9z",
  down: "M7.41,8.59L12,13.17l4.59,-4.58L18,10l-6,6 -6,-6 1.41,-1.41z",
  up: "M7.41,15.41L12,10.83l4.59,4.58L18,14l-6,-6 -6,6z",
  timer: "M15,1H9v2h6V1zM11,14h2V8h-2v6zM19.03,7.39l1.42,-1.42c-0.43,-0.51 -0.9,-0.99 -1.41,-1.41l-1.42,1.42C16.07,4.74 14.12,4 12,4c-4.97,0 -9,4.03 -9,9s4.02,9 9,9 9,-4.03 9,-9c0,-2.12 -0.74,-4.07 -1.97,-5.61zM12,20c-3.87,0 -7,-3.13 -7,-7s3.13,-7 7,-7 7,3.13 7,7 -3.13,7 -7,7z",
  play: "M8,5v14l11,-7z",
  pause: "M6,19h4V5H6v14zM14,5v14h4V5h-4z",
  reset: "M12,5V1L7,6l5,5V7c3.31,0 6,2.69 6,6s-2.69,6 -6,6 -6,-2.69 -6,-6H4c0,4.42 3.58,8 8,8s8,-3.58 8,-8 -3.58,-8 -8,-8z",
  skip: "M6,18l8.5,-6L6,6v12zM16,6v12h2V6h-2z",
  flame: "M13.5,0.67s0.74,2.65 0.74,4.8c0,2.06 -1.35,3.73 -3.41,3.73 -2.07,0 -3.63,-1.67 -3.63,-3.73l0.03,-0.36C5.21,7.51 4,10.62 4,14c0,4.42 3.58,8 8,8s8,-3.58 8,-8C20,8.61 17.41,3.8 13.5,0.67zM11.71,19c-1.78,0 -3.22,-1.4 -3.22,-3.14 0,-1.62 1.05,-2.76 2.81,-3.12 1.77,-0.36 3.6,-1.21 4.62,-2.58 0.39,1.29 0.59,2.65 0.59,4.04 0,2.65 -2.15,4.8 -4.8,4.8z",
  target: "M12,2C6.49,2 2,6.49 2,12s4.49,10 10,10 10,-4.49 10,-10S17.51,2 12,2zM12,20c-4.41,0 -8,-3.59 -8,-8s3.59,-8 8,-8 8,3.59 8,8 -3.59,8 -8,8zM12,7c-2.76,0 -5,2.24 -5,5s2.24,5 5,5 5,-2.24 5,-5 -2.24,-5 -5,-5zM12,15c-1.66,0 -3,-1.34 -3,-3s1.34,-3 3,-3 3,1.34 3,3 -1.34,3 -3,3z",
  trend: "M16,6l2.29,2.29 -4.88,4.88 -4,-4L2,16.59 3.41,18l6,-6 4,4 6.3,-6.29L22,12V6z",
  bluetooth: "M17.71,7.71L12,2h-1v7.59L6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 11,14.41V22h1l5.71,-5.71 -4.3,-4.29 4.3,-4.29zM13,5.83l1.88,1.88L13,9.59V5.83zM14.88,16.29L13,18.17v-3.76l1.88,1.88z",
  sun: "M6.76,4.84l-1.8,-1.79 -1.41,1.41 1.79,1.79 1.42,-1.41zM4,10.5H1v2h3v-2zM13,0.55h-2V3.5h2V0.55zM20.45,4.46l-1.41,-1.41 -1.79,1.79 1.41,1.41 1.79,-1.79zM17.24,18.16l1.79,1.8 1.41,-1.41 -1.8,-1.79 -1.4,1.4zM20,10.5v2h3v-2h-3zM12,5.5c-3.31,0 -6,2.69 -6,6s2.69,6 6,6 6,-2.69 6,-6 -2.69,-6 -6,-6zM11,22.45h2V19.5h-2v2.95zM3.55,18.54l1.41,1.41 1.79,-1.8 -1.41,-1.41 -1.79,1.8z",
  trophy: "M19,5h-2V3H7v2H5C3.9,5 3,5.9 3,7v1c0,2.55 1.92,4.63 4.39,4.94c0.63,1.5 1.98,2.63 3.61,2.96V19H7v2h10v-2h-4v-3.1c1.63,-0.33 2.98,-1.46 3.61,-2.96C19.08,12.63 21,10.55 21,8V7C21,5.9 20.1,5 19,5zM5,8V7h2v3.82C5.84,10.4 5,9.3 5,8zM19,8c0,1.3 -0.84,2.4 -2,2.82V7h2V8z",
  music: "M12,3v10.55c-0.59,-0.34 -1.27,-0.55 -2,-0.55c-2.21,0 -4,1.79 -4,4s1.79,4 4,4 4,-1.79 4,-4V7h4V3h-6z",
  trash: "M6,19c0,1.1 0.9,2 2,2h8c1.1,0 2,-0.9 2,-2V7H6v12zM19,4h-3.5l-1,-1h-5l-1,1H5v2h14V4z",
};
const svg = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[name]}"/></svg>`;

/** Cabecera de cada pantalla: fecha pequeña de color y título grande. */
function topbar(title, actions = "") {
  const date = L.fmtDateLong(today()).replace(/ de \d{4}$/, "");
  return `<header class="topbar"><div class="titles"><p class="eyebrow">${date}</p><h1>${esc(title)}</h1></div>${actions}</header>`;
}

// Las tarjetas entran con una animación solo al cambiar de pestaña, no en cada +1.
let animateNext = true;
let animating = true; // el render en curso anima las gráficas
function stackClass() {
  animating = animateNext;
  const cls = animateNext ? "stack" : "stack still";
  animateNext = false;
  return cls;
}
const chartClass = () => (animating ? "chart anim" : "chart");

const IS_SAMSUNG = /SamsungBrowser/i.test(navigator.userAgent);
document.documentElement.classList.toggle("samsung", IS_SAMSUNG);

const clampPct = (pct) => Math.max(0, Math.min(100, pct));

// Anillos y barras de progreso van en SVG con colores lisos: el modo oscuro de Samsung Internet
// oscurece los degradados y los fondos de colores vivos, pero respeta los trazos y rellenos lisos.
function ring(pct, style = "", id = "") {
  const p = clampPct(pct);
  return `<svg class="ring${p ? "" : " empty"}"${id ? ` id="${id}"` : ""} viewBox="0 0 100 100" style="--p:${p};${style}" aria-hidden="true">
    <circle class="ring-track" cx="50" cy="50" r="44"/>
    <circle class="ring-bar" cx="50" cy="50" r="44" pathLength="100" transform="rotate(-90 50 50)"/></svg>`;
}

function meter(pct, { thick = false, color = "", cls = "" } = {}) {
  const p = clampPct(pct);
  const rx = thick ? 6 : 5;
  return `<svg class="meter${thick ? " thick" : ""}${cls ? ` ${cls}` : ""}" aria-hidden="true"${color ? ` style="--meter:${color}"` : ""}>
    <rect class="meter-track" width="100%" height="100%" rx="${rx}"/>${p ? `<rect class="meter-fill" width="${p}%" height="100%" rx="${rx}"/>` : ""}</svg>`;
}

/** "7,47" → "7" claro + ",47" en ámbar (colores lisos: se ven igual con el modo oscuro de Samsung). */
function heroNumber(v) {
  const [int, dec] = L.fmtGrade(v).split(",");
  return `${int}${dec ? `<span class="dec">,${dec}</span>` : ""}`;
}

function cardHead(icon, title, trailing = "") {
  return `<div class="card-head"><div class="badge-icon">${svg(icon)}</div><h2>${esc(title)}</h2>${trailing}</div>`;
}

const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

// ================================================================ Datos

const DATA_KEY = "mipanel:datos";
const state = {
  tab: storage.get("mipanel:pestana", "estado"),
  tasks: [],
  grades: [],
  focus: {}, // minutos de foco por día: { "2026-10-26": 50 }
  schedule: [], // horario de clases: { id, day (1 = lunes … 7), start "08:30", end "09:25", subject, room }
  scheduleDay: null, // día que se está editando en el horario
  showDone: false,
  selectedSubject: null,
  selectedDay: null,
  selectedFocusDay: null,
  selectedPoint: null,
  target: storage.get("mipanel:objetivo", 5),
  loading: ARTIFACT, // en claude.ai se espera a la cuenta antes de pintar "no tienes tareas"
  where: ARTIFACT ? "cloud" : "local",
};

function loadData() {
  const data = storage.get(DATA_KEY, {});
  state.tasks = Array.isArray(data.tasks) ? data.tasks : [];
  state.grades = Array.isArray(data.grades) ? data.grades : [];
  state.focus = isPlainObject(data.focus) ? data.focus : {};
  state.schedule = Array.isArray(data.schedule) ? data.schedule : [];
}

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);
const DATA_KEYS = ["tasks", "grades", "focus", "schedule"];

let persistAsked = false;
function saveData() {
  if (state.where === "cloud") {
    DATA_KEYS.forEach((k) => (cloud.dirty[k] = true));
    flushCloud();
    checkAchievements();
    return;
  }
  const ok = storage.set(DATA_KEY, { version: 1, tasks: state.tasks, grades: state.grades, focus: state.focus, schedule: state.schedule });
  if (!ok) toast("No se ha podido guardar en este navegador");
  // Pide al navegador que no borre los datos aunque falte espacio.
  if (!persistAsked && navigator.storage?.persist) {
    persistAsked = true;
    navigator.storage.persist().catch(() => {});
  }
  checkAchievements();
}

// ---------------------------------------------------------------- Cuenta de Claude (solo claude.ai)

const cloud = {
  docs: null,
  dirty: { tasks: false, grades: false, focus: false, schedule: false },
  written: { tasks: null, grades: null, focus: null, schedule: null },
  writing: false,
  loaded: { tasks: false, grades: false, focus: false, schedule: false },
};

const clone = (v) => JSON.parse(JSON.stringify(v));

async function initCloud() {
  try {
    const use = window.claude?.use;
    const [db, user] = use ? await Promise.all([use("db"), use("user")]) : [null, null];
    const uid = db && user ? await user.id() : null;
    if (!uid) throw new Error("sin cuenta");
    // Carpeta privada de quien abre la página: nadie más la ve, aunque se comparta el enlace.
    const base = `data/users/${uid}`;
    cloud.docs = {
      tasks: db.doc(`${base}/tareas`),
      grades: db.doc(`${base}/notas`),
      focus: db.doc(`${base}/foco`),
      schedule: db.doc(`${base}/horario`),
    };
    for (const key of DATA_KEYS) {
      cloud.docs[key].onSnapshot(
        (snap) => {
          if (snap.metadata.hasPendingWrites || cloud.dirty[key] || cloud.writing) return;
          const empty = key === "focus" ? {} : [];
          const items = snap.exists ? snap.data().items : empty;
          const valid = key === "focus" ? isPlainObject(items) : Array.isArray(items);
          const text = JSON.stringify(valid ? items : empty);
          cloud.written[key] = text;
          if (text !== JSON.stringify(state[key])) {
            state[key] = JSON.parse(text);
            if (state.tab !== "estado") render();
          }
          if (!cloud.loaded[key]) {
            cloud.loaded[key] = true;
            if (DATA_KEYS.every((k) => cloud.loaded[k])) {
              state.loading = false;
              render();
            }
          }
        },
        () => useLocalStorage("Se ha perdido la conexión con tu cuenta: los cambios se guardan solo en este navegador.")
      );
    }
  } catch {
    useLocalStorage("Abre Mi Panel con tu cuenta de Claude para guardar las tareas y notas. Mientras, se guardan solo en este navegador.");
  }
}

function useLocalStorage(message) {
  if (state.where === "local") return;
  state.where = "local";
  if (state.loading || (!state.tasks.length && !state.grades.length)) loadData();
  state.loading = false;
  render();
  toast(message, null, null, 8000);
}

/** Escribe en la cuenta lo que haya cambiado, de uno en uno (nunca dos escrituras a la vez). */
async function flushCloud() {
  if (cloud.writing || !cloud.docs) return;
  cloud.writing = true;
  try {
    for (const key of DATA_KEYS) {
      while (cloud.dirty[key]) {
        cloud.dirty[key] = false;
        const text = JSON.stringify(state[key]);
        if (text === cloud.written[key]) continue;
        try {
          await cloud.docs[key].set({ version: 1, items: clone(state[key]) });
          cloud.written[key] = text;
        } catch (e) {
          if (e?.code === "unavailable") {
            await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
            cloud.dirty[key] = true;
          } else {
            toast(e?.code === "quota_exceeded" ? "Tu espacio está lleno: borra tareas o notas antiguas." : "No se ha podido guardar en tu cuenta.");
          }
        }
      }
    }
  } finally {
    cloud.writing = false;
  }
  if (DATA_KEYS.some((k) => cloud.dirty[k])) flushCloud();
}

// ================================================================ Snackbar

let snackTimer = 0;
function toast(text, action, onAction, ms = 4000) {
  const bar = $("#snackbar");
  $("#snackbar-text").textContent = text;
  const btn = $("#snackbar-action");
  btn.hidden = !action;
  btn.textContent = action || "";
  btn.onclick = () => {
    hideToast();
    onAction?.();
  };
  bar.hidden = false;
  clearTimeout(snackTimer);
  snackTimer = setTimeout(hideToast, ms);
}

const toastQueue = [];
function hideToast() {
  $("#snackbar").hidden = true;
  setTimeout(nextToast, 250);
}
function nextToast() {
  if ($("#snackbar").hidden && toastQueue.length) toast(...toastQueue.shift());
}
/** Un aviso que espera a que acabe el que se está viendo (para no tapar un "Deshacer"). */
function toastAfter(...args) {
  toastQueue.push(args);
  setTimeout(nextToast, 30);
}

// ================================================================ Navegación

function setTab(tab) {
  state.tab = tab;
  storage.set("mipanel:pestana", tab);
  animateNext = true;
  render();
  window.scrollTo(0, 0);
}

function render() {
  document.body.dataset.section = state.tab;
  document.querySelectorAll(".tab").forEach((b) => {
    if (b.dataset.tab === state.tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  closeMenu();
  if (state.tab === "tareas") renderTasks();
  else if (state.tab === "notas") renderGrades();
  else if (state.tab === "foco") renderFocus();
  else renderStatus();
}

// ================================================================ Estado: batería

const status = {
  battery: null, // objeto BatteryManager
  bt: { state: "idle", name: "", level: null, message: "" },
  speed: { state: "idle" },
  device: null,
};

const BATT_KEY = "mipanel:bateria-muestras";

async function initBattery() {
  if (!navigator.getBattery) return;
  try {
    const b = await navigator.getBattery();
    status.battery = b;
    ["levelchange", "chargingchange", "chargingtimechange", "dischargingtimechange"].forEach((e) =>
      b.addEventListener(e, updateBattery)
    );
    updateBattery();
  } catch {
    status.batteryBlocked = true;
    updateBattery();
  }
}

function batteryColor(pct) {
  return pct <= 15 ? "var(--bad)" : pct <= 30 ? "var(--warning)" : "var(--good)";
}

/** Colores del anillo de batería según el nivel. */
function batteryGradient(pct) {
  if (pct <= 15) return ["var(--bad)", "#ff9a6b"];
  if (pct <= 30) return ["var(--warning)", "#ffe27a"];
  return ["var(--good)", "var(--cyan)"];
}

function updateBattery() {
  const box = $("#battery-body");
  if (!box) return;
  const b = status.battery;
  if (!b) {
    box.innerHTML = `<p class="hint">${
      !navigator.getBattery || status.batteryBlocked
        ? "Aquí no se puede leer la batería. Abre Mi Panel con Chrome en el móvil para verla."
        : "Leyendo la batería…"
    }</p>`;
    return;
  }
  const pct = Math.round(b.level * 100);
  const full = b.charging && pct >= 100;
  const [c1, c2] = batteryGradient(pct);
  // El tiempo que da Chrome no es fiable (puede decir "110 días"): la app lo calcula con lo que
  // ve subir o bajar la batería mientras está abierta.
  status.battLog = L.addBatterySample(status.battLog ?? storage.get(BATT_KEY, null), b.level, b.charging, Date.now());
  storage.set(BATT_KEY, status.battLog);
  const est = full ? null : L.batteryEstimate(status.battLog, b.level, b.charging);
  let time = "";
  if (full) time = "";
  else if (est != null && b.charging) time = `Al 100 % en ≈ ${L.fmtDuration(est)}`;
  else if (est != null) time = `Te queda ≈ ${L.fmtDuration(est)} al ritmo de ahora`;
  else if (b.charging) time = `<span class="small">Calculando cuánto tarda en cargar: en cuanto suba un 2 %, aquí sale el tiempo.</span>`;
  else time = `<span class="small">Calculando cuánto te dura: en cuanto baje un 2 %, aquí sale el tiempo.</span>`;
  const label = full ? "Carga completa" : b.charging ? "Cargando" : pct <= 15 ? "Batería baja" : "Con batería";
  const stateColor = b.charging || full ? "var(--good)" : pct <= 15 ? "var(--bad)" : pct <= 30 ? "var(--warning)" : "var(--text)";
  box.innerHTML = `
    <div class="battery">
      <div class="ring-wrap">
        ${ring(pct, `--c1:${c1};--c2:${c2}`)}
        <div class="center">
          ${b.charging ? `<svg class="bolt" viewBox="0 0 24 24" style="fill:${c1}"><path d="${ICON.bolt}"/></svg>` : ""}
          <div class="pct${pct >= 100 ? " full" : ""}">${pct}<small>%</small></div>
        </div>
      </div>
      <div class="grow">
        <p class="headline" style="color:${stateColor}">${label}</p>
        <div class="pills mt8">${b.charging ? `<span class="pill" style="--pill:var(--good)">${svg("bolt")}Enchufado</span>` : `<span class="pill" style="--pill:var(--muted)">Sin cargador</span>`}</div>
        ${time ? `<p class="mt12" style="margin-bottom:0">${time}</p>` : ""}
      </div>
    </div>
    <p class="small mt16" style="margin-bottom:0">El porcentaje es el exacto del sistema. El tiempo lo calcula la app viendo cómo cambia la batería mientras la tienes abierta.</p>`;
}

// ================================================================ Estado: el tiempo (Open-Meteo: gratis y sin cuenta)

// En claude.ai no se puede pedir nada a otras webs, así que ahí no sale esta tarjeta.
const WEATHER_KEY = "mipanel:tiempo";
const weather = { state: "idle", data: storage.get(WEATHER_KEY, null), error: "", tried: 0 };

function locate() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(Object.assign(new Error("sin ubicación"), { code: 2 }));
    navigator.geolocation.getCurrentPosition((p) => resolve(p.coords), reject, { maximumAge: 30 * 60000, timeout: 20000 });
  });
}

/** Pide el tiempo. Con `relocate` vuelve a mirar dónde estás; si no, usa el sitio de la última vez. */
async function loadWeather({ relocate = false } = {}) {
  if (weather.state === "loading") return;
  weather.state = "loading";
  weather.tried = Date.now();
  updateWeather();
  try {
    let lat = weather.data?.lat;
    let lon = weather.data?.lon;
    if (relocate || lat == null) {
      const c = await locate();
      // Redondeado a unos 1 km: basta para el tiempo y no manda la ubicación exacta.
      lat = Math.round(c.latitude * 100) / 100;
      lon = Math.round(c.longitude * 100) / 100;
    }
    const q = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      timezone: "auto",
      forecast_days: "2",
      current: "temperature_2m,apparent_temperature,weather_code,is_day",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { current: cur, daily: d } = await res.json();
    if (cur?.temperature_2m == null || !d?.temperature_2m_max) throw new Error("respuesta rara");
    const day = (i) => ({ code: d.weather_code?.[i], max: d.temperature_2m_max[i], min: d.temperature_2m_min?.[i], rain: d.precipitation_probability_max?.[i] });
    weather.data = {
      lat,
      lon,
      at: Date.now(),
      temp: cur.temperature_2m,
      feels: cur.apparent_temperature,
      code: cur.weather_code,
      isDay: cur.is_day !== 0,
      today: day(0),
      tomorrow: d.temperature_2m_max.length > 1 ? day(1) : null,
    };
    storage.set(WEATHER_KEY, weather.data);
    weather.error = "";
  } catch (e) {
    weather.error = e?.code === 1 ? "denied" : e?.code === 2 || e?.code === 3 ? "gps" : navigator.onLine === false ? "offline" : "fail";
    if (weather.data) toast(weather.error === "denied" ? "Sin permiso de ubicación: se queda el tiempo de antes" : "No se ha podido actualizar el tiempo");
  }
  weather.state = "idle";
  updateWeather();
}

function updateWeather() {
  const box = $("#weather-body");
  if (!box) return;
  const w = weather.data;
  if (!w) {
    if (weather.state === "loading") {
      box.innerHTML = `<p class="hint">Buscando el tiempo de tu zona…</p>`;
      return;
    }
    const why = {
      denied: "No hay permiso para ver tu ubicación. Actívalo en los ajustes del navegador (Sitios → Ubicación) y vuelve a probar.",
      gps: "No se ha podido saber dónde estás: activa la ubicación del móvil y vuelve a probar.",
      offline: "No hay internet ahora mismo.",
      fail: "No se ha podido cargar el tiempo. Prueba otra vez en un rato.",
    }[weather.error];
    box.innerHTML = `<p class="hint">${why || "Mira qué tiempo hace donde estás y si va a llover hoy o mañana."}</p>
      <button class="btn block mt12" data-action="weather">${svg("sun")}${weather.error ? "Probar otra vez" : "Ver el tiempo de aquí"}</button>
      ${weather.error ? "" : `<p class="small mt8">Te pedirá la ubicación. Solo se usa para saber el tiempo de tu zona.</p>`}`;
    return;
  }
  const now = L.weatherInfo(w.code, w.isDay);
  const deg = (v) => (v == null ? "—" : `${Math.round(v)}°`);
  const tmr = w.tomorrow && L.weatherInfo(w.tomorrow.code);
  box.innerHTML = `
    <div class="weather">
      <span class="weather-icon" aria-hidden="true">${now.icon}</span>
      <div class="grow">
        <div class="weather-temp num">${Math.round(w.temp)}<small>°</small></div>
        <div class="strong">${now.label}</div>
        <div class="small">Sensación ${deg(w.feels)} · Máx ${deg(w.today.max)} · Mín ${deg(w.today.min)}</div>
      </div>
    </div>
    <div class="mini-stats">
      <div><b class="num">${w.today.rain == null ? "—" : `${w.today.rain} %`}</b><span>de lluvia hoy</span></div>
      ${tmr ? `<div><b class="num">${tmr.icon} ${deg(w.tomorrow.max)} / ${deg(w.tomorrow.min)}</b><span>mañana${w.tomorrow.rain ? ` · lluvia ${w.tomorrow.rain} %` : ""}</span></div>` : ""}
    </div>
    <div class="row mt12"><span class="small grow">${weather.state === "loading" ? "Actualizando…" : `Actualizado a las ${L.fmtTime(w.at)}`}</span>
      <button type="button" class="btn text slim" data-action="weather-refresh" ${weather.state === "loading" ? "disabled" : ""}>Actualizar</button></div>`;
  // Si es de hace más de media hora, se actualiza solo (con el sitio de la última vez: sin pedir la ubicación).
  const stale = Date.now() - w.at > 30 * 60000 && Date.now() - weather.tried > 10 * 60000;
  if (weather.state !== "loading" && stale && navigator.onLine !== false) loadWeather();
}

// ================================================================ Estado: cascos (Web Bluetooth)

async function connectHeadphones() {
  if (!navigator.bluetooth) {
    status.bt = { state: "error", message: "Este navegador no puede usar Bluetooth. Prueba con Chrome." };
    updateBt();
    return;
  }
  try {
    status.bt = { state: "busy", message: "Elige tus cascos en la lista…" };
    updateBt();
    const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: ["battery_service"] });
    status.bt = { state: "busy", name: device.name || "Dispositivo", message: "Conectando…" };
    updateBt();
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService("battery_service");
    const ch = await service.getCharacteristic("battery_level");
    const value = await ch.readValue();
    status.bt = { state: "ok", name: device.name || "Dispositivo", level: value.getUint8(0) };
    updateBt();
    try {
      await ch.startNotifications();
      ch.addEventListener("characteristicvaluechanged", (e) => {
        status.bt.level = e.target.value.getUint8(0);
        updateBt();
      });
    } catch {
      // Algunos no avisan de los cambios: se queda el último valor.
    }
    device.addEventListener("gattserverdisconnected", () => {
      status.bt = { state: "idle", message: "Se ha desconectado." };
      updateBt();
    });
  } catch (e) {
    if (e?.name === "NotFoundError" && /cancel/i.test(e.message || "")) {
      status.bt = { state: "idle" };
    } else {
      status.bt = {
        state: "error",
        message: "Ese dispositivo no comparte su batería con el navegador (pasa con la mayoría de cascos). Mírala en Ajustes > Bluetooth o en la app de su marca.",
      };
    }
    updateBt();
  }
}

function updateBt() {
  const box = $("#bt-body");
  if (!box) return;
  if (ARTIFACT) {
    box.innerHTML = `<p class="hint">La batería de los cascos solo la puede leer la app instalable (APK): una página web no tiene acceso al Bluetooth. Mientras, la ves en Ajustes &gt; Bluetooth.</p>`;
    return;
  }
  const bt = status.bt;
  let html = "";
  if (bt.state === "ok") {
    html = `<div class="row">${svg("headphones")}<div class="grow"><div class="row"><span class="grow strong">${esc(bt.name)}</span>
      <span class="strong">${bt.level} %</span></div>${meter(bt.level, { color: batteryColor(bt.level), cls: "mt8" })}</div></div>`;
  } else {
    html = `<p class="hint">Los navegadores no pueden ver la batería de los cascos normales. Algunos modelos sí la comparten por Bluetooth: puedes probar con los tuyos.</p>
      ${bt.message ? `<p class="mt12 ${bt.state === "error" ? "" : "strong"}">${esc(bt.message)}</p>` : ""}
      <button class="btn tonal block mt16" data-action="bt" ${bt.state === "busy" ? "disabled" : ""}>Probar con mis cascos</button>`;
  }
  box.innerHTML = html;
}

// ================================================================ Estado: conexión y test de velocidad

function connectionInfo() {
  const type = navigator.connection?.type; // solo Chrome en Android y fuera de claude.ai
  return {
    online: navigator.onLine,
    kind: !navigator.onLine ? "none" : type === "wifi" ? "wifi" : type === "cellular" ? "mobile" : type === "ethernet" ? "ethernet" : "unknown",
  };
}

/** Calidad según el ping medido de verdad. */
function pingQuality(ms) {
  if (ms <= 40) return { label: "Excelente", color: "var(--good)" };
  if (ms <= 80) return { label: "Buena", color: "var(--good)" };
  if (ms <= 150) return { label: "Normal", color: "var(--warning)" };
  return { label: "Lenta", color: "var(--bad)" };
}

// En claude.ai solo se puede descargar de la propia página: el test usa archivos publicados con ella.
const SPEED = ARTIFACT
  ? { ping: () => "prueba/ping.txt", down: () => "prueba/descarga.png", upload: false, maxBytes: 60e6 }
  : {
      ping: () => `https://speed.cloudflare.com/__down?bytes=0&r=${Math.random()}`,
      down: () => `https://speed.cloudflare.com/__down?bytes=25000000&r=${Math.random()}`,
      upload: true,
      maxBytes: 150e6,
    };

/** Ping real: varias peticiones pequeñas, se descarta la primera y se queda la mediana. */
async function measurePing(signal, onStep) {
  const samples = [];
  for (let i = 0; i < 6; i++) {
    const t0 = performance.now();
    const r = await fetch(SPEED.ping(), { cache: "no-store", signal });
    await r.arrayBuffer();
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    if (i > 0) samples.push(performance.now() - t0);
    onStep?.(i);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    ping: Math.round(sorted[Math.floor(sorted.length / 2)]),
    jitter: Math.round(samples.slice(1).reduce((s, v, i) => s + Math.abs(v - samples[i]), 0) / (samples.length - 1)),
  };
}

async function autoPing() {
  if (status.pingBusy || !navigator.onLine || (status.ping && Date.now() - status.ping.at < 60000)) return;
  status.pingBusy = true;
  try {
    const { ping } = await measurePing();
    status.ping = { ms: ping, at: Date.now(), ok: true };
  } catch {
    status.ping = { ok: false, at: Date.now() };
  }
  status.pingBusy = false;
  updateNetwork();
}



function updateNetwork() {
  const box = $("#net-body");
  if (!box) return;
  const n = connectionInfo();
  if (n.kind === "none") {
    box.innerHTML = `<div class="row"><span class="orb" style="--orb:var(--bad)"></span><div class="grow"><p class="headline" style="color:var(--bad)">Sin conexión</p><p class="hint">No hay internet ahora mismo.</p></div></div>`;
    return;
  }
  const names = { wifi: "WiFi", mobile: "Datos móviles", ethernet: "Cable", unknown: "Conectado" };
  const p = status.ping;
  const q = p?.ok ? pingQuality(p.ms) : null;
  const orb = q ? q.color : p && !p.ok ? "var(--warning)" : "var(--accent)";
  const cells = [];
  if (p?.ok) cells.push(["Respuesta (ping)", `${p.ms} ms`]);
  const s = status.speed;
  if (s.state === "done") cells.push(["Velocidad medida", `${L.fmtDecimal(s.down, s.down >= 100 ? 0 : 1)} Mbps`]);
  box.innerHTML = `
    <div class="row">
      <span class="orb" style="--orb:${orb}"></span>
      <div class="grow">
        <p class="headline">${names[n.kind]}${q ? ` <span style="color:${q.color}">· ${q.label}</span>` : ""}</p>
        <p class="hint">${p?.ok ? "Internet funciona" : p ? "Internet no responde bien ahora" : "Comprobando internet…"}</p>
      </div>
    </div>
    ${cells.length ? `<div class="grid2 mt16">${cells.map(([l, v]) => `<div class="cell"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("")}</div>` : ""}
    ${n.kind === "unknown" ? `<p class="small mt12" style="margin-bottom:0">El navegador no dice si es WiFi o datos, ni la señal: solo se muestra lo que se mide de verdad.</p>` : ""}`;
}

let speedAbort = null;

async function runSpeedTest() {
  if (status.speed.state === "running") return;
  if (connectionInfo().kind === "mobile" && !(await confirmDialog(
    "Estás con datos móviles",
    "El test descarga datos durante unos segundos: puede gastar entre 20 y 150 MB de tu tarifa.",
    "Medir igualmente"
  ))) return;

  speedAbort = new AbortController();
  const signal = speedAbort.signal;
  const set = (s) => {
    status.speed = s;
    updateSpeed();
  };
  try {
    set({ state: "running", phase: "Midiendo ping…", progress: 0 });
    const { ping, jitter } = await measurePing(signal, (i) => set({ state: "running", phase: "Midiendo ping…", progress: (0.1 * (i + 1)) / 6 }));
    status.ping = { ms: ping, at: Date.now(), ok: true };

    const down = await measure("Midiendo bajada…", 8000, 3, 0.1, SPEED.upload ? 0.55 : 0.9, signal, ping, async (count, until, sig, full) => {
      while (performance.now() < until && !full()) {
        const r = await fetch(SPEED.down(), { cache: "no-store", signal: sig });
        const reader = r.body.getReader();
        while (performance.now() < until && !full()) {
          const { done, value } = await reader.read();
          if (done) break;
          count(value.byteLength);
        }
        reader.cancel().catch(() => {});
      }
    });

    let up = null;
    if (SPEED.upload) {
      try {
        const chunk = new Uint8Array(512 * 1024);
        for (let i = 0; i < chunk.length; i += 65536) crypto.getRandomValues(chunk.subarray(i, i + 65536));
        up = await measure("Midiendo subida…", 6000, 2, 0.65, 0.35, signal, ping, async (count, until, sig) => {
          while (performance.now() < until) {
            await fetch("https://speed.cloudflare.com/__up", { method: "POST", body: chunk, headers: { "Content-Type": "text/plain" }, signal: sig });
            count(chunk.byteLength);
          }
        });
      } catch (e) {
        if (signal.aborted) throw e;
      }
    }
    set({ state: "done", ping, jitter, down, up, at: Date.now() });
    updateNetwork();
  } catch (e) {
    if (signal.aborted) set({ state: "idle" });
    else set({ state: "error", message: "No se ha podido medir. ¿Hay internet?" });
  }
}

/** Mide la velocidad con varias conexiones a la vez durante `ms` milisegundos. */
async function measure(phase, ms, streams, start, span, signal, ping, worker) {
  let bytes = 0;
  const t0 = performance.now();
  const until = t0 + ms;
  const inner = new AbortController();
  const stop = () => inner.abort();
  signal.addEventListener("abort", stop);
  const timer = setInterval(() => {
    const secs = (performance.now() - t0) / 1000;
    status.speed = {
      state: "running", phase, ping,
      progress: start + span * Math.min(1, (secs * 1000) / ms),
      live: (bytes * 8) / secs / 1e6,
    };
    updateSpeed();
  }, 250);
  const hardStop = setTimeout(stop, ms + 1500);
  try {
    await Promise.all(
      Array.from({ length: streams }, () =>
        worker((n) => (bytes += n), until, inner.signal, () => bytes >= SPEED.maxBytes).catch(() => {})
      )
    );
  } finally {
    clearInterval(timer);
    clearTimeout(hardStop);
    signal.removeEventListener("abort", stop);
    inner.abort();
  }
  if (signal.aborted) throw new DOMException("Cancelado", "AbortError");
  const secs = Math.min(ms, performance.now() - t0) / 1000;
  if (bytes === 0) throw new Error("Sin datos");
  return (bytes * 8) / secs / 1e6;
}

function verdict(s) {
  if (s.down >= 100 && s.ping <= 40) return ["Muy rápida", "Va sobrada para vídeo 4K, juegos online y videollamadas."];
  if (s.down >= 25 && s.ping <= 80) return ["Buena", "Perfecta para series en HD, redes y videollamadas."];
  if (s.down >= 8) return ["Normal", "Bien para navegar y vídeo; puede ir justa con varias cosas a la vez."];
  if (s.down >= 2) return ["Lenta", "Vale para mensajes y webs; los vídeos pueden cargar a trozos."];
  return ["Muy lenta", "Casi no va: prueba a acercarte al router o cambiar de red."];
}

function updateSpeed() {
  const box = $("#speed-body");
  if (!box) return;
  const s = status.speed;
  const mbps = (v) => (v == null ? "—" : L.fmtDecimal(v, v >= 100 ? 0 : 1));
  if (s.state === "running") {
    box.innerHTML = `<div class="row"><span class="grow">${s.phase}</span>${s.live != null ? `<span class="strong num">${mbps(s.live)} Mbps</span>` : ""}</div>
      ${meter(Math.round(s.progress * 100), { cls: "mt8" })}
      <button class="btn outline block mt12" data-action="speed-cancel">Cancelar</button>`;
  } else if (s.state === "done") {
    const [title, text] = verdict(s);
    const cols = [["Ping", s.ping, "ms"], ["Bajada", mbps(s.down), "Mbps"]];
    if (SPEED.upload) cols.push(["Subida", mbps(s.up), "Mbps"]);
    box.innerHTML = `<div class="stats3" style="grid-template-columns:repeat(${cols.length},1fr)">
        ${cols.map(([l, v, u]) => `<div><div class="small">${l}</div><div class="big">${v}</div><div class="small">${u}</div></div>`).join("")}
      </div>
      <p class="mt12 strong" style="margin-bottom:2px">${title}</p><p class="hint" style="color:var(--text)">${text}</p>
      <p class="small">Variación del ping: ${s.jitter} ms · medido a las ${L.fmtTime(s.at)}</p>
      <button class="btn glass block mt12" data-action="speed">Repetir</button>`;
  } else {
    box.innerHTML = `${s.state === "error" ? `<p style="color:var(--bad)">${s.message}</p>` : `<p class="hint">${
      SPEED.upload
        ? "Mide el ping, la velocidad de bajada y la de subida (tarda unos 15 segundos)."
        : "Mide el ping y la velocidad de bajada descargando un archivo de prueba (unos 10 segundos; con datos móviles gasta entre 20 y 60 MB)."
    }</p>`}
      <button class="btn block mt12" data-action="speed">${s.state === "error" ? "Reintentar" : "Medir velocidad"}</button>`;
  }
}

// ================================================================ Estado: este móvil

async function initDevice() {
  const info = { model: null, android: null, hz: null };
  try {
    const ua = await navigator.userAgentData?.getHighEntropyValues(["model", "platformVersion"]);
    if (ua) {
      info.model = ua.model || null;
      if (ua.platform === "Android" && ua.platformVersion) info.android = `Android ${ua.platformVersion.split(".")[0]}`;
    }
  } catch {
    // No disponible: se usa lo que diga el user agent.
  }
  if (!info.android) {
    const m = navigator.userAgent.match(/Android ([\d.]+)/);
    if (m) info.android = `Android ${m[1]}`;
  }
  status.device = info;
  updateDevice();
  info.hz = await measureRefreshRate();
  updateDevice();
}

/** Hercios de la pantalla, midiendo cuánto tarda en pintar 40 fotogramas. */
function measureRefreshRate() {
  return new Promise((resolve) => {
    const times = [];
    const step = (t) => {
      times.push(t);
      if (times.length < 40) return requestAnimationFrame(step);
      const deltas = times.slice(1).map((v, i) => v - times[i]).sort((a, b) => a - b);
      const hz = 1000 / deltas[Math.floor(deltas.length / 2)];
      const common = [30, 48, 60, 90, 120, 144, 165];
      const near = common.reduce((a, b) => (Math.abs(b - hz) < Math.abs(a - hz) ? b : a));
      resolve(Math.abs(near - hz) <= 6 ? near : Math.round(hz));
    };
    requestAnimationFrame(step);
  });
}

function updateDevice() {
  const box = $("#device-body");
  if (!box) return;
  const d = status.device || {};
  const cells = [];
  const friendly = L.friendlyModel(d.model);
  if (d.model) cells.push(["Modelo", friendly ? friendly.replace(/^Samsung /, "") : d.model, friendly ? d.model : ""]);
  if (d.android) cells.push(["Sistema", d.android, ""]);
  const dpr = window.devicePixelRatio || 1;
  cells.push(["Pantalla", `${Math.round(screen.width * dpr)} × ${Math.round(screen.height * dpr)}`, "píxeles reales"]);
  if (d.hz) cells.push(["Frecuencia", `${d.hz} Hz`, "medida ahora"]);
  if (navigator.hardwareConcurrency) cells.push(["Procesador", `${navigator.hardwareConcurrency} núcleos`, ""]);
  box.innerHTML = `<div class="grid2">${cells.map(([l, v, sub]) => `<div class="cell"><div class="label">${l}</div><div class="value">${esc(v)}</div>${sub ? `<div class="label">${esc(sub)}</div>` : ""}</div>`).join("")}</div>`;
}

// ================================================================ Instalar como app

let installPrompt = null;
// La app instalable se sirve desde la carpeta docs/ del repositorio. raw.githack.com la publica tal
// cual sin configurar nada; GitHub Pages es la alternativa oficial si se activa en el repositorio.
const APP_URL = "https://raw.githack.com/AlldesignKarl/Parte-3-frutas/ccr-967317e2-ixw499/docs/index.html";
const PAGES_URL = "https://alldesignkarl.github.io/Parte-3-frutas/";
const PAGES_SETTINGS = "https://github.com/AlldesignKarl/Parte-3-frutas/settings/pages";
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
  if (state.tab === "estado") render();
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  storage.set("mipanel:instalada", true);
  toast("¡Instalada! Ya la tienes en la pantalla de inicio");
  render();
});
// Samsung Internet empaqueta la app en un formato antiguo y Google Play Protect lo bloquea
// ("se desarrolló para una versión anterior de Android"); Chrome la instala bien.

/** Enlace de Android que abre una dirección directamente en Chrome (y si no está, en el navegador). */
function chromeIntent(url) {
  const u = new URL(url);
  return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=${u.protocol.replace(":", "")};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(url)};end`;
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    toast("Enlace copiado: ábrelo en Chrome y pégalo en la barra de direcciones", null, null, 6000);
  } catch {
    // Sin portapapeles: se enseña el enlace para copiarlo a mano.
    const root = overlay(`<div class="scrim"><div class="dialog" role="dialog" aria-modal="true">
      <h2>Copia este enlace</h2><p class="hint" style="margin-top:0">Mantén pulsado para copiarlo y pégalo en Chrome.</p>
      <p class="link-box">${esc(url)}</p>
      <div class="actions"><button class="btn text" data-close>Cerrar</button></div></div></div>`);
    const box = $(".link-box", root);
    getSelection()?.selectAllChildren(box);
  }
}

const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function installBanner() {
  if (isStandalone()) return "";
  if (!ARTIFACT && IS_SAMSUNG) {
    return `<div class="install install-big"><div class="grow">
        <p><b>Instálala desde Chrome</b><br>Samsung Internet la instala en un formato antiguo y Google Play Protect la bloquea. Con Chrome se instala bien.</p>
        <div class="install-actions"><a class="btn" href="${esc(chromeIntent(location.href.split("#")[0]))}">${svg("add")}Abrir en Chrome</a>
        <button class="btn glass" type="button" data-action="copy-link">Copiar enlace</button></div>
        <p class="small mt12">En Chrome toca <b>Instalar</b> (o ⋮ → <b>Instalar aplicación</b>). Si aun así no deja, en Chrome usa ⋮ → <b>Añadir a pantalla de inicio</b> → <b>Crear acceso directo</b>.</p>
      </div></div>`;
  }
  if (storage.get("mipanel:ocultar-instalar-2", false)) return "";
  if (ARTIFACT) {
    return `<div class="install install-big"><div class="grow">
        <p><b>Descárgala como app</b><br>Con su icono, a pantalla completa y funciona sin internet.</p>
        <div class="install-actions"><a class="btn" href="${APP_URL}" target="_blank" rel="noopener">${svg("add")}Abrir para instalar</a>
        <button class="btn glass" type="button" data-action="copy-link">Copiar enlace</button></div>
        <p class="small mt12">Instálala con <b>Chrome</b>: con Samsung Internet, Google Play Protect la bloquea. Si se abre en otro navegador, la propia app te da un botón para pasar a Chrome; o copia el enlace y pégalo en Chrome. Allí toca <b>Instalar</b> (o ⋮ → <b>Instalar aplicación</b>).</p>
        <p class="small mt8">¿No carga? Otra dirección: <a href="${PAGES_URL}" target="_blank" rel="noopener">alldesignkarl.github.io</a> (necesita activar GitHub Pages en
          <a href="${PAGES_SETTINGS}" target="_blank" rel="noopener">ajustes</a> → Deploy from a branch → <b>ccr-967317e2-ixw499</b> + <b>/docs</b> → Save).</p>
      </div>
      <button class="icon-btn ghost" data-action="hide-install" aria-label="Ocultar">${svg("close")}</button></div>`;
  }
  if (installPrompt) {
    return `<div class="install"><p><b>Instálala como app:</b> con su icono, a pantalla completa y sin internet.</p>
      <button class="btn" data-action="install">${svg("add")}Instalar</button></div>`;
  }
  return `<div class="install"><p><b>Tenla como app:</b> en Chrome toca ⋮ (arriba a la derecha) → <b>Añadir a pantalla de inicio</b> o <b>Instalar aplicación</b>.</p>
    <button class="icon-btn" data-action="hide-install" aria-label="Ocultar">${svg("close")}</button></div>`;
}

// ================================================================ Pantalla Estado

function renderStatus() {
  $("#view").innerHTML = `
    ${topbar("Mi móvil")}
    ${installBanner()}
    <div class="${stackClass()}">
      <section class="card">${cardHead("battery", "Batería")}<div id="battery-body"></div></section>
      ${ARTIFACT ? "" : `<section class="card">${cardHead("sun", "El tiempo")}<div id="weather-body"></div></section>`}
      <section class="card">${cardHead("headphones", "Cascos")}<div id="bt-body"></div></section>
      <section class="card">${cardHead("wifi", "Conexión")}<div id="net-body"></div>
        <hr class="divider">
        <div class="row" style="margin-bottom:12px">${svg("speed").replace("<svg", '<svg style="width:22px;height:22px;fill:var(--accent)"')}<span class="strong">Test de velocidad</span></div>
        <div id="speed-body"></div>
      </section>
      <section class="card">${cardHead("phone", "Este móvil")}<div id="device-body"></div></section>
    </div>`;
  updateBattery();
  updateWeather();
  updateBt();
  updateNetwork();
  updateSpeed();
  updateDevice();
  autoPing();
}

// ================================================================ Pantalla Tareas

function renderTasks() {
  const header = topbar("Tareas", `<button class="icon-btn" data-action="menu" aria-label="Más opciones">${svg("more")}</button>`);
  if (state.loading) {
    $("#view").innerHTML = `${header}<p class="loading">Cargando tus tareas…</p>`;
    return;
  }
  const day = today();
  const pending = L.pendingSorted(state.tasks);
  const done = L.doneSorted(state.tasks);
  const fab = `<button class="fab" data-action="new-task" aria-label="Nueva tarea">${svg("add")}Nueva tarea</button>`;

  if (!pending.length && !done.length) {
    const classes = scheduleCard(day);
    $("#view").innerHTML = `${header}${classes ? `<div class="${stackClass()}">${classes}</div>` : ""}<div class="empty"><div class="glow-icon">${svg("book")}</div><h2>No tienes tareas</h2>
      <p class="hint">Pulsa "Nueva tarea" y apunta lo que tengas que estudiar, la fecha del examen y cuántas páginas son.</p></div>${fab}`;
    return;
  }

  let html = header + `<div class="${stackClass()}">`;
  html += scheduleCard(day);
  html += planCard(pending, done, day);
  html += weekCard(day);
  html += pending.map((t) => taskCard(t, day)).join("");
  html += examsCard(day);
  if (!state.schedule.length) {
    html += `<button type="button" class="invite" data-action="schedule">${svg("school")}<span class="grow"><b>Añade tu horario de clases</b>
      <span class="small">Y aquí verás qué clase toca ahora y cuál viene después.</span></span>${svg("add")}</button>`;
  }
  if (done.length) {
    html += `<button class="done-head" data-action="toggle-done" aria-expanded="${state.showDone}">
      <span class="grow" style="text-align:left">TERMINADAS · ${done.length}</span>${svg(state.showDone ? "up" : "down")}</button>`;
    if (state.showDone) {
      html += done.map((t) => `<div class="done-item">${svg("check", "ok")}
        <div class="grow"><div class="strong">${esc(t.title)}</div><div class="small">${L.completionLine(t, day)}</div></div>
        <button class="icon-btn ghost" data-action="task-menu" data-id="${t.id}" aria-label="Opciones">${svg("more")}</button></div>`).join("");
    }
  }
  html += `</div>${fab}`;
  $("#view").innerHTML = html;
  drawWeekChart();
}

/** "Tu semana": páginas por día de los últimos 7 días y racha de estudio. */
function weekCard(day) {
  const days = L.studyByDay(state.tasks, 7, day, state.focus);
  const pages = days.reduce((s, d) => s + d.pages, 0);
  const minutes = days.reduce((s, d) => s + d.minutes, 0);
  const best = Math.max(...days.map((d) => d.pages));
  const streak = L.studyStreak(state.tasks, day, state.focus);
  const sel = days.find((d) => d.date === state.selectedDay);
  const streakPill = streak
    ? `<span class="pill" style="--pill:var(--warning)">${svg("flame")}${streak} ${streak === 1 ? "día" : "días"}</span>`
    : "";
  return `<section class="card">
    ${cardHead("trend", "Tu semana", streakPill)}
    <div class="mini-stats">
      <div><b class="num">${pages}</b><span>págs en 7 días</span></div>
      <div><b class="num">${best}</b><span>tu mejor día</span></div>
      ${minutes ? `<div><b class="num">${fmtMinutes(minutes)}</b><span>de foco</span></div>` : ""}
    </div>
    <div class="${chartClass()}" id="week-chart"></div>
    <p class="chart-detail">${
      sel
        ? `<b>${L.fmtDateShort(sel.date)}</b>: ${L.fmtPages(sel.pages)}${sel.minutes ? ` · ${fmtMinutes(sel.minutes)} de foco` : ""}`
        : streak > 1
          ? `Llevas ${streak} días seguidos estudiando. ¡No rompas la racha!`
          : "Cada página que anotes suma aquí. Toca una barra para ver ese día."
    }</p>
  </section>`;
}

function drawWeekChart() {
  const box = $("#week-chart");
  if (!box) return;
  const days = L.studyByDay(state.tasks, 7, today(), state.focus);
  box.innerHTML = C.dayColumns(days.map((d) => ({ date: d.date, value: d.pages })), {
    width: Math.max(260, box.clientWidth || 320),
    unit: "págs",
    selected: state.selectedDay,
  });
}

/** Calendario con los exámenes que quedan. */
function examsCard(day) {
  const exams = L.upcomingExams(state.tasks, day);
  if (!exams.length) return "";
  const rows = exams.map((t) => {
    const [weekday, num, month] = L.fmtDateShort(t.examDate).split(" ");
    const days = L.daysUntilExam(t, day);
    const color = days <= 1 ? "var(--bad)" : days <= 3 ? "var(--warning)" : "var(--accent)";
    const pct = Math.round(L.progress(t) * 100);
    return `<div class="exam-row">
      <div class="date-block" style="--pill:${color}"><span>${weekday}</span><b>${num}</b><span>${month}</span></div>
      <div class="grow">
        <div class="strong">${esc(t.title)}</div>
        <div class="small">${capitalize(L.relativeDay(days))}${L.hasPages(t) ? ` · ${pct} % estudiado` : ""}</div>
        ${L.hasPages(t) ? meter(pct, { cls: "mt8" }) : ""}
      </div>
    </div>`;
  });
  return `<section class="card">${cardHead("event", "Próximos exámenes")}<div class="exam-list">${rows.join("")}</div></section>`;
}

const capitalize = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);

/** Texto corto del día del examen para que quepa en una línea (el icono ya dice "examen"). */
function examShort(t, day) {
  const days = L.daysUntilExam(t, day);
  const date = L.fmtDateShort(t.examDate);
  if (days < 0) return `Ya pasó · ${date}`;
  if (days === 0) return "¡Examen hoy!";
  if (days === 1) return `Mañana · ${date}`;
  return `En ${days} días · ${date}`;
}

/** Resumen de arriba: lo de HOY (objetivo del día) separado del TOTAL estudiado. */
function planCard(pending, done, day) {
  const overview = L.dayOverview(state.tasks, day);
  const studyTasks = pending.filter(L.hasPages);
  const totalPages = studyTasks.reduce((s, t) => s + t.totalPages, 0);
  const donePages = studyTasks.reduce((s, t) => s + t.pagesDone, 0);
  const next = pending.find((t) => t.examDate && L.daysUntilExam(t, day) >= 0);

  if (!pending.length) {
    return `<section class="card plan"><p class="eyebrow">Todo al día</p><p class="big">¡No tienes nada pendiente! 🎉</p>
      <p class="hint">Has terminado ${done.length === 1 ? "1 tarea" : `${done.length} tareas`}.</p></section>`;
  }

  let top;
  if (overview.goalToday > 0) {
    const left = Math.max(0, overview.goalToday - overview.pagesToday);
    const reached = left === 0;
    const pct = Math.round(Math.min(1, overview.pagesToday / overview.goalToday) * 100);
    top = `<div class="plan-top">
      <div class="ring-wrap md">${ring(pct, reached ? "--c1:var(--good);--c2:#7affd0" : "")}
        <div class="center"><b>${overview.pagesToday}/${overview.goalToday}</b><span>págs hoy</span></div></div>
      <div class="grow">
        <p class="eyebrow">Plan de hoy</p>
        <p class="big">${reached ? "¡Objetivo de hoy cumplido!" : `Hoy te tocan ${L.fmtPages(overview.goalToday)}`}</p>
        <p class="hint">${reached ? `Has estudiado ${L.fmtPages(overview.pagesToday)} hoy.` : `Llevas ${overview.pagesToday} hoy · te faltan ${left}`}</p>
      </div></div>`;
  } else {
    top = `<p class="eyebrow">Plan de hoy</p><p class="big">${pending.length === 1 ? "1 tarea pendiente" : `${pending.length} tareas pendientes`}</p>
      <p class="hint">Pon fecha de examen y páginas a tus tareas para saber cuántas tocan cada día.</p>`;
  }
  const stats = [];
  if (totalPages > 0) stats.push(`<div class="stat"><span>Total estudiado</span><b>${donePages} de ${totalPages} págs</b><em>${Math.round((donePages / totalPages) * 100)} % de lo pendiente</em></div>`);
  if (next) {
    const days = L.daysUntilExam(next, day);
    stats.push(`<div class="stat"><span>Próximo examen</span><b>${L.fmtDateShort(next.examDate)} · ${L.relativeDay(days)}</b><em>${esc(next.title)}</em></div>`);
  }
  return `<section class="card plan">${top}${stats.length ? `<div class="stats2">${stats.join("")}</div>` : ""}</section>`;
}

function taskCard(t, day) {
  const chip = L.examChip(t, day);
  const chipColor = { bad: "var(--bad)", warning: "var(--warning)", primary: "var(--accent)", neutral: "var(--neutral)" };
  const pills = [];
  if (chip) pills.push(`<span class="pill" style="--pill:${chipColor[chip.level]}" title="${esc(chip.text)}">${svg("event")}${examShort(t, day)}</span>`);
  let body = "";
  let side = "";
  if (L.hasPages(t)) {
    const pct = Math.round(L.progress(t) * 100);
    const days = L.daysUntilExam(t, day);
    const perDay = L.pagesPerDayFromNow(t, day);
    const goal = L.goalToday(t, day);
    const doneToday = Math.max(0, L.pagesOn(t, day));
    if (perDay != null && days != null && days >= 0) pills.push(`<span class="pill" style="--pill:var(--muted)">${days <= 1 ? `${L.fmtPages(perDay)} hoy` : `${perDay} págs/día`}</span>`);
    side = `<div class="ring-wrap sm">${ring(pct)}<div class="center">${pct}%</div></div>`;
    let plan = "";
    if (days == null) plan = `<p class="small mt8" style="margin-bottom:0">Pon fecha de examen para saber cuántas páginas tocan al día.</p>`;
    else if (days < 0) plan = `<p class="small mt8" style="margin-bottom:0">El examen ya pasó · te quedaron ${L.fmtPages(L.remainingPages(t))}.</p>`;
    if (goal) {
      const reached = doneToday >= goal;
      plan += `<div class="today-line${reached ? " done" : ""}"><span class="status-dot"></span><span class="grow">${
        reached ? `Hoy cumplido: llevas <b>${doneToday}</b> (tocaban ${goal})` : `Hoy te tocan <b>${goal}</b> · llevas <b>${doneToday}</b>`
      }</span></div>`;
    }
    body = `
      <div class="numbers"><span><b>${t.pagesDone}</b> de ${t.totalPages} págs</span><span>Quedan ${L.remainingPages(t)}</span></div>
      ${meter(pct, { thick: true })}
      ${plan}
      <div class="quick">
        <button type="button" data-action="add-pages" data-id="${t.id}" data-n="1">+1</button>
        <button type="button" data-action="add-pages" data-id="${t.id}" data-n="5">+5</button>
        <button type="button" data-action="add-pages" data-id="${t.id}" data-n="10">+10</button>
        <button type="button" class="log" data-action="log" data-id="${t.id}">Anotar…</button>
      </div>`;
  }
  return `<article class="card task">
    <div class="task-top">
      ${L.hasPages(t) ? side : `<button class="check" data-action="toggle" data-id="${t.id}" aria-label="Marcar como hecha"></button>`}
      <div class="grow">
        <h3 class="task-title">${esc(t.title)}</h3>
        ${pills.length ? `<div class="pills">${pills.join("")}</div>` : ""}
      </div>
      <button class="icon-btn ghost" data-action="task-menu" data-id="${t.id}" aria-label="Opciones">${svg("more")}</button>
    </div>
    ${t.notes ? `<p class="notes">${esc(t.notes)}</p>` : ""}
    ${body}
  </article>`;
}

function findTask(id) {
  return state.tasks.find((t) => t.id === id);
}

/** Cambia una tarea, guarda y avisa (celebración al terminar o "Deshacer"). */
function changeTask(id, change) {
  const before = findTask(id);
  if (!before) return;
  const after = change(before);
  if (after === before) return;
  state.tasks = state.tasks.map((t) => (t.id === id ? after : t));
  saveData();
  render();
  if (!L.isDone(before) && L.isDone(after)) {
    celebrate(after);
  } else {
    let msg;
    if (L.hasPages(after)) {
      const delta = after.pagesDone - before.pagesDone;
      msg = `${delta > 0 ? "+" : ""}${L.fmtPages(delta)} en ${after.title} · llevas ${after.pagesDone}/${after.totalPages}`;
    } else msg = L.isDone(after) ? `Hecha: ${after.title}` : `Pendiente otra vez: ${after.title}`;
    toast(msg, "Deshacer", () => restoreTask(before));
  }
}

function restoreTask(task) {
  state.tasks = state.tasks.some((t) => t.id === task.id)
    ? state.tasks.map((t) => (t.id === task.id ? task : t))
    : [...state.tasks, task];
  saveData();
  render();
}

function deleteTask(id) {
  const task = findTask(id);
  if (!task) return;
  state.tasks = state.tasks.filter((t) => t.id !== id);
  saveData();
  render();
  toast(`Tarea borrada: ${task.title}`, "Deshacer", () => restoreTask(task), 6000);
}

// ---------------------------------------------------------------- Editor de tareas

function openTaskEditor(task) {
  const t = task || { title: "", notes: "", examDate: null, totalPages: 0, pagesDone: 0 };
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ed-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="ed-title">${task ? "Editar tarea" : "Nueva tarea"}</h2>
        <button class="btn" type="submit" form="task-form" id="save">Guardar</button>
      </div>
      <form id="task-form" novalidate>
        <label class="field"><span>Qué tienes que hacer</span>
          <input name="title" maxlength="80" placeholder="Ej.: Estudiar Historia, tema 3" value="${esc(t.title)}" autocomplete="off"></label>
        <label class="field"><span>Día del examen (opcional)</span>
          <input name="exam" type="date" value="${t.examDate || ""}"><small id="exam-rel"></small></label>
        <label class="field"><span>Páginas que hay que estudiar (opcional)</span>
          <input name="total" inputmode="numeric" pattern="[0-9]*" maxlength="5" value="${t.totalPages || ""}">
          <small>Déjalo vacío si no va por páginas: se marcará como hecha y ya.</small></label>
        <label class="field" id="done-field"><span>Páginas que ya llevas</span>
          <input name="done" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="0" value="${t.pagesDone || ""}"><small id="done-err" class="error"></small></label>
        <div class="preview" id="preview" hidden></div>
        <label class="field"><span>Detalles (opcional)</span>
          <textarea name="notes" rows="3" maxlength="400" placeholder="Ej.: Entra del tema 3 al 5, sin el anexo">${esc(t.notes)}</textarea></label>
      </form>
    </div>`);
  const form = $("#task-form", root);
  const f = form.elements;
  const digits = (el) => (el.value = el.value.replace(/\D/g, "").slice(0, 5));
  const refresh = () => {
    const total = Number(f.total.value) || 0;
    const done = Number(f.done.value) || 0;
    const exam = f.exam.value || null;
    $("#done-field", root).hidden = total <= 0;
    const tooHigh = total > 0 && done > total;
    $("#done-err", root).textContent = tooHigh ? "No puedes llevar más páginas que el total" : "";
    f.done.setAttribute("aria-invalid", tooHigh);
    $("#save", root).disabled = !f.title.value.trim() || tooHigh;
    const rel = $("#exam-rel", root);
    rel.textContent = exam ? L.relativeDay(L.daysBetween(today(), exam)).replace(/^./, (c) => c.toUpperCase()) : "";
    const preview = $("#preview", root);
    let text = "";
    if (exam && total > 0 && done < total) {
      const draft = { totalPages: total, pagesDone: done, examDate: exam, completedAt: null, dailyLog: {} };
      const days = L.studyDaysLeft(draft, today());
      if (days == null) text = "El examen ya ha pasado.";
      else if (days === 1) text = `Tendrías que estudiar las ${total - done} págs hoy.`;
      else text = `Tendrías que estudiar unas ${L.pagesPerDayFromNow(draft, today())} págs al día durante ${days} días.`;
    }
    preview.hidden = !text;
    preview.textContent = text;
  };
  f.total.addEventListener("input", () => (digits(f.total), refresh()));
  f.done.addEventListener("input", () => (digits(f.done), refresh()));
  f.title.addEventListener("input", refresh);
  f.exam.addEventListener("input", refresh);
  refresh();
  if (!task) f.title.focus();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#save", root).disabled) return;
    const values = {
      title: f.title.value,
      notes: f.notes.value,
      examDate: f.exam.value || null,
      totalPages: Number(f.total.value) || 0,
      pagesDone: Number(f.done.value) || 0,
    };
    const now = Date.now();
    closeOverlay(root);
    if (task) {
      changeTask(task.id, (old) => L.edited(old, values, now));
    } else {
      state.tasks = [...state.tasks, L.edited({ id: uid(), createdAt: now, completedAt: null, dailyLog: {}, totalPages: 0 }, values, now)];
      animateNext = true;
      saveData();
      render();
    }
  });
}

function openProgressDialog(task) {
  let add = true;
  const root = overlay(`
    <div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="pg-title">
      <h2 id="pg-title">${esc(task.title)}</h2>
      <p style="margin-top:0">Llevas ${task.pagesDone} de ${task.totalPages} págs.</p>
      <div class="segmented"><button type="button" data-mode="add" aria-pressed="true">Sumar</button><button type="button" data-mode="total" aria-pressed="false">Total</button></div>
      <label class="field"><span id="pg-label">Páginas que acabas de estudiar</span>
        <input id="pg-input" inputmode="numeric" pattern="[0-9]*" maxlength="5"><small id="pg-result"></small></label>
      <div class="actions"><button class="btn text" data-close>Cancelar</button><button class="btn text" id="pg-save" disabled>Guardar</button></div>
    </div></div>`);
  const input = $("#pg-input", root);
  const result = () => {
    const n = input.value === "" ? null : Number(input.value);
    if (n == null) return null;
    return Math.min(task.totalPages, Math.max(0, add ? task.pagesDone + n : n));
  };
  const refresh = () => {
    const r = result();
    $("#pg-result", root).textContent = r == null ? "" : `Quedarás en ${r} de ${task.totalPages}`;
    $("#pg-save", root).disabled = r == null;
  };
  root.querySelectorAll("[data-mode]").forEach((b) =>
    b.addEventListener("click", () => {
      add = b.dataset.mode === "add";
      root.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      $("#pg-label", root).textContent = add ? "Páginas que acabas de estudiar" : "Páginas estudiadas en total";
      input.value = add ? "" : String(task.pagesDone);
      refresh();
      input.focus();
    })
  );
  input.addEventListener("input", () => {
    input.value = input.value.replace(/\D/g, "").slice(0, 5);
    refresh();
  });
  $("#pg-save", root).addEventListener("click", () => {
    const r = result();
    if (r == null) return;
    closeOverlay(root);
    changeTask(task.id, (t) => L.withPagesDone(t, r, today(), Date.now()));
  });
  input.focus();
}

// ---------------------------------------------------------------- ¡Terminado!

function celebrate(task) {
  navigator.vibrate?.([60, 90, 60, 90, 180]);
  const days = L.daysUntilExam(task, today());
  let examLine = "";
  if (days != null) {
    if (days > 1) examLine = `Y faltan ${days} días para el examen: tiempo de sobra para repasar.`;
    else if (days === 1) examLine = "Y el examen es mañana: ¡justo a tiempo! Mucha suerte.";
    else if (days === 0) examLine = "El examen es hoy: ¡a por todas!";
  }
  const root = overlay(`
    <div class="celebrate" role="dialog" aria-modal="true" aria-labelledby="cel-title">
      <canvas></canvas>
      <div class="dialog">
        <div class="burst" aria-hidden="true">🎉</div>
        <h2 id="cel-title">¡Terminado!</h2>
        <p class="strong" style="margin:0">Has terminado «${esc(task.title)}»</p>
        ${L.hasPages(task) ? `<p style="margin:0">${task.totalPages} páginas estudiadas</p>` : ""}
        ${examLine ? `<p style="margin:0">${examLine}</p>` : ""}
        <p class="small" style="margin:0">Terminado a las ${L.fmtTime(task.completedAt)}</p>
        <button class="btn block mt12" data-close>¡Genial!</button>
      </div>
    </div>`);
  confetti($("canvas", root));
}

function confetti(canvas) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const dpr = window.devicePixelRatio || 1;
  const w = (canvas.width = innerWidth * dpr);
  const h = (canvas.height = innerHeight * dpr);
  const ctx = canvas.getContext("2d");
  const colors = ["#6366F1", "#22C55E", "#F59E0B", "#EC4899", "#0EA5E9", "#EF4444"];
  const parts = Array.from({ length: 110 }, (_, i) => ({
    x: Math.random(), delay: Math.random() * 0.35, speed: 0.8 + Math.random() * 0.6,
    drift: (10 + Math.random() * 30) * dpr, phase: Math.random() * Math.PI * 2,
    size: (6 + Math.random() * 8) * dpr, spin: Math.random() * 720 - 360, color: colors[i % colors.length],
  }));
  const start = performance.now();
  const frame = (now) => {
    const t = (now - start) / 4000;
    ctx.clearRect(0, 0, w, h);
    if (t >= 1 || !canvas.isConnected) return;
    for (const p of parts) {
      const local = Math.min(1, Math.max(0, (t - p.delay) / (1 - p.delay)));
      if (local <= 0) continue;
      const y = -40 * dpr + local * p.speed * (h + 80 * dpr);
      const x = p.x * w + Math.sin(p.phase + local * 10) * p.drift;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(((p.spin * local) * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ================================================================ Horario de clases

const nowMinute = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};
const plusMinutes = (hhmm, n) => {
  const t = Math.min(23 * 60 + 59, L.toMinutes(hhmm) + n);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/** "Hoy en clase": la clase de ahora (con lo que le queda) y la siguiente. */
function scheduleCard(day) {
  if (!state.schedule.length) return "";
  const weekday = L.isoWeekday(day);
  const minute = nowMinute();
  const { list, current, next } = L.classStatus(state.schedule, weekday, minute);
  const after = L.nextSchoolDay(state.schedule, weekday);
  const later = after
    ? `${after.offset === 1 ? "Mañana" : `El ${L.WEEKDAYS[after.day - 1]}`} empiezas a las <b>${L.fmtHour(after.first.start)}</b> con <b>${esc(after.first.subject)}</b>.`
    : "";
  let body;
  if (!list.length) body = `<p class="hint">Hoy no tienes clase. ${later}</p>`;
  else if (!current && !next) body = `<p class="hint">Ya has terminado las clases de hoy. ${later}</p>`;
  else body = `<div class="class-list">${list.map((c) => classRow(c, minute, c === current, c === next)).join("")}</div>`;
  const edit = `<button type="button" class="btn text slim" data-action="schedule">Editar</button>`;
  return `<section class="card" id="schedule-card">${cardHead("school", "Hoy en clase", edit)}${body}</section>`;
}

function classRow(c, minute, isNow, isNext) {
  const start = L.toMinutes(c.start);
  const end = L.toMinutes(c.end);
  const badge = isNow
    ? `<span class="pill" style="--pill:var(--accent)">Ahora</span>`
    : isNext ? `<span class="pill" style="--pill:var(--muted)">en ${fmtMinutes(start - minute)}</span>` : "";
  const live = isNow ? `${meter(((minute - start) / (end - start)) * 100, { cls: "mt8" })}<span class="small">Quedan ${fmtMinutes(end - minute)}</span>` : "";
  return `<div class="class-row${isNow ? " now" : ""}${minute >= end ? " past" : ""}">
      <div class="class-time"><b>${L.fmtHour(c.start)}</b><span>${L.fmtHour(c.end)}</span></div>
      <div class="grow"><div class="row"><span class="strong grow">${esc(c.subject)}</span>${badge}</div>
        ${c.room ? `<span class="small">${esc(c.room)}</span>` : ""}${live}</div>
    </div>`;
}

/** Hoja para poner el horario: un día cada vez, con sus clases. Los cambios se guardan al momento. */
function openScheduleEditor() {
  const todayWd = L.isoWeekday(today());
  state.scheduleDay ||= todayWd <= 5 ? todayWd : 1;
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sch-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="sch-title">Horario de clases</h2>
      </div>
      <div class="sheet-body" id="sch-body"></div>
    </div>`);
  const draw = () => {
    const day = state.scheduleDay;
    const list = L.classesOn(state.schedule, day);
    $("#sch-body", root).innerHTML = `
      <div class="segmented days">${L.WEEKDAY_LETTERS.map((letter, i) => {
        const has = state.schedule.some((c) => c.day === i + 1);
        return `<button type="button" data-sch="day" data-day="${i + 1}" aria-pressed="${i + 1 === day}" aria-label="${L.WEEKDAYS[i]}"${has ? ' class="has"' : ""}>${letter}</button>`;
      }).join("")}</div>
      <p class="eyebrow">${capitalize(L.WEEKDAYS[day - 1])} · ${list.length ? `${list.length} ${list.length === 1 ? "clase" : "clases"}` : "sin clases"}</p>
      <div class="class-edit-list">${list.map((c) => `
        <div class="class-edit">
          <button type="button" class="class-edit-main" data-sch="edit" data-id="${c.id}">
            <span class="class-time"><b>${L.fmtHour(c.start)}</b><span>${L.fmtHour(c.end)}</span></span>
            <span class="grow"><span class="strong">${esc(c.subject)}</span>${c.room ? `<span class="small">${esc(c.room)}</span>` : ""}</span>
          </button>
          <button type="button" class="icon-btn ghost" data-sch="del" data-id="${c.id}" aria-label="Borrar ${esc(c.subject)}">${svg("trash")}</button>
        </div>`).join("") || `<p class="hint">Añade la primera clase del ${L.WEEKDAYS[day - 1]}.</p>`}</div>
      <button type="button" class="btn block mt12" data-sch="add">${svg("add")}Añadir clase</button>
      <p class="small mt12">Las horas de la siguiente clase se rellenan solas a continuación de la anterior.</p>`;
  };
  $("#sch-body", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-sch]");
    if (!b) return;
    const cls = state.schedule.find((c) => c.id === b.dataset.id);
    if (b.dataset.sch === "day") {
      state.scheduleDay = Number(b.dataset.day);
      draw();
    } else if (b.dataset.sch === "add") {
      openClassEditor(null, state.scheduleDay, draw);
    } else if (b.dataset.sch === "edit") {
      openClassEditor(cls, cls.day, draw);
    } else if (b.dataset.sch === "del") {
      state.schedule = state.schedule.filter((c) => c.id !== cls.id);
      saveData();
      draw();
      render();
      toast(`Clase borrada (${cls.subject})`, "Deshacer", () => {
        state.schedule = [...state.schedule, cls];
        saveData();
        if (root.isConnected) draw();
        render();
      }, 6000);
    }
  });
  draw();
}

function openClassEditor(cls, day, onSaved) {
  const list = L.classesOn(state.schedule, day).filter((c) => c !== cls);
  const last = list[list.length - 1];
  // Sin clases ese día: la hora de empezar de otro día (casi siempre es la misma).
  const firstElsewhere = [...state.schedule].sort((a, b) => L.toMinutes(a.start) - L.toMinutes(b.start))[0];
  const start = cls?.start || last?.end || firstElsewhere?.start || "08:30";
  const length = last ? L.toMinutes(last.end) - L.toMinutes(last.start) : 55;
  const end = cls?.end || plusMinutes(start, length);
  const known = [...new Set([...state.schedule.map((c) => c.subject), ...L.bySubject(state.grades).map((s) => s.name)])];
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cl-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="cl-title">${cls ? "Editar clase" : `Clase del ${L.WEEKDAYS[day - 1]}`}</h2>
        <button class="btn" type="submit" form="class-form" id="save">Guardar</button>
      </div>
      <form id="class-form" novalidate>
        <label class="field"><span>Asignatura</span>
          <input name="subject" maxlength="40" placeholder="Ej.: Matemáticas" value="${esc(cls?.subject || "")}" autocomplete="off"></label>
        <div class="chips" id="suggestions"></div>
        <div class="two">
          <label class="field"><span>Empieza</span><input name="start" type="time" value="${start}"></label>
          <label class="field"><span>Termina</span><input name="end" type="time" value="${end}"></label>
        </div>
        <small class="error" id="time-err"></small>
        <label class="field"><span>Aula (opcional)</span>
          <input name="room" maxlength="30" placeholder="Ej.: Aula 12, laboratorio…" value="${esc(cls?.room || "")}" autocomplete="off"></label>
      </form>
    </div>`);
  const form = $("#class-form", root);
  const f = form.elements;
  const refresh = () => {
    const bad = f.start.value && f.end.value && L.toMinutes(f.end.value) <= L.toMinutes(f.start.value);
    $("#time-err", root).textContent = bad ? "Tiene que terminar después de empezar" : "";
    $("#save", root).disabled = !f.subject.value.trim() || !f.start.value || !f.end.value || bad;
    const key = L.subjectKey(f.subject.value);
    const options = known.filter((n) => L.subjectKey(n) !== key && (!key || L.subjectKey(n).includes(key)));
    $("#suggestions", root).innerHTML = options.slice(0, 8).map((n) => `<button type="button" data-name="${esc(n)}">${esc(n)}</button>`).join("");
  };
  $("#suggestions", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-name]");
    if (!b) return;
    f.subject.value = b.dataset.name;
    refresh();
  });
  for (const el of [f.subject, f.start, f.end]) el.addEventListener("input", refresh);
  refresh();
  if (!cls) f.subject.focus();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#save", root).disabled) return;
    const values = { day, start: f.start.value, end: f.end.value, subject: L.withAccents(L.cleanSubjectName(f.subject.value)), room: f.room.value.trim() };
    closeOverlay(root);
    if (cls) state.schedule = state.schedule.map((c) => (c.id === cls.id ? { ...c, ...values } : c));
    else state.schedule = [...state.schedule, { id: uid(), ...values }];
    saveData();
    onSaved?.();
    render();
  });
}

// ================================================================ Pantalla Notas

function renderGrades() {
  const header = topbar("Notas", `<button class="icon-btn" data-action="menu" aria-label="Más opciones">${svg("more")}</button>`);
  if (state.loading) {
    $("#view").innerHTML = `${header}<p class="loading">Cargando tus notas…</p>`;
    return;
  }
  const subjects = L.bySubject(state.grades);
  const overall = L.overallAverage(subjects);
  const fab = `<button class="fab" data-action="new-grade" aria-label="Añadir nota">${svg("add")}Añadir nota</button>`;
  if (!subjects.length) {
    $("#view").innerHTML = `${header}<div class="empty"><div class="glow-icon">${svg("chart")}</div><h2>Aún no has apuntado notas</h2>
      <p class="hint">Pulsa "Añadir nota", escribe la asignatura y la nota, y aquí verás la media de cada una en una gráfica.</p></div>${fab}`;
    return;
  }
  const count = state.grades.length;
  const passed = subjects.filter((x) => x.average >= L.PASS_GRADE).length;
  let html = `${header}<div class="${stackClass()}">
    <section class="card">
      <p class="eyebrow">Media general</p>
      <div class="avg mt8"><span class="hero">${heroNumber(overall)}</span>
        <span class="pill" style="--pill:${gradeColor(overall)};margin-bottom:10px">${L.gradeLabel(overall)}</span></div>
      <div class="stats2">
        <div class="stat"><span>Asignaturas</span><b>${subjects.length}</b><em>${passed === subjects.length ? "todas aprobadas" : `${passed} aprobadas · ${subjects.length - passed} suspensas`}</em></div>
        <div class="stat"><span>Notas apuntadas</span><b>${count}</b><em>la media es la de las asignaturas</em></div>
      </div>
    </section>
    ${evolutionCard()}
    <section class="card">${cardHead("chart", "Media por asignatura")}<div class="${chartClass()}" id="chart"></div><p class="chart-detail" id="chart-detail"></p></section>
    ${neededCard(subjects)}`;
  html += subjects.map((s) => `<section class="card">
      <div class="subject-head">
        <div class="badge-icon" style="--accent:${gradeColor(s.average)}">${svg("book")}</div>
        <h2>${esc(s.name)}</h2>
        ${C.sparkline(L.subjectTrend(s), { color: gradeColor(s.average) })}
        <div class="subject-avg"><b style="color:${gradeColor(s.average)}">${L.fmtGrade(s.average)}</b><span class="small">${L.gradeLabel(s.average)}</span></div>
      </div>
      <div class="grade-list">${s.grades.map((g) => `<button class="grade-row" data-action="edit-grade" data-id="${g.id}">
          <span class="v" style="--grade:${gradeColor(g.value)}">${L.fmtGrade(g.value)}</span>
          <span class="grow"><span style="display:block;font-weight:600">${esc(g.description || "Nota")}</span><span class="small">${L.fmtDateShort(g.date)} ${g.date.slice(0, 4)}</span></span>
          <span class="edit">Editar</span></button>`).join("")}</div>
      <button class="btn outline block mt12" data-action="new-grade" data-subject="${esc(s.name)}">+ Añadir nota de ${esc(s.name)}</button>
    </section>`).join("");
  html += `</div>${fab}`;
  $("#view").innerHTML = html;
  drawChart(subjects);
  drawEvolution();
}

/** Cómo ha ido cambiando la media general nota a nota. */
function evolutionCard() {
  if (state.grades.length < 2) return "";
  const points = L.averageTimeline(state.grades);
  const delta = points[points.length - 1].value - points[0].value;
  const sign = delta > 0.005 ? "+" : delta < -0.005 ? "−" : "";
  const color = delta > 0.005 ? "var(--good)" : delta < -0.005 ? "var(--bad)" : "var(--muted)";
  const pill = `<span class="pill" style="--pill:${color}">${sign}${L.fmtGrade(Math.abs(delta))} desde la 1.ª nota</span>`;
  return `<section class="card">${cardHead("trend", "Tu evolución", pill)}
    <div class="${chartClass()}" id="evo-chart"></div><p class="chart-detail" id="evo-detail"></p></section>`;
}

function drawEvolution() {
  const box = $("#evo-chart");
  if (!box) return;
  const points = L.averageTimeline(state.grades);
  box.innerHTML = C.averageLine(points, { width: Math.max(260, box.clientWidth || 320), selected: state.selectedPoint });
  const sel = points.find((p) => p.grade.id === state.selectedPoint);
  $("#evo-detail").innerHTML = sel
    ? `<b>${esc(L.cleanSubjectName(sel.grade.subject))}: ${L.fmtGrade(sel.grade.value)}</b>${sel.grade.description ? ` (${esc(sel.grade.description)})` : ""} el ${L.fmtDateShort(sel.date)} → media general <b>${L.fmtGrade(sel.value)}</b>`
    : "Media general después de cada nota. Toca un punto para ver cuál fue.";
}

/** "¿Qué necesito sacar?": la nota que hace falta en el próximo examen de cada asignatura. */
function neededCard(subjects) {
  const target = state.target;
  const chips = [5, 6, 7, 8, 9].map(
    (t) => `<button type="button" data-action="target" data-target="${t}" aria-pressed="${t === target}">${t === 5 ? "Aprobar" : t}</button>`
  ).join("");
  const rows = subjects.map((s) => {
    const need = L.neededGrade(s, target);
    let badge;
    let text;
    if (need.status === "done") {
      badge = `<span class="need" style="--need:var(--good)">✓</span>`;
      text = `Asegurado: aunque saques un 0, la media se queda en ${L.fmtGrade((s.average * s.grades.length) / (s.grades.length + 1))}`;
    } else if (need.status === "impossible") {
      badge = `<span class="need" style="--need:var(--bad)">10+</span>`;
      text = `Con un solo examen no llegas: necesitarías un ${L.fmtGrade(need.needed)}`;
    } else {
      const color = need.needed <= 5 ? "var(--good)" : need.needed <= 7.5 ? "var(--warning)" : "var(--bad)";
      badge = `<span class="need" style="--need:${color}">${L.fmtGrade(need.needed)}</span>`;
      text = `Necesitas un <b>${L.fmtGrade(need.needed)}</b> en el próximo examen`;
    }
    return `<div class="need-row">${badge}<div class="grow"><div class="strong">${esc(s.name)} <span class="small">· ahora ${L.fmtGrade(s.average)}</span></div><div class="small">${text}</div></div></div>`;
  });
  return `<section class="card">${cardHead("target", "¿Qué necesito sacar?")}
    <p class="hint" style="margin-bottom:12px">Elige a qué media quieres llegar:</p>
    <div class="segmented targets">${chips}</div>
    <div class="need-list">${rows.join("")}</div></section>`;
}

/** Color de una nota: rojo suspenso, ámbar aprobado/bien, verde notable, cian sobresaliente. */
function gradeColor(v) {
  if (v < L.PASS_GRADE) return "var(--bad)";
  if (v < 7) return "var(--amber)";
  if (v < 9) return "var(--good)";
  return "var(--cyan)";
}

function drawChart(subjects) {
  const box = $("#chart");
  if (!box) return;
  const width = Math.max(260, box.clientWidth || 320);
  const rowH = 42;
  const axisH = 26;
  const height = rowH * subjects.length + axisH;
  const labelW = Math.min(width * 0.34, 150);
  const x0 = labelW + 10;
  const x1 = width - 46;
  const x = (v) => x0 + (v / L.MAX_GRADE) * (x1 - x0);
  const plotBottom = rowH * subjects.length;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = `14px ${getComputedStyle(document.body).fontFamily}`;
  const fit = (text) => {
    if (measure.measureText(text).width <= labelW) return text;
    let s = text;
    while (s.length > 1 && measure.measureText(`${s}…`).width > labelW) s = s.slice(0, -1);
    return `${s.trimEnd()}…`;
  };

  let out = `<svg viewBox="0 0 ${width} ${height}" height="${height}" role="img" aria-label="Gráfica de medias. ${esc(
    subjects.map((s) => `${s.name}: media ${L.fmtGrade(s.average)}`).join("; ")
  )}">`;
  subjects.forEach((s, i) => {
    if (s.key === state.selectedSubject) out += `<rect class="sel" x="0" y="${i * rowH}" width="${width}" height="${rowH}" rx="12"/>`;
  });
  for (const tick of [0, L.MAX_GRADE]) out += `<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="0" y2="${plotBottom}"/>`;
  out += `<line class="pass" x1="${x(L.PASS_GRADE)}" x2="${x(L.PASS_GRADE)}" y1="0" y2="${plotBottom}"/>`;
  for (const tick of [0, L.PASS_GRADE, L.MAX_GRADE]) {
    out += `<text class="axis" x="${x(tick)}" y="${plotBottom + 17}" text-anchor="middle">${tick === L.PASS_GRADE ? "5 · aprobado" : tick}</text>`;
  }
  subjects.forEach((s, i) => {
    const cy = i * rowH + rowH / 2;
    const end = Math.max(x0 + 1, x(s.average));
    const r = Math.min(5, end - x0);
    const top = cy - 9;
    const bottom = cy + 9;
    // Base recta en el 0 y extremo redondeado.
    out += `<path class="bar" d="M${x0},${top} H${end - r} Q${end},${top} ${end},${top + r} V${bottom - r} Q${end},${bottom} ${end - r},${bottom} H${x0} Z"/>`;
    out += `<text x="0" y="${cy + 5}">${esc(fit(s.name))}</text>`;
    out += `<text class="value" x="${end + 7}" y="${cy + 5}">${L.fmtGrade(s.average)}</text>`;
    out += `<rect class="hit" data-subject="${esc(s.key)}" x="0" y="${i * rowH}" width="${width}" height="${rowH}"><title>${esc(s.name)}: ${L.fmtGrade(s.average)}</title></rect>`;
  });
  out += `</svg>`;
  box.innerHTML = out;

  const sel = subjects.find((s) => s.key === state.selectedSubject);
  $("#chart-detail").innerHTML = sel
    ? `<b>${esc(sel.name)}</b>: ${sel.grades.length} ${sel.grades.length === 1 ? "nota" : "notas"} (${sel.grades
        .map((g) => L.fmtGrade(g.value)).join(" · ")}) → media <b>${L.fmtGrade(sel.average)}</b>, ${L.gradeLabel(sel.average).toLowerCase()}`
    : "Toca una barra para ver sus notas.";
}

function openGradeEditor(grade, presetSubject = "") {
  const g = grade || { subject: presetSubject, value: null, description: "", date: today() };
  const known = L.bySubject(state.grades).map((s) => s.name);
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="gr-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="gr-title">${grade ? "Editar nota" : "Nueva nota"}</h2>
        <button class="btn" type="submit" form="grade-form" id="save">Guardar</button>
      </div>
      <form id="grade-form" novalidate>
        <label class="field"><span>Asignatura</span>
          <input name="subject" maxlength="60" placeholder="Ej.: Matemáticas" value="${esc(g.subject)}" autocomplete="off"></label>
        <div class="chips" id="suggestions"></div>
        <label class="field"><span>Nota (de 0 a 10)</span>
          <input name="value" inputmode="decimal" maxlength="5" placeholder="Ej.: 7,5" value="${g.value == null ? "" : L.fmtGrade(g.value)}">
          <small id="value-help">Puedes poner decimales: 4,5</small></label>
        <label class="field"><span>Qué era (opcional)</span>
          <input name="description" maxlength="80" placeholder="Ej.: Examen tema 3" value="${esc(g.description)}"></label>
        <label class="field"><span>Fecha</span><input name="date" type="date" value="${g.date}"></label>
        ${grade ? `<button type="button" class="btn danger block" data-action="delete-grade">Borrar esta nota</button>` : ""}
      </form>
    </div>`);
  const form = $("#grade-form", root);
  const f = form.elements;
  const refresh = () => {
    const value = f.value.value;
    const parsed = L.parseGrade(value);
    const bad = value.trim() !== "" && parsed == null;
    const help = $("#value-help", root);
    help.textContent = bad ? "Tiene que ser un número entre 0 y 10" : parsed != null ? L.gradeLabel(parsed) : "Puedes poner decimales: 4,5";
    help.className = bad ? "error" : "";
    f.value.setAttribute("aria-invalid", bad);
    $("#save", root).disabled = !f.subject.value.trim() || parsed == null || !f.date.value;
    const key = L.subjectKey(f.subject.value);
    const list = known.filter((n) => L.subjectKey(n) !== key && (!key || L.subjectKey(n).includes(key)));
    $("#suggestions", root).innerHTML = list.map((n) => `<button type="button" data-name="${esc(n)}">${esc(n)}</button>`).join("");
  };
  $("#suggestions", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-name]");
    if (!b) return;
    f.subject.value = b.dataset.name;
    refresh();
    f.value.focus();
  });
  f.value.addEventListener("input", () => {
    let v = f.value.value.replace(/[^\d.,]/g, "").replace(".", ",");
    const i = v.indexOf(",");
    if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/,/g, "");
    f.value.value = v.slice(0, 5);
    refresh();
  });
  f.subject.addEventListener("input", refresh);
  f.date.addEventListener("input", refresh);
  refresh();
  if (!grade) (presetSubject ? f.value : f.subject).focus();
  root.querySelector("[data-action=delete-grade]")?.addEventListener("click", () => {
    closeOverlay(root);
    state.grades = state.grades.filter((x) => x.id !== grade.id);
    saveData();
    render();
    toast(`Nota borrada (${grade.subject}: ${L.fmtGrade(grade.value)})`, "Deshacer", () => {
      state.grades = [...state.grades, grade];
      saveData();
      render();
    }, 6000);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#save", root).disabled) return;
    const values = {
      subject: L.cleanSubjectName(f.subject.value),
      value: L.parseGrade(f.value.value),
      description: f.description.value.trim(),
      date: f.date.value,
    };
    closeOverlay(root);
    if (grade) state.grades = state.grades.map((x) => (x.id === grade.id ? { ...x, ...values } : x));
    else state.grades = [...state.grades, { id: uid(), createdAt: Date.now(), ...values }];
    saveData();
    render();
  });
}

// ================================================================ Foco (temporizador de estudio)

const PRESETS = [
  { id: "25", work: 25, rest: 5, label: "25 + 5" },
  { id: "50", work: 50, rest: 10, label: "50 + 10" },
  { id: "15", work: 15, rest: 3, label: "15 + 3" },
];
const TIMER_KEY = "mipanel:temporizador";
const timer = Object.assign(
  { preset: "25", phase: "work", running: false, endsAt: 0, remaining: 25 * 60000, taskId: null, sound: "" },
  storage.get(TIMER_KEY, {})
);
if (!PRESETS.some((p) => p.id === timer.preset)) timer.preset = "25";
const SOUNDS = [
  { id: "", label: "Nada" },
  { id: "rain", label: "Lluvia" },
  { id: "waves", label: "Olas" },
  { id: "noise", label: "Ruido" },
];
if (!SOUNDS.some((x) => x.id === timer.sound)) timer.sound = "";

const preset = () => PRESETS.find((p) => p.id === timer.preset);
const phaseLength = (phase) => (phase === "work" ? preset().work : preset().rest) * 60000;
const timeLeft = () => (timer.running ? Math.max(0, timer.endsAt - Date.now()) : timer.remaining);
const saveTimer = () => storage.set(TIMER_KEY, timer);
const fmtClock = (ms) => {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

let ticker = 0;
function ensureTicker() {
  if (ticker || !timer.running) return;
  ticker = setInterval(tick, 250);
}
function tick() {
  if (!timer.running) {
    clearInterval(ticker);
    ticker = 0;
    return;
  }
  if (timeLeft() <= 0) completePhase();
  else updateFocusUI();
}

let audioCtx = null;
function ensureAudio() {
  try {
    audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
    audioCtx.resume?.();
  } catch {
    audioCtx = null;
  }
}
function chime() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime + 0.05;
  [784, 988, 1319].forEach((freq, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    const t = t0 + i * 0.2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 0.65);
  });
}

// ---------------------------------------------------------------- Sonido de fondo (generado, sin archivos)

let ambient = null; // { out, nodes, token }

/** Ruido de 6 s que se repite sin cortes: blanco (lluvia) o marrón (más grave y suave). */
function noiseSource(kind) {
  const len = audioCtx.sampleRate * 6;
  const buffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const d = buffer.getChannelData(0);
  if (kind === "white") {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else {
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    // Que el final empalme con el principio (si no, se oye un "clic" cada 6 s).
    const jump = d[len - 1] - d[0];
    for (let i = 0; i < len; i++) d[i] -= jump * (i / len);
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;
  return src;
}

function startAmbient(previewMs = 0) {
  stopAmbient();
  if (!timer.sound) return;
  ensureAudio();
  if (!audioCtx) return;
  const ctx = audioCtx;
  const t = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(1, t + 1.2);
  out.connect(ctx.destination);
  const nodes = [];
  const gain = (v) => {
    const g = ctx.createGain();
    g.gain.value = v;
    return g;
  };
  const filter = (type, freq) => {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    return f;
  };
  if (timer.sound === "rain") {
    const hiss = noiseSource("white");
    hiss.connect(filter("highpass", 400)).connect(filter("lowpass", 5000)).connect(gain(0.09)).connect(out);
    const body = noiseSource("brown");
    body.connect(gain(0.25)).connect(out);
    nodes.push(hiss, body);
  } else if (timer.sound === "waves") {
    // Ruido grave que sube y baja despacio, como el mar (una ola cada ~9 s).
    const sea = noiseSource("brown");
    const swell = gain(0.35);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11;
    lfo.connect(gain(0.28)).connect(swell.gain);
    sea.connect(filter("lowpass", 1100)).connect(swell).connect(out);
    nodes.push(sea, lfo);
  } else {
    const soft = noiseSource("brown");
    soft.connect(gain(0.4)).connect(out);
    nodes.push(soft);
  }
  nodes.forEach((n) => n.start());
  const token = {};
  ambient = { out, nodes, token, preview: previewMs > 0 };
  if (previewMs) setTimeout(() => ambient?.token === token && stopAmbient(), previewMs);
}

function stopAmbient() {
  if (!ambient || !audioCtx) return;
  const { out, nodes } = ambient;
  ambient = null;
  const t = audioCtx.currentTime;
  out.gain.cancelScheduledValues(t);
  out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), t);
  out.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  setTimeout(() => {
    nodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* ya parado */
      }
    });
    out.disconnect();
  }, 600);
}

// ---------------------------------------------------------------- Pantalla encendida mientras cuenta

let wakeLock = null;
async function keepScreenOn(on) {
  try {
    if (on && !wakeLock && navigator.wakeLock && !document.hidden) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => (wakeLock = null));
    } else if (!on && wakeLock) {
      const lock = wakeLock;
      wakeLock = null;
      await lock.release();
    }
  } catch {
    wakeLock = null;
  }
}

/** Sonido y pantalla según el temporizador: solo mientras cuenta (el sonido, solo al concentrarte). */
function syncFocusExtras() {
  keepScreenOn(timer.running);
  if (timer.running && timer.phase === "work" && timer.sound) {
    if (!ambient || ambient.preview) startAmbient();
  } else {
    stopAmbient();
  }
}

function addFocusMinutes(minutes) {
  if (minutes < 1) return;
  const day = today();
  state.focus = { ...state.focus, [day]: (state.focus[day] || 0) + minutes };
  saveData();
}

function startTimer() {
  if (timer.running) return;
  ensureAudio();
  timer.endsAt = Date.now() + timer.remaining;
  timer.running = true;
  saveTimer();
  ensureTicker();
  syncFocusExtras();
  renderIfFocus();
}

function pauseTimer() {
  if (!timer.running) return;
  timer.remaining = timeLeft();
  timer.running = false;
  saveTimer();
  syncFocusExtras();
  renderIfFocus();
}

/** Para y vuelve al principio. Si estabas concentrado, guarda los minutos que llevabas. */
function resetTimer() {
  if (timer.phase === "work") {
    const minutes = Math.floor((phaseLength("work") - timeLeft()) / 60000);
    if (minutes >= 1) {
      addFocusMinutes(minutes);
      toast(`Guardados ${fmtMinutes(minutes)} de foco`);
    }
  }
  timer.phase = "work";
  timer.running = false;
  timer.remaining = phaseLength("work");
  saveTimer();
  syncFocusExtras();
  renderIfFocus();
}

function skipPhase() {
  if (timer.phase === "work") {
    resetTimer();
    timer.phase = "rest";
    timer.remaining = phaseLength("rest");
  } else {
    timer.phase = "work";
    timer.remaining = phaseLength("work");
  }
  timer.running = false;
  saveTimer();
  syncFocusExtras();
  renderIfFocus();
}

function completePhase() {
  const finished = timer.phase;
  timer.running = false;
  syncFocusExtras();
  chime();
  navigator.vibrate?.([200, 120, 200, 120, 400]);
  if (finished === "work") {
    addFocusMinutes(preset().work);
    timer.phase = "rest";
    timer.remaining = phaseLength("rest");
    saveTimer();
    renderIfFocus();
    focusDoneDialog();
  } else {
    timer.phase = "work";
    timer.remaining = phaseLength("work");
    saveTimer();
    renderIfFocus();
    toast("Descanso terminado: ¡a por otra sesión!", "Empezar", startTimer, 8000);
  }
}

function renderIfFocus() {
  if (state.tab === "foco") render();
}

function updateFocusUI() {
  const time = $("#focus-time");
  if (!time) return;
  const left = timeLeft();
  time.textContent = fmtClock(left);
  const pct = 100 - (left / phaseLength(timer.phase)) * 100;
  const focusRing = $("#focus-ring");
  focusRing?.style.setProperty("--p", pct.toFixed(2));
  focusRing?.classList.toggle("empty", pct <= 0);
}

function renderFocus() {
  const day = today();
  const studyTasks = L.pendingSorted(state.tasks).filter(L.hasPages);
  if (timer.taskId && !studyTasks.some((t) => t.id === timer.taskId)) timer.taskId = null;
  const isWork = timer.phase === "work";
  const left = timeLeft();
  const pct = 100 - (left / phaseLength(timer.phase)) * 100;
  const days = L.studyByDay(state.tasks, 7, day, state.focus);
  const week = days.reduce((s, d) => s + d.minutes, 0);
  const todayMin = state.focus[day] || 0;
  const streak = L.studyStreak(state.tasks, day, state.focus);
  const p = preset();
  $("#view").innerHTML = `${topbar("Foco")}
    <div class="${stackClass()}">
      <section class="card focus-card${isWork ? "" : " resting"}">
        <div class="segmented presets">${PRESETS.map((x) => `<button type="button" data-action="preset" data-preset="${x.id}" aria-pressed="${x.id === timer.preset}" ${timer.running ? "disabled" : ""}>${x.label}</button>`).join("")}</div>
        <div class="ring-wrap xl${timer.running ? " live" : ""}">
          ${ring(Number(pct.toFixed(2)), isWork ? "" : "--c1:var(--cyan);--c2:var(--blue)", "focus-ring")}
          <div class="center">
            <span class="eyebrow">${isWork ? "Concentración" : "Descanso"}</span>
            <b class="focus-time" id="focus-time">${fmtClock(left)}</b>
            <span class="small">${isWork ? `${p.work} min de estudio` : `${p.rest} min para despejarte`}</span>
          </div>
        </div>
        <label class="field focus-task"><span>Estoy estudiando</span>
          <select id="focus-task">
            <option value="">Sin elegir tarea</option>
            ${studyTasks.map((t) => `<option value="${t.id}" ${t.id === timer.taskId ? "selected" : ""}>${esc(t.title)}</option>`).join("")}
          </select></label>
        <div class="field focus-sound"><span>${svg("music")}Sonido de fondo</span>
          <div class="segmented sounds">${SOUNDS.map((x) => `<button type="button" data-action="sound" data-sound="${x.id}" aria-pressed="${x.id === timer.sound}">${x.label}</button>`).join("")}</div></div>
        <div class="focus-controls">
          <button class="icon-btn big" data-action="focus-reset" aria-label="Reiniciar">${svg("reset")}</button>
          ${timer.running
            ? `<button class="btn play" data-action="focus-pause">${svg("pause")}Pausar</button>`
            : `<button class="btn play" data-action="focus-start">${svg("play")}${left < phaseLength(timer.phase) ? "Seguir" : isWork ? "Empezar" : "Descansar"}</button>`}
          <button class="icon-btn big" data-action="focus-skip" aria-label="${isWork ? "Pasar al descanso" : "Saltar descanso"}">${svg("skip")}</button>
        </div>
        <p class="small" style="text-align:center;margin:14px 0 0">Si sales de la app el tiempo sigue contando${"wakeLock" in navigator ? ". Mientras cuenta, la pantalla no se apaga" : ""}. Al terminar suena y vibra si la tienes abierta.</p>
      </section>
      <section class="card">
        ${cardHead("timer", "Tiempo de estudio", streak ? `<span class="pill" style="--pill:var(--warning)">${svg("flame")}${streak} ${streak === 1 ? "día" : "días"}</span>` : "")}
        <div class="mini-stats">
          <div><b class="num">${fmtMinutes(todayMin)}</b><span>hoy</span></div>
          <div><b class="num">${fmtMinutes(week)}</b><span>esta semana</span></div>
        </div>
        <div class="${chartClass()}" id="focus-chart"></div>
        <p class="chart-detail">${(() => {
          const sel = days.find((d) => d.date === state.selectedFocusDay);
          return sel ? `<b>${L.fmtDateShort(sel.date)}</b>: ${fmtMinutes(sel.minutes)} de foco` : "Minutos de foco de los últimos 7 días.";
        })()}</p>
      </section>
      ${achievementsCard()}
    </div>`;
  const box = $("#focus-chart");
  box.innerHTML = C.dayColumns(days.map((d) => ({ date: d.date, value: d.minutes })), {
    width: Math.max(260, box.clientWidth || 320),
    unit: "min",
    selected: state.selectedFocusDay,
    hitAttr: "data-focusday",
  });
  ensureTicker();
}

// ---------------------------------------------------------------- Logros

const ACH_KEY = "mipanel:logros";
let selectedBadge = null;

function achievementsCard() {
  const list = L.achievements(state.tasks, state.grades, state.focus);
  const got = list.filter((a) => a.done).length;
  const sel = list.find((a) => a.id === selectedBadge);
  return `<section class="card" id="achievements">
    ${cardHead("trophy", "Logros", `<span class="pill" style="--pill:var(--warning)">${got} de ${list.length}</span>`)}
    <div class="badges">${list.map((a) => `
      <button type="button" class="badge${a.done ? " got" : ""}" data-action="badge" data-id="${a.id}" aria-pressed="${a.id === selectedBadge}">
        <span class="badge-emoji" aria-hidden="true">${a.icon}</span>
        <b>${esc(a.title)}</b>
        <span>${a.done ? "Conseguido" : a.goal > 1 ? `${a.cur} / ${a.goal}` : "Pendiente"}</span>
        ${!a.done && a.goal > 1 ? meter((a.cur / a.goal) * 100, { color: "var(--warning)" }) : ""}
      </button>`).join("")}</div>
    <p class="chart-detail">${sel
      ? `${sel.icon} <b>${esc(sel.title)}</b>: ${esc(sel.desc)}.${sel.done ? " ¡Conseguido!" : sel.goal > 1 ? ` Llevas ${sel.cur} de ${sel.goal}.` : ""}`
      : "Se consiguen estudiando, con el foco y con tus notas. Toca uno para ver cómo."}</p>
  </section>`;
}

/** Avisa cuando se consigue un logro nuevo (la primera vez solo apunta los que ya tenías). */
function checkAchievements() {
  const done = L.achievements(state.tasks, state.grades, state.focus).filter((a) => a.done);
  const seen = storage.get(ACH_KEY, null);
  storage.set(ACH_KEY, [...new Set([...(Array.isArray(seen) ? seen : []), ...done.map((a) => a.id)])]);
  if (!Array.isArray(seen)) return;
  const fresh = done.find((a) => !seen.includes(a.id));
  if (fresh) toastAfter(`🏆 ¡Logro conseguido! ${fresh.icon} ${fresh.title}`, state.tab === "foco" ? null : "Ver", () => setTab("foco"), 6000);
}

/** Al acabar una sesión: anotar páginas de la tarea que estabas estudiando y empezar el descanso. */
function focusDoneDialog() {
  const task = state.tasks.find((t) => t.id === timer.taskId && !L.isDone(t));
  const todayMin = state.focus[today()] || 0;
  const root = overlay(`
    <div class="scrim"><div class="dialog center-dialog" role="dialog" aria-modal="true" aria-labelledby="fd-title">
      <div class="burst" aria-hidden="true">⏱️</div>
      <h2 id="fd-title">¡Sesión completada!</h2>
      <p style="margin:0">${preset().work} min de concentración. Hoy llevas <b>${fmtMinutes(todayMin)}</b>.</p>
      ${task ? `<p class="mt12" style="margin-bottom:8px">¿Cuántas páginas de «${esc(task.title)}» has estudiado?</p>
        <div class="quick" style="grid-template-columns:repeat(4,1fr)">
          ${[1, 3, 5, 10].map((n) => `<button type="button" data-add="${n}">+${n}</button>`).join("")}
        </div>` : ""}
      <button class="btn block mt16" id="fd-rest">Empezar descanso de ${preset().rest} min</button>
      <button class="btn text block" data-close>Ahora no</button>
    </div></div>`);
  root.querySelectorAll("[data-add]").forEach((b) =>
    b.addEventListener("click", () => {
      closeOverlay(root);
      changeTask(task.id, (t) => L.withPagesAdded(t, Number(b.dataset.add), today(), Date.now()));
    })
  );
  $("#fd-rest", root).addEventListener("click", () => {
    closeOverlay(root);
    startTimer();
  });
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden && timer.running) {
    tick();
    keepScreenOn(true); // el navegador la suelta al salir de la app
  }
});

// ================================================================ Copia de seguridad

function openBackupDialog() {
  const root = overlay(`
    <div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="bk-title">
      <h2 id="bk-title">Copia de seguridad</h2>
      <p style="margin-top:0">${ARTIFACT
        ? "Tus tareas, notas y horario ya se guardan en tu cuenta de Claude. Si quieres, guarda también una copia en un archivo: sirve para pasarlas a la app instalable (APK) o a la versión web."
        : "Guarda tus tareas, notas y horario en un archivo (en Descargas, Drive…). Si cambias de móvil o borras los datos de Chrome, las recuperas desde aquí. Sirve también para pasarlas a la app instalable (APK)."}</p>
      <button class="btn block" id="bk-export">Guardar copia</button>
      <button class="btn outline block mt8" id="bk-import">Recuperar una copia</button>
      <input type="file" id="bk-file" accept=".json,application/json" hidden>
      <p class="strong mt12" id="bk-msg"></p>
      <div class="actions"><button class="btn text" data-close>Cerrar</button></div>
    </div></div>`);
  const msg = $("#bk-msg", root);
  $("#bk-export", root).addEventListener("click", async () => {
    const data = { app: "MiPanel", version: 1, createdAt: Date.now(), tasks: state.tasks, grades: state.grades, focus: state.focus, schedule: state.schedule };
    if (ARTIFACT) {
      const downloads = await window.claude?.use?.("downloads");
      if (!downloads) {
        msg.textContent = "Aquí no se pueden descargar archivos.";
        return;
      }
      try {
        await downloads.save({ filename: `mipanel-copia-${today()}.json`, data: JSON.stringify(data, null, 2) });
        msg.textContent = "✓ Copia guardada";
      } catch (e) {
        msg.textContent = e?.code === "declined" ? "" : "No se ha podido guardar la copia.";
      }
      return;
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `mipanel-copia-${today()}.json` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    msg.textContent = "✓ Copia guardada en Descargas";
  });
  $("#bk-import", root).addEventListener("click", () => $("#bk-file", root).click());
  $("#bk-file", root).addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.tasks) && !Array.isArray(data.grades)) throw new Error("formato");
      const merge = (current, incoming = []) => {
        const ids = new Set(incoming.map((x) => x.id));
        return [...current.filter((x) => !ids.has(x.id)), ...incoming];
      };
      state.tasks = merge(state.tasks, data.tasks);
      state.grades = merge(state.grades, data.grades);
      if (Array.isArray(data.schedule)) state.schedule = merge(state.schedule, data.schedule);
      if (isPlainObject(data.focus)) {
        const focus = { ...state.focus };
        for (const [day, min] of Object.entries(data.focus)) focus[day] = Math.max(focus[day] || 0, Number(min) || 0);
        state.focus = focus;
      }
      saveData();
      render();
      msg.textContent = `✓ Recuperadas ${(data.tasks || []).length} tareas y ${(data.grades || []).length} notas`;
    } catch {
      msg.textContent = "Ese archivo no es una copia de Mi Panel";
    }
  });
}

// ================================================================ Capas, menús y diálogos

function overlay(html) {
  const wrap = document.createElement("div");
  wrap.innerHTML = html.trim();
  const root = wrap.firstElementChild;
  $("#overlay-root").append(root);
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]") || e.target === root) closeOverlay(root);
  });
  pushEntry();
  return root;
}

function closeOverlay(root) {
  if (!root.isConnected) return;
  root.remove();
  popEntry();
}

// Cada diálogo abierto añade una entrada al historial: así el botón "atrás" de Android
// lo cierra en vez de salir de la app. history.back() es asíncrono, por eso se encolan
// las entradas que se piden mientras hay un "atrás" pendiente.
let entries = 0;
let backPending = 0;
let deferred = 0;

function pushEntry() {
  if (ARTIFACT) return;
  if (backPending) {
    deferred++;
    return;
  }
  history.pushState({ overlay: true }, "");
  entries++;
}

function popEntry() {
  if (ARTIFACT) return;
  if (deferred > 0) {
    deferred--;
    return;
  }
  if (entries > 0) {
    entries--;
    backPending++;
    history.back();
  }
}

window.addEventListener("popstate", () => {
  if (backPending) {
    backPending--;
    if (!backPending) {
      while (deferred > 0) {
        deferred--;
        history.pushState({ overlay: true }, "");
        entries++;
      }
    }
    return;
  }
  // "Atrás" del móvil: cierra el último diálogo abierto.
  if (entries > 0) entries--;
  $("#overlay-root").lastElementChild?.remove();
  closeMenu();
});

function confirmDialog(title, text, ok) {
  return new Promise((resolve) => {
    const root = overlay(`
      <div class="scrim"><div class="dialog" role="alertdialog" aria-modal="true">
        <h2>${esc(title)}</h2><p style="margin-top:0">${esc(text)}</p>
        <div class="actions"><button class="btn text" data-close>Cancelar</button><button class="btn text" id="ok">${esc(ok)}</button></div>
      </div></div>`);
    const observer = new MutationObserver(() => {
      if (!root.isConnected) {
        observer.disconnect();
        resolve(false);
      }
    });
    observer.observe($("#overlay-root"), { childList: true });
    $("#ok", root).addEventListener("click", () => {
      observer.disconnect();
      closeOverlay(root);
      resolve(true);
    });
  });
}

let openMenuEl = null;
function closeMenu() {
  openMenuEl?.remove();
  openMenuEl = null;
}

function showMenu(anchor, items) {
  closeMenu();
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.setAttribute("role", "menu");
  items.forEach(([label, fn, danger]) => {
    const b = document.createElement("button");
    b.type = "button";
    if (danger) b.className = "danger";
    b.setAttribute("role", "menuitem");
    b.textContent = label;
    b.addEventListener("click", () => {
      closeMenu();
      fn();
    });
    menu.append(b);
  });
  document.body.append(menu);
  const r = anchor.getBoundingClientRect();
  const left = Math.min(r.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 8);
  let top = r.bottom + scrollY;
  if (r.bottom + menu.offsetHeight > innerHeight - 80) top = r.top + scrollY - menu.offsetHeight;
  menu.style.left = `${Math.max(8, left)}px`;
  menu.style.top = `${top}px`;
  openMenuEl = menu;
}

// ================================================================ Eventos

document.addEventListener("click", (e) => {
  if (openMenuEl && !e.target.closest(".menu") && !e.target.closest("[data-action$=menu]")) closeMenu();
  const tab = e.target.closest(".tab");
  if (tab) return setTab(tab.dataset.tab);
  const el = e.target.closest("[data-action]");
  if (!el || el.closest("#overlay-root")) {
    const hit = e.target.closest(".chart .hit");
    if (hit) {
      const toggle = (key, value) => (state[key] = state[key] === value ? null : value);
      if (hit.dataset.subject) {
        toggle("selectedSubject", hit.dataset.subject);
        drawChart(L.bySubject(state.grades));
      } else if (hit.dataset.point) {
        toggle("selectedPoint", hit.dataset.point);
        drawEvolution();
      } else if (hit.dataset.day) {
        toggle("selectedDay", hit.dataset.day);
        render();
      } else if (hit.dataset.focusday) {
        toggle("selectedFocusDay", hit.dataset.focusday);
        render();
      }
    }
    return;
  }
  const id = el.dataset.id;
  switch (el.dataset.action) {
    case "install":
      installPrompt?.prompt();
      break;
    case "copy-link":
      copyLink(ARTIFACT ? APP_URL : location.href.split("#")[0]);
      break;
    case "hide-install":
      storage.set("mipanel:ocultar-instalar-2", true);
      render();
      break;
    case "bt":
      connectHeadphones();
      break;
    case "weather":
      loadWeather({ relocate: true });
      break;
    case "weather-refresh":
      loadWeather({ relocate: true });
      break;
    case "speed":
      runSpeedTest();
      break;
    case "speed-cancel":
      speedAbort?.abort();
      break;
    case "new-task":
      openTaskEditor(null);
      break;
    case "add-pages":
      changeTask(id, (t) => L.withPagesAdded(t, Number(el.dataset.n), today(), Date.now()));
      break;
    case "log":
      openProgressDialog(findTask(id));
      break;
    case "toggle":
      changeTask(id, (t) => L.toggledDone(t, Date.now()));
      break;
    case "toggle-done":
      state.showDone = !state.showDone;
      render();
      break;
    case "task-menu": {
      const t = findTask(id);
      const items = [["Editar", () => openTaskEditor(t)]];
      if (L.hasPages(t)) items.push(["Corregir páginas", () => openProgressDialog(t)]);
      if (!L.hasPages(t) && L.isDone(t)) items.push(["Marcar como pendiente", () => changeTask(id, (x) => L.toggledDone(x, Date.now()))]);
      items.push(["Borrar", () => deleteTask(id), true]);
      if (openMenuEl) closeMenu();
      else showMenu(el, items);
      break;
    }
    case "target":
      state.target = Number(el.dataset.target);
      storage.set("mipanel:objetivo", state.target);
      render();
      break;
    case "preset":
      if (!timer.running) {
        timer.preset = el.dataset.preset;
        timer.phase = "work";
        timer.remaining = phaseLength("work");
        saveTimer();
        render();
      }
      break;
    case "sound":
      timer.sound = el.dataset.sound;
      saveTimer();
      if (timer.running && timer.phase === "work") startAmbient();
      else if (timer.sound) startAmbient(3000); // se escucha un momento para ver cómo suena
      else stopAmbient();
      render();
      break;
    case "badge":
      selectedBadge = selectedBadge === id ? null : id;
      $("#achievements").outerHTML = achievementsCard();
      break;
    case "focus-start":
      startTimer();
      break;
    case "focus-pause":
      pauseTimer();
      break;
    case "focus-reset":
      resetTimer();
      break;
    case "focus-skip":
      skipPhase();
      break;
    case "menu":
      if (openMenuEl) closeMenu();
      else showMenu(el, [["Horario de clases", openScheduleEditor], ["Copia de seguridad", openBackupDialog]]);
      break;
    case "schedule":
      openScheduleEditor();
      break;
    case "new-grade":
      openGradeEditor(null, el.dataset.subject || "");
      break;
    case "edit-grade":
      openGradeEditor(state.grades.find((g) => g.id === id));
      break;
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id === "focus-task") {
    timer.taskId = e.target.value || null;
    saveTimer();
  }
});

addEventListener("online", updateNetwork);
addEventListener("offline", updateNetwork);
navigator.connection?.addEventListener("change", updateNetwork);

let resizeTimer = 0;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => state.tab !== "estado" && render(), 150);
});

// Si la app se queda abierta de un día para otro, se recalcula "hoy".
let lastDay = today();
setInterval(() => {
  if (today() !== lastDay) {
    lastDay = today();
    if (state.tab === "tareas") render();
  } else if (state.tab === "tareas") {
    const card = $("#schedule-card");
    if (card) card.outerHTML = scheduleCard(today());
  }
}, 60_000);

// Otra pestaña con la app abierta cambió los datos.
addEventListener("storage", (e) => {
  if (e.key === DATA_KEY && state.where === "local") {
    loadData();
    if (state.tab !== "estado") render();
  }
});

// ================================================================ Arranque

// Accesos directos del icono (mantener pulsado): ?pestana=tareas / notas
const fromUrl = new URLSearchParams(location.search).get("pestana");
if (fromUrl) state.tab = fromUrl;
if (!["estado", "tareas", "foco", "notas"].includes(state.tab)) state.tab = "estado";
if (ARTIFACT) initCloud();
else loadData();
render();
initBattery();
initDevice();
if (timer.running && timeLeft() <= 0) setTimeout(completePhase, 600);
else ensureTicker();

if (!ARTIFACT && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// Para los tests automáticos.
window.__miPanel = { state, render, timer, completePhase };
