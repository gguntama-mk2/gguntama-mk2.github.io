#!/usr/bin/env python3
"""V22 - 10 Japanese-source guard effect reviews, read-only.
Do not treat a Japanese table alone as game-binary proof. Never write icon overrides.
"""
import csv,json,re,sys
from pathlib import Path
from collections import Counter
if len(sys.argv)!=4: raise SystemExit("Usage: python tests/guard_effect_v22.py V21_REVIEW.json V22_BATCH.json OUTDIR")
base_path,batch_path,outdir=map(Path,sys.argv[1:])
base=json.loads(base_path.read_text(encoding="utf-8"))
batch=json.loads(batch_path.read_text(encoding="utf-8"))
assert base["summary"]["schema"]==21 and batch["schema"]==22
old=base["records"]
assert len(old)==len({r["move_id"] for r in old})==128
index={r["move_id"]:r for r in old};new={}
for v in batch["new_evidence"]:
 mid=v["move_id"]
 assert mid in index and mid not in new,mid
 assert index[mid]["jp_status"]=="jp_not_reviewed",(mid,index[mid]["jp_status"])
 assert index[mid]["site_guard"]==v["site_guard"],(mid,index[mid]["site_guard"],v["site_guard"])
 assert v["jp_status"] in ("jp_explicit","jp_notation_disagreement")
 assert not v["approved_icon"] and not v["game_binary_verified"] and not v["foreign_source_used_for_approval"]
 kinds={e["kind"] for e in v["jp_evidence"]}
 assert any(e["kind"]=="notation" for e in v["jp_evidence"])
 if v["jp_status"]=="jp_explicit": assert "explicit" in kinds,mid
 else: assert "notation_missing" in kinds and len(v["jp_evidence"])==2
 for e in v["jp_evidence"]:
  assert e["publisher"] in ("sorao","geppopotamus","mogura-ya","tettk")
  assert e["url"].startswith("https://")
  assert e["guard"] and e["source_version"]
 new[mid]=v
assert len(new)==10
rows=[]
for r in old:
 x=dict(r)
 if r["move_id"] in new:
  item=new[r["move_id"]]
  x["jp_status"]=item["jp_status"]
  x["jp_evidence"]=[{"publisher":e["publisher"],"url":e["url"],"guard":e["guard"],"source_version":e["source_version"],"notes":e["note"],"evidence_kind":e["kind"]} for e in item["jp_evidence"]]
  x["newly_reviewed_v22"]=True
  x["v22_notes"]="Explicit Japanese annotation, still no game confirmation" if item["jp_status"]=="jp_explicit" else "Japanese sources disagree on crouch suffix, not a proof of absence"
 else:
  x["newly_reviewed_v22"]=False;x["v22_notes"]="Preserved from v21"
 x["approved_icon"]=False
 x["reviewed_current_version_binary"]=False
 x["overseas_used_for_approval"]=False
 rows.append(x)
counts=Counter(x["jp_status"] for x in rows)
expected={"jp_explicit":32,"jp_notation_only":33,"jp_numeric_conflict":7,"jp_notation_disagreement":4,"jp_attacker_crouch_risk":1,"jp_variant_mapping_risk":1,"jp_not_reviewed":50}
assert dict(counts)==expected,(dict(counts),expected)
assert len({r["move_id"] for r in rows})==128
summary={"schema":22,"priority_groups":128,"new_japanese_reviews":10,"new_jp_explicit":9,"new_jp_notation_disagreement":1,
 "reviewed_japanese_total":78,"unreviewed_japanese_remaining":50,
 "jp_explicit":32,"jp_notation_only":33,"jp_numeric_conflict":7,"jp_notation_disagreement":4,
 "jp_attacker_crouch_risk":1,"jp_variant_mapping_risk":1,
 "game_binary_verified":0,"icon_assignments":0,"production_writes":0,
 "evidence_policy":"Japanese text evidence only; missing suffix is not absence; no overwrites or game verification implied."}
outdir.mkdir(parents=True,exist_ok=True)
(outdir/"V22_JAPANESE_REVIEW.json").write_text(json.dumps({"summary":summary,"records":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(outdir/"V22_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
cols=["move_id","character_id","site_k","move_name","command","site_guard","jp_status","newly_reviewed_v22","v22_notes","jp_evidence","approved_icon"]
def output(name,items):
 with (outdir/name).open("w",encoding="utf-8-sig",newline="") as f:
  w=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore");w.writeheader()
  for r in items:
   x=dict(r);x["jp_evidence"]=json.dumps(x["jp_evidence"],ensure_ascii=False);w.writerow(x)
output("V22_ALL_128.csv",rows)
output("V22_NEW_10.csv",[r for r in rows if r["newly_reviewed_v22"]])
output("V22_PENDING_50.csv",[r for r in rows if r["jp_status"]=="jp_not_reviewed"])
output("V22_JAPANESE_DISAGREEMENT.csv",[r for r in rows if r["jp_status"]=="jp_notation_disagreement"])
print("V22_REPORT "+json.dumps(summary,ensure_ascii=False))
