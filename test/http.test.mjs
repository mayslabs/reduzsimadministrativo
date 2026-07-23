import assert from "node:assert/strict";
import test from "node:test";
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

test("prevents open redirects", () => {
  assert.equal(sanitizeNext("https://attacker.example"), "/");
  assert.equal(sanitizeNext("//attacker.example"), "/");
  assert.equal(sanitizeNext("/auth/session"), "/");
  assert.equal(sanitizeNext("/?view=tasks"), "/?view=tasks");
});
