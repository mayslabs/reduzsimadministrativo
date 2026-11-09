import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";
import {
  isTrustedMutation,
  jsonResponse,
  sanitizeNext,
} from "../functions/lib/http.js";

test("adds the required security headers", async () => {
  const response = jsonResponse({ ok: true });
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store, max-age=0");
  assert.match(response.headers.get("Content-Security-Policy"), /frame-ancestors 'none'/);
  assert.deepEqual(await response.json(), { ok: true });
});

test("accepts only same-origin mutations", () => {
  assert.equal(isTrustedMutation(new Request("https://crm.example.test/api/state", {
    method: "POST",
    headers: { Origin: "https://crm.example.test" },
  })), true);
  assert.equal(isTrustedMutation(new Request("https://crm.example.test/api/state", {
    method: "POST",
    headers: { Origin: "https://attacker.example" },
  })), false);
});

test("prevents open redirects in the server and browser login", async () => {
  const source = await readFile(new URL("../login.js", import.meta.url), "utf8");
  const sandbox = { URL, window: { location: { origin: "https://crm.example.test" } } };
  runInNewContext(source.replace(/\(\(\) => \{/, "(() => { globalThis.safeNext = safeNext; return;"), sandbox);
  for (const check of [sanitizeNext, sandbox.safeNext]) {
    assert.equal(check("https://attacker.example"), "/");
    assert.equal(check("//attacker.example"), "/");
    assert.equal(check("/\\attacker.example"), "/");
    assert.equal(check("/\t/attacker.example"), "/");
    assert.equal(check("/auth/session"), "/");
    assert.equal(check("/./auth/session"), "/");
    assert.equal(check("/?view=tasks"), "/?view=tasks");
  }
});
