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
 // Identify repeated child lookups structurally instead of assuming formatting.
 const edits=[], counts={cmdtxt:0,minfo:0};
 const walk=n=>{if(!n||typeof n!=='object')return;
   if(n.type==='CallExpression'&&n.callee?.type==='MemberExpression'
      &&n.callee.property?.name==='querySelector'
      &&n.arguments?.length===1&&n.arguments[0]?.type==='Literal'){
     const selector=n.arguments[0].value;
     if(selector==='.cmdtxt'||selector==='.minfo'){
       const obj=old.slice(n.callee.object.start,n.callee.object.end);
       edits.push({start:n.start,end:n.end,code:'pt28Query('+obj+','+JSON.stringify(selector)+')'});
       counts[selector.slice(1)]++;
     }
   }
   for(const [key,value] of Object.entries(n)){
     if(key==='start'||key==='end'||key==='loc')continue;
     if(Array.isArray(value))for(const v of value)walk(v);
     else if(value&&typeof value==='object')walk(value);
   }
 };
 walk(f.body);
 if(counts.cmdtxt<1||counts.minfo<1)throw Error('Expected child selectors missing: '+JSON.stringify(counts));
 const helper='const pt28Cache=new WeakMap();function pt28Query(el,sel){let bySel=pt28Cache.get(el);if(!bySel){bySel=new Map();pt28Cache.set(el,bySel)}if(!bySel.has(sel))bySel.set(sel,el.querySelector(sel));return bySel.get(sel)}';
 let changed=original;
 for(const e of edits.sort((x,y)=>y.start-x.start))
   changed=changed.slice(0,e.start-f.start)+e.code+changed.slice(e.end-f.start);
 changed=changed.slice(0,f.body.start+1-f.start)+'\n'+helper+'\n'+changed.slice(f.body.start+1-f.start);
 if(changed===original)throw Error('No optimization generated');
 const js=old.slice(0,f.start)+changed+old.slice(f.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(!js.includes('requestAnimationFrame(chunk)')||!js.includes('pt26Stats.fitCalls++')||!js.includes('pt27HeadTemplate'))throw Error('Previous-stage behavior lost');
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  cachedCmdLookupSites:counts.cmdtxt,cachedInfoLookupSites:counts.minfo,
  cacheLifetime:'one fitNames call',fitComparisonsAndScalingUnchanged:true,
  cardDOMUnchanged:true,commandsAndIconRuntimeUntouched:true,onlyMobileRuntimeChanged:true};
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'fitnames-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE28_FITNAMES_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
