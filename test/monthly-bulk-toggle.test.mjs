import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, stylesCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
]);

test("monthly control can toggle every month in a status column", () => {
  for (const field of ["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"]) {
    assert.match(indexHtml, new RegExp(`data-month-toggle-all="${field}"`));
  }
  assert.match(appJs, /function setAllMonthlyField\(field, checked\)/);
  assert.match(appJs, /row\[field\] = Boolean\(checked\)/);
  assert.match(appJs, /function syncMonthlyBulkToggles\(\)/);
  assert.match(appJs, /input\.indeterminate = partiallyChecked/);
  assert.match(stylesCss, /\.monthly-bulk-toggle/);
});
