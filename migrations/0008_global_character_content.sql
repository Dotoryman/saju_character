CREATE TABLE IF NOT EXISTS character_content_overrides (
  theme_slug TEXT NOT NULL,
  character_key TEXT NOT NULL,
  display_name TEXT,
  tagline TEXT,
  description TEXT,
  image_key TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (theme_slug, character_key)
);

INSERT INTO character_content_overrides (
  theme_slug, character_key, display_name, tagline, description, image_key, enabled, updated_by, updated_at
)
SELECT theme_slug, character_name, character_name, tagline, description, image_key, enabled, updated_by, updated_at
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY theme_slug, character_name
    ORDER BY updated_at DESC, cycle_index DESC
  ) AS content_rank
  FROM content_overrides
  WHERE character_name IS NOT NULL
)
WHERE content_rank = 1
ON CONFLICT(theme_slug, character_key) DO UPDATE SET
  display_name = COALESCE(excluded.display_name, character_content_overrides.display_name),
  tagline = COALESCE(excluded.tagline, character_content_overrides.tagline),
  description = COALESCE(excluded.description, character_content_overrides.description),
  image_key = COALESCE(excluded.image_key, character_content_overrides.image_key),
  enabled = excluded.enabled,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

INSERT INTO character_content_overrides (
  theme_slug, character_key, display_name, image_key, enabled, updated_by, updated_at
)
SELECT theme_slug, character_name, character_name, image_key, 1, updated_by, updated_at
FROM character_image_overrides
WHERE 1 = 1
ON CONFLICT(theme_slug, character_key) DO UPDATE SET
  image_key = excluded.image_key,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

PRAGMA optimize;
