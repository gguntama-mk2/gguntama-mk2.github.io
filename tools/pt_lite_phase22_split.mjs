/** PROJECT T Phase22: move redundant masks out of initial JavaScript.
 * Preserve IDs, order, SHA-256-verify existing lazy JSON when opened.
 * Write only disposable CI test site, not tracked source or original assets.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {minify} from 'terser';
const ROOT=path.resolve('phase22-performance'),SITE=path.join(ROOT,'optimized-site');
const report={phase:22,mode:'test-only',passed:false,devices:{},errors:[]};
const fields=['attack','chip','counter','crouch','damage','guard','heat','hit','homing','jump','recovery','startup','tbreak','tracking','wall'];
const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function fnv(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0');}
function findArray(s){
 const m=/\bconst\s+CHARACTERS\s*=\s*/.exec(s);
 if(!m)throw Error('CHARACTERS declaration missing');
 const start=m.index+m[0].length;if(s[start]!=='[')throw Error('Expected characters JSON array');
 let d=0,q=false,escape=false;
 for(let i=start;i<s.length;i++){
  const c=s[i];
  if(q){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')q=false;continue;}
  if(c==='"'){q=true;continue;}
  if(c==='[')d++;
  else if(c===']'&&--d===0)return {start,end:i+1,begin:m.index};
 }
 throw Error('Unterminated array');
}
function pack(keys,c){
 const buf=Buffer.alloc(keys.length*2);
 keys.forEach(([k],i)=>{
  if(!Number.isInteger(k)||k<0||k>65535)throw Error('Fixed ID out of UInt16 '+c+' '+k);
  buf.writeUInt16LE(k,i*2);
 });
 return buf.toString('base64');
}
async function processDevice(device){
 const filename='assets/js/'+device+'_04.js',src=fs.readFileSync(filename,'utf8');
 const target=path.join(SITE,filename),baselineBytes=fs.statSync(target).size;
 const arr=findArray(src),list=JSON.parse(src.slice(arr.start,arr.end));
 if(list.length!==44)throw Error('Expected 44 characters');
 let total=0;const data=[];
 for(const c of list){
  const file=path.join(SITE,'assets/data/characters',c.id+'.json'),raw=JSON.parse(fs.readFileSync(file,'utf8'));
  if(raw.id!==c.id||raw.moves.length!==c.moves.length)throw Error('Wrong original JSON '+c.id);
  for(let i=0;i<c.moves.length;i++){
   const row=raw.moves[i],original=c.moves[i];
   const k=Number.isInteger(row?.k)?row.k:i;
   const mask=(Array.isArray(row?.off)?row.off:[]).map(v=>{
    const idx=fields.indexOf(v);
    if(idx<0)throw Error('Unknown mask flag '+c.id+' '+v);
    return letters[idx];
   }).join('');
   if(k!==original[0]||mask!==original[1])
    throw Error('Original technique mask and lazy JSON differ '+c.id+' '+i);
  }
  const full=JSON.stringify(c.moves),{moves,...rest}=c;
  const ids=c.moves.map(r=>r[0]);
  if(new Set(ids).size!==ids.length)throw Error('Duplicate fixed move IDs '+c.id);
  data.push({...rest,__pt22Keys64:pack(moves,c.id),
    __pt22Sha:crypto.createHash('sha256').update(full).digest('hex'),
    __pt22Fnv:fnv(full)});
  total+=moves.length;
 }
 if(total!==9569)throw Error('Unexpected total stable technique keys '+total);
 const generator='const CHARACTERS='+JSON.stringify(data)+
 '.map(c=>{const b=atob(c.__pt22Keys64);if(b.length%2)throw Error("Bad stable technique key pack");c.moves=Array.from({length:b.length/2},(_,i)=>({k:b.charCodeAt(i*2)|(b.charCodeAt(i*2+1)<<8),off:[]}));delete c.__pt22Keys64;return c;})';
 let code=src.slice(0,arr.begin)+generator+src.slice(arr.end);
 const decoder='CHARACTERS.forEach(c=>{c.moves=c.moves.map(r=>({k:r[0],off:Array.from(r[1],x=>PT_OFF_FIELDS[PT_OFF_CHARS.indexOf(x)])}));});';
 if(code.split(decoder).length!==2)throw Error('Original decoder mismatch '+device);
 code=code.replace(decoder,'/* Technique masks are in existing lazy JSON; fixed IDs are retained in initial shell. */');
 const a=code.indexOf('    for(let i=0;i<p.moves.length;i++){');
 const b=code.indexOf('    c.moves=p.moves;',a);
 if(a<0||b<0)throw Error('Cannot locate original character payload validation');
 const newValidator=[
  '    const packed=[];',
  '    for(let i=0;i<p.moves.length;i++){',
  '      const raw=p.moves[i],sk=c.moves[i];',
  '      const k=raw&&typeof raw==="object"&&Number.isInteger(raw.k)?raw.k:i;',
  '      if(k!==sk.k)throw new Error("stable move ID mismatch "+c.id+" "+i);',
  '      const off=raw&&typeof raw==="object"&&Array.isArray(raw.off)?raw.off:[];',
  '      const mask=off.map(f=>{const index=PT_OFF_FIELDS.indexOf(f);',
  '        if(index<0)throw new Error("unknown mask "+c.id+" "+f);return PT_OFF_CHARS[index]}).join("");',
  '      packed.push([k,mask]);',
  '    }',
  '    const canonical=JSON.stringify(packed);',
  '    if(pt22FNV(canonical)!==c.__pt22Fnv)throw new Error("technique flag checksum mismatch "+c.id);',
  '    if(globalThis.crypto&&crypto.subtle){',
  '      const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonical));',
  '      const hash=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,"0")).join("");',
  '      if(hash!==c.__pt22Sha)throw new Error("source technique digest mismatch "+c.id);',
  '    }',
  '    if(c.__ptLoaded)return c; /* Published override wins the race. */',
  ''
 ].join('\n');
 code=code.slice(0,a)+newValidator+code.slice(b);
 const oldStart='/* PTC-LAZY-START */\nfunction ptLoadMoves(c){';
 const newStart=[
  '/* PTC-LAZY-START */',
  'function pt22FNV(s){let h=2166136261;',
  ' for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}',
  ' return h.toString(16).padStart(8,"0");}',
  'function ptLoadMoves(c){'
 ].join('\n');
 if(!code.includes(oldStart))throw Error('Missing lazy module marker '+device);
 code=code.replace(oldStart,newStart);
 const oldPromise='  }).then(p=>{\n    if(c.__ptLoaded)return c; /* Published override wins over in-flight baseline. */';
 if(!code.includes(oldPromise))throw Error('Missing baseline promise handler '+device);
 code=code.replace(oldPromise,'  }).then(async p=>{\n    if(c.__ptLoaded)return c; /* Published override wins over in-flight baseline. */');
 const result=await minify(code,{compress:false,mangle:false,module:false,ecma:2020,
   format:{comments:/^!|@license|@preserve|copyright/i}});
 if(!result.code)throw Error('Terser did not produce technique shell');
 const output=result.code.endsWith('\n')?result.code:result.code+'\n';
 if(Buffer.byteLength(output)>=baselineBytes*0.83)throw Error('Insufficient saved bytes: '+device+' '+baselineBytes+' => '+Buffer.byteLength(output));
 fs.writeFileSync(target,output,'utf8');
 report.devices[device]={characters:list.length,originalKeys:total,oldBytes:baselineBytes,
   newBytes:Buffer.byteLength(output),savedBytes:baselineBytes-Buffer.byteLength(output),
   sourceVsCharacterJSONVerified:true,lazySha256:true,stableIDs:true,storageFormatUnchanged:true};
 console.log('PHASE22_SHELL',device,JSON.stringify(report.devices[device]));
}
try{await processDevice('pc');await processDevice('sp');report.passed=true;}
catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'js-split-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE22_JS_SPLIT_FINAL',JSON.stringify({passed:report.passed,
 devices:report.devices,errors:report.errors}).slice(0,12000));
if(!report.passed)process.exitCode=1;
