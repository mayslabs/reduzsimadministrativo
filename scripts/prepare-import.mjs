import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const inputPath = resolve(process.argv[2] || "exports/firestore-state.json");
const outputPath = resolve(process.argv[3] || "exports/d1-import.sql");
const raw = await readFile(inputPath);
const source = JSON.parse(raw.toString("utf8"));
const state = source?.state && isObject(source.state) ? source.state : source;

if (!isObject(state)) throw new Error("O arquivo nao contem um estado valido.");

const collections = [
  ["statuses", "statuses", "team"],
  ["clients", "clients", "team"],
  ["regularizationClients", "regularization_clients", "team"],
  ["guidanceItems", "guidance_items", "team"],
  ["guidanceQuestions", "guidance_questions", "team"],
  ["internalTasks", "internal_tasks", "dynamic"],
  ["meetings", "meetings", "team"],
  ["activities", "activities", "dynamic"],
  ["companyBills", "company_bills", "admin"],
];
const allowedUserIds = new Set(["user-mayssa", "user-contato"]);
const now = new Date().toISOString();
const sourceHash = createHash("sha256").update(raw).digest("hex");
const counts = {};
const statements = [
  "PRAGMA foreign_keys = ON;",
  "DELETE FROM activity_reads;",
  "DELETE FROM sync_log;",
];

for (const [, table] of collections) {
  statements.push(`DELETE FROM ${table};`);
}

for (const [stateKey, table, configuredScope] of collections) {
  const items = Array.isArray(state[stateKey]) ? state[stateKey] : [];
  counts[stateKey] = items.length;
  const seen = new Set();

  for (const item of items) {
    if (!isObject(item) || !validId(item.id) || seen.has(String(item.id))) {
      throw new Error(`Registro invalido ou duplicado em ${stateKey}.`);
    }
    seen.add(String(item.id));

    const scope = configuredScope === "dynamic"
      ? (item.visibility === "admin" ? "admin" : "team")
      : configuredScope;
    const createdAt = validDate(item.createdAt) ? item.createdAt : now;
    const createdBy = validId(item.createdBy)
      ? item.createdBy
      : validId(item.userId)
        ? item.userId
        : validId(item.actorId)
          ? item.actorId
          : "system";
    const updatedAt = validDate(item.updatedAt) ? item.updatedAt : createdAt;
    const updatedBy = validId(item.updatedBy) ? item.updatedBy : createdBy;
    const payload = JSON.stringify(item);

    statements.push(`
INSERT INTO ${table} (
  id, payload, scope, version, created_at, created_by, updated_at, updated_by,
  deleted_at, deleted_by
) VALUES (
  ${sql(item.id)}, ${sql(payload)}, ${sql(scope)}, 1, ${sql(createdAt)}, ${sql(createdBy)},
  ${sql(updatedAt)}, ${sql(updatedBy)}, NULL, NULL
);`.trim());

    if (stateKey === "activities") {
      const readers = [...new Set(Array.isArray(item.readBy) ? item.readBy.map(String) : [])]
        .filter((userId) => allowedUserIds.has(userId));
      readers.forEach((userId) => {
        statements.push(
          `INSERT OR IGNORE INTO activity_reads (activity_id, user_id, read_at) VALUES (${sql(item.id)}, ${sql(userId)}, ${sql(updatedAt)});`,
        );
      });
    }
  }
}

const goals = isObject(state.goals) ? state.goals : {};
const categories = Array.isArray(state.companyBillCategories) ? state.companyBillCategories : [];
counts.goals = Object.keys(goals).length ? 1 : 0;
counts.companyBillCategories = categories.length;

statements.push(`
UPDATE app_settings
SET value_json = ${sql(JSON.stringify(goals))},
    version = version + 1,
    updated_at = ${sql(now)},
    updated_by = 'migration'
WHERE key = 'goals';`.trim());
statements.push(`
UPDATE app_settings
SET value_json = ${sql(JSON.stringify(categories))},
    version = version + 1,
    updated_at = ${sql(now)},
    updated_by = 'migration'
WHERE key = 'companyBillCategories';`.trim());
statements.push(`
INSERT INTO migration_runs (
  id, source, imported_at, imported_by, source_hash, record_counts
) VALUES (
  ${sql(`firestore-${sourceHash.slice(0, 16)}`)},
  'firestore:reduzsim_admin/shared_state',
  ${sql(now)},
  'codex-migration',
  ${sql(sourceHash)},
  ${sql(JSON.stringify(counts))}
)
ON CONFLICT(id) DO UPDATE SET
  imported_at = excluded.imported_at,
  imported_by = excluded.imported_by,
  record_counts = excluded.record_counts;`.trim());
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${statements.join("\n\n")}\n`, "utf8");

console.log(JSON.stringify({
  input: inputPath,
  output: outputPath,
  sourceHash,
  counts,
}, null, 2));

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validId(value) {
  return /^[A-Za-z0-9_-]{1,128}$/.test(String(value || ""));
}

function validDate(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function sql(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}
