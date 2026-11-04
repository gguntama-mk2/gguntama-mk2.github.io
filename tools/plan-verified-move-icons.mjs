#!/usr/bin/env node
// PROJECT T: read-only icon-import proposal. Never calls production APIs.
// Usage: node tools/plan-verified-move-icons.mjs candidates.json current-overrides.json > plan.json
import fs from "node:fs";
const ICONS = new Set(["tornado","powercrush","heatengage","recoverable","homing","forcedcrouch","floorgimmick","wallbreak","hardwallbreak","wallblast","wallbound","balconybreak","floorbreak","hardfloorbreak","floorblast"]);
const ID=/^[a-z0-9][a-z0-9-]{0,47}$/;
function plan(candidates, current, mode="add") {
  if(!["add","replace"].includes(mode)) throw Error("Only add/replace supported");
  if(!Array.isArray(candidates)) throw Error("Candidates must be an array");
  const changes=[], held=[], conflicts=[];
  for(const c of candidates) {
    if(!c || !ID.test(c.character_id) || !Number.isSafeInteger(c.site_k) || c.site_k<0 ||
       !Array.isArray(c.icons) || !c.icons.length || !c.icons.every(i=>ICONS.has(i)) || new Set(c.icons).size!==c.icons.length) {
      conflicts.push({candidate:c,reason:"invalid_candidate"});continue;
    }
    if(c.game_binary_verified!==true || !c.source_sha256 || !/^[a-f0-9]{64}$/.test(c.source_sha256) ||
       !Number.isSafeInteger(c.internal_move_id) || c.internal_move_id<0 ||
       c.site_k_match_verified!==true || !c.evidence_reference) {
      held.push({character_id:c.character_id,site_k:c.site_k,reason:"binary_or_move_match_not_verified"});continue;
    }
    const key=c.character_id+"/"+c.site_k;
    const before=current?.[c.character_id]?.[String(c.site_k)];
    if(before!==undefined && (!Array.isArray(before) || !before.every(i=>ICONS.has(i)))) {
      conflicts.push({key,reason:"invalid_existing_icons"});continue;
    }
    const old=before||[];
    const icons=mode==="add" ? [...old,...c.icons.filter(i=>!old.includes(i))] : [...c.icons];
    if(icons.length>6) {conflicts.push({key,reason:"more_than_six_icons"});continue}
    if(JSON.stringify(icons)===JSON.stringify(old))continue;
    changes.push({character_id:c.character_id,site_k:c.site_k,icons,previous_icons:old,operation:mode,evidence_reference:c.evidence_reference,source_sha256:c.source_sha256});
  }
  return {schema:1,mode,production_write:false,delete_operations:0,changes,held,conflicts};
}
export {plan};
if(process.argv[1] && process.argv[1].endsWith("plan-verified-move-icons.mjs")) {
 if(process.argv.includes("--self-test")){
   const sha="a".repeat(64);
   const seed={character_id:"bryan",site_k:2,internal_move_id:2,icons:["homing"],game_binary_verified:true,site_k_match_verified:true,source_sha256:sha,evidence_reference:"synthetic-test"};
   const a=plan([seed],{bryan:{"2":["powercrush"]}});
   if(JSON.stringify(a.changes[0].icons)!==JSON.stringify(["powercrush","homing"]) || a.delete_operations!==0)throw Error("Add mode failed");
   const b=plan([{...seed,game_binary_verified:false}],{});
   if(b.changes.length || b.held.length!==1)throw Error("Unverified gate failed");
   const c=plan([seed],{bryan:{"2":["powercrush"]}},"replace");
   if(JSON.stringify(c.changes[0].icons)!==JSON.stringify(["homing"]))throw Error("Replace mode failed");
   console.log("PASS 3 test-only fixtures");process.exit(0);
 }
 if(process.argv.length<4){console.error("Provide candidates.json and current-overrides.json, or --self-test");process.exit(2)}
 const candidates=JSON.parse(fs.readFileSync(process.argv[2],"utf8"));
 const current=JSON.parse(fs.readFileSync(process.argv[3],"utf8"));
 process.stdout.write(JSON.stringify(plan(candidates,current,process.argv.includes("--replace")?"replace":"add"),null,2)+"\n");
}
