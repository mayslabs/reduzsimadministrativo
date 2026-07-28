import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("admin-only tasks use a dedicated board in the day view", () => {
  assert.match(app, /openItems\.filter\(\(item\) => item\.visibility === "admin"\)/);
  assert.match(app, /operationalItems = openItems\.filter\(\(item\) => item\.visibility !== "admin"\)/);
  assert.match(app, /Tarefas da administração/);
  assert.match(app, /task-admin-board/);
  assert.match(styles, /\.task-work-panel\.admin-only/);
});
