/** PROJECT T Stage30 - static cloned card head DOM: remove redundant selector traversal.
 * Pure compile-time AST source-guarded rewrite of generated site in CI scratch.
 * Two CSS selectors are replaced by equivalent fixed positions in the known
 * immutable header template: .nm is first child, .mbadge is second child.
 * Do not change the card's content, event handlers, commands or fitNames.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase30-performance');
const name='assets/js/sp_04_runtime.js';
const file=path.join(ROOT,'optimized-site',name);
const report={phase:30,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Avoid two redundant CSS selector searches during each of 228 cardEl calls by using exact cloned template child positions; leave all cards, layout reads, style writes, save/media/login and icons untouched.'};
try {
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const card=ast.body.find(x=>x.type==='FunctionDeclaration'&&x.id?.name==='cardEl');
 if(!card)throw Error('Missing cardEl function');
 const template=ast.body.find(x=>x.type==='VariableDeclaration'&&x.declarations?.some(d=>d.id?.name==='pt27HeadTemplate'));
 if(!template)throw Error('Phase27 static head template missing');
 const htmlMatch=old.match(/pt27HeadTemplate\.innerHTML\s*=\s*(['"])(.*?)\1\s*;/);
 if(!htmlMatch)throw Error('Missing static head template HTML');
 const html=htmlMatch[2];
 if(!html.startsWith('<span class="nm"></span><span class="mbadge" hidden>'))
   throw Error('Template head child sequence changed: unsafe positional lookup');
 const edits=[];const counters={nm:0,mbadge:0};
 function walk(n){
  if(!n||typeof n!=='object')return;
  if(n.type==='CallExpression'&&n.callee?.type==='MemberExpression'
   &&!n.callee.computed&&n.callee.object?.name==='head'
   &&n.callee.property?.name==='querySelector'&&n.arguments?.length===1
   &&n.arguments[0].type==='Literal'){
    const s=n.arguments[0].value;
    if(s==='.nm'){edits.push({a:n.start,b:n.end,to:'head.firstElementChild'});counters.nm++}
    if(s==='.mbadge'){edits.push({a:n.start,b:n.end,to:'head.children[1]'});counters.mbadge++}
  }
  for(const [k,v] of Object.entries(n)){
   if(k==='start'||k==='end'||k==='loc')continue;
   if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')walk(v);
  }
 }
 walk(card.body);
 if(counters.nm!==1||counters.mbadge!==1)throw Error('Card selectors unexpectedly changed: '+JSON.stringify(counters));
 let js=old;
 for(const e of edits.sort((a,b)=>b.a-a.a))js=js.slice(0,e.a)+e.to+js.slice(e.b);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 for(const anchor of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)'])
  if(!js.includes(anchor))throw Error('Earlier stage behavior missing '+anchor);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  headerTemplatePositionValidated:true,querySelectorsEliminated:counters,
  cardDomUnchanged:true,fitNamesUnchanged:true,commandsAndIconsUntouched:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'dom-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE30_DOM_BUILD',JSON.stringify(report).slice(0,10000));
if(!report.passed)process.exitCode=1;
