#!/usr/bin/env python3
"""PROJECT T V23 Japanese site evidence, source-specific notation and floor lead.

Strictly read-only. No game binary is available, thus all approvals remain false.
"""
from pathlib import Path
from collections import Counter
import csv, json, re, sys
if len(sys.argv)!=4:
    raise SystemExit("python tests/guard_effect_v23.py V22_JAPANESE_REVIEW.json v23-japanese-evidence-batch.json OUTDIR")
basefile,batchfile,out=map(Path,sys.argv[1:])
base=json.loads(basefile.read_text(encoding="utf-8"))
batch=json.loads(batchfile.read_text(encoding="utf-8"))
assert base["summary"]["schema"]==22 and batch["schema"]==23
old=base["records"]
assert len(old)==len({r["move_id"] for r in old})==128
old_by_id={r["move_id"]:r for r in old}
add={}
for item in batch["entries"]:
    id=item["move_id"]
    assert id in old_by_id and id not in add,id
    previous=old_by_id[id]
    assert previous["jp_status"]=="jp_not_reviewed",(id,previous["jp_status"])
    assert previous["site_guard"]==item["site_guard"],(id,previous["site_guard"],item["site_guard"])
    state=item["jp_status"]
    assert state in ("jp_explicit","jp_notation_only","jp_numeric_conflict")
    assert not item["game_binary_verified"] and not item["admin_icon_write_approved"]
    srcs=item["sources"]
    assert srcs and len(srcs)<=2
    for src in srcs:
        assert src["publisher"] in ("sorao","geppopotamus","mogura-ya")
        assert src["url"].startswith(("https://tekken8.sorao.site/","https://geppopotamus.info/","https://www.geppopotamus.info/","https://mogura-ya.net/"))
        assert src["guard"] and src["version"] and src["note"]
    if state=="jp_explicit":
        assert any(src["evidence_kind"] in ("explicit_japanese","notation_defined_as_defender_crouch") for src in srcs),id
    if state=="jp_notation_only":
        assert len(srcs)==1 and srcs[0]["evidence_kind"]=="notation",id
        assert srcs[0]["guard"]==item["site_guard"],id
    if state=="jp_numeric_conflict":
        assert len(srcs)==2
        def frame(s):
            match=re.search(r"[-+]?\d+",s.replace("±","+"))
            assert match
            return int(match.group())
        values=[frame(s["guard"]) for s in srcs]
        assert len(set(values))==2,(id,values)
    if "additional_stage_evidence" in item:
        assert id=="bob/184"
        e=item["additional_stage_evidence"]
        assert e["icon_id"]=="floorgimmick" and "D^{FB}" in e["evidence"]
        assert e["ground_air_condition"]=="not_established"
        assert e["game_binary_verified"] is False and e["icon_assignment_approved"] is False
    add[id]=item
assert len(add)==18
rows=[]
for r in old:
    x=dict(r); item=add.get(r["move_id"])
    if item:
        x["jp_status"]=item["jp_status"]
        x["jp_evidence"]=[{"publisher":s["publisher"],"url":s["url"],"guard":s["guard"],"source_version":s["version"],"notes":s["note"],"evidence_kind":s["evidence_kind"]} for s in item["sources"]]
        x["newly_reviewed_v23"]=True
        x["v23_stage_candidate"]=item.get("additional_stage_evidence")
    else:
        x["newly_reviewed_v23"]=False
        x["v23_stage_candidate"]=None
    x["approved_icon"]=False
    x["reviewed_current_version_binary"]=False
    x["overseas_used_for_approval"]=False
    rows.append(x)
count=Counter(x["jp_status"] for x in rows)
expected={"jp_explicit":39,"jp_notation_only":41,"jp_numeric_conflict":10,"jp_notation_disagreement":4,
          "jp_attacker_crouch_risk":1,"jp_variant_mapping_risk":1,"jp_not_reviewed":32}
assert dict(count)==expected,(dict(count),expected)
assert len({r["move_id"] for r in rows})==128
stage=[r for r in rows if r["v23_stage_candidate"]]
assert len(stage)==1 and stage[0]["move_id"]=="bob/184"
assert all(not r["approved_icon"] and not r["reviewed_current_version_binary"] and not r["overseas_used_for_approval"] for r in rows)
summary={
    "schema":23,"date":"2026-11-05","total_review_groups":128,"new_japanese_checks":18,
    "new_effect_explicit":7,"new_notation_only":8,"new_numeric_conflict":3,
    "japanese_reviewed_total":96,"japanese_pending":32,
    "jp_explicit":count["jp_explicit"],"jp_notation_only":count["jp_notation_only"],
    "jp_numeric_conflict":count["jp_numeric_conflict"],
    "jp_notation_disagreement":count["jp_notation_disagreement"],
    "jp_attacker_crouch_risk":count["jp_attacker_crouch_risk"],
    "jp_variant_mapping_risk":count["jp_variant_mapping_risk"],
    "new_floor_gimmick_candidate":1,"floor_hit_state_resolved":0,
    "binary_verified":0,"admin_icon_assignments":0,"production_changes":0,
    "foreign_source_final_evidence":0,
    "critical_note":"Mogura-ya explicitly defines F s as opponent crouch and FB as floor-break capable. Do not transfer that notation definition to other sites by default.",
    "risk":"Geppopotamus historical -15S versus modern Japanese -14s for three Hwoarang variants; do not override current frame data.",
    "next":"Check 32 remaining IDs; verify Bob/184 floor activation separately for grounded and airborne hit; confirm in current game build."
}
out.mkdir(parents=True,exist_ok=True)
(out/"V23_JAPANESE_REVIEW.json").write_text(json.dumps({"summary":summary,"records":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(out/"V23_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(out/"V23_STAGE_LEADS.json").write_text(json.dumps({"summary":{"stage_leads":1,"binary_verified":0,"approved":0},"rows":[{"move_id":r["move_id"],"move_name":r["move_name"],"command":r["command"],"source":r["jp_evidence"],"stage":r["v23_stage_candidate"]} for r in stage]},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
fields=["move_id","character_id","site_k","move_name","command","site_guard","jp_status","newly_reviewed_v23","jp_evidence","v23_stage_candidate","approved_icon"]
def csv_emit(name,selected):
    with (out/name).open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=fields,extrasaction="ignore");w.writeheader()
        for r in selected:
            v=dict(r)
            for k in ["jp_evidence","v23_stage_candidate"]:
                v[k]=json.dumps(v[k],ensure_ascii=False)
            w.writerow(v)
csv_emit("V23_ALL_128.csv",rows)
csv_emit("V23_NEW_18.csv",[r for r in rows if r["newly_reviewed_v23"]])
csv_emit("V23_PENDING_32.csv",[r for r in rows if r["jp_status"]=="jp_not_reviewed"])
csv_emit("V23_NUMERIC_CONFLICTS.csv",[r for r in rows if r["jp_status"]=="jp_numeric_conflict"])
print("V23_JAPANESE_REVIEW "+json.dumps(summary,ensure_ascii=False))
