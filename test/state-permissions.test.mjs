import assert from "node:assert/strict";
import test from "node:test";
import { protectExistingHistory } from "../functions/api/state.js";

const storedEntry = {
  details: ["Status alterado."],
  updatedAt: null,
  type: "system",
  title: "Card atualizado",
  id: "history-1",
  userId: "user-mayssa",
  createdAt: "2026-07-20T12:00:00.000Z",
};

function normalizedStoredEntry() {
  return {
    id: "history-1",
    title: "Card atualizado",
    details: ["Status alterado."],
    userId: "user-mayssa",
    type: "system",
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: null,
  };
}

test("non-admin saves tolerate history property order changes", () => {
  const next = {
    id: "client-1",
    history: [normalizedStoredEntry()],
  };

  const result = protectExistingHistory(
    { id: "client-1", history: [storedEntry] },
    next,
    { id: "user-contato", role: "user" },
    "2026-07-24T12:00:00.000Z",
  );

  assert.deepEqual(result.history, [storedEntry]);
});

test("non-admin cannot edit or remove an existing history entry", () => {
  const edited = normalizedStoredEntry();
  edited.details = ["Conteudo alterado."];

  assert.throws(
    () => protectExistingHistory(
      { id: "client-1", history: [storedEntry] },
      { id: "client-1", history: [edited] },
      { id: "user-contato", role: "user" },
      "2026-07-24T12:00:00.000Z",
    ),
    /Somente a administradora/,
  );

  assert.throws(
    () => protectExistingHistory(
      { id: "client-1", history: [storedEntry] },
      { id: "client-1", history: [] },
      { id: "user-contato", role: "user" },
      "2026-07-24T12:00:00.000Z",
    ),
    /Somente a administradora/,
  );
});

test("new history entries are attributed to the non-admin actor", () => {
  const newEntry = {
    id: "history-2",
    title: "Card atualizado",
    details: ["Anotacao adicionada."],
    userId: "user-mayssa",
    type: "system",
    createdAt: "",
    updatedAt: "2026-07-24T11:00:00.000Z",
  };

  const result = protectExistingHistory(
    { id: "client-1", history: [storedEntry] },
    { id: "client-1", history: [newEntry, normalizedStoredEntry()] },
    { id: "user-contato", role: "user" },
    "2026-07-24T12:00:00.000Z",
  );

  assert.equal(result.history[0].userId, "user-contato");
  assert.equal(result.history[0].createdAt, "2026-07-24T12:00:00.000Z");
  assert.equal(result.history[0].updatedAt, null);
  assert.deepEqual(result.history[1], storedEntry);
});
