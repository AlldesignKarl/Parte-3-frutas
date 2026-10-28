// node --test app-web/logic.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as L from "./logic.js";

const today = "2026-10-26";
const study = (total, done = 0, examIn = 5) => ({
  id: "t", title: "Historia", notes: "", examDate: examIn == null ? null : L.addDays(today, examIn),
  totalPages: total, pagesDone: done, createdAt: 0, completedAt: null, dailyLog: {},
});

test("páginas al día", () => {
  const t = study(100, 20, 4);
  assert.equal(L.goalToday(t, today), 20);
  const after = L.withPagesAdded(t, 15, today, 1);
  assert.equal(L.goalToday(after, today), 20);
  assert.equal(L.pagesOn(after, today), 15);
  assert.equal(L.goalToday(study(50, 20, 0), today), 30);
  assert.equal(L.goalToday(study(50, 20, -1), today), null);
});

test("terminar y reabrir", () => {
  const done = L.withPagesAdded(study(10, 8), 5, today, 42);
  assert.equal(done.pagesDone, 10);
  assert.equal(done.completedAt, 42);
  assert.equal(L.withPagesDone(done, 7, today, 50).completedAt, null);
});

test("orden y resumen", () => {
  const a = { ...study(100, 0, 10), id: "a" };
  const b = { ...study(100, 0, 2), id: "b" };
  const c = { ...study(100, 0, null), id: "c" };
  assert.deepEqual(L.pendingSorted([a, b, c]).map((x) => x.id), ["b", "a", "c"]);
  const historia = L.withPagesAdded(study(100, 20, 4), 5, today, 1);
  const mates = { ...study(30, 0, 1), id: "m" };
  assert.deepEqual(L.dayOverview([historia, mates], today), { pagesToday: 5, goalToday: 50 });
});

test("medias de notas", () => {
  const g = (subject, value, createdAt) => ({ id: String(createdAt), subject, value, description: "", date: today, createdAt });
  const subjects = L.bySubject([g("Matemáticas", 4, 1), g(" matematicas ", 5, 2), g("Historia", 7, 3), g("Historia", 8, 4), g("Historia", 8, 5)]);
  assert.deepEqual(subjects.map((s) => s.name), ["Historia", "Matemáticas"]);
  assert.equal(L.fmtGrade(subjects[1].average), "4,5");
  assert.equal(L.fmtGrade(subjects[0].average), "7,67");
  const names = L.bySubject([g("Ingles", 7, 6), g("fisica y quimica", 6, 7), g("MATEMATICAS", 5, 8), g("Lengua", 8, 9)]).map((s) => s.name);
  assert.deepEqual(names, ["Física y química", "Inglés", "Lengua", "MATEMÁTICAS"]);
  assert.equal(L.withAccents("Tecnologia de Ingles"), "Tecnología de Inglés");
  assert.equal(L.withAccents("Inglés tecnico"), "Inglés tecnico"); // si ya lleva tildes, se respeta
  assert.equal(L.parseGrade("4,5"), 4.5);
  assert.equal(L.parseGrade("11"), null);
  assert.equal(L.gradeLabel(4.5), "Suspenso");
});

test("formatos", () => {
  assert.equal(L.fmtDateShort(today), "lun 26 oct");
  assert.equal(L.fmtDuration(135 * 60000), "2 h 15 min");
});

test("semana, racha y exámenes", () => {
  const t = { ...study(40, 10, 3), dailyLog: { [today]: 5, [L.addDays(today, -1)]: 3, [L.addDays(today, -2)]: 4, [L.addDays(today, -4)]: 2 } };
  const week = L.studyByDay([t], 7, today, { [L.addDays(today, -3)]: 25 });
  assert.equal(week.length, 7);
  assert.equal(week[6].date, today);
  assert.equal(week[6].pages, 5);
  assert.equal(week[3].minutes, 25);
  // Hoy, ayer, anteayer (páginas) y hace 3 días (foco) seguidos; hace 4 también: 5 días
  assert.equal(L.studyStreak([t], today, { [L.addDays(today, -3)]: 25 }), 5);
  // Sin el foco de hace 3 días la racha se corta en 3
  assert.equal(L.studyStreak([t], today), 3);
  const exams = L.upcomingExams([{ ...study(10, 0, 9), id: "x" }, { ...study(10, 0, 2), id: "y" }, { ...study(10, 0, -1), id: "z" }], today);
  assert.deepEqual(exams.map((e) => e.id), ["y", "x"]);
  assert.equal(L.weekdayLetter(today), "L");
});

test("qué necesito sacar", () => {
  const g = (value, i) => ({ id: String(i), subject: "Mates", value, description: "", date: today, createdAt: i });
  const [mates] = L.bySubject([g(4, 1), g(5, 2)]);
  assert.deepEqual(L.neededGrade(mates, 5), { needed: 6, status: "ok" });
  assert.equal(L.neededGrade(mates, 9).status, "impossible");
  const [buena] = L.bySubject([g(9, 1), g(10, 2)]);
  assert.equal(L.neededGrade(buena, 5).status, "done");
});

test("evolución y modelo", () => {
  const g = (subject, value, date, i) => ({ id: String(i), subject, value, description: "", date, createdAt: i });
  const line = L.averageTimeline([g("Mates", 4, "2026-10-01", 1), g("Historia", 8, "2026-10-03", 2), g("Mates", 5, "2026-10-05", 3)]);
  assert.deepEqual(line.map((p) => p.value), [4, 6, 6.25]);
  assert.equal(L.friendlyModel("SM-S926B"), "Samsung Galaxy S24+");
  assert.equal(L.friendlyModel("SM-A546B"), "Samsung Galaxy A54 5G");
  assert.equal(L.friendlyModel("Pixel 8"), null);
});

test("tiempo de batería calculado por la app", () => {
  const min = 60000;
  let log = L.addBatterySample(null, 0.49, true, 0);
  assert.equal(L.batteryEstimate(log, 0.49, true), null);
  log = L.addBatterySample(log, 0.50, true, 0.5 * min); // primer cambio (desde aquí se mide)
  log = L.addBatterySample(log, 0.50, true, 1 * min); // mismo nivel: no se apunta
  assert.equal(log.samples.length, 2);
  assert.equal(L.batteryEstimate(log, 0.50, true), null);
  log = L.addBatterySample(log, 0.52, true, 2.5 * min); // +2 % en 2 min → 1 % por minuto
  assert.equal(Math.round(L.batteryEstimate(log, 0.52, true) / min), 48);
  // Al desenchufar empieza de cero
  log = L.addBatterySample(log, 0.52, false, 3 * min);
  assert.equal(log.samples.length, 1);
  log = L.addBatterySample(log, 0.51, false, 10 * min);
  log = L.addBatterySample(log, 0.50, false, 20 * min); // -1 % cada 10 min
  assert.equal(Math.round(L.batteryEstimate(log, 0.50, false) / min), 500);
  // Una lectura de hace más de 2 h no vale
  assert.equal(L.addBatterySample(log, 0.40, false, 200 * min).samples.length, 1);
});

test("horario: clase de ahora, la siguiente y el próximo día con clase", () => {
  const c = (id, day, start, end, subject) => ({ id, day, start, end, subject, room: "" });
  const schedule = [c("a", 1, "09:25", "10:20", "Inglés"), c("b", 1, "08:30", "09:25", "Matemáticas"), c("c", 3, "08:30", "09:25", "Lengua")];
  assert.equal(L.isoWeekday("2026-10-26"), 1); // lunes
  assert.equal(L.isoWeekday("2026-11-01"), 7); // domingo
  assert.deepEqual(L.classesOn(schedule, 1).map((x) => x.id), ["b", "a"]);
  let s = L.classStatus(schedule, 1, L.toMinutes("09:00"));
  assert.equal(s.current.subject, "Matemáticas");
  assert.equal(s.next.subject, "Inglés");
  s = L.classStatus(schedule, 1, L.toMinutes("09:25")); // justo al cambiar de clase
  assert.equal(s.current.subject, "Inglés");
  assert.equal(s.next, null);
  s = L.classStatus(schedule, 1, L.toMinutes("07:00"));
  assert.equal(s.current, null);
  assert.equal(s.next.subject, "Matemáticas");
  assert.deepEqual(L.nextSchoolDay(schedule, 1), { day: 3, offset: 2, first: schedule[2] });
  assert.equal(L.nextSchoolDay(schedule, 3).day, 1); // del miércoles al lunes siguiente
  assert.equal(L.nextSchoolDay([], 1), null);
  assert.equal(L.fmtHour("08:05"), "8:05");
});

test("logros: salen de lo apuntado y la racha más larga cuenta páginas y foco", () => {
  const task = (id, done, pages, examDate, completedAt, dailyLog) =>
    ({ id, title: id, totalPages: 100, pagesDone: pages, examDate, completedAt: done ? completedAt : null, dailyLog, createdAt: 1 });
  const at = (iso) => L.isoToDate(iso).getTime() + 12 * 3600000;
  const tasks = [
    task("a", true, 30, "2026-10-20", at("2026-10-18"), { "2026-10-10": 10, "2026-10-11": 20 }),
    task("b", false, 25, null, null, { "2026-10-13": 25 }),
  ];
  const focus = { "2026-10-12": 30, "2026-10-20": 0 };
  assert.equal(L.bestStreak(tasks, focus), 4); // del 10 al 13 (el 12 solo con foco)
  const list = L.achievements(tasks, [{ id: "g", subject: "Inglés", value: 9.5, date: "2026-10-01", createdAt: 1 }], focus);
  const get = (id) => list.find((x) => x.id === id);
  assert.equal(get("tarea-1").done, true);
  assert.equal(get("a-tiempo").done, true);
  assert.equal(get("paginas-50").done, true); // 30 + 25
  assert.deepEqual([get("paginas-250").cur, get("paginas-250").done], [55, false]);
  assert.equal(get("racha-3").done, true);
  assert.equal(get("racha-7").done, false);
  assert.equal(get("foco-25").done, true);
  assert.equal(get("nota-9").done, true);
  assert.equal(get("nota-10").done, false);
  assert.equal(get("aprobado").done, false); // hace falta un mínimo de 3 asignaturas
  assert.equal(L.achievements([], [], {}).filter((x) => x.done).length, 0);
});

test("tiempo: códigos de la OMM", () => {
  assert.equal(L.weatherInfo(0, true).label, "Despejado");
  assert.equal(L.weatherInfo(0, false).icon, "🌙");
  assert.equal(L.weatherInfo(63).label, "Lluvia");
  assert.equal(L.weatherInfo(95).label, "Tormenta");
  assert.equal(L.weatherInfo(1234).label, "—");
});

test("dinero: importes, totales, resumen del mes y por día", () => {
  assert.equal(L.parseAmount("12,5"), 1250);
  assert.equal(L.parseAmount(" 3 €"), 300);
  assert.equal(L.parseAmount("0,99"), 99);
  assert.equal(L.parseAmount("0"), null);
  assert.equal(L.parseAmount("1,234"), null);
  assert.equal(L.parseAmount("1.234,50"), 123450);
  assert.equal(L.parseAmount("12.5"), 1250);
  assert.equal(L.parseAmount("abc"), null);
  assert.equal(L.fmtMoney(123456), "1.234,56 €");
  assert.equal(L.fmtMoney(500, { short: true }), "5 €");
  assert.equal(L.fmtMoney(-250, { sign: true }), "−2,50 €");
  assert.equal(L.fmtMoney(250, { sign: true }), "+2,50 €");
  const e = (id, type, amount, category, date) => ({ id, type, amount, category, date, note: "", createdAt: Number(id) });
  const money = {
    entries: [e("1", "ingreso", 5000, "paga", "2026-10-01"), e("2", "gasto", 1200, "comida", "2026-10-26"),
      e("3", "gasto", 800, "ocio", "2026-10-27"), e("4", "gasto", 300, "comida", "2026-10-27"), e("5", "gasto", 1000, "ropa", "2026-09-30")],
    goals: [{ id: "g", name: "Cascos", emoji: "🎧", target: 6000, saved: 1500, createdAt: 1 }],
    budget: 3000,
  };
  assert.deepEqual(L.moneyTotals(money), { income: 5000, spent: 3300, total: 1700, saved: 1500, available: 200 });
  const m = L.monthSummary(money.entries, "2026-10");
  assert.equal(m.spent, 2300);
  assert.equal(m.income, 5000);
  assert.deepEqual(m.byCat.map((x) => [x.cat.id, x.amount]), [["comida", 1500], ["ocio", 800]]);
  assert.deepEqual(L.spendByDay(money.entries, 3, "2026-10-27").map((d) => d.value), [0, 1200, 1100]);
  assert.deepEqual(L.entriesByDay(money.entries).map((g) => [g.date, g.items.map((x) => x.id)]),
    [["2026-10-27", ["4", "3"]], ["2026-10-26", ["2"]], ["2026-10-01", ["1"]], ["2026-09-30", ["5"]]]);
  assert.equal(L.moneyCat("gasto", "nada").id, "otros");
});

test("cuentas atrás: cumpleaños que se repiten, años que cumple y fechas pasadas", () => {
  const ev = (id, name, date, type) => ({ id, name, date, type, emoji: "" });
  const list = L.upcomingEvents([
    ev("a", "Ana", "2011-11-02", "cumple"),
    ev("b", "Viaje", "2026-12-20", "evento"),
    ev("c", "Examen pasado", "2026-10-01", "evento"),
    ev("d", "Leo", "2012-10-28", "cumple"),
    ev("e", "Bisiesto", "2012-02-29", "cumple"),
  ], "2026-10-28");
  assert.deepEqual(list.map((x) => [x.event.id, x.days, x.turns]), [["d", 0, 14], ["a", 5, 15], ["b", 53, null], ["e", 123, 15]]);
  assert.equal(list[3].date, "2027-02-28");
  assert.equal(L.nextOccurrence(ev("x", "X", "2010-01-05", "cumple"), "2026-10-28"), "2027-01-05");
  assert.equal(L.countdownLabel(0), "¡Hoy!");
  assert.equal(L.countdownLabel(1), "Mañana");
  assert.equal(L.countdownLabel(5), "En 5 días");
  assert.equal(L.countdownLabel(21), "En 3 semanas");
  assert.equal(L.countdownLabel(90), "En 3 meses");
});

test("extracto de Revolut: CSV en inglés y en español, sin repetir y con el saldo", async () => {
  const { parseCsv } = await import("./importers.js");
  const csv = `Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance
TOPUP,Current,2026-10-01 10:00:00,2026-10-01 10:00:05,Top-up by *1234,20.00,0.00,EUR,COMPLETED,25.00
CARD_PAYMENT,Current,2026-10-02 13:10:00,2026-10-03 09:00:00,McDonald's,-7.50,0.00,EUR,COMPLETED,17.50
CARD_PAYMENT,Current,2026-10-04 18:00:00,,Steam,-9.99,0.00,EUR,PENDING,
CARD_PAYMENT,Current,2026-10-05 18:00:00,2026-10-05 18:00:01,"Renfe, Madrid",-2.40,0.10,EUR,COMPLETED,15.00
EXCHANGE,Current,2026-10-06 12:00:00,2026-10-06 12:00:00,Exchanged to USD,-5.00,0.00,USD,COMPLETED,10.00
TRANSFER,Savings,2026-10-07 12:00:00,2026-10-07 12:00:00,To pocket,-3.00,0.00,EUR,COMPLETED,3.00
`;
  const rows = parseCsv(csv);
  assert.equal(rows[4][4], "Renfe, Madrid");
  const r = L.revolutEntries(rows, new Set(), 1000);
  assert.deepEqual(r.entries.map((e) => [e.type, e.amount, e.category, e.date]), [
    ["ingreso", 2000, "paga", "2026-10-01"],
    ["gasto", 750, "comida", "2026-10-03"],
    ["gasto", 250, "transporte", "2026-10-05"],
  ]);
  assert.deepEqual(r.skipped, { repeated: 0, otherCurrency: 2, notDone: 1 });
  assert.deepEqual(r.balance, { balance: 1500, date: "2026-10-05" });
  assert.deepEqual(r.opening, { amount: 500, date: "2026-10-01" });
  // Meter el mismo extracto otra vez no repite nada
  const again = L.revolutEntries(rows, new Set(r.entries.map((e) => e.importId)), 2000);
  assert.equal(again.entries.length, 0);
  assert.equal(again.skipped.repeated, 3);
  // En español, con punto y coma y coma decimal
  const es = parseCsv(`Tipo;Producto;Fecha de inicio;Fecha de finalización;Descripción;Importe;Comisión;Divisa;State;Saldo
Pago con tarjeta;Actual;27/10/2026 14:03;27/10/2026 14:03;Zara;-25,90;0,00;EUR;COMPLETADO;74,10`);
  const r2 = L.revolutEntries(es);
  assert.deepEqual(r2.entries.map((e) => [e.amount, e.category, e.date]), [[2590, "ropa", "2026-10-27"]]);
  assert.throws(() => L.revolutEntries(parseCsv("a,b\n1,2")), /columnas/);
  assert.equal(L.guessCategory("Spotify P1234", false), "movil");
  assert.equal(L.guessCategory("Uber Eats", false), "comida");
});

test("extracto de Revolut en Excel (.xlsx)", async () => {
  const { readXlsx } = await import("./importers.js");
  const { readFileSync } = await import("node:fs");
  const rows = await readXlsx(readFileSync(new URL("./test-data/revolut.xlsx", import.meta.url)));
  assert.equal(rows[0][4], "Description");
  const r = L.revolutEntries(rows);
  assert.deepEqual(r.entries.map((e) => [e.type, e.amount, e.category, e.date]), [
    ["ingreso", 1500, "paga", "2026-10-20"],
    ["gasto", 1299, "ocio", "2026-10-21"],
  ]);
  assert.deepEqual(r.balance, { balance: 3201, date: "2026-10-21" });
});

test("herramientas: QR de WiFi y números al azar", () => {
  assert.deepEqual(L.parseWifiQr("WIFI:T:WPA;S:Mi\\;Casa;P:cl\\:ave;;"), { ssid: "Mi;Casa", password: "cl:ave", type: "WPA" });
  assert.deepEqual(L.parseWifiQr("WIFI:S:Abierta;;"), { ssid: "Abierta", password: "", type: "" });
  assert.equal(L.parseWifiQr("https://example.com"), null);
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const v = L.randomInt(1, 6);
    assert.ok(v >= 1 && v <= 6);
    seen.add(v);
  }
  assert.equal(seen.size, 6);
});
