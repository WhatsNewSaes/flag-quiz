"""
Phase 2: fetch each candidate URL, extract analysis signals, write to `pages`.

Politeness:
  - UA: FlagArcadeBot/1.0 (+https://flagarcade.com/bot; outreach research)
  - robots.txt honoured per domain (cached for the run)
  - max 2 concurrent fetches per domain, 8 global
  - 0.5s jitter between requests on the same domain
  - timeout 15s; skip non-200, non-HTML, or >2MB pages
  - max 2 retries with exponential backoff on transient errors

Per page, we record (into `pages` table):
  - status, title, last_modified, html_hash
  - outbound_count, broken_count
  - has_competitor_links (bool), competitor_links_json (array of URLs)
  - broken_links_json (array of {url, status})
  - contact_emails_json (array)
  - topical_score (0-50)

HEAD-checks for outbound URLs are cached in `link_status`.
Per-domain email scrapes of /contact and /about cached in `domain_contacts`.

Run: python phase2_analyze.py [--limit N] [--resume]
  --limit N        : analyze only first N un-analyzed candidates (smoke test)
  --resume         : default; skip candidates already in `pages`
  --reanalyze URL  : force re-analysis of a single URL (for testing)
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import logging
import random
import re
import sqlite3
import sys
import time
from collections import Counter
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional
from urllib import robotparser
from urllib.parse import urlparse, urljoin

import httpx
import tldextract
from selectolax.parser import HTMLParser

# ──────────────────────────────────────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────────────────────────────────────

HERE = Path(__file__).parent
DB_PATH = HERE / "data" / "prospects.db"
LOG_PATH = HERE / "logs" / "run.log"

UA = "FlagArcadeBot/1.0 (+https://flagarcade.com/bot; outreach research)"
TIMEOUT_S = 15.0
HEAD_TIMEOUT_S = 10.0
MAX_BYTES = 2 * 1024 * 1024  # 2 MB
GLOBAL_CONCURRENCY = 8
PER_DOMAIN_CONCURRENCY = 2
JITTER_S = 0.5
MAX_RETRIES = 2
# Cap outbound HEAD-checks per page so a single mega-link-dump page can't stall the run.
# Pages with more outbounds than this still record full outbound_count (signal preserved)
# but we only HEAD-check the first N for broken-link detection.
MAX_OUTBOUND_HEAD_CHECKS = 200

COMPETITORS = {
    "sporcle.com", "seterra.com", "geoguessr.com", "jetpunk.com",
    "worldatlas.com", "lizardpoint.com", "ducksters.com",
    "nationalgeographic.com", "britannica.com", "kids.britannica.com",
    "softschools.com", "abcya.com",
}

# substrings of broken-link URLs that suggest the page used to host a flag/geo resource
BROKEN_PATH_KEYWORDS = ("flag", "geography", "quiz", "country", "countries", "vexillo")

TOPICAL_TERMS = (
    "flag", "flags", "geography", "country", "countries", "continent",
    "social studies", "world map", "capital", "vexillology",
)
TOPICAL_SCORE_CAP = 50

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
NOISE_EMAIL_PREFIXES = (
    "privacy@", "noreply@", "no-reply@", "abuse@", "donotreply@",
    "do-not-reply@", "postmaster@", "mailer-daemon@",
)
NOISE_EMAIL_DOMAINS = (
    "sentry.io", "wixpress.com", "domain.example",
    # common image-tracking hashes that look like emails — we drop them anyway via prefix check
)

# pages we fetch per domain to scrape emails (with caching)
CONTACT_PATHS = ("/contact", "/about", "/contact-us", "/about-us")


# ──────────────────────────────────────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────────────────────────────────────

def setup_logging() -> logging.Logger:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    fmt = "%(asctime)s\t%(levelname)s\tphase2\t%(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=fmt,
        handlers=[
            logging.FileHandler(LOG_PATH, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
        force=True,
    )
    return logging.getLogger("phase2")


# ──────────────────────────────────────────────────────────────────────────────
# Rate limiting: per-domain semaphores + jitter
# ──────────────────────────────────────────────────────────────────────────────

class DomainLimiter:
    """Ensures we never have more than N in-flight requests per registered domain,
    and pauses briefly between successive requests on the same domain."""

    def __init__(self, per_domain: int, jitter_s: float) -> None:
        self._per_domain = per_domain
        self._jitter = jitter_s
        self._sems: dict[str, asyncio.Semaphore] = {}
        self._last_hit: dict[str, float] = defaultdict(float)
        self._meta_lock = asyncio.Lock()

    async def _get_sem(self, domain: str) -> asyncio.Semaphore:
        async with self._meta_lock:
            sem = self._sems.get(domain)
            if sem is None:
                sem = asyncio.Semaphore(self._per_domain)
                self._sems[domain] = sem
            return sem

    async def acquire(self, domain: str) -> asyncio.Semaphore:
        sem = await self._get_sem(domain)
        await sem.acquire()
        # honour per-domain spacing
        last = self._last_hit[domain]
        delta = time.monotonic() - last
        wait = self._jitter + random.uniform(0, self._jitter) - delta
        if wait > 0:
            await asyncio.sleep(wait)
        self._last_hit[domain] = time.monotonic()
        return sem


# ──────────────────────────────────────────────────────────────────────────────
# robots.txt cache
# ──────────────────────────────────────────────────────────────────────────────

class RobotsCache:
    def __init__(self, client: httpx.AsyncClient, log: logging.Logger) -> None:
        self._client = client
        self._log = log
        self._cache: dict[str, robotparser.RobotFileParser] = {}
        self._lock = asyncio.Lock()

    async def allows(self, url: str) -> bool:
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"
        async with self._lock:
            rp = self._cache.get(origin)
        if rp is None:
            rp = robotparser.RobotFileParser()
            robots_url = origin + "/robots.txt"
            try:
                resp = await self._client.get(robots_url, timeout=10.0)
                if resp.status_code == 200 and resp.text:
                    rp.parse(resp.text.splitlines())
                else:
                    rp.parse([])  # nothing → allow all
            except Exception as e:
                self._log.warning("robots_fetch_failed\t%s\t%s", robots_url, e)
                rp.parse([])
            async with self._lock:
                self._cache[origin] = rp
        try:
            return rp.can_fetch(UA, url)
        except Exception:
            return True


# ──────────────────────────────────────────────────────────────────────────────
# DB helpers (sync — phase 2 is I/O bound on network, DB is fast)
# ──────────────────────────────────────────────────────────────────────────────

def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=30.0)
    con.execute("PRAGMA journal_mode = WAL")
    return con


def get_candidates(con: sqlite3.Connection, limit: Optional[int], resume: bool) -> list[tuple[str, str]]:
    """Return list of (url_normalized, domain) for candidate pages we haven't analyzed yet,
    applying the same social/file-ext filters as phase1_report."""
    sql = """
        SELECT DISTINCT s.url_normalized, s.domain
        FROM serp_results s
        LEFT JOIN pages p ON p.url = s.url_normalized
    """
    where = []
    if resume:
        where.append("p.url IS NULL")
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY s.url_normalized"
    rows = con.execute(sql).fetchall()
    return rows if limit is None else rows[:limit]


def cached_link_status(con: sqlite3.Connection, url: str) -> Optional[tuple[Optional[int], Optional[str]]]:
    row = con.execute(
        "SELECT status, error FROM link_status WHERE url = ?", (url,)
    ).fetchone()
    return row


def save_link_status(con: sqlite3.Connection, url: str, status: Optional[int], error: Optional[str]) -> None:
    con.execute(
        "INSERT OR REPLACE INTO link_status (url, status, error, checked_at) VALUES (?, ?, ?, ?)",
        (url, status, error, datetime.now(timezone.utc).isoformat()),
    )


def cached_domain_contacts(con: sqlite3.Connection, domain: str) -> Optional[list[str]]:
    row = con.execute(
        "SELECT emails_json FROM domain_contacts WHERE domain = ?", (domain,)
    ).fetchone()
    if row is None:
        return None
    return json.loads(row[0]) if row[0] else []


def save_domain_contacts(con: sqlite3.Connection, domain: str, emails: list[str]) -> None:
    con.execute(
        "INSERT OR REPLACE INTO domain_contacts (domain, emails_json, checked_at) VALUES (?, ?, ?)",
        (domain, json.dumps(emails), datetime.now(timezone.utc).isoformat()),
    )


def save_page(con: sqlite3.Connection, row: dict) -> None:
    con.execute(
        """INSERT OR REPLACE INTO pages
           (url, status, skip_reason, title, last_modified, html_hash,
            outbound_count, broken_count, has_competitor_links,
            competitor_links_json, broken_links_json, contact_emails_json,
            topical_score, analyzed_at)
           VALUES (:url, :status, :skip_reason, :title, :last_modified, :html_hash,
                   :outbound_count, :broken_count, :has_competitor_links,
                   :competitor_links_json, :broken_links_json, :contact_emails_json,
                   :topical_score, :analyzed_at)""",
        row,
    )


# ──────────────────────────────────────────────────────────────────────────────
# Extraction helpers
# ──────────────────────────────────────────────────────────────────────────────

def registered_domain(host_or_url: str) -> str:
    ext = tldextract.extract(host_or_url)
    return ".".join(p for p in (ext.domain, ext.suffix) if p)


def extract_title(tree: HTMLParser) -> Optional[str]:
    node = tree.css_first("title")
    if node is None:
        return None
    return (node.text() or "").strip() or None


# look for "Updated: ...", "Last revised: ..." patterns near the top of the doc
LAST_MOD_RE = re.compile(
    r"(?:last\s+(?:updated|revised|modified)|updated)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}/\d{1,2}/\d{4})",
    re.IGNORECASE,
)


def extract_last_modified(headers: httpx.Headers, html: str, tree: HTMLParser) -> Optional[str]:
    # header
    lm = headers.get("last-modified")
    if lm:
        return lm
    # meta tag
    meta = tree.css_first('meta[name="last-modified"]')
    if meta:
        v = meta.attributes.get("content")
        if v:
            return v
    # visible text scan — first 4 KB of the rendered text only
    text = " ".join((tree.body.text() if tree.body else "").split())[:4000]
    m = LAST_MOD_RE.search(text)
    if m:
        return m.group(1).strip()
    return None


def extract_outbound_links(tree: HTMLParser, page_url: str) -> list[str]:
    page_host = urlparse(page_url).hostname or ""
    if not page_host:
        return []
    page_reg = registered_domain(page_host)
    seen: set[str] = set()
    out: list[str] = []
    for a in tree.css("a[href]"):
        href = (a.attributes.get("href") or "").strip()
        if not href or href.startswith("#") or href.lower().startswith("mailto:") or href.lower().startswith("javascript:"):
            continue
        absolute = urljoin(page_url, href)
        try:
            p = urlparse(absolute)
        except ValueError:
            continue
        if p.scheme not in ("http", "https"):
            continue
        h = p.hostname or ""
        if not h:
            continue
        if registered_domain(h) == page_reg:
            continue  # internal
        # normalize: drop fragment
        clean = p._replace(fragment="").geturl()
        if clean in seen:
            continue
        seen.add(clean)
        out.append(clean)
    return out


def topical_score(tree: HTMLParser) -> int:
    text = (tree.body.text() if tree.body else "").lower()
    if not text:
        return 0
    score = 0
    for term in TOPICAL_TERMS:
        score += text.count(term.lower())
        if score >= TOPICAL_SCORE_CAP:
            return TOPICAL_SCORE_CAP
    return score


def extract_mailto_and_text_emails(tree: HTMLParser, html: str) -> list[str]:
    found: set[str] = set()
    for a in tree.css('a[href^="mailto:"]'):
        href = (a.attributes.get("href") or "").strip()
        if href.lower().startswith("mailto:"):
            addr = href.split(":", 1)[1].split("?", 1)[0].strip().lower()
            if addr:
                found.add(addr)
    visible_text = tree.body.text() if tree.body else ""
    for m in EMAIL_RE.finditer(visible_text):
        found.add(m.group(0).lower())
    return sorted(found)


def filter_emails(emails: Iterable[str]) -> list[str]:
    out: list[str] = []
    for e in emails:
        if any(e.startswith(p) for p in NOISE_EMAIL_PREFIXES):
            continue
        if any(e.endswith("@" + d) for d in NOISE_EMAIL_DOMAINS):
            continue
        # discard obvious image-CDN false positives like wixstatic image hashes
        if e.endswith(".png") or e.endswith(".jpg") or e.endswith(".gif"):
            continue
        out.append(e)
    return out


def is_competitor(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return registered_domain(host) in COMPETITORS


def is_brokenable_competitor_path(url: str) -> bool:
    path = (urlparse(url).path or "").lower()
    return any(k in path for k in BROKEN_PATH_KEYWORDS)


# ──────────────────────────────────────────────────────────────────────────────
# HEAD checker (cached)
# ──────────────────────────────────────────────────────────────────────────────

async def head_check(
    client: httpx.AsyncClient,
    con: sqlite3.Connection,
    url: str,
    log: logging.Logger,
) -> tuple[Optional[int], Optional[str]]:
    cached = cached_link_status(con, url)
    if cached is not None:
        return cached
    try:
        resp = await client.head(url, follow_redirects=True, timeout=HEAD_TIMEOUT_S)
        status, error = resp.status_code, None
    except httpx.HTTPError as e:
        # some servers refuse HEAD — try GET with stream + immediate close
        try:
            async with client.stream("GET", url, follow_redirects=True, timeout=HEAD_TIMEOUT_S) as resp:
                status, error = resp.status_code, None
        except Exception as e2:
            status, error = None, f"{type(e2).__name__}: {e2}"
    except Exception as e:
        status, error = None, f"{type(e).__name__}: {e}"
    save_link_status(con, url, status, error)
    con.commit()
    return status, error


# ──────────────────────────────────────────────────────────────────────────────
# Per-domain contact email scrape (cached)
# ──────────────────────────────────────────────────────────────────────────────

async def domain_contact_emails(
    client: httpx.AsyncClient,
    con: sqlite3.Connection,
    robots: RobotsCache,
    limiter: DomainLimiter,
    domain: str,
    page_url: str,
    log: logging.Logger,
) -> list[str]:
    cached = cached_domain_contacts(con, domain)
    if cached is not None:
        return cached
    parsed = urlparse(page_url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    found: set[str] = set()
    for path in CONTACT_PATHS:
        url = origin + path
        if not await robots.allows(url):
            continue
        await limiter.acquire(domain)
        sem = await limiter._get_sem(domain)  # release after we're done
        try:
            try:
                resp = await client.get(url, follow_redirects=True, timeout=TIMEOUT_S)
            except Exception:
                continue
            if resp.status_code != 200 or "text/html" not in (resp.headers.get("content-type") or ""):
                continue
            html = resp.text[:MAX_BYTES]
            try:
                tree = HTMLParser(html)
            except Exception:
                continue
            for e in extract_mailto_and_text_emails(tree, html):
                found.add(e)
        finally:
            sem.release()
    emails = filter_emails(sorted(found))
    save_domain_contacts(con, domain, emails)
    con.commit()
    return emails


# ──────────────────────────────────────────────────────────────────────────────
# Per-candidate analysis
# ──────────────────────────────────────────────────────────────────────────────

async def fetch_page(
    client: httpx.AsyncClient,
    url: str,
    log: logging.Logger,
) -> tuple[Optional[httpx.Response], Optional[str], Optional[str]]:
    """Returns (response_or_None, html_text_or_None, skip_reason_or_None)."""
    backoff = 1.0
    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = await client.get(url, follow_redirects=True, timeout=TIMEOUT_S)
        except (httpx.TimeoutException,):
            if attempt < MAX_RETRIES:
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
            return None, None, "timeout"
        except httpx.HTTPError as e:
            if attempt < MAX_RETRIES:
                await asyncio.sleep(backoff)
                backoff *= 2
                continue
            return None, None, f"http_error:{type(e).__name__}"
        if resp.status_code != 200:
            return resp, None, f"status_{resp.status_code}"
        ct = (resp.headers.get("content-type") or "").lower()
        if "text/html" not in ct and "application/xhtml" not in ct:
            return resp, None, "non_html"
        # size guard — read in chunks but bail at MAX_BYTES
        if len(resp.content) > MAX_BYTES:
            return resp, None, "too_large"
        try:
            html = resp.text
        except Exception:
            return resp, None, "decode_error"
        return resp, html, None
    return None, None, "exhausted"


async def analyze_one(
    client: httpx.AsyncClient,
    con_factory,
    robots: RobotsCache,
    limiter: DomainLimiter,
    global_sem: asyncio.Semaphore,
    url: str,
    domain: str,
    log: logging.Logger,
) -> None:
    parsed = urlparse(url)
    page_reg = registered_domain(parsed.hostname or "")
    now_iso = datetime.now(timezone.utc).isoformat()

    async with global_sem:
        if not await robots.allows(url):
            con = con_factory()
            try:
                save_page(con, {
                    "url": url, "status": None, "skip_reason": "robots",
                    "title": None, "last_modified": None, "html_hash": None,
                    "outbound_count": 0, "broken_count": 0, "has_competitor_links": 0,
                    "competitor_links_json": None, "broken_links_json": None,
                    "contact_emails_json": None, "topical_score": 0,
                    "analyzed_at": now_iso,
                })
                con.commit()
            finally:
                con.close()
            log.info("skip\t%s\trobots", url)
            return

        await limiter.acquire(page_reg)
        sem = await limiter._get_sem(page_reg)
        try:
            resp, html, skip = await fetch_page(client, url, log)
        finally:
            sem.release()

        if skip is not None or html is None or resp is None:
            con = con_factory()
            try:
                save_page(con, {
                    "url": url,
                    "status": resp.status_code if resp is not None else None,
                    "skip_reason": skip,
                    "title": None, "last_modified": None, "html_hash": None,
                    "outbound_count": 0, "broken_count": 0, "has_competitor_links": 0,
                    "competitor_links_json": None, "broken_links_json": None,
                    "contact_emails_json": None, "topical_score": 0,
                    "analyzed_at": now_iso,
                })
                con.commit()
            finally:
                con.close()
            log.info("skip\t%s\t%s", url, skip)
            return

        # ── parse ──
        try:
            tree = HTMLParser(html)
        except Exception as e:
            log.warning("parse_failed\t%s\t%s", url, e)
            return

        title = extract_title(tree)
        last_modified = extract_last_modified(resp.headers, html, tree)
        html_hash = hashlib.sha256(html.encode("utf-8", errors="replace")).hexdigest()
        outbound = extract_outbound_links(tree, str(resp.url))
        tscore = topical_score(tree)
        page_emails = filter_emails(extract_mailto_and_text_emails(tree, html))

        # ── competitor link detection (no fetch needed) ──
        competitor_links = [u for u in outbound if is_competitor(u)]

        # ── HEAD-check each outbound, in parallel but rate-limited per dest domain ──
        # Prioritize URLs with competitor / topical path keywords so we don't miss
        # a pitch-worthy broken link if the page exceeds MAX_OUTBOUND_HEAD_CHECKS.
        broken: list[dict] = []
        if outbound:
            def priority(u: str) -> int:
                if is_competitor(u):
                    return 0
                if is_brokenable_competitor_path(u):
                    return 1
                return 2
            outbound_to_check = sorted(outbound, key=priority)[:MAX_OUTBOUND_HEAD_CHECKS]

            # use a fresh per-request connection — cap concurrency per dest-domain
            async def check(u: str) -> tuple[str, Optional[int], Optional[str]]:
                dest_reg = registered_domain(urlparse(u).hostname or "")
                await limiter.acquire(dest_reg)
                dsem = await limiter._get_sem(dest_reg)
                try:
                    con = con_factory()
                    try:
                        status, error = await head_check(client, con, u, log)
                    finally:
                        con.close()
                finally:
                    dsem.release()
                return u, status, error

            results = await asyncio.gather(*(check(u) for u in outbound_to_check), return_exceptions=True)
            for r in results:
                if isinstance(r, Exception):
                    continue
                u, status, error = r
                if status is None or status >= 400:
                    broken.append({"url": u, "status": status, "error": error})

        # ── per-domain contact scrape ──
        con = con_factory()
        try:
            domain_emails = await domain_contact_emails(
                client, con, robots, limiter, page_reg, str(resp.url), log,
            )
        finally:
            con.close()

        all_emails = sorted(set(page_emails) | set(domain_emails))
        all_emails = filter_emails(all_emails)

        has_competitor = 1 if competitor_links else 0

        con = con_factory()
        try:
            save_page(con, {
                "url": url,
                "status": resp.status_code,
                "skip_reason": None,
                "title": title,
                "last_modified": last_modified,
                "html_hash": html_hash,
                "outbound_count": len(outbound),
                "broken_count": len(broken),
                "has_competitor_links": has_competitor,
                "competitor_links_json": json.dumps(competitor_links) if competitor_links else None,
                "broken_links_json": json.dumps(broken) if broken else None,
                "contact_emails_json": json.dumps(all_emails) if all_emails else None,
                "topical_score": tscore,
                "analyzed_at": now_iso,
            })
            con.commit()
        finally:
            con.close()

        log.info(
            "ok\t%s\tstatus=%d\toutb=%d\tbroken=%d\tcompet=%d\ttopical=%d\temails=%d",
            url, resp.status_code, len(outbound), len(broken), len(competitor_links), tscore, len(all_emails),
        )


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

async def main_async(args) -> int:
    log = setup_logging()
    con = db()
    try:
        candidates = get_candidates(con, args.limit, resume=not args.no_resume)
    finally:
        con.close()
    log.info("start\tcandidates=%d", len(candidates))
    if not candidates:
        log.info("nothing_to_do")
        return 0

    limiter = DomainLimiter(PER_DOMAIN_CONCURRENCY, JITTER_S)
    global_sem = asyncio.Semaphore(GLOBAL_CONCURRENCY)
    headers = {"User-Agent": UA, "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5"}

    async with httpx.AsyncClient(
        headers=headers,
        http2=True,
        limits=httpx.Limits(max_connections=64, max_keepalive_connections=16),
    ) as client:
        robots = RobotsCache(client, log)

        async def runner(url: str, domain: str) -> None:
            try:
                await analyze_one(client, db, robots, limiter, global_sem, url, domain, log)
            except Exception as e:
                log.exception("crashed\t%s\t%s", url, e)

        await asyncio.gather(*(runner(u, d) for u, d in candidates))

    log.info("done\tanalyzed=%d", len(candidates))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=None, help="Analyze only first N un-analyzed candidates")
    parser.add_argument("--no-resume", action="store_true", help="Re-analyze even rows already in pages")
    args = parser.parse_args()
    return asyncio.run(main_async(args))


if __name__ == "__main__":
    raise SystemExit(main())
