import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { currentCompetence, eligibleMonthlyClient, ensureMonthlyClientTasks, monthlyTaskPlan, MONTHLY_TASK_SETTING, shiftCompetence } from "../functions/lib/monthly-client-tasks.js";

const sqlValue = (value) => value === null ? "NULL" : typeof value === "number" ? String(value) : `'${String(value).replaceAll("'", "''")}'`;

function execute(sql) {
  const output = execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "reduzsim-gestao-db", "--remote", "--json", "--command", sql], {
    encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  const results = JSON.parse(output);
  if (!results.every((result) => result.success)) throw new Error("O D1 nao confirmou a leitura.");
  return results;
}

function apply(sql) {
  const directory = mkdtempSync(join(tmpdir(), "reduzsim-monthly-tasks-"));
  const file = join(directory, "monthly-tasks.sql");
  try {
    writeFileSync(file, sql, { encoding: "utf8", mode: 0o600 });
    execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "reduzsim-gestao-db", "--remote", "--json", "--file", file, "--yes"], {
      encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    });
  } finally {
    rmSync(file, { force: true });
    rmdirSync(directory);
  }
}

function prepare(sql, values = []) {
  const render = () => {
    let index = 0;
    const result = sql.replace(/\?/g, () => sqlValue(values[index++]));
    if (index !== values.length) throw new Error("Parametros SQL invalidos.");
    return result;
  };
  return {
    sql, values, render,
    bind: (...parameters) => prepare(sql, parameters),
    first: async () => execute(render())[0]?.results?.[0] || null,
  };
}

const db = {
  prepare,
  batch: async (queries) => {
    const sql = queries.map((query) => `${query.render()};`).join("\n");
    if (queries.every((query) => /^\s*SELECT\b/i.test(query.sql))) return execute(sql);
    apply(sql);
    return [];
  },
};

async function main([startMonth, mode]) {
  shiftCompetence(startMonth, 0);
  if (mode && mode !== "--apply") throw new Error("Uso: node scripts/configure-monthly-client-tasks.mjs AAAA-MM [--apply]");
  const now = new Date().toISOString();
  const current = currentCompetence(now);
  const [clients, statuses, users, settings] = await db.batch([
    prepare("SELECT id, payload FROM clients WHERE deleted_at IS NULL"),
    prepare("SELECT id, payload FROM statuses WHERE deleted_at IS NULL"),
    prepare("SELECT id FROM app_users WHERE id = 'user-mayssa' AND enabled = 1 AND role = 'admin'"),
    prepare("SELECT value_json FROM app_settings WHERE key = ?").bind(MONTHLY_TASK_SETTING),
  ]);
  if (!users.results.length) throw new Error("A administradora deve estar ativa.");
  const definitions = statuses.results.map((row) => ({ ...JSON.parse(row.payload), id: row.id }));
  const active = clients.results.map((row) => ({ ...JSON.parse(row.payload), id: row.id })).filter((client) => eligibleMonthlyClient(client, definitions));
  if (active.some((client) => client.works?.length)) throw new Error("Separe as obras em cards antes de configurar a rotina.");
  const saved = settings.results[0] ? JSON.parse(settings.results[0].value_json) : null;
  if (saved && saved.startMonth !== startMonth) throw new Error("Ja existe uma rotina com outra competencia inicial.");
  const config = saved || { enabled: true, startMonth, clientIds: active.map((client) => client.id), ownerId: "user-mayssa", createdBy: "user-mayssa", createdAt: now, generatedThrough: "" };
  const plans = active.filter((client) => config.clientIds.includes(client.id)).map((client) => monthlyTaskPlan(client, config, current, now, config.ownerId));
  console.log(JSON.stringify({ mode: mode || "preview", startMonth, through: current, eligibleClients: plans.length, newTasks: plans.reduce((total, tasks) => total + tasks.length, 0), excluded: clients.results.length - active.length }));
  if (mode !== "--apply") return;
  if (!saved) {
    const value = sqlValue(JSON.stringify(config));
    apply(`INSERT INTO sync_log (record_type, record_id, action, version, scope, changed_at, changed_by)
      SELECT 'settings', ${sqlValue(MONTHLY_TASK_SETTING)}, 'upsert', 1, 'admin', ${sqlValue(now)}, 'user-mayssa'
      WHERE NOT EXISTS (SELECT 1 FROM app_settings WHERE key = ${sqlValue(MONTHLY_TASK_SETTING)});
      INSERT OR IGNORE INTO app_settings (key, value_json, scope, version, updated_at, updated_by)
      VALUES (${sqlValue(MONTHLY_TASK_SETTING)}, ${value}, 'admin', 1, ${sqlValue(now)}, 'user-mayssa');`);
  }
  console.log(JSON.stringify(await ensureMonthlyClientTasks(db, now)));
  const verified = await db.prepare("SELECT value_json FROM app_settings WHERE key = ?").bind(MONTHLY_TASK_SETTING).first();
  const through = JSON.parse(verified.value_json).generatedThrough;
  if (!through || through < current) throw new Error("Confira alteracoes simultaneas e repita a rotina para completar a geracao.");
  console.log(JSON.stringify({ verified: true, generatedThrough: through }));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message.split("\n")[0]);
    process.exitCode = 1;
  });
}
