#!/usr/bin/env node
/* PROJECT T v13: state-specific read-only effect evidence sidecar from synced UI.
   This does NOT change move-icons.js, existing overrides, or production. */
import fs from "node:fs";import path from "node:path";import vm from "node:vm";import crypto from "node:crypto";
const [,,site,out]=process.argv;
if(!site||!out)throw Error("node tools/build-hit-state-sidecar-v13.mjs pc.html OUTPUT_DIR");
const raw=fs.readFileSync(site,"utf8");
const a=raw.indexOf("const CHARACTERS = ["),b=raw.indexOf("\n];",a);
if(a<0||b<0)throw Error("CHARACTERS unavailable");
const chars=vm.runInNewContext("("+raw.slice(a+"const CHARACTERS = ".length,b+2)+")",{}, {timeout:45000});
const rexS=/[+−\-±]?\d+s(?:$|\b)/;
const wallFamily=/ウォールブレイク|ハードウォールブレイク|ウォールブラスト|ウォールバウンド|バルコニーブレイク/;
const floorFamily=/フロアブレイク|ハードフロアブレイク|フロアブラスト/;
const yesNormal=/(?<!カウンター)ヒット\s*[:：]\s*壁やられ/;
const yesCounter=/カウンター\s*[:：]\s*壁やられ/;
const noNormal=/ヒット\s*[:：]\s*なし/;
const noCounter=/カウンター\s*[:：]\s*なし/;
const effect=(label,status,field,conditions=[])=>({effect:label,evidence_state:status,source:field,conditions,game_binary_verified:false,approved_for_admin_api:false});
const records=[],ids=new Set();let base=0,extra=0,allGuardS=0,hitS=0,counterS=0;
for(const c of chars)for(const m of c.moves){
 const x=m.a||{},wall=String(x.wall||""),g=String(x.gimmick||"");
 const normal=String(x.hit||""),counter=String(x.counter||""),guard=String(x.guard||"");
 const hs=rexS.test(normal),cs=rexS.test(counter),gs=rexS.test(guard);
 if(gs)allGuardS++;if(hs)hitS++;if(cs)counterS++;
 const wh=wall.includes("壁やられ"),wg=wallFamily.test(g),fg=floorFamily.test(g);
 const isBaseline=wh||wg||fg||hs||cs;
 if(!isBaseline&&!gs)continue;
 if(isBaseline)base++;else extra++;
 const k=c.id+"/"+m.k;if(ids.has(k))throw Error("duplicate "+k);ids.add(k);
 const wallCondition=g.match(/※壁：([^\n]+)/)?.[1]||"";
 const floorCondition=g.match(/※床：([^\n]+)/)?.[1]||"";
 const mode=(v,st)=>st==="normal"?/ノーマル/.test(v):st==="counter"?/カウンター/.test(v):/空中ヒット/.test(v);
 const states={};
 for(const [st,field] of [["normal","a.hit"],["counter","a.counter"],["air","no site airborne reaction field"]]){
   const splat=st==="normal"?(yesNormal.test(wall)?"explicit_yes":noNormal.test(wall)?"explicit_no":"unknown"):
     st==="counter"?(yesCounter.test(wall)?"explicit_yes":noCounter.test(wall)?"explicit_no":"unknown"):"unknown";
   const tornadoOnly=st==="air"&&/空中ヒットでトルネードを誘発した時のみ/.test(wallCondition);
   states[st]={
     wall_splat:effect("wall_splat",splat,"a.wall",splat==="explicit_yes"?["wall_contact"]:[]),
     wall_stage_effect:effect("wall_stage_effect",wg?(wallCondition?(mode(wallCondition,st)?"site_conditional":"unknown"):"site_mentioned_condition_unknown"):"unknown","a.gimmick",
       wg&&wallCondition&&mode(wallCondition,st)?["compatible_wall_stage","wall_contact",...(tornadoOnly?["airborne_tornado_success"]:[])]:[]),
     floor_stage_effect:effect("floor_stage_effect",fg?(floorCondition?(mode(floorCondition,st)?"site_conditional":"unknown"):"site_mentioned_condition_unknown"):"unknown","a.gimmick",
       fg&&floorCondition&&mode(floorCondition,st)?["compatible_floor_stage"]:[]),
     opponent_forced_crouch:effect("opponent_forced_crouch",(st==="normal"&&hs)||(st==="counter"&&cs)?"notation_candidate":"unknown",field),
   };
 }
 states.guard={opponent_forced_crouch:effect("opponent_forced_crouch",gs?"notation_candidate":"unknown","a.guard")};
 records.push({move_id:k,character_id:c.id,character_name:c.name,site_k:m.k,move_name:m.name,command:x.command||"",
   review_origin:isBaseline?"v12_style_hit_effects":"new_guard_s_only",
   hit_states:states,
   source_wall_text_unqualified:wh&&!yesNormal.test(wall)&&!yesCounter.test(wall)&&!noNormal.test(wall)&&!noCounter.test(wall),
   attacker_crouch_is_separate:x.crouch==="あり",
   source_evidence:{wall,gimmick:g,hit:normal,counter,guard},
   review_only:true});
}
if(chars.length!==44||chars.reduce((n,c)=>n+c.moves.length,0)!==9569)throw Error("source not current");
const summary={schema:13,source:"PROJECT T site, not Tekken 8 game binary",source_sha256:crypto.createHash("sha256").update(raw).digest("hex"),
 total_characters:44,total_site_moves:9569,candidate_moves:records.length,existing_baseline_moves:base,new_guard_only_moves:extra,
 guard_s_total:allGuardS,normal_hit_s_total:hitS,counter_hit_s_total:counterS,game_binary_verified_effects:0,admin_icon_writes:0,
 statuses:{}};
for(const row of records)for(const [st,es] of Object.entries(row.hit_states))for(const [id,e] of Object.entries(es)){
  if(e.evidence_state==="unknown")continue;
  const key=st+"/"+id+"/"+e.evidence_state;summary.statuses[key]=(summary.statuses[key]||0)+1;
}
const required={candidate_moves:2519,existing_baseline_moves:1741,new_guard_only_moves:778,guard_s_total:1166,normal_hit_s_total:607,counter_hit_s_total:419};
for(const [k,v] of Object.entries(required))if(summary[k]!==v)throw Error(k+" got "+summary[k]+" expected "+v);
const yes=(st,e,flag)=>records.filter(r=>r.hit_states[st]?.[e]?.evidence_state===flag).length;
const checks=[
 ["normal","wall_splat","explicit_yes",25],["normal","wall_splat","explicit_no",213],
 ["counter","wall_splat","explicit_yes",232],["counter","wall_splat","explicit_no",14],
 ["normal","wall_stage_effect","site_conditional",217],["counter","wall_stage_effect","site_conditional",210],
 ["air","wall_stage_effect","site_conditional",140],["normal","floor_stage_effect","site_conditional",11],
 ["counter","floor_stage_effect","site_conditional",12],["air","floor_stage_effect","site_conditional",57],
 ["guard","opponent_forced_crouch","notation_candidate",1166]
];
for(const [st,e,flag,n] of checks)if(yes(st,e,flag)!==n)throw Error(st+"/"+e+" expected "+n+" got "+yes(st,e,flag));
for(const row of records)for(const es of Object.values(row.hit_states))for(const e of Object.values(es)){
 if(e.game_binary_verified||e.approved_for_admin_api)throw Error("unsafe assignment");
}
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,"v13_hit_state_review.json"),JSON.stringify({metadata:summary,moves:records},null,2)+"\n");
fs.writeFileSync(path.join(out,"v13_summary.json"),JSON.stringify(summary,null,2)+"\n");
const q=x=>'"'+String(x??"").replaceAll('"','""')+'"';
const cells=[["character_id","site_k","move_name","command","hit_state","effect","evidence_state","conditions","game_binary_verified"]];
for(const r of records)for(const [state,es] of Object.entries(r.hit_states))for(const [name,e] of Object.entries(es)){
 if(e.evidence_state==="unknown")continue;
 cells.push([r.character_id,r.site_k,r.move_name,r.command,state,name,e.evidence_state,e.conditions.join("|"),false]);
}
fs.writeFileSync(path.join(out,"v13_hit_state_review.csv"),"\ufeff"+cells.map(row=>row.map(q).join(",")).join("\r\n")+"\r\n");
for(const id of ["wallbreak","floorgimmick","forcedcrouch"])fs.copyFileSync(path.join("icons",id+".webp"),path.join(out,id+".webp"));
console.log("V13_MODEL "+JSON.stringify(summary));
