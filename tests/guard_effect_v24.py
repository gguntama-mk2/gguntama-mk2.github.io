#!/usr/bin/env python3
"""PROJECT T v24: Japanese-first 10 guard reviews + ground/air-safe floor evidence.

Read-only: no modification to game move tables or user/admin icons. A floor-break
capability reported in H/CH frame-data columns is not a ground-vs-air condition.
"""
import csv,json,re,sys
from pathlib import Path
from collections import Counter

if len(sys.argv)!=4:raise SystemExit("Usage: python tests/guard_effect_v24.py V23_JAPANESE_REVIEW.json V24_BATCH.json OUT")
basefile,batchfile,outdir=map(Path,sys.argv[1:])
base=json.loads(basefile.read_text(encoding="utf8"))
batch=json.loads(batchfile.read_text(encoding="utf8"))
assert base["summary"]["schema"]==23 and batch["schema"]==24
old=base["records"]
assert len(old)==128 and len({r["move_id"] for r in old})==128
idx={r["move_id"]:r for r in old}
add={}
allowed={"jp_conditional_guard_branch","jp_low_guard_risk","jp_notation_only","jp_numeric_conflict","jp_explicit"}
for entry in batch["new_entries"]:
    mid=entry["move_id"]; status=entry["status"]
    assert mid in idx and mid not in add,mid
    assert idx[mid]["jp_status"]=="jp_not_reviewed",(mid,idx[mid]["jp_status"])
    assert idx[mid]["site_guard"]==entry["site_guard"],(mid,idx[mid]["site_guard"],entry["site_guard"])
    assert status in allowed
    assert entry["game_binary_verified"] is False and entry["approved_icon_assignment"] is False
    sources=entry["sources"]
    assert sources
    for s in sources:
        assert s["publisher"] in {"sorao","geppopotamus","apoblog"}
        assert s["url"].startswith("https://") and s["block"] and s["version"]
    if status=="jp_conditional_guard_branch":
        assert entry["site_guard"]=="-3(-19s)" and len(sources)==1
        assert sources[0]["kind"]=="conditional_parenthesis"
    if status=="jp_low_guard_risk":
        assert len(sources)==1 and sources[0]["kind"].startswith("low_start")
    if status=="jp_notation_only":
        assert len(sources)==1 and sources[0]["kind"]=="notation"
    if status=="jp_numeric_conflict":
        assert len(sources)==2
        def number(x):
            m=re.search(r"[-+]?\d+",x.replace("±","+"))
            assert m
            return int(m.group())
        assert number(sources[0]["block"])!=number(sources[1]["block"])
        assert any(s["kind"]=="explicit_historical" for s in sources)
    if status=="jp_explicit":assert any(s["kind"]=="explicit_defender_crouch" for s in sources)
    add[mid]=entry
assert len(add)==10
rows=[]
for r in old:
    item=add.get(r["move_id"]);x=dict(r)
    if item:
        x["jp_status"]=item["status"]
        x["jp_evidence"]=[{"publisher":s["publisher"],"url":s["url"],"guard":s["block"],"source_version":s["version"],"notes":s["remark"],"evidence_kind":s["kind"]} for s in item["sources"]]
        x["newly_reviewed_v24"]=True
        x["v24_risk_note"]=(
            "Two guard outcomes in one text; do not auto-promote parenthetical s" if item["status"]=="jp_conditional_guard_branch" else
            "Low-start sequence: crouch-block and attacker's stance must be separated" if item["status"]=="jp_low_guard_risk" else
            "Historical frame mismatch; do not overwrite current numeric values" if item["status"]=="jp_numeric_conflict" else
            "Japanese source explains opponent crouch, but current binary not verified" if item["status"]=="jp_explicit" else
            "Japanese s notation only; defender effect not binary-verified")
    else:
        x["newly_reviewed_v24"]=False
        x["v24_risk_note"]="Unchanged from v23"
    x["reviewed_current_version_binary"]=False;x["approved_icon"]=False;x["overseas_used_for_approval"]=False
    rows.append(x)
counts=Counter(r["jp_status"] for r in rows)
expected={
    "jp_explicit":40,"jp_notation_only":45,"jp_numeric_conflict":11,
    "jp_conditional_guard_branch":2,"jp_low_guard_risk":2,
    "jp_notation_disagreement":4,"jp_attacker_crouch_risk":1,"jp_variant_mapping_risk":1,
    "jp_not_reviewed":22}
assert dict(counts)==expected,(dict(counts),expected)
assert len({r["move_id"] for r in rows})==128
assert all(not x["reviewed_current_version_binary"] and not x["approved_icon"] for x in rows)
floor=batch["bob_floor_lead"]
assert floor["move_id"]=="bob/184" and floor["icon"]=="floorgimmick"
assert floor["NH"]=="D^FB" and floor["CH"]=="D^FB"
assert floor["ground_hit"]==floor["air_hit"]=="unverified"
assert floor["type"]=="ability_not_activation" and floor["approved"] is False
assert idx["bob/184"]["jp_status"]=="jp_explicit"
summary={"schema":24,"date":"2026-11-05","review_total":128,
         "new_japanese_reviews":10,"japanese_reviewed_total":106,"japanese_pending":22,
         "jp_explicit":40,"jp_notation_only":45,"jp_numeric_conflict":11,
         "jp_conditional_guard_branch":2,"jp_low_guard_risk":2,
         "jp_notation_disagreement":4,"jp_attacker_crouch_risk":1,"jp_variant_mapping_risk":1,
         "floor_lead_id":"bob/184","floor_ability_source_columns":["H","CH"],
         "floor_ground_hit_verified":False,"floor_air_hit_verified":False,
         "binary_verified":0,"icon_assignment_writes":0,"production_changes":0,
         "risk":"Mogura-ya H/CH columns describe normal vs counter hit, not ground vs air initial state. Do not claim which hit states activate floor break.",
         "safeguard":"Parenthetical guard results and low block require separate stance/reaction evidence; no s-only approvals."}
outdir.mkdir(parents=True,exist_ok=True)
(outdir/"V24_JAPANESE_REVIEW.json").write_text(json.dumps({"summary":summary,"records":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
(outdir/"V24_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
(outdir/"V24_BOB184_FLOOR_MATRIX.json").write_text(json.dumps({
    "move_id":"bob/184","effect":"floorbreak","source":floor["site"],
    "japanese_source_NH":floor["NH"],"japanese_source_CH":floor["CH"],
    "ability":"japanese_site_supported","activation_by_target_state":{
       "normal_ground_hit":"unverified","counter_ground_hit":"unverified",
       "normal_airborne_hit":"unverified","counter_airborne_hit":"unverified"},
    "required_context":["target_build","stage_id","floor_type","defender_initial_state","first_contact","game_attack_info_screenshot","actual_floor_reaction"],
    "icon_assignment_approved":False,"game_binary_verified":False,
    "warning":summary["risk"]},ensure_ascii=False,indent=2)+"\n",encoding="utf8")
cols=["move_id","character_id","site_k","move_name","command","site_guard","jp_status","newly_reviewed_v24","v24_risk_note","jp_evidence","approved_icon"]
def write_csv(name,items):
    with (outdir/name).open("w",encoding="utf-8-sig",newline="") as f:
        w=csv.DictWriter(f,fieldnames=cols,extrasaction="ignore")
        w.writeheader()
        for r in items:
            x=dict(r);x["jp_evidence"]=json.dumps(x["jp_evidence"],ensure_ascii=False);w.writerow(x)
write_csv("V24_ALL_128.csv",rows)
write_csv("V24_NEW_10.csv",[r for r in rows if r["newly_reviewed_v24"]])
write_csv("V24_PENDING_22.csv",[r for r in rows if r["jp_status"]=="jp_not_reviewed"])
write_csv("V24_CONDITIONAL_GUARD.csv",[r for r in rows if r["jp_status"] in ("jp_conditional_guard_branch","jp_low_guard_risk")])
print("V24_JAPANESE_REVIEW "+json.dumps(summary,ensure_ascii=False))
