/** PROJECT T Phase20: compress only CSS unicode-range, never font glyph data.
 * The CSS remains disjoint across the actual 1,674 supported codepoints.
 * Adjacent ranges are merged only when no codepoint belongs to the other shard.
 * All writes are strictly inside the ephemeral Phase20 test site.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT=path.resolve('phase20-performance'),SITE=path.join(ROOT,'optimized-site');
const CSS=path.join(SITE,'assets/css/pt19-maru-shards.css');
const report={phase:20,mode:'test-copy-only',passed:false,method:'disjoint codepoint-run CSS compression',faces:[],errors:[],homeInteractionHint:false};
function cssRange(token){
 const s=token.trim().toUpperCase();
 const m=s.match(/^U\+([0-9A-F]{1,6})(?:-([0-9A-F]{1,6}))?$/);
 if(!m)throw Error('Unexpected original unicode-range token '+s);
 const a=parseInt(m[1],16),b=m[2]?parseInt(m[2],16):a;
 if(!(a<=b&&b<=0x10ffff))throw Error('Invalid CSS unicode-range '+s);
 return [a,b];
}
function shortRange(a,b){
 const lo=a.toString(16).toUpperCase(),hi=b.toString(16).toUpperCase();
 if(a===b)return 'U+'+lo;
 for(let shift=1;shift<=5;shift++){
  const span=16**shift;
  if(a%span===0&&b===a+span-1){
   const prefix=(a/span).toString(16).toUpperCase();
   if(prefix.length+shift<=6)return 'U+'+prefix+'?'.repeat(shift);
  }
 }
 return 'U+'+lo+'-'+hi;
}
try{
 const before=fs.readFileSync(CSS,'utf8');
 const regex=/@font-face\s*\{[^}]*font-family:"MaruGoKawa"[^}]*\}/g;
 const faces=[...before.matchAll(regex)].map(m=>m[0]);
 if(faces.length!==2)throw Error('Expected exactly two MaruGoKawa CSS faces, found '+faces.length);
 const owner=new Map(),originalRanges=[];
 for(let i=0;i<faces.length;i++){
  const ur=faces[i].match(/unicode-range:([^;}]+)/);
  if(!ur)throw Error('Missing unicode-range on font face '+i);
  const tokens=ur[1].split(',').filter(Boolean),cps=new Set();
  for(const t of tokens){
   const [start,end]=cssRange(t);
   for(let cp=start;cp<=end;cp++){
    if(owner.has(cp)&&owner.get(cp)!==i)throw Error('Overlap in old CSS at codepoint '+cp);
    cps.add(cp);owner.set(cp,i);
   }
  }
  originalRanges.push(cps);
 }
 if(owner.size!==1674)throw Error('Unexpected original cmap coverage from phase18 '+owner.size);
 const sorted=[...owner].sort((a,b)=>a[0]-b[0]);
 const groups=[[],[]];let start=sorted[0][0],end=start,current=sorted[0][1];
 for(let k=1;k<sorted.length;k++){
  const [cp,belong]=sorted[k];
  if(belong===current){end=cp;}
  else{groups[current].push([start,end]);start=end=cp;current=belong;}
 }
 groups[current].push([start,end]);
 let after=before;
 for(let i=0;i<faces.length;i++){
  const old=faces[i],tokens=groups[i].map(([a,b])=>shortRange(a,b)),replacement=tokens.join(',');
  const next=old.replace(/unicode-range:([^;}]+)/,'unicode-range:'+replacement);
  if(next===old)throw Error('No CSS rewrite for font '+i);
  const newUr=next.match(/unicode-range:([^;}]+)/)?.[1]||'';
  const coverage=new Set();
  for(const t of newUr.split(',')){
   const w=t.match(/^U\+([0-9A-F]+)(\?+)$/i);
   const range=w?[parseInt(w[1],16)*16**w[2].length,
                   (parseInt(w[1],16)+1)*16**w[2].length-1]:cssRange(t);
   const [a,b]=range;
   for(let cp=a;cp<=b;cp++){
    if(owner.has(cp)&&owner.get(cp)!==i)throw Error('Rewritten CSS includes wrong shard '+i+' cp '+cp);
    if(owner.get(cp)===i)coverage.add(cp);
   }
  }
  if(coverage.size!==originalRanges[i].size)throw Error('Glyph coverage changed in CSS shard '+i);
  after=after.replace(old,next);
  report.faces.push({shard:i,originalRanges:old.match(/unicode-range:([^;}]+)/)[1].split(',').length,
    compressedRanges:tokens.length,supportedCodepoints:coverage.size,
    originalUnicodeTextBytes:Buffer.byteLength(old.match(/unicode-range:([^;}]+)/)[1]),
    compressedUnicodeTextBytes:Buffer.byteLength(replacement),
    sourceUnchanged:(old.match(/src:url\([^)]*\)/)||[])[0]===(next.match(/src:url\([^)]*\)/)||[])[0]});
 }
 fs.writeFileSync(CSS,after,'utf8');
 report.oldCssBytes=Buffer.byteLength(before);
 report.newCssBytes=Buffer.byteLength(after);
 report.cssBytesSaved=report.oldCssBytes-report.newCssBytes;
 report.allOriginalCodepointsRetained=true;
 report.fontBinaryFilesUntouched=true;
 if(report.cssBytesSaved<=0)throw Error('Compact unicode-range did not reduce CSS bytes');
 // Early intent hint: start deferred stylesheet only when user explicitly
 // interacts with SHEET navigation, not on idle/hover/home preload.
 for(const dev of ['pc','sp']){
  const f=path.join(SITE,dev+'.html');
  let s=fs.readFileSync(f,'utf8');
  const anchor='  window.PT19_ENSURE_FONTS=ensure;';
  if(s.split(anchor).length!==2)throw Error('Phase19 font router anchor changed in '+dev);
  const hint=[
   '  /* Phase20: a sheet pointerdown or keyboard navigation can start font CSS before page-state change. */',
   '  document.addEventListener("pointerdown",function(e){',
   '    var b=e.target.closest("[data-go]");',
   '    if(b&&b.getAttribute("data-go")==="sheet")ensure();',
   '  },{capture:true,passive:true});',
   '  document.addEventListener("keydown",function(e){',
   '    if(e.key!=="Enter"&&e.key!==" ")return;',
   '    var b=e.target.closest("[data-go]");',
   '    if(b&&b.getAttribute("data-go")==="sheet")ensure();',
   '  },{capture:true});'
  ].join('\n');
  s=s.replace(anchor,anchor+'\n'+hint);
  fs.writeFileSync(f,s,'utf8');
 }
 report.homeInteractionHint=true;
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'unicode-css-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log('PHASE20_UNICODE_CSS',JSON.stringify(report).slice(0,10000));
if(!report.passed)process.exitCode=1;
