#!/usr/bin/env python3
"""Phase12: read-only production delta audit and strictly asset-only staged ZIP.
No writes to GitHub main, GitHub Pages settings, DNS, accounts, or production APIs.
"""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
import subprocess
import zipfile

SITE=Path("phase11-pages-package/site")
OUT=Path("phase12-release-audit")
MAIN_SHA="5c947b5bca83d502d004539c50b54ceaaf9709a1"
CRITICAL=(
    ".nojekyll", "CNAME", "about.html", "admin-cloud-analysis.js",
    "admin-move-icons.js", "admin-move-media.js", "admin.html", "admin.js",
    "ads.txt", "apple-touch-icon.png", "checksheet-base.json",
    "combos-live.json", "favicon-32.png", "favicon.svg",
    "move-icons.js", "move-media.js", "privacy.html", "terms.html"
)
MUTABLE=("pc.html","sp.html","index.html")
def run(*args):
    return subprocess.check_output(list(args)).decode("utf-8").strip()
def sha(data: bytes):
    return hashlib.sha256(data).hexdigest()
def read_main(path):
    return subprocess.check_output(["git","show","origin/main:"+path])
def main_paths():
    return set(run("git","ls-tree","-r","--name-only","origin/main").splitlines())
def audit():
    OUT.mkdir(parents=True,exist_ok=True)
    errors=[]
    live=run("git","rev-parse","origin/main")
    if live!=MAIN_SHA: errors.append(f"main changed: expected {MAIN_SHA}, found {live}")
    assert SITE.exists(), "Run phase11 bundle builder first"
    sources=main_paths()
    files=sorted(p for p in SITE.rglob("*") if p.is_file())
    names={p.relative_to(SITE).as_posix() for p in files}
    expected_roots=set(CRITICAL)|set(MUTABLE)
    for path in sorted(expected_roots):
        p=SITE/path
        if not p.is_file():
            errors.append(f"missing protected root: {path}")
            continue
        if path in CRITICAL:
            if path not in sources: errors.append(f"not in original main: {path}")
            elif p.read_bytes()!=read_main(path): errors.append(f"protected original changed: {path}")
    unexpected_root=sorted(n for n in names if "/" not in n and n not in expected_roots)
    if unexpected_root: errors.append(f"unexpected new root entries: {unexpected_root}")
    # No preview guard, mock login, noindex, or test proxy in any candidate HTML.
    changed=[]
    for path in MUTABLE:
        if path not in names or path not in sources: errors.append("missing page: "+path);continue
        old=read_main(path);new=(SITE/path).read_bytes()
        if old!=new:changed.append({"path":path,"before_sha256":sha(old),"after_sha256":sha(new),"before_bytes":len(old),"after_bytes":len(new)})
    if {x["path"] for x in changed}!={"pc.html","sp.html","index.html"}:
        errors.append("page changes unexpectedly different from pc/sp/index")
    icons=sorted(p for p in names if p.startswith("icons/"))
    if len(icons)!=15:errors.append(f"icon count is {len(icons)}, expected 15")
    for path in icons:
        if path in sources and (SITE/path).read_bytes()!=read_main(path):
            errors.append("existing icon changed: "+path)
    new_assets=sorted(n for n in names if n.startswith("assets/"))
    for path in new_assets:
        if path in sources:errors.append("new asset collides with live main file: "+path)
    if len(list((SITE/"assets/data/characters").glob("*.json")))!=44:
        errors.append("44 character JSONs missing")
    all_other=sorted(n for n in names if n not in expected_roots and not n.startswith("assets/") and not n.startswith("icons/"))
    if all_other:errors.append("unexpected extra path groups: "+str(all_other[:12]))
    for page in ("pc","sp"):
        s=(SITE/(page+".html")).read_text("utf8")
        for forbidden in ("pt-preview-guard","move-media-preview.js","githubraw.com","raw.githubusercontent.com","noindex"):
            if forbidden in s:errors.append(page+" preview-only token found: "+forbidden)
        for required in ("window.PT_ASSET_VERSION", "move-media.js?v=", "move-icons.js?v=", page+"_route-loader.js?v="):
            if required not in s:errors.append(page+" missing required prod setup: "+required)
    if "www.project-t-god.com" not in (SITE/"CNAME").read_text():
        errors.append("CNAME target unexpectedly differs")
    # After an explicit authorization, all assets may be added to main in a
    # separate commit BEFORE any HTML substitution. Artifact alone does nothing.
    archive=OUT/"project-t-phase12-assets-only.zip"
    manifest=[]
    with zipfile.ZipFile(archive,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as zf:
        for name in new_assets:
            p=SITE/name
            data=p.read_bytes()
            manifest.append({"path":name,"sha256":sha(data),"bytes":len(data)})
            zf.write(p,arcname=name)
    info={
        "phase":12,"status":"pass" if not errors else "blocked",
        "main_sha":live,"expected_main_sha":MAIN_SHA,
        "readonly":True,"production_modified":False,
        "file_count":len(names),"added_asset_count":len(new_assets),
        "asset_bytes":sum(x["bytes"] for x in manifest),
        "asset_only_zip_bytes":archive.stat().st_size,
        "root_protected_file_count":len(CRITICAL),"icon_count":len(icons),
        "changed_pages":changed,
        "stage1_only_new_assets":True,
        "stage2_later_after_auth_video_tests":["pc.html","sp.html","index.html"],
        "rollback":"Restore pc/sp/index from main baseline in a new commit; never force push or clear localStorage",
        "checks":{
          "all_existing_admin_root_files_byte_identical":not any(e.startswith("protected original changed") for e in errors),
          "no_live_asset_overwrites":not any(e.startswith("new asset collides") for e in errors),
          "no_preview_bypass_code":not any("preview-only token" in e for e in errors),
          "main_unchanged_since_baseline":live==MAIN_SHA
        },
        "errors":errors,"assets":manifest
    }
    (OUT/"phase12-dry-run-report.json").write_text(json.dumps(info,indent=2,ensure_ascii=False)+"\n","utf8")
    print("PHASE12_STATIC",json.dumps({k:v for k,v in info.items() if k not in ("assets","changed_pages")},ensure_ascii=False))
    if errors:raise SystemExit("Phase12 blocked by "+str(len(errors))+" diff(s)")
if __name__=="__main__":audit()
