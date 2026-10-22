import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, redesignCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
]);

test("accounts header uses the compact period navigator from the reference", () => {
  assert.match(indexHtml, /Despesas, vencimentos e recorrências da operação\./);
  assert.match(indexHtml, /id="billsPrevMonthButton"/);
  assert.match(indexHtml, /id="billsPeriodLabel"/);
  assert.match(indexHtml, /id="billsNextMonthButton"/);
  assert.match(appJs, /function shiftBillsMonth\(direction\)/);
});

test("accounts summary shows composition and actionable status totals", () => {
  assert.match(appJs, /class="bill-summary-progress"/);
  assert.match(appJs, /class="bill-summary-legend"/);
  assert.match(appJs, /data-bill-summary-filter/);
  assert.match(appJs, /nextPending/);
  assert.match(redesignCss, /grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(redesignCss, /\.bill-summary-card\.tone-total\s*\{[\s\S]*?grid-column:\s*span 2/);
  assert.match(redesignCss, /button\.bill-summary-card > div\s*\{[\s\S]*?min-height:\s*0[\s\S]*?margin-top:\s*auto/);
  assert.match(redesignCss, /button\.bill-summary-card > div > small\s*\{[\s\S]*?min-height:\s*32px/);
  assert.match(redesignCss, /\.bill-summary-copy > strong\s*\{[\s\S]*?font-size:\s*38px/);
});

test("accounts list exposes payment, recurrence, status and compact actions", () => {
  assert.match(indexHtml, /<th><span class="sr-only">Pagamento<\/span><\/th>/);
  assert.match(appJs, /class="bill-paid-toggle/);
  assert.match(appJs, /data-lucide="refresh-cw"/);
  assert.match(appJs, /class="bill-status-pill/);
  assert.match(appJs, /function billDueHint/);
  assert.match(redesignCss, /\.bills-table\s*\{[\s\S]*?table-layout:\s*fixed/);
});

test("category spending panel uses bars and filters the account list", () => {
  assert.match(indexHtml, /Para onde vai o dinheiro/);
  assert.match(appJs, /data-bill-category-filter/);
  assert.match(appJs, /function billCategoryColor/);
  assert.match(appJs, /class="bill-category-track"/);
  assert.match(redesignCss, /\.bills-layout\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 320px/);
});
