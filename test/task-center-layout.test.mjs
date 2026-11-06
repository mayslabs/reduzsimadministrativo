import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  assert.match(redesign, /grid-template-columns:\s*repeat\(7, minmax\(150px, 1fr\)\)/);
  assert.match(redesign, /min-width:\s*1080px/);
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
