#!/usr/bin/env python3
"""Phase17: losslessly recompress existing WOFF2 font assets in an isolated TEST COPY.

No subsetting: all glyphs, encoding maps, kerning/layout and metrics must remain
bit-exact at the decoded SFNT table level. Otherwise keep original bytes.
This is a content-preserving compression experiment, not font redistribution.
"""
import argparse
from io import BytesIO
import json
from pathlib import Path
from fontTools.ttLib import TTFont

def font_tables(font):
    keys=[k for k in font.keys() if k!="GlyphOrder"]
    return {key:font.getTableData(key) for key in keys}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--site",default="phase17-performance/optimized-site")
    a=p.parse_args()
    site=Path(a.site)
    paths=sorted((site/"assets/media").glob("*.woff2"))
    report={"phase":17,"mode":"test-copy-only",
            "method":"recompress WOFF2 only if every decoded SFNT table equals original",
            "files":[],"savedBytes":0,"error":[]}
    try:
        for path in paths:
            original=path.read_bytes()
            orig=TTFont(BytesIO(original),recalcTimestamp=False)
            assert orig.flavor=="woff2",path
            candidate=BytesIO()
            orig.flavor="woff2"
            orig.save(candidate,reorderTables=None)
            encoded=candidate.getvalue()
            new=TTFont(BytesIO(encoded),recalcTimestamp=False)
            same=(font_tables(orig)==font_tables(new)
                  and orig.getGlyphOrder()==new.getGlyphOrder()
                  and orig.getBestCmap()==new.getBestCmap())
            record={"path":path.relative_to(site).as_posix(),
                "beforeBytes":len(original),"candidateBytes":len(encoded),
                "exactDecodedTables":same,"adopted":False}
            if same and len(encoded)+128<len(original):
                path.write_bytes(encoded)
                record["adopted"]=True
                report["savedBytes"]+=len(original)-len(encoded)
            report["files"].append(record)
    except Exception as e:
        report["error"].append(str(e))
    report["passed"]=not report["error"]
    out=Path("phase17-performance/font-report.json")
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("PHASE17_FONT_RECODE",json.dumps(report,ensure_ascii=False)[:12000])
    raise SystemExit(0 if report["passed"] else 1)

if __name__=="__main__":
    main()
