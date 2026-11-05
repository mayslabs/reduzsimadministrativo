import assert from "node:assert/strict";
import test from "node:test";

import { compactStatePayload } from "../functions/api/state.js";

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
