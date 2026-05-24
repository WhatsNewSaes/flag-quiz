"""
Convert auto-persisted MCP tool-result files into envelope JSON files that
phase1_ingest.py can read.

Persisted files have shape:  [{"type": "text", "text": "<json-string>"}]
The <json-string> decodes to the actual MCP SERP response: {id, status_code, items: [...]}.

Usage: python convert_persisted.py <persisted-file> <keyword> <output-envelope>
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 4:
        print("usage: convert_persisted.py <persisted-file> <keyword> <output-envelope>", file=sys.stderr)
        return 2
    src = Path(sys.argv[1])
    keyword = sys.argv[2]
    dst = Path(sys.argv[3])

    raw = json.loads(src.read_text(encoding="utf-8"))
    # outer wrapper is a list of {type, text} blocks; concatenate text and parse
    text = "".join(block.get("text", "") for block in raw if isinstance(block, dict))
    response = json.loads(text)

    organic = [it for it in response.get("items", []) if it.get("type") == "organic"]
    envelope = {
        "keyword": keyword,
        "max_crawl_pages": 7,
        "depth": 100,
        "response": {
            "id": response.get("id"),
            "status_code": response.get("status_code"),
            "items": organic,  # organic-only, related_searches dropped
        },
    }
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(json.dumps(envelope, ensure_ascii=False, indent=None), encoding="utf-8")
    print(f"wrote {dst.name}: keyword={keyword!r}, organic={len(organic)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
