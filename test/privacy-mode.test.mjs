import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, stylesCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
]);

test("presentation privacy starts disabled and has a global toggle", () => {
  assert.match(indexHtml, /styles\.css\?v=177/);
  assert.match(indexHtml, /id="privacyToggleButton"/);
  assert.match(indexHtml, /aria-pressed="false"/);
  assert.match(indexHtml, /id="privacyToggleLabel">Dados visíveis/);
  assert.match(appJs, /let privacyModeEnabled = false;/);
  assert.match(appJs, /setPrivacyMode\(false\);/);
  assert.match(appJs, /setPrivacyMode\(!privacyModeEnabled\)/);
  assert.match(appJs, /let privacyVisualSeed = 0;/);
  assert.match(appJs, /function privacyVisualPercent/);
  assert.match(appJs, /renderPrivacySensitiveViews\(\)/);
});

test("presentation privacy masks the requested operational areas", () => {
  assert.match(stylesCss, /#tasksSection \.task-row-title strong/);
  assert.match(stylesCss, /#billsSection \.bills-table tbody td:first-child strong/);
  assert.match(stylesCss, /#billsSection \.bills-table tbody td:nth-child\(2\) strong/);
  assert.match(stylesCss, /#billsSection \.bill-summary-legend b/);
  assert.match(stylesCss, /#goalsSection \.goal-overview-metric strong/);
  assert.match(stylesCss, /#dataSection \.data-total strong/);
  assert.match(stylesCss, /#clientsSection \.client-card h3/);
  assert.match(stylesCss, /#metricsGrid \.metric strong/);
  assert.match(stylesCss, /#clientsSection \.compact-client-status \.chip/);
  assert.match(stylesCss, /#clientsSection \.client-card \.chip-list \.chip/);
  assert.match(stylesCss, /#regularizationMetricsGrid \.metric strong/);
  assert.match(stylesCss, /#regularizationSection \.regularization-status-chip/);
  assert.match(stylesCss, /#tasksSection \.task-stat strong/);
  assert.match(stylesCss, /#tasksSection \.task-row-owner > span:last-child/);
  assert.match(stylesCss, /#tasksSection \.task-waiting-age/);
  assert.match(stylesCss, /#updatesSection \.update-content h3 strong/);
  assert.match(stylesCss, /#updatesSection \.updates-type-tab span/);
  assert.match(stylesCss, /#updatesSection \.updates-summary-people > span/);
  assert.match(stylesCss, /#dataSection \.report-profile-legend strong small/);
  assert.match(stylesCss, /#goalsSection \.goal-year-progress strong small/);
  assert.match(stylesCss, /\.sidebar-footer #currentUserLabel strong/);
});

test("privacy mode replaces real chart shapes with stable illustrative values", () => {
  assert.match(appJs, /privacyMonthlyCountRows\(data\.monthlyContracts, "data-contracts"\)/);
  assert.match(appJs, /privacyMonthlyAmountRows\(data\.monthlyFees, "data-fees"\)/);
  assert.match(appJs, /privacyVisualPercent\(`data-horizontal:/);
  assert.match(appJs, /privacyVisualInteger\("data-profile:pf-percent"/);
  assert.match(appJs, /privacyGoalProgress\("monthly"\)/);
  assert.match(appJs, /privacyVisualPercent\(`goals:performance:/);
  assert.match(appJs, /Posição ilustrativa no modo de privacidade/);
});
