#!/usr/bin/env python3
"""Check game-icon observation provenance, never auto-approve or write icon overrides."""
import json,re,sys
from pathlib import Path
review=json.loads(Path(sys.argv[1]).read_text(encoding='utf8'))
data=json.loads(Path(sys.argv[2]).read_text(encoding='utf8'))
assert data['schema']=='project-t-icon-evidence-v21' and data['purpose']=='human_observations_not_automatic_icon_assignments'
assert len(review['records'])==128
known={r['move_id']:r for r in review['records']}
allowed={'forcedcrouch','wallbreak','floorgimmick'}
hits={'standing_guard','crouching_guard','normal_ground_hit','counter_ground_hit','airborne_hit'}
observed={'present','absent','uncertain'}
methods={'in_game_attack_info','in_game_defender_reaction','game_binary_reaction_trace'}
mandatory={'move_id','character_id','site_k','move_name','command','game_version','icon_id','hit_state','observed','evidence_method','evidence_filename','evidence_sha256','defender_initial_state','defender_post_state','stage_id','stage_contact','notes','reviewed_by','verified_for_live'}
seen=set()
for row in data['observations']:
 assert set(row)==mandatory,'Missing/extra evidence properties'
 ref=known[row['move_id']]
 assert (row['character_id'],row['site_k'],row['move_name'],row['command'])==(ref['character_id'],ref['site_k'],ref['move_name'],ref['command'])
 assert re.fullmatch(r'\\d+\\.\\d{2}\\.\\d{2}(?:\\.\\d+)?',row['game_version'])
 assert row['icon_id'] in allowed and row['hit_state'] in hits and row['observed'] in observed
 assert row['evidence_method'] in methods and row['evidence_filename'] and re.fullmatch(r'[a-fA-F0-9]{64}',row['evidence_sha256'])
 assert row['defender_initial_state'] in ('standing','crouching','airborne')
 assert row['defender_post_state'] in ('standing','crouching','wall_stun','downed','airborne','uncertain')
 assert row['reviewed_by'] and row['verified_for_live'] is False
 if row['icon_id'] in ('wallbreak','floorgimmick'):assert row['stage_id'] and row['stage_contact'] in ('wall','floor','balcony')
 if row['icon_id']=='forcedcrouch' and row['hit_state']=='standing_guard':assert row['defender_initial_state']=='standing'
 k=(row['move_id'],row['game_version'],row['icon_id'],row['hit_state'],row['evidence_sha256'])
 assert k not in seen;seen.add(k)
print('PASS: '+str(len(data['observations']))+' observational evidence records validated, 0 approved icons')
