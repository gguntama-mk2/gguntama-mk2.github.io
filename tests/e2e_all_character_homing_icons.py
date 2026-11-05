#!/usr/bin/env python3
"""Validate all 44-character site-derived homing icon candidates against the real PC and SP frontend.
DOES NOT TOUCH PRODUCTION: only local isolated localhost API and in-memory browser DOM.
"""
import json, os
from pathlib import Path
from urllib.request import Request,urlopen
from playwright.sync_api import sync_playwright

BASE="http://localhost:8000"
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get("PT_ICON_E2E_OUTPUT","/tmp/pt-icon-all-e2e"))
OUT.mkdir(parents=True,exist_ok=True)
CANDIDATES=Path(os.environ.get("PT_ICON_CANDIDATES","/tmp/pt-icon-all/ALL_CHARACTER_ICON_CANDIDATES.json"))
allrows=json.loads(CANDIDATES.read_text(encoding="utf8"))["candidates"]
rows=[r for r in allrows if r["evidence"]["homing_column"]]
assert len(rows)==545
assert len({(r["character_id"],r["site_k"]) for r in rows})==545
def api(path, method="GET", body=None):
    raw=json.dumps(body,ensure_ascii=False).encode() if body is not None else None
    headers={"Content-Type":"application/json","X-CSRF-Token":"TEST-CSRF-ONLY"} if raw else {}
    with urlopen(Request(BASE+path,data=raw,headers=headers,method=method),timeout=25) as r:return json.loads(r.read())

# Preserve existing local test data, including manually empty icon lists, and never use reset.
existing=api("/api/v1/move-icons")["characters"]
preserved_empty=[];written=[];protected=[]
for r in rows:
    char,k=r["character_id"],str(r["site_k"])
    previous=existing.get(char,{}).get(k)
    if previous==[]:
        preserved_empty.append((char,k));continue
    combined=list(dict.fromkeys((previous or []) + r["icons"]))
    if len(combined)>6:
        protected.append((char,k));continue
    api("/api/v1/admin/move-icons/set","POST",{"character_id":char,"site_k":int(k),"move_name":r["move_name"],"icons":combined})
    written.append((char,k))
assert len(written)+len(preserved_empty)+len(protected)==545
manifest=api("/api/v1/move-icons")["characters"]
for char,k in written:
    expected=next(r for r in rows if r["character_id"]==char and str(r["site_k"])==k)
    assert set(expected["icons"])<=set(manifest[char][k])
for char,k in preserved_empty:assert manifest[char][k]==[]
report={"source_candidates":len(allrows),"homing_candidates":len(rows),"writes":len(written),"preserved_explicit_empty":len(preserved_empty),"protected_max_icons":len(protected),"browsers":{}}

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--disable-dev-shm-usage"])
    for page_id,view in [("pc",{"width":1440,"height":900}),("sp",{"width":390,"height":844})]:
        page=browser.new_page(viewport=view,ignore_https_errors=True)
        page.goto(BASE+"/"+page_id+".html",wait_until="domcontentloaded",timeout=120000)
        page.wait_for_function("typeof CHARACTERS !== 'undefined' && CHARACTERS.length===44 && typeof window.PTIcons==='object'",timeout=120000)
        result=page.evaluate("""async (testRows) => {
          await window.PTIcons.reload();
          const current = window.CHARACTERS || CHARACTERS;
          const moves=new Map();
          for (const c of current)for(const m of c.moves)moves.set(c.id+'/'+m.k,{c,m});
          const misses=[],mismatches=[],images=[],bychar={};
          for (const r of testRows){
            const entry=moves.get(r.character_id+'/'+r.site_k);
            if(!entry){misses.push(r.character_id+'/'+r.site_k);continue}
            const {c,m}=entry;
            if (m.name.normalize('NFKC').replace(/\\s+/g,'')!==r.move_name.normalize('NFKC').replace(/\\s+/g,'')){
              mismatches.push({id:c.id+'/'+m.k,got:m.name,expected:r.move_name});continue
            }
            const host=document.createElement('div');host.className='nm';host.style='position:relative;height:34px;padding:2px';
            const name=document.createElement('span');name.textContent=m.name;
            const cmd=document.createElement('span');cmd.className='mcmd';cmd.textContent=(m.a&&m.a.command)||'';
            host.append(name,cmd);document.body.append(host);
            window.PTIcons.attach(host,cmd,c.id,m,window.moveInfo(m).tags.map(t=>t.id));
            const got=[...host.querySelectorAll('.pt-ic img')].map(x=>new URL(x.src).pathname.split('/').pop().replace('.webp',''));
            const failed=r.icons.filter(x=>!got.includes(x));
            if(failed.length)images.push({id:c.id+'/'+m.k,expected:r.icons,got});
            bychar[c.id]=(bychar[c.id]||0)+1;
            host.remove();
          }
          return {checked:Object.values(bychar).reduce((a,b)=>a+b,0),characters:Object.keys(bychar).length,misses,mismatches,incorrect_icons:images};
        }""",rows)
        if page_id=="pc":
            side_audit=page.evaluate("""() => {
              const out=[];
              for(const c of CHARACTERS)for(const m of c.moves){
                const cmd=String(m.a?.command||'');
                if(!/(?:側面|背後)から接近/.test(cmd))continue;
                const tags=window.moveInfo(m).tags.map(t=>t.id);
                out.push({char:c.id,k:m.k,name:m.name,command:cmd,
                  homing_value:m.a?.homing??null,off:m.off??null,t:m.t??null,tag_hm:tags.includes('hm')});
              }
              return out;
            }""")
            report["side_throw_audit"]={"count":len(side_audit),"tag_hm_count":sum(bool(r["tag_hm"]) for r in side_audit),
                "homing_value_count":sum(r["homing_value"]=="あり" for r in side_audit),
                "rows":side_audit}
            (OUT/"SIDE_THROW_HOMING_AUDIT.json").write_text(json.dumps(report["side_throw_audit"],ensure_ascii=False,indent=2))
            print("SIDE_THROW_AUDIT",json.dumps({k:v for k,v in report["side_throw_audit"].items() if k!="rows"}),flush=True)
        report["browsers"][page_id]=result
        print(page_id,json.dumps({k:(v if not isinstance(v,list) else v[:8]) for k,v in result.items()},ensure_ascii=False),flush=True)
        assert result["checked"]==545 and not result["misses"] and not result["mismatches"] and not result["incorrect_icons"],str(result)
        page.screenshot(path=str(OUT/f"all-characters-{page_id}-verification.png"),full_page=False)
        page.close()
    browser.close()
(OUT/"ALL_CHARACTER_E2E_RESULT.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("PASS ALL 44-CHARACTER ICON TEST:",report["browsers"]["pc"]["checked"],report["browsers"]["sp"]["checked"])
