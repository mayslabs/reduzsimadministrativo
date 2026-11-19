import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

await import("../task-recurrence.js");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../redesign.css", import.meta.url), "utf8");
const between = (start, end) => app.slice(app.indexOf(`function ${start}(`), app.indexOf(`function ${end}(`));
const normalize = (value) => String(value || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
const fields = ["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"];
const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

function fixture() {
  let nextId = 0;
  const list = { innerHTML: "", querySelector: () => null, querySelectorAll: () => [] };
  const context = vm.createContext({
    MONTHLY_BOOLEAN_FIELDS: fields, TASK_RECURRENCE: globalThis.ReduzSimTaskRecurrence,
    CLIENT_HISTORY_CATEGORY_ORDER: ["status", "tasks", "notes", "manual", "finance", "monthly", "client"],
    state: { statuses: [{ id: "e", name: "eSocial em andamento" }, { id: "r", name: "Recibos para assinatura" }], clients: [] },
    currentUser: { id: "m", role: "admin" }, activeClient: { history: [] },
    activeHistoryFilter: "all", visibleHistoryCount: 20,
    normalize, localizeLabel: String, isCompletedTaskStatus: (value) => ["Concluída", "Concluído"].includes(value),
    ownerName: (value) => ({ m: "Mayssa", c: "Camilli" }[value] || "Sem responsável"), userInitials: (name) => name[0],
    formatDate: (value) => value.split("-").reverse().join("/"), formatDateTime: () => "19/11/2026 às 15:38",
    activityTimeLabel: () => "15:38", activityDayKey: () => "2026-11-19", activityDayLabel: () => "Hoje · 19/11/2026",
    escapeHtml: escape, escapeAttr: escape, id: () => `history-${++nextId}`, cloneData: structuredClone,
    el: { historyAdminControls: {}, historyList: list, historyFilters: { innerHTML: "", querySelectorAll: () => [] } },
    refreshIcons() {}, syncLinkedRegularizationFromInss() {}, recordClientChangeActivities() {},
    saveState() { assert.fail("Rendering must not write data"); },
  });
  vm.runInContext([
    between("clientHistoryCategory", "renderDocuments"),
    between("summarizeClientChanges", "deleteActiveClient"),
    between("monthlyFieldLabels", "recordMonthlyActivity"),
    between("statusName", "monthlyFieldLabels"),
    between("addHistoryEntry", "recordClientChangeActivities"),
    app.slice(app.indexOf("function commitActiveClientToState("), app.indexOf("async function persistActiveClient(")),
  ].join("\n"), context);
  return context;
}

test("each monthly checkbox records its exact action and reference competence", () => {
  const f = fixture();
  for (const field of fields) {
    const previous = { id: "row", month: "2026-11", [field]: false };
    const next = { ...previous, [field]: true };
    const label = f.monthlyFieldLabels()[field];
    const meanings = { receiptSent: "o recibo foi enviado", receiptSigned: "o recibo foi assinado", remunerationSent: "a remuneração foi enviada", guideIssued: "a guia foi emitida", guideSent: "a guia foi enviada", guidePaid: "a guia foi paga" };
    assert.equal(f.monthlyHistoryChanges(previous, next)[0], `Assinalou que ${meanings[field]} · Competência 11/2026.`);
    assert.equal(f.monthlyHistoryChanges(next, previous)[0], `Desmarcou “${label}”, deixando essa etapa pendente · Competência 11/2026.`);
    assert.equal(f.monthlyHistoryChanges(next, { ...next, updatedAt: "new" }).length, 0);
  }
  const created = f.monthlyHistoryChanges(null, { month: "2026-11" });
  assert.equal(created.length, 1);
  assert.match(created[0], /Adicionou a competência 11\/2026/);
  assert.doesNotMatch(created[0], /Marcou/);
});

test("the main sentence names the person and explains exactly what the check confirms", () => {
  const f = fixture();
  const entry = { type: "system", userId: "m", details: ["Assinalou que o recibo foi enviado · Competência 11/2026."] };
  assert.equal(f.clientHistoryDescription(entry), "Mayssa assinalou que o recibo foi enviado · Competência 11/2026.");
  const older = { ...entry, userId: "c", details: ["Marcou a etapa “Guia paga” como realizada · Competência 10/2026."] };
  assert.equal(f.clientHistoryDescription(older), "Camilli assinalou que a guia foi paga · Competência 10/2026.");
  assert.equal(f.clientHistoryDescription({ ...entry, type: "manual" }), entry.details[0]);
  assert.equal(older.details[0], "Marcou a etapa “Guia paga” como realizada · Competência 10/2026.");
});

test("verified legacy detail keeps its original evidence and appears directly in the main row", () => {
  const f = fixture();
  vm.runInContext(between("normalizeHistoryEntry", "normalizeActivity"), f);
  const original = {
    id: "verified", title: "Card atualizado", type: "system", userId: "m", createdAt: "2026-11-19T18:38:13.389Z", updatedAt: null,
    details: ["Assinalou que o recibo foi enviado · Competência 11/2026."],
    monthlyEvidence: { activityId: "source", activityCreatedAt: "2026-11-19T18:38:13.390Z", activityActorId: "m", activityDetail: "Competência 2026-11\nRecibo enviado: desmarcado → marcado.", originalDetails: ["Controle mensal: 1 item(ns) alterado(s) (2026-11)."] },
  };
  const normalized = f.normalizeHistoryEntry(original);
  assert.deepEqual(normalized.monthlyEvidence, original.monthlyEvidence);
  assert.notEqual(normalized.monthlyEvidence, original.monthlyEvidence);
  assert.equal(normalized.createdAt, original.createdAt);
  f.activeClient.history = [normalized];
  f.renderHistory();
  assert.match(f.el.historyList.innerHTML, /class="client-history-description">Mayssa assinalou que o recibo foi enviado · Competência 11\/2026\./);
  assert.doesNotMatch(f.el.historyList.innerHTML, /Este registro antigo|Atualizou 1 competência/);
  assert.equal(f.clientHistoryCategory(normalized), "monthly");
});

test("bulk monthly edits retain every competence instead of discarding details after twelve", () => {
  const f = fixture();
  const old = Array.from({ length: 24 }, (_, index) => ({ id: String(index), month: `${2025 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`, receiptSent: false }));
  const changes = f.summarizeClientChanges({ monthly: old }, { monthly: old.map((row) => ({ ...row, receiptSent: true })) });
  assert.equal(changes.length, 24);
  assert.match(changes[0], /01\/2025/);
  assert.match(changes.at(-1), /12\/2026/);
  assert.ok(changes.every((change) => !/item\(ns\)|Mais \d+/.test(change)));
});

test("task completion, reopening, transfers and dates are explicit and retain full titles", () => {
  const f = fixture();
  const title = `Conferir assinaturas ${"do cliente ".repeat(12)}· 11/2026`;
  const previous = { id: "task", title, status: "Pendente", ownerId: "c", dueDate: "2026-11-10" };
  const next = { ...previous, status: "Concluída", ownerId: "m", dueDate: "2026-11-12" };
  const changes = f.taskHistoryChanges(previous, next);
  assert.ok(changes.includes(`Concluiu a tarefa “${title}”.`));
  assert.ok(changes.includes(`Transferiu a tarefa “${title}” de Camilli para Mayssa.`));
  assert.ok(changes.some((change) => /10\/11\/2026 para 12\/11\/2026/.test(change)));
  assert.match(f.taskHistoryChanges(next, { ...next, status: "Pendente" })[0], /^Reabriu a tarefa/);
  assert.equal(f.taskHistoryChanges(next, { ...next, updatedAt: "new", history: [{ text: "metadata" }] }).length, 0);
  assert.equal(previous.status, "Pendente");
  const deadline = f.taskHistoryChanges({ title: "Envio", date: "2026-11-10" }, { title: "Envio", date: "2026-11-12" }, "prazo");
  assert.match(deadline[0], /data do prazo.*10\/11\/2026 para 12\/11\/2026/);
});

test("status history lists only added and removed statuses, never unchanged or merely reordered labels", () => {
  const f = fixture();
  assert.equal(f.summarizeClientChanges({ statusIds: ["e"] }, { statusIds: ["e", "r"] }).join(""), "Adicionou o status “Recibos para assinatura”.");
  assert.equal(f.summarizeClientChanges({ statusIds: ["e", "r"] }, { statusIds: ["e"] }).join(""), "Removeu o status “Recibos para assinatura”.");
  assert.equal(f.summarizeClientChanges({ statusIds: ["e", "r"] }, { statusIds: ["r", "e"] }).length, 0);
});

test("client fields and payment changes use readable actions and compare full values", () => {
  const f = fixture();
  assert.match(f.summarizeClientChanges({}, { phone: "(63) 90000-0000" })[0], /^Preencheu “Telefone do cliente”/);
  assert.match(f.summarizeClientChanges({ phone: "test" }, { phone: "" })[0], /^Removeu o valor de/);
  const changes = f.summarizeClientChanges({ financeStatus: "Em andamento" }, { financeStatus: "Pago" });
  assert.equal(changes[0], "Alterou “Situação do pagamento” de “Em andamento” para “Pago”.");
  const long = "a".repeat(150);
  const description = f.summarizeClientChanges({ financeNotes: long }, { financeNotes: long + " altered" });
  assert.ok(description[0].includes(long + " altered"));
});

test("notes, documents and task annotations identify the actual action", () => {
  const f = fixture();
  const old = { id: "n", text: "Documento solicitado", pinned: false };
  const changes = f.summarizeClientChanges({ notes: [old] }, { notes: [{ ...old, pinned: true }] });
  assert.equal(changes[0], "Fixou a anotação “Documento solicitado”.");
  const removed = f.summarizeClientChanges({ documents: [{ id: "d", name: "Contrato" }] }, { documents: [] });
  assert.equal(removed[0], "Removeu o documento “Contrato”.");
  const document = { id: "d", name: "Contrato", status: "Pendente", path: "old" };
  const updatedDocument = f.summarizeClientChanges({ documents: [document] }, { documents: [{ ...document, status: "Recebido", path: "new" }] });
  assert.equal(updatedDocument.length, 2);
  assert.match(updatedDocument[0], /situação do documento.*Pendente.*Recebido/);
  assert.match(updatedDocument[1], /caminho\/link.*old.*new/);
  const note = f.summarizeClientChanges({ notes: [old] }, { notes: [{ ...old, text: "Documento recebido" }] });
  assert.match(note[0], /^Alterou o texto da anotação/);
  assert.equal(f.clientHistoryCategory({ type: "system", details: note }), "notes");
  const annotation = f.taskHistoryChanges({ title: "Conferência", annotations: [] }, { title: "Conferência", annotations: [{ id: "a", text: "Cliente avisado" }] });
  assert.match(annotation[0], /Adicionou um acompanhamento.*Cliente avisado/);
});

test("categories use the actual change rather than unrelated words in a task title or note", () => {
  const f = fixture();
  for (const [detail, category] of [
    ["Telefone: vazio → (63) 90000-0000.", "client"],
    ["Status financeiro: Em andamento → Pago.", "finance"],
    ["Alterou “Situação do pagamento” de “Em andamento” para “Pago”.", "finance"],
    ["Adicionou a anotação “Lembrar do pagamento da guia”.", "notes"],
    ["Marcou a etapa “Guia paga” como realizada · Competência 11/2026.", "monthly"],
    ["Concluiu a tarefa “Conferir o pagamento do DARF”.", "tasks"],
    ["Adicionou o status “Guia paga”.", "status"],
  ]) assert.equal(f.clientHistoryCategory({ title: "Tarefas", type: "system", details: [detail] }), category, detail);
});

test("legacy summaries are improved without inventing their missing action or modifying stored records", () => {
  const f = fixture();
  const entry = { id: "legacy", title: "Card atualizado", type: "system", userId: "c", createdAt: "2026-11-10T17:53:00Z", details: ["Controle mensal: 1 item(ns) alterado(s) (2026-10)."] };
  const before = structuredClone(entry);
  assert.equal(f.clientHistoryDetails(entry)[0], "Atualizou 1 competência: 10/2026.");
  assert.doesNotMatch(f.clientHistoryDetails(entry)[0], /Marcou|recibo|Concluiu/);
  assert.deepEqual(entry, before);
  const status = f.clientHistoryDetails({ type: "system", details: ["Status do processo: eSocial em andamento → eSocial em andamento, Recibos para assinatura."] });
  assert.equal(status.join(""), "Adicionou o status “Recibos para assinatura”.");
  const manual = { type: "manual", details: entry.details };
  assert.equal(f.clientHistoryDetails(manual)[0], entry.details[0]);
  const completed = { title: "Tarefa concluída", type: "system", details: ["Conferir documentos"] };
  assert.equal(f.clientHistoryDetails(completed)[0], "Concluiu a tarefa “Conferir documentos”.");
  completed.details[0] = "Concluiu a tarefa “Conferir documentos”.";
  assert.equal(f.clientHistoryDetails(completed)[0], completed.details[0]);
});

test("history expands all details with original author and time, escapes text and never saves on render", () => {
  const f = fixture();
  const entry = { id: "original-id", title: "Card atualizado", type: "system", userId: "c", createdAt: "2026-11-10T17:53:00Z", details: ["Telefone: vazio → test.", '<script>alert("x")</script>', "Tarefas: 1 item(ns) alterado(s) (Conferir assinatura)."] };
  f.activeClient.history = [entry];
  const before = structuredClone(entry);
  f.renderHistory();
  const output = f.el.historyList.innerHTML;
  assert.match(output, /<details class="client-history-content">/);
  assert.match(output, /<summary class="client-history-toggle">/);
  assert.match(output, /\+2 alterações/);
  assert.match(output, /Camilli · 19\/11\/2026 às 15:38/);
  assert.match(output, /class="client-history-author">Camilli<\/span>/);
  assert.match(output, /datetime="2026-11-10T17:53:00Z"/);
  assert.match(output, /data-edit-history="original-id"/);
  assert.match(output, /Este registro antigo não informa quais campos foram alterados/);
  assert.match(output, /&lt;script>/);
  assert.doesNotMatch(output, /<script>/);
  assert.deepEqual(entry, before);
  f.currentUser.role = "user";
  f.renderHistory();
  assert.doesNotMatch(f.el.historyList.innerHTML, /data-edit-history|data-remove-history/);
});

test("history shows the author's name on each closed row, including inactive historical authors", () => {
  const f = fixture();
  f.activeClient.history = ["m", "c"].map((userId) => ({ id: userId, userId, title: "Registro", type: "system", createdAt: "2026-11-19T18:38:00Z", details: ["Alteração registrada."] }));
  const before = structuredClone(f.activeClient.history);
  f.renderHistory();
  assert.match(f.el.historyList.innerHTML, /class="client-history-author">Mayssa<\/span>/);
  assert.match(f.el.historyList.innerHTML, /class="client-history-author">Camilli<\/span>/);
  assert.doesNotMatch(f.el.historyList.innerHTML, /client-history-avatar/);
  assert.deepEqual(f.activeClient.history, before);
});

test("new saves group independent categories without losing old history or attributing it to a new author", () => {
  const f = fixture();
  const old = { id: "old", title: "Registro", type: "manual", userId: "c", details: ["Preservar"], createdAt: "2026-11-10T12:00:00Z" };
  const client = { id: "c1", clientName: "Cliente fictício", history: [old], phone: "", tasks: [{ id: "t1", title: "Conferir", status: "Pendente" }] };
  f.state.clients = [structuredClone(client)];
  f.activeClient = structuredClone(client);
  f.activeClient.phone = "(63) 90000-0000";
  f.activeClient.tasks[0].status = "Concluída";
  f.commitActiveClientToState();
  assert.equal(f.activeClient.history.length, 3);
  assert.equal(f.activeClient.history.filter((entry) => entry.userId === "m").length, 2);
  assert.deepEqual(f.activeClient.history.find((entry) => entry.id === "old"), old);
  assert.ok(f.activeClient.history.some((entry) => entry.title === "Dados do cliente"));
  assert.ok(f.activeClient.history.some((entry) => entry.title === "Tarefas"));
});

test("expanded history remains responsive and respects privacy mode", () => {
  assert.match(css, /\.client-history-content\s*\{\s*min-width:\s*0/);
  assert.match(css, /\.client-history-details\s*\{[^}]*overflow-wrap:\s*anywhere/);
  assert.match(css, /body\.privacy-mode #historyTab \.client-history-details\s*\{\s*visibility:\s*hidden/);
  assert.match(css, /\.client-history-toggle:focus-visible/);
});
