#!/usr/bin/env python3
"""Phase18: partition MaruGoKawa into Unicode-range WOFF2 fonts in a TEST COPY.

Build first-sheet/home visible-glyph core + fallback extra without dropping any
Unicode cmap entry. Keep exact font metrics for each glyph and reject if any
post-subset glyph coverage is lost. No production files edited.
"""
import hashlib
import json
from io import BytesIO
from pathlib import Path
import re
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT=Path("phase18-performance")
SITE=ROOT/"optimized-site"
ORIGINAL=SITE/"assets/media/a512bebf66816c386edb.woff2"
REPORT=ROOT/"font-split.json"
CENSUS=ROOT/"glyph-census.json"
FONT_REGEXP=re.compile(r'@font-face\s*\{\s*font-family:\s*"MaruGoKawa";[^}]*\}', re.I)
FAMILY="MaruGoKawa"
SAMPLES=ROOT/"font-source-snapshot.txt"

def ranges(codepoints):
    sorted_cps=sorted(codepoints)
    if not sorted_cps:return ''
    blocks=[]
    start=prev=sorted_cps[0]
    for v in sorted_cps[1:]:
        if v==prev+1:prev=v
        else:
            blocks.append((start,prev))
            start=prev=v
    blocks.append((start,prev))
    return ",".join("U+%X"%a if a==b else "U+%X-%X"%(a,b) for a,b in blocks)

def metrics(font,codepoints):
    cmap=font.getBestCmap() or {}
    hmtx=font["hmtx"].metrics
    return {n:hmtx[cmap[n]] for n in codepoints if n in cmap}

def load_font(raw):
    return TTFont(BytesIO(raw),recalcTimestamp=False)

report={"schema":18,"mode":"test-copy-only","adopted":False,
        "oldFont":"assets/media/a512bebf66816c386edb.woff2",
        "subsets":[],"errors":[]}
try:
    snapshot=json.loads(CENSUS.read_text(encoding="utf8"))
    if not snapshot["passed"] or not snapshot["union"]:
        raise ValueError("Missing verified screenshot text census")
    original_raw=ORIGINAL.read_bytes()
    master=load_font(original_raw)
    cmap=master.getBestCmap() or {}
    available=set(cmap)
    report["originalBytes"]=len(original_raw)
    report["originalUnicodeGlyphs"]=len(available)
    # Always cover Latin digits, generic symbols and Kana (including dakuten)
    # so text remains stable outside initially visited UI. Core CJK ideographs
    # are selected by the actual *rendered* default PC/mobile pages.
    basics={cp for cp in available if cp<0x3000 or 0x3000<=cp<=0x30ff
        or 0xff00<=cp<=0xffef}
    sampled={ord(x) for x in snapshot["union"]}
    core=(basics|sampled)&available
    rest=available-core
    if not (core and rest):raise ValueError("Invalid split: empty font segment")
    report["firstViewCensusChars"]=len(sampled)
    report["firstViewCoreCodepoints"]=len(core)
    report["remainingCodepoints"]=len(rest)
    report["allCodepointsRetained"]=core.isdisjoint(rest) and core|rest==available
    out=[]
    for tag,unicodes in [('first-view',core),('on-demand',rest)]:
        clone=load_font(original_raw)
        options=subset.Options()
        options.layout_features=['*']
        options.name_IDs=['*']
        options.name_languages=['*']
        options.name_legacy=True
        options.notdef_glyph=True
        options.notdef_outline=True
        subs=subset.Subsetter(options=options)
        subs.populate(unicodes=sorted(unicodes))
        subs.subset(clone)
        clone.flavor='woff2'
        buf=BytesIO()
        clone.save(buf)
        data=buf.getvalue()
        actual=load_font(data)
        newmap=actual.getBestCmap() or {}
        if set(newmap)!=unicodes:
            missing=sorted(unicodes-set(newmap))
            unexpected=sorted(set(newmap)-unicodes)
            raise ValueError(f"Loss of font glyph coverage in {tag}: missing={missing[:10]}, unexpected={unexpected[:10]}")
        if master["head"].unitsPerEm!=actual["head"].unitsPerEm:
            raise ValueError("unitsPerEm mismatch "+tag)
        if metrics(master,unicodes)!=metrics(actual,unicodes):
            raise ValueError("Horizontal advance metric mismatch "+tag)
        for attr in ('sTypoAscender','sTypoDescender','sTypoLineGap',
                     'usWinAscent','usWinDescent'):
            if getattr(master['OS/2'],attr,None)!=getattr(actual['OS/2'],attr,None):
                raise ValueError(f"vertical {attr} changed: "+tag)
        digest=hashlib.sha256(data).hexdigest()[:16]
        name=f'pt18-maru-{tag}-{digest}.woff2'
        target=SITE/"assets/media"/name
        target.write_bytes(data)
        out.append((tag,name,data,unicodes))
        report["subsets"].append({
            "segment":tag,"path":"assets/media/"+name,
            "bytes":len(data),"glyphs":len(unicodes),
            "allCmapMatched":True,"metricsMatched":True,
            "unicodeRanges":len(ranges(unicodes).split(","))})
    newcss=''
    for tag,name,data,unicodes in out:
        newcss+=(f'@font-face{{font-family:"{FAMILY}";font-style:normal;'
                 f'font-weight:400;font-display:swap;src:url(../media/{name})'
                 f' format("woff2");unicode-range:{ranges(unicodes)};}}\n')
    for page in ["pc","sp"]:
        css=SITE/f"assets/css/{page}_00.css"
        old=css.read_text(encoding="utf8")
        replaced,count=FONT_REGEXP.subn(lambda _:newcss,old)
        if count!=1:raise ValueError(f"CSS font face anchor count: {page}={count}")
        css.write_text(replaced,encoding="utf8")
    report["newTotalBytes"]=sum(len(data) for _,_,data,_ in out)
    report["firstViewBytes"]=len(out[0][2])
    report["aggregateDeltaBytes"]=report["newTotalBytes"]-len(original_raw)
    report["adopted"]=True
except Exception as exc:
    report["errors"].append(str(exc))
report["passed"]=not report["errors"] and report["adopted"]
REPORT.parent.mkdir(parents=True,exist_ok=True)
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print("PHASE18_FONT_SPLIT",json.dumps(report,ensure_ascii=False)[:10000])
if not report["passed"]:raise SystemExit(1)
