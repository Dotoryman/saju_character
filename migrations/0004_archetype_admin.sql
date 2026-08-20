CREATE TABLE IF NOT EXISTS archetype_overrides (
  cycle_index INTEGER PRIMARY KEY CHECK (cycle_index BETWEEN 0 AND 59),
  animal_name TEXT,
  description TEXT,
  image_key TEXT,
  updated_by INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

