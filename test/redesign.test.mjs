import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, redesignCss, buildScript] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
  readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8"),
]);

test("the supplied redesign is loaded and shipped", () => {
  assert.match(indexHtml, /redesign\.css\?v=171/);
  assert.match(buildScript, /"redesign\.css"/);
  assert.match(redesignCss, /grid-template-columns:\s*248px minmax\(0, 1fr\)/);
  assert.match(redesignCss, /background:\s*var\(--green-dark\)/);
});

test("regularization is removed from primary navigation without deleting its records", () => {
  assert.doesNotMatch(indexHtml, /class="nav-item" data-section="regularizationSection"/);
  assert.match(indexHtml, /id="regularizationSection" class="app-section" hidden/);
  assert.match(appJs, /regularizationClients/);
});

test("client metrics act as the new quick filters", () => {
  assert.match(appJs, /data-client-metric-filter/);
  assert.match(appJs, /label: "Sem status"/);
  assert.match(appJs, /hint: "tarefas abertas"/);
  assert.match(appJs, /hint: "prazos registrados"/);
  assert.match(appJs, /activeClientQuickFilter === stat\.filter/);
});

test("home client list follows the supplied compact table behavior", () => {
  assert.match(indexHtml, /layout-grid"><\/i> Cartões/);
  assert.match(appJs, /Definir próxima ação/);
  assert.match(appJs, /compact-client-empty/);
  assert.match(appJs, /function compactClientDisplayName/);
  assert.match(appJs, /function compactClientArea/);
});

test("home client list renders every filtered client without pagination", () => {
  assert.doesNotMatch(indexHtml, /id="clientPagination"/);
  assert.doesNotMatch(appJs, /CLIENTS_PER_PAGE|activeClientPage|renderClientPagination|clientPaginationPages/);
  assert.match(appJs, /const clients = filteredClients\(\);/);
  assert.match(appJs, /clients\.map\(\(client\) => renderClientCard\(client\)\)/);
  assert.match(appJs, /renderCompactClients\(clients\)/);
});

test("home client cards follow the supplied four-column composition", () => {
  assert.match(indexHtml, /app\.js\?v=171/);
  assert.match(appJs, /class="client-card-header"/);
  assert.match(appJs, /class="client-card-area"/);
  assert.match(appJs, /client-card-task-chip/);
  assert.match(appJs, /client-card-next-label">PRÓXIMA AÇÃO/);
  assert.match(redesignCss, /repeat\(auto-fill, minmax\(280px, 1fr\)\)/);
  assert.match(redesignCss, /border-top:\s*3px solid var\(--green\)/);
});

test("client summary exposes pending work in the redesigned dialog", () => {
  assert.match(indexHtml, /id="clientSummaryPending"/);
  assert.match(indexHtml, /id="clientDialogMeta"/);
  assert.match(appJs, /function renderClientSummaryPending/);
  assert.match(appJs, /Guias pagas no controle mensal/);
});
