#!/usr/bin/env python3
"""PROJECT T: produce non-production PC/SP calendar + clock preview copies.

Refuses unknown revisions, changes only explicit anchors, and NEVER overwrites the source.
"""
import argparse
import hashlib
import json
from pathlib import Path

EXPECTED_BLOBS = {
    "pc.html": "2419e9d297f5ef9b0e3be53770745a6d43859590",
    "sp.html": "390291835095bd79c2e5daf0d4faa5f72b0bf3c1",
}

CLOCK_OLD = "const SRC = [\n    { url: \"https://worldtimeapi.org/api/timezone/Etc/UTC\", pick: j => j && (j.utc_datetime || j.datetime) },\n    { url: \"https://timeapi.io/api/time/current/zone?timeZone=UTC\", pick: j => j && j.dateTime }\n  ];"
CLOCK_NEW = "const SRC = [\n    // Same-origin CDN/server Date header; no third-party time service required.\n    { url: location.origin + \"/favicon.svg\", kind: \"http-date\" }\n  ];"
FETCH_OLD = "const r = await fetch(src.url, { cache: \"no-store\", mode: \"cors\", credentials: \"omit\", referrerPolicy: \"no-referrer\", signal: ac ? ac.signal : undefined });"
FETCH_NEW = "const r = await fetch(src.url, { method: \"HEAD\", cache: \"no-store\", mode: \"same-origin\", credentials: \"omit\", signal: ac ? ac.signal : undefined });"
PARSE_OLD = "const j = await r.json(), t1 = Date.now();\n      const srv = isoUtc(src.pick(j));\n      if (!isFinite(srv)) throw new Error(\"bad time\");"
PARSE_NEW = "const t1 = Date.now();\n      const srv = Date.parse(r.headers.get(\"Date\") || \"\");\n      if (!Number.isFinite(srv)) throw new Error(\"missing/invalid server Date header\");"
CAL_OLD = "const paths=['/api/v1/calendar/events','calendar-events.json'];"
CAL_NEW = "const paths=(typeof window.PT_CALENDAR_API_URL==='string' && window.PT_CALENDAR_API_URL.trim())\n    ? [window.PT_CALENDAR_API_URL.trim(),'calendar-events.json'] : ['calendar-events.json'];"


def git_blob_sha(data: bytes) -> str:
    header = b"blob " + str(len(data)).encode("ascii") + b"\\0"
    return hashlib.sha1(header + data).hexdigest()


def replace_once(src: str, old: str, new: str, label: str) -> str:
    found = src.count(old)
    if found != 1:
        raise ValueError(f"{label}: expected one anchor, found {found}; no files written")
    return src.replace(old, new, 1)


def patch_html(src: str) -> str:
    for label, old, new in (
        ("clock source", CLOCK_OLD, CLOCK_NEW),
        ("clock request", FETCH_OLD, FETCH_NEW),
        ("clock parse", PARSE_OLD, PARSE_NEW),
        ("calendar feed", CAL_OLD, CAL_NEW),
    ):
        src = replace_once(src, old, new, label)
    return src


def extract_seed(src: str) -> dict:
    token = "const SEED0="
    start = src.find(token)
    if start < 0:
        raise ValueError("SEED0 not found")
    start += len(token)
    end = src.find(";\\nconst seedFrom", start)
    if end < 0:
        raise ValueError("SEED0 terminator not found")
    seed = json.loads(src[start:end])
    if not isinstance(seed.get("events"), list) or len(seed["events"]) != 21:
        raise ValueError("unexpected calendar event count")
    return seed


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--repo", type=Path, default=Path.cwd())
    ap.add_argument("--out", type=Path, default=Path.cwd().parent / "PROJECT_T_CALENDAR_CLOCK_PREVIEW")
    args = ap.parse_args()
    root, out = args.repo.resolve(), args.out.resolve()
    if out.exists():
        raise SystemExit(f"Refusing existing output: {out}")
    prepared = {}
    seeds = []
    for name, expected in EXPECTED_BLOBS.items():
        raw = (root / name).read_bytes()
        actual = git_blob_sha(raw)
        if actual != expected:
            raise SystemExit(f"{name}: source Git blob changed ({actual}); REFUSING patch")
        original = raw.decode("utf-8")
        patched = patch_html(original).encode("utf-8")
        prepared[name] = patched
        seeds.append(extract_seed(original))
    if seeds[0] != seeds[1]:
        raise SystemExit("PC/SP seed differs; REFUSING patch")
    prepared["calendar-events.json"] = (json.dumps(seeds[0], ensure_ascii=False, indent=2) + "\\n").encode("utf-8")
    out.mkdir(parents=True)
    for name, content in prepared.items():
        (out / name).write_bytes(content)
    manifest = {
        "source_git_blobs": EXPECTED_BLOBS,
        "preview_sha256": {n: hashlib.sha256(d).hexdigest() for n, d in prepared.items()},
        "calendar_events": len(seeds[0]["events"]),
        "original_files_modified": False,
        "production_modified": False,
        "note": "Static embedded seed: NOT an automatic live calendar feed.",
    }
    (out / "PREVIEW_MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\\n", encoding="utf-8")
    print(f"PASS: preview created in {out}; 21 events; original files unchanged")


if __name__ == "__main__":
    main()
