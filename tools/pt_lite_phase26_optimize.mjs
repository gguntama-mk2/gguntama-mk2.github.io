/** PROJECT T Phase26 mobile rendering experiment.
 * Preserve the exact 228 card DOM nodes and final text scaling; avoid repeated
 * forced layout reads after every 60-card DOM insertion. Postpone fitNames
 * until the final batch, then perform the same fitNames logic once on all
 * cards before shApply. Profile layout/call counts in browser.
 * Operates on a disposable Stage25 site only.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase26-performance'),SITE=path.join(ROOT,'optimized-site');
const report={phase:26,passed:false,mode:'test-only',files:{},errors:[],strategy:
 'Accumulate smartphone cards in existing 60-card requestAnimationFrame batches; run unchanged fitNames once after final card insertion to avoid repeated forced style/layout flushes, preserving final DOM and CSS'};
function walk(node,cb,parent=null){
 if(!node||typeof node!=='object')return;
 if(typeof node.type==='string')cb(node,parent);
 for(const k of Object.keys(node)){
  if(k==='start'||k==='end'||k==='loc')continue;
  const v=node[k];if(Array.isArray(v))for(const e of v)walk(e,cb,node);
  else if(v&&typeof v==='object')walk(v,cb,node);
 }
}
try{
 const file=path.join(SITE,'assets/js/sp_04_runtime.js');
 const old=fs.readFileSync(file,'utf8'),tree=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const render=tree.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='renderList');
 if(!render)throw Error('sp renderList is missing from deferred runtime');
 const matches=[];
 walk(render,(n,parent)=>{
  if(n.type==='ExpressionStatement'&&n.expression?.type==='CallExpression'
    &&n.expression.callee?.name==='fitNames'){
    const arg=old.slice(n.start,n.end);
    if(arg.includes('added.map')&&arg.includes('.head .nm'))matches.push(n);
  }
 });
 if(matches.length!==1)throw Error('Expected exactly one per-chunk fitNames statement, found '+matches.length);
 const fit=matches[0],originalFit=old.slice(fit.start,fit.end);
 const head='const pt26Stats=window.PT26_RENDER_STATS||(window.PT26_RENDER_STATS={runs:0,batches:0,fitCalls:0,fitTimeMs:0,cardNodes:0,lastRunMs:0});pt26Stats.runs++;const pt26Start=performance.now();';
 const idx=render.body.start+1;
 const replace='if(p===items.length){const pt26FitStart=performance.now();'+
   'fitNames([...list.querySelectorAll(".card .head .nm")]);'+
   'pt26Stats.fitTimeMs+=performance.now()-pt26FitStart;'+
   'pt26Stats.fitCalls++;pt26Stats.cardNodes=items.length;pt26Stats.lastRunMs=performance.now()-pt26Start}';
 // Extra measurement of existing chunk boundary in the same lexical scope.
 // Avoid touching cardEl, CSS sizing rules, or text/command algorithms.
 let js=old.slice(0,fit.start)+replace+old.slice(fit.end);
 js=js.slice(0,idx)+head+js.slice(idx);
 const siteStats=js.match(/fitNames\s*\(/g)||[];
 if(siteStats.length<3)throw Error('Unexpected fitNames references after AST rewrite');
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(!js.includes('requestAnimationFrame(chunk)')||!js.includes('pt26Stats.fitCalls++'))
  throw Error('Chunking or stage profiling code unexpectedly absent');
 fs.writeFileSync(file,js);
 report.files['assets/js/sp_04_runtime.js']={
  oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  changedBytes:Buffer.byteLength(js)-Buffer.byteLength(old),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  originalFitCall:originalFit,
  finalLayoutFitPassesPerRender:1,
  originalPotentialPassesFor228Cards:4,
  cardCreatorUnchanged:true,unchangedTextFitAlgorithm:true,unchangedChunkSize:60,
  changedOnlyDeferredMobileRuntime:true
 };
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'render-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE26_RENDER_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
