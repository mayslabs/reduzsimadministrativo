import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, redesignCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
]);

test("monthly control groups years and can toggle every month in a stage", () => {
  assert.match(indexHtml, /id="monthlyRangeSummary"/);
  assert.match(indexHtml, /id="monthlyProgressList" class="monthly-summary-grid"/);
  assert.match(indexHtml, /<th>Etapas<\/th>/);
  for (const field of ["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"]) {
    assert.match(appJs, new RegExp(`MONTHLY_BOOLEAN_FIELDS[\\s\\S]*${field}`));
  }
  assert.match(appJs, /function setAllMonthlyField\(field, checked\)/);
  assert.match(appJs, /function toggleAllMonthlyField\(field\)/);
  assert.match(appJs, /row\[field\] = Boolean\(checked\)/);
  assert.match(appJs, /function syncMonthlyBulkToggles\(\)/);
  assert.match(appJs, /data-month-summary-toggle/);
  assert.match(indexHtml, /data-month-toggle-all="receiptSent"/);
  assert.match(indexHtml, /data-month-toggle-all="guidePaid"/);
  assert.match(indexHtml, /data-lucide="chevrons-down"/);
  assert.match(appJs, /class="monthly-year-row"/);
  assert.match(appJs, /class="monthly-stage-badge complete">Concluído/);
  assert.match(appJs, /function addMonthlyRow\(\)/);
  assert.match(redesignCss, /\.monthly-summary-grid/);
  assert.match(redesignCss, /\.monthly-column-toggle-icon/);
  assert.match(redesignCss, /\.monthly-column-toggle\.complete \.monthly-column-toggle-icon/);
  assert.match(redesignCss, /#monthlyTable \.monthly-stage-checkbox:checked/);
});
