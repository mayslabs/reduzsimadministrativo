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

test("waiting status is independent from the task due date", () => {
  assert.match(app, /isWaitingTaskStatus\(item\.status\)\) return "waiting"/);
  assert.match(app, /return waiting && item\.urgency !== "done"/);
});
