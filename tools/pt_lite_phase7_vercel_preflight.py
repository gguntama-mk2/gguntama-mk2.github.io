#!/usr/bin/env python3
"""Validate the Vercel preview payload without requesting deployment credentials."""
from pathlib import Path
import re,json,sys
base=Path("test-litev1")
cfg=json.loads(Path("vercel.json").read_text("utf-8"))
assert cfg["outputDirectory"]=="test-litev1","Only the isolated test UI may be served"
assert cfg["framework"] is None
assert "public" not in cfg, "Deprecated public key is unsupported in Vercel deployments"
assert any(h["source"]=="/(.*)" and any(x["key"]=="X-Robots-Tag" for x in h["headers"]) for h in cfg["headers"])
assert not Path("test-litev1/.env").exists()
results={"schema":7,"mode":"preview-only","safe":True,"output_dir":cfg["outputDirectory"],"devices":{}}
for device in ("pc","sp"):
    p=base/(device+".html")
    html=p.read_text("utf-8")
    marker="assets/js/pt-preview-guard.js"
    assert html.count(marker)==1
    assert html.index(marker)<html.index('assets/js/'+device+'_04.js')
    assert 'noindex,nofollow,noarchive' in html
    paths=re.findall(r'(?:src|href)="(assets/[^"]+)"',html)
    missing=[x for x in paths if not (base/x).is_file()]
    assert not missing,(device,missing)
    for code in ("04","05","10","11","13","17","18","20"):
      assert (base/"assets"/"js"/(device+"_"+code+".js")).is_file(),code
    assert (base/"assets"/"js"/(device+"_route-loader.js")).is_file()
    assert p.stat().st_size<100000
    results["devices"][device]={"html_bytes":p.stat().st_size,"resource_paths_in_html":len(paths),"missing_assets":len(missing)}
chars=list((base/"assets"/"data"/"characters").glob("*.json"))
assert len(chars)>=40,len(chars)
results["character_json_count"]=len(chars)
results["asset_bytes_total"]=sum(p.stat().st_size for p in (base/"assets").rglob("*") if p.is_file())
Path("test-litev1/assets/data/phase7-vercel-preflight.json").write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n","utf-8")
print(json.dumps(results,ensure_ascii=False,indent=2))
