import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const source = app.slice(app.indexOf("function renderClientDocumentCopy("), app.indexOf("function syncReferralCommissionFields("));
const digits = app.slice(app.indexOf("function onlyDigits("), app.indexOf("function normalizeClientSelectValues("));

function fixture(value, writeText) {
  const input = { value };
  const button = { dataset: {}, setAttribute(name, text) { this[name] = text; } };
  const status = { textContent: "" };
  const calls = [];
  const prompts = [];
  const client = { cpf: "different saved value", updatedAt: "2026-11-10T12:00:00.000Z" };
  const context = vm.createContext({
    el: {
      clientDialog: { querySelector: () => input },
      copyClientDocumentButton: button,
      clientDocumentCopyStatus: status,
    },
    activeClient: client,
    navigator: { clipboard: { writeText: writeText || (async (text) => calls.push(text)) } },
    prompt: (...args) => prompts.push(args),
  });
  vm.runInContext(`${digits}\n${source}`, context);
  return { input, button, status, calls, prompts, client, context };
}

test("document copy button is accessible, non-submitting and connected to the current field", () => {
  assert.match(html, /<button id="copyClientDocumentButton"[^>]*type="button"[^>]*title="[^"]+"[^>]*aria-label="[^"]+"[^>]*disabled>/);
  assert.match(html, /id="clientDocumentCopyStatus"[^>]*role="status"/);
  assert.match(app, /el\.copyClientDocumentButton\.addEventListener\("click", copyClientDocument\)/);
  assert.match(app, /if \(\["cpf", "documentType"\]\.includes\(field\)\) renderClientDocumentCopy\(\)/);
  assert.match(app, /fillClientFields\(\);\s*renderClientDocumentCopy\(\)/);
});

test("copies only the displayed CPF or CNPJ digits and preserves leading zeroes without saving", async () => {
  for (const [formatted, expected] of [["012.345.678-90", "01234567890"], ["01.234.567/0001-89", "01234567000189"]]) {
    const f = fixture(formatted);
    const before = JSON.stringify(f.client);
    f.context.renderClientDocumentCopy();
    assert.equal(f.button.disabled, false);
    await f.context.copyClientDocument();
    assert.deepEqual(f.calls, [expected]);
    assert.equal(f.input.value, formatted);
    assert.equal(JSON.stringify(f.client), before);
    assert.equal(f.button.dataset.copied, "true");
    assert.match(f.status.textContent, /copiado/);
    assert.deepEqual(f.prompts, []);
  }
});

test("empty documents cannot overwrite the clipboard or show success", async () => {
  for (const value of ["", ".../--"]) {
    const f = fixture(value);
    f.context.renderClientDocumentCopy(true);
    assert.equal(f.button.disabled, true);
    assert.equal(f.button.dataset.copied, "false");
    assert.equal(f.status.textContent, "");
    await f.context.copyClientDocument();
    assert.deepEqual(f.calls, []);
    assert.deepEqual(f.prompts, []);
  }
});

test("editing the document or opening a card resets the copy confirmation", async () => {
  const f = fixture("012.345.678-90");
  await f.context.copyClientDocument();
  f.input.value = "01.234.567/0001-89";
  f.context.renderClientDocumentCopy();
  assert.equal(f.button.dataset.copied, "false");
  assert.equal(f.status.textContent, "");
  assert.match(f.button["aria-label"], /^Copiar/);
});

test("clipboard failures offer unformatted digits for manual copying without false success", async () => {
  for (const unavailable of [false, true]) {
    const f = fixture("01.234.567/0001-89", async () => { throw new Error("NotAllowedError"); });
    if (unavailable) f.context.navigator.clipboard = undefined;
    f.context.renderClientDocumentCopy();
    await f.context.copyClientDocument();
    assert.equal(f.prompts.length, 1);
    assert.equal(f.prompts[0][1], "01234567000189");
    assert.equal(f.button.dataset.copied, "false");
    assert.equal(f.status.textContent, "");
  }
});

test("a delayed copy does not confirm success on a different card or edited document", async () => {
  for (const changeClient of [false, true]) {
    let finish;
    const f = fixture("012.345.678-90", () => new Promise((resolve) => { finish = resolve; }));
    f.context.renderClientDocumentCopy();
    const copying = f.context.copyClientDocument();
    if (changeClient) f.context.activeClient = { cpf: "012.345.678-90" };
    else f.input.value = "";
    finish();
    await copying;
    assert.equal(f.button.dataset.copied, "false");
    assert.equal(f.status.textContent, "");
  }
});
