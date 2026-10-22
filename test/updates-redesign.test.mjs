import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, redesignCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
]);

test("updates opens as a 30-day categorized activity feed", () => {
  assert.match(indexHtml, /O que mudou nos clientes e na rotina da equipe\./);
  assert.match(indexHtml, /option value="30days" selected>Últimos 30 dias/);
  assert.match(indexHtml, /id="updatesReadFilter"[^>]+type="button"/);
  assert.match(indexHtml, /id="updatesSummary" class="updates-type-tabs"/);
  assert.match(indexHtml, /Ficam aqui por 30 dias · o histórico completo fica no card do cliente/);
  assert.match(appJs, /function updateActivityTypeOptions/);
  assert.match(appJs, /\{ value: "monthly", label: "Mensal" \}/);
});

test("updates feed groups high-volume monthly activity without losing records", () => {
  assert.match(appJs, /function compactUpdateActivitiesForFeed/);
  assert.match(appJs, /function canGroupMonthlyActivities/);
  assert.match(appJs, /_groupActivityIds: members\.map/);
  assert.match(appJs, /function markActivitiesRead/);
  assert.match(appJs, /data-activity-ids=/);
  assert.match(appJs, /competências ·/);
});

test("today and yesterday remain open while older update groups stay compact", () => {
  assert.match(appJs, /function isDefaultOpenUpdateDay/);
  assert.match(appJs, /day === activityDayKey\(today\) \|\| day === activityDayKey\(yesterday\)/);
  assert.match(appJs, /expandedPastUpdateDays/);
});

test("updates layout includes the redesigned feed and insight rail", () => {
  assert.match(redesignCss, /#updatesSection \.updates-content-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) 300px/s);
  assert.match(redesignCss, /#updatesSection \.update-day-timeline\s*\{[^}]*border:\s*1px solid var\(--line\)/s);
  assert.match(redesignCss, /#updatesSection \.updates-today-card\s*\{[^}]*background:\s*var\(--green-dark\)/s);
  assert.match(redesignCss, /#updatesSection \.updates-priority-card/);
  assert.match(redesignCss, /@media \(max-width: 620px\)[\s\S]*#updatesSection \.update-item/);
});
