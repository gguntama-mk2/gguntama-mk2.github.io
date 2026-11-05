#!/usr/bin/env node
// Read current PROJECT T site data, not gameplay binary. No production writes.
// node tools/export-all-icons.mjs pc.html move-icons.js output_dir
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import crypto from 'node:crypto';
const [,,siteFile,iconFile,outDir]=process.argv;
if(!siteFile||!iconFile||!outDir)throw Error('Usage: node script pc.html move-icons.js output_dir');
const raw=fs.readFileSync(siteFile,'utf8'),i=raw.indexOf('const CHARACTERS = [');
const j=raw.indexOf('\n];',i);
if(i<0||j<0)throw Error('CHARACTERS not found');
const chars=vm.runInNewContext('('+raw.slice(i+'const CHARACTERS = '.length,j+2)+')',{}, {timeout:45000});
const window={},document={currentScript:{src:'http://localhost/move-icons.js'}};
vm.runInNewContext(fs.readFileSync(iconFile,'utf8'),{window,document,location:{search:'',hostname:'untrusted.invalid'},console,URL,setTimeout,clearTimeout,fetch:()=>Promise.reject(Error('No network'))},{timeout:15000});
const iconApi=window.PTIcons;if(!iconApi?.auto)throw Error('PTIcons.auto not available');
const supported=new Set(iconApi.catalog.map(x=>x.id)),output=[],summary=[],warnings=[],seen=new Set();
let moves=0;
for(const character of chars){
 let count=0,assigned=0;
 for(const m of character.moves){
  moves++;const a=m.a||{},n=String(m.name||''),cmd=String(a.command||'');
  const tags=new Set();
  if(/パワクラ/.test(a.attack||''))tags.add('pc');
  if(/ヒート発動技/.test(cmd)||/ヒート発動可能状態|ヒート発動時/.test(n))tags.add('he');
  if(/^ヒートバースト/.test(n))tags.add('hb');
  if(/^レイジ(?:中|状態で)3WP/.test(cmd))tags.add('ra');
  if(a.homing==='あり'&&!(m.off||[]).includes('homing'))tags.add('hm');
  for(const token of String(m.t||'').split(/[,，\s]+/))if(token){if(token.startsWith('-'))tags.delete(token.slice(1));else tags.add(token)}
  const auto=Array.from(iconApi.auto(character.id,m,[...tags]));
  const sideThrow=/(?:側面|背後)から接近/.test(cmd);
  const homing=tags.has('hm')&&!sideThrow;
  if(tags.has('hm')&&sideThrow)warnings.push({character_id:character.id,site_k:m.k,reason:'side_or_back_throw'});
  const icons=[...new Set(auto.concat(homing?['homing']:[]))].filter(x=>supported.has(x));
  if(!icons.length)continue;
  if(icons.length>6){warnings.push({character_id:character.id,site_k:m.k,reason:'too_many'});continue}
  const key=character.id+'/'+m.k;if(seen.has(key))throw Error('duplicate '+key);seen.add(key);
  count++;assigned+=icons.length;
  output.push({character_id:character.id,site_k:m.k,move_name:n,command:cmd,icons,
   evidence:{site_auto: auto,homing_column:homing},game_binary_verified:false,review_required:true});
 }
 summary.push({character_id:character.id,character_name:character.name,total_moves:character.moves.length,candidate_moves:count,icon_assignments:assigned});
}
const counts={};for(const m of output)for(const id of m.icons)counts[id]=(counts[id]||0)+1;
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const meta={schema:1,source_sha256:{pc:sha(siteFile),icons:sha(iconFile)},characters:chars.length,total_moves:moves,candidate_moves:output.length,
 icon_assignments:Object.values(counts).reduce((a,b)=>a+b,0),icon_counts:counts,character_summary:summary,warnings,
 warning:'Site-data candidates only: NO raw Tekken binary verification; do not overwrite production admin overrides. No delete or replace.'};
const registry={schema:1,entries:{}};
for(const m of output)registry.entries[m.character_id+'/'+m.site_k]={icons:m.icons,move_name:m.move_name,updated_at:0,updated_by:'isolated-test-export'};
const esc=v=>'"'+String(v).replaceAll('"','""')+'"';
const csv=['character_id','site_k','move_name','command','icons','site_auto_icons','homing_column','review_required'].join(',')+'\r\n'+output.map(m=>[m.character_id,m.site_k,m.move_name,m.command,m.icons.join('|'),m.evidence.site_auto.join('|'),m.evidence.homing_column,true].map(esc).join(',')).join('\r\n');
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'ALL_CHARACTER_ICON_CANDIDATES.json'),JSON.stringify({summary:meta,candidates:output},null,2)+'\n');
fs.writeFileSync(path.join(outDir,'ALL_CHARACTER_ICON_SEED_OVERRIDES.json'),JSON.stringify(registry,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'ALL_CHARACTER_ICON_SUMMARY.json'),JSON.stringify(meta,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'ALL_CHARACTER_ICON_CANDIDATES.csv'),'\ufeff'+csv+'\r\n');
console.log('ALL_CHARACTER_ICON_SUMMARY '+JSON.stringify({characters:meta.characters,total_moves:meta.total_moves,candidates:meta.candidate_moves,assignments:meta.icon_assignments,icon_counts:counts,warnings:warnings.length}));
