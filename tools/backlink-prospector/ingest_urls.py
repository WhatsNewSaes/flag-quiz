"""
Ingest a plain-text URL file into serp_results. File format:

    # QUERY: <keyword>
    <url>
    <url>
    # QUERY: <next keyword>
    <url>
    ...

URLs are normalized and inserted; titles/snippets are left null (Phase 2 will
populate them from the actual page fetch). Idempotent via (query, url_norm, run_date)
unique constraint plus the query_runs table.
"""
from __future__ import annotations

import argparse
import logging
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

# Reuse helpers from phase1_ingest
from phase1_ingest import normalize_url, registered_domain, setup_logging  # noqa: E402

HERE = Path(__file__).parent
DB_PATH = HERE / "data" / "prospects.db"


def parse_blocks(text: str) -> list[tuple[str, list[str]]]:
    blocks: list[tuple[str, list[str]]] = []
    current_q: str | None = None
    current_urls: list[str] = []
    for line in text.splitlines():
        s = line.strip()
        if not s:
            continue
        if s.startswith("# QUERY:"):
            if current_q is not None:
                blocks.append((current_q, current_urls))
            current_q = s[len("# QUERY:"):].strip()
            current_urls = []
        elif s.startswith("#"):
            continue
        else:
            if current_q is None:
                raise ValueError(f"URL before any '# QUERY:' header: {s!r}")
            current_urls.append(s)
    if current_q is not None:
        blocks.append((current_q, current_urls))
    return blocks


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Path to URL-list file in '# QUERY: <kw>' / <url> format")
    args = parser.parse_args()

    log = setup_logging()
    text = Path(args.file).read_text(encoding="utf-8")
    blocks = parse_blocks(text)

    run_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    fetched_at = datetime.now(timezone.utc).isoformat()

    con = sqlite3.connect(DB_PATH)
    total_inserted = 0
    for keyword, urls in blocks:
        # check idempotency
        row = con.execute(
            "SELECT result_count FROM query_runs WHERE query = ? AND run_date = ?",
            (keyword, run_date),
        ).fetchone()
        if row is not None:
            log.info("skip\t%s\talready ingested today (%d rows)", keyword, row[0] or 0)
            continue

        ins = 0
        for rank, url in enumerate(urls, start=1):
            url_norm = normalize_url(url)
            if not url_norm:
                continue
            domain = registered_domain(url_norm)
            try:
                cur = con.execute(
                    """INSERT OR IGNORE INTO serp_results
                       (query, url, url_normalized, domain, position, title, snippet, fetched_at, run_date)
                       VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)""",
                    (keyword, url, url_norm, domain, rank, fetched_at, run_date),
                )
                if cur.rowcount > 0:
                    ins += 1
            except sqlite3.Error as e:
                log.warning("insert_error\t%s\t%s", url_norm, e)
        con.execute(
            """INSERT OR REPLACE INTO query_runs (query, run_date, result_count, cost_usd, finished_at)
               VALUES (?, ?, ?, NULL, ?)""",
            (keyword, run_date, len(urls), fetched_at),
        )
        con.commit()
        log.info("ingest_urls\tkeyword=%r\turls=%d\tinserted=%d", keyword, len(urls), ins)
        total_inserted += ins
    con.close()
    log.info("done\tqueries=%d\tinserted=%d", len(blocks), total_inserted)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
