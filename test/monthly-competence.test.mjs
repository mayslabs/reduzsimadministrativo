import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const between = (first, last) => app.slice(app.indexOf(`function ${first}(`), app.indexOf(`function ${last}(`));

function fixture() {
  let nextId = 0;
  const f = vm.createContext({
    currentMonthKey: () => "2026-11", id: () => `month-${++nextId}`,
    activeClient: { monthly: [] }, renderMonthlyTable() {},
  });
  vm.runInContext(between("addMonthlyRow", "normalizeMonthRow"), f);
  return f;
}

test("monthly records require a real month and year and cannot duplicate another row", () => {
  const f = fixture();
  for (const value of ["", null, undefined, "2026-00", "2026-13", "0000-11", "2026-1", "NaN-NaN", 202611]) {
    assert.equal(f.isValidMonthlyCompetence(value), false);
    assert.match(f.monthlyCompetenceError(value, "row"), /mês e o ano/);
  }
  assert.equal(f.isValidMonthlyCompetence("2026-11"), true);
  assert.equal(f.monthlyCompetenceError("2026-11", "self", [{ id: "self", month: "2026-11" }]), "");
  assert.match(f.monthlyCompetenceError("2026-11", "new", [{ id: "old", month: "2026-11" }]), /já está cadastrada/);
  assert.throws(() => f.emptyMonth(""), /competencia/);
  assert.equal(f.emptyMonth().month, "2026-11");
});

test("adding a month uses a valid default and crosses December without creating an empty row", () => {
  const f = fixture();
  f.activeClient.startDate = "invalid";
  f.addMonthlyRow();
  assert.equal(f.activeClient.monthly[0].month, "2026-11");
  f.activeClient.monthly = [{ id: "existing", month: "2026-12" }, { id: "legacy", month: "" }];
  f.addMonthlyRow();
  assert.equal(f.activeClient.monthly.at(-1).month, "2027-01");
  assert.equal(f.activeClient.monthly.length, 3);
  assert.equal(f.activeClient.monthly[1].month, "");
});

test("clearing or duplicating the competence never replaces the saved row month", () => {
  const f = fixture();
  const row = { id: "r1", month: "2026-11" };
  f.activeClient.monthly = [row];
  const listeners = {};
  const input = {
    value: row.month, type: "month", dataset: { monthField: "month" }, attributes: {}, label: {}, reports: 0,
    addEventListener: (type, handler) => { listeners[type] = handler; },
    setCustomValidity(text) { this.error = text; },
    setAttribute(name, value) { this.attributes[name] = value; },
    closest() { return { querySelector: () => this.label }; },
    reportValidity() { this.reports++; },
  };
  Object.assign(f, {
    el: { monthlyTable: { innerHTML: "" } },
    document: { querySelectorAll: (selector) => selector === "[data-month-row]" ? [{ dataset: { monthRow: "r1" }, querySelectorAll: () => [input] }] : [] },
    monthlyStatusProgress: () => ({ done: false, doneCount: 0, total: 6 }),
    monthlyMonthLabel: (value) => value || "Selecionar mês", MONTHLY_BOOLEAN_FIELDS: [],
    escapeHtml: String, escapeAttr: String, renderMonthlyRangeSummary() {}, renderMonthlyProgressList() {}, syncMonthlyBulkToggles() {}, refreshIcons() {},
  });
  vm.runInContext(between("renderMonthlyTable", "monthlyMonthLabel"), f);
  f.renderMonthlyTable();
  assert.match(f.el.monthlyTable.innerHTML, /type="month" required/);
  input.value = "";
  listeners.input();
  listeners.change();
  assert.equal(row.month, "2026-11");
  assert.equal(input.dataset.monthEdited, "true");
  assert.equal(input.attributes["aria-invalid"], "true");
  assert.equal(input.reports, 1);
  f.activeClient.monthly.push({ id: "r2", month: "2026-12" });
  input.value = "2026-12";
  listeners.change();
  assert.equal(row.month, "2026-11");
  assert.match(input.error, /já está cadastrada/);
  f.activeClient.monthly.pop();
  input.value = "2027-01";
  listeners.change();
  assert.equal(row.month, "2027-01");
  assert.equal(input.error, "");
  assert.doesNotMatch(f.el.monthlyTable.innerHTML, /Sem ano/);
});

test("an invalid competence draft is reported before a card can be saved", async () => {
  let reports = 0;
  const tabs = [];
  const f = vm.createContext({
    activeClient: { id: "client" },
    el: { clientDialog: { querySelector: () => ({ reportValidity() { reports++; } }) } },
    switchTab: (tab) => tabs.push(tab),
    commitActiveClientToState() { assert.fail("Invalid competence cannot be saved"); },
  });
  vm.runInContext(app.slice(app.indexOf("async function persistActiveClient("), app.indexOf("function saveActiveClient(")), f);
  assert.equal(await f.persistActiveClient(), false);
  assert.equal(reports, 1);
  assert.deepEqual(tabs, ["monthlyTab"]);
});
