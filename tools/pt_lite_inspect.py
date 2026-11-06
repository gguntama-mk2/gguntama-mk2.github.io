#!/usr/bin/env python3
"""Characterize large eager-loaded JS without exposing embedded content."""
from pathlib import Path
import json,re,hashlib,collections
ROOT=Path(__file__).resolve().parent.parent
JS=ROOT/"test-litev1/assets/js"
OUT=ROOT/"test-litev1/assets/data/js-inspection.json"
report={"schema":1,"mode":"test-only","files":{}}
keys=[
"data:image","data:font","data:application","atob(","Blob(","JSON.parse(",
"Object.assign(","window.","document.","localStorage","IndexedDB",
"PXSTORE","pxstore","gallery","GALLERY","frame","moves","btoa(",
"await ","fetch(","import(","function ","const ","var ","let ","=>",
]
def preview(s):
    s=s[:2200]
    s=re.sub(r'[A-Za-z0-9+/=]{110,}',lambda m:f"<LONG_TOKEN length={len(m.group(0))}>",s)
    s=re.sub(r'[^\x20-\x7e\n\tぁ-んァ-ン一-龥。、「」【】]+',"<NONASCII>",s)
    return s[:1100]
for file in sorted(JS.glob("*.js")):
    n=file.stat().st_size
    if n<500_000:continue
    data=file.read_text("utf-8")
    pos=[0, max(0,len(data)//4), max(0,len(data)//2), max(0,len(data)*3//4),max(0,len(data)-2200)]
    c={key:data.count(key) for key in keys}
    lengths=sorted((len(x) for x in data.splitlines()),reverse=True)
    candidates=re.findall(r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]{2,75})\s*=',data[:70000])
    report["files"][file.name]={
        "size":n,"sha256":hashlib.sha256(data.encode()).hexdigest(),
        "line_count":len(lengths),"longest_lines":lengths[:5],
        "tokens":c,"leading_declarations":candidates[:80],
        "head":preview(data[:2200]),"tail":preview(data[-2200:]),
        "windows":[{"at":i,"preview":preview(data[max(0,i-200):i+1200])[:800]} for i in pos[1:-1]]
    }
OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf-8")
print("Inspection report written",OUT,"files",len(report["files"]))
