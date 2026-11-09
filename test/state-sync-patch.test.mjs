import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

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

test("an unchanged poll skips payload reads and a card save queries only the requested record", async (t) => {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  for (const migration of ["0001_crm.sql", "0002_marketing.sql"]) {
    sqlite.exec(await readFile(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
  }
  const now = new Date().toISOString();
  for (const id of ["c1", "c2"]) {
    sqlite.prepare(`
      INSERT INTO clients (id, payload, scope, version, created_at, created_by, updated_at, updated_by)
      VALUES (?, ?, 'team', 1, ?, 'u1', ?, 'u1')
    `).run(id, JSON.stringify({ id, name: "Antes" }), now, now);
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
  const before = await (await onRequestGet(context(new Request(path)))).json();
  assert.equal(before.state.clients.length, 2);

  const pollUrl = `${path}?revision=${encodeURIComponent(before.revision)}`;
  statements.length = 0;
  assert.deepEqual(await (await onRequestGet(context(new Request(pollUrl)))).json(), { ok: true, unchanged: true });
  assert.ok(statements.every(({ sql }) => !/SELECT id, payload/.test(sql)));

  function save(name = "Depois") {
    return onRequestPost(context(new Request(path, {
      method: "POST",
      headers: { Origin: new URL(path).origin, "Content-Type": "application/json" },
      body: JSON.stringify({
        state: { clients: [{ id: "c1", name }] },
        versions: { "clients:c1": 1 },
        dirtyKeys: ["clients:c1"],
        compact: true,
      }),
    })));
  }
  statements.length = 0;
  const saved = await (await save()).json();
  assert.deepEqual(saved.statePatch, { clients: [{ id: "c1", name: "Depois" }] });
  assert.deepEqual(saved.versions, { "clients:c1": 2 });
  const payloadReads = statements.filter(({ sql, values }) => /SELECT id, payload/.test(sql) && values.length);
  assert.equal(payloadReads.length, 2);
  assert.ok(payloadReads.every(({ sql, values }) => /FROM clients\s/.test(sql) && values.includes('["c1"]')));
  const tablesRead = new Set(statements.map(({ sql }) => sql.match(/SELECT id, payload[^\n]*\s+FROM (\w+)/)?.[1]).filter(Boolean));
  assert.deepEqual([...tablesRead], ["clients"]);
  assert.notEqual((await (await onRequestGet(context(new Request(pollUrl)))).json()).revision, before.revision);
  const conflict = await save("Rascunho concorrente");
  assert.equal(conflict.status, 409);
  assert.deepEqual((await conflict.json()).conflicts, ["clients:c1"]);
  assert.equal(JSON.parse(sqlite.prepare("SELECT payload FROM clients WHERE id = 'c1'").get().payload).name, "Depois");

  function saveRecord(collection, item, version) {
    const key = `${collection}:${item.id}`;
    return onRequestPost(context(new Request(path, {
      method: "POST",
      headers: { Origin: new URL(path).origin, "Content-Type": "application/json" },
      body: JSON.stringify({
        state: { [collection]: [item] },
        versions: { [key]: version },
        dirtyKeys: [key],
        compact: true,
      }),
    })));
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
