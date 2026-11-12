#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PROJECT T: static-site calendar 404 and clock fallback repair (TEST ONLY).

Default: read-only --check. --apply writes separate candidate HTML files.
Never changes original pc.html/sp.html, game data, or main branch.
Run:
  python tools/repair_calendar_clock_20261110.py --self-test
  python tools/repair_calendar_clock_20261110.py --check pc.html sp.html
  python tools/repair_calendar_clock_20261110.py --apply pc.html sp.html
Generated candidates: PROJECT_T_PATCH_TEST/pc.html and sp.html.
Review in a local HTTP server and inspect Console before any deployment.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

# Each exact target appears once in the observed main-branch PC/SP source.
PATCHES = (
    ("clock_external_api",
     '''  const SRC = [
    { url: "https://worldtimeapi.org/api/timezone/Etc/UTC", pick: j => j && (j.utc_datetime || j.datetime) },
    { url: "https://timeapi.io/api/time/current/zone?timeZone=UTC", pick: j => j && j.dateTime }
  ];''',
     '''  // Skip the endpoint that failed in Chrome; retain clock sync via
  // timeapi.io and the original device-clock fallback.
  const SRC = [
    { url: "https://timeapi.io/api/time/current/zone?timeZone=UTC", pick: j => j && j.dateTime }
  ];'''),
    ("calendar_missing_api",
     "async function loadData(){\n const paths=['/api/v1/calendar/events','calendar-events.json'];",
     '''// The public GitHub Pages origin has neither calendar API nor JSON feed.
 // Only the opt-in localhost calendar companion (port 8766) serves these.
 // This variable must be outside loadData so refresh() can use it.
const localCalendarApi = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') && location.port === '8766';
async function loadData(){
 const paths = localCalendarApi ? ['/api/v1/calendar/events','calendar-events.json'] : [];'''),
    ("calendar_refresh_missing_api",
     '''async function refresh(){
 if(state.fetching)return;''',
     '''async function refresh(){
 if(!localCalendarApi){
   const msg=panel.querySelector('#ptcStatusMessage');
   if(msg)msg.textContent='公開サイトではカレンダーの自動更新は未接続です。内蔵・登録済みデータを表示しています。';
   return;
 }
 if(state.fetching)return;'''),
    ("calendar_status",
     "if(state.cacheSource==='embedded')return '内蔵初期データを表示中。自動更新にはローカル取得サーバーを起動してください。';",
     "if(state.cacheSource==='embedded')return '内蔵・登録済みデータを表示中。公開サイトの自動更新は未接続です。';"),
)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def patch_html(raw: bytes) -> bytes:
    """Fail closed on changed or ambiguous source anchors."""
    out = raw
    for label, before, after in PATCHES:
        b, a = before.encode("utf-8"), after.encode("utf-8")
        count = out.count(b)
        if count != 1:
            raise ValueError(f"{label}: expected exactly 1 anchor; found {count}")
        out = out.replace(b, a, 1)
    assert out.count(b"worldtimeapi.org") == 0
    return out


def self_test() -> None:
    sample = b"\n".join(before.encode("utf-8") for _, before, _ in PATCHES)
    fixed = patch_html(sample)
    for name, before, after in PATCHES:
        if after.encode("utf-8") not in fixed or before.encode("utf-8") in fixed:
            raise AssertionError(name)
    try:
        patch_html(fixed)
    except ValueError:
        pass  # Already-patched inputs must be rejected, not patched twice.
    else:
        raise AssertionError("second patch unexpectedly succeeded")
    print("PASS: four exact replacements, no accidental second apply")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("files", nargs="*", type=Path, help="PC/SP source HTML files")
    p.add_argument("--check", action="store_true", help="Verify patch anchors; do not write (default)")
    p.add_argument("--apply", action="store_true", help="Create separate patched candidates")
    p.add_argument("--self-test", action="store_true", help="Test patch rules without source HTML")
    args = p.parse_args()
    if args.apply and args.check:
        p.error("choose --apply or --check")
    if args.self_test:
        self_test()
        return
    paths = args.files or [Path("pc.html"), Path("sp.html")]
    for file in paths:
        if not file.is_file():
            raise SystemExit(f"Not found: {file}")
        original = file.read_bytes()
        fixed = patch_html(original)
        print(f"PASS: {file}, {len(PATCHES)} anchors, source SHA256={sha256(original)}, fixed SHA256={sha256(fixed)}")
        if args.apply:
            target_dir = file.parent / "PROJECT_T_PATCH_TEST"
            target_dir.mkdir(exist_ok=True)
            target = target_dir / file.name
            if target.exists():
                raise SystemExit(f"Refusing to overwrite: {target}")
            with target.open("xb") as dst:
                dst.write(fixed)
            print(f"CREATED TEST CANDIDATE: {target} ({len(fixed)} bytes)")
    print("Original files untouched. Production not modified.")


if __name__ == "__main__":
    main()
