import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import vm from "node:vm";

import { compactStatePayload, onRequestGet, onRequestPost } from "../functions/api/state.js";

test("state API returns only records changed by a compact save", () => {
  const payload = {
    ok: true,
    state: {
      clients: [{ id: "c1", name: "Um" }, { id: "c2", name: "Dois" }],
      activities: [{ id: "a1", title: "Registro" }],
      goals: { year: "2026" },
      users: [{ id: "u1", name: "Mayssa" }],
    },
    versions: {
      "clients:c1": 3,
      "clients:c2": 4,
      "activities:a1": 2,
      "settings:goals": 5,
      "users:u1": 8,
    },
    lastSeq: 30,
    currentUser: { id: "u1", role: "admin" },
  };
  const compact = compactStatePayload(
    payload,
    new Set(["clients:c1", "activities:a1", "settings:goals"]),
  );

  assert.equal(compact.state, undefined);
  assert.deepEqual(compact.statePatch, {
    clients: [{ id: "c1", name: "Um" }],
    activities: [{ id: "a1", title: "Registro" }],
    goals: { year: "2026" },
  });
  assert.deepEqual(compact.versions, {
    "clients:c1": 3,
    "activities:a1": 2,
    "settings:goals": 5,
  });
  assert.equal(compact.partialVersions, true);
  assert.deepEqual(compact.deletedKeys, []);
});

test("state API reports deleted records without returning unrelated data", () => {
  const compact = compactStatePayload({
    ok: true,
    state: { clients: [{ id: "c2" }], users: [] },
    versions: { "clients:c2": 4 },
    lastSeq: 31,
    currentUser: { id: "u1", role: "admin" },
  }, new Set(["clients:c1"]));

  assert.deepEqual(compact.statePatch, { clients: [] });
  assert.deepEqual(compact.versions, {});
  assert.deepEqual(compact.deletedKeys, ["clients:c1"]);
});

async function createStateTestDatabase(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  for (const migration of ["0001_crm.sql", "0002_marketing.sql"]) {
    sqlite.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
  }
  const statements = [];
  function prepare(sql, values = []) {
    statements.push({ sql, values });
    return {
      bind: (...params) => prepare(sql, params),
      first: async () => sqlite.prepare(sql).get(...values),
      all: async () => ({ results: sqlite.prepare(sql).all(...values) }),
    };
  }
  const DB = { prepare, batch: (queries) => Promise.all(queries.map((query) => query.all())) };
  const user = { id: "u1", role: "admin" };
  const path = "https://crm.example.test/api/state";
  const context = (request) => ({ request, env: { DB }, data: { user } });
  function save(body) {
    return onRequestPost(context(new Request(path, {
      method: "POST",
      headers: { Origin: new URL(path).origin, "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, compact: true }),
    })));
  }
  function insertClient(client) {
    const now = new Date().toISOString();
    sqlite.prepare(`
      INSERT INTO clients (id, payload, scope, version, created_at, created_by, updated_at, updated_by)
      VALUES (?, ?, 'team', 1, ?, 'u1', ?, 'u1')
    `).run(client.id, JSON.stringify(client), now, now);
  }
  return { sqlite, statements, context, path, save, insertClient, user };
}

test("an unchanged poll skips payload reads and a card save queries only the requested record", async (t) => {
  const { sqlite, statements, context, path, save, insertClient } = await createStateTestDatabase(t);
  for (const id of ["c1", "c2"]) insertClient({ id, name: "Antes" });
  const before = await (await onRequestGet(context(new Request(path)))).json();
  assert.equal(before.state.clients.length, 2);

  const pollUrl = `${path}?revision=${encodeURIComponent(before.revision)}`;
  statements.length = 0;
  assert.deepEqual(await (await onRequestGet(context(new Request(pollUrl)))).json(), { ok: true, unchanged: true });
  assert.ok(statements.every(({ sql }) => !/SELECT id, payload/.test(sql)));

  function saveClient(name = "Depois") {
    return save({
      state: { clients: [{ id: "c1", name }] },
      versions: { "clients:c1": 1 },
      dirtyKeys: ["clients:c1"],
    });
  }
  statements.length = 0;
  const saved = await (await saveClient()).json();
  assert.deepEqual(saved.statePatch, { clients: [{ id: "c1", name: "Depois" }] });
  assert.deepEqual(saved.versions, { "clients:c1": 2 });
  const payloadReads = statements.filter(({ sql, values }) => /SELECT id, payload/.test(sql) && values.length);
  assert.equal(payloadReads.length, 2);
  assert.ok(payloadReads.every(({ sql, values }) => /FROM clients\s/.test(sql) && values.includes('["c1"]')));
  const tablesRead = new Set(statements.map(({ sql }) => sql.match(/SELECT id, payload[^\n]*\s+FROM (\w+)/)?.[1]).filter(Boolean));
  assert.deepEqual([...tablesRead], ["clients"]);
  assert.notEqual((await (await onRequestGet(context(new Request(pollUrl)))).json()).revision, before.revision);
  const conflict = await saveClient("Rascunho concorrente");
  assert.equal(conflict.status, 409);
  assert.deepEqual((await conflict.json()).conflicts, ["clients:c1"]);
  assert.equal(JSON.parse(sqlite.prepare("SELECT payload FROM clients WHERE id = 'c1'").get().payload).name, "Depois");

  function saveRecord(collection, item, version) {
    const key = `${collection}:${item.id}`;
    return save({ state: { [collection]: [item] }, versions: { [key]: version }, dirtyKeys: [key] });
  }

  const task = { id: "t1", title: "Preparar guias" };
  assert.equal((await saveRecord("internalTasks", task, 0)).status, 400);
  assert.equal((await saveRecord("internalTasks", { ...task, dueDate: "2026-02-30" }, 0)).status, 400);
  assert.equal((await saveRecord("internalTasks", { ...task, dueDate: "2026-11-09" }, 0)).status, 200);
  assert.equal((await saveRecord("internalTasks", { ...task, dueDate: "" }, 1)).status, 400);
  assert.equal((await saveRecord("clients", { id: "c1", tasks: [task] }, 2)).status, 400);
  assert.equal((await saveRecord("regularizationClients", { id: "r1", tasks: [task] }, 0)).status, 400);

  sqlite.prepare("UPDATE clients SET payload = ? WHERE id = 'c2'").run(JSON.stringify({ id: "c2", tasks: [task] }));
  assert.equal((await saveRecord("clients", { id: "c2", name: "Editou o cliente", tasks: [task] }, 1)).status, 200);
  assert.equal((await saveRecord("clients", { id: "c2", tasks: [{ ...task, title: "Editou a tarefa" }] }, 2)).status, 400);
  assert.equal((await saveRecord("clients", { id: "c2", tasks: [{ ...task, dueDate: "2026-11-09" }] }, 2)).status, 200);
});

test("generating and completing 57 months saves as one card and a grouped activity", async (t) => {
  const { save, insertClient, user } = await createStateTestDatabase(t);
  const source = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const between = (start, end) => source.slice(source.indexOf(`function ${start}(`), source.indexOf(`function ${end}(`));
  const fields = ["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"];
  const previousClient = { id: "example", clientName: "Cliente fictício", startDate: "2022-04-01", endDate: "2026-12-31", monthly: [] };
  insertClient(previousClient);
  let nextId = 0;
  const context = vm.createContext({
    previousClient,
    activeClient: structuredClone(previousClient),
    currentUser: user,
    state: { activities: [] },
    MONTHLY_BOOLEAN_FIELDS: fields,
    id: () => `record-${++nextId}`,
    renderMonthlyTable() {},
    activityIsWithinRetention: () => true,
    truncateHistoryValue: String,
  });
  vm.runInContext([
    between("generateMonthsFromWorkDates", "normalizeMonthRow"),
    between("setAllMonthlyField", "syncMonthlyBulkToggles"),
    between("recordClientChangeActivities", "summarizeClientChanges"),
    between("recordActivity", "scheduleCloudSave"),
    between("normalizeActivity", "normalizeTaskAnnotations"),
  ].join("\n"), context);

  async function saveDraft(version) {
    vm.runInContext('recordClientChangeActivities(previousClient, activeClient, ["Controle mensal"]);', context);
    const activities = context.state.activities;
    const response = await save({
      state: { clients: [context.activeClient], activities },
      versions: { "clients:example": version },
      dirtyKeys: ["clients:example", ...activities.map(({ id }) => `activities:${id}`)],
    });
    const payload = await response.json();
    assert.equal(response.status, 200, payload.error);
    assert.equal(payload.statePatch.activities.length, 1);
    const activity = payload.statePatch.activities[0];
    assert.equal(activity.changeCount, 57);
    assert.match(activity.detail, /Competência 2022-04/);
    assert.match(activity.detail, /Competência 2026-12/);
    context.savedActivity = activity;
    assert.equal(vm.runInContext("normalizeActivity(savedActivity).changeCount", context), 57);
    return payload.statePatch;
  }

  vm.runInContext("generateMonthsFromWorkDates(); generateMonthsFromWorkDates(); MONTHLY_BOOLEAN_FIELDS.forEach(toggleAllMonthlyField);", context);
  const created = await saveDraft(1);
  assert.equal(created.clients[0].monthly.length, 57);
  assert.ok(created.clients[0].monthly.every((row) => fields.every((field) => row[field])));
  assert.match(created.activities[0].detail, /Marcado: Recibo enviado, Recibo assinado/);

  context.previousClient = created.clients[0];
  context.state.activities = [];
  vm.runInContext('toggleAllMonthlyField("guidePaid");', context);
  const updated = await saveDraft(2);
  assert.ok(updated.clients[0].monthly.every((row) => !row.guidePaid && row.guideSent));
  assert.match(updated.activities[0].detail, /Guia paga: marcado → desmarcado/);
});
