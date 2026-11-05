#!/usr/bin/env python3
"""End-to-end local site with isolated API; output screenshots and persisted registry."""
import json,os,re,time
from pathlib import Path
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright

BASE="http://127.0.0.1:8000"
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get("PT_ICON_E2E_OUTPUT","/tmp/pt-icon-e2e"))
OUT.mkdir(parents=True,exist_ok=True)
def api(path, method="GET", body=None):
    raw=json.dumps(body,ensure_ascii=False).encode() if body is not None else None
    headers={"Content-Type":"application/json","X-CSRF-Token":"TEST-CSRF-ONLY"} if raw else {}
    with urlopen(Request(BASE+path,data=raw,headers=headers,method=method),timeout=15) as res:return json.loads(res.read())
fixture=json.loads((ROOT/"test-data/bryan-icon-candidates-v2.json").read_text())
assert len(fixture["moves"])==20
# No resets, no replacement. Real POSTs to isolated API; preexisting icons are merged.
for move in fixture["moves"]:
    before=api("/api/v1/move-icons")["characters"].get("bryan",{}).get(str(move["k"]),[])
    icons=list(dict.fromkeys(before+move["icons"]))
    assert len(icons)<=6
    api("/api/v1/admin/move-icons/set","POST",{"character_id":"bryan","site_k":move["k"],"move_name":move["name"],"icons":icons})
manifest=api("/api/v1/move-icons")
assert len(manifest["characters"]["bryan"])==20
assert sum(len(v) for v in manifest["characters"]["bryan"].values())==22

results={"api_writes":20,"api_rows":20,"assigned_icons":22,"browser":{}}
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    for kind,viewport in [("pc",{"width":1440,"height":900}),("sp",{"width":390,"height":844})]:
        page=browser.new_page(viewport=viewport,ignore_https_errors=True)
        page.goto(f"{BASE}/{kind}.html",wait_until="domcontentloaded",timeout=120000)
        page.wait_for_function("typeof window.PTIcons==='object' && Array.isArray(window.CHARACTERS)",timeout=120000)
        evidence=page.evaluate("""async () => {
          const c=window.CHARACTERS.find(x=>x.id==='bryan');
          if(!c) return {error:'Bryan not found'};
          const expected=await fetch('/api/v1/move-icons').then(r=>r.json());
          await window.PTIcons.reload();
          const successes=[],failures=[];
          for(const mv of c.moves){
            if(!Object.hasOwn(expected.characters.bryan,String(mv.k)))continue;
            const orig=expected.characters.bryan[String(mv.k)];
            const host=document.createElement('div');host.className='nm';host.style='position:relative;min-height:60px;margin:6px;padding:6px;';
            const nm=document.createElement('span');nm.textContent='k'+mv.k+' '+mv.name;
            const cmd=document.createElement('span');cmd.className='mcmd';cmd.textContent=(mv.a&&mv.a.command)||'';
            host.append(nm,cmd);document.body.appendChild(host);
            const tags=window.moveInfo(mv).tags.map(t=>t.id);
            window.PTIcons.attach(host,cmd,'bryan',mv,tags);
            const icons=Array.from(host.querySelectorAll('.pt-ic img')).map(img=>new URL(img.src).pathname.split('/').pop().replace('.webp',''));
            const missing=orig.filter(x=>!icons.includes(x));
            if(missing.length) failures.push({k:mv.k,name:mv.name,expected:orig,actual:icons});
            else successes.push({k:mv.k,name:mv.name,icons});
          }
          return {character_moves:c.moves.length,passed:successes.length,failed:failures,passes:successes};
        }""")
        page.screenshot(path=str(OUT/f"{kind}-full-site-icon-test.png"),full_page=False,timeout=120000)
        results["browser"][kind]=evidence
        print(kind, {k:v for k,v in evidence.items() if k!="passes"},flush=True)
        assert evidence.get("passed")==20 and not evidence.get("failed"),str(evidence)
        page.close()
    browser.close()
(OUT/"e2e-results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf8")
print("PASS",json.dumps({"pc":results["browser"]["pc"]["passed"],"sp":results["browser"]["sp"]["passed"]}))
