import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

await import(new URL("../task-recurrence.js", import.meta.url));

const recurrence = globalThis.ReduzSimTaskRecurrence;

test("finds the first monthly occurrence inclusively and advances to the next month", () => {
  const rule = { frequencia: "mensal", dia: 15 };
  assert.equal(recurrence.firstOccurrence(rule, "2026-11-05"), "2026-11-15");
  assert.equal(recurrence.firstOccurrence(rule, "2026-11-15"), "2026-11-15");
  assert.equal(recurrence.nextOccurrence(rule, "2026-11-15"), "2026-12-15");
});

test("uses the last available day when a month is shorter", () => {
  const rule = { frequencia: "mensal", dia: 31 };
  assert.equal(recurrence.firstOccurrence(rule, "2027-02-01"), "2027-02-28");
  assert.equal(recurrence.nextOccurrence(rule, "2027-02-28"), "2027-03-31");
});

test("supports multiple weekdays with Monday represented by zero", () => {
  const rule = { frequencia: "semanal", diasSemana: [0, 2] };
  assert.equal(recurrence.firstOccurrence(rule, "2026-11-05"), "2026-11-09");
  assert.equal(recurrence.nextOccurrence(rule, "2026-11-09"), "2026-11-11");
  assert.equal(recurrence.shortLabel(rule), "Toda seg, qua");
});

test("skips weekends for business-day recurrence", () => {
  const rule = { frequencia: "diaria", soDiasUteis: true };
  assert.equal(recurrence.firstOccurrence(rule, "2026-11-07"), "2026-11-09");
  assert.equal(recurrence.nextOccurrence(rule, "2026-11-06"), "2026-11-09");
  assert.equal(recurrence.shortLabel(rule), "Dias úteis");
});

test("advances annual recurrence and honors its end date", () => {
  const rule = { frequencia: "anual", dia: 15, mes: 2, ate: "2028-12-31" };
  assert.equal(recurrence.firstOccurrence(rule, "2026-11-05"), "2027-03-15");
  assert.equal(recurrence.nextOccurrence(rule, "2027-03-15"), "2028-03-15");
  assert.equal(recurrence.nextOccurrence(rule, "2028-03-15"), "");
  assert.match(recurrence.summary(rule, "2026-11-05"), /próxima: 15\/03\/2027$/);
});

test("task integration persists recurrence and guards automatic generation", async () => {
  const source = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(source, /recorrencia:\s*recurrence/);
  assert.match(source, /if \(!task \|\| !recurrence \|\| task\.proximaGerada\) return null/);
  assert.match(source, /task\.proximaGerada = true/);
  assert.match(source, /createNextRecurringTask\(task, \{ client, clientSource: linked\.source \}\)/);
  assert.match(source, /bindTaskRecurrenceEditorInteractions\(\)/);
});
