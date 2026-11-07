#!/usr/bin/env python3
"""Phase 5: defer sheet-specific data and hidden PC portrait thumbnails on home.
Only generated test-litev1 assets are touched. No browser save keys change.
"""
from pathlib import Path
import json
BASE=Path("test-litev1/assets")
JS=BASE/"js"
report={"schema":5,"mode":"test-only","devices":{}}
for device in ("pc","sp"):
    src=JS/(device+"_04.js")
    data=src.read_text("utf-8")
    old_size=src.stat().st_size
    if device=="pc":
        old="function renderTable() {\n  const c = CHARACTERS.find(x => x.id === current);"
        new="function renderTable() {\n  if(document.documentElement.dataset.page==='home')return;\n  const c = CHARACTERS.find(x => x.id === current);"
        if data.count(old)!=1:raise ValueError("PC render anchor mismatch")
        data=data.replace(old,new,1)
        old='im.src = c.img; im.alt = ""; im.loading = "lazy";'
        new='im.alt = ""; im.loading = "lazy"; if(document.documentElement.dataset.page==="home") im.dataset.ptSrc=c.img; else im.src=c.img;'
        if data.count(old)!=1:raise ValueError("PC thumbnail anchor mismatch")
        data=data.replace(old,new,1)
    else:
        old="function buildMoves() {\n  C = CHARACTERS.find(x => x.id === current);"
        new='function buildMoves() {\n  C = CHARACTERS.find(x => x.id === current);\n  if(document.documentElement.dataset.page==="home"){M=[];prog={done:0,total:0};return;}'
        if data.count(old)!=1:raise ValueError("SP moves anchor mismatch")
        data=data.replace(old,new,1)
    src.write_text(data,"utf-8")
    view_path=JS/(device+"_17.js")
    v=view_path.read_text("utf-8")
    after="/*VIEWS-END*/"
    if v.count(after)!=1:raise ValueError("VIEWS end anchor mismatch")
    hydrate=r"""
/* PT-HOME-DEFER: initialize sheet data only when the sheet is actually opened. */
(function(){
  const root=document.documentElement;
  let oldPage=root.dataset.page||"sheet";
  function hydrate(){
    const page=root.dataset.page||"sheet";
    if(page!=="home"){
      document.querySelectorAll("#chars img[data-pt-src], #chdGrid img[data-pt-src]").forEach(img=>{
        img.src=img.dataset.ptSrc;
        delete img.dataset.ptSrc;
      });
    }
    if(page==="sheet" && oldPage!=="sheet"){
      /* Kept separate from setPage to preserve existing navigation and storage behavior. */
      if(typeof renderTable==="function")renderTable();
      else if(typeof buildMoves==="function"){buildMoves();renderTop();renderList();}
    }
    oldPage=page;
  }
  new MutationObserver(hydrate).observe(root,{attributes:true,attributeFilter:["data-page"]});
  hydrate();
})();
"""
    v=v.replace(after,after+"\n"+hydrate,1)
    view_path.write_text(v,"utf-8")
    report["devices"][device]={
        "original_sheet_js_bytes":old_size,
        "new_sheet_js_bytes":src.stat().st_size,
        "on_home":"character JSON withheld; PC hidden character thumbnails withheld"
    }
(BASE/"data"/"phase5-home-defer.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf-8")
print(json.dumps(report,ensure_ascii=False,indent=2))
