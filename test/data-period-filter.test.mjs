import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("reports offer complete historical years found in contract dates", () => {
  assert.match(app, /yearOptions[\s\S]*monthOptions\.map\(\(monthKey\) => monthKey\.slice\(0, 4\)\)/);
  assert.match(app, /value="year:\$\{escapeAttr\(year\)\}"/);
  assert.match(app, /Ano de \$\{escapeHtml\(year\)\}/);
});

test("historical year filters and annual charts use the selected year", () => {
  assert.match(app, /startsWith\("year:"\)[\s\S]*monthKey\.startsWith/);
  assert.match(app, /match\(\/\^year:\(\\d\{4\}\)\$\/\)/);
  assert.match(app, /match\(\/\^month:\(\\d\{4\}\)-\\d\{2\}\$\/\)/);
  assert.match(app, /function dataReportMonths\(year = dataReportYear\(\)\)/);
});
