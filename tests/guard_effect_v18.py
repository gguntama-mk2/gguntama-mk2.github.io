#!/usr/bin/env python3
"""PROJECT T v18: merge 15 Japanese evidence checks into 128 stable move-id groups.
No overseas-only confidence promotion, no binary claims, no icon overrides.
"""
import csv,json,re,sys
from collections import Counter
from pathlib import Path
if len(sys.argv)!=4:
 raise SystemExit("Usage: python tests/guard_effect_v18.py V17_JAPANESE_REVIEW.json v18-japanese-evidence-batch.json OUTPUT_DIR")
oldp,batchp,out=map(Path,sys.argv[1:])
old=json.loads(oldp.read_text(encoding="utf-8"))
batch=json.loads(batchp.read_text(encoding="utf-8"))
assert batch["schema"]==18
source=old["records"]
assert len(source)==128 and len({r["move_id"] for r in source})==128
byid={r["move_id"]:r for r in source}
changes={}
for entry in batch["entries"]:
 k=entry["move_id"]
 assert k not in changes,k
 assert k in byid,k
 original=byid[k]
 assert original["jp_status"]=="jp_not_reviewed",(k,original["jp_status"])
 assert original["site_guard"]==entry["project_t_guard"],(k,original["site_guard"],entry["project_t_guard"])
 status=entry["japanese_status"]
 assert status in ("jp_explicit","jp_notation_only","jp_numeric_conflict")
 sources=entry["jp_sources"]
 assert isinstance(sources,list) and sources
 for s in sources:
  assert s["publisher"] in ("geppopotamus","sorao")
  assert s["url"].startswith(("https://geppopotamus.info/","https://tekken8.sorao.site/"))
  assert "/tekken8/" in s["url"] or "/ja/" in s["url"],(k,s["url"])
  assert s["guard"] and s["source_version"]
 if status=="jp_numeric_conflict":
  numbers={re.search(r"[-+]?\d+",s["guard"]).group() for s in sources}
  assert len(numbers)>=2,(k,numbers)
 assert not entry["game_binary_verified"] and not entry["icon_assignment_approved"]
 changes[k]=entry
assert len(changes)==15
merged=[]
for r in source:
 updated=dict(r)
 if r["move_id"] in changes:
  src=changes[r["move_id"]]
  updated["jp_status"]=src["japanese_status"]
  updated["jp_evidence"]=src["jp_sources"]
  updated["newly_reviewed_v18"]=True
  updated["confidence_note"]="Japanese explicit description" if src["japanese_status"]=="jp_explicit" else "Only Japanese notation, effect unconfirmed" if src["japanese_status"]=="jp_notation_only" else "Japanese frame value disagreement; target version unverified"
 else:
  updated["newly_reviewed_v18"]=False
  updated["confidence_note"]="Preserved unchanged from v17"
 updated["approved_icon"]=False
 updated["reviewed_current_version_binary"]=False
 updated["overseas_used_for_approval"]=False
 merged.append(updated)
counts=Counter(r["jp_status"] for r in merged)
assert counts=={"jp_explicit":9,"jp_notation_only":16,"jp_numeric_conflict":4,"jp_not_reviewed":99},counts
assert all(not r["approved_icon"] and not r["reviewed_current_version_binary"] and not r["overseas_used_for_approval"] for r in merged)
assert {r["move_id"] for r in merged}==set(byid)
summary={
 "schema":18,"date":"2026-11-05","priority_groups":128,"v17_japanese_reviewed":14,"new_japanese_checks":len(changes),
 "japanese_explicit":counts["jp_explicit"],"japanese_notation_only":counts["jp_notation_only"],
 "japanese_numeric_conflict":counts["jp_numeric_conflict"],"japanese_not_reviewed":counts["jp_not_reviewed"],
 "new_explicit":sum(x["japanese_status"]=="jp_explicit" for x in changes.values()),
 "new_notation_only":sum(x["japanese_status"]=="jp_notation_only" for x in changes.values()),
 "new_numeric_conflict":sum(x["japanese_status"]=="jp_numeric_conflict" for x in changes.values()),
 "overseas_sources_used_as_final_evidence":0,"binary_verified_moves":0,"admin_icon_assignments":0,"production_changes":0,
 "key_risks":["S3 Japanese site may not match user's installed build","same named heat variants are not proof of the same reactions","king/158 and king/189 have inconsistent Japanese block frames","notation s alone may be source convention and not directly game attribute"],
 "policy":"Japanese primary, foreign sources supplementary only. No automatic icon assignment. Preserve existing admin icons."
}
out.mkdir(parents=True,exist_ok=True)
(out/"V18_JAPANESE_REVIEW.json").write_text(json.dumps({"summary":summary,"records":merged},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(out/"V18_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
fields=["move_id","character_id","site_k","move_name","command","site_guard","jp_status","newly_reviewed_v18","confidence_note","jp_evidence","approved_icon","reviewed_current_version_binary"]
def emit(filename,items):
 with (out/filename).open("w",encoding="utf-8-sig",newline="") as handle:
  w=csv.DictWriter(handle,fieldnames=fields,extrasaction="ignore");w.writeheader()
  for r in items:
   row=dict(r);row["jp_evidence"]=json.dumps(r["jp_evidence"],ensure_ascii=False);w.writerow(row)
emit("V18_128_JAPANESE_REVIEW.csv",merged)
emit("V18_NEW_15_JAPANESE_CHECKS.csv",[r for r in merged if r["newly_reviewed_v18"]])
emit("V18_NUMERIC_CONFLICTS.csv",[r for r in merged if r["jp_status"]=="jp_numeric_conflict"])
emit("V18_PENDING_99.csv",[r for r in merged if r["jp_status"]=="jp_not_reviewed"])
print("V18_JAPANESE_AUDIT "+json.dumps(summary,ensure_ascii=False))
