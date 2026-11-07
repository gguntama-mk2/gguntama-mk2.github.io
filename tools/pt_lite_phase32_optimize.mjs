/** PROJECT T Phase32: single first-child lookup in each cloned mobile card header.
 * Experiment limited to CI-generated test site; must pass paired CPU and visual gates.
 * Based on Phase31 immutable heading order and residual render/DOM cost hypothesis.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase32-performance'),name='assets/js/sp_04_runtime.js';
const file=path.join(ROOT,'optimized-site',name);
const report={phase:32,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Reuse the validated first heading child in cardEl for both .nm and .mbadge lookups; avoid two firstElementChild DOM property reads while preserving full DOM, fitNames and icon/command behavior.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const card=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id?.name==='cardEl');
 if(!card)throw Error('cardEl not found');
 const html=old.match(/pt27HeadTemplate\.innerHTML\s*=\s*(['"])(.*?)\1\s*;/);
 if(!html||!html[2].startsWith('<span class="nm"></span><span class="mbadge" hidden>'))
  throw Error('Immutable heading template sibling order not verified');
 // Target the actual AST nodes, not whitespace-sensitive source snippets.
 // Acorn ExpressionStatement.end is exclusive. The next expression is allowed
 // to start exactly at that byte offset in minified JavaScript.
 // Guard that two firstElementChild reads occur inside cardEl only, and that
 // both are reached after the existing static template clone statement.
 const edits=[];
 let cloneStatement=null;
 function visit(n,parent){
  if(!n||typeof n!=='object')return;
  if(n.type==='ExpressionStatement'&&n.expression?.type==='CallExpression'){
   const c=n.expression;
   if(c.callee?.type==='MemberExpression'&&c.callee.object?.name==='head'
      &&c.callee.property?.name==='appendChild'&&c.arguments?.length===1
      &&old.slice(c.arguments[0].start,c.arguments[0].end)==='pt27HeadTemplate.content.cloneNode(true)'){
     if(cloneStatement)throw Error('Duplicate template clone');
     cloneStatement=n;
   }
  }
  if(n.type==='MemberExpression'&&!n.computed&&n.object?.name==='head'
    &&n.property?.name==='firstElementChild'){
    edits.push({a:n.start,b:n.end,text:'pt32First',parent:parent?.type});
  }
  for(const [key,value] of Object.entries(n)){
   if(['start','end','loc'].includes(key))continue;
   if(Array.isArray(value))value.forEach(x=>visit(x,n));
   else if(value&&typeof value==='object')visit(value,n);
  }
 }
 visit(card.body,null);
 if(!cloneStatement||edits.length!==2
   ||edits.some(e=>e.a<cloneStatement.end))
  throw Error('Unsafe heading access shape: '+JSON.stringify({clone:!!cloneStatement,reads:edits.length,positions:edits.map(e=>e.a)}));
 const modifications=[
  ...edits,
  {a:cloneStatement.end,b:cloneStatement.end,text:'\n  const pt32First = head.firstElementChild;'}
 ];
 let js=old;
 for(const e of modifications.sort((x,y)=>y.a-x.a))
  js=js.slice(0,e.a)+e.text+js.slice(e.b);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(!js.includes('pt32First.nextElementSibling')||!js.includes('pt32First;'))
  throw Error('New code missing');
 if(js.slice(0,card.start)!==old.slice(0,card.start))throw Error('Unexpected changes outside cardEl');
 for(const anchor of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)'])
  if(!js.includes(anchor))throw Error('Previous behavior missing '+anchor);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  singleHeaderFirstChildLookup:true,templateGuarded:true,
  cardDomUnchanged:true,fitNamesUnchanged:true,commandsAndIconsUntouched:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'first-child-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE32_HEAD_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
