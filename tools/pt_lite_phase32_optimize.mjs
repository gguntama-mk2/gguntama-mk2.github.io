/** Phase32 conservative CPU experiment: reuse existing nm variable for badge.
 * Isolated CI-generated mobile test site only; the no-extra-variable candidate
 * supersedes the failed pt32First experiment. Must pass performance gate.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase32-performance'),name='assets/js/sp_04_runtime.js';
const file=path.join(ROOT,'optimized-site',name);
const report={phase:32,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Use existing nm firstElementChild binding for the adjacent memo badge; no additional local variable or DOM operation.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const card=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id?.name==='cardEl');
 if(!card)throw Error('Missing cardEl');
 const m=old.match(/pt27HeadTemplate\.innerHTML\s*=\s*(['"])(.*?)\1\s*;/);
 if(!m||!m[2].startsWith('<span class="nm"></span><span class="mbadge" hidden>'))
  throw Error('Static head template order changed');
 const before='head.firstElementChild.nextElementSibling.hidden=!memos[memoKey(C.id,m.i)];const nm=head.firstElementChild;';
 const after='const nm=head.firstElementChild;nm.nextElementSibling.hidden=!memos[memoKey(C.id,m.i)];';
 const original=old.slice(card.start,card.end);
 if(original.split(before).length!==2)throw Error('Expected exact audited Phase31 mini-header once');
 const changed=original.replace(before,after);
 const js=old.slice(0,card.start)+changed+old.slice(card.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(js.replace(after,'')!==old.replace(before,''))throw Error('Unexpected modifications outside exact header expression');
 for(const anchor of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)'])
  if(!js.includes(anchor))throw Error('Prior phase behavior lost '+anchor);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  singleHeaderFirstChildLookup:true,templateGuarded:true,cardDomUnchanged:true,fitNamesUnchanged:true,commandsAndIconsUntouched:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'first-child-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE32_HEAD_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
