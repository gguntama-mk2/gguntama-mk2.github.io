/** Phase33: cardEl opened state Set.has reuse, test-only experiment.
 * Source inspected in passing Phase32 test artifact. Prevent duplicate opened.has
 * per card without changing render DOM, state, attributes or event handlers.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {parse} from 'acorn';
const ROOT=path.resolve('phase33-performance'),name='assets/js/sp_04_runtime.js',file=path.join(ROOT,'optimized-site',name);
const report={phase:33,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Cache two matching opened.has(m.i) reads as one local Boolean inside cardEl, preserving behavior'};
try{
 const old=fs.readFileSync(file,'utf8');
 const ast=parse(old,{ecmaVersion:'latest',sourceType:'script'});
 const card=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id?.name==='cardEl');
 if(!card)throw Error('Missing cardEl');
 const original=old.slice(card.start,card.end);
 const before='if(opened.has(m.i)){card.classList.add("open");fillBody(body,m)}head.setAttribute("aria-expanded",opened.has(m.i));';
 const after='const pt33Open=opened.has(m.i);if(pt33Open){card.classList.add("open");fillBody(body,m)}head.setAttribute("aria-expanded",pt33Open);';
 if(original.split(before).length!==2)throw Error('Expected exact verified Phase32 opened.has pair once');
 if((original.match(/opened\.has\(m\.i\)/g)||[]).length!==2)throw Error('Unexpected opened state reads in cardEl');
 const changed=original.replace(before,after);
 const js=old.slice(0,card.start)+changed+old.slice(card.end);
 parse(js,{ecmaVersion:'latest',sourceType:'script'});
 if(js.replace(after,'')!==old.replace(before,''))throw Error('Unexpected changes beyond single state reuse');
 for(const marker of ['pt27HeadTemplate','pt28Query','pt26Stats.fitCalls++','renderSheetCmd','PTIcons.attach','requestAnimationFrame(chunk)'])
  if(!js.includes(marker))throw Error('Legacy behavior missing: '+marker);
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
 oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
 newSha256:crypto.createHash('sha256').update(js).digest('hex'),
 singleOpenedSetRead:true,cardDomUnchanged:true,fitNamesUnchanged:true,commandsAndIconsUntouched:true};
 report.passed=true;
}catch(e){report.errors.push(String(e.stack||e))}
fs.mkdirSync(ROOT,{recursive:true});fs.writeFileSync(path.join(ROOT,'opened-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE33_OPENED_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
