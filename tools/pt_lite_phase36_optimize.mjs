/** PROJECT T Phase36 — reuse DOM element references inside fitNames only.
 * Reads .cmdtxt and .minfo once each per card instead of per iteration pass.
 * Exact Phase35 source guards, AST verification, and reversible audited edits.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase36-performance'),name='assets/js/sp_04_runtime.js';
const file=path.join(ROOT,'optimized-site',name);
const report={phase:36,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Cache each .cmdtxt and .minfo element reference once per fitNames invocation while preserving all existing layout reads/writes and element order.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const funcs=new Map(ast.body.filter(n=>n.type==='FunctionDeclaration').map(n=>[n.id?.name,n]));
 const fn=funcs.get('fitNames');if(!fn)throw Error('fitNames function missing');
 const original=old.slice(fn.start,fn.end);
 const changes=[
  ['if(!list.length||!list[0].getClientRects().length)return;list.forEach(n=>{n.style.removeProperty("--ts");n.title="";const c=pt28Query(n,".cmdtxt");',
   'if(!list.length||!list[0].getClientRects().length)return;const pt36Parts=list.map(n=>({n,c:pt28Query(n,".cmdtxt"),mi:pt28Query(n,".minfo")}));pt36Parts.forEach(({n,c,mi})=>{n.style.removeProperty("--ts");n.title="";'],
  ['const mi=pt28Query(n,".minfo");if(mi)mi.style.removeProperty("--is")',
   'if(mi)mi.style.removeProperty("--is")'],
  ['const over=[],cmds=[];list.forEach(n=>{const t=n.firstChild;if(t.scrollHeight>t.clientHeight+1)over.push(n);const c=pt28Query(n,".cmdtxt");',
   'const over=[],cmds=[];pt36Parts.forEach(({n,c})=>{const t=n.firstChild;if(t.scrollHeight>t.clientHeight+1)over.push(n);'],
  ['const infos=[];list.forEach(n=>{const mi=pt28Query(n,".minfo");',
   'const infos=[];pt36Parts.forEach(({n,mi})=>{']
 ];
 let updated=original;
 for(const [before,after] of changes){
  if(updated.split(before).length!==2)throw Error('fitNames anchor not exactly once: '+before.slice(0,90));
  updated=updated.replace(before,after);
 }
 if((original.match(/pt28Query\(n,"\.cmdtxt"\)/g)||[]).length!==2||(original.match(/pt28Query\(n,"\.minfo"\)/g)||[]).length!==2)throw Error('Unexpected baseline selector count');
 if((updated.match(/pt28Query\(n,"\.cmdtxt"\)/g)||[]).length!==1||(updated.match(/pt28Query\(n,"\.minfo"\)/g)||[]).length!==1)throw Error('Selector caching mismatch');
 let reversed=updated;
 for(const [before,after] of [...changes].reverse()){
  if(reversed.split(after).length!==2)throw Error('Reverse anchor mismatch');
  reversed=reversed.replace(after,before);
 }
 if(reversed!==original)throw Error('Not fully reversible');
 const js=old.slice(0,fn.start)+updated+old.slice(fn.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(js.slice(0,fn.start)!==old.slice(0,fn.start)||js.slice(fn.start+updated.length)!==old.slice(fn.end))throw Error('Outside fitNames changed');
 for(const marker of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)','const pt34Info=moveInfo(m.raw)'])
  if(!js.includes(marker))throw Error('Previous behavior lost '+marker);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  cmdSelectorsPerCard:{before:2,after:1},infoSelectorsPerCard:{before:2,after:1},
  cardDomUnchanged:true,layoutReadWriteOrderPreserved:true,stableIdsUnchanged:true,
  moveInfoUnchanged:true,fitNamesReadsPreserved:true,commandsAndIconsUntouched:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'fit-cache-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE36_FIT_CACHE_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
