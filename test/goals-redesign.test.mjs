import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, redesignCss, stylesCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
]);

test("goals header follows the supplied compact period layout", () => {
  assert.match(indexHtml, /Receita real de clientes pagos e o progresso de cada meta\./);
  assert.match(indexHtml, /id="goalsPeriodLabel"/);
  assert.match(indexHtml, /id="goalsYearSelect"/);
  assert.match(appJs, /goalsPeriodLabel\.textContent = `\$\{month\?\.label \|\| "Mês"\} \$\{activeGoalsYear\}`/);
  assert.match(appJs, /goalsPeriodControl\.after\(el\.privacyToolbar\)/);
  assert.match(redesignCss, /#goalsSection \.goals-month-control[\s\S]*width:\s*232px/);
});

test("monthly and annual goals use one threshold rail with forecast insights", () => {
  assert.match(appJs, /function renderGoalThresholdRail/);
  assert.match(appJs, /--goal-floor-segment:\$\{floorSegment\}%/);
  assert.match(appJs, /--goal-stretch-segment:\$\{stretchSegment\}%/);
  assert.match(appJs, /tier\.reached \? `Alcançado/);
  assert.match(appJs, /`Faltam \$\{goalWholeCurrency/);
  assert.match(appJs, /da meta anual<\/span>/);
  assert.match(appJs, /Projeção no ritmo atual/);
  assert.match(appJs, /Necessário por mês restante/);
  assert.match(appJs, /Ritmo esperado até/);
  assert.match(redesignCss, /\.goal-threshold-rail\.annual/);
  assert.match(redesignCss, /\.goal-annual-insights/);
  assert.match(redesignCss, /background:\s*var\(--green-dark\)/);
});

test("monthly performance uses semantic bars and compact paid contracts", () => {
  assert.match(appJs, /Meta batida/);
  assert.match(appJs, /Acima do piso/);
  assert.match(appJs, /Abaixo do piso/);
  assert.match(appJs, /goal-month-bar-button[\s\S]*month\.tone/);
  assert.match(appJs, /goal-contract-status/);
  assert.match(indexHtml, /<p class="goals-card-kicker">Contratos pagos<\/p>/);
  assert.match(redesignCss, /grid-template-columns:\s*minmax\(0, 1fr\) 360px/);
});

test("privacy mode covers every new sensitive goal value", () => {
  assert.match(stylesCss, /#goalsSection \.goal-threshold-label strong/);
  assert.match(stylesCss, /#goalsSection \.goal-annual-insight strong/);
  assert.match(stylesCss, /#goalsSection \.goal-contract-copy span/);
});
