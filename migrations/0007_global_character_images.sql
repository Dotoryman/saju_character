CREATE TABLE IF NOT EXISTS character_image_overrides (
  theme_slug TEXT NOT NULL,
  character_name TEXT NOT NULL,
  image_key TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (theme_slug, character_name)
);

INSERT INTO character_image_overrides (theme_slug, character_name, image_key, updated_by, updated_at)
SELECT theme_slug, character_name, image_key, updated_by, updated_at
FROM (
  SELECT theme_slug, character_name, image_key, updated_by, updated_at,
    ROW_NUMBER() OVER (
      PARTITION BY theme_slug, character_name
      ORDER BY updated_at DESC, cycle_index DESC
    ) AS image_rank
  FROM content_overrides
  WHERE image_key IS NOT NULL AND character_name IS NOT NULL
)
WHERE image_rank = 1
ON CONFLICT(theme_slug, character_name) DO UPDATE SET
  image_key = excluded.image_key,
  updated_by = excluded.updated_by,
  updated_at = excluded.updated_at;

PRAGMA optimize;
