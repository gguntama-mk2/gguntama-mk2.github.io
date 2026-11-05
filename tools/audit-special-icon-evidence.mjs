#!/usr/bin/env node
/* PROJECT T supplementary icon evidence audit v5. READ ONLY.
   Only explicit move-text evidence; this DOES NOT equate labels with game-confirmed icons. */
import fs from "node:fs";import path from "node:path";import vm from "node:vm";import crypto from "node:crypto";
const [,,site,output]=process.argv;
if(!site||!output)throw Error("Usage: node audit-special-icon-evidence.mjs pc.html output");
const raw=fs.readFileSync(site,"utf8"),i=raw.indexOf("const CHARACTERS = ["),j=raw.indexOf("\n];",i);
if(i<0||j<0)throw Error("CHARACTERS unavailable");
const chars=vm.runInNewContext("("+raw.slice(i+"const CHARACTERS = ".length,j+2)+")",{}, {timeout:45000});
const glossary={
  forcedcrouch:{name:"強制しゃがみ",patterns:["強制しゃがみ","強制的にしゃが","しゃがみ状態にさせ","しゃがませる"]},
  floorgimmick:{name:"フロアギミック発動",patterns:["フロアギミック","床ギミック"]},
  wallbreak:{name:"ウォールブレイク",patterns:["ウォールブレイク","壁破壊"]},
  hardwallbreak:{name:"ハードウォールブレイク",patterns:["ハードウォールブレイク"]},
  wallblast:{name:"ウォールブラスト",patterns:["ウォールブラスト"]},
  wallbound:{name:"ウォールバウンド",patterns:["ウォールバウンド"]},
  balconybreak:{name:"バルコニーブレイク",patterns:["バルコニーブレイク","バルコニー破壊"]},
  floorbreak:{name:"フロアブレイク",patterns:["フロアブレイク","床破壊"]},
  hardfloorbreak:{name:"ハードフロアブレイク",patterns:["ハードフロアブレイク"]},
  floorblast:{name:"フロアブラスト",patterns:["フロアブラスト"]}
};
const hits=[],other=[],charsWithMoves=new Set();
for(const c of chars)for(const m of c.moves){
  charsWithMoves.add(c.id);
  const fields=[];
  function visit(v,key,depth){
    if(depth>4||v==null)return;
    if(typeof v==="string"){if(v.trim())fields.push({field:key,text:v});return}
    if(Array.isArray(v)){v.forEach((x,k)=>visit(x,key+"["+k+"]",depth+1));return}
    if(typeof v==="object")for(const [k,x] of Object.entries(v))if(k!=="name"&&k!=="k")visit(x,key?key+"."+k:k,depth+1);
  }
  visit(m,"move",0);
  fields.push({field:"move.name",text:String(m.name||"")});
  for(const [id,definition] of Object.entries(glossary)){
    const evidence=[];
    for(const f of fields)for(const keyword of definition.patterns)if(f.text.includes(keyword)){
      evidence.push({field:f.field,keyword,text:f.text.slice(0,350)});
    }
    if(evidence.length)hits.push({character_id:c.id,site_k:m.k,move_name:m.name,command:m.a?.command||"",candidate_icon:id,evidence,verified_from_game_binary:false,auto_set_allowed:false});
  }
  const t=String(m.t||"");
  if(/(?:floorgimmick|wallbreak|hardwallbreak|wallblast|wallbound|balconybreak|floorbreak|hardfloorbreak|floorblast|forcedcrouch)/i.test(t)){
     other.push({character_id:c.id,site_k:m.k,name:m.name,t});
  }
}
const counts={};for(const id of Object.keys(glossary))counts[id]=hits.filter(h=>h.candidate_icon===id).length;
const meta={site_sha256:crypto.createHash("sha256").update(raw).digest("hex"),characters:chars.length,characters_with_moves:charsWithMoves.size,total_moves:chars.reduce((a,c)=>a+c.moves.length,0),text_evidence_hits:hits.length,icon_counts:counts,explicit_tag_mentions:other.length,game_binary_confirmed:0,warning:"Text matches are discovery cues only; stage effects and forced-crouch often cannot be inferred from text. NO icons assigned."};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,"SPECIAL_ICON_EVIDENCE_V5.json"),JSON.stringify({summary:meta,hits,explicit_tag_mentions:other},null,2)+"\n");
const q=x=>'"'+String(x??"").replaceAll('"','""')+'"';
const csv=[["character_id","site_k","move_name","command","candidate_icon","fields","keywords","game_binary_verified"],...hits.map(x=>[x.character_id,x.site_k,x.move_name,x.command,x.candidate_icon,x.evidence.map(e=>e.field).join("|"),x.evidence.map(e=>e.keyword).join("|"),false])].map(r=>r.map(q).join(",")).join("\r\n");
fs.writeFileSync(path.join(output,"SPECIAL_ICON_EVIDENCE_V5.csv"),"\ufeff"+csv+"\r\n");
fs.writeFileSync(path.join(output,"SPECIAL_ICON_EVIDENCE_V5_SUMMARY.json"),JSON.stringify(meta,null,2)+"\n");
console.log("V5_SPECIAL_ICON_AUDIT "+JSON.stringify(meta));
