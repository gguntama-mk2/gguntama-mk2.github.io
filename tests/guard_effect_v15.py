#!/usr/bin/env python3
"""PROJECT T v15: read-only next-action review of 778 new guard-s candidates.

Consumes the already checked v14 source derived from current PC/SP site files.
Never writes to move-icons.js, override API, production, or users' icon choices.
'External match' is independent frame-table corroboration, not game-binary proof.
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

if len(sys.argv) != 3:
    raise SystemExit("Usage: python tests/guard_effect_v15.py V14_GUARD_REVIEW.json OUT_DIR")
source, output_dir = Path(sys.argv[1]), Path(sys.argv[2])
dataset = json.loads(source.read_text(encoding="utf-8"))
records = dataset["reviews"]
new = [r for r in records if r["review_origin"] == "new_guard_s_only"]
assert len(records) == 1166 and len(new) == 778

def last_effective_hit(attack):
    """Find last strike level, ignoring special movement and attack-throw suffixes."""
    parts = [p.strip() for p in re.split(r"[,，]", str(attack or "")) if p.strip()]
    for token in reversed(parts):
        if token.startswith(("特下", "下")): return "low", token
        if token.startswith(("特中", "中")): return "mid", token
        if token.startswith("上"): return "high", token
    return "unknown", None

# Individually grounded, hand-reviewed matches from currently viewable TekkenDocs:
# English inputs are translated from Japanese direction/button notation. Do not
# copy their suffix values blindly; source dialect must be interpreted separately.
external = {
    "king/60": dict(site_command="1RP", guard="-5s", external_command="db+2",
        external_guard="-5c", external_hit_level="m", comparison="supporting",
        source_url="https://tekkendocs.com/t8/king", source_name="TekkenDocs"),
    "bryan/125": dict(site_command="66RK", guard="-9s", external_command="f,F+4",
        external_guard="-9c~-6c", external_hit_level="h", comparison="supporting_range_start",
        source_url="https://tekkendocs.com/t8/bryan/f%2CF4", source_name="TekkenDocs"),
    "kazuya/80": dict(site_command="66LK", guard="-3s", external_command="f,F+3",
        external_guard="-3c", external_hit_level="m", comparison="supporting",
        source_url="https://tekkendocs.com/t8/kazuya/f%2CF3", source_name="TekkenDocs"),
}

out_rows = []
for r in new:
    effective, token = last_effective_hit(r["attack"])
    wall_climb = "壁登り反転攻撃" in r["move_name"]
    preceding_special = r["last_attack_group"] == "ambiguous"
    if effective == "low":
        queue = "hold_low_strike_or_crouch_block"
    elif wall_climb:
        queue = "shared_wall_climb_special_review"
    elif effective in ("mid", "high"):
        queue = "targeted_external_or_binary_verification"
    else:
        queue = "unknown_attack_level_review"
    compared = external.get(r["move_id"])
    if compared:
        assert r["command"] == compared["site_command"], r["move_id"]
        assert r["guard_value"] == compared["guard"], r["move_id"]
        assert effective == ("high" if compared["external_hit_level"] == "h" else "mid")
    signature = " | ".join((r["character_id"], r["command"], r["guard_value"], r["attack"]))
    out_rows.append({
        "character_id": r["character_id"], "site_k": r["site_k"], "move_id": r["move_id"],
        "move_name": r["move_name"], "command": r["command"], "attack": r["attack"],
        "guard_value": r["guard_value"], "last_raw_attack_level": r["last_attack_group"],
        "last_effective_attack_level_heuristic": effective, "effective_token": token,
        "has_trailing_special_or_throw": preceding_special, "shared_wall_climb": wall_climb,
        "queue": queue, "signature": signature, "external_match": compared,
        "game_binary_verified": False, "icon_auto_set": False,
        "caution": "last_effective_attack is heuristic, not game hit-reaction proof",
    })

assert len(out_rows) == len({r["move_id"] for r in out_rows}) == 778
priority = [r for r in out_rows if r["last_raw_attack_level"] != "low"]
lowlike = [r for r in out_rows if r["last_effective_attack_level_heuristic"] == "low"]
potential = [r for r in priority if r["last_effective_attack_level_heuristic"] in ("mid","high")]
non_shared = [r for r in potential if not r["shared_wall_climb"]]
groups = defaultdict(list)
for r in non_shared: groups[r["signature"]].append(r["move_id"])
unique_representatives = {}
for sig, members in groups.items():
    unique_representatives[members[0]] = members
for r in out_rows:
    r["review_group_leader"] = r["move_id"] if r["move_id"] in unique_representatives else (
        next((k for k, v in unique_representatives.items() if r["move_id"] in v), None))
    r["is_group_member_duplicate"] = bool(r["review_group_leader"] and r["review_group_leader"] != r["move_id"])

summary = {
    "schema":15, "source": "PROJECT T v14 site data; externally cross-checked only for specific examples",
    "all_site_moves":9569, "guard_s_total":1166, "new_guard_only":778,
    "previous_priority":len(priority),
    "previous_ambiguous_reclassified":dict(Counter(r["last_effective_attack_level_heuristic"] for r in priority if r["last_raw_attack_level"] == "ambiguous")),
    "low_related_total":len(lowlike),
    "remaining_mid_or_high":len(potential),
    "shared_wall_climb_within_mid_or_high":len(potential)-len(non_shared),
    "non_wall_climb_mid_or_high":len(non_shared),
    "unique_review_signatures":len(unique_representatives),
    "duplicate_signature_members":len(non_shared)-len(unique_representatives),
    "independent_frame_table_examples":len(external),
    "example_ids":sorted(external),
    "review_queue_counts":dict(Counter(r["queue"] for r in out_rows)),
    "game_binary_confirmed":0, "admin_icon_writes":0,
    "policy":"No automatic forced-crouch icon assignment. The 'low' category is only deprioritized, not disproved."
}
checks = {
    "previous_priority":243, "low_related_total":623, "remaining_mid_or_high":155,
    "shared_wall_climb_within_mid_or_high":21, "non_wall_climb_mid_or_high":134,
    "unique_review_signatures":128, "duplicate_signature_members":6,
    "independent_frame_table_examples":3,
}
for k,v in checks.items():
    assert summary[k] == v, (k,summary[k],v)
assert summary["previous_ambiguous_reclassified"] == {"low":88,"mid":37,"high":1}
assert all(not r["game_binary_verified"] and not r["icon_auto_set"] for r in out_rows)

output_dir.mkdir(parents=True, exist_ok=True)
(output_dir/"V15_PRIORITY_SUMMARY.json").write_text(json.dumps(summary,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(output_dir/"V15_778_REVIEW.json").write_text(json.dumps({"summary":summary,"reviews":out_rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
fields = ["character_id","site_k","move_name","command","attack","guard_value","last_raw_attack_level",
    "last_effective_attack_level_heuristic","has_trailing_special_or_throw","shared_wall_climb",
    "queue","review_group_leader","is_group_member_duplicate","external_match","game_binary_verified"]
def csvwrite(filename,rows):
    with (output_dir/filename).open("w",encoding="utf-8-sig",newline="") as f:
        writer=csv.writer(f);writer.writerow(fields)
        for r in rows:
            writer.writerow([json.dumps(r[k],ensure_ascii=False) if isinstance(r.get(k),dict) else r.get(k,"") for k in fields])
csvwrite("V15_ALL_NEW_778.csv",out_rows)
csvwrite("V15_REVIEW_134.csv",non_shared)
csvwrite("V15_REVIEW_128_DEDUPED.csv",[r for r in non_shared if r["review_group_leader"]==r["move_id"]])
csvwrite("V15_EXTERNAL_MATCH_3.csv",[r for r in out_rows if r["external_match"]])
print("V15_PRIORITY_SUMMARY "+json.dumps(summary,ensure_ascii=False))
