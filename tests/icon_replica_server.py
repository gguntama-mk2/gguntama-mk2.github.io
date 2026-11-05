#!/usr/bin/env python3
"""Isolated local API for browser tests of the real PROJECT T pc/sp/admin frontend.

Never communicates with or writes to production. Implements move-icons API shape.
Usage: python tests/icon_replica_server.py --data-dir /tmp/project-t-icon-test
"""
import argparse
import json
import os
import re
import tempfile
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
ALLOWED = {"tornado","powercrush","heatengage","recoverable","homing","forcedcrouch","floorgimmick",
           "wallbreak","hardwallbreak","wallblast","wallbound","balconybreak","floorbreak","hardfloorbreak","floorblast"}
ORDER = ["tornado","powercrush","heatengage","recoverable","homing","forcedcrouch","floorgimmick",
         "wallbreak","hardwallbreak","wallblast","wallbound","balconybreak","floorbreak","hardfloorbreak","floorblast"]
REGISTRY = None
def read_registry():
    if REGISTRY.exists():
        return json.loads(REGISTRY.read_text(encoding="utf-8"))
    return {"schema": 1, "entries": {}}
def write_registry(doc):
    REGISTRY.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp = tempfile.mkstemp(dir=REGISTRY.parent)
    with os.fdopen(fd,"w",encoding="utf-8") as f:
        json.dump(doc,f,ensure_ascii=False,sort_keys=True)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp,REGISTRY)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(ROOT),**kwargs)
    def json_response(self, code, doc):
        data=json.dumps(doc,ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Cache-Control","no-store")
        self.send_header("Content-Length",str(len(data)))
        self.end_headers();self.wfile.write(data)
    def do_GET(self):
        path=urlparse(self.path).path
        if path=="/healthz": return self.json_response(200,{"ok":True,"isolated":True})
        if path=="/api/v1/me":
            return self.json_response(200,{"is_admin":True,"csrf_token":"TEST-CSRF-ONLY","public_id":"test-admin","display_name":"Test Admin"})
        if path=="/api/v1/move-icons":
            entries=read_registry()["entries"]
            out={}
            for key,value in entries.items():
                char,k=key.split("/")
                out.setdefault(char,{})[k]=value["icons"]
            return self.json_response(200,{"schema":1,"characters":out})
        if path=="/api/v1/admin/move-icons":
            entries=read_registry()["entries"]
            return self.json_response(200,{"schema":1,"icon_ids":ORDER,"entries":[{"character_id":key.split("/")[0],"site_k":int(key.split("/")[1]),**v} for key,v in sorted(entries.items())]})
        return super().do_GET()
    def do_POST(self):
        path=urlparse(self.path).path
        if path not in {"/api/v1/admin/move-icons/set","/api/v1/admin/move-icons/reset"}:
            return self.json_response(404,{"detail":"Not found in isolated test server"})
        if self.headers.get("X-CSRF-Token")!="TEST-CSRF-ONLY":
            return self.json_response(403,{"detail":"CSRF"})
        try:
            size=int(self.headers.get("Content-Length",0))
            if not 0<size<10000: raise ValueError()
            body=json.loads(self.rfile.read(size))
            char=body["character_id"];k=body["site_k"]
            if not isinstance(char,str) or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,47}",char) or type(k)!=int or not 0<=k<=1000000: raise ValueError()
            key=f"{char}/{k}"
            data=read_registry()
            if path.endswith("/reset"):
                data["entries"].pop(key,None)
                write_registry(data)
                return self.json_response(200,{"character_id":char,"site_k":k,"reset":True})
            icons=body["icons"]
            if not isinstance(icons,list) or len(set(icons))>6 or not set(icons)<=ALLOWED or not all(isinstance(x,str) for x in icons):raise ValueError()
            icons=sorted(set(icons),key=ORDER.index)
            data["entries"][key]={"icons":icons,"move_name":str(body.get("move_name",""))[:120],"updated_at":0,"updated_by":"isolated-test"}
            write_registry(data)
            return self.json_response(200,{"character_id":char,"site_k":k,"icons":icons})
        except (ValueError,TypeError,KeyError,UnicodeDecodeError):
            return self.json_response(400,{"detail":"Invalid request"})

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--data-dir",required=True)
    parser.add_argument("--port",type=int,default=8000)
    args=parser.parse_args()
    REGISTRY=Path(args.data_dir).resolve()/"move-icons"/"overrides.json"
    assert not str(REGISTRY).startswith("/app/data/"),"Never use production paths"
    assert REGISTRY.is_relative_to(Path(args.data_dir).resolve())
    print("ISOLATED icon API",REGISTRY,flush=True)
    ThreadingHTTPServer(("127.0.0.1",args.port),Handler).serve_forever()
