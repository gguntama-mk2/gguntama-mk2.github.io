#!/usr/bin/env python3
"""Phase 5: initial home uses the lightweight fallback based on the same font family.
Full original site font activates on first non-home page; subsequent home visits retain it.
The custom font file remains unchanged and is not redistributed.
"""
from pathlib import Path
import json
BASE=Path("test-litev1/assets")
CSS=BASE/"css"
JS=BASE/"js"
styles=[]
for device in ("pc","sp"):
    css=CSS/(device+"_00.css")
    content=css.read_text("utf-8")
    marker="/* PT-FIRST-VIEW-FONT-STRATEGY */"
    if marker not in content:
        content+="\n"+marker+"\nhtml[data-page=\"home\"]:not(.pt-full-font-ready){--font-ui:\"KosugiMaru\",\"Hiragino Maru Gothic ProN\",\"Hiragino Kaku Gothic ProN\",\"Yu Gothic UI\",Meiryo,sans-serif;}\n"
        css.write_text(content,"utf-8")
    js=JS/(device+"_17.js")
    src=js.read_text("utf-8")
    hook='    if(page!=="home"){\n      document.querySelectorAll("#chars img[data-pt-src]'
    if hook not in src:raise ValueError(device+": deferred thumbnail hook missing")
    src=src.replace(hook,'    if(page!=="home"){\n      root.classList.add("pt-full-font-ready");\n      document.querySelectorAll("#chars img[data-pt-src]',1)
    js.write_text(src,"utf-8")
    styles.append({"device":device,"css_bytes":css.stat().st_size,"body_font":"KosugiMaru on first home view, MaruGoKawa after feature navigation"})
output=BASE/"data"/"phase5-font-strategy.json"
output.write_text(json.dumps({"schema":5,"mode":"test-only","strategy":"defer original full UI font until first non-home page, keep same-family rounded fallback on home","files":styles},ensure_ascii=False,indent=2)+"\n","utf-8")
print(output.read_text())
