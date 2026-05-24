"""
Combined static + JSON API server for the dashboard.

  GET  /                          → 302 to /dashboard.html
  GET  /dashboard.html            → static file from ./output/
  GET  /api/state                 → JSON  {url: {status, notes, updated_at}}
  POST /api/state                 → body {url, status?, notes?} → upserts that row
  *                               → 404

State is persisted in SQLite (outreach_status table) so it survives browser
clears, machine moves, and re-running the pipeline.

Run: python serve.py [--port 8765]
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import secrets
import sqlite3
import sys
import threading
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HERE = Path(__file__).parent
DB_PATH = HERE / "data" / "prospects.db"
OUTPUT_DIR = HERE / "output"

_db_lock = threading.Lock()

# HTTP Basic auth — set CRM_PASSWORD env var (or --password flag).
# Username is always "seth". When empty, auth is disabled (localhost-only dev mode).
AUTH_USER = "seth"
AUTH_PASS = ""  # set in main()


def db() -> sqlite3.Connection:
    con = sqlite3.connect(DB_PATH, timeout=10.0)
    con.execute("PRAGMA journal_mode = WAL")
    return con


def get_all_state() -> dict[str, dict[str, Any]]:
    with _db_lock:
        con = db()
        try:
            rows = con.execute(
                "SELECT url, status, notes, updated_at FROM outreach_status"
            ).fetchall()
        finally:
            con.close()
    return {
        url: {"status": status or "", "notes": notes or "", "updated_at": updated_at}
        for url, status, notes, updated_at in rows
    }


def upsert_state(url: str, status: str | None, notes: str | None) -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    with _db_lock:
        con = db()
        try:
            existing = con.execute(
                "SELECT status, notes FROM outreach_status WHERE url = ?", (url,)
            ).fetchone()
            new_status = status if status is not None else (existing[0] if existing else "")
            new_notes = notes if notes is not None else (existing[1] if existing else "")
            con.execute(
                """INSERT INTO outreach_status (url, status, notes, updated_at)
                   VALUES (?, ?, ?, ?)
                   ON CONFLICT(url) DO UPDATE SET
                     status = excluded.status,
                     notes = excluded.notes,
                     updated_at = excluded.updated_at""",
                (url, new_status, new_notes, now),
            )
            con.commit()
        finally:
            con.close()
    return {"url": url, "status": new_status, "notes": new_notes, "updated_at": now}


class Handler(BaseHTTPRequestHandler):
    server_version = "FlagArcadeCRM/1.0"

    # quieter logs
    def log_message(self, fmt, *args):
        sys.stderr.write(f"{self.address_string()} - {fmt % args}\n")

    def _check_auth(self) -> bool:
        """Return True if request is authorized, else send 401 challenge and return False.
        Auth is skipped entirely when AUTH_PASS is empty (dev/loopback mode)."""
        if not AUTH_PASS:
            return True
        hdr = self.headers.get("Authorization") or ""
        if hdr.startswith("Basic "):
            try:
                raw = base64.b64decode(hdr[6:]).decode("utf-8", errors="replace")
                user, _, pw = raw.partition(":")
                if secrets.compare_digest(user, AUTH_USER) and secrets.compare_digest(pw, AUTH_PASS):
                    return True
            except (ValueError, UnicodeDecodeError):
                pass
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="FlagArcade CRM"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        body = b"unauthorized"
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
        return False

    def _send_json(self, code: int, body: Any) -> None:
        payload = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_text(self, code: int, body: str, content_type: str = "text/plain") -> None:
        data = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _send_file(self, path: Path, content_type: str) -> None:
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self) -> None:
        if not self._check_auth():
            return
        path = self.path.split("?", 1)[0]
        # Serve dashboard.html at both "/" and "/dashboard.html" so this works
        # transparently under a path-prefix rewrite (e.g. flagarcade.com/admin/).
        if path in ("/", "/dashboard.html"):
            file = OUTPUT_DIR / "dashboard.html"
            if not file.exists():
                self._send_text(404, "dashboard.html not generated yet — run phase5_dashboard.py")
                return
            self._send_file(file, "text/html")
            return
        if path == "/api/state":
            try:
                self._send_json(200, get_all_state())
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return
        self._send_text(404, "not found")

    def do_POST(self) -> None:
        if not self._check_auth():
            return
        path = self.path.split("?", 1)[0]
        if path != "/api/state":
            self._send_text(404, "not found")
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length > 0 else b""
            body = json.loads(raw or b"{}")
        except (ValueError, TypeError) as e:
            self._send_json(400, {"error": f"bad json: {e}"})
            return
        url = body.get("url")
        if not isinstance(url, str) or not url:
            self._send_json(400, {"error": "missing 'url'"})
            return
        status = body.get("status")
        notes = body.get("notes")
        if status is not None and not isinstance(status, str):
            self._send_json(400, {"error": "'status' must be string"})
            return
        if notes is not None and not isinstance(notes, str):
            self._send_json(400, {"error": "'notes' must be string"})
            return
        try:
            row = upsert_state(url, status, notes)
            self._send_json(200, row)
        except Exception as e:
            self._send_json(500, {"error": str(e)})


def main() -> int:
    global AUTH_PASS
    p = argparse.ArgumentParser()
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--host", default="127.0.0.1",
                   help="Use 0.0.0.0 to accept connections from other devices on your LAN or from a tunnel.")
    p.add_argument("--password", default=os.environ.get("CRM_PASSWORD", ""),
                   help="Basic-auth password. Defaults to $CRM_PASSWORD. Empty = no auth (only safe on 127.0.0.1).")
    args = p.parse_args()

    if not DB_PATH.exists():
        print(f"ERROR: db not found at {DB_PATH}. Run init_db.py first.", file=sys.stderr)
        return 2

    AUTH_PASS = args.password or ""
    if args.host != "127.0.0.1" and not AUTH_PASS:
        print("WARN: serving on non-loopback host without auth. Set --password or CRM_PASSWORD.", file=sys.stderr)

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    url = f"http://{args.host}:{args.port}/"
    print(f"FlagArcade CRM — serving on {url}")
    print(f"  dashboard: {url}dashboard.html")
    print(f"  api:       {url}api/state")
    print(f"  state db:  {DB_PATH}")
    print(f"  auth:      {'on (user=' + AUTH_USER + ')' if AUTH_PASS else 'off (loopback only — do NOT expose)'}")
    print("(Ctrl-C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nshutting down")
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
