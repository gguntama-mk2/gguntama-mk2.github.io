#!/usr/bin/env python3
"""PROJECT T v16 source-checked guard forced-crouch evidence.
Input: v15's 778 reviews + 128 group CSV, curated URLs checked on 2026-11-05.
All results are isolated staging files. Never writes to site, API, or move overrides.
"""
import csv
import json
import re
import sys
from collections import Counter
from pathlib import Path

if len(sys.argv)!=5:
    raise SystemExit("Usage: python tests/guard_effect_v16.py V15_778_REVIEW.json V15_REVIEW_128_DEDUPED.csv v16-public-guard-evidence.json OUT")
v15_json,groups_csv,sources_json,out_path=map(Path,sys.argv[1:])
v15=json.loads(v15_json.read_text(encoding="utf-8"))
sources=json.loads(sources_json.read_text(encoding="utf-8"))
with groups_csv.open(encoding="utf-8-sig",newline="") as f:
    groups=list(csv.DictReader(f))
assert len(v15["reviews"])==778 and len(groups)==128
by_id={r["move_id"]:r for r in v15["reviews"]}
group_ids={r["character_id"]+"/"+str(r["site_k"]) for r in groups}
assert len(by_id)==778 and len(group_ids)==128
assert all(x in by_id for x in group_ids)

def number(v):
    """Leading frame number only; ranges and recoveries are preserved separately."""
    s=str(v).strip().replace("−","-").replace("±","+")
    match=re.match(r"^([+-]?\d+)",s)
    if not match: raise ValueError("No leading frame count: "+repr(v))
    return int(match.group(1))

evidence={}
for row in sources["entries"]:
    id=row["id"]
    assert id in group_ids,("not group leader",id)
    assert id not in evidence,("duplicate external evidence",id)
    record=by_id[id]
    assert record["last_effective_attack_level_heuristic"] in ("mid","high")
    assert not record["shared_wall_climb"]
    assert number(record["guard_value"])==number(row["block"]),(id,record["guard_value"],row["block"])
    assert row["url"].startswith("https://") and "tekkendocs.com" in row["url"]
    if row["status"]=="independent_c_match":
        assert re.search(r"(^|~)[+-]?\d+c",row["block"]), (id,row["block"])
        assert "alternative" not in row
    elif row["status"]=="source_disagreement":
        assert not re.search(r"(^|~)[+-]?\d+c",row["block"])
        assert row["alternative"]["block"].endswith("S")
        assert "強制しゃがみ" in row["alternative"]["text"]
    else: raise ValueError("unrecognized status: "+row["status"])
    evidence[id]=row
assert len(evidence)==10
assert Counter(v["status"] for v in evidence.values())=={"independent_c_match":9,"source_disagreement":1}

review=[]
for row in groups:
    mid=row["character_id"]+"/"+row["site_k"]
    a=by_id[mid]
    ext=evidence.get(mid)
    review.append({
       "move_id":mid, "character_id":a["character_id"],"site_k":a["site_k"],
       "move_name":a["move_name"],"command":a["command"],"attack":a["attack"],
       "site_guard":a["guard_value"],
       "last_attack_level_heuristic":a["last_effective_attack_level_heuristic"],
       "source_status":ext["status"] if ext else "unreviewed_external",
       "external_input":ext["input"] if ext else None,
       "external_guard":ext["block"] if ext else None,
       "external_url":ext["url"] if ext else None,
       "additional_external_url":ext.get("alternative",{}).get("url") if ext else None,
       "additional_external_guard":ext.get("alternative",{}).get("block") if ext else None,
       "external_note":ext["note"] if ext else None,
       "interpretation":"Source disagreement: confirm game version & defender reaction" if ext and ext["status"]=="source_disagreement" else
       "Independent crouch notation supports source, but not binary verified" if ext else
       "Not independently checked yet",
       "reviewed_on":sources["review_as_of"] if ext else None,
       "binary_verified":False,"official_icon_assigned":False,"admin_override_written":False
    })
counts=Counter(r["source_status"] for r in review)
summary={
 "schema":16,"source":"PROJECT T v15 128 independent review groups, manually compared public frame tables",
 "total_site_moves":9569,"v15_new_guard_only":778,"priority_review_groups":128,
 "independent_c_matches":counts["independent_c_match"],
 "source_disagreements":counts["source_disagreement"],
 "unreviewed_groups":counts["unreviewed_external"],
 "evidence_dates":[sources["review_as_of"]],
 "notation_reference":sources["reference"],
 "reina_conflict":"TekkenDocs -3, Geppopotamus -3S and explicit forced crouch for reina/107",
 "game_binary_verified":0,"icon_assignments":0,"production_changes":0,
 "next_action":"Resolve Reina source conflict in target build, then review additional 118 groups and check actual defender recovery in MOTBIN/ANMBIN.",
 "caveat":"Independent c indicates defender recovers crouching; external sites may reflect different patches. Never infer 'all 128 verified'."
}
assert summary["unreviewed_groups"]==118 and summary["independent_c_matches"]==9
assert all(not r["binary_verified"] and not r["official_icon_assigned"] and not r["admin_override_written"] for r in review)
output_dir=out_path
output_dir.mkdir(parents=True,exist_ok=True)
(output_dir/"V16_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(output_dir/"V16_128_REVIEW.json").write_text(json.dumps({"summary":summary,"reviews":review},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
csv_fields=["move_id","character_id","site_k","move_name","command","site_guard","last_attack_level_heuristic","source_status",
            "external_input","external_guard","external_url","additional_external_guard","additional_external_url","reviewed_on",
            "binary_verified","official_icon_assigned"]
with (output_dir/"V16_128_REVIEW.csv").open("w",encoding="utf-8-sig",newline="") as f:
    w=csv.DictWriter(f,fieldnames=csv_fields,extrasaction="ignore");w.writeheader();w.writerows(review)
with (output_dir/"V16_10_EXTERNAL_CHECKS.csv").open("w",encoding="utf-8-sig",newline="") as f:
    w=csv.DictWriter(f,fieldnames=csv_fields,extrasaction="ignore");w.writeheader();w.writerows(r for r in review if r["source_status"]!="unreviewed_external")
print("V16_PUBLIC_EVIDENCE",json.dumps(summary,ensure_ascii=False))
