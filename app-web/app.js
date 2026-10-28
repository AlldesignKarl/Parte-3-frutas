import * as L from "./logic.js";
import * as C from "./charts.js";
import { readTable } from "./importers.js";

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
// Fecha de esta versión (la pone el build).
// eslint-disable-next-line no-undef
const BUILD = typeof __BUILD__ !== "undefined" ? __BUILD__ : "de pruebas";

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
  home: "M10,20v-6h4v6h5v-8h3L12,3 2,12h3v8z",
  chat: "M20,2H4C2.9,2 2.01,2.9 2.01,4L2,22l4,-4h14c1.1,0 2,-0.9 2,-2V4c0,-1.1 -0.9,-2 -2,-2zM6,9h12v2H6V9zM14,14H6v-2h8v2zM18,8H6V6h12v2z",
  wallet: "M21,18v1c0,1.1 -0.9,2 -2,2H5c-1.11,0 -2,-0.9 -2,-2V5c0,-1.1 0.89,-2 2,-2h14c1.1,0 2,0.9 2,2v1h-9c-1.11,0 -2,0.9 -2,2v8c0,1.1 0.89,2 2,2h9zM12,16h10V8H12v8zM16,13.5c-0.83,0 -1.5,-0.67 -1.5,-1.5s0.67,-1.5 1.5,-1.5 1.5,0.67 1.5,1.5 -0.67,1.5 -1.5,1.5z",
  piggy: "M19.83,7.5l-2.27,-2.27c0.07,-0.42 0.18,-0.81 0.32,-1.15C17.96,3.9 18,3.71 18,3.5C18,2.67 17.33,2 16.5,2c-1.64,0 -3.09,0.79 -4,2l-5,0C4.46,4 2,6.46 2,9.5S4.5,21 4.5,21l5.5,0v-2h2v2l5.5,0l1.68,-5.59L22,14.47V7.5H19.83zM13,9H8V7h5V9zM16,11c-0.55,0 -1,-0.45 -1,-1c0,-0.55 0.45,-1 1,-1s1,0.45 1,1C17,10.55 16.55,11 16,11z",
  cake: "M12,6c1.11,0 2,-0.9 2,-2 0,-0.38 -0.1,-0.73 -0.29,-1.03L12,0l-1.71,2.97c-0.19,0.3 -0.29,0.65 -0.29,1.03 0,1.1 0.9,2 2,2zM16.6,15.99l-1.07,-1.07 -1.08,1.07c-1.3,1.3 -3.58,1.31 -4.89,0l-1.07,-1.07 -1.09,1.07C6.75,16.64 5.88,17 4.96,17c-0.73,0 -1.4,-0.23 -1.96,-0.61L3,21c0,0.55 0.45,1 1,1h16c0.55,0 1,-0.45 1,-1v-4.61c-0.56,0.38 -1.23,0.61 -1.96,0.61 -0.92,0 -1.79,-0.36 -2.44,-1.01zM18,9h-5L13,7h-2v2L6,9c-1.66,0 -3,1.34 -3,3v1.54c0,1.08 0.88,1.96 1.96,1.96 0.52,0 1.02,-0.2 1.38,-0.57l2.14,-2.13 2.13,2.13c0.74,0.74 2.03,0.74 2.77,0l2.14,-2.13 2.13,2.13c0.37,0.37 0.86,0.57 1.38,0.57 1.08,0 1.96,-0.88 1.96,-1.96L21,12c0.01,-1.66 -1.33,-3 -2.99,-3z",
  flashlight: "M6,2h12v3H6zM6,7v1l2,3v11h8V11l2,-3V7H6zM12,15.5c-0.83,0 -1.5,-0.67 -1.5,-1.5s0.67,-1.5 1.5,-1.5 1.5,0.67 1.5,1.5 -0.67,1.5 -1.5,1.5z",
  qr: "M9.5,6.5v3h-3v-3H9.5M11,5H5v6h6V5L11,5zM9.5,14.5v3h-3v-3H9.5M11,13H5v6h6V13L11,13zM17.5,6.5v3h-3v-3H17.5M19,5h-6v6h6V5L19,5zM13,13h1.5v1.5H13V13zM14.5,14.5H16V16h-1.5V14.5zM16,13h1.5v1.5H16V13zM13,16h1.5v1.5H13V16zM14.5,17.5H16V19h-1.5V17.5zM16,16h1.5v1.5H16V16zM17.5,14.5H19V16h-1.5V14.5zM17.5,17.5H19V19h-1.5V17.5zM22,7h-2V4h-3V2h5V7zM22,22v-5h-2v3h-3v2H22zM2,22h5v-2H4v-3H2V22zM2,2v5h2V4h3V2H2z",
  flag: "M14.4,6L14,4H5v17h2v-7h5.6l0.4,2h7V6z",
  dice: "M19,3H5C3.9,3 3,3.9 3,5v14c0,1.1 0.9,2 2,2h14c1.1,0 2,-0.9 2,-2V5C21,3.9 20.1,3 19,3zM7.5,18C6.67,18 6,17.33 6,16.5S6.67,15 7.5,15S9,15.67 9,16.5S8.33,18 7.5,18zM7.5,9C6.67,9 6,8.33 6,7.5S6.67,6 7.5,6S9,6.67 9,7.5S8.33,9 7.5,9zM12,13.5c-0.83,0 -1.5,-0.67 -1.5,-1.5s0.67,-1.5 1.5,-1.5s1.5,0.67 1.5,1.5S12.83,13.5 12,13.5zM16.5,18c-0.83,0 -1.5,-0.67 -1.5,-1.5s0.67,-1.5 1.5,-1.5s1.5,0.67 1.5,1.5S17.33,18 16.5,18zM16.5,9C15.67,9 15,8.33 15,7.5S15.67,6 16.5,6S18,6.67 18,7.5S17.33,9 16.5,9z",
  apps: "M4,8h4V4H4v4zM10,20h4v-4h-4v4zM4,20h4v-4H4v4zM4,14h4v-4H4v4zM10,14h4v-4h-4v4zM16,4v4h4V4h-4zM10,8h4V4h-4v4zM16,14h4v-4h-4v4zM16,20h4v-4h-4v4z",
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
// Dentro de la app Android (APK) la página puede pedirle cosas al móvil: mensajes, linterna, cascos…
const NATIVE = !ARTIFACT && typeof window.MiPanelAndroid === "object" ? window.MiPanelAndroid : null;
const APK_URL = "https://github.com/AlldesignKarl/Parte-3-frutas/releases/download/mi-panel/MiPanel.apk";
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
  tab: storage.get("mipanel:pestana", "inicio"),
  tasks: [],
  grades: [],
  focus: {}, // minutos de foco por día: { "2026-10-26": 50 }
  schedule: [], // horario de clases: { id, day (1 = lunes … 7), start "08:30", end "09:25", subject, room }
  money: L.emptyMoney(), // { entries: [{ id, type "gasto"|"ingreso", amount (céntimos), category, note, date }], goals: [huchas], budget }
  events: [], // cuentas atrás: { id, name, date, type "cumple"|"evento", emoji }
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
  state.money = validData("money", data.money) ? data.money : L.emptyMoney();
  state.events = Array.isArray(data.events) ? data.events : [];
}

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);
const DATA_KEYS = ["tasks", "grades", "focus", "schedule", "money", "events"];
// Casi todo son listas; el foco (minutos por día) y el dinero son objetos.
const emptyData = (key) => (key === "focus" ? {} : key === "money" ? L.emptyMoney() : []);
function validData(key, v) {
  if (key === "focus") return isPlainObject(v);
  if (key === "money") return isPlainObject(v) && Array.isArray(v.entries) && Array.isArray(v.goals);
  return Array.isArray(v);
}

let persistAsked = false;
function saveData() {
  if (state.where === "cloud") {
    DATA_KEYS.forEach((k) => (cloud.dirty[k] = true));
    flushCloud();
    checkAchievements();
    return;
  }
  const ok = storage.set(DATA_KEY, {
    version: 1,
    tasks: state.tasks,
    grades: state.grades,
    focus: state.focus,
    schedule: state.schedule,
    money: state.money,
    events: state.events,
  });
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
  dirty: Object.fromEntries(DATA_KEYS.map((k) => [k, false])),
  written: Object.fromEntries(DATA_KEYS.map((k) => [k, null])),
  writing: false,
  loaded: Object.fromEntries(DATA_KEYS.map((k) => [k, false])),
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
      money: db.doc(`${base}/dinero`),
      events: db.doc(`${base}/fechas`),
    };
    for (const key of DATA_KEYS) {
      cloud.docs[key].onSnapshot(
        (snap) => {
          if (snap.metadata.hasPendingWrites || cloud.dirty[key] || cloud.writing) return;
          const empty = emptyData(key);
          const items = snap.exists ? snap.data().items : empty;
          const text = JSON.stringify(validData(key, items) ? items : empty);
          cloud.written[key] = text;
          if (text !== JSON.stringify(state[key])) {
            state[key] = JSON.parse(text);
            render();
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
  else if (state.tab === "dinero") renderMoney();
  else renderHome();
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
    ["levelchange", "chargingchange"].forEach((e) => b.addEventListener(e, onBattery));
    onBattery();
  } catch {
    status.batteryBlocked = true;
    updateBattery();
  }
}

// El tiempo que da Chrome no es fiable (puede decir "110 días"): la app lo calcula con lo que
// ve subir o bajar la batería mientras está abierta.
function onBattery() {
  const b = status.battery;
  status.battLog = L.addBatterySample(status.battLog ?? storage.get(BATT_KEY, null), b.level, b.charging, Date.now());
  storage.set(BATT_KEY, status.battLog);
  updateBattery();
  updateHome();
}

/** Nivel, si está cargando y cuánto falta (null si aún no se sabe). */
function batteryInfo() {
  const b = status.battery;
  if (!b) return null;
  const pct = Math.round(b.level * 100);
  const full = b.charging && pct >= 100;
  const est = full ? null : L.batteryEstimate(status.battLog, b.level, b.charging);
  return { pct, full, charging: b.charging, est };
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
  const { pct, full, est } = batteryInfo();
  const [c1, c2] = batteryGradient(pct);
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

/** Si el tiempo es de hace más de media hora, se actualiza solo (con el sitio de la última vez: sin pedir la ubicación). */
function maybeRefreshWeather() {
  const w = weather.data;
  if (ARTIFACT || !w || weather.state === "loading" || navigator.onLine === false) return;
  if (Date.now() - w.at > 30 * 60000 && Date.now() - weather.tried > 10 * 60000) loadWeather();
}

function updateWeather() {
  updateHome();
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

/** Cascos conectados según la app Android: { supported, permission, on, devices: [{ name, battery }] }. */
function nativeHeadphones() {
  try {
    return JSON.parse(NATIVE.headphones() || "{}");
  } catch {
    return {};
  }
}

function updateBt() {
  const box = $("#bt-body");
  if (!box) return;
  if (NATIVE) {
    const h = nativeHeadphones();
    if (h.supported === false) box.innerHTML = `<p class="hint">Este móvil no tiene Bluetooth.</p>`;
    else if (!h.permission) {
      box.innerHTML = `<p class="hint">Para ver la batería de tus cascos, Mi Panel necesita permiso para ver los dispositivos Bluetooth.</p>
        <button class="btn tonal block mt16" data-action="bt">Dar permiso</button>`;
    } else if (!h.on) box.innerHTML = `<p class="hint">El Bluetooth está apagado.</p>`;
    else if (!h.devices?.length) box.innerHTML = `<p class="hint">No hay cascos conectados. Cuando los conectes, aquí sale su batería.</p>`;
    else {
      box.innerHTML = h.devices.map((d) => `<div class="row mt8">${svg("headphones")}<div class="grow"><div class="row"><span class="grow strong">${esc(d.name)}</span>
        <span class="strong">${d.battery == null ? "—" : `${d.battery} %`}</span></div>
        ${d.battery == null ? `<p class="small" style="margin:4px 0 0">Estos cascos no le dicen su batería al móvil.</p>` : meter(d.battery, { color: batteryColor(d.battery), cls: "mt8" })}</div></div>`).join("");
    }
    return;
  }
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
  updateHome();
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
  if (state.tab === "inicio") render();
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
  if (isStandalone() || NATIVE) return "";
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

// ================================================================ Pantalla Inicio (panel de control)

function greeting() {
  const h = new Date().getHours();
  return h >= 6 && h < 14 ? "Buenos días" : h >= 14 && h < 21 ? "Buenas tardes" : "Buenas noches";
}

const TOOLS = [
  { id: "torch", icon: "flashlight", label: "Linterna", camera: true },
  { id: "qr", icon: "qr", label: "Leer QR", camera: true },
  { id: "stopwatch", icon: "timer", label: "Crono" },
  { id: "dice", icon: "dice", label: "Dados" },
  { id: "speed", icon: "speed", label: "Velocidad" },
];

function renderHome() {
  const header = topbar(greeting(), `<button class="icon-btn" data-action="home-menu" aria-label="Más opciones">${svg("more")}</button>`);
  // En claude.ai la página no puede usar la cámara: ahí no salen la linterna ni el escáner.
  const tools = TOOLS.filter((t) => !(ARTIFACT && t.camera));
  $("#view").innerHTML = `${header}${installBanner()}
    <div class="${stackClass()}">
      <div class="tiles" id="tiles">${homeTiles()}</div>
      <section class="card">${cardHead("apps", "Herramientas")}
        <div class="tools">${tools.map((t) => `
          <button type="button" class="tool${t.id === "torch" && torch.on ? " on" : ""}" data-action="tool" data-tool="${t.id}">
            <span class="tool-icon">${svg(t.icon)}</span><span>${t.label}</span></button>`).join("")}</div>
      </section>
      <p class="version-line">Mi Panel · versión del ${BUILD}${NATIVE ? ` · app Android ${esc(NATIVE.appVersion())}` : ""}</p>
    </div>`;
  autoPing();
  maybeRefreshWeather();
}

function updateHome() {
  const box = state.tab === "inicio" && $("#tiles");
  if (box) box.innerHTML = homeTiles();
}

function tile({ id, action, go, color, icon, label, value, sub, wide = false, visual = "", valueColor = "" }) {
  return `<button type="button" class="tile${wide ? " wide" : ""}" id="tile-${id}" data-action="${action}"${go ? ` data-go="${go}"` : ""} style="--tile:${color}">
    <span class="tile-head">${svg(icon)}<span>${label}</span></span>
    <span class="tile-main">${visual}<span class="tile-value${longValue(value) ? " long" : ""}"${valueColor ? ` style="color:${valueColor}"` : ""}>${value}</span></span>
    <span class="tile-sub">${sub}</span></button>`;
}

/** Textos largos (el nombre de una asignatura) van un poco más pequeños para que quepan. */
const longValue = (html) => html.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/g, "x").length > 9;

function homeTiles() {
  const day = today();
  const out = [];

  // Mensajes y llamadas perdidas (ancha, la primera)
  if (!ARTIFACT) out.push(messagesTile());

  // Batería
  const bi = batteryInfo();
  if (bi) {
    const color = bi.charging || bi.full ? "var(--good)" : batteryColor(bi.pct);
    const sub = bi.full ? "Carga completa"
      : bi.est != null ? (bi.charging ? `100 % en ≈ ${L.fmtDuration(bi.est)}` : `Te queda ≈ ${L.fmtDuration(bi.est)}`)
      : bi.charging ? "Cargando" : "Calculando lo que dura…";
    out.push(tile({ id: "battery", action: "device", color, icon: bi.charging ? "bolt" : "battery", label: "Batería",
      value: `${bi.pct}<small>%</small>`, sub, visual: `<span class="tile-ring">${ring(bi.pct, `--c1:${color}`)}</span>` }));
  } else {
    out.push(tile({ id: "battery", action: "device", color: "var(--muted)", icon: "battery", label: "Batería", value: "—",
      sub: status.batteryBlocked || !navigator.getBattery ? "Ábrela con Chrome" : "Leyendo…" }));
  }

  // Cascos (solo en la app Android y si hay unos conectados)
  if (NATIVE) {
    const hp = nativeHeadphones().devices?.find((d) => d.battery != null);
    if (hp) {
      out.push(tile({ id: "headphones", action: "device", color: batteryColor(hp.battery), icon: "headphones", label: "Cascos",
        value: `${hp.battery}<small>%</small>`, sub: esc(hp.name), visual: `<span class="tile-ring">${ring(hp.battery, `--c1:${batteryColor(hp.battery)}`)}</span>` }));
    }
  }

  // El tiempo (no en claude.ai)
  if (!ARTIFACT) {
    const w = weather.data;
    if (w) {
      const info = L.weatherInfo(w.code, w.isDay);
      out.push(tile({ id: "weather", action: "device", color: "var(--cyan)", icon: "sun", label: "El tiempo",
        value: `${Math.round(w.temp)}<small>°</small>`, sub: `${info.label}${w.today.rain ? ` · lluvia ${w.today.rain} %` : ""}`,
        visual: `<span class="tile-emoji">${info.icon}</span>` }));
    } else {
      out.push(tile({ id: "weather", action: "weather", color: "var(--cyan)", icon: "sun", label: "El tiempo",
        value: weather.state === "loading" ? "…" : "—", sub: weather.state === "loading" ? "Buscando…" : "Toca para verlo" }));
    }
  }

  // Conexión
  const n = connectionInfo();
  const p = status.ping;
  const q = p?.ok ? pingQuality(p.ms) : null;
  const names = { wifi: "WiFi", mobile: "Datos móviles", ethernet: "Cable", unknown: "Internet", none: "Sin conexión" };
  const netColor = n.kind === "none" ? "var(--bad)" : q ? q.color : p ? "var(--warning)" : "var(--accent)";
  out.push(tile({ id: "net", action: "device", color: netColor, icon: "wifi", label: "Conexión", valueColor: netColor,
    value: n.kind === "none" ? "Sin red" : q ? q.label : p ? "Inestable" : "…",
    sub: n.kind === "none" ? "No hay internet" : p?.ok ? `${names[n.kind]} · ${p.ms} ms` : p ? "Internet no responde bien" : "Comprobando…" }));

  // Dinero
  const t = L.moneyTotals(state.money);
  const month = L.monthSummary(state.money.entries, L.monthOf(day));
  out.push(tile({ id: "money", action: "go", go: "dinero", color: "var(--lime)", icon: "wallet", label: "Dinero",
    value: state.money.entries.length ? moneyText(t.total) : "—",
    sub: state.money.entries.length ? `Este mes −${L.fmtMoney(month.spent, { short: true })}` : "Apunta lo que tienes" }));

  // Clase de ahora
  if (!state.schedule.length) {
    out.push(tile({ id: "class", action: "schedule", color: "var(--violet)", icon: "school", label: "Clase", value: "Horario", sub: "Toca para ponerlo" }));
  } else {
    const minute = nowMinute();
    const { current, next } = L.classStatus(state.schedule, L.isoWeekday(day), minute);
    let value = "Sin clase";
    let sub = "";
    if (current) {
      value = esc(current.subject);
      sub = `Ahora · quedan ${fmtMinutes(L.toMinutes(current.end) - minute)}`;
    } else if (next) {
      value = esc(next.subject);
      sub = `A las ${L.fmtHour(next.start)}`;
    } else {
      const after = L.nextSchoolDay(state.schedule, L.isoWeekday(day));
      sub = after ? `${after.offset === 1 ? "Mañana" : capitalize(L.WEEKDAYS[after.day - 1])} a las ${L.fmtHour(after.first.start)}` : "";
    }
    out.push(tile({ id: "class", action: "go", go: "tareas", color: "var(--violet)", icon: "school", label: current ? "Ahora en clase" : "Clase", value, sub }));
  }

  // Estudio de hoy
  const pending = L.pendingSorted(state.tasks);
  const ov = L.dayOverview(state.tasks, day);
  const exam = L.upcomingExams(state.tasks, day)[0];
  out.push(tile({ id: "study", action: "go", go: "tareas", color: "var(--pink)", icon: "book", label: "Estudio hoy",
    value: ov.goalToday ? `${ov.pagesToday}<small>/${ov.goalToday} págs</small>` : pending.length ? `${pending.length}<small> ${pending.length === 1 ? "tarea" : "tareas"}</small>` : "Libre",
    sub: exam ? `Examen ${L.relativeDay(L.daysBetween(day, exam.examDate))}` : pending.length ? "pendientes" : "Sin tareas pendientes" }));

  // Foco
  const focusToday = state.focus[day] || 0;
  const streak = L.studyStreak(state.tasks, day, state.focus);
  out.push(tile({ id: "focus", action: "go", go: "foco", color: "var(--mint)", icon: "timer", label: timer.running ? "Foco en marcha" : "Foco",
    value: timer.running ? fmtClock(timeLeft()) : fmtMinutes(focusToday),
    sub: timer.running ? (timer.phase === "work" ? "Concentración" : "Descanso") : streak ? `🔥 ${streak} ${streak === 1 ? "día" : "días"} seguidos` : "hoy" }));

  // Notas
  const subjects = L.bySubject(state.grades);
  const avg = L.overallAverage(subjects);
  out.push(tile({ id: "grades", action: "go", go: "notas", color: "var(--amber)", icon: "chart", label: "Media",
    value: avg == null ? "—" : L.fmtGrade(avg), sub: avg == null ? "Apunta tus notas" : L.gradeLabel(avg) }));

  // Próxima fecha (ancha)
  const nextEvent = L.upcomingEvents(state.events, day)[0];
  out.push(tile({ id: "events", action: "events", color: "var(--coral)", icon: "cake", label: "Cuenta atrás", wide: true,
    value: nextEvent ? `${nextEvent.event.emoji || "📅"} ${esc(nextEvent.event.name)}` : "Cumpleaños y fechas",
    sub: nextEvent ? `${L.countdownLabel(nextEvent.days)}${nextEvent.turns ? ` · cumple ${nextEvent.turns}` : ""} · ${L.fmtDateShort(nextEvent.date)}` : "Toca para añadir cumpleaños, viajes, conciertos…" }));
  return out.join("");
}

/** "67,50 €" con los céntimos más pequeños (para números grandes). */
function moneyText(cents) {
  const [int, dec] = L.fmtMoney(cents).replace(" €", "").split(",");
  return `${int}<small>,${dec} €</small>`;
}

// ================================================================ Mensajes y llamadas perdidas (app Android)

const SEEN_KEY = "mipanel:mensajes-vistos";
const APP_COLORS = {
  WhatsApp: "#25d366", "WhatsApp Business": "#25d366", Discord: "#7983f5", Telegram: "#2aabee",
  Instagram: "#f05a8c", Snapchat: "#fffc00", Mensajes: "#6aa3ff", "Teléfono": "var(--bad)",
};
const appColor = (app) => APP_COLORS[app] || "var(--accent)";

function nativeMessages() {
  try {
    return JSON.parse(NATIVE.messages() || "[]");
  } catch {
    return [];
  }
}

function messagesTile() {
  const base = { id: "messages", action: "messages", color: "#25d366", icon: "chat", label: "Mensajes", wide: true };
  if (!NATIVE) return tile({ ...base, value: "WhatsApp y llamadas", sub: "Con la app Android de Mi Panel · toca para verla" });
  if (!NATIVE.hasMessageAccess()) return tile({ ...base, value: "Activa tus mensajes", sub: "WhatsApp, Discord y llamadas perdidas aquí" });
  const g = L.groupMessages(nativeMessages(), storage.get(SEEN_KEY, 0));
  const last = [...g.calls.slice(0, 1), ...g.chats.slice(0, 1).map((c) => c.last)].sort((a, b) => b.time - a.time)[0];
  if (!last) return tile({ ...base, value: "Sin mensajes nuevos", sub: "Aquí salen al momento" });
  const what = last.kind === "llamada" ? `📞 Llamada perdida de ${esc(last.chat)}` : `${esc(last.sender === last.chat ? last.chat : `${last.sender} · ${last.chat}`)}: ${esc(last.text)}`;
  return tile({ ...base, label: g.unread ? `Mensajes · ${g.unread} ${g.unread === 1 ? "nuevo" : "nuevos"}` : "Mensajes",
    value: `<span class="msg-preview">${what}</span>`, sub: `${esc(last.app)} · ${L.relativeTime(last.time)}` });
}

function openMessagesSheet() {
  const root = overlay(`
    <div class="sheet live-actions" role="dialog" aria-modal="true" aria-labelledby="ms-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="ms-title">Mensajes</h2>
        ${NATIVE ? `<button class="icon-btn ghost" id="ms-clear" aria-label="Borrar todos">${svg("trash")}</button>` : ""}
      </div>
      <div class="sheet-body" id="ms-body"></div>
    </div>`);
  const body = $("#ms-body", root);
  const seenBefore = storage.get(SEEN_KEY, 0);
  const draw = () => {
    if (!root.isConnected) return;
    if (!NATIVE) {
      body.innerHTML = `
        <p class="hint">Una web (aunque esté instalada) no puede leer los avisos de otras apps: Android no lo deja. Para ver aquí tus mensajes de WhatsApp, Discord… y las llamadas perdidas, instala la <b>app Android de Mi Panel</b>. Es la misma Mi Panel, con esto añadido.</p>
        <ol class="steps">
          <li>Tu padre o tu madre tiene que permitir <b>apps de fuentes desconocidas</b> en tu móvil desde su app <b>Family Link</b>.</li>
          <li>Descarga la app y ábrela para instalarla.</li>
          <li>Ábrela, entra en <b>Mensajes</b> y toca <b>Dar acceso</b>.</li>
        </ol>
        <a class="btn block mt16" href="${APK_URL}" target="_blank" rel="noopener">${svg("add")}Descargar la app Android</a>
        <p class="small mt12">Tus datos de esta app no pasan solos a la otra: guarda una copia (⋮ → Copia de seguridad) y recupérala allí.</p>`;
      return;
    }
    if (!NATIVE.hasMessageAccess()) {
      body.innerHTML = `
        <div class="empty small-empty"><div class="glow-icon">${svg("chat")}</div><h2>Tus mensajes, aquí</h2>
          <p class="hint">Dale permiso a Mi Panel para leer tus avisos y verás aquí los mensajes de WhatsApp, Discord, Telegram, Instagram… y las llamadas perdidas.</p></div>
        <button class="btn block" data-action="msg-access">Dar acceso</button>
        <ol class="steps">
          <li>Se abren los ajustes: activa <b>Mi Panel</b> y acepta.</li>
          <li>Si sale <b>«Ajuste restringido»</b>: toca <b>Abrir ajustes de la app</b> aquí abajo → ⋮ (arriba a la derecha) → <b>Permitir ajustes restringidos</b>, y vuelve a darle acceso.</li>
        </ol>
        <button class="btn glass block mt12" data-action="app-settings">Abrir ajustes de la app</button>
        <p class="small mt12">Los mensajes se guardan solo en tu móvil (los 300 últimos) y no se mandan a ningún sitio.</p>`;
      return;
    }
    const g = L.groupMessages(nativeMessages(), seenBefore);
    if (!g.calls.length && !g.chats.length) {
      body.innerHTML = `<div class="empty small-empty"><div class="glow-icon">${svg("chat")}</div><h2>Aún no hay mensajes</h2>
        <p class="hint">En cuanto te llegue un WhatsApp, un mensaje de Discord o una llamada perdida, sale aquí.</p></div>`;
      return;
    }
    let html = "";
    const calls = g.calls.slice(0, 10);
    if (calls.length) {
      html += `<p class="day-label">Llamadas perdidas</p>${calls.map((c) => `
        <button type="button" class="msg-row call${c.time > seenBefore ? " new" : ""}" data-msg="${esc(c.id)}">
          <span class="msg-icon" style="--app:var(--bad)">${svg("phone")}</span>
          <span class="grow"><span class="strong">${esc(c.chat)}</span><span class="small">${esc(c.app === "Teléfono" ? c.text : `${c.app} · ${c.text}`)}</span></span>
          <span class="msg-time">${L.relativeTime(c.time)}</span>
        </button>`).join("")}`;
    }
    if (g.chats.length) {
      html += `<p class="day-label">Chats</p>${g.chats.slice(0, 40).map((c) => `
        <button type="button" class="chat-card${c.unread ? " new" : ""}" data-msg="${esc(c.last.id)}" style="--app:${appColor(c.app)}">
          <span class="chat-head"><span class="app-dot"></span><span class="strong grow">${esc(c.chat)}</span>
            ${c.unread ? `<span class="pill" style="--pill:var(--app)">${c.unread}</span>` : ""}<span class="msg-time">${L.relativeTime(c.last.time)}</span></span>
          ${c.items.slice(0, 3).reverse().map((m) => `<span class="chat-line"><b>${esc(m.sender === c.chat ? "" : `${m.sender}: `)}</b>${esc(m.text)}</span>`).join("")}
          <span class="small">${esc(c.app)} · toca para contestar</span>
        </button>`).join("")}`;
    }
    body.innerHTML = html;
  };
  body.addEventListener("click", (e) => {
    const m = e.target.closest("[data-msg]");
    if (m && !NATIVE.openMessage(m.dataset.msg)) toast("No se ha podido abrir la app");
  });
  $("#ms-clear", root)?.addEventListener("click", async () => {
    if (await confirmDialog("¿Borrar todos los mensajes?", "Se borran de Mi Panel (no de WhatsApp ni de las otras apps).", "Borrar")) {
      NATIVE.clearMessages();
      draw();
      updateHome();
    }
  });
  const live = () => draw();
  addEventListener("mipanel-mensajes", live);
  onClosed(root, () => {
    removeEventListener("mipanel-mensajes", live);
    storage.set(SEEN_KEY, Date.now());
    updateHome();
  });
  draw();
}

// ================================================================ Mi móvil (detalle: batería, tiempo, cascos, conexión…)

function openDeviceSheet(focus = "") {
  const root = overlay(`
    <div class="sheet live-actions" role="dialog" aria-modal="true" aria-labelledby="dev-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="dev-title">Mi móvil</h2>
      </div>
      <div class="sheet-body stack still">
      <section class="card">${cardHead("battery", "Batería")}<div id="battery-body"></div></section>
      ${ARTIFACT ? "" : `<section class="card">${cardHead("sun", "El tiempo")}<div id="weather-body"></div></section>`}
      <section class="card">${cardHead("headphones", "Cascos")}<div id="bt-body"></div></section>
      <section class="card" id="net-card">${cardHead("wifi", "Conexión")}<div id="net-body"></div>
        <hr class="divider">
        <div class="row" style="margin-bottom:12px">${svg("speed").replace("<svg", '<svg style="width:22px;height:22px;fill:var(--accent)"')}<span class="strong">Test de velocidad</span></div>
        <div id="speed-body"></div>
      </section>
      <section class="card">${cardHead("phone", "Este móvil")}<div id="device-body"></div></section>
      </div>
    </div>`);
  updateBattery();
  updateWeather();
  updateBt();
  updateNetwork();
  updateSpeed();
  updateDevice();
  autoPing();
  maybeRefreshWeather();
  if (focus) $(`#${focus}`, root)?.closest(".card")?.scrollIntoView({ block: "start" });
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

// ================================================================ Pantalla Dinero

const monthName = (iso) => new Intl.DateTimeFormat("es-ES", { month: "long" }).format(L.isoToDate(iso));
let showAllMoney = false;
let selectedMoneyDay = null;

/** "67,50 €" grande: los euros en claro y ",50 €" en el color de la sección. */
function moneyHero(cents) {
  const [int, dec] = L.fmtMoney(cents).replace(" €", "").split(",");
  return `${int}<span class="dec">,${dec}</span><span class="cur">€</span>`;
}

function renderMoney() {
  const header = topbar("Dinero", `<button class="icon-btn" data-action="money-menu" aria-label="Más opciones">${svg("more")}</button>`);
  if (state.loading) {
    $("#view").innerHTML = `${header}<p class="loading">Cargando…</p>`;
    return;
  }
  const fab = `<button class="fab" data-action="new-money" aria-label="Apuntar un gasto o un ingreso">${svg("add")}Apuntar</button>`;
  const m = state.money;
  if (!m.entries.length && !m.goals.length) {
    $("#view").innerHTML = `${header}<div class="empty"><div class="glow-icon">${svg("wallet")}</div><h2>Controla tu dinero</h2>
      <p class="hint">Empieza apuntando cuánto tienes ahora. Luego ve apuntando lo que gastas y lo que te dan: verás en qué se te va y cuánto te queda.</p>
      <button class="btn mt16" data-action="money-start">¿Cuánto tienes ahora?</button>
      <button class="btn outline mt12" data-action="revolut">Meter un extracto de Revolut</button></div>${fab}`;
    return;
  }
  const day = today();
  const t = L.moneyTotals(m);
  const month = L.monthSummary(m.entries, L.monthOf(day));
  let html = `${header}<div class="${stackClass()}">`;

  // Lo que tienes, este mes y el límite
  let budget = `<button type="button" class="btn text slim mt12" data-action="budget">${svg("add")}Ponerte un límite de gasto al mes</button>`;
  if (m.budget) {
    const pct = (month.spent / m.budget) * 100;
    const left = m.budget - month.spent;
    const color = pct >= 100 ? "var(--bad)" : pct >= 80 ? "var(--warning)" : "var(--good)";
    budget = `<div class="mt16"><div class="row"><span class="strong grow">Límite de ${monthName(day)}: ${L.fmtMoney(m.budget, { short: true })}</span>
        <button type="button" class="btn text slim" data-action="budget">Cambiar</button></div>
      ${meter(pct, { color, cls: "mt8" })}
      <p class="small mt8" style="margin:8px 0 0;${left < 0 ? "color:var(--bad)" : ""}">${left >= 0 ? `Te quedan ${L.fmtMoney(left)} para lo que queda de mes` : `Te has pasado ${L.fmtMoney(-left)}`}</p></div>`;
  }
  const rv = m.revolut;
  html += `<section class="card">
      <p class="eyebrow">Tienes</p>
      <div class="avg mt8"><span class="hero${t.total < 0 ? " neg" : ""}">${moneyHero(t.total)}</span></div>
      ${t.saved ? `<p class="hint mt8">${L.fmtMoney(t.available)} libres · ${L.fmtMoney(t.saved)} en huchas</p>` : ""}
      ${rv ? `<p class="small mt8">En Revolut: <b>${L.fmtMoney(rv.balance)}</b> según el extracto del ${L.fmtDateShort(rv.date)}</p>` : ""}
      <div class="stats2">
        <div class="stat"><span>Gastado en ${monthName(day)}</span><b>${L.fmtMoney(month.spent)}</b><em>${month.byCat[0] ? `Sobre todo en ${month.byCat[0].cat.label.toLowerCase()}` : "nada aún"}</em></div>
        <div class="stat"><span>Te ha entrado</span><b>${L.fmtMoney(month.income)}</b><em>este mes</em></div>
      </div>
      ${budget}
    </section>`;

  // En qué se te va
  if (month.byCat.length) {
    html += `<section class="card">${cardHead("chart", `En qué gastas en ${monthName(day)}`)}<div class="${chartClass()}" id="money-cats"></div></section>`;
  }

  // Últimos 7 días
  const days = L.spendByDay(m.entries, 7, day);
  const sel = days.find((d) => d.date === selectedMoneyDay);
  html += `<section class="card">${cardHead("trend", "Lo que gastas cada día")}
      <div class="${chartClass()}" id="money-days"></div>
      <p class="chart-detail">${sel ? `<b>${L.fmtDateShort(sel.date)}</b>: ${sel.value ? `gastaste ${L.fmtMoney(sel.value)}` : "no gastaste nada"}` : `Esta semana: <b>${L.fmtMoney(days.reduce((s, d) => s + d.value, 0))}</b>. Toca un día para verlo.`}</p>
    </section>`;

  // Huchas
  html += `<section class="card">${cardHead("piggy", "Huchas", `<button type="button" class="btn text slim" data-action="new-goal">Nueva</button>`)}
      ${m.goals.length ? `<div class="goals">${m.goals.map(goalRow).join("")}</div>`
        : `<p class="hint">Ahorra para algo que quieras (unos cascos, un viaje…): mete dinero poco a poco y verás cuánto te falta.</p>`}
    </section>`;

  // Movimientos
  const groups = L.entriesByDay(m.entries);
  let shown = 0;
  let list = "";
  for (const g of groups) {
    if (!showAllMoney && shown >= 25) break;
    list += `<p class="day-label">${dayLabel(g.date)}</p>${g.items.map(entryRow).join("")}`;
    shown += g.items.length;
  }
  html += `<section class="card">${cardHead("wallet", "Movimientos", `<span class="pill" style="--pill:var(--muted)">${m.entries.length}</span>`)}
      ${list || `<p class="hint">Aún no has apuntado nada.</p>`}
      ${!showAllMoney && shown < m.entries.length ? `<button type="button" class="btn text block" data-action="money-more">Ver todos</button>` : ""}
    </section>`;
  html += `</div>${fab}`;
  $("#view").innerHTML = html;

  const cats = $("#money-cats");
  if (cats) {
    cats.innerHTML = C.hbars(month.byCat.map((x) => ({ label: `${x.cat.icon} ${x.cat.label}`, value: x.amount })), {
      width: Math.max(260, cats.clientWidth || 320),
      fmt: (v) => L.fmtMoney(v, { short: true }),
      label: "Gastos por categoría: ",
    });
  }
  const box = $("#money-days");
  box.innerHTML = C.dayColumns(days, {
    width: Math.max(260, box.clientWidth || 320),
    unit: "",
    selected: selectedMoneyDay,
    hitAttr: "data-moneyday",
    fmt: (v) => L.fmtMoney(v, { short: true }),
  });
}

function dayLabel(iso) {
  const d = L.daysBetween(today(), iso);
  return d === 0 || d === -1 ? capitalize(L.relativeDay(d)) : capitalize(L.fmtDateShort(iso));
}

function entryRow(e, interactive = true) {
  const cat = L.moneyCat(e.type, e.category);
  const income = e.type === "ingreso";
  const tag = interactive ? "button" : "div";
  return `<${tag}${interactive ? ' type="button"' : ""} class="entry" ${interactive ? `data-action="edit-money" data-id="${e.id}"` : ""}>
      <span class="entry-icon" aria-hidden="true">${cat.icon}</span>
      <span class="grow"><span class="strong">${esc(e.note || cat.label)}</span>${e.note ? `<span class="small">${cat.label}${e.importId ? " · Revolut" : ""}</span>` : ""}</span>
      <span class="entry-amount${income ? " in" : ""}">${L.fmtMoney(income ? e.amount : -e.amount, { sign: true })}</span>
    </${tag}>`;
}

function goalRow(g) {
  const pct = g.target ? Math.min(100, (g.saved / g.target) * 100) : 0;
  const done = g.saved >= g.target;
  return `<div class="goal${done ? " done" : ""}">
      <div class="ring-wrap sm">${ring(pct, done ? "--c1:var(--good)" : "")}<div class="center goal-emoji">${esc(g.emoji || "🎯")}</div></div>
      <div class="grow">
        <div class="row"><span class="strong grow">${esc(g.name)}</span>
          <button type="button" class="icon-btn ghost small-icon" data-action="edit-goal" data-id="${g.id}" aria-label="Editar hucha">${svg("more")}</button></div>
        <div class="small">${L.fmtMoney(g.saved)} de ${L.fmtMoney(g.target)}${done ? " · ¡Conseguido!" : ` · faltan ${L.fmtMoney(g.target - g.saved)}`}</div>
        <div class="goal-actions">
          <button type="button" class="btn tonal slim" data-action="goal-money" data-id="${g.id}">Meter o sacar</button>
          ${done ? `<button type="button" class="btn slim" data-action="goal-bought" data-id="${g.id}">Ya lo he comprado</button>` : ""}
        </div>
      </div>
    </div>`;
}

/** Sólo cifras y una coma: "12,50". */
function amountInput(el) {
  el.addEventListener("input", () => {
    let v = el.value.replace(/[^\d.,]/g, "").replace(".", ",");
    const i = v.indexOf(",");
    if (i >= 0) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/,/g, "").slice(0, 2);
    el.value = v.slice(0, 9);
  });
}
const centsToInput = (c) => (c / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

function openMoneyEditor(entry, preset = {}) {
  let type = entry?.type || preset.type || "gasto";
  let category = entry?.category || preset.category || (type === "ingreso" ? "paga" : "comida");
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="mo-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="mo-title">${entry ? "Editar movimiento" : "Apuntar"}</h2>
        <button class="btn" type="submit" form="money-form" id="save">Guardar</button>
      </div>
      <form id="money-form" novalidate>
        <div class="segmented money-type">
          <button type="button" data-type="gasto">Gasto</button><button type="button" data-type="ingreso">Ingreso</button>
        </div>
        <label class="amount-field"><span class="sr-only">Importe</span>
          <input name="amount" inputmode="decimal" placeholder="0" autocomplete="off" value="${entry ? centsToInput(entry.amount) : ""}"><b>€</b></label>
        <p class="field-label">Categoría</p>
        <div class="cat-grid" id="cats"></div>
        <label class="field"><span>Concepto (opcional)</span>
          <input name="note" maxlength="60" placeholder="Ej.: Bocadillo, entradas del cine…" value="${esc(entry?.note ?? preset.note ?? "")}" autocomplete="off"></label>
        <label class="field"><span>Fecha</span><input name="date" type="date" value="${entry?.date || today()}"></label>
        ${entry ? `<button type="button" class="btn danger block" id="del">Borrar este movimiento</button>` : ""}
      </form>
    </div>`);
  const form = $("#money-form", root);
  const f = form.elements;
  amountInput(f.amount);
  const draw = () => {
    root.querySelectorAll("[data-type]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.type === type));
    const cats = type === "ingreso" ? L.INCOME_CATS : L.EXPENSE_CATS;
    if (!cats.some((c) => c.id === category)) category = cats[0].id;
    $("#cats", root).innerHTML = cats.map((c) => `<button type="button" data-cat="${c.id}" aria-pressed="${c.id === category}"><span>${c.icon}</span>${c.label}</button>`).join("");
    $("#save", root).disabled = L.parseAmount(f.amount.value) == null || !f.date.value;
    form.classList.toggle("is-income", type === "ingreso");
  };
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-type]");
    const c = e.target.closest("[data-cat]");
    if (t) type = t.dataset.type;
    if (c) category = c.dataset.cat;
    if (t || c) draw();
  });
  f.amount.addEventListener("input", draw);
  f.date.addEventListener("input", draw);
  draw();
  if (!entry) f.amount.focus();
  $("#del", root)?.addEventListener("click", () => {
    closeOverlay(root);
    state.money = { ...state.money, entries: state.money.entries.filter((x) => x.id !== entry.id) };
    saveData();
    render();
    toast("Movimiento borrado", "Deshacer", () => {
      state.money = { ...state.money, entries: [...state.money.entries, entry] };
      saveData();
      render();
    }, 6000);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#save", root).disabled) return;
    const values = { type, amount: L.parseAmount(f.amount.value), category, note: f.note.value.trim(), date: f.date.value };
    closeOverlay(root);
    const entries = entry
      ? state.money.entries.map((x) => (x.id === entry.id ? { ...x, ...values } : x))
      : [...state.money.entries, { id: uid(), createdAt: Date.now(), ...values }];
    state.money = { ...state.money, entries };
    animateNext = !entry;
    saveData();
    render();
    if (!entry) toast(`${values.type === "ingreso" ? "Ingreso" : "Gasto"} apuntado: ${L.fmtMoney(values.amount)}`);
  });
}

const GOAL_EMOJIS = ["🎧", "📱", "👟", "🎮", "💻", "✈️", "🎁", "🛹", "🎸", "🎟️"];

function openGoalEditor(goal) {
  let emoji = goal?.emoji || GOAL_EMOJIS[0];
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="go-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="go-title">${goal ? "Editar hucha" : "Nueva hucha"}</h2>
        <button class="btn" type="submit" form="goal-form" id="save">Guardar</button>
      </div>
      <form id="goal-form" novalidate>
        <label class="field"><span>¿Para qué ahorras?</span>
          <input name="name" maxlength="40" placeholder="Ej.: Cascos nuevos" value="${esc(goal?.name || "")}" autocomplete="off"></label>
        <div class="emoji-row" id="emojis"></div>
        <label class="field"><span>¿Cuánto cuesta?</span>
          <input name="target" inputmode="decimal" placeholder="Ej.: 60" value="${goal ? centsToInput(goal.target) : ""}" autocomplete="off"></label>
        ${goal ? `<button type="button" class="btn danger block" id="del">Borrar la hucha</button>
          <p class="small mt8">Si la borras, lo que tenías metido vuelve a contar como dinero libre.</p>` : ""}
      </form>
    </div>`);
  const form = $("#goal-form", root);
  const f = form.elements;
  amountInput(f.target);
  const draw = () => {
    $("#emojis", root).innerHTML = GOAL_EMOJIS.map((x) => `<button type="button" data-emoji="${x}" aria-pressed="${x === emoji}">${x}</button>`).join("");
    $("#save", root).disabled = !f.name.value.trim() || L.parseAmount(f.target.value) == null;
  };
  $("#emojis", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-emoji]");
    if (!b) return;
    emoji = b.dataset.emoji;
    draw();
  });
  f.name.addEventListener("input", draw);
  f.target.addEventListener("input", draw);
  draw();
  if (!goal) f.name.focus();
  $("#del", root)?.addEventListener("click", () => {
    closeOverlay(root);
    state.money = { ...state.money, goals: state.money.goals.filter((x) => x.id !== goal.id) };
    saveData();
    render();
    toast("Hucha borrada", "Deshacer", () => {
      state.money = { ...state.money, goals: [...state.money.goals, goal] };
      saveData();
      render();
    }, 6000);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#save", root).disabled) return;
    const values = { name: f.name.value.trim(), emoji, target: L.parseAmount(f.target.value) };
    closeOverlay(root);
    const goals = goal
      ? state.money.goals.map((x) => (x.id === goal.id ? { ...x, ...values } : x))
      : [...state.money.goals, { id: uid(), createdAt: Date.now(), saved: 0, ...values }];
    state.money = { ...state.money, goals };
    saveData();
    render();
  });
}

function openGoalMoneyDialog(goal) {
  const free = L.moneyTotals(state.money).available;
  const root = overlay(`
    <div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="gm-title">
      <h2 id="gm-title">${esc(goal.emoji || "🎯")} ${esc(goal.name)}</h2>
      <p style="margin-top:0">Llevas <b>${L.fmtMoney(goal.saved)}</b> de ${L.fmtMoney(goal.target)}. Tienes libre <b>${L.fmtMoney(free)}</b>.</p>
      <label class="amount-field small-amount"><span class="sr-only">Cantidad</span><input id="gm-amount" inputmode="decimal" placeholder="0" autocomplete="off"><b>€</b></label>
      <div class="quick" style="grid-template-columns:repeat(4,1fr)">${[1, 5, 10, 20].map((n) => `<button type="button" data-n="${n}">${n} €</button>`).join("")}</div>
      <p class="small" id="gm-help" style="min-height:1.4em;margin:10px 0 0"></p>
      <div class="actions"><button class="btn text" id="gm-out">Sacar</button><button class="btn" id="gm-in">Meter</button></div>
    </div></div>`);
  const input = $("#gm-amount", root);
  amountInput(input);
  const refresh = () => {
    const v = L.parseAmount(input.value);
    $("#gm-in", root).disabled = v == null;
    $("#gm-out", root).disabled = v == null || v > goal.saved;
    $("#gm-help", root).textContent = v != null && v > free ? "Ojo: es más de lo que tienes libre." : v != null && v > goal.saved ? "" : "";
  };
  root.querySelectorAll("[data-n]").forEach((b) => b.addEventListener("click", () => {
    input.value = b.dataset.n;
    refresh();
  }));
  input.addEventListener("input", refresh);
  refresh();
  input.focus();
  const apply = (delta) => {
    closeOverlay(root);
    state.money = { ...state.money, goals: state.money.goals.map((x) => (x.id === goal.id ? { ...x, saved: Math.max(0, x.saved + delta) } : x)) };
    saveData();
    render();
    const g = state.money.goals.find((x) => x.id === goal.id);
    if (delta > 0 && g.saved >= g.target && goal.saved < goal.target) {
      chime();
      navigator.vibrate?.([120, 80, 220]);
      toast(`🎉 ¡Ya tienes lo que cuesta ${g.name}!`);
    }
  };
  $("#gm-in", root).addEventListener("click", () => apply(L.parseAmount(input.value)));
  $("#gm-out", root).addEventListener("click", () => apply(-L.parseAmount(input.value)));
}

async function goalBought(goal) {
  if (!(await confirmDialog(`¿Ya tienes ${goal.name}?`, `Se apunta un gasto de ${L.fmtMoney(goal.saved)} y la hucha se cierra.`, "Sí, lo he comprado"))) return;
  state.money = {
    ...state.money,
    goals: state.money.goals.filter((x) => x.id !== goal.id),
    entries: [...state.money.entries, { id: uid(), createdAt: Date.now(), type: "gasto", amount: goal.saved, category: "otros", note: `${goal.emoji || ""} ${goal.name}`.trim(), date: today() }],
  };
  saveData();
  render();
  toast(`¡A disfrutarlo! ${goal.emoji || ""}`);
}

function openBudgetDialog() {
  const root = overlay(`
    <div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="bu-title">
      <h2 id="bu-title">Límite de gasto al mes</h2>
      <p style="margin-top:0">Pon cuánto quieres gastar como mucho cada mes y te aviso de cuánto te queda.</p>
      <label class="amount-field small-amount"><span class="sr-only">Límite</span><input id="bu-amount" inputmode="decimal" placeholder="0" autocomplete="off" value="${state.money.budget ? centsToInput(state.money.budget) : ""}"><b>€</b></label>
      <div class="actions">${state.money.budget ? `<button class="btn text" id="bu-off">Quitar límite</button>` : ""}<button class="btn text" data-close>Cancelar</button><button class="btn" id="bu-ok">Guardar</button></div>
    </div></div>`);
  const input = $("#bu-amount", root);
  amountInput(input);
  const refresh = () => ($("#bu-ok", root).disabled = L.parseAmount(input.value) == null);
  input.addEventListener("input", refresh);
  refresh();
  input.focus();
  const set = (budget) => {
    closeOverlay(root);
    state.money = { ...state.money, budget };
    saveData();
    render();
  };
  $("#bu-ok", root).addEventListener("click", () => set(L.parseAmount(input.value)));
  $("#bu-off", root)?.addEventListener("click", () => set(null));
}

// ---------------------------------------------------------------- Extracto de Revolut

// Revolut no deja que otras apps lean una cuenta personal: se mete su extracto (Excel o CSV),
// eligiéndolo aquí o compartiéndolo desde Revolut con Mi Panel. El archivo se lee en el móvil.
function openRevolutImport(file = null) {
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="rv-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="rv-title">Extracto de Revolut</h2>
      </div>
      <div class="sheet-body" id="rv-body"></div>
    </div>`);
  const body = $("#rv-body", root);
  const intro = () => {
    body.innerHTML = `
      <p class="hint">Revolut no deja que otras apps entren en tu cuenta, pero si metes aquí su extracto se apuntan solos tus gastos e ingresos y ves el saldo que te queda.</p>
      <ol class="steps">
        <li>En <b>Revolut</b>, entra en tu cuenta en euros y busca <b>Extracto</b> (suele estar en «⋯» o en «Más»).</li>
        <li>Elige <b>Excel</b> o <b>CSV</b> y las fechas que quieras.</li>
        <li>Toca <b>Compartir</b> y elige <b>Mi Panel</b>. Si no sale, guárdalo y elígelo aquí abajo.</li>
      </ol>
      <button type="button" class="btn block mt16" id="rv-pick">${svg("add")}Elegir el archivo del extracto</button>
      <input type="file" id="rv-file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden>
      <p class="small mt12">Los menús de Revolut pueden cambiar un poco según la versión. El archivo no sale de tu móvil: se lee aquí mismo. Si lo vuelves a meter más adelante, solo se apuntan los movimientos nuevos.</p>`;
    $("#rv-pick", root).addEventListener("click", () => $("#rv-file", root).click());
    $("#rv-file", root).addEventListener("change", (e) => e.target.files[0] && read(e.target.files[0]));
  };
  const fail = (text) => {
    body.innerHTML = `<p class="hint">${text}</p><button type="button" class="btn block mt16" id="rv-again">Probar con otro archivo</button>`;
    $("#rv-again", root).addEventListener("click", intro);
  };
  const read = async (f) => {
    body.innerHTML = `<p class="hint">Leyendo el extracto…</p>`;
    let result;
    try {
      const rows = await readTable(f);
      const known = new Set(state.money.entries.map((e) => e.importId).filter(Boolean));
      result = L.revolutEntries(rows, known);
    } catch (e) {
      fail(e?.message === "columnas"
        ? "Ese archivo no parece un extracto de Revolut: no tiene las columnas de fecha, descripción e importe."
        : "No se ha podido leer ese archivo. Saca el extracto en Excel o en CSV (el PDF no sirve).");
      return;
    }
    preview(result);
  };
  const preview = (r) => {
    const sum = (type) => r.entries.filter((e) => e.type === type).reduce((s, e) => s + e.amount, 0);
    const firstTime = !state.money.entries.some((e) => e.importId);
    const opening = firstTime && r.opening && r.opening.amount > 0 ? r.opening : null;
    const notes = [];
    if (r.skipped.repeated) notes.push(`${r.skipped.repeated} ya los tenías`);
    if (r.skipped.notDone) notes.push(`${r.skipped.notDone} pendientes o cancelados`);
    if (r.skipped.otherCurrency) notes.push(`${r.skipped.otherCurrency} de huchas o en otra moneda`);
    const balance = r.balance ? `<p class="mt12">Saldo en Revolut: <b>${L.fmtMoney(r.balance.balance)}</b> (${L.fmtDateShort(r.balance.date)})</p>` : "";
    if (!r.entries.length) {
      body.innerHTML = `<p class="hint">No hay movimientos nuevos${r.skipped.repeated ? ": ya los habías metido todos" : ""}.</p>${balance}
        <button type="button" class="btn block mt16" id="rv-done">${r.balance ? "Actualizar el saldo" : "Vale"}</button>`;
      $("#rv-done", root).addEventListener("click", () => {
        closeOverlay(root);
        if (r.balance) {
          state.money = { ...state.money, revolut: newerBalance(r.balance) };
          saveData();
          render();
        }
      });
      return;
    }
    body.innerHTML = `
      <p class="eyebrow">En el extracto</p>
      <div class="mini-stats mt8">
        <div><b class="num">${r.entries.length}</b><span>movimientos nuevos</span></div>
        <div><b class="num">${L.fmtMoney(sum("gasto"), { short: true })}</b><span>gastado</span></div>
        <div><b class="num">${L.fmtMoney(sum("ingreso"), { short: true })}</b><span>ingresado</span></div>
      </div>
      ${balance}
      ${notes.length ? `<p class="small">No se apuntan: ${notes.join(", ")}.</p>` : ""}
      ${opening ? `<label class="check-row"><input type="checkbox" id="rv-opening" checked>
        <span>Apuntar también lo que tenías antes del extracto (<b>${L.fmtMoney(opening.amount)}</b>) para que el total cuadre con Revolut</span></label>` : ""}
      <p class="day-label">Los últimos</p>
      <div class="rv-list">${r.entries.slice(-6).reverse().map((e) => entryRow(e, false)).join("")}</div>
      <p class="small mt8">La categoría se adivina por el nombre de la tienda: puedes cambiarla luego tocando cada movimiento.</p>
      <button type="button" class="btn block mt16" id="rv-ok">Apuntar ${r.entries.length} ${r.entries.length === 1 ? "movimiento" : "movimientos"}</button>`;
    $("#rv-ok", root).addEventListener("click", () => {
      const extra = opening && $("#rv-opening", root)?.checked
        ? [{ id: uid(), createdAt: Date.now() - 1, type: "ingreso", amount: opening.amount, category: "otros", note: "Lo que tenía en Revolut", date: opening.date }]
        : [];
      closeOverlay(root);
      state.money = { ...state.money, entries: [...state.money.entries, ...extra, ...r.entries], revolut: newerBalance(r.balance) };
      animateNext = true;
      saveData();
      if (state.tab !== "dinero") setTab("dinero");
      else render();
      toast(`✓ Apuntados ${r.entries.length} movimientos de Revolut`);
    });
  };
  if (file) read(file);
  else intro();
}

/** El saldo de Revolut que vale es el del extracto más reciente (meter uno viejo no lo cambia). */
function newerBalance(balance) {
  const old = state.money.revolut;
  if (!balance) return old || null;
  return !old || balance.date >= old.date ? balance : old;
}

/** Si se ha compartido un extracto con Mi Panel (desde Revolut, Archivos…), lo abre. */
/** Extracto compartido con la app Android (Revolut → Compartir → Mi Panel). */
function takeNativeSharedFile() {
  const raw = NATIVE?.takeSharedFile();
  if (!raw) return;
  try {
    const f = JSON.parse(raw);
    const bin = atob(f.data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (state.tab !== "dinero") setTab("dinero");
    openRevolutImport(new Blob([bytes], { type: f.type || "application/octet-stream" }));
  } catch {
    toast("No se ha podido abrir el archivo compartido");
  }
}

async function takeSharedFile() {
  if (NATIVE) return takeNativeSharedFile();
  const params = new URLSearchParams(location.search);
  if (ARTIFACT || !params.has("importar")) return;
  params.delete("importar");
  history.replaceState(history.state, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
  try {
    const cache = await caches.open("mipanel-compartido");
    const res = await cache.match("compartido");
    if (!res) return;
    await cache.delete("compartido");
    const blob = await res.blob();
    if (state.tab !== "dinero") setTab("dinero");
    openRevolutImport(blob);
  } catch {
    toast("No se ha podido abrir el archivo compartido");
  }
}

// ================================================================ Herramientas

function openTool(id) {
  if (id === "torch") toggleTorch();
  else if (id === "qr") openScanner();
  else if (id === "stopwatch") openStopwatch();
  else if (id === "dice") openDice();
  else if (id === "speed") openDeviceSheet("speed-body");
}

function infoDialog(title, text) {
  overlay(`
    <div class="scrim"><div class="dialog" role="dialog" aria-modal="true">
      <h2>${esc(title)}</h2><p style="margin-top:0">${text}</p>
      <div class="actions"><button class="btn text" data-close>Vale</button></div>
    </div></div>`);
}

/** Llama a `fn` cuando la capa se cierre (con la X, el fondo o el botón atrás). */
function onClosed(root, fn) {
  const observer = new MutationObserver(() => {
    if (!root.isConnected) {
      observer.disconnect();
      fn();
    }
  });
  observer.observe($("#overlay-root"), { childList: true });
}

async function copyText(text, label = "Copiado") {
  try {
    await navigator.clipboard.writeText(text);
    toast(label);
  } catch {
    toast("No se ha podido copiar: mantén pulsado el texto para copiarlo");
  }
}

// ---------------------------------------------------------------- Linterna (flash de la cámara)

const torch = { on: false, stream: null };

async function toggleTorch() {
  if (torch.on) return stopTorch();
  if (NATIVE) {
    if (NATIVE.setTorch(true)) {
      torch.on = true;
      navigator.vibrate?.(30);
      updateToolButtons();
      toast("Linterna encendida: sigue aunque salgas de la app. Toca otra vez para apagarla.", null, null, 5000);
    } else {
      openScreenLight("Este móvil no deja encender el flash ahora (¿lo está usando la cámara?).");
    }
    return;
  }
  const fallback = (why) => openScreenLight(`${why} Mientras, la pantalla hace de luz.`);
  if (!navigator.mediaDevices?.getUserMedia) return fallback("Aquí no se puede usar el flash.");
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    const track = stream.getVideoTracks()[0];
    let caps = track.getCapabilities?.() || {};
    if (!caps.torch) {
      await new Promise((r) => setTimeout(r, 500)); // algunas cámaras tardan en decir que tienen flash
      caps = track.getCapabilities?.() || {};
    }
    if (!caps.torch) throw Object.assign(new Error("sin flash"), { name: "NoTorch" });
    await track.applyConstraints({ advanced: [{ torch: true }] });
  } catch (e) {
    stream?.getTracks().forEach((t) => t.stop());
    return fallback(e?.name === "NotAllowedError"
      ? "Sin permiso para la cámara no se puede encender el flash."
      : "Este navegador no deja encender el flash desde una app web.");
  }
  torch.on = true;
  torch.stream = stream;
  keepScreenOn(true);
  navigator.vibrate?.(30);
  updateToolButtons();
  toast("Linterna encendida: toca otra vez para apagarla. Se apaga si sales de la app.", null, null, 5000);
}

function stopTorch() {
  if (NATIVE) NATIVE.setTorch(false);
  torch.stream?.getTracks().forEach((t) => t.stop());
  torch.stream = null;
  torch.on = false;
  keepScreenOn(timer.running);
  updateToolButtons();
}

function updateToolButtons() {
  $('[data-tool="torch"]')?.classList.toggle("on", torch.on);
  $('[data-tool="stopwatch"]')?.classList.toggle("on", crono.running);
}

function openScreenLight(message) {
  // Un lienzo blanco (y no un fondo blanco): el modo oscuro de Samsung Internet no lo oscurece.
  const root = overlay(`
    <div class="screen-light" role="dialog" aria-label="Luz de pantalla" data-close>
      <canvas width="8" height="8"></canvas>
      <p class="light-note"><b>Toca para apagar</b>${esc(message)}</p>
    </div>`);
  const ctx = $("canvas", root).getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, 8, 8);
  keepScreenOn(true);
  onClosed(root, () => keepScreenOn(timer.running));
}

// ---------------------------------------------------------------- Escáner de QR

async function openScanner() {
  const formats = "BarcodeDetector" in window ? await window.BarcodeDetector.getSupportedFormats().catch(() => []) : [];
  if (!formats.includes("qr_code")) {
    infoDialog("Escanear QR", "Este navegador no sabe leer códigos QR. Con Chrome sí; y la cámara del móvil también los lee.");
    return;
  }
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="qr-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="qr-title">Escanear QR</h2>
      </div>
      <div class="sheet-body">
        <div class="viewfinder"><video playsinline muted></video><span class="frame"></span></div>
        <div id="qr-result" class="qr-result"><p class="hint">Apunta al código…</p></div>
      </div>
    </div>`);
  const video = $("video", root);
  const result = $("#qr-result", root);
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
  } catch (e) {
    result.innerHTML = `<p class="hint">${e?.name === "NotAllowedError" ? "Hace falta permiso para usar la cámara: dalo en los ajustes del navegador (Sitios → Cámara)." : "No se ha podido abrir la cámara."}</p>`;
    return;
  }
  const stop = () => stream.getTracks().forEach((t) => t.stop());
  if (!root.isConnected) return stop();
  onClosed(root, stop);
  video.srcObject = stream;
  await video.play().catch(() => {});
  const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
  let found = false;
  const show = (text) => {
    const wifi = L.parseWifiQr(text);
    const url = /^https?:\/\/\S+$/i.test(text) ? text : null;
    let html = "";
    if (wifi) {
      html = `<p class="eyebrow">Red WiFi</p><p class="strong big-text">${esc(wifi.ssid)}</p>
        ${wifi.password ? `<p>Contraseña: <span class="selectable mono">${esc(wifi.password)}</span></p>
        <button type="button" class="btn block mt12" data-copy="${esc(wifi.password)}">Copiar la contraseña</button>` : `<p class="hint">Red sin contraseña.</p>`}`;
    } else if (url) {
      html = `<p class="eyebrow">Enlace</p><p class="selectable break">${esc(url)}</p>
        <a class="btn block mt12" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Abrir el enlace</a>
        <button type="button" class="btn glass block mt8" data-copy="${esc(url)}">Copiar</button>`;
    } else {
      html = `<p class="eyebrow">Texto</p><p class="selectable break">${esc(text)}</p>
        <button type="button" class="btn block mt12" data-copy="${esc(text)}">Copiar</button>`;
    }
    result.innerHTML = `${html}<button type="button" class="btn text block mt8" id="qr-again">Escanear otro</button>`;
    $("#qr-again", root).addEventListener("click", () => {
      found = false;
      result.innerHTML = `<p class="hint">Apunta al código…</p>`;
    });
  };
  result.addEventListener("click", (e) => {
    const b = e.target.closest("[data-copy]");
    if (b) copyText(b.dataset.copy);
  });
  const loop = async () => {
    if (!root.isConnected) return;
    if (!found && video.readyState >= 2) {
      try {
        const [code] = await detector.detect(video);
        if (code?.rawValue && !found) {
          found = true;
          navigator.vibrate?.(60);
          show(code.rawValue);
        }
      } catch {
        // un fotograma que no se ha podido analizar: se prueba con el siguiente
      }
    }
    setTimeout(loop, 250);
  };
  loop();
}

// ---------------------------------------------------------------- Cronómetro

const CRONO_KEY = "mipanel:cronometro";
const crono = Object.assign({ running: false, startedAt: 0, base: 0, laps: [] }, storage.get(CRONO_KEY, {}));
const cronoNow = () => crono.base + (crono.running ? Date.now() - crono.startedAt : 0);
const pad2 = (n) => String(n).padStart(2, "0");
function fmtCrono(ms) {
  const h = Math.floor(ms / 3600000);
  const main = `${h ? `${h}:` : ""}${pad2(Math.floor(ms / 60000) % 60)}:${pad2(Math.floor(ms / 1000) % 60)}`;
  return `${main}<small>,${pad2(Math.floor(ms / 10) % 100)}</small>`;
}

function openStopwatch() {
  const root = overlay(`
    <div class="scrim"><div class="dialog crono" role="dialog" aria-modal="true" aria-labelledby="cr-title">
      <h2 id="cr-title">Cronómetro</h2>
      <div class="crono-time num" id="cr-time"></div>
      <div class="focus-controls" id="cr-controls"></div>
      <div class="laps" id="cr-laps"></div>
      <div class="actions"><button class="btn text" data-close>Cerrar</button></div>
    </div></div>`);
  const save = () => storage.set(CRONO_KEY, crono);
  const draw = () => {
    const t = cronoNow();
    $("#cr-controls", root).innerHTML = crono.running
      ? `<button class="icon-btn big" data-cr="lap" aria-label="Vuelta">${svg("flag")}</button>
         <button class="btn play" data-cr="pause">${svg("pause")}Pausar</button>`
      : t > 0
        ? `<button class="icon-btn big" data-cr="reset" aria-label="Poner a cero">${svg("reset")}</button>
           <button class="btn play" data-cr="start">${svg("play")}Seguir</button>`
        : `<button class="btn play" data-cr="start">${svg("play")}Empezar</button>`;
    const laps = crono.laps.map((total, i) => ({ n: i + 1, total, lap: total - (crono.laps[i - 1] || 0) })).reverse();
    $("#cr-laps", root).innerHTML = laps.map((l) => `<div class="lap"><span>Vuelta ${l.n}</span><b class="num">${fmtCrono(l.lap)}</b><span class="small num">${fmtCrono(l.total)}</span></div>`).join("");
    updateToolButtons();
  };
  $("#cr-controls", root).addEventListener("click", (e) => {
    const b = e.target.closest("[data-cr]");
    if (!b) return;
    const now = Date.now();
    if (b.dataset.cr === "start") Object.assign(crono, { running: true, startedAt: now });
    if (b.dataset.cr === "pause") Object.assign(crono, { running: false, base: crono.base + now - crono.startedAt });
    if (b.dataset.cr === "reset") Object.assign(crono, { running: false, base: 0, laps: [] });
    if (b.dataset.cr === "lap") crono.laps = [...crono.laps, cronoNow()].slice(-50);
    navigator.vibrate?.(20);
    save();
    draw();
  });
  const frame = () => {
    if (!root.isConnected) return;
    $("#cr-time", root).innerHTML = fmtCrono(cronoNow());
    requestAnimationFrame(frame);
  };
  draw();
  frame();
}

// ---------------------------------------------------------------- Dados y suerte

const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const die = (v) => `<span class="die" aria-label="${v}">${Array.from({ length: 9 }, (_, i) => `<i${PIPS[v].includes(i) ? ' class="on"' : ""}></i>`).join("")}</span>`;

function openDice() {
  let mode = "dados";
  let count = 2;
  const root = overlay(`
    <div class="scrim"><div class="dialog luck" role="dialog" aria-modal="true" aria-labelledby="dc-title">
      <h2 id="dc-title">Dados y suerte</h2>
      <div class="segmented luck-modes">${[["dados", "Dados"], ["moneda", "Moneda"], ["numero", "Número"], ["elegir", "Elegir"]]
        .map(([id, label]) => `<button type="button" data-mode="${id}">${label}</button>`).join("")}</div>
      <div id="dc-options"></div>
      <div class="luck-result" id="dc-result" aria-live="polite"></div>
      <button type="button" class="btn block mt12" id="dc-go">Tirar</button>
      <div class="actions"><button class="btn text" data-close>Cerrar</button></div>
    </div></div>`);
  const opts = $("#dc-options", root);
  const out = $("#dc-result", root);
  const draw = () => {
    root.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === mode));
    out.innerHTML = "";
    if (mode === "dados") {
      opts.innerHTML = `<div class="segmented counts">${[1, 2, 3].map((n) => `<button type="button" data-count="${n}" aria-pressed="${n === count}">${n} ${n === 1 ? "dado" : "dados"}</button>`).join("")}</div>`;
      out.innerHTML = `<div class="dice">${Array.from({ length: count }, () => die(6)).join("")}</div>`;
    } else if (mode === "moneda") {
      opts.innerHTML = "";
      out.innerHTML = `<div class="coin">?</div>`;
    } else if (mode === "numero") {
      opts.innerHTML = `<div class="two"><label class="field"><span>Desde</span><input id="dc-min" inputmode="numeric" value="1"></label>
        <label class="field"><span>Hasta</span><input id="dc-max" inputmode="numeric" value="100"></label></div>`;
    } else {
      opts.innerHTML = `<label class="field"><span>Opciones (una por línea)</span><textarea id="dc-list" rows="4" placeholder="Pizza&#10;Hamburguesa&#10;Sushi"></textarea></label>`;
    }
    $("#dc-go", root).textContent = mode === "moneda" ? "Lanzar" : mode === "elegir" ? "Elegir" : mode === "numero" ? "Sacar un número" : "Tirar";
  };
  root.addEventListener("click", (e) => {
    const m = e.target.closest("[data-mode]");
    const c = e.target.closest("[data-count]");
    if (m) mode = m.dataset.mode;
    if (c) count = Number(c.dataset.count);
    if (m || c) draw();
  });
  $("#dc-go", root).addEventListener("click", () => {
    navigator.vibrate?.(25);
    if (mode === "dados") {
      const values = Array.from({ length: count }, () => L.randomInt(1, 6));
      out.innerHTML = `<div class="dice rolling">${values.map(die).join("")}</div>${count > 1 ? `<p class="luck-total">Total: <b>${values.reduce((a, b) => a + b, 0)}</b></p>` : ""}`;
    } else if (mode === "moneda") {
      const side = L.randomInt(0, 1) ? "Cara" : "Cruz";
      out.innerHTML = `<div class="coin flip">${side}</div>`;
    } else if (mode === "numero") {
      const a = parseInt($("#dc-min", root).value, 10);
      const b = parseInt($("#dc-max", root).value, 10);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b || b - a > 1e9) {
        out.innerHTML = `<p class="hint">Pon dos números: el de «Hasta» más grande que el de «Desde».</p>`;
        return;
      }
      out.innerHTML = `<div class="luck-big num pop">${L.randomInt(a, b)}</div>`;
    } else {
      const options = $("#dc-list", root).value.split("\n").map((x) => x.trim()).filter(Boolean);
      if (options.length < 2) {
        out.innerHTML = `<p class="hint">Escribe al menos dos opciones, una en cada línea.</p>`;
        return;
      }
      out.innerHTML = `<p class="small">Ha salido:</p><div class="luck-big pop">${esc(options[L.randomInt(0, options.length - 1)])}</div>`;
    }
  });
  draw();
}

// ================================================================ Cuentas atrás (cumpleaños y fechas)

const EVENT_EMOJIS = ["🎂", "🎉", "✈️", "🏖️", "🎬", "🎤", "⚽", "🎮", "📝", "🎄"];

function openEventsSheet() {
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ev-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="ev-title">Cuentas atrás</h2>
        <button class="btn" type="button" id="ev-add">${svg("add")}Añadir</button>
      </div>
      <div class="sheet-body" id="ev-body"></div>
    </div>`);
  const draw = () => {
    const day = today();
    const next = L.upcomingEvents(state.events, day);
    const past = state.events.filter((e) => e.type !== "cumple" && e.date < day).sort((a, b) => (a.date < b.date ? 1 : -1));
    const row = (x, isPast = false) => `
      <button type="button" class="event${x.days === 0 ? " today" : ""}${isPast ? " past" : ""}" data-ev="${x.event.id}">
        <span class="event-emoji">${esc(x.event.emoji || "📅")}</span>
        <span class="grow"><span class="strong">${esc(x.event.name)}</span>
          <span class="small">${capitalize(L.fmtDateShort(x.date))}${x.turns ? ` · cumple ${x.turns}` : ""}</span></span>
        <span class="event-count">${isPast ? "Ya pasó" : x.days === 0 ? "¡Hoy!" : x.days === 1 ? "Mañana" : `<b class="num">${x.days}</b><small>días</small>`}</span>
      </button>`;
    $("#ev-body", root).innerHTML = next.length || past.length
      ? `${next.map((x) => row(x)).join("")}
         ${past.length ? `<p class="day-label">Ya pasaron</p>${past.map((e) => row({ event: e, date: e.date, days: L.daysBetween(day, e.date) }, true)).join("")}` : ""}`
      : `<div class="empty small-empty"><div class="glow-icon">${svg("cake")}</div><h2>Nada a la vista</h2>
          <p class="hint">Apunta cumpleaños (se repiten cada año), viajes, conciertos o el último día de clase, y verás cuántos días faltan.</p></div>`;
  };
  root.addEventListener("click", (e) => {
    if (e.target.closest("#ev-add")) openEventEditor(null, draw);
    const b = e.target.closest("[data-ev]");
    if (b) openEventEditor(state.events.find((x) => x.id === b.dataset.ev), draw);
  });
  draw();
}

function openEventEditor(ev, onSaved) {
  let type = ev?.type || "cumple";
  let emoji = ev?.emoji || "🎂";
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="ee-title">
      <div class="bar">
        <button class="icon-btn ghost" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="ee-title">${ev ? "Editar" : "Nueva cuenta atrás"}</h2>
        <button class="btn" type="submit" form="event-form" id="save">Guardar</button>
      </div>
      <form id="event-form" novalidate>
        <div class="segmented"><button type="button" data-type="cumple">Cumpleaños</button><button type="button" data-type="evento">Otra fecha</button></div>
        <label class="field"><span id="ee-name-label"></span>
          <input name="name" maxlength="40" value="${esc(ev?.name || "")}" autocomplete="off"></label>
        <label class="field"><span id="ee-date-label"></span><input name="date" type="date" value="${ev?.date || ""}">
          <small id="ee-date-help"></small></label>
        <div class="emoji-row" id="ee-emojis"></div>
        ${ev ? `<button type="button" class="btn danger block mt16" id="del">Borrar</button>` : ""}
      </form>
    </div>`);
  const form = $("#event-form", root);
  const f = form.elements;
  const draw = () => {
    root.querySelectorAll("[data-type]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.type === type));
    $("#ee-name-label", root).textContent = type === "cumple" ? "¿De quién es?" : "¿Qué es?";
    f.name.placeholder = type === "cumple" ? "Ej.: Ana" : "Ej.: Viaje a la playa";
    $("#ee-date-label", root).textContent = type === "cumple" ? "Fecha de nacimiento" : "Fecha";
    $("#ee-date-help", root).textContent = type === "cumple" ? "Con el año sale cuántos cumple. Se repite cada año." : "";
    $("#ee-emojis", root).innerHTML = EVENT_EMOJIS.map((x) => `<button type="button" data-emoji="${x}" aria-pressed="${x === emoji}">${x}</button>`).join("");
    $("#save", root).disabled = !f.name.value.trim() || !f.date.value;
  };
  root.addEventListener("click", (e) => {
    const t = e.target.closest("[data-type]");
    const m = e.target.closest("[data-emoji]");
    if (t) {
      type = t.dataset.type;
      if (type === "cumple") emoji = "🎂";
      else if (emoji === "🎂") emoji = "🎉";
    }
    if (m) emoji = m.dataset.emoji;
    if (t || m) draw();
  });
  f.name.addEventListener("input", draw);
  f.date.addEventListener("input", draw);
  draw();
  if (!ev) f.name.focus();
  $("#del", root)?.addEventListener("click", () => {
    closeOverlay(root);
    state.events = state.events.filter((x) => x.id !== ev.id);
    saveData();
    onSaved?.();
    render();
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if ($("#save", root).disabled) return;
    const values = { type, emoji, name: f.name.value.trim(), date: f.date.value };
    closeOverlay(root);
    state.events = ev ? state.events.map((x) => (x.id === ev.id ? { ...x, ...values } : x)) : [...state.events, { id: uid(), ...values }];
    saveData();
    onSaved?.();
    render();
  });
}

/** Un aviso al abrir la app si hoy es el cumple de alguien (una vez al día). */
function announceToday() {
  const day = today();
  if (storage.get("mipanel:aviso-fechas", "") === day) return;
  const todays = L.upcomingEvents(state.events, day).filter((x) => x.days === 0);
  if (!todays.length) return;
  storage.set("mipanel:aviso-fechas", day);
  const x = todays[0];
  toastAfter(x.event.type === "cumple" ? `🎂 ¡Hoy es el cumple de ${x.event.name}${x.turns ? ` (${x.turns})` : ""}!` : `${x.event.emoji || "📅"} ¡Hoy es ${x.event.name}!`, null, null, 7000);
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
  if (NATIVE) return NATIVE.keepScreenOn(!!on);
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
  else updateHome();
}

function updateFocusUI() {
  const tileValue = $("#tile-focus .tile-value");
  if (tileValue) tileValue.textContent = fmtClock(timeLeft());
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
  if (document.hidden && torch.on && !NATIVE) stopTorch(); // el navegador suelta la cámara al salir
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
        ? "Todo (tareas, notas, horario, dinero y fechas) ya se guarda en tu cuenta de Claude. Si quieres, guarda también una copia en un archivo: sirve para pasarlas a la app instalable (APK) o a la versión web."
        : "Guarda todo (tareas, notas, horario, dinero y fechas) en un archivo (en Descargas, Drive…). Si cambias de móvil o borras los datos de Chrome, las recuperas desde aquí. Sirve también para pasarlas a la app instalable (APK)."}</p>
      <button class="btn block" id="bk-export">Guardar copia</button>
      <button class="btn outline block mt8" id="bk-import">Recuperar una copia</button>
      <input type="file" id="bk-file" accept=".json,application/json" hidden>
      <p class="strong mt12" id="bk-msg"></p>
      <div class="actions"><button class="btn text" data-close>Cerrar</button></div>
    </div></div>`);
  const msg = $("#bk-msg", root);
  $("#bk-export", root).addEventListener("click", async () => {
    const data = {
      app: "MiPanel",
      version: 1,
      createdAt: Date.now(),
      tasks: state.tasks,
      grades: state.grades,
      focus: state.focus,
      schedule: state.schedule,
      money: state.money,
      events: state.events,
    };
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
    if (NATIVE) {
      const ok = NATIVE.saveFile(`mipanel-copia-${today()}.json`, "application/json", JSON.stringify(data, null, 2));
      msg.textContent = ok ? "✓ Copia guardada en Descargas" : "No se ha podido guardar la copia.";
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
      if (Array.isArray(data.events)) state.events = merge(state.events, data.events);
      if (validData("money", data.money)) {
        state.money = {
          entries: merge(state.money.entries, data.money.entries),
          goals: merge(state.money.goals, data.money.goals),
          budget: state.money.budget ?? data.money.budget ?? null,
          revolut: state.money.revolut ?? data.money.revolut ?? null,
        };
      }
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
  // Dentro de las ventanas solo funcionan sus propios botones, salvo en "Mi móvil" (test de velocidad, cascos, tiempo).
  if (!el || (el.closest("#overlay-root") && !el.closest(".live-actions"))) {
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
      } else if (hit.dataset.moneyday) {
        selectedMoneyDay = selectedMoneyDay === hit.dataset.moneyday ? null : hit.dataset.moneyday;
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
      if (NATIVE) NATIVE.requestBluetooth();
      else connectHeadphones();
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
    case "go":
      setTab(el.dataset.go);
      break;
    case "device":
      openDeviceSheet();
      break;
    case "home-menu":
      if (openMenuEl) closeMenu();
      else showMenu(el, [["Mi móvil", () => openDeviceSheet()], ["Horario de clases", openScheduleEditor], ["Cuentas atrás", openEventsSheet], ["Copia de seguridad", openBackupDialog], ["Buscar actualización", checkForUpdate]]);
      break;
    case "money-menu":
      if (openMenuEl) closeMenu();
      else showMenu(el, [["Meter extracto de Revolut", openRevolutImport], ["Límite de gasto al mes", openBudgetDialog], ["Nueva hucha", () => openGoalEditor(null)], ["Copia de seguridad", openBackupDialog]]);
      break;
    case "new-money":
      openMoneyEditor(null);
      break;
    case "money-start":
      openMoneyEditor(null, { type: "ingreso", category: "otros", note: "Lo que tenía" });
      break;
    case "edit-money":
      openMoneyEditor(state.money.entries.find((x) => x.id === id));
      break;
    case "money-more":
      showAllMoney = true;
      render();
      break;
    case "budget":
      openBudgetDialog();
      break;
    case "new-goal":
      openGoalEditor(null);
      break;
    case "edit-goal":
      openGoalEditor(state.money.goals.find((x) => x.id === id));
      break;
    case "goal-money":
      openGoalMoneyDialog(state.money.goals.find((x) => x.id === id));
      break;
    case "goal-bought":
      goalBought(state.money.goals.find((x) => x.id === id));
      break;
    case "revolut":
      openRevolutImport();
      break;
    case "events":
      openEventsSheet();
      break;
    case "messages":
      openMessagesSheet();
      break;
    case "msg-access":
      NATIVE?.openMessageAccess();
      break;
    case "app-settings":
      NATIVE?.openAppSettings();
      break;
    case "tool":
      openTool(el.dataset.tool);
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
  resizeTimer = setTimeout(render, 150);
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
  } else if (state.tab === "inicio") {
    updateHome();
  }
}, 60_000);

// Otra pestaña con la app abierta cambió los datos.
addEventListener("storage", (e) => {
  if (e.key === DATA_KEY && state.where === "local") {
    loadData();
    render();
  }
});

// ================================================================ Arranque

// Accesos directos del icono (mantener pulsado): ?pestana=tareas / notas
const fromUrl = new URLSearchParams(location.search).get("pestana");
if (fromUrl) state.tab = fromUrl;
if (state.tab === "estado") state.tab = "inicio"; // la antigua pestaña Estado ahora es Inicio
if (!["inicio", "tareas", "foco", "notas", "dinero"].includes(state.tab)) state.tab = "inicio";
if (ARTIFACT) initCloud();
else loadData();
render();
takeSharedFile();
if (!ARTIFACT) announceToday();

if (NATIVE) {
  addEventListener("mipanel-mensajes", () => updateHome());
  addEventListener("mipanel-cascos", () => {
    updateBt();
    updateHome();
  });
  addEventListener("mipanel-compartido", takeNativeSharedFile);
}

// Accesos directos del icono que hacen algo nada más abrir: ?accion=gasto / qr
const startAction = new URLSearchParams(location.search).get("accion");
if (startAction) {
  history.replaceState(history.state, "", location.pathname);
  if (startAction === "gasto") {
    setTab("dinero");
    openMoneyEditor(null);
  } else if (startAction === "qr" && !ARTIFACT) {
    openScanner();
  }
}
initBattery();
initDevice();
if (timer.running && timeLeft() <= 0) setTimeout(completePhase, 600);
else ensureTicker();

const update = { ready: false, forced: false };
if (!ARTIFACT && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker
    .register("sw.js", { updateViaCache: "none" })
    .then((reg) => {
      // Al volver a la app se mira si hay versión nueva (se baja en segundo plano).
      document.addEventListener("visibilitychange", () => !document.hidden && reg.update().catch(() => {}));
    })
    .catch(() => {});
  let reloading = false;
  const reload = () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || reloading) return; // la primera vez no hay nada que cambiar
    // Versión nueva lista: si acabas de abrir la app (o la has pedido) se pone sola; si estás
    // usándola, se avisa y se pone en cuanto vuelvas a la app.
    if (update.forced || (performance.now() < 15000 && !$("#overlay-root").children.length)) {
      reload();
    } else {
      update.ready = true;
      toast("Hay una versión nueva de Mi Panel", "Actualizar", reload, 12000);
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && update.ready && !$("#overlay-root").children.length) reload();
  });
}

/** "Buscar actualización": mira si hay versión nueva y, si la hay, la pone en cuanto se descarga. */
async function checkForUpdate() {
  const reg = await navigator.serviceWorker?.getRegistration?.().catch(() => null);
  if (!reg) {
    toast(`Tienes la versión del ${BUILD}`);
    return;
  }
  if (update.ready) return location.reload();
  toast("Buscando actualización…", null, null, 20000);
  try {
    await reg.update();
  } catch {
    toast("No se ha podido comprobar: ¿hay internet?");
    return;
  }
  const incoming = reg.installing || reg.waiting;
  if (!incoming) {
    toast(`Ya tienes la última versión (del ${BUILD})`);
    return;
  }
  update.forced = true;
  toast("Descargando la versión nueva…", null, null, 30000);
  incoming.addEventListener("statechange", () => {
    if (incoming.state === "redundant") toast("Aún no está lista en el servidor: prueba otra vez en unos minutos");
  });
}

// Para los tests automáticos.
window.__miPanel = { state, render, timer, completePhase };
