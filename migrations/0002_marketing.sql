CREATE TABLE IF NOT EXISTS marketing_items (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  scope TEXT NOT NULL DEFAULT 'team' CHECK (scope IN ('team', 'admin')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  deleted_by TEXT
);

CREATE INDEX IF NOT EXISTS marketing_items_active_idx
  ON marketing_items(deleted_at, scope);
