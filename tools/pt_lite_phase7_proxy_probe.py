#!/usr/bin/env python3
"""Probe allowed third-party public static content proxies, test-only. No credentials."""
import json,subprocess
from pathlib import Path
prefix="gguntama-mk2/gguntama-mk2.github.io"
ref="project-t-preview-20261107"
rel="test-litev1/pc.html"
urls={
 "github_raw":f"https://raw.githubusercontent.com/{prefix}/{ref}/{rel}",
 "githack_dev":f"https://raw.githack.com/{prefix}/{ref}/{rel}",
 "githack_immutable":f"https://rawcdn.githack.com/{prefix}/{ref}/{rel}",
 "githubraw_dev":f"https://githubraw.com/{prefix}/{ref}/{rel}",
 "githubraw_immutable":f"https://cdn.githubraw.com/{prefix}/{ref}/{rel}",
 "jsdelivr":f"https://cdn.jsdelivr.net/gh/{prefix}@{ref}/{rel}",
}
results={}
for name,url in urls.items():
 try:
  p=subprocess.run(["curl","-sSL","--compressed","--max-time","22","-w","\\nPT_METADATA:%{http_code}|%{content_type}|%{size_download}|%{url_effective}","-A","Project-T-Preview-Check/1","-o","/tmp/pt-probe-"+name,url],text=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=26)
  payload=p.stdout.strip().split("PT_METADATA:")[-1].strip().split("|")
  from os.path import exists
  body=Path("/tmp/pt-probe-"+name).read_bytes() if exists("/tmp/pt-probe-"+name) else b""
  results[name]={"url":url,"http_status":payload[0] if len(payload)>0 else None,"content_type":payload[1] if len(payload)>1 else None,
  "bytes":len(body),"html_signature":b"pt-preview-guard.js" in body,"looks_like_site":b"PROJECT T" in body or b"\xe6\x8a\x80\xe3\x83\x81\xe3\x82\xa7\xe3\x83\x83\xe3\x82\xaf" in body,
  "head":body[:180].decode("utf-8","replace"),"curl_code":p.returncode,"stderr":p.stderr[-200:]}
 except Exception as e:results[name]={"url":url,"error":repr(e)}
 print(name,json.dumps(results[name],ensure_ascii=False))
Path("test-litev1/assets/data/phase7-proxy-probe.json").write_text(json.dumps({"mode":"test-only","providers":results},ensure_ascii=False,indent=2)+"\n")
