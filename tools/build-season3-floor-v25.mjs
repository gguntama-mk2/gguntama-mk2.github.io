#!/usr/bin/env node
/**
 * PROJECT T v25 - read-only Season 3 ground slam / floor-gimmick source audit.
 * Read live-clone pc.html or sp.html directly; never write main or move icons.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const [,,siteFile,v24File,evidenceFile,outDir]=process.argv;
if(!siteFile||!v24File||!evidenceFile||!outDir)
  throw Error('node tools/build-season3-floor-v25.mjs pc.html V24_JAPANESE_REVIEW.json v25-season3-special-slam-evidence.json OUT');
const source=fs.readFileSync(siteFile,'utf8');
const start=source.indexOf('const CHARACTERS = [');
const end=source.indexOf('\n];',start);
if(start<0||end<0)throw Error('No embedded CHARACTERS array');
const chars=vm.runInNewContext('('+source.slice(start+'const CHARACTERS = '.length,end+2)+')',{}, {timeout:45000});
if(chars.length!==44||chars.reduce((n,c)=>n+c.moves.length,0)!==9569)
  throw Error('Production-mirror source changed. Revalidate before applying.');
const v24=JSON.parse(fs.readFileSync(v24File,'utf8'));
const input=JSON.parse(fs.readFileSync(evidenceFile,'utf8'));
if(v24.summary.schema!==24||v24.records.length!==128||input.schema!==25)
  throw Error('Invalid previous evidence');
if(input.safety.current_game_binary_verified!==false||input.safety.existing_icons_modified!==false)
  throw Error('Unexpected write/binary-verified flag');

const moves=new Map();
for(const c of chars)for(const m of c.moves){
 const key=c.id+'/'+m.k;
 if(moves.has(key))throw Error('Duplicate move '+key);
 moves.set(key,{move_id:key,character_id:c.id,site_k:m.k,move_name:m.name,command:String(m.a?.command||''),attack:String(m.a?.attack||''),
   hit:String(m.a?.hit||''),counter:String(m.a?.counter||''),guard:String(m.a?.guard||''),
   floor:String(m.a?.gimmick||''),wall:String(m.a?.wall||'')});
}
const anchored=['bob/184','heihachi/97','alisa/227'].map(k=>moves.get(k));
if(anchored.some(x=>!x))throw Error('Missing site anchor');
const [bob,heihachi,alisa]=anchored;
if(!bob.move_name.includes('パーフェクトプレス')||!bob.command.includes('スピナーボール'))
  throw Error('Bob site key no longer matches');
if(!heihachi.move_name.includes('拳骨落とし')||!heihachi.command.includes('7WP'))
  throw Error('Heihachi site key no longer matches');
if(!alisa.move_name.includes('ショートカット')||!alisa.command.includes('7LP'))
  throw Error('Alisa site key no longer matches');
if(!alisa.counter.includes('新叩きつけ')||!alisa.floor.includes('カウンターヒット時'))
  throw Error('Alisa counter reaction/floor source changed');

const holds=[...moves.values()].filter(m=>m.character_id==='heihachi' &&
   m.move_name.includes('拳骨落とし') &&
   (m.command.includes('ホールド')||/強/.test(m.move_name)));
const held=holds.find(m=>m.command.includes('7WP')||m.move_name.includes('拳骨落とし(強)'))||null;
const heldId=held?.move_id||heihachi.move_id;
const intendedHold=input.provisional_reaction_family.anchor_members.find(r=>r.variant.includes('ホールド'));
if(!intendedHold || heldId!==intendedHold.move_id)
  throw Error('Heihachi hold site key differs from evidence fixture: '+heldId+' vs '+intendedHold?.move_id);
if(!input.reported_floor_effects.some(r=>r.move_id===heldId&&r.variant.includes('ホールド')))
  throw Error('Held floor evidence ID mismatch');
const alias=input.provisional_reaction_family.alias;
const point=(caseId,move,variant,hitState,{sameGroundReaction=false,floorMode='unknown',sourceKeys=[],caution=''})=>({
 case_id:caseId,
 character_id:move.character_id,site_k:move.site_k,site_move_id:move.move_id,site_move_name:move.move_name,
 command:move.command,variant,hit_state:hitState,
 provisional_ground_reaction_family:sameGroundReaction?alias:null,
 internal_reaction_id:null,
 floor_gimmick_claim:floorMode,
 source_categories:sourceKeys,
 game_binary_verified:false,official_icon_assignment_approved:false,
 stage_dependency:'compatible floor stage and actual physical trigger conditions must hold',
 note:caution
});
const cases=[
 point('bob_ground_NH',bob,'スピナーボール中','ground_normal',
   {sameGroundReaction:true,floorMode:'user_reported_and_JP_H_FB',sourceKeys:['user_observation','Mogura-ya H=D^FB']}),
 point('bob_ground_CH',bob,'スピナーボール中','ground_counter',
   {sameGroundReaction:true,floorMode:'user_reported_and_JP_CH_FB',sourceKeys:['user_observation','Mogura-ya CH=D^FB']}),
 point('bob_airborne',bob,'スピナーボール中','airborne',
   {sameGroundReaction:false,floorMode:'user_reported',sourceKeys:['user_observation'],
     caution:'Airborne FLOOR activation reported; airborne reaction family is NOT asserted identical to ground.'}),
 point('heihachi_7WP_hold_ground_NH',held||heihachi,'7WPホールド','ground_normal',
   {sameGroundReaction:true,floorMode:'JP_article_supported',sourceKeys:['user_observation','538 Japanese Season3 analysis'],
     caution:held?'Hold variant exists as separate site key; use it.':'Hold variant has no separate key; use base key plus HOLD modifier, never confuse with unheld normal hit.'}),
 point('heihachi_7WP_hold_ground_CH',held||heihachi,'7WPホールド','ground_counter',
   {sameGroundReaction:true,floorMode:'JP_article_supported_and_site_hit',sourceKeys:['PROJECT T a.counter','538 Japanese Season3 analysis'],
     caution:'Held CH carries the same existing site hit label as held NH. Does not imply identical internal reaction IDs.'}),
 point('heihachi_7WP_unheld_ground_CH',heihachi,'7WP非ホールド','ground_counter',
   {sameGroundReaction:true,floorMode:'JP_article_supported',sourceKeys:['538 Japanese Season3 analysis'],
     caution:'Article reports unheld CH special slam. Do not mark unheld NH as equivalent.'}),
 point('alisa_7LP_ground_CH',alisa,'7LP','ground_counter',
   {sameGroundReaction:true,floorMode:'site_explicit_counter',sourceKeys:['user_observation','PROJECT T a.counter','PROJECT T a.gimmick']}),
 point('alisa_7LP_airborne',alisa,'7LP','airborne',
   {sameGroundReaction:false,floorMode:alisa.floor.includes('空中ヒット時')?'site_explicit_air':'unknown',sourceKeys:['PROJECT T a.gimmick'],
     caution:'Site lists airborne stage gimmick; no claim airborne reaction matches the special ground slam.'})
];
const floorTrue=cases.filter(r=>r.floor_gimmick_claim!=='unknown');
if(cases.length!==8||floorTrue.length!==8||cases.filter(r=>r.provisional_ground_reaction_family).length!==6)
 throw Error('Unexpected state-case matrix counts');
if(new Set(cases.map(x=>x.case_id)).size!==7)throw Error('Duplicate case IDs');
for(const c of cases){
 if(c.game_binary_verified||c.official_icon_assignment_approved||c.internal_reaction_id!==null)
   throw Error('Accidental approval or invented numeric ID');
}
const summary={
 schema:25,source_site_sha256:crypto.createHash('sha256').update(source).digest('hex'),
 previous_japanese_crouch_review:{total:128,pending:22,updated_in_v25:0},
 source_characters:chars.length,source_moves:moves.size,
 compared_anchor_moves:3,hold_variant_site_key:heldId,hold_variant_is_separate_site_key:heldId!==heihachi.move_id,
 source_held_candidates:holds.map(x=>({move_id:x.move_id,move_name:x.move_name,command:x.command})),
 evidence_cases:cases.length,provisional_ground_reaction_cases:6,
 reported_or_supported_floor_cases:floorTrue.length,bob_reported_airborne_floor:true,
 binary_reaction_id_resolved:0,game_binary_verified:0,existing_icons_written:0,production_changes:0,
 warnings:['Same observed ground reaction does not prove same binary reaction ID',
   'Do not infer airborne reaction from ability to break floor in air',
   'Stage contact and floor type are prerequisites, not guaranteed outcomes',
   'Heihachi base/held variations must remain separate',
   'Alisa 7LP normal hit is NOT a new ground-slam case',
   'Bob NH/CH are not equivalent to target being grounded/airborne']
};
const result={summary,provenance:input,site_anchor_data:{bob,heihachi,heihachi_held_variant:held,alisa},cases,
 unresolved_binary_requests:[
   {kind:'effect_id_mapping',moves:['bob/184',heldId,'alisa/227'],question:'Whether exact Reaction List / Hit Condition numbers match on specific grounded hit states'},
   {kind:'air_effect_mapping',moves:['bob/184'],question:'Find the separate air-specific stage activation branch and whether reaction effect ID differs'},
   {kind:'hold_branch_mapping',moves:[heihachi.move_id,heldId],question:'Which Hold/Release condition selects the alternate ground reaction'},
   {kind:'collision_activation',moves:['bob/184',heldId,'alisa/227'],question:'Identify stage-dependent stage/floor contact conditions, not just move ability'}
 ]};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'V25_S3_FLOOR_REACTION_MATRIX.json'),JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'V25_S3_SUMMARY.json'),JSON.stringify(summary,null,2)+'\n');
const fields=['case_id','character_id','site_move_id','site_move_name','command','variant','hit_state','provisional_ground_reaction_family','internal_reaction_id','floor_gimmick_claim','source_categories','game_binary_verified','official_icon_assignment_approved','note'];
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const lines=[fields.join(',')];
for(const row of cases)lines.push(fields.map(f=>quote(Array.isArray(row[f])?row[f].join(' | '):row[f])).join(','));
fs.writeFileSync(path.join(outDir,'V25_S3_FLOOR_REACTION_MATRIX.csv'),'\ufeff'+lines.join('\r\n')+'\r\n');
console.log('V25_S3_REACTION '+JSON.stringify(summary));
