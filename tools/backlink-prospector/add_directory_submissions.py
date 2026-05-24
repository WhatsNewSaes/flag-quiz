"""
Insert manually-submitted directory listings into the prospects table.

These aren't Phase-1 SERP discoveries — they're directories the user submitted
to directly. We give them high scores so they sort to the top and a
`default_status: "emailed"` hint so the dashboard auto-places them in the
Emailed column on first load (existing localStorage state is never overwritten).

Run: python add_directory_submissions.py
"""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "prospects.db"
SUBMITTED_DATE = "2026-05-22"  # update if you submit on a different day

SUBMISSIONS = [
    {
        "url": "https://www.commonsense.org/education",
        "title": "Common Sense Education",
        "domain": "commonsense.org",
        "tier": 1,
        "score": 100,
        "pitch_hook": (
            "DIRECTORY SUBMISSION — Common Sense Education. Gold standard educational "
            "review site. Editorially reviewed, teachers actually use it. High DA, real "
            "referral traffic. Takes weeks to review but worth it."
        ),
    },
    {
        "url": "https://oercommons.org",
        "title": "OER Commons",
        "domain": "oercommons.org",
        "tier": 1,
        "score": 95,
        "pitch_hook": (
            "DIRECTORY SUBMISSION — OER Commons. Open Educational Resources directory. "
            "Submission goes through review. Strong .org authority."
        ),
    },
    {
        "url": "https://www.merlot.org",
        "title": "MERLOT — Multimedia Educational Resource for Learning and Online Teaching",
        "domain": "merlot.org",
        "tier": 1,
        "score": 90,
        "pitch_hook": (
            "DIRECTORY SUBMISSION — MERLOT. Peer-reviewed OER from the California State "
            "University system. Slower process but yields a .edu-adjacent link."
        ),
    },
    {
        "url": "https://www.teachersfirst.com",
        "title": "TeachersFirst",
        "domain": "teachersfirst.com",
        "tier": 2,
        "score": 85,
        "pitch_hook": (
            "DIRECTORY SUBMISSION — TeachersFirst. Submit-a-resource form, geography "
            "category, editorial review."
        ),
    },
    {
        "url": "https://www.internet4classrooms.com",
        "title": "Internet4Classrooms",
        "domain": "internet4classrooms.com",
        "tier": 2,
        "score": 75,
        "pitch_hook": (
            "DIRECTORY SUBMISSION — Internet4Classrooms. Teacher resource directory "
            "with a geography section."
        ),
    },
]


def main() -> int:
    con = sqlite3.connect(DB_PATH)
    now = datetime.now(timezone.utc).isoformat()
    inserted = 0
    for s in SUBMISSIONS:
        signals = {
            "domain": s["domain"],
            "title": s["title"],
            "topical_score": 50,           # max — these are 100% topical
            "outbound_count": 0,
            "broken_count": 0,
            "has_competitor_links": False,
            "broken_competitor_or_topical": False,
            "edu_like": False,
            "homeschool_like": False,
            "email_count": 0,
            "last_modified": None,
            "negative_url_pattern": False,
            # ── special hints the dashboard understands for directory submissions ──
            "default_status": "emailed",
            "default_notes": f"Submitted {SUBMITTED_DATE}.",
            "submission_type": "directory",
        }
        con.execute(
            """INSERT OR REPLACE INTO prospects
               (url, tier, score, contact_email, pitch_hook, signals_json, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                s["url"],
                s["tier"],
                s["score"],
                None,                      # no personal contact email for directory forms
                s["pitch_hook"],
                json.dumps(signals),
                now,
            ),
        )
        inserted += 1
    con.commit()
    con.close()
    print(f"Added {inserted} directory submissions to prospects (submitted {SUBMITTED_DATE})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
