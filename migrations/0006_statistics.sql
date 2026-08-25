CREATE TABLE IF NOT EXISTS daily_result_stats (
  stat_date TEXT PRIMARY KEY,
  result_count INTEGER NOT NULL DEFAULT 0 CHECK (result_count >= 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pillar_result_stats (
  cycle_index INTEGER PRIMARY KEY CHECK (cycle_index BETWEEN 0 AND 59),
  result_count INTEGER NOT NULL DEFAULT 0 CHECK (result_count >= 0),
  updated_at TEXT NOT NULL
);

INSERT INTO daily_result_stats (stat_date, result_count, updated_at)
SELECT strftime('%Y-%m-%d', datetime(created_at, '+9 hours')), COUNT(*), MAX(created_at)
FROM results
GROUP BY strftime('%Y-%m-%d', datetime(created_at, '+9 hours'))
ON CONFLICT(stat_date) DO UPDATE SET
  result_count = excluded.result_count,
  updated_at = excluded.updated_at;

INSERT INTO pillar_result_stats (cycle_index, result_count, updated_at)
SELECT cycle_index, COUNT(*), MAX(created_at)
FROM results
GROUP BY cycle_index
ON CONFLICT(cycle_index) DO UPDATE SET
  result_count = excluded.result_count,
  updated_at = excluded.updated_at;

PRAGMA optimize;
