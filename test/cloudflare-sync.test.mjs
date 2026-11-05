import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../cloudflare-sync.js", import.meta.url), "utf8");

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("cloud saves send only dirty records and preserve unrelated versions", async () => {
  const requests = [];
  const responses = [
    {
      state: { clients: [{ id: "c1", name: "Um" }, { id: "c2", name: "Dois" }] },
      versions: { "clients:c1": 1, "clients:c2": 7 },
      lastSeq: 1,
      currentUser: { id: "admin", role: "admin" },
    },
    {
      statePatch: { clients: [{ id: "c1", name: "Um salvo", updatedAt: "server" }] },
      versions: { "clients:c1": 2 },
      partialVersions: true,
      deletedKeys: [],
      lastSeq: 2,
      currentUser: { id: "admin", role: "admin" },
    },
    {
      statePatch: { clients: [{ id: "c2", name: "Dois salvo" }] },
      versions: { "clients:c2": 8 },
      partialVersions: true,
      deletedKeys: [],
      lastSeq: 3,
      currentUser: { id: "admin", role: "admin" },
    },
  ];
  const context = {
    structuredClone,
    encodeURIComponent,
    console,
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      return jsonResponse(responses.shift());
    },
    window: {
      location: { pathname: "/", replace() {} },
    },
  };
  vm.runInNewContext(source, context);

  const loaded = await context.window.ReduzSimCloud.load();
  const state = structuredClone(loaded.state);
  state.clients[0].name = "Um alterado";
  const firstSave = await context.window.ReduzSimCloud.save(state, ["clients:c1"]);

  const firstBody = JSON.parse(requests[1].options.body);
  assert.equal(firstBody.compact, true);
  assert.deepEqual(firstBody.dirtyKeys, ["clients:c1"]);
  assert.deepEqual(firstBody.versions, { "clients:c1": 1 });
  assert.deepEqual(firstBody.state, { clients: [{ id: "c1", name: "Um alterado" }] });
  assert.deepEqual(plain(firstSave.state.clients), [
    { id: "c1", name: "Um salvo", updatedAt: "server" },
    { id: "c2", name: "Dois" },
  ]);

  firstSave.state.clients[1].name = "Dois alterado";
  await context.window.ReduzSimCloud.save(firstSave.state, ["clients:c2"]);
  const secondBody = JSON.parse(requests[2].options.body);
  assert.deepEqual(secondBody.versions, { "clients:c2": 7 });
  assert.deepEqual(secondBody.state, { clients: [{ id: "c2", name: "Dois alterado" }] });
});

test("cloud patches keep deletions scoped to the requested record", async () => {
  const requests = [];
  const responses = [
    {
      state: { clients: [{ id: "c1" }, { id: "c2" }] },
      versions: { "clients:c1": 4, "clients:c2": 9 },
      lastSeq: 1,
      currentUser: { id: "admin", role: "admin" },
    },
    {
      statePatch: { clients: [] },
      versions: {},
      partialVersions: true,
      deletedKeys: ["clients:c1"],
      lastSeq: 2,
      currentUser: { id: "admin", role: "admin" },
    },
  ];
  const context = {
    structuredClone,
    encodeURIComponent,
    console,
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      return jsonResponse(responses.shift());
    },
    window: {
      location: { pathname: "/", replace() {} },
    },
  };
  vm.runInNewContext(source, context);

  const loaded = await context.window.ReduzSimCloud.load();
  const nextState = { clients: loaded.state.clients.filter((client) => client.id !== "c1") };
  const saved = await context.window.ReduzSimCloud.save(nextState, ["clients:c1"]);
  const body = JSON.parse(requests[1].options.body);

  assert.deepEqual(body.state, { clients: [] });
  assert.deepEqual(body.versions, { "clients:c1": 4 });
  assert.deepEqual(plain(saved.state.clients), [{ id: "c2" }]);
});
