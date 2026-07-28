import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const index = await readFile(new URL("../index.html", import.meta.url), "utf8");
const legacyRedirect = await readFile(new URL("../legacy-redirect.js", import.meta.url), "utf8");
const middleware = await readFile(new URL("../functions/_middleware.js", import.meta.url), "utf8");
const stateApi = await readFile(new URL("../functions/api/state.js", import.meta.url), "utf8");
const schema = await readFile(new URL("../migrations/0001_crm.sql", import.meta.url), "utf8");

test("frontend no longer stores the CRM state in localStorage or loads Firestore", () => {
  assert.doesNotMatch(app, /localStorage\.setItem\(STORAGE_KEY/);
  assert.doesNotMatch(app, /firebaseStateRef|firebaseDb|unsubscribeCloudState/);
  assert.doesNotMatch(index, /firebase-firestore-compat/);
  assert.match(index, /cloudflare-sync\.js/);
});

test("legacy GitHub Pages address redirects to the protected deployment", () => {
  assert.match(index, /legacy-redirect\.js/);
  assert.match(legacyRedirect, /mayslabs\.github\.io/);
  assert.match(legacyRedirect, /https:\/\/reduzsim-gestao\.pages\.dev\//);
});

test("application pages are protected by server middleware", () => {
  assert.match(middleware, /readSession/);
  assert.match(middleware, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.match(middleware, /login\.html/);
  assert.match(middleware, /return await handleSessionExchange\(context\)/);
  assert.match(middleware, /code: "INVALID_TOKEN" \}, 401/);
  assert.doesNotMatch(middleware, /PUBLIC_PATHS[\s\S]*"\/index\.html"/);
});

test("database separates private finance and activity read state", () => {
  assert.match(schema, /CREATE TABLE IF NOT EXISTS company_bills/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS activity_reads/);
  assert.match(schema, /scope TEXT NOT NULL DEFAULT 'admin'/);
});

test("multi-user saves are scoped to records changed in the browser", () => {
  assert.match(app, /cloudDirtyRecordKeys/);
  assert.match(stateApi, /normalizeDirtyKeys/);
  assert.match(stateApi, /dirtyKeys\.has\(recordKey\)/);
});

test("regularization history and shared configuration stay protected", () => {
  assert.match(
    stateApi,
    /stateKey:\s*"regularizationClients"[\s\S]*?protectHistory:\s*true/,
  );
  assert.match(stateApi, /regularizationFieldDefinitions/);
  assert.match(stateApi, /regularizationStatusDefinitions/);
  assert.match(app, /dedupeCommercialRecords/);
  assert.match(app, /contractId/);
});
