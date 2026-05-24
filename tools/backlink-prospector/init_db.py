"""
Initialize ./data/prospects.db with the schema for the backlink prospecting pipeline.

Idempotent: safe to re-run; uses CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
"""

import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "prospects.db"

SCHEMA = """
-- Raw SERP rows captured per (query, run-date). One row per organic result.
CREATE TABLE IF NOT EXISTS serp_results (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    query           TEXT    NOT NULL,
    url             TEXT    NOT NULL,
    url_normalized  TEXT    NOT NULL,
    domain          TEXT    NOT NULL,
    position        INTEGER,
    title           TEXT,
    snippet         TEXT,
    fetched_at      TEXT    NOT NULL,           -- ISO-8601 UTC
    run_date        TEXT    NOT NULL,           -- YYYY-MM-DD, for idempotency
    UNIQUE (query, url_normalized, run_date)
);

CREATE INDEX IF NOT EXISTS idx_serp_results_url_norm ON serp_results (url_normalized);
CREATE INDEX IF NOT EXISTS idx_serp_results_domain   ON serp_results (domain);
CREATE INDEX IF NOT EXISTS idx_serp_results_run_date ON serp_results (run_date);

-- One row per unique candidate URL after Phase-2 fetch + analysis.
CREATE TABLE IF NOT EXISTS pages (
    url                     TEXT PRIMARY KEY,    -- normalized form
    status                  INTEGER,             -- HTTP status (or null if skipped/error)
    skip_reason             TEXT,                -- 'robots', 'non_html', 'too_large', 'timeout', etc.
    title                   TEXT,
    last_modified           TEXT,                -- ISO-8601 if parseable
    html_hash               TEXT,                -- sha256 of fetched body
    outbound_count          INTEGER DEFAULT 0,
    broken_count            INTEGER DEFAULT 0,
    has_competitor_links    INTEGER DEFAULT 0,   -- 0/1
    competitor_links_json   TEXT,                -- JSON array of competitor URLs found
    broken_links_json       TEXT,                -- JSON array of {url, status} for dead outbounds
    contact_emails_json     TEXT,                -- JSON array of filtered emails
    topical_score           INTEGER DEFAULT 0,   -- 0-50, capped
    analyzed_at             TEXT                 -- ISO-8601 UTC
);

CREATE INDEX IF NOT EXISTS idx_pages_analyzed_at ON pages (analyzed_at);

-- Final tiered, scored prospects. One row per qualified URL.
CREATE TABLE IF NOT EXISTS prospects (
    url             TEXT PRIMARY KEY,
    tier            INTEGER NOT NULL,            -- 1, 2, 3
    score           INTEGER NOT NULL,            -- 0-100
    contact_email   TEXT,
    pitch_hook      TEXT,                        -- broken link to replace, or "lists X, Y"
    signals_json    TEXT,                        -- JSON: {has_competitor_links, broken_competitor_url, recency, topical_score, edu_tld, ...}
    created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prospects_tier  ON prospects (tier);
CREATE INDEX IF NOT EXISTS idx_prospects_score ON prospects (score);

-- Cache of HEAD-check results so we don't re-probe the same outbound across pages.
CREATE TABLE IF NOT EXISTS link_status (
    url         TEXT PRIMARY KEY,
    status      INTEGER,                         -- HTTP status or null on network error
    error       TEXT,                            -- short error string if no status
    checked_at  TEXT NOT NULL
);

-- Cache of /contact and /about email scrapes, keyed by domain to avoid re-fetching.
CREATE TABLE IF NOT EXISTS domain_contacts (
    domain         TEXT PRIMARY KEY,
    emails_json    TEXT,                         -- JSON array
    checked_at     TEXT NOT NULL
);

-- Track which seed queries were run on which date (for idempotency).
CREATE TABLE IF NOT EXISTS query_runs (
    query       TEXT NOT NULL,
    run_date    TEXT NOT NULL,
    result_count INTEGER,
    cost_usd    REAL,                            -- if returned by DataForSEO
    finished_at TEXT NOT NULL,
    PRIMARY KEY (query, run_date)
);

-- Per-prospect outreach state. Survives pipeline re-runs (keyed by url) and
-- replaces browser localStorage as the source of truth when the dashboard is
-- served via serve.py. Status values: '' / not_contacted / emailed / replied /
-- linked / dead.
CREATE TABLE IF NOT EXISTS outreach_status (
    url        TEXT PRIMARY KEY,
    status     TEXT,
    notes      TEXT,
    updated_at TEXT NOT NULL
);
"""


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(DB_PATH)
    try:
        con.executescript(SCHEMA)
        con.commit()
        tables = [r[0] for r in con.execute(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )]
        print(f"DB ready at {DB_PATH}")
        print(f"Tables: {', '.join(tables)}")
    finally:
        con.close()


if __name__ == "__main__":
    main()
