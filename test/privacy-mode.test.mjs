import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, stylesCss] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
]);

test("presentation privacy starts enabled and has a global toggle", () => {
  assert.match(indexHtml, /id="privacyToggleButton"/);
  assert.match(indexHtml, /id="privacyToggleLabel">Privacidade ativa/);
  assert.match(appJs, /let privacyModeEnabled = true;/);
  assert.match(appJs, /setPrivacyMode\(true\);/);
  assert.match(appJs, /setPrivacyMode\(!privacyModeEnabled\)/);
});

test("presentation privacy masks the requested operational areas", () => {
  assert.match(stylesCss, /#tasksSection \.task-row-title strong/);
  assert.match(stylesCss, /#billsSection \.bills-table tbody td:first-child strong/);
  assert.match(stylesCss, /#goalsSection \.goal-overview-metric strong/);
  assert.match(stylesCss, /#dataSection \.data-total strong/);
  assert.match(stylesCss, /#clientsSection \.client-card h3/);
});
