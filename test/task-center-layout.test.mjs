import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, app, styles, redesign] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
]);

test("admin-only tasks use a dedicated board in the day view", () => {
  assert.match(app, /openItems\.filter\(\(item\) => item\.visibility === "admin"\)/);
  assert.match(app, /operationalItems = openItems\.filter\(\(item\) => item\.visibility !== "admin"\)/);
  assert.match(app, /Tarefas da administração/);
  assert.match(app, /task-admin-board/);
  assert.match(
    app,
    /task-dashboard-main[\s\S]*Próximas ações[\s\S]*task-admin-board[\s\S]*task-dashboard-side/,
  );
  assert.match(styles, /\.task-work-panel\.admin-only/);
});

test("day view follows the redesigned task hierarchy", () => {
  assert.match(indexHtml, /id="tasksEyebrow"/);
  assert.match(indexHtml, /id="taskStatusFilter"[^>]*hidden/);
  assert.match(indexHtml, /id="addInternalTaskButton" class="primary-button"/);
  assert.match(
    app,
    /task-dashboard-main[\s\S]*"Atrasadas"[\s\S]*dayTitle[\s\S]*"Próximas ações"[\s\S]*"Tarefas da administração"[\s\S]*renderTaskWaitingPanel/,
  );
  assert.match(app, /Cobre quem está devendo resposta\./);
  assert.match(app, /label: "Cliente"[\s\S]*label: "Terceiros"/);
  assert.match(redesign, /grid-template-columns:\s*22px minmax\(0, 1fr\) 34px/);
  assert.match(redesign, /\.task-return-group h4/);
});

test("task center keeps only the my day view", () => {
  assert.match(indexHtml, /id="taskDayModeLabel"[^>]*>Meu dia<\/span>/);
  assert.doesNotMatch(indexHtml, /taskWeekModeButton|taskMonthModeButton/);
  assert.doesNotMatch(app, /activeTaskCalendarMode|setTaskCalendarMode/);
  assert.match(app, /function renderTaskCalendar\(items\)\s*\{\s*el\.taskCenterList\.innerHTML = renderTaskDayBoard\(items\);\s*\}/);
  assert.match(app, /function moveTaskPeriod\(direction\)[\s\S]*nextDate\.setDate\(nextDate\.getDate\(\) \+ direction\)/);
  assert.match(redesign, /#tasksSection \.calendar-mode\.single-mode \.active/);
});

test("overdue and stalled task signals use the urgent red treatment", () => {
  assert.match(app, /task-work-panel \$\{key\} \$\{items\.length \? "has-items" : "is-empty"\}/);
  assert.match(redesign, /\.task-stat-heading em[\s\S]*?background:\s*var\(--red\)/);
  assert.match(redesign, /\.task-work-panel\.overdue\.has-items \.task-panel-title[\s\S]*?color:\s*var\(--red\)/);
  assert.match(redesign, /\.task-table-row\.overdue[\s\S]*?border-left-color:\s*var\(--red\)[\s\S]*?background:\s*#fff7f7/);
  assert.match(redesign, /\.task-row-date\.overdue[\s\S]*?color:\s*var\(--red\)/);
  assert.match(redesign, /\.task-waiting-age[\s\S]*?color:\s*var\(--red\)/);
});

test("waiting status is independent from the task due date", () => {
  assert.match(app, /isWaitingTaskStatus\(item\.status\)\) return "waiting"/);
  assert.match(app, /return waiting && item\.urgency !== "done"/);
});
