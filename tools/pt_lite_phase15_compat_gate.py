#!/usr/bin/env python3
"""PROJECT T Phase15: read-only exact-tree integration audit.

Compares current main, original audited main, two staged Phase13 branches, and
this isolated integration branch. Never writes to GitHub or contacts services.
A PASS verifies only static compatibility, NOT live OAuth/media/admin behavior.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

BASELINE="5c947b5bca83d502d004539c50b54ceaaf9709a1"
CURRENT_MAIN="d02ee3cdf801b32a5f25f98a66a72363e07157e1"
ASSET_HEAD="2b1caf53a9d58bc178ad02126310496fb1aa8e27"
HTML_HEAD="01c9b5a172836bbb6acca1e2153de7e0fe10f0d3"
MAIN_REF="origin/main"
ASSETS_REF="origin/release/pt-lite-assets-phase13"
HTML_REF="origin/release/pt-lite-html-phase13"
PAGES={"index.html", "pc.html", "sp.html"}
MAIN_CHANGES={
    ".github/workflows/admin-tekken-id-js-check.yml",
    "admin.html", "admin.js", "tests/admin-mobile-layout.cjs",
}
EXTRA={
    "tools/pt_lite_phase11_pages_smoke.mjs",
    "tools/pt_lite_phase12_api_mock_smoke.mjs",
    "tools/pt_lite_phase15_compat_gate.py",
    ".github/workflows/pt-lite-phase15-compat.yml",
}
EXPECTED_BYTES={"pc.html":15315,"sp.html":17450}
EXPECTED_ASSET_BYTES=40355986

def run(*args,inp=None):
    r=subprocess.run(args,input=inp,stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
    return r.stdout

def git(*args):
    return run("git",*args)

def rev(ref):
    return git("rev-parse",ref).decode().strip()

def tree(ref):
    output={}
    for entry in git("ls-tree","-rz",ref).split(b"\0"):
        if not entry:
            continue
        meta,name=entry.split(b"\t",1)
        mode,typ,sha=meta.decode().split()
        if typ!="blob":
            raise ValueError(f"Unexpected tree entry {typ} at {name!r}")
        output[name.decode()]=(mode,sha)
    return output

def diff(base,head):
    out={}
    for line in git("diff","--no-renames","--name-status",base,head).decode().splitlines():
        status,path=line.split("\t",1)
        out[path]=status
    return out

def fail(condition,message,errors):
    if not condition:
        errors.append(message)

def blob_bytes(ref,name):
    return len(git("show",f"{ref}:{name}"))

def main():
    report={"phase":15,"mode":"isolated-test-only","passed":False,
            "production_changed":False,"production_data_touched":False,
            "live_oauth_media_admin_verified":False,
            "checks":{},"errors":[]}
    checks=report["checks"];errors=report["errors"]
    try:
        refs={"baseline":BASELINE,"main":MAIN_REF,"assets":ASSETS_REF,"html":HTML_REF,"integration":"HEAD"}
        heads={key:rev(value) for key,value in refs.items()}
        report["heads"]=heads
        fail(heads["main"]==CURRENT_MAIN,"main moved again: stop and re-audit",errors)
        fail(heads["assets"]==ASSET_HEAD,"asset branch changed: stop",errors)
        fail(heads["html"]==HTML_HEAD,"HTML branch changed: stop",errors)

        trees={key:tree(value) for key,value in refs.items()}
        baseline,main_t,asset_t,html_t,integrated=(trees[k] for k in ("baseline","main","assets","html","integration"))
        diff_main=diff(BASELINE,MAIN_REF)
        diff_asset=diff(BASELINE,ASSETS_REF)
        diff_html=diff(ASSETS_REF,HTML_REF)
        checks["main_four_admin_changes"]=(set(diff_main)==MAIN_CHANGES
            and {p:diff_main[p] for p in MAIN_CHANGES}=={
                "admin.html":"M","admin.js":"M",
                "tests/admin-mobile-layout.cjs":"A",
                ".github/workflows/admin-tekken-id-js-check.yml":"A"})
        fail(checks["main_four_admin_changes"],"main changes differ from audited four admin paths",errors)
        additions={p for p,s in diff_asset.items() if s=="A"}
        checks["stage1_only_439_assets"]=(len(diff_asset)==439
            and len(additions)==439 and all(p.startswith("assets/") for p in additions))
        fail(checks["stage1_only_439_assets"],"Stage1 must add exactly 439 assets/** files",errors)
        checks["stage2_only_three_html"]=(set(diff_html)==PAGES and
            all(status=="M" for status in diff_html.values()))
        fail(checks["stage2_only_three_html"],"Stage2 must modify only index/pc/sp",errors)
        checks["staged_assets_unmodified"]=all(html_t.get(p)==asset_t.get(p) for p in additions)
        fail(checks["staged_assets_unmodified"],"Stage2 assets differ from Stage1",errors)
        sizes={name:blob_bytes(HTML_REF,name) for name in EXPECTED_BYTES}
        checks["lite_html_bytes"]=sizes
        fail(sizes==EXPECTED_BYTES,"Light HTML bytes changed; fresh size review required",errors)

        # Expected integration must equal *current main* with exactly the
        # staged static assets + three HTML replacements, plus test-only files.
        expected=dict(main_t)
        for p in additions:
            expected[p]=asset_t[p]
        for p in PAGES:
            expected[p]=html_t[p]
        for p in EXTRA:
            fail(p not in main_t and p in integrated, "missing or colliding test helper: "+p,errors)
            if p in integrated:
                expected[p]=integrated[p]
        missing=sorted(set(expected)-set(integrated))
        unexpected=sorted(set(integrated)-set(expected))
        modified=sorted(p for p in expected.keys() & integrated.keys()
                        if expected[p]!=integrated[p])
        checks["integration_exact_expected_tree"]=not(missing or unexpected or modified)
        checks["missing"]=missing[:15]
        checks["unexpected"]=unexpected[:15]
        checks["modified"]=modified[:15]
        fail(checks["integration_exact_expected_tree"],
             f"Integrated tree differs: missing={missing[:5]}, unexpected={unexpected[:5]}, changed={modified[:5]}",errors)
        checks["current_admin_blobs_exact"]=all(integrated.get(p)==main_t.get(p) for p in MAIN_CHANGES)
        fail(checks["current_admin_blobs_exact"],"Main admin changes were not carried byte-exactly",errors)
        for page in ("pc.html","sp.html"):
            html=git("show",f"HEAD:{page}").decode("utf-8")
            required=["window.PT_ASSET_VERSION","?v=","move-media.js?v=","move-icons.js?v="]
            fail(all(tag in html for tag in required),f"{page}: missing versioned production modules",errors)
            fail(not any(tag in html for tag in ("noindex","pt-preview-guard","move-media-preview","githubraw.com")),
                 f"{page}: preview-only or proxy dependency",errors)
        checks["preview_guard_excluded"]=not any("pt-preview-guard" in p or "pt-move-media-preview" in p for p in additions)
        fail(checks["preview_guard_excluded"],"Preview module found in staged asset paths",errors)

        # cat-file size calculation reads git object metadata only.
        if len(additions)==439:
            refs_bytes=("\n".join(asset_t[p][1] for p in sorted(additions))+"\n").encode()
            sizes_out=git("cat-file","--batch-check=%(objectsize)") if False else run(
                "git","cat-file","--batch-check=%(objectsize)",inp=refs_bytes)
            size_total=sum(int(x) for x in sizes_out.decode().splitlines())
            checks["asset_bytes"]=size_total
            fail(size_total==EXPECTED_ASSET_BYTES,
                 f"asset bytes differ: {size_total} vs {EXPECTED_ASSET_BYTES}",errors)
    except Exception as exc:
        errors.append("Audit could not complete: "+str(exc))
    report["passed"]=not errors
    Path("phase15-release-audit").mkdir(exist_ok=True)
    Path("phase15-release-audit/phase15-integrated.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("PHASE15_STATIC_AUDIT",json.dumps(report,ensure_ascii=False))
    return 0 if report["passed"] else 1

if __name__=="__main__":
    sys.exit(main())
