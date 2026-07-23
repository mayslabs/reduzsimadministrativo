(() => {
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

  async function save(state) {
    const payload = await request("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state, versions }),
    });
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
    versions = { ...(payload.versions || {}) };
    lastSeq = Number(payload.lastSeq || 0);
    currentUser = payload.currentUser || null;
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
