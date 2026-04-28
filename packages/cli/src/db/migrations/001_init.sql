CREATE TABLE IF NOT EXISTS memory_index (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  developer TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  bm25_tokens TEXT NOT NULL DEFAULT '[]',
  decay_score REAL NOT NULL DEFAULT 1.0,
  embedding_path TEXT,
  last_indexed TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memory_module ON memory_index(module);
CREATE INDEX IF NOT EXISTS idx_memory_date ON memory_index(date);

CREATE TABLE IF NOT EXISTS session_log (
  id TEXT PRIMARY KEY,
  team TEXT NOT NULL,
  started_at TEXT NOT NULL,
  agent TEXT NOT NULL,
  module TEXT,
  raw_log_path TEXT,
  distilled INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS toggle_state (
  scope TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
