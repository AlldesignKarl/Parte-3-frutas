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

function ring(pct, style = "") {
  return `<div class="ring" style="--p:${Math.max(0, Math.min(100, pct))};${style}"></div>`;
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
}

const isPlainObject = (v) => v != null && typeof v === "object" && !Array.isArray(v);
const DATA_KEYS = ["tasks", "grades", "focus"];

let persistAsked = false;
function saveData() {
  if (state.where === "cloud") {
    DATA_KEYS.forEach((k) => (cloud.dirty[k] = true));
    flushCloud();
    return;
  }
  const ok = storage.set(DATA_KEY, { version: 1, tasks: state.tasks, grades: state.grades, focus: state.focus });
  if (!ok) toast("No se ha podido guardar en este navegador");
  // Pide al navegador que no borre los datos aunque falte espacio.
  if (!persistAsked && navigator.storage?.persist) {
    persistAsked = true;
    navigator.storage.persist().catch(() => {});
  }
}

// ---------------------------------------------------------------- Cuenta de Claude (solo claude.ai)

const cloud = {
  docs: null,
  dirty: { tasks: false, grades: false, focus: false },
  written: { tasks: null, grades: null, focus: null },
  writing: false,
  loaded: { tasks: false, grades: false, focus: false },
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
    cloud.docs = { tasks: db.doc(`${base}/tareas`), grades: db.doc(`${base}/notas`), focus: db.doc(`${base}/foco`) };
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
    bar.hidden = true;
    onAction?.();
  };
  bar.hidden = false;
  clearTimeout(snackTimer);
  snackTimer = setTimeout(() => (bar.hidden = true), ms);
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
  let time = "";
  if (b.charging && Number.isFinite(b.chargingTime) && b.chargingTime > 0) time = `Al 100 % en ${L.fmtDuration(b.chargingTime * 1000)}`;
  else if (!b.charging && Number.isFinite(b.dischargingTime) && b.dischargingTime > 0) time = `≈ ${L.fmtDuration(b.dischargingTime * 1000)} de uso`;
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
    <p class="small mt16" style="margin-bottom:0">El porcentaje es el exacto del sistema. La temperatura y el consumo solo los da la app instalable (APK).</p>`;
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
      <span class="strong">${bt.level} %</span></div><div class="meter mt8"><i style="width:${bt.level}%;background:${batteryColor(bt.level)}"></i></div></div></div>`;
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
      <div class="meter mt8"><i style="width:${Math.round(s.progress * 100)}%"></i></div>
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
const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

function installBanner() {
  if (isStandalone() || storage.get("mipanel:ocultar-instalar", false)) return "";
  if (ARTIFACT) {
    return `<div class="install"><p><b>Tenla como app:</b> abre este enlace en Chrome, toca ⋮ → <b>Añadir a pantalla de inicio</b>, y te sale el icono.</p>
      <button class="icon-btn" data-action="hide-install" aria-label="Ocultar">${svg("close")}</button></div>`;
  }
  if (installPrompt) {
    return `<div class="install"><p><b>Tenla como app:</b> con icono en tu pantalla de inicio y a pantalla completa.</p>
      <button class="btn" data-action="install">Instalar</button></div>`;
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
      <section class="card">${cardHead("headphones", "Cascos")}<div id="bt-body"></div></section>
      <section class="card">${cardHead("wifi", "Conexión")}<div id="net-body"></div>
        <hr class="divider">
        <div class="row" style="margin-bottom:12px">${svg("speed").replace("<svg", '<svg style="width:22px;height:22px;fill:var(--accent)"')}<span class="strong">Test de velocidad</span></div>
        <div id="speed-body"></div>
      </section>
      <section class="card">${cardHead("phone", "Este móvil")}<div id="device-body"></div></section>
    </div>`;
  updateBattery();
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
    $("#view").innerHTML = `${header}<div class="empty"><div class="glow-icon">${svg("book")}</div><h2>No tienes tareas</h2>
      <p class="hint">Pulsa "Nueva tarea" y apunta lo que tengas que estudiar, la fecha del examen y cuántas páginas son.</p></div>${fab}`;
    return;
  }

  let html = header + `<div class="${stackClass()}">`;
  html += planCard(pending, done, day);
  html += weekCard(day);
  html += pending.map((t) => taskCard(t, day)).join("");
  html += examsCard(day);
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
        ${L.hasPages(t) ? `<div class="meter mt8"><i style="width:${pct}%"></i></div>` : ""}
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
      <div class="meter thick"><i style="width:${pct}%"></i></div>
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
      <div class="avg mt8"><span class="hero">${L.fmtGrade(overall)}</span>
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
  )}"><defs><linearGradient id="barGrad" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="var(--accent-2)"/><stop offset="1" stop-color="var(--accent)"/></linearGradient></defs>`;
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
    out += `<path class="bar" fill="url(#barGrad)" d="M${x0},${top} H${end - r} Q${end},${top} ${end},${top + r} V${bottom - r} Q${end},${bottom} ${end - r},${bottom} H${x0} Z"/>`;
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
  { preset: "25", phase: "work", running: false, endsAt: 0, remaining: 25 * 60000, taskId: null },
  storage.get(TIMER_KEY, {})
);
if (!PRESETS.some((p) => p.id === timer.preset)) timer.preset = "25";

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
  renderIfFocus();
}

function pauseTimer() {
  if (!timer.running) return;
  timer.remaining = timeLeft();
  timer.running = false;
  saveTimer();
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
  renderIfFocus();
}

function completePhase() {
  const finished = timer.phase;
  timer.running = false;
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
  $("#focus-ring")?.style.setProperty("--p", pct.toFixed(2));
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
          <div class="ring" id="focus-ring" style="--p:${pct.toFixed(2)}${isWork ? "" : ";--c1:var(--cyan);--c2:var(--blue)"}"></div>
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
        <div class="focus-controls">
          <button class="icon-btn big" data-action="focus-reset" aria-label="Reiniciar">${svg("reset")}</button>
          ${timer.running
            ? `<button class="btn play" data-action="focus-pause">${svg("pause")}Pausar</button>`
            : `<button class="btn play" data-action="focus-start">${svg("play")}${left < phaseLength(timer.phase) ? "Seguir" : isWork ? "Empezar" : "Descansar"}</button>`}
          <button class="icon-btn big" data-action="focus-skip" aria-label="${isWork ? "Pasar al descanso" : "Saltar descanso"}">${svg("skip")}</button>
        </div>
        <p class="small" style="text-align:center;margin:14px 0 0">Si sales de la app el tiempo sigue contando. Al terminar suena y vibra si la tienes abierta.</p>
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
  if (!document.hidden && timer.running) tick();
});

// ================================================================ Copia de seguridad

function openBackupDialog() {
  const root = overlay(`
    <div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="bk-title">
      <h2 id="bk-title">Copia de seguridad</h2>
      <p style="margin-top:0">${ARTIFACT
        ? "Tus tareas y notas ya se guardan en tu cuenta de Claude. Si quieres, guarda también una copia en un archivo: sirve para pasarlas a la app instalable (APK) o a la versión web."
        : "Guarda tus tareas y notas en un archivo (en Descargas, Drive…). Si cambias de móvil o borras los datos de Chrome, las recuperas desde aquí. Sirve también para pasarlas a la app instalable (APK)."}</p>
      <button class="btn block" id="bk-export">Guardar copia</button>
      <button class="btn outline block mt8" id="bk-import">Recuperar una copia</button>
      <input type="file" id="bk-file" accept=".json,application/json" hidden>
      <p class="strong mt12" id="bk-msg"></p>
      <div class="actions"><button class="btn text" data-close>Cerrar</button></div>
    </div></div>`);
  const msg = $("#bk-msg", root);
  $("#bk-export", root).addEventListener("click", async () => {
    const data = { app: "MiPanel", version: 1, createdAt: Date.now(), tasks: state.tasks, grades: state.grades, focus: state.focus };
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
    case "hide-install":
      storage.set("mipanel:ocultar-instalar", true);
      render();
      break;
    case "bt":
      connectHeadphones();
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
      else showMenu(el, [["Copia de seguridad", openBackupDialog]]);
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
