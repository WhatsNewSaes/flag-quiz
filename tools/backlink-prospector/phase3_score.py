"""
Phase 3 scoring. Reads `pages`, writes `prospects` with tier + score + pitch_hook.

Scoring rules (from PRD):
  +30 if has_competitor_links True
  +25 if any broken outbound link points to a competitor domain OR has a path
       containing flag/geography/quiz/country/countries/vexillo (record as pitch hook)
  +15 if last_modified within last 24 months
  +15 if topical_score >= 5
  +10 if at least one usable contact email
  +5  if domain TLD matches .edu / k12.*.us / .ac.uk / .edu.au, or domain/title
       contains a homeschool keyword
  -20 if URL or title contains: archive, wayback, calendar, login, signin, cart,
       search?, /tag/, /page/

Tiers:
  Tier 1: score >= 60 AND contact_email present
  Tier 2: score 40-59,  OR (score >= 60 with no contact)
  Tier 3: score 20-39
  Drop : <20  (not written to prospects)
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

from dateutil import parser as dateparser

DB_PATH = Path(__file__).parent / "data" / "prospects.db"
TODAY = datetime(2026, 5, 22, tzinfo=timezone.utc)
TWO_YEARS_AGO = TODAY - timedelta(days=730)

COMPETITORS = {
    "sporcle.com", "seterra.com", "geoguessr.com", "jetpunk.com",
    "worldatlas.com", "lizardpoint.com", "ducksters.com",
    "nationalgeographic.com", "britannica.com", "kids.britannica.com",
    "softschools.com", "abcya.com",
}
PITCH_PATH_KEYWORDS = ("flag", "geography", "quiz", "country", "countries", "vexillo")

HOMESCHOOL_KEYWORDS = ("homeschool", "home-school", "home school", "homeschooler", "homeschooling")

NEGATIVE_URL_TOKENS = (
    "archive.org", "wayback", "/calendar", "/login", "/signin", "/cart",
    "/search?", "/tag/", "/page/",
)


def is_competitor_url(url: str) -> bool:
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return False
    parts = host.split(".")
    # match registered domain — naive but good enough since COMPETITORS are all 2-part
    for i in range(len(parts) - 1):
        if ".".join(parts[i:]) in COMPETITORS:
            return True
    return False


def path_has_pitch_keyword(url: str) -> bool:
    try:
        path = (urlparse(url).path or "").lower()
    except Exception:
        return False
    return any(k in path for k in PITCH_PATH_KEYWORDS)


def parse_lastmod(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        dt = dateparser.parse(s, fuzzy=True)
    except (ValueError, TypeError, OverflowError):
        return None
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def domain_is_edu_pattern(domain: str) -> bool:
    d = (domain or "").lower()
    return (
        d.endswith(".edu")
        or d.endswith(".ac.uk")
        or d.endswith(".edu.au")
        or (".k12." in d and d.endswith(".us"))
    )


def title_is_homeschool(text: str | None) -> bool:
    if not text:
        return False
    t = text.lower()
    return any(k in t for k in HOMESCHOOL_KEYWORDS)


def url_is_negative(url: str, title: str | None) -> bool:
    haystack = url.lower() + " " + (title or "").lower()
    return any(tok in haystack for tok in NEGATIVE_URL_TOKENS)


def score_page(row: dict) -> tuple[int, str | None, dict]:
    """Return (score, pitch_hook, signals_dict). pitch_hook describes the best
    angle for outreach; signals captures all the boolean inputs so we can audit later."""
    signals: dict = {}
    score = 0

    has_comp = bool(row.get("has_competitor_links"))
    signals["has_competitor_links"] = has_comp
    if has_comp:
        score += 30

    broken = json.loads(row["broken_links_json"]) if row.get("broken_links_json") else []

    # find best broken-link pitch hook
    broken_competitor: dict | None = None
    broken_topical: dict | None = None
    for b in broken:
        u = b.get("url") or ""
        if not u:
            continue
        if is_competitor_url(u):
            broken_competitor = b
            break
        if path_has_pitch_keyword(u) and broken_topical is None:
            broken_topical = b
    if broken_competitor or broken_topical:
        score += 25
        signals["broken_competitor_or_topical"] = True

    lm = parse_lastmod(row.get("last_modified"))
    signals["last_modified_parsed"] = lm.isoformat() if lm else None
    if lm and lm >= TWO_YEARS_AGO:
        score += 15
        signals["recent"] = True

    tscore = row.get("topical_score") or 0
    signals["topical_score"] = tscore
    if tscore >= 5:
        score += 15

    emails = json.loads(row["contact_emails_json"]) if row.get("contact_emails_json") else []
    signals["email_count"] = len(emails)
    if emails:
        score += 10

    domain = row.get("domain") or ""
    edu_like = domain_is_edu_pattern(domain)
    home_like = (
        any(k in (domain or "").lower() for k in HOMESCHOOL_KEYWORDS)
        or title_is_homeschool(row.get("title"))
    )
    signals["edu_like"] = edu_like
    signals["homeschool_like"] = home_like
    if edu_like or home_like:
        score += 5

    if url_is_negative(row["url"], row.get("title")):
        score -= 20
        signals["negative_url_pattern"] = True

    # ── pitch hook string ──
    pitch: str | None = None
    if broken_competitor:
        pitch = f"Replace broken link to competitor: {broken_competitor['url']} (status={broken_competitor.get('status')})"
    elif broken_topical:
        pitch = f"Replace broken topical link: {broken_topical['url']} (status={broken_topical.get('status')})"
    elif has_comp:
        comp_links = json.loads(row["competitor_links_json"]) if row.get("competitor_links_json") else []
        comp_hosts = sorted({(urlparse(u).hostname or "").lower() for u in comp_links if u})
        comp_short = ", ".join(h.removeprefix("www.") for h in comp_hosts[:3])
        pitch = f"Page already links to competitors ({comp_short}) — add Flag Arcade as a fresh, free alternative"
    elif tscore >= 10:
        pitch = "Strong topical fit (geography/flag-heavy content) — suggest adding to existing resource list"
    elif edu_like and tscore >= 5:
        pitch = ".edu/k12 resource page covering geography — propose addition"

    return max(score, 0), pitch, signals


def tier_for(score: int, has_email: bool) -> int | None:
    if score >= 60 and has_email:
        return 1
    if 40 <= score <= 59 or (score >= 60 and not has_email):
        return 2
    if 20 <= score <= 39:
        return 3
    return None  # drop


def main() -> int:
    con = sqlite3.connect(DB_PATH)
    pages = con.execute(
        """SELECT p.url, p.status, p.skip_reason, p.title, p.last_modified, p.html_hash,
                  p.outbound_count, p.broken_count, p.has_competitor_links,
                  p.competitor_links_json, p.broken_links_json, p.contact_emails_json,
                  p.topical_score,
                  (SELECT s.domain FROM serp_results s WHERE s.url_normalized = p.url LIMIT 1) AS domain
           FROM pages p
           WHERE p.skip_reason IS NULL AND p.status = 200"""
    ).fetchall()
    cols = [c[0] for c in con.execute("SELECT * FROM pages LIMIT 0").description] + ["domain"]
    now = datetime.now(timezone.utc).isoformat()

    # wipe & rewrite prospects so re-runs are clean
    con.execute("DELETE FROM prospects")
    counts = {1: 0, 2: 0, 3: 0, "drop": 0}
    score_dist: list[tuple[str, int, int | None]] = []
    for row_tuple in pages:
        row = dict(zip(cols, row_tuple))
        score, pitch, signals = score_page(row)
        has_email = bool(row.get("contact_emails_json"))
        tier = tier_for(score, has_email)
        score_dist.append((row["url"], score, tier))
        if tier is None:
            counts["drop"] += 1
            continue
        emails = json.loads(row["contact_emails_json"]) if row.get("contact_emails_json") else []
        contact = emails[0] if emails else None
        signals_full = {
            **signals,
            "domain": row.get("domain"),
            "outbound_count": row.get("outbound_count"),
            "broken_count": row.get("broken_count"),
            "title": row.get("title"),
        }
        con.execute(
            """INSERT OR REPLACE INTO prospects
               (url, tier, score, contact_email, pitch_hook, signals_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (row["url"], tier, score, contact, pitch, json.dumps(signals_full), now),
        )
        counts[tier] += 1
    con.commit()
    con.close()

    print(f"Tier 1 (score>=60 + email): {counts[1]}")
    print(f"Tier 2 (40-59 or 60+ no email): {counts[2]}")
    print(f"Tier 3 (20-39): {counts[3]}")
    print(f"Dropped (<20): {counts['drop']}")
    print(f"Total scored: {sum(counts.values())}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
