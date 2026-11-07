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
 const orig=old.slice(card.start,card.end);
 const marker='head.appendChild(pt27HeadTemplate.content.cloneNode(true))';
 const badge='head.firstElementChild.nextElementSibling';
 const nameExpr='const nm = head.firstElementChild;';
 if(orig.split(marker).length!==2||orig.split(badge).length!==2||orig.split(nameExpr).length!==2)
  throw Error('Phase31 AST source anchors missing or repeated');
 const changed=orig.replace(marker,marker+';const pt32First=head.firstElementChild')
   .replace(badge,'pt32First.nextElementSibling')
   .replace(nameExpr,'const nm = pt32First;');
 // The extra declaration is after the clone, before either reference.
 const js=old.slice(0,card.start)+changed+old.slice(card.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(!js.includes('pt32First.nextElementSibling')||!js.includes('const nm = pt32First;'))
  throw Error('New code missing');
 if(js.replace(changed,orig)!==old)throw Error('Unexpected edits outside cardEl');
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
