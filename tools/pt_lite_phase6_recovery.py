#!/usr/bin/env python3
"""Add explicit retry UI for failed lazy features on both TEST HTML variants."""
from pathlib import Path
import json
root=Path("test-litev1/assets/js")
out={"schema":6,"test_only":True,"devices":{}}
for device in ("pc","sp"):
    p=root/(device+"_route-loader.js")
    s=p.read_text("utf-8")
    if "PT_PHASE6_RETRY" in s:
        print(device,"already patched")
        continue
    old='      const targets={combo:"cbHost",glossary:"glHost",punish:"pnHost",stage:"sgHost",gallery:"gaHost",login:"lgHost",vs:"vsHost",privacy:"prHost",price:"pcHost",download:"dlHost",guide:"gdHost"};\n      const host=document.getElementById(targets[page]);\n      if(host && !host.shadowRoot)host.textContent="ページの読み込みに失敗しました。別のページへ移動してから再試行してください。";'
    new='''      /* PT_PHASE6_RETRY: same-page retry with a visible and keyboard-accessible button. */
      const targets={combo:"cbHost",glossary:"glHost",punish:"pnHost",stage:"sgHost",gallery:"gaHost",login:"lgHost",vs:"vsHost",privacy:"prHost",price:"pcHost",download:"dlHost",guide:"gdHost",update:"updHost"};
      const host=document.getElementById(targets[page]);
      if(host && !host.shadowRoot){
        const notice=document.createElement("p");
        notice.setAttribute("role","alert");
        notice.textContent="ページの読み込みに失敗しました。ネットワークを確認して再試行してください。";
        const retry=document.createElement("button");
        retry.type="button";
        retry.className="pt-route-retry";
        retry.textContent="再試行";
        retry.addEventListener("click",()=>{
          host.textContent="再読み込み中…";
          ensure(page);
        });
        host.replaceChildren(notice,retry);
      }'''
    if s.count(old)!=1:raise ValueError(device+": unexpected route error handler")
    s=s.replace(old,new,1)
    p.write_text(s,"utf-8")
    out["devices"][device]={"file":str(p),"bytes":p.stat().st_size,"retry_control":"button.pt-route-retry"}
Path("test-litev1/assets/data/phase6-recovery-build.json").write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n","utf-8")
print(json.dumps(out,ensure_ascii=False,indent=2))
