/** PROJECT T Phase29: reduce fitNames cache allocation/call CPU on isolated mobile runtime only.
 * This tests one optimization hypothesis; it must pass A/B CPU regression gates.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parse} from 'acorn';
const ROOT=path.resolve('phase29-performance');
const name='assets/js/sp_04_runtime.js',file=path.join(ROOT,'optimized-site',name);
const report={phase:29,mode:'test-only',passed:false,errors:[],files:{},
 strategy:'Replace stage28 Map-per-heading cache with a two-slot object per heading to reduce allocations and lookup overhead, without changing query targets or fitNames layout logic.'};
try{
 const old=fs.readFileSync(file,'utf8');
 const oldHelper='const pt28Cache=new WeakMap();function pt28Query(el,sel){let bySel=pt28Cache.get(el);if(!bySel){bySel=new Map();pt28Cache.set(el,bySel)}if(!bySel.has(sel))bySel.set(sel,el.querySelector(sel));return bySel.get(sel)}';
 const newHelper='const pt28Cache=new WeakMap();function pt28Query(el,sel){let bySel=pt28Cache.get(el);if(!bySel){bySel=Object.create(null);pt28Cache.set(el,bySel)}const slot=sel===".cmdtxt"?"c":sel===".minfo"?"mi":null;if(slot===null)throw Error("Unexpected cached selector");if(!(slot in bySel))bySel[slot]=el.querySelector(sel);return bySel[slot]}';
 if(old.split(oldHelper).length!==2)throw Error('Expected exact Phase28 cache helper missing or duplicated');
 const js=old.replace(oldHelper,newHelper);
 const ast0=parse(old,{ecmaVersion:'latest',sourceType:'script'}),ast1=parse(js,{ecmaVersion:'latest',sourceType:'script'});
 const fit=ast=>ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id?.name==='fitNames');
 if(!fit(ast0)||!fit(ast1))throw Error('fitNames missing');
 if(js.includes('new Map()')&&!old.includes('new Map()'))throw Error('Unexpected Map construction');
 if(!js.includes('pt27HeadTemplate')||!js.includes('pt26Stats.fitCalls++')||!js.includes('requestAnimationFrame(chunk)'))throw Error('Earlier phase functionality missing');
 // Preserve all DOM/scaling logic except exactly the single cache helper.
 if(old.replace(oldHelper,'')!==js.replace(newHelper,''))throw Error('Unexpected runtime diff');
 fs.writeFileSync(file,js);
 report.files[name]={oldBytes:Buffer.byteLength(old),newBytes:Buffer.byteLength(js),
  oldSha256:crypto.createHash('sha256').update(old).digest('hex'),
  newSha256:crypto.createHash('sha256').update(js).digest('hex'),
  oneCacheHelperReplaced:true,fitNamesOtherCodeUnchanged:true,domAndRenderingUnchanged:true,
  cacheLifetime:'fitNames invocation',experimentalOptimization:true};
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'cache-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE29_CACHE_BUILD',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
