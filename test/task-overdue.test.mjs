import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const localDateKey = (date = new Date(2026, 10, 11, 12)) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
const today = new Date(2026, 10, 11, 12);
class TestDate extends Date {
  constructor(...args) {
    super(...(args.length ? args : [today.getTime()]));
  }
}

function task(id, date, ownerId = "mayssa", extras = {}) {
  return { id, title: `Tarefa ${id}`, date, ownerId, kind: "Tarefa", urgency: "overdue", ...extras };
}

function overdueContext(overrides = {}) {
  const context = vm.createContext({
    Date: TestDate,
    localDateKey,
    activeTaskDate: new Date(2026, 10, 23, 12),
    expandedOverdueOwners: new Set(),
    movingOverdueTasks: false,
    ...overrides,
  });
  const start = app.indexOf("function isOpenTaskBefore(");
  const week = app.indexOf("function startOfWeek(");
  vm.runInContext(app.slice(start, app.indexOf("function taskWeekRangeLabel(", start))
    + app.slice(week, app.indexOf("function monthCalendarDays(", week)), context);
  return context;
}

test("the overdue backlog uses the real current week, includes waiting tasks, and sorts by due date", () => {
  const items = [
    task("sun", "2026-11-08"),
    task("mon", "2026-11-09"),
    task("waiting", "2026-10-28", "camilli", { urgency: "waiting" }),
    task("done", "2026-10-27", "mayssa", { urgency: "done" }),
    task("deadline", "2026-10-27", "mayssa", { kind: "Prazo" }),
    task("undated", ""),
  ];
  const context = overdueContext({ items });
  assert.equal(vm.runInContext("tasksOverdueBeforeCurrentWeek(items).map(item => item.id).join(',')", context), "waiting,sun");
  assert.equal(vm.runInContext("items.filter(item => isOpenTaskBefore(item, localDateKey())).length", context), 3);
});

test("overdue columns include an empty owner, paginate independently, and honor owner selection", () => {
  const items = Array.from({ length: 6 }, (_, i) => task(String(i + 1), "2026-11-03"));
  const owners = { mayssa: "Mayssa", camilli: "Camilli" };
  const el = { taskOwnerFilter: { value: "" }, taskOverdueWorkspace: { innerHTML: "" } };
  const context = overdueContext({
    el, items, taskMineOnly: false, currentUser: { id: "mayssa" },
    state: { users: Object.keys(owners).map((id) => ({ id })) },
    ownerName: (id) => owners[id],
    taskOwnerClass: String, taskOwnerAvatar: () => "",
    escapeAttr: String, escapeHtml: String,
    taskItemKey: (item) => item.id, taskItemContext: () => "Cliente teste",
    taskDayDistance: () => -8, privacyModeEnabled: false,
  });
  const html = () => el.taskOverdueWorkspace.innerHTML;
  vm.runInContext("renderOverdueTaskBlock(items)", context);
  assert.equal(html().match(/class="task-overdue-row"/g).length, 5);
  assert.match(html(), /Camilli[\s\S]*em dia[\s\S]*Nada atrasado\./);
  assert.match(html(), /Ver todas \(6\)/);
  vm.runInContext("expandedOverdueOwners.add('mayssa'); renderOverdueTaskBlock(items)", context);
  assert.equal(html().match(/class="task-overdue-row"/g).length, 6);
  assert.match(html(), /Mostrar menos/);
  el.taskOwnerFilter.value = "mayssa";
  vm.runInContext("renderOverdueTaskBlock(items)", context);
  assert.doesNotMatch(html(), /Camilli/);
  vm.runInContext("el.taskOwnerFilter.value = ''; taskMineOnly = true; renderOverdueTaskBlock(items)", context);
  assert.doesNotMatch(html(), /Camilli/);
  vm.runInContext("privacyModeEnabled = true; renderOverdueTaskBlock(items)", context);
  assert.doesNotMatch(html(), /Cliente teste|Tarefa 1/);
  vm.runInContext("renderOverdueTaskBlock([])", context);
  assert.equal(html(), "");
});

test("bring all saves the filtered backlog in bounded batches without changing other dates", async () => {
  const items = [
    ...Array.from({ length: 43 }, (_, i) => task(String(i), "2026-11-02")),
    task("other-owner", "2026-11-02", "camilli"),
    task("this-week", "2026-11-09"),
    task("already-done", "2026-11-02", "mayssa", { urgency: "done" }),
  ];
  const records = new Map(items.map((item) => [item.id, { dueDate: item.date, status: "Pendente" }]));
  const el = {
    taskOverdueWorkspace: { setAttribute() {}, removeAttribute() {}, querySelectorAll: () => [] },
    taskOverdueStatus: {},
  };
  const batches = [];
  let pending = 0;
  const context = overdueContext({
    el, taskCenterItems: () => items,
    filterTaskCenterItems: (rows) => rows.filter((item) => item.ownerId === "mayssa"),
    taskItemKey: (item) => item.id,
    taskRecordContext: (item) => ({ kind: "task", record: records.get(item.id) }),
    isCompletedTaskStatus: () => false,
    changeTaskDueDate: (_, { record }, date, options) => {
      assert.equal(options.deferSave, true);
      record.dueDate = date;
      pending++;
    },
    saveState: () => { batches.push(pending); pending = 0; },
    flushCloudState: async () => {},
    renderTaskCenter() {}, renderUpdates() {},
  });
  await vm.runInContext("moveOverdueTasksToToday()", context);
  assert.deepEqual(batches, [20, 20, 3]);
  assert.equal([...records.values()].filter((record) => record.dueDate === "2026-11-11").length, 43);
  assert.equal(records.get("this-week").dueDate, "2026-11-09");
  assert.equal(records.get("other-owner").dueDate, "2026-11-02");
  assert.equal(localDateKey(context.activeTaskDate), "2026-11-11");
  assert.equal(el.taskOverdueStatus.textContent, "43 tarefas trazidas para hoje.");
});
