import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const [indexHtml, appJs, redesignCss, buildScript] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
  readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8"),
]);

test("the supplied redesign is loaded and shipped", () => {
  assert.match(indexHtml, /styles\.css\?v=211/);
  assert.match(indexHtml, /redesign\.css\?v=223/);
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
  assert.match(appJs, /hint: "prazos em aberto"/);
  assert.match(appJs, /activeClientQuickFilter === stat\.filter/);
});

test("home client list follows the supplied compact table behavior", () => {
  assert.doesNotMatch(indexHtml, /id="clientSort"|id="listModeButton"|id="compactModeButton"|id="listView"/);
  assert.doesNotMatch(appJs, /Definir próxima ação/);
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
  assert.match(indexHtml, /app\.js\?v=227/);
  assert.doesNotMatch(indexHtml, /id="clientSort"|id="listModeButton"|id="compactModeButton"|id="listView"/);
  assert.doesNotMatch(appJs, /activeViewMode|function setViewMode|function renderClientCard/);
  for (const key of ["name", "state", "area", "created", "tasks", "deadlines", "updated"]) {
    assert.match(appJs, new RegExp(`clientSortHeader\\("${key}"`));
  }
  assert.match(appJs, /function setClientSort/);
  assert.match(appJs, /class="compact-client-created">\$\{escapeHtml\(clientCreatedDate\(client\)\)\}/);
  assert.match(appJs, /clientSortHeader\("name", "Cliente"\)[\s\S]*clientSortHeader\("created", "Cadastro"\)[\s\S]*clientSortHeader\("state", "UF"\)[\s\S]*clientSortHeader\("area", "Área"\)/);
  assert.match(appJs, /clientSortHeader\("deadlines", "Prazos"\)\}\s*\$\{clientSortHeader\("updated", "Última atualização"\)/);
  assert.match(appJs, /class="compact-client-deadline [^\n]+\n\s*<span class="compact-client-updated">\$\{escapeHtml\(formatClientListDate\(clientUpdatedTime\(client\)\)\)\}/);
  assert.match(redesignCss, /grid-template-columns:\s*minmax\(190px, 2\.25fr\) minmax\(92px, 0\.6fr\) minmax\(36px, 0\.25fr\) minmax\(84px, 0\.57fr\) minmax\(160px, 1\.6fr\) minmax\(104px, 0\.67fr\) minmax\(65px, 0\.42fr\) minmax\(146px, 0\.85fr\) 36px/);
  assert.match(redesignCss, /\.compact-client-area\s*\{[^}]*text-align:\s*left/);
  assert.match(redesignCss, /\.compact-client-updated::before\s*\{\s*content: "Última atualização"/);
  assert.match(redesignCss, /\.compact-client-sort/);
  assert.match(redesignCss, /\.compact-client-row,[\s\S]*?min-height:\s*68px;[\s\S]*?padding:\s*13px 20px/);
});

test("client rows are numbered in the current visible order", () => {
  const between = (start, end) => appJs.slice(appJs.indexOf(`function ${start}(`), appJs.indexOf(`function ${end}(`));
  const context = vm.createContext({
    el: { compactView: { querySelectorAll: () => [] } },
    clients: [{ id: "a", clientName: "Ana" }, { id: "b", clientName: "Bruna" }],
    clientSortHeader: () => "",
    getClientStatuses: () => [], clientOpenTasks: () => [], clientOpenDeadlines: () => [],
    destinationLabel: () => "Residencial", ownerSummary: () => "", isClientFinished: () => false,
    escapeHtml: String, compactClientDisplayName: String, clientCreatedDate: () => "—",
    compactClientArea: () => "—", compactStatusChips: () => "",
    formatClientListDate: () => "—", clientUpdatedTime: () => 0,
  });
  vm.runInContext(between("renderCompactClients", "clientSortHeader") + between("renderCompactClientRow", "compactStatusChips"), context);
  const positions = (expression) => {
    const html = vm.runInContext(`renderCompactClients(${expression}); el.compactView.innerHTML;`, context);
    return [...html.matchAll(/class="compact-client-position">(\d+)\.<\/span>\s*<span class="compact-client-name">\s*<strong>([^<]+)<\/strong>/g)]
      .map(([, position, name]) => [position, name]);
  };
  assert.deepEqual(positions("clients"), [["1", "Ana"], ["2", "Bruna"]]);
  assert.deepEqual(positions("[...clients].reverse()"), [["1", "Bruna"], ["2", "Ana"]]);
  assert.deepEqual(positions("clients.slice(1)"), [["1", "Bruna"]]);
});

test("only open deadlines count in the client list, filters and summary", () => {
  const between = (start, end) => appJs.slice(appJs.indexOf(`function ${start}(`), appJs.indexOf(`function ${end}(`));
  const completed = { id: "a", clientName: "Ana", deadlines: [{ id: "d1", status: "Concluído", date: "2026-11-01" }] };
  const mixed = { id: "b", clientName: "Bruna", deadlines: [
    { id: "d2", status: "Concluída", date: "2026-11-02" },
    { id: "d3", status: "Pendente", date: "2026-11-18", title: "Prazo em aberto" },
    { id: "d4", status: "Pendente" },
  ] };
  const el = { metricsGrid: {}, clientSummaryPending: {} };
  const context = vm.createContext({
    el, completed, mixed, activeClient: completed, state: { clients: [completed, mixed] },
    activeClientQuickFilter: "deadlines", activeClientSortKey: "deadlines", activeClientSortDirection: "desc",
    isClientFinished: () => false, clientOpenTasks: () => [], getClientStatuses: () => [],
    compareClientText: () => 0, localizeLabel: String, escapeHtml: String,
    destinationLabel: () => "Residencial", ownerSummary: () => "", compactClientDisplayName: String,
    clientCreatedDate: () => "—", compactClientArea: () => "—", compactStatusChips: () => "",
    formatClientListDate: () => "—", clientUpdatedTime: () => 0,
    isPastDate: (date) => date && date < "2026-11-17", isTodayDate: () => false,
    isUpcomingDate: (date) => date && date > "2026-11-17",
  });
  vm.runInContext([
    between("renderMetrics", "renderAttentionPanel"),
    between("clientDeadlineSummary", "currentMonthKey"),
    between("clientMatchesQuickFilter", "compareClientText"),
    between("clientOpenDeadlines", "renderCompactClients"),
    between("renderCompactClientRow", "compactStatusChips"),
    between("renderClientSummaryPending", "renderDestinationOptions"),
    between("clientWorkItems", "clientWorkGroups"),
    between("isCompletedTaskStatus", "taskRecurrenceFromEditorValues"),
  ].join("\n"), context);
  assert.equal(vm.runInContext("clientMatchesQuickFilter(completed)", context), false);
  assert.equal(vm.runInContext("clientMatchesQuickFilter(mixed)", context), true);
  assert.equal(vm.runInContext("sortClients([{ ...completed, deadlines: Array(4).fill(completed.deadlines[0]) }, mixed])[0].id", context), "b");
  assert.match(vm.runInContext("renderCompactClientRow(completed, 1)", context), /aria-label="Sem prazos">—/);
  assert.match(vm.runInContext("renderCompactClientRow(mixed, 2)", context), /aria-label="2 prazo\(s\)">2/);
  assert.equal(vm.runInContext("clientDeadlineSummary(mixed).overdue.length", context), 0);
  assert.equal(vm.runInContext("clientWorkItems(completed).find((item) => item.kind === 'deadline').done", context), true);
  assert.equal(vm.runInContext("clientWorkItems(mixed).filter((item) => !item.done).length", context), 2);
  vm.runInContext("renderMetrics(); renderClientSummaryPending();", context);
  assert.match(el.metricsGrid.innerHTML, /<strong>2<\/strong>\s*<small>prazos em aberto<\/small>/);
  assert.match(el.clientSummaryPending.innerHTML, /Nenhum prazo em aberto/);
});

test("the client order menu shares sorting with table headers and keeps the current filters", () => {
  const menuHtml = indexHtml.match(/<select id="clientOrderSelect"[^>]*>([\s\S]*?)<\/select>/)[1];
  const options = [...menuHtml.matchAll(/value="([^"]*)"/g)].map((match) => match[1]);
  assert.deepEqual(options, ["", "name:asc", "name:desc", "created:desc", "created:asc", "updated:desc"]);
  assert.match(menuHtml, /value="created:desc" selected/);

  const menu = { value: "created:desc", get selectedIndex() { return options.indexOf(this.value); } };
  const el = { clientOrderSelect: menu, searchInput: { value: "recife" } };
  let shown = [];
  const context = vm.createContext({
    el,
    activeClientSortKey: "created",
    activeClientSortDirection: "desc",
    state: { clients: [
      { clientName: "Zélia", workType: "Recife", state: "PE", createdAt: "2026-07-01", updatedAt: "2026-07-01" },
      { clientName: "Álvaro", workType: "Recife", state: "AL", createdAt: "2026-01-01", updatedAt: "2026-10-01" },
      { clientName: "Bruna", workType: "Recife", state: "SP", createdAt: "2026-10-01" },
      { clientName: "Antônio", workType: "Aracaju" },
      { clientName: "Alana", workType: "Recife", finished: true },
    ] },
    normalize: (value) => value.toLowerCase(),
    clientMatchesQuickFilter: (client) => !client.finished,
    renderClients: () => { shown = Array.from(vm.runInContext("filteredClients()", context), ({ clientName }) => clientName); },
  });
  const between = (start, end) => appJs.slice(appJs.indexOf(`function ${start}(`), appJs.indexOf(`function ${end}(`));
  vm.runInContext([
    between("filteredClients", "clientMatchesQuickFilter"),
    between("sortClients", "clientOpenTasks"),
    between("setClientSort", "renderCompactClientRow"),
  ].join("\n"), context);
  for (const [key, direction, expected] of [
    ["name", "asc", ["Álvaro", "Bruna", "Zélia"]],
    ["name", "desc", ["Zélia", "Bruna", "Álvaro"]],
    ["created", "desc", ["Bruna", "Zélia", "Álvaro"]],
    ["created", "asc", ["Álvaro", "Zélia", "Bruna"]],
    ["updated", "desc", ["Álvaro", "Bruna", "Zélia"]],
  ]) {
    vm.runInContext(`setClientSort("${key}", "${direction}")`, context);
    assert.equal(menu.value, `${key}:${direction}`);
    assert.deepEqual(shown, expected);
  }
  vm.runInContext('setClientSort("name"); setClientSort("name");', context);
  assert.equal(menu.value, "name:desc");
  assert.deepEqual(shown, ["Zélia", "Bruna", "Álvaro"]);
  vm.runInContext('setClientSort("state")', context);
  assert.equal(menu.value, "");
  assert.deepEqual(shown, ["Álvaro", "Zélia", "Bruna"]);
  vm.runInContext('setClientSort("updated")', context);
  assert.equal(menu.value, "updated:desc");
  assert.deepEqual(shown, ["Álvaro", "Bruna", "Zélia"]);
  vm.runInContext('setClientSort("updated")', context);
  assert.deepEqual(shown, ["Zélia", "Álvaro", "Bruna"]);
  assert.equal(vm.runInContext('formatClientListDate(clientUpdatedTime({ updatedAt: "2026-11-17T15:00:00Z" }))', context), "17/11/2026");
  assert.equal(vm.runInContext('formatClientListDate(clientUpdatedTime({ createdAt: "2026-10-12T15:00:00Z" }))', context), "12/10/2026");
  assert.equal(vm.runInContext('formatClientListDate(clientUpdatedTime({}))', context), "—");
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

test("task center uses the redesigned task and meeting editors", () => {
  assert.match(appJs, /function openInternalTaskDialog[\s\S]*openClientWorkEditor/);
  assert.match(appJs, /function renderTaskCenterTaskEditorBody/);
  assert.match(appJs, /O que precisa ser feito\?/);
  assert.match(appJs, /Tarefa interna \(sem cliente\)/);
  assert.match(appJs, /function openMeetingDialog[\s\S]*openClientWorkEditor/);
  assert.match(appJs, /function renderTaskCenterMeetingEditorBody/);
  assert.match(appJs, /Assunto da reunião[\s\S]*Videochamada[\s\S]*30 min/);
  assert.match(appJs, /data-editor-choice-multiple="true"/);
  assert.match(appJs, /function meetingDurationLabel/);
  assert.match(redesignCss, /\.task-center-editor\.client-work-editor\s*\{[\s\S]*max-width:\s*700px/);
  assert.match(redesignCss, /\.meeting-editor-time-control\s*\{/);
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
  assert.match(redesignCss, /\.client-note-composer\s*\{[^}]*display:\s*grid/s);
  assert.match(redesignCss, /\.client-note-composer textarea\s*\{[^}]*padding:\s*13px 14px 10px/s);
  assert.match(redesignCss, /\.client-note-composer-actions\s*\{[^}]*position:\s*static[^}]*justify-content:\s*flex-end/s);
  assert.doesNotMatch(redesignCss, /\.client-note-composer-actions\s*\{[^}]*position:\s*absolute/s);
  assert.match(redesignCss, /\.client-pinned-notes-grid\s*\{/);
  assert.match(redesignCss, /\.client-note-day-group\s*\{/);
  assert.match(redesignCss, /\.client-note-entry\s*\{/);
});

test("client history uses compact filters and date-grouped records", () => {
  assert.match(indexHtml, /id="historyAdminControls" class="client-history-composer"[\s\S]*id="historyFilters"[\s\S]*id="historyList" class="client-history-list"/);
  assert.match(indexHtml, /Registrar complemento manual no histórico/);
  assert.match(appJs, /let activeHistoryFilter = "all"/);
  assert.match(appJs, /function clientHistoryCategory[\s\S]*function clientHistoryCategoryMeta[\s\S]*function clientHistoryDescription/);
  assert.match(appJs, /data-history-filter=/);
  assert.match(appJs, /activityDayLabel\(dayKey\)[\s\S]*client-history-day-group/);
  assert.match(appJs, /activeHistoryFilter = "all"[\s\S]*visibleHistoryCount = 20/);
  assert.match(redesignCss, /\.client-history-row\s*\{[\s\S]*grid-template-columns:/);
  assert.match(redesignCss, /\.client-history-row\.category-manual\s*\{[\s\S]*background:/);
  assert.match(redesignCss, /body\.privacy-mode #historyTab \.client-history-description/);
  assert.match(redesignCss, /#historyTab \.client-history-composer input\s*\{[\s\S]*font-size:\s*13px/);
  assert.match(redesignCss, /\.client-history-description\s*\{[\s\S]*font-size:\s*12\.5px/);
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
  const metaSource = appJs.slice(appJs.indexOf("function renderClientDialogMeta"), appJs.indexOf("function renderClientSummaryPending"));
  assert.match(metaSource, /startDate && endDate \? `\$\{startDate\} a \$\{endDate\}`/);
  assert.match(metaSource, /destinationLabel\(activeClient\)[\s\S]*activeClient\.state[\s\S]*activeClient\.area[\s\S]*workPeriod/);
  assert.doesNotMatch(metaSource, /activeClient\.cpf|contractClosedDate|Fechado em|Início |Término /);
  assert.doesNotMatch(indexHtml, /data-field="nextAction"/);
  assert.match(appJs, /function migrateClientNextActionToNote/);
  assert.match(appJs, /return \{ \.\.\.client, nextAction: "", notes \}/);
  assert.match(appJs, /const CLIENT_STATUS_THEME/);
  assert.match(appJs, /data-open-finance-summary/);
  assert.match(appJs, /Guias pagas no controle mensal/);
  assert.match(redesignCss, /\.reduction-summary-card/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-pending/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-progress/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-waiting/);
  assert.match(redesignCss, /\.summary-status-chip\.tone-complete/);
});

test("client finance tab follows the supplied financial workspace", () => {
  assert.match(indexHtml, /id="financeTab"[\s\S]*client-finance-reduction-card[\s\S]*client-finance-fees-card[\s\S]*client-finance-overview-card[\s\S]*client-finance-notes-card/);
  assert.match(indexHtml, /data-finance-condition="cash"[\s\S]*data-finance-condition="installments"/);
  assert.match(indexHtml, /data-finance-payment-method="Pix"[\s\S]*data-finance-payment-method="Transferência"/);
  assert.match(indexHtml, /id="financeInstallmentsList"[\s\S]*id="financePaidSummary"/);
  assert.match(appJs, /function renderClientFinanceWorkspace[\s\S]*function financeInstallmentSchedule[\s\S]*function financeInstallmentDateKey/);
  assert.match(appJs, /financePaidInstallments/);
  assert.match(appJs, /function isCreditCardPaymentMethod[\s\S]*function applyAutomaticCreditCardPaymentState/);
  assert.match(appJs, /automaticCardPayment[\s\S]*Parcelas no cartão são consideradas pagas automaticamente/);
  assert.match(redesignCss, /\.client-finance-columns\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 1\.45fr\) minmax\(300px, 0\.95fr\)/);
  assert.match(redesignCss, /@media \(max-width: 700px\)[\s\S]*\.client-finance-payment-methods/);
  assert.match(redesignCss, /\.client-finance-payment-methods button\s*\{[\s\S]*font-size:\s*12px/);
  assert.match(redesignCss, /\.client-finance-installment-amount\s*\{[\s\S]*font-size:\s*13px/);
});

test("client and work tab uses the structured two-panel editor", () => {
  assert.match(indexHtml, /id="clientTab"[\s\S]*class="client-details-layout"/);
  assert.match(indexHtml, /Identificação e contato/);
  assert.match(indexHtml, /Dados usados no cálculo/);
  assert.match(indexHtml, /data-client-choice-field="documentType"/);
  assert.match(indexHtml, /data-field="workResponsible"[\s\S]*data-field="workResponsiblePhone"/);
  assert.match(indexHtml, /id="clientDestinationSelection"/);
  assert.match(indexHtml, /data-client-choice-field="workType"[\s\S]*>Mista</);
  assert.match(indexHtml, /data-client-choice-field="concrete"/);
  assert.match(indexHtml, /id="clientWorkDuration"/);
  assert.match(appJs, /function renderClientWorkControls/);
  assert.match(appJs, /"workResponsiblePhone"/);
  assert.match(appJs, /field === "phone" \|\| field === "workResponsiblePhone"/);
  assert.match(appJs, /function renderClientWorkDuration/);
  assert.match(appJs, /function renderDestinationSelection/);
  assert.match(appJs, /Number\(integer \|\| "0"\)\.toLocaleString\("pt-BR"\)/);
  assert.match(redesignCss, /\.client-details-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0, 0\.82fr\) minmax\(0, 1\.18fr\)/);
  assert.match(redesignCss, /\.client-work-type-options\s*\{[\s\S]*grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
});
