import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, redesignCss, stylesCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
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
  assert.match(appJs, /class="bill-summary-status-stack"/);
  assert.match(redesignCss, /#billsSection \.bills-summary-grid\s*\{[\s\S]*?display:\s*flex/);
  assert.match(redesignCss, /#billsSection \.bill-summary-status-stack\s*\{[\s\S]*?flex-direction:\s*column/);
  assert.match(redesignCss, /#billsSection \.bill-summary-card\.tone-total\s*\{[\s\S]*?flex:\s*2 1 460px/);
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
  assert.match(appJs, /Cartão · a categorizar/);
  assert.match(indexHtml, /id="manageBillCategoriesFromChartButton"/);
  assert.match(redesignCss, /\.bills-layout\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 320px/);
});

test("categories have stable ids and configurable theme colors", () => {
  const themePalette = appJs.match(/const BILL_CATEGORY_THEME_COLORS = \[[\s\S]*?\];/)?.[0] || "";
  const colors = themePalette.match(/#[0-9a-f]{6}/gi) || [];

  assert.equal(colors.length, 13);
  assert.equal(new Set(colors.map((color) => color.toLowerCase())).size, colors.length);
  assert.match(appJs, /\["bill-category-pessoal", "Pessoal", "#074D40"\]/);
  assert.match(appJs, /function normalizeBillCategoryRecord/);
  assert.match(appJs, /function billCategoryUsage/);
  assert.match(appJs, /function renderBillCategoriesManager/);
  ["#2f7fb8", "#d9534f", "#7b5cc4", "#e08a1e", "#e5b700", "#c2569b", "#4f6bd8", "#a0674b"].forEach((color) => {
    assert.doesNotMatch(themePalette, new RegExp(color, "i"));
  });
});

test("credit-card accounts use inline itemized invoices", () => {
  assert.match(appJs, /isCartao/);
  assert.match(appJs, /itensFatura/);
  assert.match(appJs, /category:\s*isCartao \? null : legacyCategoryName/);
  assert.match(appJs, /function renderBillInvoicePanel/);
  assert.match(appJs, /data-bill-invoice-new="descricao"/);
  assert.match(appJs, /data-bill-invoice-item-category/);
  assert.match(appJs, /itensFatura:\s*\[\]/);
  assert.match(redesignCss, /\.bill-invoice-entry-row/);
  assert.match(redesignCss, /\.bill-invoice-detail-row > td/);
});

test("category manager supports create, rename, recolor and guarded deletion", () => {
  assert.match(indexHtml, /id="billCategoriesDialog"/);
  assert.match(indexHtml, /id="newBillCategoryName"/);
  assert.match(appJs, /function createBillCategory/);
  assert.match(appJs, /function applyBillCategoryColor/);
  assert.match(appJs, /data-bill-category-name/);
  assert.match(appJs, /if \(!category \|\| billCategoryUsage\(categoryId\)\) return/);
  assert.match(redesignCss, /\.bill-categories-manager/);
});

test("privacy mode masks itemized card-invoice details", () => {
  assert.match(stylesCss, /#billsSection \.bill-invoice-metrics strong/);
  assert.match(stylesCss, /#billsSection \.bill-invoice-item > strong/);
  assert.match(stylesCss, /#billsSection \.bill-invoice-item > b/);
  assert.match(stylesCss, /#billsSection \.bill-invoice-entry-row input/);
});
