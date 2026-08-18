CREATE TABLE IF NOT EXISTS day_archetypes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_index INTEGER NOT NULL UNIQUE CHECK (cycle_index BETWEEN 0 AND 59),
  ganji TEXT NOT NULL UNIQUE,
  ganji_kr TEXT NOT NULL UNIQUE,
  archetype_name TEXT NOT NULL,
  animal_name TEXT NOT NULL,
  element TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS themes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);

CREATE TABLE IF NOT EXISTS character_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_archetype_id INTEGER NOT NULL,
  theme_id INTEGER NOT NULL,
  character_name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  image_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (day_archetype_id) REFERENCES day_archetypes(id),
  FOREIGN KEY (theme_id) REFERENCES themes(id),
  UNIQUE (day_archetype_id, theme_id)
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  cycle_index INTEGER NOT NULL CHECK (cycle_index BETWEEN 0 AND 59),
  is_public INTEGER NOT NULL DEFAULT 1 CHECK (is_public IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  share_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_results_public_feed
  ON results (is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_cycle_index
  ON results (cycle_index);

INSERT OR IGNORE INTO themes (slug, display_name, sort_order) VALUES
  ('one-piece', 'ONE PIECE', 10),
  ('naruto', 'NARUTO', 20),
  ('inuyasha', 'INUYASHA', 30),
  ('ghibli', 'STUDIO GHIBLI', 40);

