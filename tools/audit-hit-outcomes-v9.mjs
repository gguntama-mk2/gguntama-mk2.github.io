#!/usr/bin/env node
/**
 * PROJECT T stage/wall/forced-crouch hit-state audit.
 * The source is the PROJECT T SITE data, not MOTBIN/ANMBIN, and no icon assignments are made.
 * No production writes. No API calls. Preserve character_id/k.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
const [,,siteFile,outDir]=process.argv;
if(!siteFile||!outDir)throw Error('Usage: node tools/audit-hit-outcomes-v9.mjs pc.html output');
const raw=fs.readFileSync(siteFile,'utf8');
const i=raw.indexOf('const CHARACTERS = ['),j=raw.indexOf('\n];',i);
if(i<0||j<0)throw Error('CHARACTERS declaration not found');
const chars=vm.runInNewContext('('+raw.slice(i+'const CHARACTERS = '.length,j+2)+')',{}, {timeout:45000});
const all=[],wall=[],floor=[],gimmick=[],forced=[],guardReview=[],priority=[],keys=new Set(),counts={};
const suffixS=v=>/[+−\-±]?\d+s(?:$|\b)/.test(String(v??''));
const hasWall=s=>/ウォールブレイク|ハードウォールブレイク|ウォールブラスト|ウォールバウンド|バルコニーブレイク/.test(s);
const hasFloor=s=>/フロアブレイク|ハードフロアブレイク|フロアブラスト/.test(s);
const modes=s=>({normal:/ノーマル/.test(s),counter:/カウンター/.test(s),air:/空中ヒット/.test(s),tornado_only:/トルネードを誘発した時のみ/.test(s)});
const mark=(r,f,v)=>{if(v)r.evidence_fields.push(f)};
for(const c of chars)for(const mv of c.moves){
 const a=mv.a??{},id=c.id+'/'+mv.k;
 if(keys.has(id))throw Error('duplicate fixed identity: '+id); keys.add(id);
 const wallRaw=String(a.wall??''),gimRaw=String(a.gimmick??'');
 const gmWall=hasWall(gimRaw),gmFloor=hasFloor(gimRaw);
 const wc=gimRaw.match(/※壁：([^\n]+)/)?.[1]??'';
 const fc=gimRaw.match(/※床：([^\n]+)/)?.[1]??'';
 const wh=wallRaw.includes('壁やられ');
 const guardS=suffixS(a.guard),hitS=suffixS(a.hit),counterS=suffixS(a.counter);
 const record={
  character_id:c.id,character_name:c.name,site_k:mv.k,move_name:mv.name,
  command:a.command??'',attack:a.attack??'',guard:a.guard??'',hit:a.hit??'',counter:a.counter??'',
  wall_raw:wallRaw,gimmick_raw:gimRaw,
  wall_reaction_site:wh,wall_gimmick_site:gmWall,floor_gimmick_site:gmFloor,
  wall_modes:wc?modes(wc):null,floor_modes:fc?modes(fc):null,
  wall_condition_text:wc,floor_condition_text:fc,
  forced_crouch_hit_suffix:hitS,forced_crouch_counter_suffix:counterS,
  guard_suffix_s_review_only:guardS,
  attacker_crouch_status:a.crouch==='あり',
  evidence_fields:[],game_binary_verified:false,game_icon_assigned:false
 };
 for(const [f,v] of [['a.wall',wh],['a.gimmick.wall',gmWall],['a.gimmick.floor',gmFloor],['a.hit',hitS],['a.counter',counterS],['a.guard',guardS]])mark(record,f,v);
 if(wh||gmWall)wall.push(record);
 if(gmFloor)floor.push(record);
 if(gmFloor||gmWall)gimmick.push(record);
 if(hitS||counterS)forced.push(record);
 if(guardS&&!hitS&&!counterS)guardReview.push(record);
 if((gmWall&&!wc)||(gmFloor&&!fc)||(gmFloor&&gmWall)||((record.wall_modes||{}).tornado_only))priority.push(record);
 if(wh||gmWall||gmFloor||hitS||counterS)all.push(record);
}
if(chars.length!==44||keys.size!==9569)throw Error('unexpected site count '+chars.length+'/'+keys.size);
const cw={};const cf={};for(const r of gimmick){
 if(r.wall_gimmick_site){for(const [k,v] of Object.entries(r.wall_modes||{}))if(v)cw[k]=(cw[k]||0)+1;if(!r.wall_modes)cw['unspecified']=(cw['unspecified']||0)+1}
 if(r.floor_gimmick_site){for(const [k,v] of Object.entries(r.floor_modes||{}))if(v)cf[k]=(cf[k]||0)+1;if(!r.floor_modes)cf['unspecified']=(cf['unspecified']||0)+1}
}
const sum={
 schema:2,origin:'PROJECT T cloned site data, not direct TEKKEN 8 raw binary',
 site_sha256:crypto.createHash('sha256').update(raw).digest('hex'),
 total_characters:chars.length,total_site_moves:keys.size,
 wall_reaction_rows:wall.filter(r=>r.wall_reaction_site).length,
 wall_gimmick_rows:gimmick.filter(r=>r.wall_gimmick_site).length,
 floor_gimmick_rows:floor.length,
 wall_any_rows:wall.length,
 wall_floor_any_rows:new Set([...wall,...floor].map(r=>r.character_id+'/'+r.site_k)).size,
 wall_floor_overlap_rows:gimmick.filter(r=>r.wall_gimmick_site&&r.floor_gimmick_site).length,
 wall_reaction_gimmick_overlap:wall.filter(r=>r.wall_reaction_site&&r.wall_gimmick_site).length,
 forced_crouch_hit_rows:forced.filter(r=>r.forced_crouch_hit_suffix).length,
 forced_crouch_counter_rows:forced.filter(r=>r.forced_crouch_counter_suffix).length,
 forced_crouch_hit_or_counter_unique:forced.length,
 guard_suffix_s_only_review:guardReview.length,
 attacker_crouch_status_rows:chars.reduce((n,c)=>n+c.moves.filter(m=>m.a?.crouch==='あり').length,0),
 all_distinct_candidate_rows:all.length,
 wall_conditions:cw,floor_conditions:cf,
 binary_verified:0, icon_assignments:0,
 risk:'s suffix is a site notation; block s may also mean attacking character returns crouching. Do not equate attacker crouch status with opponent forced crouch.',
 policy:'Do not write icons automatically or change production, do not fabricate game attributes.'
};
fs.mkdirSync(outDir,{recursive:true});
const json=(name,obj)=>fs.writeFileSync(path.join(outDir,name),JSON.stringify(obj,null,2)+'\n');
json('HIT_OUTCOMES_V9_SUMMARY.json',sum);
json('HIT_OUTCOMES_V9_CANDIDATES.json',{summary:sum,rows:all});
const columns=['character_id','character_name','site_k','move_name','command','attack','guard','hit','counter','wall_reaction_site','wall_gimmick_site','floor_gimmick_site','wall_normal','wall_counter','wall_air','wall_tornado_only','floor_normal','floor_counter','floor_air','forced_crouch_hit_suffix','forced_crouch_counter_suffix','guard_suffix_s_review_only','attacker_crouch_status','wall_raw','gimmick_raw','evidence_fields','game_binary_verified'];
const value=(r,k)=>k==='wall_normal'?r.wall_modes?.normal??false:k==='wall_counter'?r.wall_modes?.counter??false:k==='wall_air'?r.wall_modes?.air??false:k==='wall_tornado_only'?r.wall_modes?.tornado_only??false:k==='floor_normal'?r.floor_modes?.normal??false:k==='floor_counter'?r.floor_modes?.counter??false:k==='floor_air'?r.floor_modes?.air??false:k==='evidence_fields'?r.evidence_fields.join('|'):r[k]??'';
const quote=x=>'"'+String(x).replaceAll('"','""')+'"';
const csv=(name,rows)=>fs.writeFileSync(path.join(outDir,name),'\ufeff'+[columns.join(','),...rows.map(r=>columns.map(k=>quote(value(r,k))).join(','))].join('\r\n')+'\r\n');
csv('V9_WALL_FAMILY.csv',wall);
csv('V9_FLOOR_GIMMICK.csv',floor);
csv('V9_FORCED_CROUCH_HIT_CANDIDATES.csv',forced);
csv('V9_GUARD_S_REVIEW_ONLY.csv',guardReview);
csv('V9_PRIORITY_STAGE_REVIEW.csv',priority);
json('V9_PRIORITY_STAGE_REVIEW.json',priority);
console.log('V9_HIT_OUTCOMES_SUMMARY '+JSON.stringify(sum));
