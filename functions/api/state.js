import { isTrustedMutation, jsonResponse } from "../lib/http.js";

const MAX_REQUEST_BYTES = 8_000_000;
const MAX_RECORD_BYTES = 900_000;
const MAX_MUTATIONS_PER_SAVE = 20;
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
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

    const result = await prepareMutations(env.DB, user, body.state, body.versions);
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

    if (result.statements.length) {
      await env.DB.batch(result.statements);
    }
    return jsonResponse(await readState(env.DB, user));
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

async function readState(db, user) {
  const readableCollections = COLLECTIONS.filter((config) => !config.adminOnly || user.role === "admin");
  const statements = readableCollections.map((config) => db.prepare(`
    SELECT id, payload, version, scope
    FROM ${config.table}
    WHERE deleted_at IS NULL
      AND (? = 'admin' OR scope = 'team')
    ORDER BY updated_at DESC
  `).bind(user.role));
  statements.push(db.prepare(`
    SELECT id, email, name, role, enabled, session_version
    FROM app_users
    WHERE enabled = 1
    ORDER BY CASE role WHEN 'admin' THEN 0 ELSE 1 END, lower(name)
  `));
  statements.push(db.prepare(`
    SELECT key, value_json, version, scope
    FROM app_settings
    WHERE ? = 'admin' OR scope = 'team'
  `).bind(user.role));
  statements.push(db.prepare("SELECT COALESCE(MAX(seq), 0) AS last_seq FROM sync_log"));
  statements.push(db.prepare(`
    SELECT activity_id
    FROM activity_reads
    WHERE user_id = ?
  `).bind(user.id));

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
    activities: [],
    goals: {},
    companyBills: [],
    companyBillCategories: [],
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

  let resultIndex = readableCollections.length;
  const userRows = results[resultIndex++]?.results || [];
  state.users = userRows.map((row) => ({
    id: String(row.id),
    email: String(row.email || ""),
    name: String(row.name || ""),
    role: row.role === "admin" ? "admin" : "user",
  }));
  userRows.forEach((row) => {
    versions[versionKey("users", row.id)] = Number(row.session_version || 1);
  });

  const settingRows = results[resultIndex++]?.results || [];
  settingRows.forEach((row) => {
    const value = parsePayload(row.value_json);
    if (row.key === "goals" && isObject(value)) state.goals = value;
    if (row.key === "companyBillCategories" && Array.isArray(value)) {
      state.companyBillCategories = value;
    }
    versions[versionKey("settings", row.key)] = Number(row.version || 0);
  });

  const lastSeq = Number(results[resultIndex++]?.results?.[0]?.last_seq || 0);
  const readActivityIds = new Set(
    (results[resultIndex]?.results || []).map((row) => String(row.activity_id)),
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
    lastSeq,
    currentUser: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    serverTime: new Date().toISOString(),
  };
}

async function prepareMutations(db, user, desiredState, clientVersions) {
  const writableCollections = COLLECTIONS.filter((config) => !config.adminOnly || user.role === "admin");
  const queries = writableCollections.map((config) => db.prepare(`
    SELECT id, payload, version, scope, created_at, created_by, deleted_at
    FROM ${config.table}
  `));
  const results = await db.batch(queries);
  const now = new Date().toISOString();
  const statements = [];
  const conflicts = [];
  let mutationCount = 0;

  writableCollections.forEach((config, index) => {
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

      const existing = existingById.get(id);
      if (config.protectHistory && user.role !== "admin" && existing && !existing.deleted_at) {
        item = protectExistingHistory(parsePayload(existing.payload), item, user, now);
      }
      desiredById.set(id, item);

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
    const settingsResult = await prepareSettings(db, user, desiredState, clientVersions, now);
    statements.push(...settingsResult.statements);
    conflicts.push(...settingsResult.conflicts);
    mutationCount += settingsResult.mutationCount;

    const usersResult = await prepareUsers(db, user, desiredState.users, clientVersions, now);
    statements.push(...usersResult.statements);
    conflicts.push(...usersResult.conflicts);
    mutationCount += usersResult.mutationCount;
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

async function prepareSettings(db, user, desiredState, clientVersions, now) {
  const rows = await db.prepare(`
    SELECT key, value_json, version, scope
    FROM app_settings
    WHERE key IN ('goals', 'companyBillCategories')
  `).all();
  const existingByKey = new Map((rows.results || []).map((row) => [String(row.key), row]));
  const desired = new Map([
    ["goals", isObject(desiredState.goals) ? desiredState.goals : {}],
    [
      "companyBillCategories",
      Array.isArray(desiredState.companyBillCategories) ? desiredState.companyBillCategories : [],
    ],
  ]);
  const statements = [];
  const conflicts = [];
  let mutationCount = 0;

  desired.forEach((value, key) => {
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

async function prepareUsers(db, actor, desiredUsers, clientVersions, now) {
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

function protectExistingHistory(existingClient, nextClient, user, now) {
  if (!isObject(existingClient)) return nextClient;
  const existingHistory = Array.isArray(existingClient.history) ? existingClient.history : [];
  const nextHistory = Array.isArray(nextClient.history) ? nextClient.history : [];
  const nextById = new Map(nextHistory.map((entry) => [String(entry?.id || ""), entry]));

  existingHistory.forEach((entry) => {
    const current = nextById.get(String(entry?.id || ""));
    if (!current || JSON.stringify(current) !== JSON.stringify(entry)) {
      throw new PermissionError("Somente a administradora pode editar ou remover o historico.");
    }
  });

  nextClient.history = nextHistory.map((entry) => {
    const id = String(entry?.id || "");
    if (existingHistory.some((existing) => String(existing?.id || "") === id)) return entry;
    return {
      ...entry,
      userId: user.id,
      createdAt: entry.createdAt || now,
      updatedAt: null,
    };
  });
  return nextClient;
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
