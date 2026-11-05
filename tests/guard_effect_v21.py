#!/usr/bin/env python3
"""PROJECT T v21 Japanese guard-effect review. Evidence only; no admin icon writes."""
import csv,json,re,sys
from pathlib import Path
from collections import Counter
basefile,batchfile,out=map(Path,sys.argv[1:])
base=json.loads(basefile.read_text(encoding='utf8'))
batch=json.loads(batchfile.read_text(encoding='utf8'))
assert len(base['records'])==128 and batch['schema']==21
byid={r['move_id']:r for r in base['records']}
assert len(byid)==128
changes={}
for entry in batch['entries']:
 mid=entry['move_id']
 assert mid in byid and mid not in changes
 assert byid[mid]['jp_status']=='jp_not_reviewed' and byid[mid]['site_guard']==entry['site_guard']
 assert entry['jp_status'] in ('jp_explicit','jp_notation_only','jp_numeric_conflict','jp_variant_mapping_risk')
 assert not entry['icon_approved'] and not entry['game_binary_verified'] and not entry['admin_write_allowed']
 for e in entry['jp_evidence']:
  assert e['publisher'] in ('geppopotamus','sorao','mogura-ya') and e['url'].startswith('https://') and e['source_version']
 if entry['jp_status']=='jp_explicit':assert any(x['evidence_kind']=='explicit_defender_effect' for x in entry['jp_evidence'])
 if entry['jp_status']=='jp_numeric_conflict':assert len({re.search(r'[+-]?\\d+',x['guard']).group() for x in entry['jp_evidence']})==2
 if entry['jp_status']=='jp_variant_mapping_risk':assert any(x['evidence_kind']=='related_variant_only' for x in entry['jp_evidence'])
 changes[mid]=entry
assert len(changes)==9
records=[]
for old in base['records']:
 row=dict(old);new=changes.get(row['move_id'])
 if new:
  row['jp_status']=new['jp_status']
  row['jp_evidence']=[{'publisher':r['publisher'],'url':r['url'],'guard':r['guard'],'source_version':r['source_version'],'notes':r['observation']} for r in new['jp_evidence']]
  row['newly_reviewed_v21']=True
 else:row['newly_reviewed_v21']=False
 row['approved_icon']=False;row['reviewed_current_version_binary']=False;row['overseas_used_for_approval']=False
 records.append(row)
counts=Counter(x['jp_status'] for x in records)
expected={'jp_explicit':23,'jp_notation_only':33,'jp_numeric_conflict':7,'jp_notation_disagreement':3,'jp_attacker_crouch_risk':1,'jp_variant_mapping_risk':1,'jp_not_reviewed':60}
assert dict(counts)==expected,(counts,expected)
assert len({r['move_id'] for r in records})==128
summary={'schema':21,'priority_groups':128,'new_japanese_checks':9,'japanese_reviewed_total':68,'japanese_unreviewed':60,'japanese_explicit':23,'japanese_notation_only':33,'japanese_numeric_conflict':7,'japanese_notation_disagreement':3,'japanese_attacker_crouch_risk':1,'japanese_variant_mapping_risk':1,'game_binary_verified':0,'approved_icon_assignments':0,'production_changes':0,'overseas_approval_evidence':0}
out.mkdir(parents=True,exist_ok=True)
(out/'V21_JAPANESE_REVIEW.json').write_text(json.dumps({'summary':summary,'records':records},ensure_ascii=False,indent=2)+'\\n',encoding='utf8')
(out/'V21_SUMMARY.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\\n',encoding='utf8')
cols=['move_id','character_id','site_k','move_name','command','site_guard','jp_status','newly_reviewed_v21','jp_evidence','approved_icon']
for name,selected in [('V21_NEW_9.csv',[r for r in records if r['newly_reviewed_v21']]),('V21_PENDING_60.csv',[r for r in records if r['jp_status']=='jp_not_reviewed'])]:
 with (out/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=cols,extrasaction='ignore');w.writeheader()
  for r in selected:
   row=dict(r);row['jp_evidence']=json.dumps(row['jp_evidence'],ensure_ascii=False);w.writerow(row)
print('PASS V21',json.dumps(summary,ensure_ascii=False))
