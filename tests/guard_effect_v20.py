#!/usr/bin/env python3
"""PROJECT T v20: Japanese-first guard-reaction provenance audit.
Source derived from site, not raw Tekken 8 game Hit Conditions/Reaction List.
No admin API writes, no binary-confirmed or icon-approved claims.
"""
import csv,json,re,sys
from pathlib import Path
from collections import Counter

if len(sys.argv)!=4:
    raise SystemExit("Usage: python tests/guard_effect_v20.py V19_JAPANESE_REVIEW.json v20-japanese-evidence-batch.json OUT")
basepath,batchpath,out=map(Path,sys.argv[1:])
base=json.loads(basepath.read_text(encoding='utf8'))
batch=json.loads(batchpath.read_text(encoding='utf8'))
assert base["summary"]["schema"]==19 and batch["schema"]==20
old=base["records"]
assert len(old)==len({r["move_id"] for r in old})==128
byid={r["move_id"]:r for r in old}
new={}
for source in batch["entries"]:
    mid=source["move_id"]
    assert mid not in new and mid in byid, mid
    r=byid[mid]
    assert r["jp_status"]=="jp_not_reviewed",(mid,r["jp_status"])
    assert r["site_guard"]==source["site_guard"],(mid,r["site_guard"],source["site_guard"])
    assert source["evidence_scope"]=="guard_opponent_crouch_only"
    status=source["jp_status"]
    assert status in ("jp_explicit","jp_notation_only","jp_notation_disagreement")
    refs=source["evidence"]
    assert 1<=len(refs)<=2
    for entry in refs:
        assert entry["publisher"] in ("sorao","geppopotamus")
        assert entry["url"].startswith(("https://geppopotamus.info/game/tekken8/","https://tekken8.sorao.site/"))
        assert entry["guard"] and entry["version"] and entry["notes"]
    if status=="jp_explicit":
        assert any(x["explicit_forced_crouch_annotation"] for x in refs),mid
    elif status=="jp_notation_only":
        assert all(not x["explicit_forced_crouch_annotation"] for x in refs),mid
        assert len(refs)==1 and refs[0]["guard"]==r["site_guard"],mid
    else:
        assert len(refs)==2 and not any(x["explicit_forced_crouch_annotation"] for x in refs),mid
        assert any("s" in x["guard"].lower() for x in refs) and any("s" not in x["guard"].lower() for x in refs),mid
        assert len({re.search(r"[-+]?\d+",x["guard"]).group() for x in refs})==1,mid
    assert source["game_binary_verified"] is False and source["icon_approved"] is False
    new[mid]=source
assert len(new)==14

merged=[]
for old_row in old:
    r=dict(old_row)
    mid=r["move_id"]
    if mid in new:
        item=new[mid]
        r["jp_status"]=item["jp_status"]
        r["jp_evidence"]=[{
          "publisher":e["publisher"],"url":e["url"],"guard":e["guard"],
          "source_version":e["version"],"notes":e["notes"],
          "explicit_forced_crouch_annotation":e["explicit_forced_crouch_annotation"]
        } for e in item["evidence"]]
        r["newly_reviewed_v20"]=True
        r["review_scope"]="opponent_forced_crouch_on_guard"
        r["evidence_warning"]=("Source annotations disagree about s; do NOT infer absence" if item["jp_status"]=="jp_notation_disagreement"
             else "Effect described explicitly in a Japanese source; current game binary not verified" if item["jp_status"]=="jp_explicit"
             else "Site has s notation without explicit defender-effect description")
    else:
        r["newly_reviewed_v20"]=False
        r["review_scope"]="preserved_from_v19"
        r["evidence_warning"]="Not changed by V20"
    r["overseas_used_for_approval"]=False
    r["reviewed_current_version_binary"]=False
    r["approved_icon"]=False
    merged.append(r)
count=Counter(r["jp_status"] for r in merged)
expect={"jp_explicit":19,"jp_notation_only":30,"jp_numeric_conflict":6,
        "jp_notation_disagreement":3,"jp_attacker_crouch_risk":1,"jp_not_reviewed":69}
assert count==expect,(count,expect)
assert len(merged)==len({r["move_id"] for r in merged})==128
assert not any(r["approved_icon"] or r["reviewed_current_version_binary"] or r["overseas_used_for_approval"] for r in merged)
summary={
 "schema":20,"date":"2026-11-05","source":"PROJECT T 128 site move identities / Japanese original evidence pages",
 "priority_groups":128,"previous_japanese_reviewed":45,"new_japanese_checks":14,
 "japanese_reviewed_total":59,"japanese_explicit":count["jp_explicit"],
 "japanese_notation_only":count["jp_notation_only"],
 "japanese_numeric_conflict":count["jp_numeric_conflict"],
 "japanese_notation_disagreement":count["jp_notation_disagreement"],
 "japanese_attacker_crouch_risk":count["jp_attacker_crouch_risk"],
 "japanese_unreviewed":count["jp_not_reviewed"],
 "new_explicit":6,"new_notation_only":6,"new_notation_disagreement":2,
 "binary_hit_reaction_verified":0,"icon_assignments_saved":0,"production_changes":0,
 "non_japanese_confirmation_count":0,
 "pending_state":"Manual verification in target TEKKEN build with defender standing block, crouching block, normal/CH/air hit and source patch record",
 "safety":"s notation, attacker crouch-return, and absence of S in an older table are NOT by themselves proof of an opponent forced-crouch attribute."
}
out.mkdir(parents=True,exist_ok=True)
(out/"V20_JAPANESE_REVIEW.json").write_text(json.dumps({"summary":summary,"records":merged},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
(out/"V20_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
f=["move_id","character_id","site_k","move_name","command","site_guard","jp_status","newly_reviewed_v20",
   "evidence_warning","jp_evidence","approved_icon","reviewed_current_version_binary"]
def csv_export(name,items):
    with (out/name).open('w',encoding='utf-8-sig',newline='') as handle:
        w=csv.DictWriter(handle,fieldnames=f,extrasaction='ignore');w.writeheader()
        for r in items:
            x=dict(r);x["jp_evidence"]=json.dumps(r["jp_evidence"],ensure_ascii=False);w.writerow(x)
csv_export("V20_ALL_128.csv",merged)
csv_export("V20_NEW_14.csv",[r for r in merged if r["newly_reviewed_v20"]])
csv_export("V20_PENDING_69.csv",[r for r in merged if r["jp_status"]=="jp_not_reviewed"])
csv_export("V20_DISCREPANCY_10.csv",[r for r in merged if r["jp_status"] in ["jp_numeric_conflict","jp_notation_disagreement","jp_attacker_crouch_risk"]])
csv_export("V20_JP_EXPLICIT_19.csv",[r for r in merged if r["jp_status"]=="jp_explicit"])
print("V20_JAPANESE_REVIEW "+json.dumps(summary,ensure_ascii=False))
