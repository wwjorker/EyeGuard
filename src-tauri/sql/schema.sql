CREATE TABLE IF NOT EXISTS app_footprint (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at  INTEGER NOT NULL,    -- unix seconds
    ended_at    INTEGER NOT NULL,    -- unix seconds
    duration_s  INTEGER NOT NULL,
    process     TEXT NOT NULL,
    title       TEXT
);

CREATE INDEX IF NOT EXISTS idx_footprint_started ON app_footprint(started_at);
CREATE INDEX IF NOT EXISTS idx_footprint_process ON app_footprint(process);

CREATE TABLE IF NOT EXISTS break_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    occurred_at INTEGER NOT NULL,
    duration_s  INTEGER NOT NULL,
    skipped     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_break_occurred ON break_log(occurred_at);

CREATE TABLE IF NOT EXISTS app_category (
    process     TEXT PRIMARY KEY,
    category    TEXT NOT NULL
);
