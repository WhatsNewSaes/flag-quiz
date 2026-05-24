"""
Phase 1 ingester: read DataForSEO SERP responses from data/serp_responses/*.json
and write them into serp_results + query_runs.

Each input file is a single MCP response from `mcp__dfs-mcp__serp_organic_live_advanced`.
The filename stem becomes a stable slug for the query; the actual query string lives
inside the JSON payload (`tasks[0].data.keyword`).

Idempotent: skips files whose (query, run_date) is already recorded in query_runs.
"""

from __future__ import annotations

import argparse
import json
import logging
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional
from urllib.parse import urlparse, urlunparse, parse_qsl, urlencode

import tldextract

HERE = Path(__file__).parent
DB_PATH = HERE / "data" / "prospects.db"
SERPS_DIR = HERE / "data" / "serp_responses"
LOG_PATH = HERE / "logs" / "run.log"

# Tracking / aggregator hosts to drop early (we also drop later, but drop here so they
# don't waste rows). Kept narrow — Phase 1 just records raw results, dedupe + filter
# is a separate step.
JUNK_QUERY_PARAMS = {"utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
                     "gclid", "fbclid", "mc_cid", "mc_eid", "ref", "ref_src"}


def setup_logging() -> logging.Logger:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    fmt = "%(asctime)s\t%(levelname)s\tphase1\t%(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=fmt,
        handlers=[
            logging.FileHandler(LOG_PATH, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    return logging.getLogger("phase1")


def normalize_url(raw: str) -> Optional[str]:
    """Normalize a URL for dedupe: lowercase host, strip fragments, strip tracking params,
    strip trailing slash on path (except root)."""
    if not raw:
        return None
    try:
        p = urlparse(raw.strip())
    except ValueError:
        return None
    if p.scheme not in ("http", "https"):
        return None
    host = (p.hostname or "").lower()
    if not host:
        return None
    # rebuild netloc with port if non-default
    netloc = host
    if p.port and not ((p.scheme == "http" and p.port == 80) or (p.scheme == "https" and p.port == 443)):
        netloc = f"{host}:{p.port}"
    # strip junk query params
    qs = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True) if k.lower() not in JUNK_QUERY_PARAMS]
    query = urlencode(qs, doseq=True)
    # path: drop trailing slash unless it's just "/"
    path = p.path or "/"
    if len(path) > 1 and path.endswith("/"):
        path = path.rstrip("/")
    return urlunparse((p.scheme, netloc, path, "", query, ""))


def registered_domain(url: str) -> str:
    ext = tldextract.extract(url)
    return ".".join(p for p in (ext.domain, ext.suffix) if p) or (urlparse(url).hostname or "")


def extract_items_and_meta(envelope: dict) -> tuple[str, list[dict], Optional[float]]:
    """Pull (keyword, items, cost) from a saved-response envelope.

    Each file in data/serp_responses/ has shape:
      { keyword: "<the seed query>",
        max_crawl_pages: 7,
        depth: 100,
        response: { ...raw MCP response... } }

    The MCP wrapper flattens the DataForSEO shape and strips the cost field, so we
    rely on the keyword we stored at the envelope level.
    """
    keyword = envelope.get("keyword") or ""
    response = envelope.get("response") or envelope  # accept bare responses too
    items_raw = response.get("items") or []
    # Treat items without explicit type as organic — lets us write minimal envelopes for
    # inline responses without having to repeat type:"organic" per item.
    items = [it for it in items_raw if it.get("type", "organic") == "organic"]
    cost = response.get("cost")  # currently always None — MCP wrapper strips it
    return keyword, items, cost


def ingest_file(con: sqlite3.Connection, log: logging.Logger, path: Path) -> tuple[int, int, Optional[float]]:
    """Ingest one MCP response file. Returns (inserted, total_items, cost_usd)."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    keyword, items, cost = extract_items_and_meta(payload)
    run_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    fetched_at = datetime.now(timezone.utc).isoformat()

    # idempotency: skip if (query, run_date) is already recorded
    row = con.execute(
        "SELECT result_count FROM query_runs WHERE query = ? AND run_date = ?",
        (keyword, run_date),
    ).fetchone()
    if row is not None:
        log.info("skip\t%s\talready ingested today (%d rows)", path.name, row[0] or 0)
        return 0, row[0] or 0, cost

    inserted = 0
    for it in items:
        url = it.get("url") or it.get("link")
        if not url:
            continue
        url_norm = normalize_url(url)
        if not url_norm:
            continue
        domain = registered_domain(url_norm)
        position = it.get("rank_absolute") or it.get("rank_group")
        title = it.get("title")
        snippet = it.get("description") or it.get("snippet")
        try:
            con.execute(
                """INSERT OR IGNORE INTO serp_results
                   (query, url, url_normalized, domain, position, title, snippet, fetched_at, run_date)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (keyword, url, url_norm, domain, position, title, snippet, fetched_at, run_date),
            )
            if con.total_changes:
                inserted += 1
        except sqlite3.Error as e:
            log.warning("insert_error\t%s\t%s", url_norm, e)

    con.execute(
        """INSERT OR REPLACE INTO query_runs (query, run_date, result_count, cost_usd, finished_at)
           VALUES (?, ?, ?, ?, ?)""",
        (keyword, run_date, len(items), cost, fetched_at),
    )
    con.commit()
    log.info("ingest\t%s\tkeyword=%r\titems=%d\tinserted=%d\tcost=%s",
             path.name, keyword, len(items), inserted, cost)
    return inserted, len(items), cost


def main(argv: Optional[Iterable[str]] = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--files", nargs="*", help="Specific response files to ingest (default: all in data/serp_responses/)")
    args = parser.parse_args(argv)

    log = setup_logging()
    SERPS_DIR.mkdir(parents=True, exist_ok=True)

    if args.files:
        files = [Path(f) for f in args.files]
    else:
        files = sorted(SERPS_DIR.glob("*.json"))

    if not files:
        log.warning("no_files\tnothing in %s", SERPS_DIR)
        return 0

    con = sqlite3.connect(DB_PATH)
    total_inserted = 0
    total_items = 0
    total_cost = 0.0
    for f in files:
        try:
            ins, items, cost = ingest_file(con, log, f)
            total_inserted += ins
            total_items += items
            if cost:
                total_cost += cost
        except Exception as e:
            log.error("ingest_failed\t%s\t%s", f.name, e)
    con.close()
    log.info("done\tfiles=%d\titems=%d\tinserted=%d\tcost_usd=%.4f",
             len(files), total_items, total_inserted, total_cost)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
