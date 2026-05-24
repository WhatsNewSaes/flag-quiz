"""
Phase 1 dedup + filter + report. Reads serp_results, applies the noise filters
the PRD calls for, and prints counts.

Filters applied (in order):
  1. dedupe by url_normalized
  2. drop social / video / aggregator hosts (pinterest, youtube, facebook, twitter,
     reddit, archive.org, instagram, tiktok, snapchat, mumsnet, amazon, ebay, etsy)
  3. drop file extensions: .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx
  4. drop the seed-keyword's own home page (e.g. www.google.com search URLs)
"""
from __future__ import annotations

import sqlite3
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import tldextract

DB_PATH = Path(__file__).parent / "data" / "prospects.db"

SOCIAL_HOSTS = {
    "pinterest.com", "youtube.com", "facebook.com", "twitter.com", "x.com",
    "reddit.com", "archive.org", "web.archive.org", "instagram.com", "tiktok.com",
    "snapchat.com", "mumsnet.com", "amazon.com", "amazon.co.uk", "ebay.com",
    "etsy.com", "google.com", "linkedin.com", "wordwall.net",  # wordwall = quiz aggregator
    "academia.edu",  # paywall/login-required academic
}

FILE_EXTS = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx"}


def is_social(domain: str) -> bool:
    ext = tldextract.extract(domain)
    reg = ".".join(p for p in (ext.domain, ext.suffix) if p)
    return reg in SOCIAL_HOSTS


def has_bad_ext(url: str) -> bool:
    path = urlparse(url).path.lower()
    return any(path.endswith(e) for e in FILE_EXTS)


def tld_label(domain: str) -> str:
    """Classify domain into a TLD bucket like '.edu', '.ac.uk', '.k12.*.us', etc."""
    d = domain.lower()
    if d.endswith(".ac.uk"):
        return ".ac.uk"
    if d.endswith(".edu"):
        return ".edu"
    if ".k12." in d and d.endswith(".us"):
        return "k12.*.us"
    if d.endswith(".edu.au"):
        return ".edu.au"
    if d.endswith(".gov"):
        return ".gov"
    if d.endswith(".org"):
        return ".org"
    if d.endswith(".com"):
        return ".com"
    # fallback
    parts = d.split(".")
    return "." + parts[-1] if parts else "other"


def main() -> None:
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        "SELECT url_normalized, domain, query FROM serp_results"
    ).fetchall()
    total_raw = len(rows)

    # dedupe by url_normalized
    seen: dict[str, tuple[str, str]] = {}
    for url, domain, query in rows:
        if url not in seen:
            seen[url] = (domain, query)
    after_dedupe = len(seen)

    # filter
    dropped_social = 0
    dropped_ext = 0
    candidates: list[tuple[str, str]] = []
    for url, (domain, _q) in seen.items():
        if is_social(domain):
            dropped_social += 1
            continue
        if has_bad_ext(url):
            dropped_ext += 1
            continue
        candidates.append((url, domain))

    after_filter = len(candidates)

    # TLD breakdown
    tld_counts = Counter(tld_label(d) for _u, d in candidates)

    # top domains (registered domain, not subdomain)
    reg_domain_counts: Counter[str] = Counter()
    for _u, d in candidates:
        ext = tldextract.extract(d)
        reg = ".".join(p for p in (ext.domain, ext.suffix) if p)
        reg_domain_counts[reg] += 1

    # rows per query
    per_query = con.execute(
        "SELECT query, COUNT(*) FROM serp_results GROUP BY query ORDER BY 2 DESC"
    ).fetchall()

    print("=" * 60)
    print("PHASE 1 DEDUP + FILTER REPORT")
    print("=" * 60)
    print(f"\nQueries ingested ({len(per_query)}):")
    for q, n in per_query:
        print(f"  {n:4d}  {q}")

    print(f"\nRaw rows:          {total_raw}")
    print(f"After dedupe:      {after_dedupe}  (-{total_raw - after_dedupe})")
    print(f"Dropped social:    {dropped_social}")
    print(f"Dropped file-ext:  {dropped_ext}")
    print(f"Candidates:        {after_filter}")

    print("\nTLD breakdown:")
    for tld, n in tld_counts.most_common():
        print(f"  {n:4d}  {tld}")

    print(f"\nTop 20 registered domains:")
    for d, n in reg_domain_counts.most_common(20):
        print(f"  {n:4d}  {d}")

    con.close()


if __name__ == "__main__":
    main()
