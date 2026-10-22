import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [loginHtml, loginJs, indexHtml, redesignCss] = await Promise.all([
  readFile(new URL("../login.html", import.meta.url), "utf8"),
  readFile(new URL("../login.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
]);

test("login follows the supplied split-panel design responsively", () => {
  assert.match(loginHtml, /class="login-layout"/);
  assert.match(loginHtml, /class="brand-panel"/);
  assert.match(loginHtml, /INSS reduzido,/);
  assert.match(loginHtml, /obra regularizada\./);
  assert.match(loginHtml, /grid-template-columns:\s*51\.25% 48\.75%/);
  assert.match(loginHtml, /@media \(max-width: 860px\)/);
});

test("login keeps the secure server-session exchange", () => {
  assert.match(loginJs, /fetch\("\/auth\/session"/);
  assert.match(loginJs, /credentials:\s*"same-origin"/);
  assert.match(loginJs, /user\.getIdToken\(true\)/);
});

test("new login controls are functional and accessible", () => {
  assert.match(loginHtml, /id="togglePasswordButton"/);
  assert.match(loginHtml, /id="forgotPasswordButton"/);
  assert.match(loginHtml, /id="rememberAccess"[^>]*checked/);
  assert.match(loginJs, /sendPasswordResetEmail\(email\)/);
  assert.match(loginJs, /Auth\.Persistence\.LOCAL/);
  assert.match(loginJs, /Auth\.Persistence\.SESSION/);
  assert.match(loginJs, /setAttribute\("aria-pressed"/);
});

test("the legacy login fallback never flashes while the application starts", () => {
  assert.match(indexHtml, /<main id="loginView" class="login-view" hidden>/);
  assert.match(indexHtml, /<main id="appView" class="app-shell" hidden>/);
  assert.match(redesignCss, /#loginView\[hidden\][\s\S]*display:\s*none !important/);
});
