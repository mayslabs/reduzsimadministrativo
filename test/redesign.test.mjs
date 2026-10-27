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
  assert.match(indexHtml, /redesign\.css\?v=192/);
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
  assert.doesNotMatch(indexHtml, /id="clientSort"|id="listModeButton"|id="compactModeButton"|id="listView"/);
  assert.match(appJs, /Definir próxima ação/);
  assert.match(appJs, /compact-client-empty/);
  assert.match(appJs, /function compactClientDisplayName/);
  assert.match(appJs, /function compactClientArea/);
});

test("home client list renders every filtered client without pagination", () => {
  assert.doesNotMatch(indexHtml, /id="clientPagination"/);
  assert.doesNotMatch(appJs, /CLIENTS_PER_PAGE|activeClientPage|renderClientPagination|clientPaginationPages/);
  assert.match(appJs, /const clients = filteredClients\(\);/);
  assert.match(appJs, /renderCompactClients\(clients\)/);
});

test("home client labels use the new palette without a status dropdown", () => {
  assert.doesNotMatch(indexHtml, /id="statusFilter"/);
  assert.doesNotMatch(appJs, /renderStatusFilter|el\.statusFilter|function chip\(status\)/);
  assert.match(appJs, /return needsAction \? "strong" : name\.includes\("aguardando"\) \? "neutral" : "soft"/);
  assert.match(appJs, /function compactStatusChip\(status\)[\s\S]*class="chip compact-status-chip tone-\$\{tone\}"/);
  assert.match(redesignCss, /compact-status-chip\.tone-strong/);
  assert.match(redesignCss, /compact-status-chip\.tone-soft/);
  assert.match(redesignCss, /compact-status-chip\.tone-neutral/);
  assert.doesNotMatch(redesignCss, /compact-status-chip\.tone-complete/);
});

test("client table headers sort records and card mode is removed", () => {
  assert.match(indexHtml, /app\.js\?v=192/);
  assert.doesNotMatch(indexHtml, /id="clientSort"|id="listModeButton"|id="compactModeButton"|id="listView"/);
  assert.doesNotMatch(appJs, /activeViewMode|function setViewMode|function renderClientCard/);
  for (const key of ["name", "state", "area", "created", "tasks", "deadlines"]) {
    assert.match(appJs, new RegExp(`clientSortHeader\\("${key}"`));
  }
  assert.match(appJs, /function setClientSort/);
  assert.match(appJs, /\["area", "created", "tasks", "deadlines"\]\.includes\(key\) \? "desc" : "asc"/);
  assert.match(appJs, /activeClientSortDirection = activeClientSortDirection === "asc" \? "desc" : "asc"/);
  assert.match(appJs, /class="compact-client-created">\$\{escapeHtml\(clientCreatedDate\(client\)\)\}/);
  assert.match(appJs, /clientSortHeader\("name", "Cliente"\)[\s\S]*clientSortHeader\("created", "Cadastro"\)[\s\S]*clientSortHeader\("state", "UF"\)[\s\S]*clientSortHeader\("area", "Área"\)/);
  assert.match(redesignCss, /grid-template-columns:\s*minmax\(190px, 2\.4fr\) 100px 42px 96px/);
  assert.match(redesignCss, /\.compact-client-sort/);
  assert.match(redesignCss, /\.compact-client-row,[\s\S]*?min-height:\s*68px;[\s\S]*?padding:\s*13px 20px/);
});

test("client dialog combines tasks and deadlines and ends with history", () => {
  assert.doesNotMatch(indexHtml, /data-tab="deadlinesTab"|data-tab="workersTab"|id="deadlinesTab"|id="workersTab"/);
  assert.match(indexHtml, /id="tasksTab"[\s\S]*id="tasksList"[\s\S]*id="deadlinesList"/);
  assert.match(indexHtml, /data-tab="financeTab">Financeiro<\/button>[\s\S]*data-tab="historyTab">Histórico<\/button>/);
  assert.match(indexHtml, /id="financeTab"[\s\S]*id="historyTab"/);
  assert.match(appJs, /switchTab\("tasksTab"\);[\s\S]*openClientDeadlineDialog\(\)/);
  assert.doesNotMatch(appJs, /renderWorkerMessages|addWorkerMessage|newWorkerMessageText|workerMessagesList/);
  assert.match(appJs, /workerMessages:\s*normalizeWorkerMessages/);
  assert.match(redesignCss, /#clientDialog \.destination-field input\[type="checkbox"\][\s\S]*min-height:\s*16px/);
  assert.match(redesignCss, /\.client-work-grid[\s\S]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
});

test("client task tab uses grouped filters and compact work cards", () => {
  assert.match(indexHtml, /id="clientTaskFilters"[\s\S]*data-client-work-filter="all"[\s\S]*data-client-work-filter="task"[\s\S]*data-client-work-filter="deadline"[\s\S]*data-client-work-filter="done"/);
  assert.match(indexHtml, /id="addDeadlineButton"[\s\S]*Novo prazo[\s\S]*id="addTaskButton"[\s\S]*Nova tarefa/);
  assert.match(appJs, /let activeClientWorkFilter = "all"/);
  assert.match(appJs, /Atrasados[\s\S]*Próximos 7 dias[\s\S]*Mais adiante[\s\S]*Sem data/);
  assert.match(appJs, /function renderClientWorkCard/);
  assert.match(appJs, /data-toggle-client-work/);
  assert.match(appJs, /record\.status = isDone \? "Pendente" : isTask \? "Concluída" : "Concluído"/);
  assert.match(appJs, /description: values\.description \|\| ""/);
  assert.match(redesignCss, /\.client-task-workspace/);
  assert.match(redesignCss, /\.client-task-card\.overdue/);
  assert.match(redesignCss, /\.client-task-date-badge/);
  assert.match(redesignCss, /\.client-task-card\s*\{[\s\S]*?min-height:\s*0/);
  assert.match(redesignCss, /\.client-task-card-body h4\s*\{[\s\S]*?font-weight:\s*600/);
  assert.match(redesignCss, /\.client-task-complete\s*\{[\s\S]*?font-weight:\s*600/);
});

test("client task and deadline actions use the compact choice-based editors", () => {
  assert.match(indexHtml, /id="simpleDialogFooterNote"/);
  assert.match(appJs, /function openClientWorkEditor/);
  assert.match(appJs, /placeholder="O que precisa ser feito\?"/);
  assert.match(appJs, /placeholder="Qual é o prazo\?"/);
  assert.match(appJs, /Interno[\s\S]*Receita Federal[\s\S]*Cliente/);
  assert.match(appJs, /Hoje[\s\S]*Amanhã[\s\S]*\+7 dias/);
  assert.match(appJs, /Sem lembrete[\s\S]*1 dia antes[\s\S]*3 dias antes[\s\S]*7 dias antes/);
  assert.match(appJs, /data-toggle-client-editor-notes/);
  assert.match(appJs, /reminderDays: deadline\.reminderDays \?\? ""/);
  assert.match(appJs, /el\.simpleDialogBody\.className = "field-stack"/);
  assert.match(redesignCss, /\.client-work-editor\s*\{/);
  assert.match(redesignCss, /\.client-editor-settings\s*\{/);
  assert.match(redesignCss, /\.client-deadline-type\.active/);
  assert.match(redesignCss, /\.client-editor-choices\.owner \.client-editor-choice\.active/);
});

test("client notes separate pinned items from a searchable date-grouped history", () => {
  assert.match(indexHtml, /id="newNotePinButton"/);
  assert.match(indexHtml, /id="pinnedNotesSection"[\s\S]*id="pinnedNotesList"/);
  assert.match(indexHtml, /id="notesHistoryCount"[\s\S]*id="noteSearchInput"/);
  assert.match(appJs, /function normalizeClientNote[\s\S]*pinned: Boolean\(note\.pinned\)/);
  assert.match(appJs, /function renderPinnedNoteCard/);
  assert.match(appJs, /function renderHistoryNoteCard/);
  assert.match(appJs, /function clientNoteDayKey/);
  assert.match(appJs, /data-toggle-pin-note/);
  assert.match(appJs, /activeClientNoteSearch/);
  assert.match(appJs, /pinned: newClientNotePinned/);
  assert.match(redesignCss, /\.client-note-composer\s*\{/);
  assert.match(redesignCss, /\.client-pinned-notes-grid\s*\{/);
  assert.match(redesignCss, /\.client-note-day-group\s*\{/);
  assert.match(redesignCss, /\.client-note-entry\s*\{/);
});

test("client summary exposes pending work in the redesigned dialog", () => {
  assert.match(indexHtml, /id="clientSummaryPending"/);
  assert.match(indexHtml, /id="clientDialogMeta"/);
  assert.match(indexHtml, /id="clientDialogHeaderStatuses"/);
  assert.match(indexHtml, /id="activeStatusCount"/);
  assert.match(indexHtml, /id="statusPickerToggleLabel">Exibir opções/);
  assert.match(indexHtml, /Pendência[\s\S]*Em andamento[\s\S]*Aguardando terceiros[\s\S]*Concluído/);
  assert.match(appJs, /function renderClientSummaryPending/);
  assert.match(appJs, /function setStatusPickerExpanded/);
  assert.match(appJs, /const CLIENT_STATUS_THEME/);
  assert.match(appJs, /data-open-finance-summary/);
  assert.match(appJs, /Guias pagas no controle mensal/);
  assert.match(redesignCss, /\.reduction-summary-card/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-pending/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-progress/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-waiting/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-complete/);
});

test("client and work tab uses the structured two-panel editor", () => {
  assert.match(indexHtml, /id="clientTab"[\s\S]*class="client-details-layout"/);
  assert.match(indexHtml, /Identificação e contato/);
  assert.match(indexHtml, /Dados usados no cálculo/);
  assert.match(indexHtml, /data-client-choice-field="documentType"/);
  assert.match(indexHtml, /id="clientDestinationSelection"/);
  assert.match(indexHtml, /data-client-choice-field="workType"[\s\S]*>Mista</);
  assert.match(indexHtml, /data-client-choice-field="concrete"/);
  assert.match(indexHtml, /id="clientWorkDuration"/);
  assert.match(appJs, /function renderClientWorkControls/);
  assert.match(appJs, /function renderClientWorkDuration/);
  assert.match(appJs, /function renderDestinationSelection/);
  assert.match(appJs, /Number\(integer \|\| "0"\)\.toLocaleString\("pt-BR"\)/);
  assert.match(redesignCss, /\.client-details-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 0\.82fr\) minmax\(0, 1\.18fr\)/);
  assert.match(redesignCss, /\.client-work-type-options\s*\{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});
