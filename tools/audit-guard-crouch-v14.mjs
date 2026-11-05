#!/usr/bin/env node
/**
 * PROJECT T v14 - Guard-s disambiguation for forced-crouch icon review.
 * Read-only: no writes to production, test admin API or existing move-icons.js.
 * Input: actual 44-character synced pc/sp.html and v13 effect sidecar.
 */
import fs from "node:fs";import vm from "node:vm";import path from "node:path";
const [,,siteFile,v13File,outDir]=process.argv;
if(!siteFile||!v13File||!outDir)throw Error("Usage: node tools/audit-guard-crouch-v14.mjs pc.html v13_hit_state_review.json OUT");
const source=fs.readFileSync(siteFile,"utf8");
const from=source.indexOf("const CHARACTERS = ["),to=source.indexOf("\n];",from);
if(from<0||to<0)throw Error("Site CHARACTERS missing");
const chars=vm.runInNewContext("("+source.slice(from+"const CHARACTERS = ".length,to+2)+")",{}, {timeout:45000});
const v13=JSON.parse(fs.readFileSync(v13File,"utf8"));
if(chars.length!==44||chars.reduce((n,c)=>n+c.moves.length,0)!==9569||v13.moves.length!==2519)throw Error("Unexpected source counts");
const all=new Map();for(const c of chars)for(const m of c.moves){
 const id=c.id+"/"+m.k;
 if(all.has(id))throw Error("Duplicate "+id);
 all.set(id,{character:c,move:m});
}
const direct=(attack)=>{
 const tokens=String(attack||"").replaceAll("，",",").split(",").map(x=>x.trim()).filter(Boolean);
 const last=tokens[tokens.length-1]||"";
 if(/^(?:下|特下)/.test(last))return "low";
 if(/^(?:中|特中)/.test(last))return "mid";
 if(/^上/.test(last))return "high";
 return "ambiguous";
};
const reviews=[],counts={total:0,low:0,mid:0,high:0,ambiguous:0,new_guard_only:0,new_low:0,new_mid:0,new_high:0,new_ambiguous:0,
 simple_notation:0,complex_notation:0,wall_or_floor_overlap:0,attacker_crouch_status:0, externally_compared:0};
const external={
 "jin/5":{result:"source_mismatch_low_guard",summary:"SITE -12s; independent Jin 1,3 frame table shows -12 on block (no forced-crouch suffix)",url:"https://tekkendocs.com/t8/mokujin?orderby=hitLevel_asc&page=5"},
 "jin/6":{result:"source_mismatch_low_guard",summary:"SITE -13s; independent Jin 1,3,4 frame table shows -13 on block (no forced-crouch suffix)",url:"https://tekkendocs.com/t8/mokujin?orderby=hitLevel_asc&page=5"},
 "kazuya/20":{result:"external_support_mid_forced_crouch",summary:"Site 6RK +4s; independent Japanese notation marks opponent forced crouch S for this mid move",url:"https://geppopotamus.info/game/tekken8/kazuya/data.htm"}
};
const counted=new Set();
for(const r of v13.moves){
 const state=r.hit_states?.guard?.opponent_forced_crouch;
 if(state?.evidence_state!=="notation_candidate")continue;
 const sourceMove=all.get(r.move_id);
 if(!sourceMove)throw Error("Missing "+r.move_id);
 const m=sourceMove.move,a=m.a||{},attack=String(a.attack||"");
 const group=direct(attack),guard=String(a.guard||"");
 const simple=/^[+\-−±]?\d+s$/.test(guard);
 const newOnly=r.review_origin==="full_site_guard_only"||r.review_origin==="new_guard_s_only";
 const prior=external[r.move_id]||null;
 const wallOrFloor=Boolean(String(a.wall||"").includes("壁やられ")||/ウォールブレイク|ウォールブラスト|ウォールバウンド|バルコニーブレイク|フロアブレイク|フロアブラスト/.test(String(a.gimmick||"")));
 const priority=group==="low"?"hold_low_block":group==="mid"?"review_mid_guard":group==="high"?"review_high_guard":"manual_sequence_review";
 reviews.push({
   character_id:r.character_id,character_name:r.character_name,site_k:r.site_k,move_id:r.move_id,
   move_name:r.move_name,command:r.command,attack,guard_value:guard,last_attack_group:group,
   source_attack_last:attack.replaceAll("，",",").split(",").at(-1)?.trim()||"",
   guard_notation_simple:simple,review_origin:newOnly?"new_guard_s_only":"v12_style_hit_effects",
   priority,wall_or_floor_overlap:wallOrFloor,
   attacker_crouch_state:a.crouch==="あり",
   external_comparison:prior,
   site_s_suffix:true,
   opponent_forced_crouch_proven_by_binary:false,
   approved_icon_assignment:false
 });
 counts.total++;counts[group]++;
 if(newOnly){counts.new_guard_only++;counts["new_"+group]++;}
 counts[simple?"simple_notation":"complex_notation"]++;
 if(wallOrFloor)counts.wall_or_floor_overlap++;
 if(a.crouch==="あり")counts.attacker_crouch_status++;
 if(prior)counts.externally_compared++;
 if(counted.has(r.move_id))throw Error("Repeated guard move "+r.move_id);counted.add(r.move_id);
}
const target={total:1166,low:720,mid:223,high:16,ambiguous:207,
  new_guard_only:778,new_low:535,new_mid:107,new_high:10,new_ambiguous:126,
  simple_notation:1160,complex_notation:6,externally_compared:3};
for(const [k,v] of Object.entries(target))if(counts[k]!==v)throw Error(k+" expected "+v+" got "+counts[k]);
if(reviews.some(r=>r.opponent_forced_crouch_proven_by_binary||r.approved_icon_assignment))throw Error("Unsafe approval");
const summary={
 schema:14,source:"PROJECT T latest synced PC/SP site fields plus v13 review; NOT extracted game hit-reaction binary",
 characters:44,total_site_moves:9569,guard_s_candidates:counts.total,counts,
 categories:{
   hold_low_block:"Final hit classified LOW. Guard-s often means a low attack was crouch-blocked; do not claim special forced crouch.",
   review_mid_guard:"Final hit classified MID. Higher-priority manual or independent frame-table review; NOT verified.",
   review_high_guard:"Final hit classified HIGH. Manual verification; avoid automatic inference.",
   manual_sequence_review:"Final attack token is special/throw/unknown. Resolve actual last hit level first."
 },
 independent_source_notes:{
   tekken_docs:"https://tekkendocs.com/t8/mokujin?orderby=hitLevel_asc&page=5",
   japanese_forced_crouch_notation:"https://geppopotamus.info/game/tekken8/kazuya/data.htm",
   notation_warning:"https://wavu.wiki/t/Stances"
 },
 game_binary_verified:0,existing_icon_settings_modified:0,site_files_modified:0,
 caution:"s is source-specific: Geppopotamus Japanese S means forced crouch; Wavu s means stagger and c means crouching. Never mix conventions."
};
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,"V14_GUARD_REVIEW.json"),JSON.stringify({summary,reviews},null,2)+"\n");
fs.writeFileSync(path.join(outDir,"V14_SUMMARY.json"),JSON.stringify(summary,null,2)+"\n");
const q=x=>'"'+String(x??"").replaceAll('"','""')+'"';
const cols=["character_id","site_k","move_name","command","attack","guard_value","last_attack_group","review_origin","priority","guard_notation_simple","wall_or_floor_overlap","attacker_crouch_state","external_comparison","game_binary_verified"];
const csv=[cols.join(","),...reviews.map(r=>cols.map(k=>q(k==="game_binary_verified"?false:k==="external_comparison"?(r.external_comparison?.result||""):r[k])).join(","))].join("\r\n")+"\r\n";
fs.writeFileSync(path.join(outDir,"V14_GUARD_REVIEW.csv"),"\ufeff"+csv);
fs.writeFileSync(path.join(outDir,"V14_GUARD_HIGH_PRIORITY.csv"),"\ufeff"+[cols.join(","),...reviews.filter(r=>r.priority!=="hold_low_block").map(r=>cols.map(k=>q(k==="game_binary_verified"?false:k==="external_comparison"?(r.external_comparison?.result||""):r[k])).join(","))].join("\r\n")+"\r\n");
fs.copyFileSync("icons/forcedcrouch.webp",path.join(outDir,"forcedcrouch.webp"));
console.log("V14_GUARD_AUDIT "+JSON.stringify(summary));
