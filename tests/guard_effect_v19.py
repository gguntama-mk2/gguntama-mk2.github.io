#!/usr/bin/env python3
"""PROJECT T v19 - Japanese-first 16 additional guard-effect comparisons.

Never infer opponent forced-crouch from block suffix alone. Overseas tables are
not approval evidence. No API / icon registry / production writes.
"""
import csv, json, re, sys
from collections import Counter
from pathlib import Path

if len(sys.argv)!=4:
    raise SystemExit('Usage: python tests/guard_effect_v19.py V18_JAPANESE_REVIEW.json v19-japanese-evidence-batch.json OUT')
base_path,batch_path,out=map(Path,sys.argv[1:])
base=json.loads(base_path.read_text(encoding="utf-8"))
batch=json.loads(batch_path.read_text(encoding="utf-8"))
assert len(base["records"])==128 and len({x["move_id"] for x in base["records"]})==128
assert batch["schema"]==19 and len(batch["entries"])==16
by_id={r["move_id"]:r for r in base["records"]}
updates={}
for a in batch["entries"]:
    key=a["move_id"]
    assert key not in updates and key in by_id,key
    old=by_id[key]
    assert old["jp_status"]=="jp_not_reviewed",(key,old["jp_status"])
    assert old["site_guard"]==a["site_guard"],(key,old["site_guard"],a["site_guard"])
    status=a["jp_status"]
    assert status in ("jp_explicit","jp_notation_only","jp_numeric_conflict","jp_notation_disagreement","jp_attacker_crouch_risk")
    evidence=a["japanese_evidence"]
    assert 1<=len(evidence)<=2
    for e in evidence:
        assert e["publisher"] in ("geppopotamus","sorao")
        assert e["url"].startswith(("https://geppopotamus.info/game/tekken8/","https://tekken8.sorao.site/ja/"))
        assert e["guard"] and e["version"] and e["meaning"]
    nums=[int(re.search(r"[-+]?\d+",x["guard"]).group()) for x in evidence]
    if status=="jp_numeric_conflict":
        assert len(set(nums))>1,(key,nums)
    elif status=="jp_notation_disagreement":
        assert len(set(nums))==1 and len(evidence)==2
        assert ("s" in evidence[0]["guard"].lower())!=("s" in evidence[1]["guard"].lower())
    elif status=="jp_attacker_crouch_risk":
        assert any("しゃがみ帰着" in x["meaning"] for x in evidence)
    elif status=="jp_explicit":
        assert any("強制しゃがみ" in x["meaning"] for x in evidence)
    assert a["binary_verified"] is False and a["icon_approved"] is False
    updates[key]=a

assert len(updates)==16
merged=[]
for old in base["records"]:
    r=dict(old)
    if old["move_id"] in updates:
        e=updates[old["move_id"]]
        r["jp_status"]=e["jp_status"]
        r["jp_evidence"]=[{"publisher":x["publisher"],"url":x["url"],
            "guard":x["guard"],"source_version":x["version"],"notes":x["meaning"]} for x in e["japanese_evidence"]]
        r["newly_reviewed_v19"]=True
        r["v19_risk"]=("version_or_numeric_disagreement" if e["jp_status"]=="jp_numeric_conflict" else
                      "source_notation_disagreement_and_low_guard" if e["jp_status"]=="jp_notation_disagreement" else
                      "attacker_crouch_return_may_be_conflated" if e["jp_status"]=="jp_attacker_crouch_risk" else
                      "move_variant_must_match_target_build")
    else:
        r["newly_reviewed_v19"]=False
        r["v19_risk"]="unchanged_from_v18"
    r["overseas_used_for_approval"]=False
    r["reviewed_current_version_binary"]=False
    r["approved_icon"]=False
    merged.append(r)

counts=Counter(r["jp_status"] for r in merged)
expected={"jp_explicit":13,"jp_notation_only":24,"jp_numeric_conflict":6,
          "jp_notation_disagreement":1,"jp_attacker_crouch_risk":1,"jp_not_reviewed":83}
assert counts==expected,(counts,expected)
assert len({r["move_id"] for r in merged})==128
assert all(not r["overseas_used_for_approval"] and not r["reviewed_current_version_binary"] and not r["approved_icon"] for r in merged)

summary={"schema":19,"source":"PROJECT T site IDs + manually checked Japanese game/frame tables",
         "as_of":"2026-11-05","priority_groups":128,
         "previous_jp_reviewed":29,"new_reviews":16,"jp_reviewed_total":45,
         "japanese_explicit":counts["jp_explicit"],"japanese_notation_only":counts["jp_notation_only"],
         "japanese_numeric_conflict":counts["jp_numeric_conflict"],"japanese_notation_disagreement":counts["jp_notation_disagreement"],
         "japanese_attacker_crouch_risk":counts["jp_attacker_crouch_risk"],"japanese_unreviewed":counts["jp_not_reviewed"],
         "game_binary_verified":0,"auto_icon_assignments":0,"production_changes":0,"overseas_as_approval_evidence":0,
         "hard_rule":"Do not equate suffix s, crouch return of attacker, or lower-guard defender stance with a confirmed forced-crouch effect.",
         "next":"Investigate 83 remaining IDs, current patch versions, and actual defender reaction/requirements in game binary."}
out.mkdir(parents=True,exist_ok=True)
(out/"V19_JAPANESE_REVIEW.json").write_text(json.dumps({"summary":summary,"records":merged},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(out/"V19_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
cols=["move_id","character_id","site_k","move_name","command","site_guard","jp_status","newly_reviewed_v19","v19_risk","jp_evidence","approved_icon"]
def export(name,rs):
    with (out/name).open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore");w.writeheader()
        for x in rs:
            y=dict(x);y["jp_evidence"]=json.dumps(y["jp_evidence"],ensure_ascii=False);w.writerow(y)
export("V19_128_JAPANESE_REVIEW.csv",merged)
export("V19_NEW_16_JAPANESE_CHECKS.csv",[r for r in merged if r["newly_reviewed_v19"]])
export("V19_SOURCE_CONFLICTS.csv",[r for r in merged if r["jp_status"] in
       ("jp_numeric_conflict","jp_notation_disagreement","jp_attacker_crouch_risk")])
export("V19_PENDING_83.csv",[r for r in merged if r["jp_status"]=="jp_not_reviewed"])
print("V19_JP_REVIEW "+json.dumps(summary,ensure_ascii=False))
