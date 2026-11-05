// Read-only PROJECT T v10 ground/air & effect branch regression against real site files.
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';
const src=process.argv[2],out=process.argv[3];
if(!src||!out)throw Error("node tools/verify-hit-effects-v10.mjs pc.html out.json");
const s=fs.readFileSync(src,'utf8'),i=s.indexOf('const CHARACTERS = ['),j=s.indexOf('\n];',i);
if(i<0||j<0)throw Error('CHARACTERS absent');
const chars=vm.runInNewContext('('+s.slice(i+'const CHARACTERS = '.length,j+2)+')',{}, {timeout:45000});
const observed=[],counter={};
const inc=k=>counter[k]=(counter[k]||0)+1;
for(const c of chars)for(const m of c.moves){
 const a=m.a||{},wall=String(a.wall||''),g=String(a.gimmick||'');
 const wG=/ウォールブレイク|ウォールブラスト|ウォールバウンド|バルコニーブレイク/.test(g);
 const fG=/フロアブレイク|フロアブラスト/.test(g);
 const hasWall=wall.includes('壁やられ');
 const normalNone=/ヒット[：:]\s*なし/.test(wall),counterNone=/カウンター[：:]\s*なし/.test(wall);
 const normalYes=/(?<!カウンター)ヒット[：:]\s*壁やられ/.test(wall),counterYes=/カウンター[：:]\s*壁やられ/.test(wall);
 const guardYes=/ガード[：:]\s*壁やられ/.test(wall);
 const unspecified=hasWall&&![normalNone,counterNone,normalYes,counterYes,guardYes].some(Boolean);
 const hitS=/[+−\-±]?\d+s(?:$|\b)/.test(String(a.hit||''));
 const chS=/[+−\-±]?\d+s(?:$|\b)/.test(String(a.counter||''));
 if(normalYes)inc('wall_normal_yes');
 if(normalNone)inc('wall_normal_no');
 if(counterYes)inc('wall_counter_yes');
 if(counterNone)inc('wall_counter_no');
 if(unspecified)inc('wall_unspecified');
 if(hasWall)inc('wall_site_rows');
 if(wG)inc('wall_gimmick_rows');
 if(fG)inc('floor_gimmick_rows');
 if(hitS)inc('hit_suffix_s');
 if(chS)inc('counter_suffix_s');
 if(hitS||chS)inc('hit_counter_suffix_s_unique');
 if(wG&&fG)inc('wall_floor_both');
 if(wG&&g.includes('※壁：')===false)inc('wall_gimmick_missing_condition');
 if(wG&&g.includes('空中ヒットでトルネードを誘発した時のみ'))inc('wall_air_tornado_only');
 if(hasWall||wG||fG||hitS||chS)observed.push(c.id+'/'+m.k);
}
const look=(id,k)=>chars.find(c=>c.id===id)?.moves.find(m=>m.k===k);
const jin=look('jin',44),kazuya=look('kazuya',20);
if(jin?.a?.hit!=='+4s'||jin?.a?.command!=='2RP')throw Error('Jin source drift');
if(kazuya?.a?.guard!=='+4s'||kazuya?.a?.hit!=='+7s'||kazuya?.a?.command!=='6RK')throw Error('Kazuya source drift');
const expected={wall_site_rows:1055,wall_gimmick_rows:275,floor_gimmick_rows:68,wall_normal_yes:25,wall_normal_no:213,wall_counter_yes:232,wall_counter_no:14,wall_unspecified:803,hit_suffix_s:607,counter_suffix_s:419,hit_counter_suffix_s_unique:673,wall_floor_both:10,wall_gimmick_missing_condition:2,wall_air_tornado_only:3};
for(const [k,v] of Object.entries(expected))if(counter[k]!==v)throw Error(k+' expected '+v+' got '+counter[k]);
if(chars.length!==44||chars.reduce((n,c)=>n+c.moves.length,0)!==9569||new Set(observed).size!==1741)throw Error('source cardinality mismatch');
const result={source:src,characters:chars.length,total_moves:9569,relevant:1741,counts:counter,
 site_examples:[{id:'jin/44',hit:jin.a.hit,command:jin.a.command},{id:'kazuya/20',guard:kazuya.a.guard,hit:kazuya.a.hit,command:kazuya.a.command}],
 binary_verified_count:0,stage_type_verified_count:0,write_count:0};
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log('PASS read-only v10 branch-effect audit',JSON.stringify(result));
