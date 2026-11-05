#!/usr/bin/env node
/* PROJECT T v12 read-only candidate preview, no game-binary claims or admin API writes */
import fs from 'node:fs';
import path from 'node:path';
const [,,source,out]=process.argv;
if(!source||!out)throw Error('Usage: node tools/build-icon-review-v12.mjs V9_JSON OUTPUT_DIRECTORY');
const input=JSON.parse(fs.readFileSync(source,'utf8')).rows;
if(!Array.isArray(input)||input.length!==1741)throw Error('Unexpected source rows: '+input?.length);
const yesNormal=s=>/(?<!カウンター)ヒット\s*[:：]\s*壁やられ/.test(s);
const yesCounter=s=>/カウンター\s*[:：]\s*壁やられ/.test(s);
const noNormal=s=>/ヒット\s*[:：]\s*なし/.test(s);
const noCounter=s=>/カウンター\s*[:：]\s*なし/.test(s);
const make=(reaction,wall,floor,pink,tornado=false)=>{
 const icons=[];
 if(reaction==='yes'||wall)icons.push({id:'wallbreak',label:reaction==='yes'&&wall?'壁やられ・壁ギミック':reaction==='yes'?'壁やられ':'壁ギミック',evidence:'site',tornado});
 if(floor)icons.push({id:'floorgimmick',label:'床ギミック',evidence:'site',tornado:false});
 if(pink)icons.push({id:'forcedcrouch',label:'強制しゃがみ候補',evidence:'notation_only',tornado:false});
 return {wall_reaction:reaction,wall_gimmick:!!wall,floor_gimmick:!!floor,forced_crouch_s:!!pink,requires_tornado:!!tornado,icons};
};
const records=[];
for(const r of input){
 const wr=String(r.wall_raw||''),wm=r.wall_modes||{},fm=r.floor_modes||{};
 const n=yesNormal(wr)?'yes':noNormal(wr)?'no':'unknown';
 const c=yesCounter(wr)?'yes':noCounter(wr)?'no':'unknown';
 const normal=make(n,!!r.wall_gimmick_site&&!!wm.normal,!!r.floor_gimmick_site&&!!fm.normal,!!r.forced_crouch_hit_suffix);
 const counter=make(c,!!r.wall_gimmick_site&&!!wm.counter,!!r.floor_gimmick_site&&!!fm.counter,!!r.forced_crouch_counter_suffix);
 const air=make('unknown',!!r.wall_gimmick_site&&!!wm.air,!!r.floor_gimmick_site&&!!fm.air,false,!!wm.tornado_only);
 const review=['jin/44','kazuya/20','alisa/42'].includes(r.character_id+'/'+r.site_k);
 records.push({character_id:r.character_id,character_name:r.character_name,site_k:r.site_k,move_name:r.move_name,command:r.command,
  normal,counter,air,
  guard_s_review:!!r.guard_suffix_s_review_only,
  attacker_crouch_is_not_opponent:!!r.attacker_crouch_status,
  wall_note_hit_state_missing:!!r.wall_reaction_site&&n==='unknown'&&c==='unknown',
  wall_stage_condition_missing:!!r.wall_gimmick_site&&!r.wall_modes,
  independently_compared_example:review,
  raw:{hit:r.hit,counter:r.counter,guard:r.guard,wall:r.wall_raw,gimmick:r.gimmick_raw},
  binary_verified:false,allow_auto_assign:false});
}
const count=fn=>records.filter(fn).length,has=(r,state,id)=>r[state].icons.some(i=>i.id===id);
const stats={
 schema:12,source:'PROJECT T site fields; NOT raw Tekken 8 binary',
 characters:44,site_moves:9569,candidates:records.length,
 wall_normal:count(r=>has(r,'normal','wallbreak')),wall_counter:count(r=>has(r,'counter','wallbreak')),wall_air:count(r=>has(r,'air','wallbreak')),
 floor_normal:count(r=>has(r,'normal','floorgimmick')),floor_counter:count(r=>has(r,'counter','floorgimmick')),floor_air:count(r=>has(r,'air','floorgimmick')),
 pink_normal:count(r=>has(r,'normal','forcedcrouch')),pink_counter:count(r=>has(r,'counter','forcedcrouch')),
 pink_guard_review:count(r=>r.guard_s_review),
 air_wall_tornado_only:count(r=>r.air.requires_tornado),
 ground_normal_wall_no:count(r=>r.normal.wall_reaction==='no'),
 ground_counter_wall_no:count(r=>r.counter.wall_reaction==='no'),
 counter_only_wall:count(r=>r.normal.wall_reaction==='no'&&r.counter.wall_reaction==='yes'),
 normal_only_wall:count(r=>r.normal.wall_reaction==='yes'&&r.counter.wall_reaction==='no'),
 wall_stage_condition_missing:count(r=>r.wall_stage_condition_missing),
 game_binary_verified:0,icon_assignments_saved:0
};
const expected={wall_normal:227,wall_counter:435,wall_air:140,floor_normal:11,floor_counter:12,floor_air:57,
 pink_normal:607,pink_counter:419,air_wall_tornado_only:3,ground_normal_wall_no:213,ground_counter_wall_no:14,
 counter_only_wall:213,normal_only_wall:14,wall_stage_condition_missing:2};
for(const [k,v] of Object.entries(expected))if(stats[k]!==v)throw Error(k+' expected '+v+' got '+stats[k]);
if(new Set(records.map(r=>r.character_id+'/'+r.site_k)).size!==records.length)throw Error('Duplicate move IDs');
if(records.some(r=>r.binary_verified||r.allow_auto_assign))throw Error('Unsafe flag');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(out,'icons'),{recursive:true});
fs.writeFileSync(path.join(out,'v12_icon_candidates.json'),JSON.stringify({stats,records},null,2)+'\n');
fs.writeFileSync(path.join(out,'v12_summary.json'),JSON.stringify(stats,null,2)+'\n');
const quote=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const csv=[['character_id','site_k','move_name','command','hit_state','wall_reaction','wall_icon_hint','floor_icon_hint','crouch_s_hint','tornado_only','game_binary_verified'].join(',')];
for(const r of records)for(const state of ['normal','counter','air']){
 const s=r[state];
 csv.push([r.character_id,r.site_k,r.move_name,r.command,state,s.wall_reaction,has(r,state,'wallbreak'),has(r,state,'floorgimmick'),has(r,state,'forcedcrouch'),s.requires_tornado,false].map(quote).join(','));
}
fs.writeFileSync(path.join(out,'v12_state_icon_hints.csv'),'\ufeff'+csv.join('\r\n')+'\r\n');
fs.copyFileSync('test-data/v12_icon_review_template.html',path.join(out,'v12_icon_review.html'));
for(const file of ['wallbreak.webp','floorgimmick.webp','forcedcrouch.webp']){
 const from=path.join('icons',file);if(!fs.existsSync(from))throw Error('Missing actual site icon: '+from);
 fs.copyFileSync(from,path.join(out,'icons',file));
}
console.log('V12_ICON_REPORT '+JSON.stringify(stats));
