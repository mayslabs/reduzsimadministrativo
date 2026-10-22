import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, redesignCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
]);

test("reports follow the supplied hierarchy and panel composition", () => {
  assert.match(indexHtml, /class="section-heading data-heading"/);
  assert.match(appJs, /Economia bruta gerada/);
  assert.match(appJs, /function reportDestinationPanel/);
  assert.match(appJs, /function reportClientProfilePanel/);
  assert.match(appJs, /Pessoa física ou jurídica/);
  assert.match(appJs, /Ticket médio de honorários/);
  assert.match(appJs, /Conferência dos dados/);
  assert.match(redesignCss, /grid-template-columns:\s*2fr repeat\(4, minmax\(150px, 1fr\)\)/);
  assert.match(redesignCss, /\.data-quality-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(6/);
});

test("annual charts retain the selected year's trend while period cards stay filtered", () => {
  assert.match(appJs, /const records = filteredDataRecords\(\);/);
  assert.match(appJs, /filteredDataRecords\(\{ ignorePeriod: true \}\)/);
  assert.match(appJs, /trendRecords\.forEach/);
  assert.match(appJs, /\$\{dataReportYear\(\)\} ·/);
});

test("privacy mode masks values introduced by the report redesign", () => {
  assert.match(redesignCss, /\.data-ticket-card strong/);
  assert.match(redesignCss, /\.report-profile-segment span/);
  assert.match(redesignCss, /\.report-profile-legend strong/);
  assert.match(redesignCss, /\.report-destination-row strong/);
});

test("the application shell remains responsive after authentication", () => {
  assert.match(appJs, /el\.appView\.style\.removeProperty\("display"\)/);
  assert.doesNotMatch(appJs, /el\.appView\.style\.display = "grid"/);
});
