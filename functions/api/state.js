import { isTrustedMutation, jsonResponse } from "../lib/http.js";
import { activityRetentionCutoff } from "../lib/activity-retention.js";

const MAX_REQUEST_BYTES = 8_000_000;
const MAX_RECORD_BYTES = 900_000;
const MAX_MUTATIONS_PER_SAVE = 50;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const DIRTY_KEY_PATTERN = /^[A-Za-z][A-Za-z0-9]*:[A-Za-z0-9_-]{1,128}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const encoder = new TextEncoder();

const COLLECTIONS = [
  { stateKey: "statuses", table: "statuses", scope: "team", maxItems: 500 },
  { stateKey: "clients", table: "clients", scope: "team", maxItems: 5000, protectHistory: true },
  {
    stateKey: "regularizationClients",
    table: "regularization_clients",
    scope: "team",
    maxItems: 5000,
    protectHistory: true,
  },
  { stateKey: "guidanceItems", table: "guidance_items", scope: "team", maxItems: 2000 },
  {
    stateKey: "guidanceQuestions",
    table: "guidance_questions",
    scope: "team",
    maxItems: 5000,
  },
  {
    stateKey: "internalTasks",
    table: "internal_tasks",
    scope: "dynamic",
    maxItems: 10000,
  },
  { stateKey: "meetings", table: "meetings", scope: "team", maxItems: 5000 },
  {
    stateKey: "marketingItems",
    table: "marketing_items",
    scope: "team",
    maxItems: 10000,
    protectHistory: true,
    adminDeleteOnly: true,
  },
  {
    stateKey: "activities",
    table: "activities",
    scope: "dynamic",
    maxItems: 20000,
    appendOnly: true,
  },
  {
    stateKey: "companyBills",
    table: "company_bills",
    scope: "admin",
    maxItems: 5000,
    adminOnly: true,
  },
];

export async function onRequestGet(context) {
  const user = context.data?.user;
  if (!user) return unauthorized();

  try {
    const revision = new URL(context.request.url).searchParams.get("revision");
    if (revision && revision.length <= 256) {
      const row = await revisionQuery(context.env.DB, user, activityRetentionCutoff()).first();
      if (revision === stateRevision(row, user)) {
        return jsonResponse({ ok: true, unchanged: true });
      }
    }
    return jsonResponse(await readState(context.env.DB, user));
  } catch (error) {
    console.error("State read failed", error);
    return jsonResponse({
      error: "Nao foi possivel carregar os dados.",
      code: "STATE_READ_FAILED",
    }, 500);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const user = context.data?.user;
  if (!user) return unauthorized();
  if (!isTrustedMutation(request)) {
    return jsonResponse({ error: "Origem da solicitacao invalida.", code: "INVALID_ORIGIN" }, 403);
  }

  const contentType = String(request.headers.get("Content-Type") || "").toLowerCase();
  if (!contentType.startsWith("application/json")) {
    return jsonResponse({ error: "Envie os dados em JSON.", code: "INVALID_CONTENT_TYPE" }, 415);
  }

  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "O envio ultrapassa o limite permitido.", code: "REQUEST_TOO_LARGE" }, 413);
  }

  try {
    const body = await request.json();
    if (!isObject(body?.state) || !isObject(body?.versions)) {
      return jsonResponse({ error: "Estado de sincronizacao invalido.", code: "INVALID_STATE" }, 400);
    }

    const dirtyKeys = normalizeDirtyKeys(body.dirtyKeys);
    const result = await prepareMutations(env.DB, user, body.state, body.versions, dirtyKeys);
    if (result.conflicts.length) {
      return jsonResponse({
        error: "Os dados foram alterados em outro computador.",
        code: "SYNC_CONFLICT",
        conflicts: result.conflicts,
      }, 409);
    }
    if (result.error) {
      return jsonResponse({ error: result.error.message, code: result.error.code }, result.error.status);
    }

    await env.DB.batch([
      ...activityCleanupStatements(env.DB, activityRetentionCutoff()),
      ...result.statements,
    ]);
    const compactKeys = body.compact === true ? dirtyKeys : null;
    const payload = await readState(env.DB, user, compactKeys);
    return jsonResponse(
      compactKeys
        ? compactStatePayload(payload, compactKeys)
        : payload,
    );
  } catch (error) {
    if (error instanceof PermissionError) {
      return jsonResponse({
        error: error.message || "Operacao nao autorizada.",
        code: "FORBIDDEN",
      }, 403);
    }
    if (error instanceof ValidationError || error instanceof SyntaxError) {
      return jsonResponse({
        error: error.message || "Dados invalidos.",
        code: "INVALID_STATE",
      }, 400);
    }
    console.error("State save failed", error);
    return jsonResponse({
      error: "Nao foi possivel salvar os dados.",
      code: "STATE_SAVE_FAILED",
    }, 500);
  }
}

function revisionQuery(db, user, cutoff) {
  return db.prepare(`
    SELECT (SELECT COALESCE(MAX(seq), 0) FROM sync_log) AS last_seq,
      (SELECT MIN(created_at) FROM activities
        WHERE created_at >= ? AND deleted_at IS NULL AND (? = 'admin' OR scope = 'team')) AS oldest_activity,
      (SELECT COUNT(*) FROM activity_reads WHERE user_id = ?) AS reads_count,
      (SELECT MAX(read_at) FROM activity_reads WHERE user_id = ?) AS last_read
  `).bind(cutoff, user.role, user.id, user.id);
}

function stateRevision(row, user) {
  return JSON.stringify([user.role, row?.last_seq || 0, row?.oldest_activity || "", row?.reads_count || 0, row?.last_read || ""]);
}

function idsForCollection(dirtyKeys, stateKey) {
  const prefix = `${stateKey}:`;
  return [...dirtyKeys].filter((key) => key.startsWith(prefix)).map((key) => key.slice(prefix.length));
}

async function readState(db, user, dirtyKeys = null) {
  const readableCollections = COLLECTIONS.filter((config) =>
    (!config.adminOnly || user.role === "admin")
    && (!dirtyKeys || idsForCollection(dirtyKeys, config.stateKey).length),
  );
  const retentionCutoff = activityRetentionCutoff();
  const statements = readableCollections.map((config) => {
    const retentionClause = config.stateKey === "activities"
      ? "AND created_at >= ?"
      : "";
    const statement = db.prepare(`
      SELECT id, payload, version, scope
      FROM ${config.table}
      WHERE deleted_at IS NULL
        ${retentionClause}
        AND (? = 'admin' OR scope = 'team')
        ${dirtyKeys ? "AND id IN (SELECT value FROM json_each(?))" : ""}
      ORDER BY updated_at DESC
    `);
    const params = config.stateKey === "activities" ? [retentionCutoff, user.role] : [user.role];
    if (dirtyKeys) params.push(JSON.stringify(idsForCollection(dirtyKeys, config.stateKey)));
    return statement.bind(...params);
  });
  const userIds = dirtyKeys ? idsForCollection(dirtyKeys, "users") : null;
  const settingIds = dirtyKeys ? idsForCollection(dirtyKeys, "settings") : null;
  const activityIds = dirtyKeys ? idsForCollection(dirtyKeys, "activities") : null;
  const usersIndex = statements.length;
  if (!userIds || userIds.length) statements.push(db.prepare(`
    SELECT id, email, name, role, enabled, session_version
    FROM app_users
    WHERE enabled = 1
      ${userIds ? "AND id IN (SELECT value FROM json_each(?))" : ""}
    ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, lower(name)
  `).bind(...(userIds ? [JSON.stringify(userIds)] : [])));
  const settingsIndex = statements.length;
  if (!settingIds || settingIds.length) statements.push(db.prepare(`
    SELECT key, value_json, version, scope
    FROM app_settings
    WHERE (? = 'admin' OR scope = 'team')
      ${settingIds ? "AND key IN (SELECT value FROM json_each(?))" : ""}
  `).bind(user.role, ...(settingIds ? [JSON.stringify(settingIds)] : [])));
  const revisionIndex = statements.length;
  statements.push(dirtyKeys
    ? db.prepare("SELECT COALESCE(MAX(seq), 0) AS last_seq FROM sync_log")
    : revisionQuery(db, user, retentionCutoff));
  const readsIndex = statements.length;
  if (!activityIds || activityIds.length) statements.push(db.prepare(`
    SELECT activity_reads.activity_id
    FROM activity_reads
    INNER JOIN activities ON activities.id = activity_reads.activity_id
    WHERE activity_reads.user_id = ?
      AND activities.created_at >= ?
      ${activityIds ? "AND activity_reads.activity_id IN (SELECT value FROM json_each(?))" : ""}
  `).bind(user.id, retentionCutoff, ...(activityIds ? [JSON.stringify(activityIds)] : [])));

  const results = await db.batch(statements);
  const state = {
    statuses: [],
    users: [],
    clients: [],
    regularizationClients: [],
    guidanceItems: [],
    guidanceQuestions: [],
    internalTasks: [],
    meetings: [],
    marketingItems: [],
    activities: [],
    goals: {},
    companyBills: [],
    companyBillCategories: [],
    regularizationFieldDefinitions: [],
    regularizationStatusDefinitions: [],
  };
  const versions = {};

  readableCollections.forEach((config, index) => {
    const rows = results[index]?.results || [];
    state[config.stateKey] = rows
      .map((row) => parsePayload(row.payload))
      .filter(Boolean);
    rows.forEach((row) => {
      versions[versionKey(config.stateKey, row.id)] = Number(row.version || 0);
    });
  });

  const userRows = !userIds || userIds.length ? results[usersIndex]?.results || [] : [];
  state.users = userRows.map((row) => ({
    id: String(row.id),
    email: String(row.email || ""),
    name: String(row.name || ""),
    role: row.role === "admin" ? "admin" : "user",
  }));
  userRows.forEach((row) => {
    versions[versionKey("users", row.id)] = Number(row.session_version || 1);
  });

  const settingRows = !settingIds || settingIds.length ? results[settingsIndex]?.results || [] : [];
  settingRows.forEach((row) => {
    const value = parsePayload(row.value_json);
    if (row.key === "goals" && isObject(value)) state.goals = value;
    if (row.key === "companyBillCategories" && Array.isArray(value)) {
      state.companyBillCategories = value;
    }
    if (row.key === "regularizationFieldDefinitions" && Array.isArray(value)) {
      state.regularizationFieldDefinitions = value;
    }
    if (row.key === "regularizationStatusDefinitions" && Array.isArray(value)) {
      state.regularizationStatusDefinitions = value;
    }
    versions[versionKey("settings", row.key)] = Number(row.version || 0);
  });

  const revisionRow = results[revisionIndex]?.results?.[0];
  const readActivityIds = new Set(
    (results[readsIndex]?.results || []).map((row) => String(row.activity_id)),
  );
  state.activities = state.activities.map((activity) => {
    if (!readActivityIds.has(String(activity.id))) return activity;
    return {
      ...activity,
      readBy: [...new Set([...(activity.readBy || []), user.id])],
    };
  });

  return {
    ok: true,
    state,
    versions,
    lastSeq: Number(revisionRow?.last_seq || 0),
    ...(!dirtyKeys ? { revision: stateRevision(revisionRow, user) } : {}),
    currentUser: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    serverTime: new Date().toISOString(),
  };
}

function activityCleanupStatements(db, cutoff) {
  return [
    db.prepare(`
      DELETE FROM activity_reads
      WHERE activity_id IN (
        SELECT id
        FROM activities
        WHERE created_at < ?
      )
    `).bind(cutoff),
    db.prepare(`
      DELETE FROM activities
      WHERE created_at < ?
    `).bind(cutoff),
    db.prepare(`
      DELETE FROM sync_log
      WHERE record_type = 'activities'
        AND changed_at < ?
    `).bind(cutoff),
  ];
}

async function prepareMutations(db, user, desiredState, clientVersions, dirtyKeys = null) {
  const writableCollections = COLLECTIONS
    .filter((config) => !config.adminOnly || user.role === "admin")
    .map((config) => ({ config, ids: dirtyKeys ? idsForCollection(dirtyKeys, config.stateKey) : null }))
    .filter(({ ids }) => !ids || ids.length);
  const queries = writableCollections.map(({ config, ids }) => db.prepare(`
    SELECT id, payload, version, scope, created_at, created_by, deleted_at
    FROM ${config.table}
    ${ids ? "WHERE id IN (SELECT value FROM json_each(?))" : ""}
  `).bind(...(ids ? [JSON.stringify(ids)] : [])));
  const results = queries.length ? await db.batch(queries) : [];
  const now = new Date().toISOString();
  const statements = [];
  const conflicts = [];
  let mutationCount = 0;

  writableCollections.forEach(({ config }, index) => {
    const desiredItems = desiredState[config.stateKey];
    if (!Array.isArray(desiredItems) || desiredItems.length > config.maxItems) {
      throw new ValidationError(`A colecao ${config.stateKey} e invalida.`);
    }

    const existingRows = results[index]?.results || [];
    const existingById = new Map(existingRows.map((row) => [String(row.id), row]));
    const desiredById = new Map();

    desiredItems.forEach((rawItem) => {
      let item = normalizeItem(rawItem, config, user, now);
      const id = String(item.id || "");
      if (!ID_PATTERN.test(id) || desiredById.has(id)) {
        throw new ValidationError(`Identificador invalido em ${config.stateKey}.`);
      }

      const recordKey = versionKey(config.stateKey, id);
      const existing = existingById.get(id);
      desiredById.set(id, item);
      if (dirtyKeys && !dirtyKeys.has(recordKey)) return;

      if (config.stateKey === "marketingItems") {
        const previous = existing && !existing.deleted_at ? parsePayload(existing.payload) : null;
        item.createdBy = String(previous?.createdBy || user.id);
        item.createdAt = String(previous?.createdAt || item.createdAt || now);
        item.updatedBy = user.id;
        item.updatedAt = now;
        desiredById.set(id, item);
      }

      if (config.protectHistory && user.role !== "admin" && existing && !existing.deleted_at) {
        item = protectExistingHistory(parsePayload(existing.payload), item, user, now);
        desiredById.set(id, item);
      }

      const scope = scopeFor(config, item);
      if (scope === "admin" && user.role !== "admin") {
        throw new PermissionError("Dados administrativos nao podem ser alterados por este usuario.");
      }

      if (config.appendOnly && existing && !existing.deleted_at) {
        return;
      }

      const payload = JSON.stringify(item);
      if (encoder.encode(payload).byteLength > MAX_RECORD_BYTES) {
        throw new ValidationError(`Um registro de ${config.stateKey} ultrapassa o limite permitido.`);
      }

      const existingPayload = existing && !existing.deleted_at ? String(existing.payload || "") : "";
      if (existingPayload === payload && existing.scope === scope) return;

      if (existing) {
        const expectedVersion = Number(clientVersions[versionKey(config.stateKey, id)] || 0);
        if (expectedVersion !== Number(existing.version || 0)) {
          conflicts.push(versionKey(config.stateKey, id));
          return;
        }
      }

      validateTaskDueDates(config.stateKey, item, existingPayload ? parsePayload(existingPayload) : null);
      mutationCount += 1;
      statements.push(upsertStatement(db, config, item, payload, scope, existing, user, now));
      statements.push(syncLogStatement(
        db,
        config.stateKey,
        id,
        "upsert",
        existing ? Number(existing.version || 0) + 1 : 1,
        scope,
        user.id,
        now,
      ));
    });

    if (config.appendOnly) return;
    existingRows
      .filter((row) => !row.deleted_at && !desiredById.has(String(row.id)))
      .forEach((row) => {
        if (row.scope === "admin" && user.role !== "admin") return;
        const id = String(row.id);
        if (dirtyKeys && !dirtyKeys.has(versionKey(config.stateKey, id))) return;
        if (config.adminDeleteOnly && user.role !== "admin") {
          throw new PermissionError("Somente a administradora pode excluir este registro.");
        }
        const expectedVersion = Number(clientVersions[versionKey(config.stateKey, id)] || 0);
        if (expectedVersion !== Number(row.version || 0)) {
          conflicts.push(versionKey(config.stateKey, id));
          return;
        }

        mutationCount += 1;
        statements.push(db.prepare(`
          UPDATE ${config.table}
          SET version = version + 1,
              updated_at = ?,
              updated_by = ?,
              deleted_at = ?,
              deleted_by = ?
          WHERE id = ? AND deleted_at IS NULL
        `).bind(now, user.id, now, user.id, id));
        statements.push(syncLogStatement(
          db,
          config.stateKey,
          id,
          "delete",
          Number(row.version || 0) + 1,
          row.scope,
          user.id,
          now,
        ));
      });
  });

  if (user.role === "admin") {
    if (!dirtyKeys || idsForCollection(dirtyKeys, "settings").length) {
      const settingsResult = await prepareSettings(db, user, desiredState, clientVersions, now, dirtyKeys);
      statements.push(...settingsResult.statements);
      conflicts.push(...settingsResult.conflicts);
      mutationCount += settingsResult.mutationCount;
    }

    const usersAreDirty = !dirtyKeys
      || [...dirtyKeys].some((key) => key.startsWith("users:"));
    if (usersAreDirty) {
      const usersResult = await prepareUsers(
        db,
        user,
        desiredState.users,
        clientVersions,
        now,
        dirtyKeys,
      );
      statements.push(...usersResult.statements);
      conflicts.push(...usersResult.conflicts);
      mutationCount += usersResult.mutationCount;
    }
  }

  if (mutationCount > MAX_MUTATIONS_PER_SAVE) {
    return {
      statements: [],
      conflicts: [],
      error: {
        status: 413,
        code: "TOO_MANY_CHANGES",
        message: "Foram detectadas muitas alteracoes simultaneas. Atualize a pagina e tente novamente.",
      },
    };
  }

  return { statements, conflicts: [...new Set(conflicts)], error: null };
}

async function prepareSettings(db, user, desiredState, clientVersions, now, dirtyKeys = null) {
  const rows = await db.prepare(`
    SELECT key, value_json, version, scope
    FROM app_settings
    WHERE key IN (
      'goals',
      'companyBillCategories',
      'regularizationFieldDefinitions',
      'regularizationStatusDefinitions'
    )
  `).all();
  const existingByKey = new Map((rows.results || []).map((row) => [String(row.key), row]));
  const desired = new Map([
    ["goals", isObject(desiredState.goals) ? desiredState.goals : {}],
    [
      "companyBillCategories",
      Array.isArray(desiredState.companyBillCategories) ? desiredState.companyBillCategories : [],
    ],
    [
      "regularizationFieldDefinitions",
      Array.isArray(desiredState.regularizationFieldDefinitions)
        ? desiredState.regularizationFieldDefinitions
        : [],
    ],
    [
      "regularizationStatusDefinitions",
      Array.isArray(desiredState.regularizationStatusDefinitions)
        ? desiredState.regularizationStatusDefinitions
        : [],
    ],
  ]);
  const statements = [];
  const conflicts = [];
  let mutationCount = 0;

  desired.forEach((value, key) => {
    if (dirtyKeys && !dirtyKeys.has(versionKey("settings", key))) return;
    const payload = JSON.stringify(value);
    const existing = existingByKey.get(key);
    if (existing && String(existing.value_json) === payload) return;

    if (existing) {
      const expected = Number(clientVersions[versionKey("settings", key)] || 0);
      if (expected !== Number(existing.version || 0)) {
        conflicts.push(versionKey("settings", key));
        return;
      }
    }

    const scope = key === "companyBillCategories" ? "admin" : "team";
    mutationCount += 1;
    statements.push(db.prepare(`
      INSERT INTO app_settings (key, value_json, scope, version, updated_at, updated_by)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        scope = excluded.scope,
        version = app_settings.version + 1,
        updated_at = excluded.updated_at,
        updated_by = excluded.updated_by
    `).bind(key, payload, scope, now, user.id));
    statements.push(syncLogStatement(
      db,
      "settings",
      key,
      "upsert",
      existing ? Number(existing.version || 0) + 1 : 1,
      scope,
      user.id,
      now,
    ));
  });

  return { statements, conflicts, mutationCount };
}

async function prepareUsers(db, actor, desiredUsers, clientVersions, now, dirtyKeys = null) {
  if (!Array.isArray(desiredUsers) || desiredUsers.length > 20) {
    throw new ValidationError("A lista de usuarios e invalida.");
  }

  const rows = await db.prepare(`
    SELECT id, firebase_uid, email, name, role, enabled, session_version
    FROM app_users
  `).all();
  const existingById = new Map((rows.results || []).map((row) => [String(row.id), row]));
  const statements = [];
  const conflicts = [];
  let mutationCount = 0;

  desiredUsers.forEach((rawUser) => {
    if (!isObject(rawUser)) throw new ValidationError("Usuario invalido.");
    const id = String(rawUser.id || "");
    const email = String(rawUser.email || "").trim().toLowerCase();
    const name = String(rawUser.name || "").trim().slice(0, 120);
    const role = rawUser.role === "admin" ? "admin" : "user";
    if (!ID_PATTERN.test(id) || !EMAIL_PATTERN.test(email) || !name) {
      throw new ValidationError("Dados de usuario invalidos.");
    }
    if (dirtyKeys && !dirtyKeys.has(versionKey("users", id))) return;

    const existing = existingById.get(id);
    if (
      existing
      && String(existing.email).toLowerCase() === email
      && String(existing.name) === name
      && String(existing.role) === role
      && Number(existing.enabled) === 1
    ) {
      return;
    }

    if (existing) {
      const expected = Number(clientVersions[versionKey("users", id)] || 0);
      if (expected !== Number(existing.session_version || 1)) {
        conflicts.push(versionKey("users", id));
        return;
      }
      if (existing.firebase_uid && String(existing.email).toLowerCase() !== email) {
        throw new ValidationError("O e-mail de um usuario ativo deve ser alterado no Firebase.");
      }
    }

    mutationCount += 1;
    statements.push(db.prepare(`
      INSERT INTO app_users (
        id, firebase_uid, email, name, role, enabled, session_version, created_at, updated_at
      ) VALUES (?, NULL, ?, ?, ?, 1, 1, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        email = excluded.email,
        name = excluded.name,
        role = excluded.role,
        enabled = 1,
        session_version = app_users.session_version + 1,
        updated_at = excluded.updated_at
    `).bind(id, email, name, role, now, now));
    statements.push(syncLogStatement(
      db,
      "users",
      id,
      "upsert",
      existing ? Number(existing.session_version || 1) + 1 : 1,
      "admin",
      actor.id,
      now,
    ));
  });

  return { statements, conflicts, mutationCount };
}

function normalizeItem(rawItem, config, user, now) {
  if (!isObject(rawItem)) throw new ValidationError(`Registro invalido em ${config.stateKey}.`);
  const item = structuredClone(rawItem);

  if (config.stateKey === "activities") {
    if (!item.id) throw new ValidationError("Atualizacao sem identificador.");
    item.actorId = user.id;
    item.visibility = item.visibility === "admin" && user.role === "admin" ? "admin" : "team";
    item.createdAt = item.createdAt || now;
    item.readBy = Array.isArray(item.readBy)
      ? [...new Set([...item.readBy, user.id])]
      : [user.id];
  }

  if (config.stateKey === "internalTasks" && user.role !== "admin") {
    item.visibility = "team";
  }

  return item;
}

function validateTaskDueDates(stateKey, item, previous) {
  const requireDate = (task) => {
    const value = task?.dueDate;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? new Date(`${value}T00:00:00Z`) : null;
    if (!date || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new ValidationError("Defina um prazo valido para a tarefa.");
    }
  };
  if (stateKey === "internalTasks") {
    requireDate(item);
    return;
  }
  if (stateKey !== "clients" && stateKey !== "regularizationClients") return;

  const validateTasks = (owner, priorOwner) => {
    const priorTasks = new Map((Array.isArray(priorOwner?.tasks) ? priorOwner.tasks : [])
      .map((task) => [task?.id, JSON.stringify(task)]));
    for (const task of Array.isArray(owner?.tasks) ? owner.tasks : []) {
      // Unchanged legacy tasks must not block an unrelated edit to the client.
      if (priorTasks.get(task?.id) !== JSON.stringify(task)) requireDate(task);
    }
  };
  validateTasks(item, previous);
  const priorWorks = new Map((Array.isArray(previous?.works) ? previous.works : []).map((work) => [work?.id, work]));
  for (const work of Array.isArray(item.works) ? item.works : []) validateTasks(work, priorWorks.get(work?.id));
}

export function protectExistingHistory(existingClient, nextClient, user, now) {
  if (!isObject(existingClient)) return nextClient;
  const existingHistory = Array.isArray(existingClient.history) ? existingClient.history : [];
  const nextHistory = Array.isArray(nextClient.history) ? nextClient.history : [];
  const existingById = new Map(
    existingHistory.map((entry) => [String(entry?.id || ""), entry]),
  );
  const nextById = new Map(nextHistory.map((entry) => [String(entry?.id || ""), entry]));

  existingHistory.forEach((entry) => {
    const current = nextById.get(String(entry?.id || ""));
    if (!current || !sameProtectedHistoryEntry(entry, current)) {
      throw new PermissionError("Somente a administradora pode editar ou remover o historico.");
    }
  });

  nextClient.history = nextHistory.map((entry) => {
    const id = String(entry?.id || "");
    const existing = existingById.get(id);
    if (existing) {
      return {
        ...existing,
        ...normalizeProtectedHistoryEntry(existing, entry),
      };
    }
    return {
      ...entry,
      userId: user.id,
      createdAt: entry.createdAt || now,
      updatedAt: null,
    };
  });
  return nextClient;
}

function sameProtectedHistoryEntry(existing, current) {
  return JSON.stringify(normalizeProtectedHistoryEntry(existing, current))
    === JSON.stringify(normalizeProtectedHistoryEntry(current));
}

function normalizeProtectedHistoryEntry(entry = {}, fallback = {}) {
  const hasEntryDetails = Array.isArray(entry.details)
    || Boolean(entry.text || entry.detail);
  const entryDetails = Array.isArray(entry.details)
    ? entry.details
    : [entry.text || entry.detail || ""].filter(Boolean);
  const fallbackDetails = Array.isArray(fallback.details)
    ? fallback.details
    : [fallback.text || fallback.detail || ""].filter(Boolean);
  return {
    id: String(entry.id || fallback.id || ""),
    title: String(entry.title || fallback.title || "Registro do hist\u00f3rico"),
    details: (hasEntryDetails ? entryDetails : fallbackDetails)
      .map((detail) => String(detail)),
    userId: String(entry.userId || fallback.userId || ""),
    type: String(entry.type || fallback.type || "manual"),
    createdAt: String(entry.createdAt || fallback.createdAt || ""),
    updatedAt: Object.prototype.hasOwnProperty.call(entry, "updatedAt")
      ? (entry.updatedAt ? String(entry.updatedAt) : null)
      : (fallback.updatedAt ? String(fallback.updatedAt) : null),
  };
}

function normalizeDirtyKeys(value) {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value) || value.length > 1000) {
    throw new ValidationError("A lista de alteracoes e invalida.");
  }

  const keys = value.map((key) => String(key || ""));
  if (keys.some((key) => !DIRTY_KEY_PATTERN.test(key))) {
    throw new ValidationError("A lista de alteracoes e invalida.");
  }
  return new Set(keys);
}

export function compactStatePayload(payload, dirtyKeys) {
  const collectionKeys = new Set([...COLLECTIONS.map((config) => config.stateKey), "users"]);
  const settingKeys = new Set([
    "goals",
    "companyBillCategories",
    "regularizationFieldDefinitions",
    "regularizationStatusDefinitions",
  ]);
  const statePatch = {};
  const deletedKeys = [];
  const partialVersions = {};

  dirtyKeys.forEach((dirtyKey) => {
    const separator = dirtyKey.indexOf(":");
    const stateKey = dirtyKey.slice(0, separator);
    const recordId = dirtyKey.slice(separator + 1);

    if (stateKey === "settings" && settingKeys.has(recordId)) {
      statePatch[recordId] = payload.state[recordId];
    } else if (collectionKeys.has(stateKey)) {
      if (!statePatch[stateKey]) statePatch[stateKey] = [];
      const record = (payload.state[stateKey] || [])
        .find((item) => String(item?.id || "") === recordId);
      if (record) statePatch[stateKey].push(record);
      else deletedKeys.push(dirtyKey);
    }

    if (Object.prototype.hasOwnProperty.call(payload.versions, dirtyKey)) {
      partialVersions[dirtyKey] = payload.versions[dirtyKey];
    }
  });

  const { state: _state, versions: _versions, ...metadata } = payload;
  return {
    ...metadata,
    statePatch,
    versions: partialVersions,
    partialVersions: true,
    deletedKeys,
  };
}

function upsertStatement(db, config, item, payload, scope, existing, user, now) {
  const createdAt = String(item.createdAt || now);
  const createdBy = String(item.createdBy || item.userId || item.actorId || user.id);
  return db.prepare(`
    INSERT INTO ${config.table} (
      id, payload, scope, version, created_at, created_by, updated_at, updated_by,
      deleted_at, deleted_by
    ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, NULL, NULL)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      scope = excluded.scope,
      version = ${config.table}.version + 1,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by,
      deleted_at = NULL,
      deleted_by = NULL
  `).bind(
    String(item.id),
    payload,
    scope,
    existing ? String(existing.created_at || createdAt) : createdAt,
    existing ? String(existing.created_by || createdBy) : createdBy,
    now,
    user.id,
  );
}

function syncLogStatement(db, recordType, recordId, action, version, scope, changedBy, changedAt) {
  return db.prepare(`
    INSERT INTO sync_log (
      record_type, record_id, action, version, scope, changed_at, changed_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(recordType, recordId, action, version, scope, changedAt, changedBy);
}

function scopeFor(config, item) {
  if (config.scope === "admin") return "admin";
  if (config.scope === "dynamic") return item.visibility === "admin" ? "admin" : "team";
  return "team";
}

function versionKey(stateKey, id) {
  return `${stateKey}:${id}`;
}

function parsePayload(value) {
  try {
    return JSON.parse(String(value || ""));
  } catch (error) {
    return null;
  }
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function unauthorized() {
  return jsonResponse({ error: "Autenticacao necessaria.", code: "UNAUTHORIZED" }, 401);
}

class ValidationError extends Error {}

class PermissionError extends Error {
  constructor(message) {
    super(message);
    this.name = "PermissionError";
  }
}
