PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL COLLATE NOCASE UNIQUE,
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  force_password_change INTEGER NOT NULL DEFAULT 0 CHECK (force_password_change IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions (user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_users_created ON users (created_at DESC);

CREATE TABLE IF NOT EXISTS auth_attempts (
  action TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  window_start TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (action, client_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_auth_attempts_window ON auth_attempts (window_start);

ALTER TABLE results ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE results ADD COLUMN is_saved INTEGER NOT NULL DEFAULT 0 CHECK (is_saved IN (0, 1));
ALTER TABLE results ADD COLUMN profile_label TEXT;
ALTER TABLE results ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_results_user_saved ON results (user_id, is_saved, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_visitors (
  visit_date TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (visit_date, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_daily_visitors_date ON daily_visitors (visit_date);

CREATE TABLE IF NOT EXISTS content_overrides (
  cycle_index INTEGER NOT NULL CHECK (cycle_index BETWEEN 0 AND 59),
  theme_slug TEXT NOT NULL,
  character_name TEXT,
  tagline TEXT,
  description TEXT,
  image_key TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_by INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (cycle_index, theme_slug),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs (created_at DESC);

ALTER TABLE character_change_requests ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE character_change_requests ADD COLUMN admin_note TEXT;
ALTER TABLE character_change_requests ADD COLUMN handled_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE character_change_requests ADD COLUMN handled_at TEXT;
