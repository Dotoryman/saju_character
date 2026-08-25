CREATE TABLE IF NOT EXISTS daily_visitor_counts (
  visit_date TEXT PRIMARY KEY,
  visitor_count INTEGER NOT NULL DEFAULT 0 CHECK (visitor_count >= 0),
  updated_at TEXT NOT NULL
);

INSERT INTO daily_visitor_counts (visit_date, visitor_count, updated_at)
SELECT visit_date, COUNT(*), MAX(created_at)
FROM daily_visitors
GROUP BY visit_date
ON CONFLICT(visit_date) DO UPDATE SET
  visitor_count = MAX(daily_visitor_counts.visitor_count, excluded.visitor_count),
  updated_at = excluded.updated_at;

PRAGMA optimize;
