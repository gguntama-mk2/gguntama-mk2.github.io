/** PROJECT T Phase35 — avoid temporary Set/array for a three-kind card category.
 * Phase34 artifact inspected: moveKind creates new Set(tags.map(...)) per mobile card.
 * This is a guarded test-only experiment; preserve category priority and fallback.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase35-performance'),name='assets/js/sp_04_runtime.js';
const file=path.join(ROOT,'optimized-site',name);
const report={phase:35,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Replace temporary Set(tags.map(id)) in moveKind with direct ordered tag scan preserving KIND_ORDER; no DOM or persisted-data change.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const funcs=new Map(ast.body.filter(n=>n.type==='FunctionDeclaration').map(n=>[n.id?.name,n]));
 const fn=funcs.get('moveKind');
 if(!fn)throw Error('moveKind not found');
 const original=old.slice(fn.start,fn.end);
 const before='function moveKind(raw,pt34Info){const ids=new Set((pt34Info||moveInfo(raw)).tags.map(t=>t.id));return KIND_ORDER.find(k=>ids.has(k))||""}';
 const after='function moveKind(raw,pt34Info){const tags=(pt34Info||moveInfo(raw)).tags;return KIND_ORDER.find(k=>tags.some(t=>t.id===k))||""}';
 if(original!==before)throw Error('Unexpected Phase34 moveKind source; cannot safely replace');
 if(old.split(before).length!==2)throw Error('Duplicate moveKind source');
 if(!old.includes('const KIND_ORDER=["ra","hs","ho"];'))throw Error('KIND_ORDER priority changed');
 const js=old.slice(0,fn.start)+after+old.slice(fn.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(js.replace(after,'')!==old.replace(before,''))throw Error('Unexpected changed code outside moveKind');
 for(const marker of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)','const pt34Info=moveInfo(m.raw)'])
  if(!js.includes(marker))throw Error('Previous behavior missing '+marker);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  noTemporaryKindSet:true,kindPriorityPreserved:true,moveInfoUnchanged:true,cardDomUnchanged:true,
  stableIdsUnchanged:true,fitNamesUnchanged:true,commandsAndIconsUntouched:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'kind-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE35_KIND_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
