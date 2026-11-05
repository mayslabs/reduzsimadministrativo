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

  class SyncConflictError extends Error {
    constructor(conflicts = []) {
      super("Os dados foram alterados em outro computador.");
      this.name = "SyncConflictError";
      this.conflicts = conflicts;
    }
  }

  async function load() {
    const payload = await request("/api/state", { method: "GET" });
    remember(payload);
    return payload;
  }

  async function save(state, dirtyKeys = null) {
    const usesPatch = Array.isArray(dirtyKeys);
    const payload = await request("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        state: usesPatch ? buildStatePatch(state, dirtyKeys) : state,
        versions: usesPatch ? versionsForDirtyKeys(dirtyKeys) : versions,
        ...(usesPatch ? { dirtyKeys, compact: true } : {}),
      }),
    });
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

  async function request(url, options) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      throw new Error("Sessão encerrada.");
    }
    if (response.status === 409 && payload.code === "SYNC_CONFLICT") {
      throw new SyncConflictError(payload.conflicts || []);
    }
    if (!response.ok) {
      const error = new Error(payload.error || "Não foi possível sincronizar os dados.");
      error.code = payload.code || "REQUEST_FAILED";
      throw error;
    }
    return payload;
  }

  function remember(payload) {
    if (payload.partialVersions) {
      versions = { ...versions, ...(payload.versions || {}) };
      (payload.deletedKeys || []).forEach((key) => delete versions[key]);
    } else {
      versions = { ...(payload.versions || {}) };
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
