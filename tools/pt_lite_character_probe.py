#!/usr/bin/env python3
"""Audit CHARACTERS data boundary before attempting per-character lazy loading."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/"test-litev1"
out=BASE/"assets/data"
out.mkdir(parents=True,exist_ok=True)
report={"schema":1,"mode":"test-only","characters":{}}
def find_array_span(src):
    m=re.search(r'\bconst\s+CHARACTERS\s*=\s*\[',src)
    if not m:raise ValueError("CHARACTERS not found")
    start=m.end()-1
    depth=0
    i=start
    quote=None
    comment=None
    while i<len(src):
        c=src[i]; nxt=src[i+1] if i+1<len(src) else ""
        if comment=="line":
            if c=="\n":comment=None
        elif comment=="block":
            if c=="*" and nxt=="/":comment=None;i+=1
        elif quote:
            if c=="\\":i+=1
            elif c==quote:quote=None
        elif c=="/" and nxt=="/":comment="line";i+=1
        elif c=="/" and nxt=="*":comment="block";i+=1
        elif c in ("'",'"',"\x60"):quote=c
        elif c=="[":depth+=1
        elif c=="]":
            depth-=1
            if depth==0:return m.start(),start,i
        i+=1
    raise ValueError("unterminated CHARACTERS array")
for device in ("pc","sp"):
    src=(BASE/"assets/js"/(device+"_04.js")).read_text("utf-8")
    start,astart,end=find_array_span(src)
    code=src[:start] + 'const CHARACTERS = /* OMITTED MOVE DATA */ []' + src[end+1:]
    (out/(device+"-character-code-preview.txt")).write_text(code,"utf-8")
    d=src[astart:end+1]
    report["characters"][device]={
      "original_js_bytes":len(src.encode()),
      "data_section_bytes":len(d.encode()),
      "other_js_bytes":len(code.encode()),
      "data_start":astart,"data_end":end,
      "character_ids":re.findall(r'(?m)^\s*\{\s*id:\s*["\x27]([^"\x27]+)',d),
      "move_id_count":len(re.findall(r'\bk\s*:\s*\d+',d)),
      "script_tail":src[-480:].replace("\n"," ")
    }
(out/"character-split-inspection.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf-8")
print(json.dumps({k:{t:v for t,v in d.items() if t not in ("character_ids","script_tail")} for k,d in report["characters"].items()},ensure_ascii=False,indent=2))
