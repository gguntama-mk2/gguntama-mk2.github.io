#!/usr/bin/env python3
"""PROJECT T isolated trial: externalize heavy HTML assets, preserving UI and source data."""
from pathlib import Path
import re, base64, hashlib, json
ROOT=Path.cwd()
OUT=ROOT/'test-litev1'
JS,CSS,MEDIA,DATA=[OUT/'assets'/p for p in ('js','css','media','data')]
for p in (JS,CSS,MEDIA,DATA):p.mkdir(parents=True,exist_ok=True)
SCRIPTS=re.compile(r'<script\\b[^>]*>(.*?)</script\\s*>',re.S|re.I)
STYLES=re.compile(r'<style\\b[^>]*>(.*?)</style\\s*>',re.S|re.I)
EMBEDDED=re.compile(r'data:([a-zA-Z0-9.+/-]+);base64,([A-Za-z0-9+/=]+)')
mediafiles=set()
def relocate(text,css=False):
    def sub(m):
        typ,enc=m.groups()
        if not (typ.startswith('image/') or typ.startswith('font/')):return m.group(0)
        try:raw=base64.b64decode(enc,validate=True)
        except Exception:return m.group(0)
        ext={'image/webp':'webp','image/avif':'avif','image/png':'png','image/jpeg':'jpg','image/svg+xml':'svg','font/woff2':'woff2','font/woff':'woff'}.get(typ,'bin')
        name=hashlib.sha256(raw).hexdigest()[:20]+'.'+ext
        f=MEDIA/name
        if not f.exists():f.write_bytes(raw)
        mediafiles.add(name)
        return ('../media/' if css else 'assets/media/')+name
    return EMBEDDED.sub(sub,text)
def build(device):
    src=ROOT/(device+'.html')
    html=src.read_text('utf-8')
    originals={'html':src.stat().st_size,'sha256':hashlib.sha256(src.read_bytes()).hexdigest()}
    scripts=[]
    def replace_script(m):
        n=len(scripts);name=f'{device}_{n:02d}.js'
        text=relocate(m.group(1));(JS/name).write_text(text,'utf-8')
        scripts.append({'name':name,'bytes':len(text.encode())})
        attrs=m.group(0).split('>',1)[0]
        id_match=re.search(r'\\bid\\s*=\\s*["\\']([^"\\']+)["\\']',attrs,re.I)
        id_attr=' id="'+id_match.group(1)+'"' if id_match else ''
        return '<script'+id_attr+' src="assets/js/'+name+'"></script>'
    html=SCRIPTS.sub(replace_script,html)
    styles=[]
    def replace_css(m):
        n=len(styles);name=f'{device}_{n:02d}.css'
        text=relocate(m.group(1),css=True)
        (CSS/name).write_text(text,'utf-8')
        styles.append({'name':name,'bytes':len(text.encode())})
        return '<link rel="stylesheet" href="assets/css/'+name+'">'
    html=STYLES.sub(replace_css,html)
    html=relocate(html)
    target=OUT/(device+'.html');target.write_text(html,'utf-8')
    if target.stat().st_size>=1_000_000:raise ValueError(device+' HTML over 1MB')
    return {**originals,'lite_html_bytes':target.stat().st_size,'script_count':len(scripts),'style_count':len(styles),'js_bytes':sum(s['bytes'] for s in scripts),'css_bytes':sum(s['bytes'] for s in styles)}
report={'schema':1,'mode':'test-only','notice':'HTML below 1MB; total initial transfer requires subsequent lazy-loading optimization.','devices':{}}
for device in ('pc','sp'):report['devices'][device]=build(device)
report['media_files']=len(mediafiles)
report['media_bytes']=sum((MEDIA/n).stat().st_size for n in mediafiles)
(DATA/'build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
