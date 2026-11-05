#!/usr/bin/env node
// Read-only capture of exact source fields for hit-state evidence review, using the production-clone pc.html.
import fs from 'node:fs';import vm from 'node:vm';import zlib from 'node:zlib';import crypto from 'node:crypto';
const [,,siteFile,outDir]=process.argv;
if(!siteFile||!outDir)throw Error('Usage: node tools/export-hit-state-source.mjs pc.html output/');
const source=fs.readFileSync(siteFile,'utf8');
const start=source.indexOf('const CHARACTERS = ['),end=source.indexOf('\n];',start);
if(start<0||end<0)throw Error('CHARACTERS not found');
const chars=vm.runInNewContext('('+source.slice(start+'const CHARACTERS = '.length,end+2)+')',{}, {timeout:45000});
const moves=[];
for(const c of chars)for(const m of c.moves){
 moves.push({character_id:c.id,character_name:c.name,site_k:m.k,move_name:m.name,a:m.a||{},tags:m.t||'',off:m.off||[]});
}
const m={source_sha256:crypto.createHash('sha256').update(source).digest('hex'),
 count_characters:chars.length,count_moves:moves.length,site_source:'PROJECT T cloned PC HTML, NOT raw Tekken 8 MOTBIN/ANMBIN',
 game_binary_verified:false};
if(m.count_characters!==44||m.count_moves!==9569)throw Error('Unexpected counts: '+JSON.stringify(m));
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(outDir+'/SITE_MOVE_HIT_FIELDS.json.gz',zlib.gzipSync(JSON.stringify({metadata:m,moves})));
fs.writeFileSync(outDir+'/SOURCE_METADATA.json',JSON.stringify(m,null,2)+'\n');
const fieldKeys={};for(const x of moves)for(const k of Object.keys(x.a))fieldKeys[k]=(fieldKeys[k]||0)+1;
fs.writeFileSync(outDir+'/SITE_FIELD_COUNTS.json',JSON.stringify(fieldKeys,null,2)+'\n');
console.log('SITE HIT FIELD EXPORT',JSON.stringify({metadata:m,fieldKeys}));
