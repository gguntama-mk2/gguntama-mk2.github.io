#!/usr/bin/env python3
"""Inspect stage-3 character data boundaries and dependencies, test branch only."""
from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/"test-litev1"
JS=BASE/"assets/js"
DATA=BASE/"assets/data"
report={"schema":1,"mode":"test-only","files":{}}
def match_array(s,start):
    depth=0
    state="normal"
    i=start
    while i<len(s):
        c=s[i];n=s[i+1] if i+1<len(s) else ""
        if state=="line":
            if c=="\n":state="normal"
        elif state=="block":
            if c=="*" and n=="/":state="normal";i+=1
        elif state in ('"',"'","`"):
            if c=="\\":i+=1
            elif c==state:state="normal"
        elif c in ('"',"'","`"):state=c
        elif c=="/" and n=="/":state="line";i+=1
        elif c=="/" and n=="*":state="block";i+=1
        elif c=="[":depth+=1
        elif c=="]":
            depth-=1
            if depth==0:return i+1
        i+=1
    raise ValueError("array not balanced")
for device in ("pc","sp"):
    p=JS/(device+"_04.js")
    src=p.read_text("utf-8")
    ms=list(re.finditer(r"\bconst\s+CHARACTERS\s*=\s*\[",src))
    if len(ms)!=1:raise ValueError(f"{device} unexpected CHARACTER array count {len(ms)}")
    start=ms[0].end()-1
    end=match_array(src,start)
    rest=src[:start]+"[]" +src[end:]
    (DATA/(device+"-characters-runtime.txt")).write_text(rest,"utf-8")
    uses=[]
    for m in re.finditer(r"\bCHARACTERS\b",rest):
        uses.append({"at":m.start(),"context":rest[max(0,m.start()-100):m.end()+190]})
    report["files"][device]={
        "original_bytes":p.stat().st_size,
        "array_bytes":len(src[start:end].encode("utf-8")),
        "code_without_array_bytes":len(rest.encode("utf-8")),
        "array_head":src[start:start+1200],
        "array_tail":src[end-350:end],
        "references":uses[:80],
        "reference_count":len(uses),
        "moves_mentions_outside_array":len(list(re.finditer(r"\.moves\b",rest))),
        "selection_contexts":[{"context":rest[max(0,m.start()-150):m.end()+170]} for m in list(re.finditer(r"\brenderChar\b|\bload\s*\(|\bCHARACTERS\.find\b|\bonchange\b",rest))[:50]],
    }
(DATA/"character-inspection.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n","utf-8")
print(json.dumps({k:{kk:vv for kk,vv in v.items() if kk not in ("references","selection_contexts","array_head","array_tail")} for k,v in report["files"].items()},indent=2))
