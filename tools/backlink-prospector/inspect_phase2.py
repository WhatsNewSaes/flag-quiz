"""Quick summary + sample rows from the pages table after a phase2 run."""
import json
import sqlite3
from pathlib import Path

con = sqlite3.connect(Path(__file__).parent / "data" / "prospects.db")

# overall counts
total = con.execute("SELECT COUNT(*) FROM pages").fetchone()[0]
ok = con.execute("SELECT COUNT(*) FROM pages WHERE skip_reason IS NULL AND status=200").fetchone()[0]
skips = dict(con.execute("SELECT skip_reason, COUNT(*) FROM pages WHERE skip_reason IS NOT NULL GROUP BY skip_reason"))
with_comp = con.execute("SELECT COUNT(*) FROM pages WHERE has_competitor_links=1").fetchone()[0]
with_email = con.execute("SELECT COUNT(*) FROM pages WHERE contact_emails_json IS NOT NULL").fetchone()[0]

print(f"\n{'='*60}\nPHASE 2 SMOKE TEST SUMMARY ({total} rows in `pages`)\n{'='*60}")
print(f"successful (200, html)         : {ok}")
print(f"skipped                        : {sum(skips.values())} ({dict(skips)})")
print(f"with competitor links          : {with_comp}")
print(f"with at least 1 contact email  : {with_email}")

# link_status cache
ls_total = con.execute("SELECT COUNT(*) FROM link_status").fetchone()[0]
ls_ok = con.execute("SELECT COUNT(*) FROM link_status WHERE status BETWEEN 200 AND 399").fetchone()[0]
ls_4xx = con.execute("SELECT COUNT(*) FROM link_status WHERE status BETWEEN 400 AND 499").fetchone()[0]
ls_5xx = con.execute("SELECT COUNT(*) FROM link_status WHERE status BETWEEN 500 AND 599").fetchone()[0]
ls_err = con.execute("SELECT COUNT(*) FROM link_status WHERE status IS NULL").fetchone()[0]
print(f"\nlink_status cache              : {ls_total} URLs probed")
print(f"  2xx/3xx                      : {ls_ok}")
print(f"  4xx                          : {ls_4xx}")
print(f"  5xx                          : {ls_5xx}")
print(f"  network errors               : {ls_err}")

# top-5 sample rows
print(f"\n{'='*60}\n5 SAMPLE ANALYZED ROWS (highest topical_score first)\n{'='*60}")
rows = con.execute("""
    SELECT url, status, title, topical_score, outbound_count, broken_count,
           has_competitor_links, competitor_links_json, broken_links_json, contact_emails_json,
           last_modified
    FROM pages
    WHERE skip_reason IS NULL AND status = 200
    ORDER BY topical_score DESC, broken_count DESC
    LIMIT 5
""").fetchall()
for i, r in enumerate(rows, 1):
    (url, status, title, topical, outb, broken, has_comp, comp_j, brk_j, em_j, lm) = r
    print(f"\n[{i}] {url}")
    print(f"    title         : {title[:90] if title else '(none)'}")
    print(f"    status        : {status}")
    print(f"    last_modified : {lm or '(none)'}")
    print(f"    topical_score : {topical}")
    print(f"    outbound      : {outb}  (broken: {broken})")
    print(f"    has_competitor_links: {bool(has_comp)}")
    if comp_j:
        comp = json.loads(comp_j)
        print(f"    competitor_links ({len(comp)}): {comp[:3]}{' ...' if len(comp)>3 else ''}")
    if brk_j:
        brk = json.loads(brk_j)
        bad_competitor_paths = [b for b in brk if any(k in (b['url'] or '').lower() for k in ('flag','geography','quiz','country'))]
        if bad_competitor_paths:
            print(f"    broken-competitor-y URLs (potential pitch hooks):")
            for b in bad_competitor_paths[:3]:
                print(f"      - [{b.get('status')}] {b['url']}")
    if em_j:
        emails = json.loads(em_j)
        print(f"    contact_emails: {emails[:3]}")
con.close()
