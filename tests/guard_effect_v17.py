#!/usr/bin/env python3
"""V17 Japanese-source-first evidence review for forced crouch (read-only).

Keep overseas sources as investigative leads only. Require direct Japanese
annotation for 'Japanese corroborated'; version disagreement remains unresolved.
Never write icon overrides. The underlying game binary is not present.
"""
import csv, json, re, sys
from collections import Counter
from pathlib import Path

if len(sys.argv)!=4:
    raise SystemExit('Usage: python tests/guard_effect_v17.py V16_128_REVIEW.json v17-japanese-source-review.json OUT')
v16_file,review_file,out=map(Path,sys.argv[1:])
v16=json.loads(v16_file.read_text(encoding='utf-8'))
source=json.loads(review_file.read_text(encoding='utf-8'))
moves=v16['reviews']; by_id={r['move_id']:r for r in moves}
assert len(moves)==len(by_id)==128
jp={r['move_id']:r for r in source['reviewed']}
assert len(jp)==14 and len(set(jp))==14
assert set(jp)<=set(by_id)
assert source['schema']==17
out_records=[]
for previous in moves:
    id=previous['move_id']
    evidence=jp.get(id)
    if evidence:
        assert previous['site_guard']==evidence['project_t_guard'],(id,previous['site_guard'],evidence['project_t_guard'])
        status=evidence['japanese_status']
        assert status in {'jp_explicit','jp_notation_only','jp_numeric_conflict'}
        for ref in evidence['jp_sources']:
            assert ref['url'].startswith('https://')
            assert ref['publisher'] in ('geppopotamus','sorao')
            assert 'geppopotamus.info' in ref['url'] or 'tekken8.sorao.site' in ref['url']
        # The Japanese sources' current-vs-old numeric frame disagreement is
        # retained as a flagged exception rather than hidden by matching suffix.
        if status=='jp_numeric_conflict':
            nums={re.search(r'[-+]?\d+',str(x['guard'])).group(0) for x in evidence['jp_sources']}
            assert len(nums)>=2,(id,nums)
    else:
        status='jp_not_reviewed'
    out_records.append({
        'move_id':id,'character_id':previous['character_id'],'site_k':previous['site_k'],
        'move_name':previous['move_name'],'command':previous['command'],'site_guard':previous['site_guard'],
        'jp_status':status,'jp_evidence':evidence['jp_sources'] if evidence else [],
        'previous_overseas_status_for_history_only':previous['source_status'],
        'overseas_used_for_approval':False,
        'reviewed_current_version_binary':False,
        'approved_icon':False,
        'next_task':'Verify current game reaction and patch for numerical disagreement' if status=='jp_numeric_conflict'
          else 'Verify with game current build' if status=='jp_explicit'
          else 'Check Japanese notes for explicit opponent forced crouch, then game' if status=='jp_notation_only'
          else 'Find matching Japanese frame-data page or test in game'
    })
counts=Counter(x['jp_status'] for x in out_records)
assert counts=={'jp_explicit':7,'jp_notation_only':5,'jp_numeric_conflict':2,'jp_not_reviewed':114},counts
for r in out_records:
    assert not r['overseas_used_for_approval'] and not r['reviewed_current_version_binary'] and not r['approved_icon']
lookup={r['move_id']:r for r in out_records}
assert lookup['reina/107']['jp_status']=='jp_explicit'
assert lookup['reina/107']['previous_overseas_status_for_history_only']=='source_disagreement'
assert lookup['jack8/106']['jp_status']=='jp_numeric_conflict'
assert lookup['king/106']['jp_status']=='jp_numeric_conflict'
summary={
    'schema':17,'review_date':'2026-11-05','total_priority_groups':128,
    'japanese_effect_supported':7,'japanese_notation_only':5,
    'japanese_frame_number_disputed':2,'unreviewed_by_japanese_sources':114,
    'overseas_sources_used_as_final_evidence':0,'game_binary_verified':0,
    'new_admin_icon_assignments':0,'production_changes':0,
    'policy':'Japanese sources take precedence; overseas resources may suggest research directions but NEVER confirm a move. Japanese sources do not replace game binary proof.',
    'important_updates':{
        'reina/107':'Geppopotamus -3S explicit forced crouch; Japanese season 3 -3s. Reclassify v16 English-only discrepancy as overseas disagreement only.',
        'jack8/106':'Current Japanese season 3 -4s vs older Japanese -8S; effect candidate but numerical conflict.',
        'king/106':'Current Japanese season 3 -16s vs older Japanese -17S; effect candidate but numerical conflict.'
    }
}
out.mkdir(parents=True,exist_ok=True)
(out/'V17_JAPANESE_REVIEW.json').write_text(json.dumps({'summary':summary,'records':out_records},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(out/'V17_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
fields=['move_id','character_id','site_k','move_name','command','site_guard','jp_status','jp_evidence',
        'previous_overseas_status_for_history_only','reviewed_current_version_binary','approved_icon','next_task']
with (out/'V17_128_JAPANESE_EVIDENCE.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore')
    w.writeheader()
    for r in out_records:
        row=dict(r);row['jp_evidence']=json.dumps(row['jp_evidence'],ensure_ascii=False);w.writerow(row)
with (out/'V17_14_JAPANESE_REVIEWED.csv').open('w',encoding='utf-8-sig',newline='') as f:
    w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore')
    w.writeheader()
    for r in out_records:
        if r['jp_status']!='jp_not_reviewed':
            row=dict(r);row['jp_evidence']=json.dumps(row['jp_evidence'],ensure_ascii=False);w.writerow(row)
print('V17_JP_PRIORITY',json.dumps(summary,ensure_ascii=False))
