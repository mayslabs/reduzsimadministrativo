import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { ownerChanges, transferStatements } from "../scripts/transfer-open-work.mjs";

test("reassigns open work without changing the card date, creator or completed history", async (t) => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  db.exec(await readFile(new URL("../migrations/0001_crm.sql", import.meta.url), "utf8"));
  const from = "former";
  const to = "remaining";
  const now = "2026-11-17T12:00:00.000Z";
  const previousUpdate = "2026-11-10T12:00:00.000Z";
  const today = now.slice(0, 10);
  const closed = { ownerId: from, status: "Concluído" };
  const pending = { ownerId: from, status: "Pendente", createdBy: from, annotations: [{ authorId: from }] };
  const client = {
    internalOwner: from, tasks: [closed, pending], deadlines: [pending],
    works: [{ tasks: [pending] }], history: [{ userId: from }], notes: [{ userId: from }],
    updatedAt: previousUpdate,
  };
  const changes = ownerChanges("clients", client, from, today);
  assert.deepEqual(changes.map(({ path }) => path), ["$.internalOwner", "$.tasks[1].ownerId", "$.deadlines[0].ownerId", "$.works[0].tasks[0].ownerId"]);
  assert.equal(ownerChanges("clients", { ...client, statusIds: ["done"] }, from, today, new Set(["done"])).length, 3);
  assert.deepEqual(ownerChanges("marketing_items", { ownerId: from, status: "Publicado" }, from, today), []);
  assert.deepEqual(ownerChanges("meetings", { ownerId: from, date: "2026-11-16" }, from, today), []);
  for (const table of ["clients", "regularization_clients"]) {
    db.prepare(`INSERT INTO ${table} (id, payload, created_at, created_by, updated_at, updated_by) VALUES ('sample', ?, ?, ?, ?, ?)`)
      .run(JSON.stringify(client), previousUpdate, from, previousUpdate, from);
    const statements = transferStatements(table, { id: "sample", version: 1 }, ownerChanges(table, client, from, today), to, now);
    db.exec(statements.join("\n"));
    db.exec(statements.join("\n"));
    const saved = db.prepare(`SELECT payload, version, updated_at, updated_by FROM ${table} WHERE id = 'sample'`).get();
    assert.equal(saved.version, 2);
    assert.equal(saved.updated_at, now);
    assert.equal(saved.updated_by, to);
    assert.deepEqual(JSON.parse(saved.payload), {
      ...client, internalOwner: to, tasks: [closed, { ...pending, ownerId: to }], deadlines: [{ ...pending, ownerId: to }],
      works: [{ tasks: [{ ...pending, ownerId: to }] }],
    });
  }
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM sync_log").get().count, 2);
});
