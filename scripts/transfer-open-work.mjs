import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const collections = {
  clients: "clients",
  regularization_clients: "regularizationClients",
  internal_tasks: "internalTasks",
  meetings: "meetings",
  marketing_items: "marketingItems",
};
const normalize = (value) => String(value || "").normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();
const closed = new Set(["concluida", "concluido", "finalizada", "finalizado", "cancelada", "cancelado"]);
const isOpen = (item) => !item.completedAt && !closed.has(normalize(item.status || item.state));
const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;

export function ownerChanges(table, item, from, today, finishedStatusIds = new Set()) {
  const paths = [];
  const add = (record, field, path, type) => {
    if (record[field] === from) paths.push({ path: `${path}.${field}`, type });
  };
  if (table === "clients" || table === "regularization_clients") {
    const visit = (record, path) => {
      for (const [field, type] of [["tasks", "tarefas"], ["deadlines", "prazos"], ["checklist", "etapas"]]) {
        if (!Array.isArray(record[field])) continue;
        record[field].forEach((entry, index) => {
          if (entry && isOpen(entry)) add(entry, "ownerId", `${path}.${field}[${index}]`, type);
        });
      }
    };
    const finished = closed.has(normalize(item.status)) || (item.statusIds || []).some((id) => finishedStatusIds.has(id));
    if (!finished) add(item, "internalOwner", "$", "clientes");
    visit(item, "$");
    if (Array.isArray(item.works)) item.works.forEach((work, index) => { if (work) visit(work, `$.works[${index}]`); });
  } else if (table === "internal_tasks" && isOpen(item)) {
    add(item, "ownerId", "$", "tarefas");
  } else if (table === "marketing_items" && item.kind !== "idea" && normalize(item.status) !== "publicado" && isOpen(item)) {
    add(item, "ownerId", "$", "conteudos");
  } else if (table === "meetings" && (item.date || item.meetingDate || "") >= today && isOpen(item)) {
    add(item, "ownerId", "$", "reunioes");
  }
  return paths;
}

export function transferStatements(table, row, changes, to, now) {
  if (!Object.hasOwn(collections, table)) throw new Error("Colecao desconhecida.");
  const condition = `id = ${sqlString(row.id)} AND version = ${Number(row.version)} AND deleted_at IS NULL`;
  const audit = `INSERT INTO sync_log (record_type, record_id, action, version, scope, changed_at, changed_by) SELECT ${sqlString(collections[table])}, id, 'upsert', version + 1, scope, ${sqlString(now)}, ${sqlString(to)} FROM ${table} WHERE ${condition};`;
  const patches = changes.flatMap(({ path }) => [sqlString(path), sqlString(to)]);
  patches.push("'$.updatedAt'", sqlString(now));
  if (table === "marketing_items") patches.push("'$.updatedBy'", sqlString(to));
  const update = `UPDATE ${table} SET payload = json_set(payload, ${patches.join(", ")}), version = version + 1, updated_at = ${sqlString(now)}, updated_by = ${sqlString(to)} WHERE ${condition};`;
  return [audit, update];
}

function d1(...args) {
  const output = execFileSync(process.execPath, ["node_modules/wrangler/bin/wrangler.js", "d1", "execute", "reduzsim-gestao-db", "--remote", "--json", ...args], {
    encoding: "utf8", maxBuffer: 32 * 1024 * 1024, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  if (args.includes("--file")) return [];
  const results = JSON.parse(output);
  if (!results.every((result) => result.success)) throw new Error("O D1 nao confirmou a operacao.");
  return results.flatMap((result) => result.results || []);
}

function buildPlan(from, today) {
  const query = (sql) => d1("--command", sql);
  const statuses = query("SELECT id, payload FROM statuses WHERE deleted_at IS NULL;");
  const definitions = query("SELECT value_json FROM app_settings WHERE key = 'regularizationStatusDefinitions';");
  const finished = new Set([
    ...statuses.map((row) => ({ id: row.id, name: JSON.parse(row.payload).name })),
    ...JSON.parse(definitions[0]?.value_json || "[]"),
  ].filter((status) => closed.has(normalize(status.name))).map((status) => status.id));

  return Object.keys(collections).flatMap((table) => {
    const rows = query(`SELECT id, version, payload FROM ${table} WHERE deleted_at IS NULL AND instr(payload, ${sqlString(from)}) > 0;`);
    return rows.map((row) => ({ table, row, changes: ownerChanges(table, JSON.parse(row.payload), from, today, finished) }))
      .filter((entry) => entry.changes.length);
  });
}

function main([from, to, today, apply]) {
  if (!from || !to || from === to || !/^\d{4}-\d{2}-\d{2}$/.test(today || "") || (apply && apply !== "--apply")) {
    throw new Error("Uso: node scripts/transfer-open-work.mjs de para AAAA-MM-DD [--apply]");
  }
  const accounts = d1("--command", `SELECT id, enabled FROM app_users WHERE id IN (${sqlString(from)}, ${sqlString(to)});`);
  if (!accounts.some((user) => user.id === from && user.enabled === 0) || !accounts.some((user) => user.id === to && user.enabled === 1)) {
    throw new Error("A origem deve estar inativa e o destino ativo.");
  }
  const plan = buildPlan(from, today);
  const counts = {};
  for (const entry of plan) for (const { type } of entry.changes) counts[type] = (counts[type] || 0) + 1;
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", records: plan.length, counts }));
  if (!apply || !plan.length) return;

  const now = new Date().toISOString();
  const directory = mkdtempSync(join(tmpdir(), "reduzsim-transfer-"));
  const file = join(directory, "transfer.sql");
  try {
    writeFileSync(file, plan.flatMap(({ table, row, changes }) => transferStatements(table, row, changes, to, now)).join("\n"));
    d1("--file", file, "--yes");
  } finally {
    rmSync(file, { force: true });
    rmdirSync(directory);
  }
  const remaining = buildPlan(from, today).length;
  if (remaining) throw new Error(`${remaining} registros ainda pendentes. Confira alteracoes simultaneas antes de repetir.`);
  console.log(JSON.stringify({ verified: true, remaining }));
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message.split("\n")[0]);
    process.exitCode = 1;
  }
}
