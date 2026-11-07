/** PROJECT T Phase31: test-only mobile card heading sibling access.
 * Stage30's head.children[1] reads a live HTMLCollection; test direct
 * firstElementChild.nextElementSibling on exactly the same immutable template.
 * An experiment, NOT a proven optimization until paired CPU benchmarks pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase31-performance'),name='assets/js/sp_04_runtime.js';
const file=path.join(ROOT,'optimized-site',name);
const report={phase:31,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Avoid one live HTMLCollection indexed access per mobile card by taking the immediate nextElementSibling of the verified first header child. No fitNames or card content modification.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const card=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id?.name==='cardEl');
 if(!card)throw Error('Missing cardEl');
 const templateMatch=old.match(/pt27HeadTemplate\.innerHTML\s*=\s*(['"])(.*?)\1\s*;/);
 if(!templateMatch||!templateMatch[2].startsWith('<span class="nm"></span><span class="mbadge" hidden>'))
  throw Error('Static heading child sequence changed; unsafe sibling path');
 const before='head.children[1]',after='head.firstElementChild.nextElementSibling';
 const original=old.slice(card.start,card.end);
 if(original.split(before).length!==2)throw Error('Expected exactly one Stage30 head.children[1] expression in cardEl');
 const changed=original.replace(before,after);
 const js=old.slice(0,card.start)+changed+old.slice(card.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(js.replace(after,'')!==old.replace(before,''))throw Error('Unexpected changes outside single header lookup');
 for(const anchor of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)'])
  if(!js.includes(anchor))throw Error('Stage30 behavior lost: '+anchor);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  guardedSingleLookup:true,templateOrderChecked:true,cardDomUnchanged:true,
  fitNamesUnchanged:true,commandsAndIconsUntouched:true,experimentalOptimization:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'head-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE31_HEAD_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
