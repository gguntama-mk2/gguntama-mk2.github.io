/** PROJECT T Phase28: per-fitNames-call DOM selector cache (test-only).
 * Read-only AST transformation of generated Stage27 mobile test runtime.
 * Maintain exact layout width/height reads, scaling iterations and display.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase28-performance');
const name='assets/js/sp_04_runtime.js',file=path.join(ROOT,'optimized-site',name);
const report={phase:28,mode:'test-only',passed:false,errors:[],files:{},strategy:
 'Cache two child element lookups per heading for the duration of each fitNames invocation only, leaving all computed dimensions, style-write order, iteration bounds and command/icon rendering unchanged.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const f=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id?.name==='fitNames');
 if(!f)throw Error('Expected named fitNames function missing');
 const original=old.slice(f.start,f.end);
 const first='const list = only || [...document.querySelectorAll("#list .card .head .nm")];';
 if(original.split(first).length!==2)throw Error('fitNames list anchor mismatch');
 const cmd='n.querySelector(".cmdtxt")',info='n.querySelector(".minfo")';
 const count=(s,p)=>s.split(p).length-1;
 const cmdCount=count(original,cmd),infoCount=count(original,info);
 if(cmdCount!==2||infoCount!==2)throw Error('Unexpected child selector call counts '+cmdCount+'/'+infoCount);
 const helper='const pt28Elements=new Map(); const pt28Get=n=>{let x=pt28Elements.get(n);if(!x){x={c:n.querySelector(".cmdtxt"),mi:n.querySelector(".minfo")};pt28Elements.set(n,x)}return x};';
 let changed=original.replace(first,first+'\n  '+helper);
 changed=changed.replaceAll(cmd,'pt28Get(n).c').replaceAll(info,'pt28Get(n).mi');
 if(changed.includes('n.querySelector(".cmdtxt")') && changed.split('n.querySelector(".cmdtxt")').length!==2)throw Error('Unexpected uncached cmd query');
 if(!changed.includes('pt28Get(n).c')||!changed.includes('pt28Get(n).mi'))throw Error('Selector substitution not applied');
 // Keep exact width/height comparisons, scale factors, and write loops.
 for(const marker of ['scrollHeight > t.clientHeight + 1','scrollWidth > c.clientWidth + 1',
   'scrollWidth > mi.clientWidth + 1','for (let k = 0; k < 6 && pi.length; k++)',
   'for (let k = 0; k < 6 && pc.length; k++)','0.92, 0.85, 0.78, 0.72, 0.66']){
   if(!original.includes(marker)||!changed.includes(marker))throw Error('Fit behavior anchor missing: '+marker);
 }
 const js=old.slice(0,f.start)+changed+old.slice(f.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(!js.includes('requestAnimationFrame(chunk)')||!js.includes('pt26Stats.fitCalls++')||!js.includes('pt27HeadTemplate'))throw Error('Previous-stage behavior lost');
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  cachedCmdLookupSites:cmdCount,cachedInfoLookupSites:infoCount,
  cacheLifetime:'one fitNames call',fitComparisonsAndScalingUnchanged:true,
  cardDOMUnchanged:true,commandsAndIconRuntimeUntouched:true,onlyMobileRuntimeChanged:true};
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'fitnames-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE28_FITNAMES_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
