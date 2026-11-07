/** PROJECT T Phase34: reuse a single moveInfo result per mobile card.
 * CPU hypothesis from passing Phase33 artifact (three independent calls in cardEl).
 * Only the CI-produced test runtime changes; source, identity and UI stay intact.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase34-performance');
const name='assets/js/sp_04_runtime.js';
const file=path.join(ROOT,'optimized-site',name);
const report={phase:34,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Calculate derived moveInfo once per card and reuse for moveKind, infoEl, and icon tags without changing stable IDs, DOM, saved data or rendering.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const funcs=new Map(ast.body.filter(n=>n.type==='FunctionDeclaration').map(n=>[n.id?.name,n]));
 for(const name of ['cardEl','moveKind','infoEl','moveInfo'])if(!funcs.has(name))throw Error('Required function missing '+name);
 // Verify derived data computation is side-effect free with respect to raw data.
 const infoCode=old.slice(funcs.get('moveInfo').start,funcs.get('moveInfo').end);
 if(!infoCode.includes('return{atk,tags,kw:')||!infoCode.includes('const tags=INFO_TAGS.filter('))
  throw Error('moveInfo implementation changed');
 const changes=[
  {fn:'moveKind',before:'function moveKind(raw){const ids=new Set(moveInfo(raw).tags.map(t=>t.id));',
   after:'function moveKind(raw,pt34Info){const ids=new Set((pt34Info||moveInfo(raw)).tags.map(t=>t.id));'},
  {fn:'infoEl',before:'function infoEl(raw,part){const info=moveInfo(raw);',
   after:'function infoEl(raw,part,pt34Info){const info=pt34Info||moveInfo(raw);'},
  {fn:'cardEl',before:'function cardEl(m){const card=document.createElement("article");',
   after:'function cardEl(m){const pt34Info=moveInfo(m.raw);const card=document.createElement("article");'},
  {fn:'cardEl',before:'const kd=moveKind(m.raw);',after:'const kd=moveKind(m.raw,pt34Info);'},
  {fn:'cardEl',before:'const mi=infoEl(m.raw);',after:'const mi=infoEl(m.raw,undefined,pt34Info);'},
  {fn:'cardEl',before:'moveInfo(m.raw).tags.map(t=>t.id)',after:'pt34Info.tags.map(t=>t.id)'},
 ];
 let pieces=[];
 for(const [fn,node] of funcs.entries()){
  const group=changes.filter(c=>c.fn===fn);
  if(!group.length)continue;
  const original=old.slice(node.start,node.end);
  let updated=original;
  for(const c of group){
   if(updated.split(c.before).length!==2)throw Error('Expected exact audited single occurrence '+fn+' '+c.before);
   updated=updated.replace(c.before,c.after);
  }
  pieces.push({start:node.start,end:node.end,text:updated});
 }
 let js=old;
 for(const p of pieces.sort((a,b)=>b.start-a.start))js=js.slice(0,p.start)+p.text+js.slice(p.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 // Independently revert every guarded change, ensuring no other modified characters.
 let recovered=js;
 for(const c of [...changes].reverse()){
  if(recovered.split(c.after).length!==2)throw Error('Reverse guard mismatch '+c.fn);
  recovered=recovered.replace(c.after,c.before);
 }
 if(recovered!==old)throw Error('Unexpected edits beyond guarded helper/cardEl calls');
 if((old.slice(funcs.get('cardEl').start,funcs.get('cardEl').end).match(/moveInfo\(m\.raw\)/g)||[]).length!==1)
  throw Error('Unexpected cardEl direct moveInfo calls');
 for(const marker of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)'])
  if(!js.includes(marker))throw Error('Previous behavior lost '+marker);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  sharedDerivedInfo:true,moveInfoCallsPerCard:1,cardDomUnchanged:true,
  stableIdsUnchanged:true,fitNamesUnchanged:true,commandsAndIconsUntouched:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'moveinfo-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE34_MOVEINFO_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
