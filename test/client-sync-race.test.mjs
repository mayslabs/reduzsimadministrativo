import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("polling pauses for an open card and discards responses arriving during editing", async () => {
  const card = { open: true };
  let release;
  let requests = 0;
  let applied = false;
  const context = vm.createContext({
    el: { clientDialog: card },
    document: { hidden: false },
    cloudSaveInFlight: false,
    cloudSaveTimer: null,
    cloudChangeGeneration: 0,
    currentUser: {},
    state: {},
    lastCloudStateJson: "{}",
    window: {
      ReduzSimCloud: {
        async load({ onlyIfChanged, accept }) {
          requests++;
          assert.equal(onlyIfChanged, true);
          await new Promise((resolve) => { release = resolve; });
          return accept() ? { state: { clients: [] } } : null;
        },
      },
    },
    migrateState: (state) => state,
    applyCloudPayload() { applied = true; },
  });
  const start = app.indexOf("let cloudPollInFlight =");
  vm.runInContext(app.slice(start, app.indexOf("function applyCloudPayload(", start)), context);
  await vm.runInContext("pollCloudState()", context);
  assert.equal(requests, 0);
  card.open = false;
  const inFlight = vm.runInContext("pollCloudState()", context);
  await vm.runInContext("pollCloudState()", context);
  card.open = true;
  release();
  await inFlight;
  assert.equal(requests, 1);
  assert.equal(applied, false);
});

test("a sync conflict leaves local state and its baseline untouched", async () => {
  class SyncConflictError extends Error {}
  const state = { clients: [{ id: "c1", name: "Rascunho" }] };
  const context = vm.createContext({
    state,
    cloudSaveInFlight: false,
    cloudChangeGeneration: 1,
    lastCloudStateJson: "{}",
    cloneData: structuredClone,
    cloudDirtyRecordKeys: () => ["clients:c1"],
    firebaseAuth: { currentUser: {} },
    window: {
      ReduzSimCloud: {
        SyncConflictError,
        async save() { throw new SyncConflictError(); },
      },
    },
    async loadCloudState() { assert.fail("A failed save must not reload the state."); },
  });
  const start = app.indexOf("async function saveCloudStateNow(");
  vm.runInContext(app.slice(start, app.indexOf("async function flushCloudState(", start)), context);
  await assert.rejects(vm.runInContext("saveCloudStateNow()", context), { code: "SYNC_CONFLICT" });
  assert.equal(context.state, state);
  assert.equal(context.lastCloudStateJson, "{}");
  assert.equal(context.cloudSaveInFlight, false);
});

test("quick card edits save in sequence without repainting the workspace", async () => {
  const card = { id: "c1", name: "Primeira edicao" };
  const dialog = { open: true };
  const state = { clients: [] };
  const sent = [];
  let release;
  const noop = () => {};
  const context = vm.createContext({
    activeClient: card,
    state,
    clientSaveInFlight: null,
    clientViewNeedsRender: false,
    el: { clientDialog: dialog, saveClientButton: {} },
    commitActiveClientToState() {
      state.clients = [structuredClone(card)];
      return card.id;
    },
    saveState: noop,
    async flushCloudState() {
      sent.push(state.clients[0].name);
      if (sent.length === 1) await new Promise((resolve) => { release = resolve; });
    },
    cloneData: structuredClone,
    renderActiveStatuses: noop,
    renderStatusPicker: noop,
    renderNotes: noop,
    renderFinanceMessages: noop,
    renderHistory: noop,
    refreshIcons: noop,
    renderAll() { assert.fail("An open card must not repaint the workspace."); },
    console,
  });
  const start = app.indexOf("async function persistActiveClient(");
  vm.runInContext(app.slice(start, app.indexOf("function saveActiveClient(", start)), context);
  const first = vm.runInContext("persistActiveClient()", context);
  assert.equal(context.el.saveClientButton.disabled, true);
  card.name = "Segunda edicao";
  const second = vm.runInContext("persistActiveClient()", context);
  assert.deepEqual(sent, ["Primeira edicao"]);
  release();
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.deepEqual(sent, ["Primeira edicao", "Segunda edicao"]);
  assert.equal(context.clientViewNeedsRender, true);
  assert.equal(context.el.saveClientButton.disabled, false);
});
