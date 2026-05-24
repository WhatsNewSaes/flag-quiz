"""
Phase 4: write CSV + Markdown deliverables from the prospects table.

Outputs (under ./output/):
  prospects_tier1.csv  — Tier 1 only, sorted by score desc
  prospects_all.csv    — full ranked list (Tier 1+2+3)
  summary.md           — counts by tier, top 20 with one-line pitches, top 5
                         domains with multiple prospects, and 5 suggested new
                         seed queries based on patterns in the high-scoring set
"""
from __future__ import annotations

import csv
import json
import re
import sqlite3
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse

import tldextract

HERE = Path(__file__).parent
DB_PATH = HERE / "data" / "prospects.db"
OUT_DIR = HERE / "output"
OUT_DIR.mkdir(parents=True, exist_ok=True)

COLUMNS = [
    "tier", "score", "url", "domain", "contact_email", "pitch_hook",
    "last_modified", "topical_score", "outbound_count", "broken_count",
    "has_competitor_links", "title",
]


def _row_for_csv(row: dict) -> dict:
    sig = json.loads(row["signals_json"]) if row.get("signals_json") else {}
    return {
        "tier": row["tier"],
        "score": row["score"],
        "url": row["url"],
        "domain": sig.get("domain") or "",
        "contact_email": row.get("contact_email") or "",
        "pitch_hook": row.get("pitch_hook") or "",
        "last_modified": sig.get("last_modified_parsed") or "",
        "topical_score": sig.get("topical_score") or 0,
        "outbound_count": sig.get("outbound_count") or 0,
        "broken_count": sig.get("broken_count") or 0,
        "has_competitor_links": int(bool(sig.get("has_competitor_links"))),
        "title": (sig.get("title") or "")[:160],
    }


def _registered(domain: str) -> str:
    ext = tldextract.extract(domain)
    return ".".join(p for p in (ext.domain, ext.suffix) if p)


def main() -> int:
    con = sqlite3.connect(DB_PATH)
    rows = con.execute(
        """SELECT url, tier, score, contact_email, pitch_hook, signals_json, created_at
           FROM prospects ORDER BY score DESC, tier ASC, url ASC"""
    ).fetchall()
    cols = [c[0] for c in con.execute("SELECT * FROM prospects LIMIT 0").description]
    prospects = [dict(zip(cols, r)) for r in rows]

    # ── tier 1 csv ──
    tier1 = [p for p in prospects if p["tier"] == 1]
    with (OUT_DIR / "prospects_tier1.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        for p in tier1:
            w.writerow(_row_for_csv(p))

    # ── all prospects csv ──
    with (OUT_DIR / "prospects_all.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        for p in prospects:
            w.writerow(_row_for_csv(p))

    # ── summary.md ──
    counts = Counter(p["tier"] for p in prospects)
    domain_counts: Counter[str] = Counter()
    for p in prospects:
        sig = json.loads(p["signals_json"]) if p["signals_json"] else {}
        d = sig.get("domain") or (urlparse(p["url"]).hostname or "")
        domain_counts[_registered(d)] += 1
    multi_domains = [(d, n) for d, n in domain_counts.most_common() if n >= 2][:5]

    # Top 20 prospects
    top20 = prospects[:20]

    # Suggest 5 new queries based on signals in top-scoring set
    suggestions: list[str] = []
    high_score = [p for p in prospects if p["score"] >= 60]
    high_domains = Counter()
    high_paths_with_libguides = 0
    high_paths_with_research = 0
    high_paths_with_links = 0
    high_paths_with_resources_lists = 0
    for p in high_score:
        sig = json.loads(p["signals_json"]) if p["signals_json"] else {}
        d = sig.get("domain") or ""
        high_domains[_registered(d)] += 1
        path = (urlparse(p["url"]).path or "").lower()
        if "libguides" in path or "libguides" in d:
            high_paths_with_libguides += 1
        if "research" in path:
            high_paths_with_research += 1
        if path.endswith("/links") or "/links" in path:
            high_paths_with_links += 1
        if "/resources" in path:
            high_paths_with_resources_lists += 1

    if high_paths_with_libguides >= 2:
        suggestions.append('site:.edu inurl:libguides geography')
    if high_paths_with_research >= 2:
        suggestions.append('site:.edu "research guide" geography')
    if high_paths_with_links >= 2:
        suggestions.append('site:.edu "for kids" geography links')
    if any(d.endswith(".k12.ga.us") for d in high_domains):
        suggestions.append('site:.k12.ga.us geography resources')
    suggestions.append('site:.edu "AP Human Geography" "classroom resources"')
    suggestions.append('"geography games" "for students" -site:pinterest.com')
    suggestions = suggestions[:5]

    lines: list[str] = []
    lines.append("# FlagArcade Backlink Prospects — Phase 4 Summary\n")
    lines.append(f"_Generated from {len(prospects)} scored pages._\n")
    lines.append("## Tier counts\n")
    lines.append(f"- **Tier 1** (score ≥ 60 *and* has contact email): **{counts.get(1, 0)}**")
    lines.append(f"- **Tier 2** (score 40–59, or 60+ without contact): **{counts.get(2, 0)}**")
    lines.append(f"- **Tier 3** (score 20–39): **{counts.get(3, 0)}**\n")

    lines.append("## Top 20 prospects (by score)\n")
    lines.append("| # | Tier | Score | URL | Pitch |")
    lines.append("|---|------|-------|-----|-------|")
    for i, p in enumerate(top20, 1):
        pitch = (p.get("pitch_hook") or "").replace("|", "\\|")
        if len(pitch) > 110:
            pitch = pitch[:107] + "…"
        url_display = p["url"]
        if len(url_display) > 80:
            url_display = url_display[:77] + "…"
        lines.append(f"| {i} | T{p['tier']} | {p['score']} | `{url_display}` | {pitch} |")
    lines.append("")

    if multi_domains:
        lines.append("## Domains with multiple prospect pages\n")
        for d, n in multi_domains:
            lines.append(f"- **{d}**: {n} prospect pages")
        lines.append("")

    lines.append("## Suggested new seed queries (for the next Phase-1 run)\n")
    for q in suggestions:
        lines.append(f"- `{q}`")
    lines.append("")

    # Quick stats on contact emails
    with_contact = sum(1 for p in prospects if p.get("contact_email"))
    lines.append("## Notes\n")
    lines.append(f"- {with_contact} of {len(prospects)} prospects have a usable contact email.")
    lines.append(f"- {sum(1 for p in prospects if (json.loads(p['signals_json']) or {}).get('broken_competitor_or_topical'))} prospects have a broken-link pitch hook (competitor or topical-path).")
    lines.append("- See `prospects_tier1.csv` for the priority outreach list and `prospects_all.csv` for the full ranked dataset.")

    (OUT_DIR / "summary.md").write_text("\n".join(lines), encoding="utf-8")

    print(f"Wrote {len(tier1)} rows to {OUT_DIR / 'prospects_tier1.csv'}")
    print(f"Wrote {len(prospects)} rows to {OUT_DIR / 'prospects_all.csv'}")
    print(f"Wrote summary to {OUT_DIR / 'summary.md'}")
    con.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
