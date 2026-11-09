import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const [indexHtml, app, styles, redesign] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
]);

test("weekly view is the only task workspace", () => {
  assert.match(indexHtml, /id="tasksEyebrow"/);
  assert.match(indexHtml, /id="taskStatusFilter"[^>]*hidden/);
  assert.match(indexHtml, /id="addInternalTaskButton" class="primary-button"/);
  assert.doesNotMatch(indexHtml, /taskDayModeLabel|Meu dia/);
  assert.match(indexHtml, /id="taskWeekOutsideSummary"/);
  assert.match(app, /renderTaskCalendar\(items\)\s*\{\s*el\.taskCenterList\.innerHTML = renderTaskWeekBoard\(items\);\s*\}/);
  assert.match(app, /nextDate\.setDate\(nextDate\.getDate\(\) \+ \(direction \* 7\)\)/);
  assert.match(redesign, /grid-template-columns:\s*repeat\(6, minmax\(145px, 1fr\)\)/);
  assert.match(redesign, /min-width:\s*910px/);
});

test("weekly columns provide completion, full titles and date-prefilled creation", () => {
  assert.match(app, /data-add-task-for-date/);
  assert.match(app, /openInternalTaskDialog\(null, \{ dueDate: button\.dataset\.addTaskForDate/);
  assert.match(app, /data-toggle-week-task-completion/);
  assert.match(app, /data-open-week-task/);
  assert.match(app, /dayItems\.map\(renderTaskWeekCard\)/);
  assert.match(redesign, /\.task-week-open strong[\s\S]*overflow-wrap:\s*anywhere[\s\S]*white-space:\s*normal/);
  assert.match(redesign, /\.task-week-card\.overdue[\s\S]*#c62828/);
});

test("Saturday and Sunday share one column but keep separate creation and drag dates", () => {
  const dates = Array.from({ length: 7 }, (_, index) => new Date(2026, 10, 9 + index, 12));
  const context = vm.createContext({
    activeTaskDate: dates[0],
    weekDays: () => dates,
    localDateKey: (date = dates[0]) => date.toISOString().slice(0, 10),
    weekdayLabel: () => "SEG",
    items: [{ date: "2026-11-14" }, { date: "2026-11-15" }],
    taskWeekCardSorter: () => 0,
    renderTaskWeekCard: (item) => item.weekendLabel,
  });
  vm.runInContext(app.slice(app.indexOf("function renderTaskWeekBoard("), app.indexOf("function taskWeekCardSorter(")), context);
  const html = vm.runInContext("renderTaskWeekBoard(items)", context);
  assert.equal((html.match(/<section class="task-day-column/g) || []).length, 6);
  assert.equal((html.match(/data-task-drop-date=/g) || []).length, 7);
  assert.match(html, /data-task-drop-date="2026-11-14"[^>]*>\s*Sáb 14/);
  assert.match(html, /data-task-drop-date="2026-11-15"[^>]*>\s*Dom 15/);
  assert.match(html, /data-add-task-for-date="2026-11-14" aria-label="Adicionar tarefa para sábado"/);
  assert.match(html, /data-add-task-for-date="2026-11-15" aria-label="Adicionar tarefa para domingo"/);
});

test("weekly progress includes all current-week tasks and ignores the week being browsed", () => {
  const context = vm.createContext({
    activeTaskDate: new Date(2026, 10, 16),
    today: new Date(2026, 9, 29),
    weekDays: (date) => {
      assert.equal(date.getDate(), 29);
      return Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 26 + i, 12));
    },
    localDateKey: (date) => date.toISOString().slice(0, 10),
    items: [
      { kind: "Tarefa", urgency: "done", date: "2026-10-26" },
      { kind: "Tarefa interna", urgency: "open", date: "2026-11-01" },
      { kind: "Tarefa", urgency: "done", date: "2026-11-02" },
      { kind: "Reunião", urgency: "open", date: "2026-10-28" },
    ],
  });
  vm.runInContext(app.slice(app.indexOf("function taskWeekProgress("), app.indexOf("function renderTaskOverview(")), context);
  const stats = vm.runInContext("JSON.stringify(taskWeekProgress(items, today))", context);
  assert.deepEqual(JSON.parse(stats), { total: 2, completed: 1, period: "26 out a 1 nov" });
});

test("task creation requires a real date and a nonempty weekday for weekly recurrence", () => {
  const context = vm.createContext({
    localDateKey: () => "2026-11-09",
    TASK_RECURRENCE: { normalize: (value) => value },
  });
  const validation = app.slice(app.indexOf("function taskEditorCanSave("), app.indexOf("function bindTaskEditorValidation("));
  const dates = app.slice(app.indexOf("function isValidTaskDueDate("), app.indexOf("function createNextRecurringTask("));
  vm.runInContext(validation + dates, context);
  assert.equal(vm.runInContext('taskEditorCanSave("Tarefa", "")', context), false);
  assert.equal(vm.runInContext('taskEditorCanSave("Tarefa", "2026-02-30")', context), false);
  assert.equal(vm.runInContext('taskEditorCanSave("  ", "2026-11-09")', context), false);
  assert.equal(vm.runInContext('taskEditorCanSave("Tarefa", "2026-11-09", "semanal", "")', context), false);
  assert.equal(vm.runInContext('taskEditorCanSave("Tarefa", "2026-11-09", "semanal", "0")', context), true);
  assert.equal(vm.runInContext('taskRecurrenceFromEditorValues({ recurrenceFrequency: "semanal", recurrenceWeekdays: "" }).diasSemana.length', context), 0);
  assert.equal(vm.runInContext('taskDueDateWithFallback({createdAt: "2026-08-21T12:00:00Z"})', context), "2026-08-21");
  assert.equal(vm.runInContext("taskDueDateWithFallback({})", context), "2026-11-09");
});

test("a weekly drop accepts only a card from the same board and clears drag feedback", () => {
  const makeClassList = () => {
    const classes = new Set();
    return { add: (key) => classes.add(key), remove: (key) => classes.delete(key), has: (key) => classes.has(key) };
  };
  const handlers = {};
  const board = { addEventListener(name, handler) { handlers[name] = handler; }, classList: makeClassList() };
  const moves = [];
  const context = vm.createContext({
    el: { taskCenterList: { querySelector: () => board } },
    rescheduleWeekTask: (...args) => moves.push(args),
  });
  vm.runInContext(app.slice(app.indexOf("function bindTaskWeekDragAndDrop("), app.indexOf("function rescheduleWeekTask(")), context);
  vm.runInContext("bindTaskWeekDragAndDrop()", context);

  function column(date) {
    return { dataset: { taskDropDate: date }, classList: makeClassList(), closest: () => null };
  }
  const origin = column("2026-11-06");
  const destination = column("2026-11-07");
  const card = {
    classList: makeClassList(),
    dataset: { taskDragKey: "internal-task:t1" },
    closest: (selector) => selector === "[data-task-drop-date]" ? origin : card,
  };
  const event = (target) => ({
    target,
    preventDefault() { this.prevented = true; },
    dataTransfer: { setData() {} },
  });
  const over = (day) => event({ closest: () => day });

  handlers.drop(over(destination));
  assert.deepEqual(moves, []);
  handlers.dragstart(event(card));
  const sourceOver = over(origin);
  handlers.dragover(sourceOver);
  assert.equal(sourceOver.prevented, undefined);
  const destinationOver = over(destination);
  handlers.dragover(destinationOver);
  assert.equal(destinationOver.prevented, true);
  assert.equal(destination.classList.has("is-drop-target"), true);
  handlers.drop(destinationOver);
  assert.deepEqual(moves, [["internal-task:t1", "2026-11-07"]]);
  assert.equal(destination.classList.has("is-drop-target"), false);
  assert.equal(board.classList.has("is-dragging"), false);

  handlers.dragstart(event(card));
  handlers.dragover(over(destination));
  handlers.dragend();
  handlers.drop(over(destination));
  assert.equal(moves.length, 1);
  assert.equal(destination.classList.has("is-drop-target"), false);
});

test("moving a task changes its shared due date, keeps its recurrence and saves its history", () => {
  const rule = { frequencia: "semanal", diasSemana: [4] };
  const record = { title: "Verificar guias", dueDate: "2026-11-06", recorrencia: rule, status: "Concluída", completedAt: "2026-11-06T11:00:00Z" };
  const client = { id: "c1", tasks: [record] };
  const item = { clientId: "c1" };
  const timeline = [];
  const activity = [];
  const start = app.indexOf("function rescheduleWeekTask(");
  const apply = app.indexOf("function applyTaskDetailChanges(");
  const scroll = { scrollLeft: 180 };
  let saves = 0;
  let renders = 0;
  let kind = "task";
  const context = vm.createContext({
    activeTaskDate: "2026-11-06",
    weekDays: () => ["2026-11-06", "2026-11-07"],
    localDateKey: (day) => day,
    taskItemFromKey: () => item,
    taskRecordContext: () => ({ kind, record, client }),
    el: { taskCenterList: { querySelector: () => scroll } },
    formatDate: (value) => value.split("-").reverse().join("/"),
    appendTaskHistory: (_, text) => timeline.push(text),
    addHistoryEntry: (_, title, details) => timeline.push(title, ...details),
    recordActivity: (...args) => activity.push(args),
    taskActivityOptions: (task) => ({ dueDate: task.dueDate }),
    saveState: () => { saves++; },
    renderTaskCenter: () => { renders++; scroll.scrollLeft = 0; },
    renderUpdates() {},
  });
  vm.runInContext(app.slice(start, app.indexOf("function taskItemKey(", start))
    + app.slice(apply, app.indexOf("function toggleTaskCenterItemCompletion(", apply)), context);
  assert.equal(vm.runInContext('rescheduleWeekTask("test", "2026-11-06")', context), false);
  assert.equal(vm.runInContext('rescheduleWeekTask("test", "2026-11-08")', context), false);
  assert.equal(vm.runInContext('rescheduleWeekTask("test", "2026-11-07")', context), true);
  assert.equal(client.tasks[0].dueDate, "2026-11-07");
  assert.equal(record.recorrencia, rule);
  assert.equal(record.completedAt, "2026-11-06T11:00:00Z");
  assert.match(timeline[0], /06\/11\/2026 para 07\/11\/2026/);
  assert.equal(client.updatedAt, record.updatedAt);
  assert.equal(activity[0][3].dueDate, "2026-11-07");
  assert.equal(scroll.scrollLeft, 180);
  kind = "deadline";
  assert.equal(vm.runInContext('rescheduleWeekTask("test", "2026-11-06")', context), false);
  assert.equal(saves, 1);
  assert.equal(renders, 1);
});

test("overdue and stalled task signals use the urgent red treatment", () => {
  assert.match(app, /task-work-panel \$\{key\} \$\{items\.length \? "has-items" : "is-empty"\}/);
  assert.match(redesign, /\.task-stat-heading em[\s\S]*?background:\s*var\(--red\)/);
  assert.match(redesign, /\.task-work-panel\.overdue\.has-items \.task-panel-title[\s\S]*?color:\s*var\(--red\)/);
  assert.match(redesign, /\.task-table-row\.overdue[\s\S]*?border-left-color:\s*var\(--red\)[\s\S]*?background:\s*#fff7f7/);
  assert.match(redesign, /\.task-row-date\.overdue[\s\S]*?color:\s*var\(--red\)/);
  assert.match(redesign, /\.task-waiting-age[\s\S]*?color:\s*var\(--red\)/);
});

test("legacy waiting tasks are normalized and their urgency follows the due date", () => {
  assert.doesNotMatch(app, /isWaitingTaskStatus\(item\.status\)\) return "waiting"/);
  assert.match(app, /isWaitingTaskStatus\(label\)\) return "Em andamento"/);
  assert.doesNotMatch(indexHtml, /<option value="Aguardando (?:cliente|terceiro)">/);
});

test("task details use a right drawer with explicit draft saving", () => {
  assert.match(indexHtml, /id="taskDetailOverlay"/);
  assert.match(indexHtml, /id="taskDetailDrawer"/);
  assert.match(app, /function renderTaskDetailDrawer\(\)/);
  assert.match(app, /function saveTaskDrawerChanges\(\)/);
  assert.match(app, /Alterações não salvas/);
  assert.match(app, /Descrição atualizada/);
  assert.match(app, /Prazo alterado para/);
  assert.match(app, /Responsável alterado para/);
  assert.match(app, /Prioridade alterada para/);
  assert.match(redesign, /\.task-detail-overlay[\s\S]*rgba\(34, 34, 34, 0\.32\)/);
  assert.match(redesign, /width:\s*min\(480px, 100vw\)/);
});

test("task annotations and recurrence completion stay on the shared task record", () => {
  assert.match(app, /annotations:\s*normalizeTaskAnnotations/);
  assert.match(app, /history:\s*normalizeTaskHistory/);
  assert.match(app, /function registerTaskDrawerAnnotation/);
  assert.match(app, /createNextRecurringTask\(record/);
  assert.match(app, /Criada automaticamente pela repetição/);
  assert.match(app, /proximaGerada/);
});
