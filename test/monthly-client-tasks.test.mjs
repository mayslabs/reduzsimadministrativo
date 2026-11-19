import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import vm from "node:vm";
import { currentCompetence, eligibleMonthlyClient, ensureMonthlyClientTasks, monthlyTaskPlan, preserveMonthlyTaskIdentity, shiftCompetence, MONTHLY_TASK_SETTING } from "../functions/lib/monthly-client-tasks.js";

const now = "2026-11-19T12:00:00.000Z";
const config = { enabled: true, startMonth: "2026-11", clientIds: ["active", "admin", "finished"], ownerId: "mayssa", createdBy: "mayssa", generatedThrough: "" };
const card = { id: "active", clientName: "Cliente fictício", workTitle: "Obra teste", internalOwner: "mayssa", tasks: [], updatedAt: "2026-11-10T12:00:00.000Z", history: [{ text: "Preservar" }], monthly: [{ month: "2026-11", receiptSent: false, guidePaid: false }] };

test("monthly reminders use the reference competence and the requested five-step sequence", () => {
  const tasks = monthlyTaskPlan(card, { ...config, startMonth: "2026-04" }, "2026-04", now, "mayssa");
  assert.equal(tasks.length, 5);
  assert.deepEqual(tasks.map((task) => task.dueDate), ["2026-04-03", "2026-04-10", "2026-04-15", "2026-05-10", "2026-05-18"]);
  assert.equal(tasks[0].startDate, "2026-04-01");
  assert.ok(tasks.every((task) => task.title.endsWith("04/2026") && task.status === "Pendente" && task.completedAt === null));
  assert.ok(tasks.every((task) => task.monthlyRoutine.clientId === card.id && task.monthlyRoutine.workId === card.id));
  assert.match(tasks[0].description, /pagamentos já realizados/);
  assert.match(tasks[3].description, /sem impedir o cumprimento do prazo legal/);
  assert.match(tasks[3].description, /DCTFWeb/);
  assert.match(tasks[4].description, /vencimento real/);
});

test("December rolls over to January without changing the reference competence", () => {
  const tasks = monthlyTaskPlan(card, { ...config, startMonth: "2026-12" }, "2027-01", now, "mayssa");
  assert.deepEqual(tasks.slice(3, 5).map((task) => task.dueDate), ["2027-01-10", "2027-01-18"]);
  assert.ok(tasks.slice(0, 5).every((task) => task.title.endsWith("12/2026")));
  assert.deepEqual(tasks.slice(8).map((task) => task.dueDate), ["2027-02-10", "2027-02-18"]);
  assert.equal(shiftCompetence("2026-12", 1), "2027-01");
  assert.equal(shiftCompetence("2027-01", -1), "2026-12");
  assert.equal(currentCompetence("2027-01-01T02:59:59Z"), "2026-12");
  assert.equal(currentCompetence("2027-01-01T03:00:00Z"), "2027-01");
  for (const value of ["2026-13", "2026-00", "2026-1", "invalid"]) assert.throws(() => shiftCompetence(value, 1));
});

test("completed or rescheduled tasks retain their identity and are not duplicated", () => {
  const original = monthlyTaskPlan(card, config, "2026-11", now, "mayssa");
  const completed = { ...original[0], dueDate: "2026-11-25", status: "Concluída", completedAt: now, history: [{ text: "Preservar" }] };
  const next = monthlyTaskPlan({ ...card, tasks: [completed] }, config, "2026-11", now, "mayssa");
  assert.equal(next.length, 4);
  assert.ok(next.every((task) => task.monthlyRoutine.activity !== "documents"));
  assert.deepEqual(completed.history, [{ text: "Preservar" }]);
  assert.equal(monthlyTaskPlan({ ...card, tasks: original.map(({ title }) => ({ title })) }, config, "2026-11", now, "mayssa").length, 0);
  const otherWork = monthlyTaskPlan({ ...card, id: "other-work", tasks: [] }, config, "2026-11", now, "mayssa");
  assert.notEqual(otherWork[0].id, original[0].id);
});

test("administrative proceedings and finished clients are excluded even with other active statuses", () => {
  const statuses = [{ id: "a", name: "Processo administrativo" }, { id: "f", name: "Finalizado" }, { id: "e", name: "eSocial em andamento" }];
  assert.equal(eligibleMonthlyClient({ statusIds: ["a", "e"] }, statuses), false);
  assert.equal(eligibleMonthlyClient({ statusIds: ["f"] }, statuses), false);
  assert.equal(eligibleMonthlyClient({ status: "PROCESSO ADMINISTRATIVO" }, statuses), false);
  assert.equal(eligibleMonthlyClient({ statusIds: ["e"] }, statuses), true);
});

async function database(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  sqlite.exec(await readFile(new URL("../migrations/0001_crm.sql", import.meta.url), "utf8"));
  let beforeWrite;
  const prepare = (sql, values = []) => ({ sql, values, bind: (...params) => prepare(sql, params), first: async () => sqlite.prepare(sql).get(...values) });
  const db = { prepare, async batch(queries) {
    if (queries.some((query) => /^\s*(INSERT|UPDATE)/.test(query.sql)) && beforeWrite) {
      const hook = beforeWrite;
      beforeWrite = null;
      await hook();
    }
    sqlite.exec("BEGIN");
    try {
      const results = queries.map((query) => ({ results: sqlite.prepare(query.sql).all(...query.values) }));
      sqlite.exec("COMMIT");
      return results;
    } catch (error) { sqlite.exec("ROLLBACK"); throw error; }
  } };
  sqlite.prepare("INSERT INTO app_users (id,email,name,role,enabled,created_at,updated_at) VALUES ('mayssa','test@example.test','Mayssa','admin',1,?,?)").run(now, now);
  const insert = (id, payload) => sqlite.prepare("INSERT INTO clients (id,payload,scope,version,created_at,created_by,updated_at,updated_by) VALUES (?,?,'team',1,?,'mayssa',?,'mayssa')").run(id, JSON.stringify({ ...payload, id }), now, now);
  insert("active", card);
  insert("admin", { ...card, statusIds: ["admin-status"] });
  insert("finished", { ...card, statusIds: ["finished-status"] });
  for (const [id, name] of [["admin-status", "Processo administrativo"], ["finished-status", "Finalizado"]]) {
    sqlite.prepare("INSERT INTO statuses (id,payload,created_at,created_by,updated_at,updated_by) VALUES (?,?,?,'system',?,'system')").run(id, JSON.stringify({ name }), now, now);
  }
  const enable = (value = config) => sqlite.prepare("INSERT INTO app_settings (key,value_json,scope,updated_at,updated_by) VALUES (?,?,'admin',?,'mayssa')").run(MONTHLY_TASK_SETTING, JSON.stringify(value), now);
  const read = (id = "active") => JSON.parse(sqlite.prepare("SELECT payload FROM clients WHERE id=?").get(id).payload);
  return { db, sqlite, enable, read, beforeWrite: (hook) => { beforeWrite = hook; } };
}

test("generation is opt-in, excludes administrative cards, and never changes card dates, progress or history", async (t) => {
  const f = await database(t);
  assert.deepEqual(await ensureMonthlyClientTasks(f.db, now), { created: 0, clients: 0 });
  f.enable();
  const result = await ensureMonthlyClientTasks(f.db, now);
  assert.equal(result.created, 5);
  assert.equal(result.clients, 1);
  assert.equal(result.applied, true);
  const saved = f.read();
  assert.deepEqual({ ...saved, tasks: [] }, card);
  assert.equal(saved.tasks.length, 5);
  assert.deepEqual(f.read("admin").tasks, []);
  assert.deepEqual(f.read("finished").tasks, []);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM activities").get().n, 0);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM sync_log WHERE record_type='clients'").get().n, 1);
  const count = f.sqlite.prepare("SELECT COUNT(*) AS n FROM sync_log").get().n;
  await ensureMonthlyClientTasks(f.db, now);
  assert.equal(f.read().tasks.length, 5);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM sync_log").get().n, count);
});

test("new competences are generated without waiting for old tasks to be completed", async (t) => {
  const f = await database(t);
  f.enable();
  await ensureMonthlyClientTasks(f.db, now);
  const prior = f.read().tasks;
  await ensureMonthlyClientTasks(f.db, "2026-12-01T03:00:00.000Z");
  assert.equal(f.read().tasks.length, 10);
  assert.deepEqual(f.read().tasks.slice(0, 5), prior);
  assert.equal(f.read().tasks.at(-1).dueDate, "2027-01-18");
  assert.equal(f.read().updatedAt, card.updatedAt);
  const saved = f.read();
  saved.tasks.splice(0, 1);
  f.sqlite.prepare("UPDATE clients SET payload=? WHERE id='active'").run(JSON.stringify(saved));
  await ensureMonthlyClientTasks(f.db, "2026-12-02T03:00:00.000Z");
  assert.equal(f.read().tasks.length, 9);
});

test("a conflicting client save does not overwrite new data or advance the monthly checkpoint", async (t) => {
  const f = await database(t);
  f.enable();
  f.beforeWrite(() => f.sqlite.exec("UPDATE clients SET version=version+1,payload=json_set(payload,'$.testNote','newer save') WHERE id='active'"));
  assert.equal((await ensureMonthlyClientTasks(f.db, now)).applied, false);
  assert.equal(f.read().testNote, "newer save");
  assert.equal(f.read().tasks.length, 0);
  assert.equal(JSON.parse(f.sqlite.prepare("SELECT value_json FROM app_settings WHERE key=?").get(MONTHLY_TASK_SETTING).value_json).generatedThrough, "");
  assert.equal((await ensureMonthlyClientTasks(f.db, now)).created, 5);
  assert.equal(f.read().testNote, "newer save");
  assert.equal(f.read().tasks.length, 5);
});

test("simultaneous generation cannot duplicate tasks or audit records", async (t) => {
  const f = await database(t);
  f.enable();
  f.beforeWrite(() => ensureMonthlyClientTasks(f.db, "2026-11-19T12:00:01.000Z"));
  await ensureMonthlyClientTasks(f.db, now);
  assert.equal(f.read().tasks.length, 5);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM sync_log WHERE record_type='clients'").get().n, 1);
  assert.equal(f.sqlite.prepare("SELECT COUNT(*) AS n FROM sync_log WHERE record_type='settings'").get().n, 1);
});

test("later administrative status stops new occurrences and a paused routine does not generate", async (t) => {
  const f = await database(t);
  f.enable();
  await ensureMonthlyClientTasks(f.db, now);
  f.sqlite.exec("UPDATE clients SET payload=json_set(payload,'$.statusIds',json('[\"admin-status\"]')) WHERE id='active'");
  await ensureMonthlyClientTasks(f.db, "2026-12-01T12:00:00.000Z");
  assert.equal(f.read().tasks.length, 5);
  f.sqlite.prepare("UPDATE app_settings SET value_json=json_set(value_json,'$.enabled',json('false')) WHERE key=?").run(MONTHLY_TASK_SETTING);
  assert.deepEqual(await ensureMonthlyClientTasks(f.db, "2027-01-01T12:00:00.000Z"), { created: 0, clients: 0 });
});

test("legacy tabs cannot discard routine identity, start dates or enable completion-based duplicates", () => {
  const tasks = monthlyTaskPlan(card, config, "2026-11", now, "mayssa");
  const next = { tasks: [{ id: tasks[0].id, status: "Concluída", dueDate: "2026-11-25" }] };
  preserveMonthlyTaskIdentity({ tasks }, next);
  assert.deepEqual(next.tasks[0].monthlyRoutine, tasks[0].monthlyRoutine);
  assert.equal(next.tasks[0].startDate, "2026-11-01");
  assert.equal(next.tasks[0].dueDate, "2026-11-25");
  assert.equal(next.tasks[0].proximaGerada, true);
});

test("the task UI preserves competence, shows start dates and delegates monthly generation to the server", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const api = await readFile(new URL("../functions/api/state.js", import.meta.url), "utf8");
  assert.match(app, /task\.monthlyRoutine \? \{ monthlyRoutine: task\.monthlyRoutine \}/);
  assert.match(app, /task\.startDate \?[^\n]*<span>Início<\/span>/);
  assert.match(api, /await ensureMonthlyClientTasks\(context\.env\.DB\);\s*const revision/);
  const source = app.slice(app.indexOf("function createNextRecurringTask("), app.indexOf("function renderTaskQuickFilters("));
  const context = vm.createContext({});
  vm.runInContext(source, context);
  assert.equal(context.createNextRecurringTask({ monthlyRoutine: {} }), null);
});
