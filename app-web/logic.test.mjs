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
