#!/usr/bin/env python3
"""PROJECT T Lite Phase14: read-only staged release safety gate.

Run from a checkout with fetched main and both release branches:
 python tools/pt_lite_phase14_release_guard.py \
   --baseline 5c947b5bca83d502d004539c50b54ceaaf9709a1

Exit 0 = safe *static diff shape*, NOT authorization to merge or proof of
live OAuth, video, admin or real GitHub Pages behavior.
"""
import argparse
import json
import subprocess
import sys

ASSETS_BRANCH = "release/pt-lite-assets-phase13"
HTML_BRANCH = "release/pt-lite-html-phase13"
HTML_FILES = {"pc.html": 15315, "sp.html": 17450}
HTML_DIFF = {"pc.html", "sp.html", "index.html"}
ASSET_COUNT = 439


def git(*args):
    return subprocess.check_output(["git", *args], text=True).strip()


def changes(base, head):
    result = git("diff", "--name-status", "--no-renames", base, head)
    entries = []
    for line in result.splitlines():
        fields = line.split("\t", 1)
        if len(fields) != 2:
            raise ValueError("Unexpected git diff output: " + line)
        entries.append(tuple(fields))
    return entries


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--baseline", required=True, help="Previously audited main SHA")
    p.add_argument("--main", default="origin/main")
    p.add_argument("--assets", default=ASSETS_BRANCH)
    p.add_argument("--html", default=HTML_BRANCH)
    a = p.parse_args()
    errors = []
    report = {"status": "BLOCKED", "live_service_verified": False,
              "production_changed": False, "checks": {}}
    try:
        main_sha = git("rev-parse", a.main)
        baseline_sha = git("rev-parse", a.baseline)
        report["main_sha"] = main_sha
        report["audited_baseline_sha"] = baseline_sha
        report["checks"]["baseline_unchanged"] = main_sha == baseline_sha
        if main_sha != baseline_sha:
            errors.append("main moved since original Phase13 audit; rebuild/re-audit both PRs")

        asset_diff = changes(a.baseline, a.assets)
        asset_ok = len(asset_diff) == ASSET_COUNT and all(
            s == "A" and path.startswith("assets/") for s, path in asset_diff)
        report["checks"]["assets_only_439_additions"] = asset_ok
        if not asset_ok:
            errors.append("assets branch diff is not exactly 439 added assets/** files")

        html_diff = changes(a.assets, a.html)
        html_ok = {path for _, path in html_diff} == HTML_DIFF and all(
            status == "M" for status, _ in html_diff)
        report["checks"]["html_only_three_changes"] = html_ok
        if not html_ok:
            errors.append("HTML branch differs beyond 3 expected modified HTML files")

        for name, expected in HTML_FILES.items():
            data = subprocess.check_output(["git", "show", f"{a.html}:{name}"])
            actual = len(data)
            report["checks"][name + "_bytes"] = actual
            if actual != expected:
                errors.append(f"{name} size changed: {actual} != {expected}; re-audit")

        # Deliberately no production mutation, OAuth requests or user-data reads.
    except (subprocess.CalledProcessError, OSError, ValueError) as exc:
        errors.append(f"git inspection failed: {exc}")
    report["errors"] = errors
    report["status"] = "STATIC_GATE_PASS" if not errors else "BLOCKED"
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
