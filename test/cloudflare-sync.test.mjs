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

test("cloud saves recover when the write succeeded but its response was lost", async () => {
  const requests = [];
  const loadedState = { clients: [{ id: "c1", name: "Antes" }] };
  const savedState = { clients: [{ id: "c1", name: "Depois" }] };
  let step = 0;
  const context = {
    structuredClone,
    encodeURIComponent,
    console,
    setTimeout: (callback) => callback(),
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      step += 1;
      if (step === 1) {
        return jsonResponse({
          ok: true,
          state: loadedState,
          versions: { "clients:c1": 1 },
          lastSeq: 1,
          currentUser: { id: "admin", role: "admin" },
        });
      }
      if (step === 2) throw new TypeError("connection reset");
      return jsonResponse({
        ok: true,
        state: savedState,
        versions: { "clients:c1": 2 },
        lastSeq: 2,
        currentUser: { id: "admin", role: "admin" },
      });
    },
    window: {
      location: { pathname: "/", replace() {} },
    },
  };
  vm.runInNewContext(source, context);

  const loaded = await context.window.ReduzSimCloud.load();
  loaded.state.clients[0].name = "Depois";
  const saved = await context.window.ReduzSimCloud.save(loaded.state, ["clients:c1"]);

  assert.equal(requests.length, 3);
  assert.equal(requests[1].options.method, "POST");
  assert.equal(requests[2].options.method, "GET");
  assert.deepEqual(plain(saved.state), savedState);
});

test("cloud saves retry a transient server failure after verification", async () => {
  const requests = [];
  const loadedState = { clients: [{ id: "c1", name: "Antes" }] };
  let step = 0;
  const context = {
    structuredClone,
    encodeURIComponent,
    console,
    setTimeout: (callback) => callback(),
    fetch: async (url, options = {}) => {
      requests.push({ url, options });
      step += 1;
      if (step === 1) {
        return jsonResponse({
          ok: true,
          state: loadedState,
          versions: { "clients:c1": 3 },
          lastSeq: 1,
          currentUser: { id: "admin", role: "admin" },
        });
      }
      if (step === 2) {
        return jsonResponse({ error: "Temporariamente indisponível", code: "STATE_SAVE_FAILED" }, 503);
      }
      if (step === 3) {
        return jsonResponse({
          ok: true,
          state: { clients: [{ id: "c1", name: "Antes" }] },
          versions: { "clients:c1": 3 },
          lastSeq: 1,
          currentUser: { id: "admin", role: "admin" },
        });
      }
      return jsonResponse({
        ok: true,
        statePatch: { clients: [{ id: "c1", name: "Depois" }] },
        versions: { "clients:c1": 4 },
        partialVersions: true,
        deletedKeys: [],
        lastSeq: 2,
        currentUser: { id: "admin", role: "admin" },
      });
    },
    window: {
      location: { pathname: "/", replace() {} },
    },
  };
  vm.runInNewContext(source, context);

  const loaded = await context.window.ReduzSimCloud.load();
  loaded.state.clients[0].name = "Depois";
  const saved = await context.window.ReduzSimCloud.save(loaded.state, ["clients:c1"]);

  assert.equal(requests.length, 4);
  assert.deepEqual(plain(saved.state.clients), [{ id: "c1", name: "Depois" }]);
});

test("a discarded poll cannot advance the versions used to save a draft", async () => {
  const requests = [];
  const responses = [
    jsonResponse({ state: {}, versions: { "clients:c1": 1 }, revision: "r1" }),
    jsonResponse({ ok: true, unchanged: true }),
    jsonResponse({ state: {}, versions: { "clients:c1": 2 }, revision: "r2" }),
    jsonResponse({ code: "SYNC_CONFLICT", conflicts: ["clients:c1"] }, 409),
  ];
  const context = {
    structuredClone,
    encodeURIComponent,
    fetch: async (url, options) => {
      requests.push({ url, options });
      return responses.shift();
    },
    window: {},
  };
  vm.runInNewContext(source, context);
  const cloud = context.window.ReduzSimCloud;
  await cloud.load();
  assert.equal(await cloud.load({ onlyIfChanged: true }), null);
  assert.equal(await cloud.load({ onlyIfChanged: true, accept: () => false }), null);
  await assert.rejects(cloud.save({ clients: [{ id: "c1" }] }, ["clients:c1"]), { code: "SYNC_CONFLICT" });
  assert.equal(requests[1].url, "/api/state?revision=r1");
  assert.equal(requests[2].url, "/api/state?revision=r1");
  assert.deepEqual(JSON.parse(requests[3].options.body).versions, { "clients:c1": 1 });
});

test("an expired session reports the failed save without navigating away", async () => {
  let redirected = false;
  const context = {
    structuredClone,
    fetch: async () => jsonResponse({ code: "UNAUTHORIZED" }, 401),
    window: { location: { replace() { redirected = true; } } },
  };
  vm.runInNewContext(source, context);
  await assert.rejects(context.window.ReduzSimCloud.save({}, []), { code: "UNAUTHORIZED" });
  assert.equal(redirected, false);
});
