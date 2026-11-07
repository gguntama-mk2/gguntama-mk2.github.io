#!/usr/bin/env python3
"""Stage13 read-only asset-vs-page review gate. Do not write to main."""
from pathlib import Path
import hashlib,json,re,subprocess
BASE="5c947b5bca83d502d004539c50b54ceaaf9709a1"
A="release/pt-lite-assets-phase13"
B="release/pt-lite-html-phase13"
SITE=Path("phase11-pages-package/site")
OUT=Path("phase13-staged-release")
PAGES=("pc.html","sp.html","index.html")
def cmd(*args):return subprocess.check_output(args,text=True).strip()
def listing(ref):
    result={}
    for line in cmd("git","ls-tree","-r",ref).splitlines():
        m=re.fullmatch(r"([0-7]{6}) (\w+) ([0-9a-f]{40})\t(.+)",line)
        if not m:raise AssertionError("Invalid git ls-tree entry")
        result[m[4]]=dict(sha=m[3],mode=m[1],type=m[2])
    return result
def git_sha(path):
    b=path.read_bytes()
    return hashlib.sha1(b"blob "+str(len(b)).encode()+b"\0"+b).hexdigest()
def sha256(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def main():
    OUT.mkdir(exist_ok=True)
    current=cmd("git","rev-parse","origin/main")
    ahead=cmd("git","rev-parse","origin/"+A)
    bhead=cmd("git","rev-parse","origin/"+B)
    originals=listing("origin/main")
    added=listing("origin/"+A)
    additions=sorted(set(added)-set(originals))
    deletions=sorted(set(originals)-set(added))
    changed=sorted(k for k in originals.keys()&added.keys() if originals[k]["sha"]!=added[k]["sha"])
    problems=[]
    if current!=BASE:problems.append("main moved from frozen baseline")
    if ahead!=bhead:problems.append("HTML branch was changed before gate")
    if len(additions)!=439:problems.append(f"expected 439 new assets; got {len(additions)}")
    if deletions:problems.append("deletions from original: "+str(deletions[:10]))
    if changed:problems.append("overwrites of original: "+str(changed[:10]))
    if any(not f.startswith("assets/") for f in additions):problems.append("new assets not confined to assets/")
    if any(x in f for f in additions for x in ("pt-preview-guard","pt-move-media-preview")):
        problems.append("preview module in production asset set")
    wrong=[]
    for filename in additions:
        f=SITE/filename
        if not f.exists() or git_sha(f)!=added[filename]["sha"]:wrong.append(filename)
    if wrong:problems.append("asset content mismatch: "+str(wrong[:6]))
    pages={}
    for name in PAGES:
        f=SITE/name
        pages[name]={"bytes":f.stat().st_size,"sha256":sha256(f),"git_sha":git_sha(f)}
        if name=="index.html":continue
        s=f.read_text("utf-8")
        if f.stat().st_size>=100000:problems.append("Oversized new HTML "+name)
        if any(t not in s for t in ("window.PT_ASSET_VERSION","?v=","move-media.js?v=","move-icons.js?v=")):
            problems.append("Missing version or real API module "+name)
        if any(t in s for t in ("pt-preview-guard","move-media-preview.js","noindex","githubraw.com")):
            problems.append("Preview restriction in candidate "+name)
    protected=("CNAME",".nojekyll","admin.html","admin.js","admin-move-media.js",
        "admin-move-icons.js","move-icons.js","move-media.js","combos-live.json",
        "ads.txt","checksheet-base.json","privacy.html","terms.html")
    for k in protected:
        if originals.get(k)!=added.get(k):problems.append("Protected root changed: "+k)
        if not (SITE/k).exists():problems.append("Missing candidate root: "+k)
    result={
      "phase":13,"passed":not problems,"prod_main":current,"baseline":BASE,
      "assets_branch":A,"assets_head":ahead,"html_branch":B,"html_initial_head":bhead,
      "added_asset_count":len(additions),"added_asset_bytes":sum((SITE/f).stat().st_size for f in additions if (SITE/f).is_file()),
      "no_overwrites":not changed and not deletions,"asset_package_byte_exact":not wrong,
      "future_html_changes":pages,"originals_modified":changed,"originals_deleted":deletions,
      "preview_only_assets_excluded":not any("preview module" in p for p in problems),
      "readonly":True,"production_changed":False,"live_login_and_upload_not_tested":True,
      "rollout":["Review two draft PRs separately","Explicit approval required before any merge",
        "Merge assets-only PR and check HTTPS/MIME/404 on the current production domain",
        "Test actual OAuth, video media and admin only with authorized test accounts",
        "Merge pc/sp/index HTML PR only after an additional explicit approval",
        "Rollback by restoring old HTML in a new commit; never reset main or delete localStorage"],
      "errors":problems
    }
    (OUT/"phase13-preflight.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n","utf-8")
    print("PHASE13_PREFLIGHT",json.dumps({k:v for k,v in result.items() if k not in ("rollout",)},ensure_ascii=False))
    if problems:raise SystemExit("Stage13 preflight blocked")
if __name__=="__main__":main()
