import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, stylesCss, stateApi, migration] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../functions/api/state.js", import.meta.url), "utf8"),
  readFile(new URL("../migrations/0002_marketing.sql", import.meta.url), "utf8"),
]);

test("marketing is a complete team workspace", () => {
  assert.match(indexHtml, /data-section="marketingSection"/);
  assert.match(indexHtml, /id="marketingCalendarViewButton"/);
  assert.match(indexHtml, /id="marketingProductionViewButton"/);
  assert.match(indexHtml, /id="marketingIdeasViewButton"/);
  assert.match(indexHtml, /id="marketingDialog"/);
  assert.match(appJs, /function renderMarketingCalendar/);
  assert.match(appJs, /function renderMarketingProduction/);
  assert.match(appJs, /function convertMarketingIdea/);
  assert.match(appJs, /function syncMarketingTask/);
});

test("marketing records synchronize securely and preserve history", () => {
  assert.match(stateApi, /stateKey:\s*"marketingItems"/);
  assert.match(stateApi, /table:\s*"marketing_items"/);
  assert.match(stateApi, /protectHistory:\s*true/);
  assert.match(stateApi, /adminDeleteOnly:\s*true/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS marketing_items/);
  assert.match(migration, /marketing_items_active_idx/);
});

test("presentation privacy also masks marketing content", () => {
  assert.match(stylesCss, /#marketingSection \.marketing-calendar-entry strong/);
  assert.match(stylesCss, /#marketingDialog input:not\(\[type="checkbox"\]\)/);
});
