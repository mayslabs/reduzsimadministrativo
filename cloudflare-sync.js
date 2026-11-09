(() => {
  const STATE_COLLECTION_KEYS = [
    "statuses",
    "clients",
    "regularizationClients",
    "guidanceItems",
    "guidanceQuestions",
    "internalTasks",
    "meetings",
    "marketingItems",
    "activities",
    "companyBills",
    "users",
  ];
  const STATE_SETTING_KEYS = [
    "goals",
    "companyBillCategories",
    "regularizationFieldDefinitions",
    "regularizationStatusDefinitions",
  ];
  let versions = {};
  let lastSeq = 0;
  let currentUser = null;
  let revision = "";

  class SyncConflictError extends Error {
    constructor(conflicts = []) {
      super("Os dados foram alterados em outro computador.");
      this.name = "SyncConflictError";
      this.code = "SYNC_CONFLICT";
      this.conflicts = conflicts;
    }
  }

  async function load({ onlyIfChanged = false, accept = () => true } = {}) {
    const url = onlyIfChanged && revision ? `/api/state?revision=${encodeURIComponent(revision)}` : "/api/state";
    const payload = await request(url, { method: "GET", keepPage: onlyIfChanged });
    if (!accept() || payload.unchanged === true) return null;
    remember(payload);
    return payload;
  }

  async function save(state, dirtyKeys = null) {
    const usesPatch = Array.isArray(dirtyKeys);
    const options = {
      method: "POST",
      keepPage: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state: usesPatch ? buildStatePatch(state, dirtyKeys) : state,
        versions: usesPatch ? versionsForDirtyKeys(dirtyKeys) : versions,
        ...(usesPatch ? { dirtyKeys, compact: true } : {}),
      }),
    };

    let payload;
    try {
      payload = await request("/api/state", options);
      assertSavePayload(payload);
    } catch (error) {
      if (!isRetryableSyncError(error)) throw error;

      const verifiedPayload = await verifySavedState(state, dirtyKeys);
      if (verifiedPayload) return verifiedPayload;

      await wait(450);
      try {
        payload = await request("/api/state", options);
        assertSavePayload(payload);
      } catch (retryError) {
        const verifiedRetry = await verifySavedState(state, dirtyKeys);
        if (verifiedRetry) return verifiedRetry;
        throw retryError;
      }
    }

    if (payload.statePatch) {
      payload.state = mergeStatePatch(state, payload.statePatch, payload.deletedKeys);
    }
    remember(payload);
    return payload;
  }

  async function logout() {
    await fetch("/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    }).catch(() => {});
    versions = {};
    lastSeq = 0;
    currentUser = null;
    revision = "";
  }

  async function markActivitiesRead(ids) {
    return request("/api/activity-reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
  }

  async function markAllActivitiesRead() {
    return request("/api/activity-reads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
  }

  async function request(url, { keepPage = false, ...options } = {}) {
    let response;
    try {
      response = await fetch(url, {
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          ...(options.headers || {}),
        },
        ...options,
      });
    } catch (cause) {
      const error = new Error("Não foi possível conectar ao servidor para sincronizar os dados.");
      error.name = "NetworkError";
      error.code = "NETWORK_ERROR";
      error.cause = cause;
      throw error;
    }

    const payload = await response.json().catch(() => null);
    if (response.status === 401) {
      if (!keepPage) window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      const error = new Error(keepPage
        ? "Sessão encerrada. Entre novamente com a mesma conta em outra aba e tente salvar."
        : "Sessão encerrada.");
      error.code = "UNAUTHORIZED";
      error.status = response.status;
      throw error;
    }
    if (response.status === 409 && payload?.code === "SYNC_CONFLICT") {
      throw new SyncConflictError(payload.conflicts || []);
    }
    if (!response.ok) {
      const error = new Error(payload?.error || "Não foi possível sincronizar os dados.");
      error.code = payload?.code || "REQUEST_FAILED";
      error.status = response.status;
      throw error;
    }
    if (!payload || typeof payload !== "object") {
      const error = new Error("O servidor não confirmou a sincronização dos dados.");
      error.code = "INVALID_RESPONSE";
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function assertSavePayload(payload) {
    if (payload?.state || payload?.statePatch) return;
    const error = new Error("O servidor não confirmou a sincronização dos dados.");
    error.code = "INVALID_RESPONSE";
    throw error;
  }

  function isRetryableSyncError(error) {
    return ["NETWORK_ERROR", "INVALID_RESPONSE", "STATE_SAVE_FAILED"].includes(error?.code)
      || [408, 425, 429, 500, 502, 503, 504].includes(Number(error?.status));
  }

  async function verifySavedState(state, dirtyKeys) {
    if (!Array.isArray(dirtyKeys)) return null;
    try {
      const payload = await request("/api/state", { method: "GET", keepPage: true });
      if (!dirtyStateMatches(payload.state, state, dirtyKeys)) return null;
      remember(payload);
      return payload;
    } catch (error) {
      if (error?.code === "UNAUTHORIZED") throw error;
      return null;
    }
  }

  function dirtyStateMatches(remoteState, desiredState, dirtyKeys) {
    if (!remoteState || typeof remoteState !== "object") return false;
    return dirtyKeys.every((dirtyKey) => {
      const separator = String(dirtyKey).indexOf(":");
      if (separator < 1) return false;
      const stateKey = String(dirtyKey).slice(0, separator);
      const recordId = String(dirtyKey).slice(separator + 1);

      if (stateKey === "settings") {
        return sameRecord(remoteState[recordId], desiredState[recordId], stateKey);
      }

      const remoteRecord = (Array.isArray(remoteState[stateKey]) ? remoteState[stateKey] : [])
        .find((item) => String(item?.id || "") === recordId);
      const desiredRecord = (Array.isArray(desiredState[stateKey]) ? desiredState[stateKey] : [])
        .find((item) => String(item?.id || "") === recordId);
      return sameRecord(remoteRecord, desiredRecord, stateKey);
    });
  }

  function sameRecord(remoteRecord, desiredRecord, stateKey) {
    if (remoteRecord === undefined || desiredRecord === undefined) {
      return remoteRecord === desiredRecord;
    }
    return JSON.stringify(comparableRecord(remoteRecord, stateKey))
      === JSON.stringify(comparableRecord(desiredRecord, stateKey));
  }

  function comparableRecord(record, stateKey) {
    const comparable = cloneData(record);
    if (stateKey === "marketingItems") {
      delete comparable.createdAt;
      delete comparable.createdBy;
      delete comparable.updatedAt;
      delete comparable.updatedBy;
    }
    return comparable;
  }

  function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  function remember(payload) {
    if (payload.partialVersions) {
      versions = { ...versions, ...(payload.versions || {}) };
      (payload.deletedKeys || []).forEach((key) => delete versions[key]);
    } else {
      versions = { ...(payload.versions || {}) };
      revision = payload.revision || "";
    }
    lastSeq = Number(payload.lastSeq || 0);
    currentUser = payload.currentUser || null;
  }

  function buildStatePatch(state, dirtyKeys) {
    const groupedKeys = groupDirtyKeys(dirtyKeys);
    const patch = {};

    STATE_COLLECTION_KEYS.forEach((stateKey) => {
      const recordIds = groupedKeys.get(stateKey);
      if (!recordIds) return;
      patch[stateKey] = (Array.isArray(state[stateKey]) ? state[stateKey] : [])
        .filter((item) => recordIds.has(String(item?.id || "")));
    });

    const settingKeys = groupedKeys.get("settings");
    STATE_SETTING_KEYS.forEach((settingKey) => {
      if (settingKeys?.has(settingKey)) patch[settingKey] = state[settingKey];
    });
    return patch;
  }

  function mergeStatePatch(state, patch, deletedKeys = []) {
    const merged = cloneData(state);

    STATE_COLLECTION_KEYS.forEach((stateKey) => {
      if (!Array.isArray(patch[stateKey])) return;
      const patchedById = new Map(
        patch[stateKey].map((item) => [String(item?.id || ""), item]),
      );
      const mergedItems = (Array.isArray(merged[stateKey]) ? merged[stateKey] : [])
        .map((item) => patchedById.get(String(item?.id || "")) || item);
      const mergedIds = new Set(mergedItems.map((item) => String(item?.id || "")));
      patch[stateKey].forEach((item) => {
        if (!mergedIds.has(String(item?.id || ""))) mergedItems.push(item);
      });
      merged[stateKey] = mergedItems;
    });

    STATE_SETTING_KEYS.forEach((settingKey) => {
      if (Object.prototype.hasOwnProperty.call(patch, settingKey)) {
        merged[settingKey] = cloneData(patch[settingKey]);
      }
    });

    groupDirtyKeys(deletedKeys).forEach((recordIds, stateKey) => {
      if (!STATE_COLLECTION_KEYS.includes(stateKey)) return;
      merged[stateKey] = (Array.isArray(merged[stateKey]) ? merged[stateKey] : [])
        .filter((item) => !recordIds.has(String(item?.id || "")));
    });
    return merged;
  }

  function versionsForDirtyKeys(dirtyKeys) {
    return dirtyKeys.reduce((result, key) => {
      if (Object.prototype.hasOwnProperty.call(versions, key)) result[key] = versions[key];
      return result;
    }, {});
  }

  function groupDirtyKeys(dirtyKeys = []) {
    return dirtyKeys.reduce((groups, dirtyKey) => {
      const separator = String(dirtyKey).indexOf(":");
      if (separator < 1) return groups;
      const stateKey = String(dirtyKey).slice(0, separator);
      const recordId = String(dirtyKey).slice(separator + 1);
      if (!groups.has(stateKey)) groups.set(stateKey, new Set());
      groups.get(stateKey).add(recordId);
      return groups;
    }, new Map());
  }

  function cloneData(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  window.ReduzSimCloud = {
    SyncConflictError,
    load,
    logout,
    markActivitiesRead,
    markAllActivitiesRead,
    save,
    getCurrentUser: () => currentUser,
    getLastSeq: () => lastSeq,
  };
})();
