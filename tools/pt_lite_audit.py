#!/usr/bin/env python3
"""Audit isolated PROJECT T lite build. Never edits production pages."""
from pathlib import Path
import json,re,hashlib
ROOT=Path(__file__).resolve().parent.parent
BASE=ROOT/"test-litev1"
OUT=BASE/"assets/data/asset-audit.json"
result={"schema":1,"mode":"test-only","html_budget_bytes":1000000,"devices":{}}
for device in ("pc","sp"):
    html=(BASE/(device+".html")).read_text("utf-8")
    html_bytes=len(html.encode("utf-8"))
    scripts=re.findall(r'<script\b[^>]*\bsrc="([^"]+)"',html,re.I)
    styles=re.findall(r'<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"',html,re.I)
    listed=[]
    for path in scripts+styles:
        if "://" in path or path.startswith("//"):continue
        f=(BASE/path)
        if not f.is_file():raise SystemExit(f"Missing asset: {device} {path}")
        listed.append({"path":path,"bytes":f.stat().st_size})
    heavy=sorted((v for v in listed if v["bytes"]>1000000),key=lambda v:-v["bytes"])
    result["devices"][device]={
        "html_bytes":html_bytes,"html_under_1mb":html_bytes<1000000,
        "external_script_count":len(scripts),"stylesheet_count":len(styles),
        "eager_local_asset_bytes":sum(v["bytes"] for v in listed),
        "largest_eager_assets":heavy[:12],
        "warning":"External scripts are eagerly fetched. HTML below 1MB does not mean a sub-1MB initial transfer."
    }
    if html_bytes>=1000000:raise SystemExit(f"{device} HTML exceeds target")
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n","utf-8")
print(json.dumps(result,ensure_ascii=False,indent=2))
