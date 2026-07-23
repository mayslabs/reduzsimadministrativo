PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  session_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO app_users (
  id, firebase_uid, email, name, role, enabled, session_version, created_at, updated_at
) VALUES
  (
    'user-mayssa',
    NULL,
    'mayssa@reduzsiminss.com.br',
    'Mayssa',
    'admin',
    1,
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ),
  (
    'user-contato',
    NULL,
    'contato@reduzsiminss.com.br',
    'Camilli',
    'user',
    1,
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  );

CREATE TABLE IF NOT EXISTS sync_log (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upsert', 'delete')),
  version INTEGER NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('team', 'admin')),
  changed_at TEXT NOT NULL,
  changed_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sync_log_seq_idx ON sync_log(seq);
CREATE INDEX IF NOT EXISTS sync_log_changed_at_idx ON sync_log(changed_at DESC);

CREATE TABLE IF NOT EXISTS statuses (
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

CREATE TABLE IF NOT EXISTS clients (
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

CREATE TABLE IF NOT EXISTS regularization_clients (
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

CREATE TABLE IF NOT EXISTS guidance_items (
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

CREATE TABLE IF NOT EXISTS guidance_questions (
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

CREATE TABLE IF NOT EXISTS internal_tasks (
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

CREATE TABLE IF NOT EXISTS meetings (
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

CREATE TABLE IF NOT EXISTS activities (
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

CREATE TABLE IF NOT EXISTS activity_reads (
  activity_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  read_at TEXT NOT NULL,
  PRIMARY KEY (activity_id, user_id),
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_bills (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  scope TEXT NOT NULL DEFAULT 'admin' CHECK (scope IN ('team', 'admin')),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  deleted_at TEXT,
  deleted_by TEXT
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL CHECK (json_valid(value_json)),
  scope TEXT NOT NULL DEFAULT 'team' CHECK (scope IN ('team', 'admin')),
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL
);

INSERT OR IGNORE INTO app_settings (key, value_json, scope, version, updated_at, updated_by)
VALUES
  (
    'goals',
    '{"floor":"R$ 15.000,00","target":"R$ 20.000,00","stretch":"R$ 25.000,00"}',
    'team',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    'system'
  ),
  (
    'companyBillCategories',
    '["Sistema","Serviço","Operacional","Fixo","Marketing","Imposto","Fornecedor","Pessoal","Outros"]',
    'admin',
    1,
    strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
    'system'
  );

CREATE TABLE IF NOT EXISTS migration_runs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  imported_by TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  record_counts TEXT NOT NULL CHECK (json_valid(record_counts))
);

CREATE INDEX IF NOT EXISTS statuses_active_idx ON statuses(deleted_at, scope);
CREATE INDEX IF NOT EXISTS clients_active_idx ON clients(deleted_at, scope);
CREATE INDEX IF NOT EXISTS regularization_clients_active_idx ON regularization_clients(deleted_at, scope);
CREATE INDEX IF NOT EXISTS guidance_items_active_idx ON guidance_items(deleted_at, scope);
CREATE INDEX IF NOT EXISTS guidance_questions_active_idx ON guidance_questions(deleted_at, scope);
CREATE INDEX IF NOT EXISTS internal_tasks_active_idx ON internal_tasks(deleted_at, scope);
CREATE INDEX IF NOT EXISTS meetings_active_idx ON meetings(deleted_at, scope);
CREATE INDEX IF NOT EXISTS activities_active_idx ON activities(deleted_at, scope);
CREATE INDEX IF NOT EXISTS activities_created_idx ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_reads_user_idx ON activity_reads(user_id, activity_id);
CREATE INDEX IF NOT EXISTS company_bills_active_idx ON company_bills(deleted_at, scope);
