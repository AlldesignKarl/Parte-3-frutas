import * as L from "./logic.js";

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
  bluetooth: "M17.71,7.71L12,2h-1v7.59L6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 11,14.41V22h1l5.71,-5.71 -4.3,-4.29 4.3,-4.29zM13,5.83l1.88,1.88L13,9.59V5.83zM14.88,16.29L13,18.17v-3.76l1.88,1.88z",
};
const svg = (name, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICON[name]}"/></svg>`;

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
  showDone: false,
  selectedSubject: null,
  loading: ARTIFACT, // en claude.ai se espera a la cuenta antes de pintar "no tienes tareas"
  where: ARTIFACT ? "cloud" : "local",
};

function loadData() {
  const data = storage.get(DATA_KEY, {});
  state.tasks = Array.isArray(data.tasks) ? data.tasks : [];
  state.grades = Array.isArray(data.grades) ? data.grades : [];
}

let persistAsked = false;
function saveData() {
  if (state.where === "cloud") {
    cloud.dirty.tasks = cloud.dirty.grades = true;
    flushCloud();
    return;
  }
  const ok = storage.set(DATA_KEY, { version: 1, tasks: state.tasks, grades: state.grades });
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
  dirty: { tasks: false, grades: false },
  written: { tasks: null, grades: null },
  writing: false,
  loaded: { tasks: false, grades: false },
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
    cloud.docs = { tasks: db.doc(`${base}/tareas`), grades: db.doc(`${base}/notas`) };
    for (const key of ["tasks", "grades"]) {
      cloud.docs[key].onSnapshot(
        (snap) => {
          if (snap.metadata.hasPendingWrites || cloud.dirty[key] || cloud.writing) return;
          const items = snap.exists ? snap.data().items : [];
          const text = JSON.stringify(Array.isArray(items) ? items : []);
          cloud.written[key] = text;
          if (text !== JSON.stringify(state[key])) {
            state[key] = JSON.parse(text);
            if (state.tab !== "estado") render();
          }
          if (!cloud.loaded[key]) {
            cloud.loaded[key] = true;
            if (cloud.loaded.tasks && cloud.loaded.grades) {
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
    for (const key of ["tasks", "grades"]) {
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
  if (cloud.dirty.tasks || cloud.dirty.grades) flushCloud();
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
  render();
  window.scrollTo(0, 0);
}

function render() {
  document.querySelectorAll(".tab").forEach((b) => {
    if (b.dataset.tab === state.tab) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  closeMenu();
  if (state.tab === "tareas") renderTasks();
  else if (state.tab === "notas") renderGrades();
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
  const color = batteryColor(pct);
  const c = 2 * Math.PI * 61;
  let time = "";
  if (b.charging && Number.isFinite(b.chargingTime) && b.chargingTime > 0) time = `Al 100 % en ${L.fmtDuration(b.chargingTime * 1000)}`;
  else if (!b.charging && Number.isFinite(b.dischargingTime) && b.dischargingTime > 0)
    time = `≈ ${L.fmtDuration(b.dischargingTime * 1000)} de uso`;
  box.innerHTML = `
    <div class="battery">
      <div class="ring">
        <svg viewBox="0 0 136 136"><circle class="track" cx="68" cy="68" r="61"/>
          <circle class="fill" cx="68" cy="68" r="61" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - b.level)}"/></svg>
        <div class="center">
          ${b.charging ? `<svg class="bolt" viewBox="0 0 24 24" style="fill:${color}"><path d="${ICON.bolt}"/></svg>` : ""}
          <div class="pct${pct >= 100 ? " full" : ""}">${pct} %</div>
        </div>
      </div>
      <div class="grow">
        <p class="headline" style="${b.charging ? "color:var(--good)" : ""}">${full ? "Carga completa" : b.charging ? "Cargando" : "Con batería"}</p>
        ${b.charging ? `<p class="hint">Enchufado</p>` : ""}
        ${time ? `<p class="mt8">${time}</p>` : ""}
      </div>
    </div>
    <p class="small mt16">El navegador da el porcentaje exacto y si está cargando. La temperatura y el consumo solo los ve la app instalable (APK).</p>`;
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
  const c = navigator.connection;
  const online = navigator.onLine;
  const type = c?.type; // wifi, cellular, ethernet, none, unknown (Chrome Android)
  return {
    online,
    kind: !online ? "none" : type === "wifi" ? "wifi" : type === "cellular" ? "mobile" : type === "ethernet" ? "ethernet" : "unknown",
    downlink: c?.downlink || null,
    rtt: c?.rtt || null, // 0 = el navegador no lo sabe
    effectiveType: c?.effectiveType,
    saveData: c?.saveData,
  };
}

function qualityFromRtt(rtt) {
  if (rtt == null) return null;
  if (rtt <= 75) return { label: "Excelente", level: 4, color: "var(--good)" };
  if (rtt <= 150) return { label: "Buena", level: 3, color: "var(--good)" };
  if (rtt <= 300) return { label: "Regular", level: 2, color: "var(--warning)" };
  return { label: "Lenta", level: 1, color: "var(--bad)" };
}

function updateNetwork() {
  const box = $("#net-body");
  if (!box) return;
  const n = connectionInfo();
  if (n.kind === "none") {
    box.innerHTML = `<p class="headline" style="color:var(--bad)">Sin conexión</p><p class="hint">No hay internet ahora mismo.</p>`;
    return;
  }
  const names = { wifi: "WiFi", mobile: "Datos móviles", ethernet: "Cable", unknown: "Conectado" };
  const q = qualityFromRtt(n.rtt);
  const bars = q ? q.level : 0;
  const cells = [];
  if (n.downlink != null) cells.push(["Bajada estimada", `${n.downlink >= 10 ? "10 o más" : L.fmtDecimal(n.downlink)} Mbps`]);
  if (n.rtt != null) cells.push(["Respuesta (ping)", `${n.rtt} ms`]);
  if (n.effectiveType) cells.push(["Calidad para Chrome", n.effectiveType.toUpperCase()]);
  if (n.saveData) cells.push(["Ahorro de datos", "Activado"]);
  box.innerHTML = `
    <div class="row">
      <div class="bars" style="color:${q ? q.color : "var(--neutral)"}">${[1, 2, 3, 4].map((i) => `<i class="${i <= bars ? "on" : ""}" style="height:${i * 25}%"></i>`).join("")}</div>
      <div class="grow">
        <p class="headline">${names[n.kind]}${q ? ` · <span style="color:${q.color}">${q.label}</span>` : ""}</p>
        <p class="hint">Según lo que tarda en responder internet</p>
      </div>
    </div>
    <p class="mt12 strong" style="color:var(--good)">✓ Internet funciona</p>
    ${cells.length ? `<div class="grid2 mt12">${cells.map(([l, v]) => `<div class="cell"><div class="label">${l}</div><div class="value">${v}</div></div>`).join("")}</div>` : ""}
    ${n.kind === "unknown" ? `<p class="small mt12">Este navegador no dice si es WiFi o datos.</p>` : ""}`;
}

const SPEED_BASE = "https://speed.cloudflare.com";
let speedAbort = null;

async function runSpeedTest() {
  if (status.speed.state === "running") return;
  if (connectionInfo().kind === "mobile" && !(await confirmDialog(
    "Estás con datos móviles",
    "El test descarga y sube datos durante unos segundos: puede gastar entre 20 y 150 MB de tu tarifa.",
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
    const samples = [];
    for (let i = 0; i < 8; i++) {
      const t0 = performance.now();
      const r = await fetch(`${SPEED_BASE}/__down?bytes=0&r=${Math.random()}`, { cache: "no-store", signal });
      await r.arrayBuffer();
      if (i > 0) samples.push(performance.now() - t0); // la primera incluye DNS y TLS
      set({ state: "running", phase: "Midiendo ping…", progress: (0.1 * (i + 1)) / 8 });
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const ping = Math.round(sorted[Math.floor(sorted.length / 2)]);
    const jitter = Math.round(samples.slice(1).reduce((s, v, i) => s + Math.abs(v - samples[i]), 0) / (samples.length - 1));

    const down = await measure("Midiendo bajada…", 8000, 4, 0.1, 0.55, signal, ping, async (count, until, sig) => {
      while (performance.now() < until) {
        const r = await fetch(`${SPEED_BASE}/__down?bytes=25000000&r=${Math.random()}`, { cache: "no-store", signal: sig });
        const reader = r.body.getReader();
        while (performance.now() < until) {
          const { done, value } = await reader.read();
          if (done) break;
          count(value.byteLength);
        }
        reader.cancel().catch(() => {});
      }
    });

    let up = null;
    try {
      const chunk = new Uint8Array(512 * 1024);
      for (let i = 0; i < chunk.length; i += 65536) crypto.getRandomValues(chunk.subarray(i, i + 65536));
      up = await measure("Midiendo subida…", 6000, 2, 0.65, 0.35, signal, ping, async (count, until, sig) => {
        while (performance.now() < until) {
          await fetch(`${SPEED_BASE}/__up`, { method: "POST", body: chunk, headers: { "Content-Type": "text/plain" }, signal: sig });
          count(chunk.byteLength);
        }
      });
    } catch (e) {
      if (signal.aborted) throw e;
    }
    set({ state: "done", ping, jitter, down, up, at: Date.now() });
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
        worker((n) => (bytes += n), until, inner.signal).catch(() => {})
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
    box.innerHTML = `<div class="row"><span class="grow">${s.phase}</span>${s.live != null ? `<span class="strong">${mbps(s.live)} Mbps</span>` : ""}</div>
      <div class="meter mt8"><i style="width:${Math.round(s.progress * 100)}%"></i></div>
      <button class="btn outline block mt12" data-action="speed-cancel">Cancelar</button>`;
  } else if (s.state === "done") {
    const [title, text] = verdict(s);
    box.innerHTML = `<div class="stats3">
        <div><div class="small">Ping</div><div class="big">${s.ping}</div><div class="small">ms</div></div>
        <div><div class="small">Bajada</div><div class="big">${mbps(s.down)}</div><div class="small">Mbps</div></div>
        <div><div class="small">Subida</div><div class="big">${mbps(s.up)}</div><div class="small">Mbps</div></div>
      </div>
      <p class="mt12 strong">${title}</p><p class="hint" style="color:var(--text)">${text}</p>
      <p class="small">Variación del ping: ${s.jitter} ms · medido a las ${L.fmtTime(s.at)}</p>
      <button class="btn tonal block mt12" data-action="speed">Repetir</button>`;
  } else {
    box.innerHTML = `${s.state === "error" ? `<p style="color:var(--bad)">${s.message}</p>` : `<p class="hint">Mide el ping, la velocidad de bajada y la de subida (tarda unos 15 segundos).</p>`}
      <button class="btn block mt12" data-action="speed">${s.state === "error" ? "Reintentar" : "Medir velocidad"}</button>`;
  }
}

// ================================================================ Estado: este móvil

async function initDevice() {
  const info = { model: null, android: null };
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
}

function updateDevice() {
  const box = $("#device-body");
  if (!box) return;
  const d = status.device || {};
  const cells = [];
  if (d.model) cells.push(["Modelo", d.model]);
  if (d.android) cells.push(["Sistema", d.android]);
  if (navigator.deviceMemory) cells.push(["Memoria RAM", `≈ ${navigator.deviceMemory >= 8 ? "8 GB o más" : `${navigator.deviceMemory} GB`}`]);
  if (navigator.hardwareConcurrency) cells.push(["Procesador", `${navigator.hardwareConcurrency} núcleos`]);
  cells.push(["Pantalla", `${screen.width} × ${screen.height}`]);
  box.innerHTML = `<div class="grid2">${cells.map(([l, v]) => `<div class="cell"><div class="label">${l}</div><div class="value">${esc(v)}</div></div>`).join("")}</div>`;
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
    <header class="topbar"><h1>Mi móvil</h1></header>
    ${installBanner()}
    <div class="stack">
      <section class="card">${cardHead("battery", "Batería")}<div id="battery-body"></div></section>
      <section class="card">${cardHead("headphones", "Cascos")}<div id="bt-body"></div></section>
      <section class="card">${cardHead("wifi", "Conexión e internet")}<div id="net-body"></div>
        ${ARTIFACT ? "" : `<hr class="divider">
        <div class="row" style="margin-bottom:12px">${svg("speed").replace("<svg", '<svg style="width:24px;height:24px;fill:var(--primary)"')}<span class="strong">Test de velocidad</span></div>
        <div id="speed-body"></div>`}
      </section>
      <section class="card">${cardHead("phone", "Este móvil")}<div id="device-body"></div></section>
    </div>`;
  updateBattery();
  updateBt();
  updateNetwork();
  updateSpeed();
  updateDevice();
}

// ================================================================ Pantalla Tareas

function renderTasks() {
  if (state.loading) {
    $("#view").innerHTML = `<header class="topbar"><h1>Tareas</h1></header><p class="loading">Cargando tus tareas…</p>`;
    return;
  }
  const day = today();
  const pending = L.pendingSorted(state.tasks);
  const done = L.doneSorted(state.tasks);
  const overview = L.dayOverview(state.tasks, day);
  const header = `<header class="topbar"><h1>Tareas</h1>
    <button class="icon-btn" data-action="menu" aria-label="Más opciones">${svg("more")}</button></header>`;
  const fab = `<button class="fab" data-action="new-task" aria-label="Nueva tarea">${svg("add")}Nueva tarea</button>`;

  if (!pending.length && !done.length) {
    $("#view").innerHTML = `${header}<div class="empty">${svg("book")}<h2>No tienes tareas</h2>
      <p class="hint">Pulsa "Nueva tarea" y apunta lo que tengas que estudiar, la fecha del examen y cuántas páginas son.</p></div>${fab}`;
    return;
  }

  let html = header + `<div class="stack">`;
  if (overview.goalToday > 0) {
    const reached = overview.pagesToday >= overview.goalToday;
    const next = pending.find((t) => t.examDate && L.daysUntilExam(t, day) >= 0);
    html += `<section class="today"><div class="small" style="color:inherit">Hoy</div>
      <div class="big">${reached ? `¡Objetivo cumplido! ${overview.pagesToday} págs` : `Llevas ${overview.pagesToday} de ${overview.goalToday} págs`}</div>
      <div class="meter"><i style="width:${Math.min(100, (overview.pagesToday / overview.goalToday) * 100)}%;${reached ? "background:var(--good)" : ""}"></i></div>
      ${next ? `<p class="mt12" style="margin-bottom:0">Próximo examen: ${esc(next.title)}, ${L.relativeDay(L.daysUntilExam(next, day))}</p>` : ""}
    </section>`;
  }
  if (!pending.length) html += `<p class="strong" style="padding:8px">¡No tienes nada pendiente! 🎉</p>`;
  html += pending.map((t) => taskCard(t, day)).join("");
  if (done.length) {
    html += `<button class="done-head" data-action="toggle-done" aria-expanded="${state.showDone}">
      <span class="grow" style="text-align:left">Terminadas (${done.length})</span>${svg(state.showDone ? "up" : "down").replace("<svg", '<svg style="width:24px;height:24px;fill:currentColor"')}</button>`;
    if (state.showDone) {
      html += done.map((t) => `<div class="done-item row">${svg("check", "ok")}
        <div class="grow"><div class="strong">${esc(t.title)}</div><div class="small">${L.completionLine(t, day)}</div></div>
        <button class="icon-btn" data-action="task-menu" data-id="${t.id}" aria-label="Opciones">${svg("more")}</button></div>`).join("");
    }
  }
  html += `</div>${fab}`;
  $("#view").innerHTML = html;
}

function taskCard(t, day) {
  const chip = L.examChip(t, day);
  const chipColor = { bad: "var(--bad)", warning: "var(--warning)", primary: "var(--primary)", neutral: "var(--neutral)" };
  let body = "";
  if (chip) body += `<span class="chip" style="--chip:${chipColor[chip.level]}">${svg("event")}${esc(chip.text)}</span>`;
  if (t.notes) body += `<p class="hint mt8" style="margin-bottom:0">${esc(t.notes)}</p>`;
  if (L.hasPages(t)) {
    const pct = Math.round(L.progress(t) * 100);
    const days = L.daysUntilExam(t, day);
    const perDay = L.pagesPerDayFromNow(t, day);
    const goal = L.goalToday(t, day);
    const doneToday = Math.max(0, L.pagesOn(t, day));
    let plan;
    if (days == null) plan = `<p class="hint">Te quedan ${L.fmtPages(L.remainingPages(t))}. Pon fecha de examen para saber cuántas tocan al día.</p>`;
    else if (days < 0) plan = `<p class="hint">El examen ya pasó · te quedaron ${L.fmtPages(L.remainingPages(t))}</p>`;
    else plan = `<p style="margin:0">Te quedan ${L.fmtPages(L.remainingPages(t))} → ${perDay} ${days <= 1 ? "hoy" : "al día"}</p>`;
    if (goal) {
      const reached = doneToday >= goal;
      plan += `<p class="strong" style="margin:2px 0 0;${reached ? "color:var(--good)" : ""}">${reached ? `✓ Objetivo de hoy cumplido (${doneToday} de ${goal})` : `Hoy: ${doneToday} de ${goal} págs`}</p>`;
    }
    body += `<div class="row mt12"><span class="grow" style="font-size:17px">${t.pagesDone} de ${t.totalPages} págs</span><span class="strong" style="font-size:17px">${pct} %</span></div>
      <div class="meter thick mt8"><i style="width:${pct}%"></i></div>
      <div class="mt12">${plan}</div>
      <div class="quick">
        <button class="btn tonal" data-action="add-pages" data-id="${t.id}" data-n="1">+1</button>
        <button class="btn tonal" data-action="add-pages" data-id="${t.id}" data-n="5">+5</button>
        <button class="btn tonal" data-action="add-pages" data-id="${t.id}" data-n="10">+10</button>
        <button class="btn outline" data-action="log" data-id="${t.id}">Anotar…</button>
      </div>`;
  }
  return `<article class="task">
    <div class="row" style="gap:4px">
      ${L.hasPages(t) ? "" : `<button class="check" data-action="toggle" data-id="${t.id}" aria-label="Marcar como hecha"></button>`}
      <h3 class="task-title grow">${esc(t.title)}</h3>
      <button class="icon-btn" data-action="task-menu" data-id="${t.id}" aria-label="Opciones">${svg("more")}</button>
    </div>
    <div class="body">${body}</div>
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
        <button class="icon-btn" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="ed-title">${task ? "Editar tarea" : "Nueva tarea"}</h2>
        <button class="btn text" type="submit" form="task-form" id="save">Guardar</button>
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
        <div class="emoji">🎉</div>
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
  if (state.loading) {
    $("#view").innerHTML = `<header class="topbar"><h1>Notas</h1></header><p class="loading">Cargando tus notas…</p>`;
    return;
  }
  const subjects = L.bySubject(state.grades);
  const overall = L.overallAverage(subjects);
  const header = `<header class="topbar"><h1>Notas</h1>
    <button class="icon-btn" data-action="menu" aria-label="Más opciones">${svg("more")}</button></header>`;
  const fab = `<button class="fab" data-action="new-grade" aria-label="Añadir nota">${svg("add")}Añadir nota</button>`;
  if (!subjects.length) {
    $("#view").innerHTML = `${header}<div class="empty">${svg("chart")}<h2>Aún no has apuntado notas</h2>
      <p class="hint">Pulsa "Añadir nota", escribe la asignatura y la nota, y aquí verás la media de cada una en una gráfica.</p></div>${fab}`;
    return;
  }
  const count = state.grades.length;
  let html = `${header}<div class="stack">
    <section class="card">${cardHead("school", "Media general")}
      <div class="row" style="align-items:flex-end"><span class="hero">${L.fmtGrade(overall)}</span><span style="font-size:22px;margin-bottom:6px">${L.gradeLabel(overall)}</span></div>
      <p class="hint mt8">Media de ${subjects.length === 1 ? "1 asignatura" : `${subjects.length} asignaturas`} · ${count === 1 ? "1 nota apuntada" : `${count} notas apuntadas`}</p>
    </section>
    <section class="card">${cardHead("chart", "Media por asignatura")}<div class="chart" id="chart"></div><p class="small mt8" id="chart-detail"></p></section>
    <h2 style="font-size:17px;margin:8px 0 0 4px">Asignaturas</h2>`;
  html += subjects.map((s) => `<section class="card">
      ${cardHead("book", s.name, `<div style="text-align:right"><div style="font-size:22px;font-weight:700">${L.fmtGrade(s.average)}</div><div class="small">${L.gradeLabel(s.average)}</div></div>`)}
      <div>${s.grades.map((g) => `<button class="grade-row" data-action="edit-grade" data-id="${g.id}">
          <span class="v">${L.fmtGrade(g.value)}</span>
          <span class="grow"><span style="display:block">${esc(g.description || "Nota")}</span><span class="small">${L.fmtDateShort(g.date)} ${g.date.slice(0, 4)}</span></span>
          <span class="edit">Editar</span></button>`).join("")}</div>
      <button class="btn outline block mt12" data-action="new-grade" data-subject="${esc(s.name)}">+ Añadir nota de ${esc(s.name)}</button>
    </section>`).join("");
  html += `</div>${fab}`;
  $("#view").innerHTML = html;
  drawChart(subjects);
}

/** Barras horizontales: media de 0 a 10 por asignatura, con una línea fina en el 5. */
function drawChart(subjects) {
  const box = $("#chart");
  if (!box) return;
  const width = Math.max(260, box.clientWidth || 320);
  const rowH = 40;
  const axisH = 24;
  const height = rowH * subjects.length + axisH;
  const labelW = Math.min(width * 0.34, 150);
  const x0 = labelW + 10;
  const x1 = width - 44;
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
    if (s.key === state.selectedSubject) out += `<rect class="sel" x="0" y="${i * rowH}" width="${width}" height="${rowH}" rx="8"/>`;
  });
  for (const tick of [0, L.PASS_GRADE, L.MAX_GRADE]) {
    out += `<line class="grid" x1="${x(tick)}" x2="${x(tick)}" y1="0" y2="${plotBottom}"/>`;
    out += `<text class="axis" x="${x(tick)}" y="${plotBottom + 16}" text-anchor="middle">${tick === L.PASS_GRADE ? "5 aprobado" : tick}</text>`;
  }
  subjects.forEach((s, i) => {
    const cy = i * rowH + rowH / 2;
    const end = Math.max(x0 + 1, x(s.average));
    const r = Math.min(4, end - x0);
    const top = cy - 8;
    const bottom = cy + 8;
    // Base recta en el 0 y extremo redondeado.
    out += `<path class="bar" d="M${x0},${top} H${end - r} Q${end},${top} ${end},${top + r} V${bottom - r} Q${end},${bottom} ${end - r},${bottom} H${x0} Z"/>`;
    out += `<text x="0" y="${cy + 5}">${esc(fit(s.name))}</text>`;
    out += `<text class="value" x="${end + 6}" y="${cy + 5}">${L.fmtGrade(s.average)}</text>`;
    out += `<rect class="hit" data-subject="${esc(s.key)}" x="0" y="${i * rowH}" width="${width}" height="${rowH}"><title>${esc(s.name)}: ${L.fmtGrade(s.average)}</title></rect>`;
  });
  out += `</svg>`;
  box.innerHTML = out;

  const sel = subjects.find((s) => s.key === state.selectedSubject);
  $("#chart-detail").innerHTML = sel
    ? `<span style="color:var(--text)">${esc(sel.name)}: ${sel.grades.length} ${sel.grades.length === 1 ? "nota" : "notas"} (${sel.grades
        .map((g) => L.fmtGrade(g.value)).join(" · ")}) → media ${L.fmtGrade(sel.average)}, ${L.gradeLabel(sel.average).toLowerCase()}</span>`
    : "Toca una barra para ver sus notas.";
}

function openGradeEditor(grade, presetSubject = "") {
  const g = grade || { subject: presetSubject, value: null, description: "", date: today() };
  const known = L.bySubject(state.grades).map((s) => s.name);
  const root = overlay(`
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="gr-title">
      <div class="bar">
        <button class="icon-btn" data-close aria-label="Cerrar">${svg("close")}</button>
        <h2 id="gr-title">${grade ? "Editar nota" : "Nueva nota"}</h2>
        <button class="btn text" type="submit" form="grade-form" id="save">Guardar</button>
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
    const data = { app: "MiPanel", version: 1, createdAt: Date.now(), tasks: state.tasks, grades: state.grades };
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
  items.forEach(([label, fn]) => {
    const b = document.createElement("button");
    b.type = "button";
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
      state.selectedSubject = state.selectedSubject === hit.dataset.subject ? null : hit.dataset.subject;
      drawChart(L.bySubject(state.grades));
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
      items.push(["Borrar", () => deleteTask(id)]);
      if (openMenuEl) closeMenu();
      else showMenu(el, items);
      break;
    }
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

addEventListener("online", updateNetwork);
addEventListener("offline", updateNetwork);
navigator.connection?.addEventListener("change", updateNetwork);

let resizeTimer = 0;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => state.tab === "notas" && drawChart(L.bySubject(state.grades)), 150);
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
if (!["estado", "tareas", "notas"].includes(state.tab)) state.tab = "estado";
if (ARTIFACT) initCloud();
else loadData();
render();
initBattery();
initDevice();

if (!ARTIFACT && "serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// Para los tests automáticos.
window.__miPanel = { state, render };
