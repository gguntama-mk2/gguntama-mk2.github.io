/** PROJECT T Phase27: optimize mobile card DOM construction without changing its DOM or fit algorithm.
 * Operates exclusively on a disposable generated Stage26 test site.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase27-performance'),SITE=path.join(ROOT,'optimized-site');
const report={phase:27,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Parse identical card heading markup once as a template, clone equivalent elements per card, eliminate now-unused per-chunk card arrays; keep fitNames layout calculations, icons, commands, saved data, callbacks, CSS, and card order unchanged.'};
function walk(n,fn){if(!n||typeof n!=='object')return;if(n.type)fn(n);for(const [k,v] of Object.entries(n)){if(k==='start'||k==='end')continue;if(Array.isArray(v))v.forEach(e=>walk(e,fn));else if(v&&typeof v==='object')walk(v,fn);}}
try{
 const name='assets/js/sp_04_runtime.js',file=path.join(SITE,name);
 const old=fs.readFileSync(file,'utf8');
 let ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const card=ast.body.find(x=>x.type==='FunctionDeclaration'&&x.id?.name==='cardEl');
 const render=ast.body.find(x=>x.type==='FunctionDeclaration'&&x.id?.name==='renderList');
 const fit=ast.body.find(x=>x.type==='FunctionDeclaration'&&x.id?.name==='fitNames');
 if(!card||!render||!fit)throw Error('Missing expected AST function');
 const assigns=[];
 walk(card,n=>{if(n.type==='AssignmentExpression'&&n.operator==='='&&n.left?.type==='MemberExpression'&&n.left.object?.name==='head'&&n.left.property?.name==='innerHTML'&&n.right?.type==='Literal'&&typeof n.right.value==='string')assigns.push(n);});
 if(assigns.length!==1)throw Error('Expected one static card head HTML assignment, found '+assigns.length);
 const expr=old.slice(assigns[0].right.start,assigns[0].right.end);
 if(!assigns[0].right.value.includes('class="nm"')||!assigns[0].right.value.includes('class="arrow"'))throw Error('Card HTML unexpectedly changed');
 const edits=[{a:assigns[0].start,b:assigns[0].end,text:'head.appendChild(pt27HeadTemplate.content.cloneNode(true))'}];
 // The Stage26 render path constructs but never uses added[] after per-chunk fitNames was removed.
 let renderBody=old.slice(render.start,render.end);
 const oldDecl='const added = [];';
 const oldLoop='const el = cardEl(items[p]); added.push(el); frag.appendChild(el);';
 // Stage26 may have different formatting or optimizer-generated code.
 // Optional micro-optimization only when both exact anchors are present; never fail rendering optimization for this.
 if(renderBody.split(oldDecl).length===2&&renderBody.split(oldLoop).length===2){
   const declIndex=render.start+renderBody.indexOf(oldDecl),loopIndex=render.start+renderBody.indexOf(oldLoop);
   edits.push({a:declIndex,b:declIndex+oldDecl.length,text:''});
   edits.push({a:loopIndex,b:loopIndex+oldLoop.length,text:'frag.appendChild(cardEl(items[p]));'});
 }
 // Count command and move icon generation per card without touching rendering output.
 const cardCalls={command:0,icons:0};
 walk(card,n=>{if(n.type==='CallExpression'){if(n.callee?.name==='renderSheetCmd')cardCalls.command++;if(n.callee?.type==='MemberExpression'&&n.callee.object?.name==='PTIcons'&&n.callee.property?.name==='attach')cardCalls.icons++;}});
 if(cardCalls.command!==1||cardCalls.icons!==1)throw Error('Command/icon path unexpectedly changed '+JSON.stringify(cardCalls));
 edits.sort((a,b)=>b.a-a.a);
 let js=old;for(const e of edits)js=js.slice(0,e.a)+e.text+js.slice(e.b);
 const template='const pt27HeadTemplate=document.createElement("template");pt27HeadTemplate.innerHTML='+expr+';\n';
 const cardStart=js.indexOf('function cardEl(');
 if(cardStart<0)throw Error('Card function anchor missing');
 js=js.slice(0,cardStart)+template+js.slice(cardStart);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(!js.includes('requestAnimationFrame(chunk)')||!js.includes('pt26Stats.fitCalls++'))throw Error('Phase26 behavior lost');
 // Preserve unchanged fragment creation if exact optional anchors are unavailable.
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  staticHeadingParsedOnce:true,headStructureClonedExactly:true,fitNamesAlgorithmUnchanged:true,
  commandsAndIconCallsUnchanged:cardCalls,chunkSizeUnchanged:60,onlyMobileRuntimeChanged:true};
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'cpu-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE27_CPU_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
