#!/usr/bin/env node
/* PROJECT T V7: stage effect conditions audit, no icon assignments or production writes. */
import fs from "node:fs";import vm from "node:vm";import path from "node:path";
const [,,source,output]=process.argv;
if(!source||!output)throw Error("Usage: node tools/audit-stage-conditions-v7.mjs pc.html OUTPUT");
const raw=fs.readFileSync(source,"utf8");
const start=raw.indexOf("const CHARACTERS = ["),end=raw.indexOf("\n];",start);
if(start<0||end<0)throw Error("CHARACTERS not found");
const chars=vm.runInNewContext("("+raw.slice(start+"const CHARACTERS = ".length,end+2)+")",{}, {timeout:45000});
const wallKeys=["ウォールブレイク","ハードウォールブレイク","ウォールブラスト","ウォールバウンド","バルコニーブレイク"];
const floorKeys=["フロアブレイク","ハードフロアブレイク","フロアブラスト"];
const rows=[];
for(const c of chars)for(const m of c.moves){
 const g=String(m.a?.gimmick||"");
 const wall=wallKeys.some(k=>g.includes(k)),floor=floorKeys.some(k=>g.includes(k));
 if(!wall&&!floor)continue;
 const wallCondition=g.match(/※壁：([^\n]+)/)?.[1]??null;
 const floorCondition=g.match(/※床：([^\n]+)/)?.[1]??null;
 rows.push({character_id:c.id,character_name:c.name,site_k:m.k,move_name:m.name,command:m.a?.command||"",
  wall_related:wall,floor_related:floor,wall_condition:wallCondition,floor_condition:floorCondition,
  raw_gimmick:g,stage_icons_verified:[],requires_manual_game_check:true});
}
const dual=rows.filter(r=>r.wall_related&&r.floor_related);
const counts=source=>{
 const m={};for(const r of rows){const v=r[source];if(v)m[v]=(m[v]||0)+1;}return Object.fromEntries(Object.entries(m).sort((a,b)=>b[1]-a[1]));
};
const noCondition=rows.filter(r=>(r.wall_related&&!r.wall_condition)||(r.floor_related&&!r.floor_condition));
const summary={characters:chars.length,total_moves:chars.reduce((a,c)=>a+c.moves.length,0),gimmick_moves:rows.length,wall_moves:rows.filter(r=>r.wall_related).length,
 floor_moves:rows.filter(r=>r.floor_related).length,both:dual.length,wall_conditions:counts("wall_condition"),
 floor_conditions:counts("floor_condition"),unqualified:noCondition.map(r=>({char:r.character_id,k:r.site_k,name:r.move_name,gimmick:r.raw_gimmick})),
 assigned_stage_icons:0,binary_verified:0,
 note:"Descriptions list compatible stage gimmick families, not distinct stage icon evidence; do not assign 8 different icons based on shared text."};
fs.mkdirSync(output,{recursive:true});
fs.writeFileSync(path.join(output,"STAGE_CONDITIONS_V7_ALL.json"),JSON.stringify({summary,rows},null,2)+"\n");
fs.writeFileSync(path.join(output,"STAGE_CONDITIONS_V7_DUAL_10.json"),JSON.stringify({summary:{dual:dual.length,game_binary_verified:0},rows:dual},null,2)+"\n");
const esc=x=>'"'+String(x??"").replaceAll('"','""')+'"';
fs.writeFileSync(path.join(output,"STAGE_CONDITIONS_V7_ALL.csv"),"\ufeff"+[["character_id","site_k","move_name","command","wall_related","wall_condition","floor_related","floor_condition","game_binary_verified"],...rows.map(x=>[x.character_id,x.site_k,x.move_name,x.command,x.wall_related,x.wall_condition,x.floor_related,x.floor_condition,false])].map(row=>row.map(esc).join(",")).join("\r\n")+"\r\n");
const e=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const table=dual.map(r=>"<tr><td>"+e(r.character_name)+"</td><td>k"+r.site_k+"</td><td>"+e(r.move_name)+"</td><td>"+e(r.command)+"</td><td>"+e(r.wall_condition)+"</td><td>"+e(r.floor_condition)+"</td><td>未確定</td></tr>").join("\n");
const page='<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>PROJECT T 壁・床の複合条件確認</title><style>body{font:15px/1.6 system-ui,sans-serif;color:#e8ecf6;background:#141724;margin:24px}h1{font-size:24px}p{max-width:1000px}table{border-collapse:collapse;width:100%;min-width:900px}td,th{padding:9px;border:1px solid #465064;text-align:left}th{background:#262d42}div.scroll{overflow:auto}small{color:#aeb6cc}</style></head><body><h1>PROJECT T 壁・床ギミック：条件付き10技</h1><p>技表の実データから抽出した条件です。ギミック名が列挙されていても、各アイコンのゲーム内表示が確定したことにはなりません。<strong>個別ギミックアイコンは未設定</strong>です。</p><div class="scroll"><table><thead><tr><th>キャラクター</th><th>ID</th><th>技名</th><th>コマンド</th><th>壁の条件</th><th>床の条件</th><th>属性の確定</th></tr></thead><tbody>'+table+'</tbody></table></div><p><small>TEST ONLY｜本番サイトとサーバーへの書き込みなし</small></p></body></html>';
fs.writeFileSync(path.join(output,"stage-conditions-review-v7.html"),page);
console.log("V7_STAGE_CONDITIONS "+JSON.stringify({characters:summary.characters,total_moves:summary.total_moves,wall:summary.wall_moves,floor:summary.floor_moves,dual:summary.both,missing:summary.unqualified.length,wall_groups:Object.keys(summary.wall_conditions).length,floor_groups:Object.keys(summary.floor_conditions).length}));
