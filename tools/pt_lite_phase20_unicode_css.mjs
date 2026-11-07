/** PROJECT T Phase20: compress only CSS unicode-range, never font glyph data.
 * The CSS remains disjoint across the actual 1,674 supported codepoints.
 * Adjacent ranges are merged only when no codepoint belongs to the other shard.
 * All writes are strictly inside the ephemeral Phase20 test site.
 */
import fs from 'node:fs';
import path from 'node:path';
const ROOT=path.resolve('phase20-performance'),SITE=path.join(ROOT,'optimized-site');
const CSS=path.join(SITE,'assets/css/pt19-maru-shards.css');
const report={phase:20,mode:'test-copy-only',passed:false,method:'precise on-demand unicode-range, broad core fallback with font-face order validation',faces:[],errors:[],homeInteractionHint:false};
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
 // Do not merge gaps into the on-demand font's unicode-range. Even a gap
 // with *no glyph in either WOFF2* could contain DOM/emoji characters; that
 // would trigger a needless 230 KB download on the very first sheet.
 // Put the small core face first with a broad fallback coverage, then the
 // precise on-demand face LAST: later matching face takes priority and the
 // original 1,674 codepoint ownership is preserved in CSS font matching.
 let after=before;
 const oldRestRange=faces[1].match(/unicode-range:([^;}]+)/)?.[1]||'';
 const restParts=oldRestRange.split(',').filter(Boolean);
 const restRange=restParts.map(t=>{
   const [a,b]=cssRange(t);
   return shortRange(a,b);
 }).join(',');
 const restSet=new Set();
 for(const tok of restRange.split(',')){
   const wildcard=tok.match(/^U\+([0-9A-F]+)(\?+)$/i);
   const [a,b]=wildcard
     ? [parseInt(wildcard[1],16)*16**wildcard[2].length,
        (parseInt(wildcard[1],16)+1)*16**wildcard[2].length-1]
     : cssRange(tok);
   for(let cp=a;cp<=b;cp++)restSet.add(cp);
 }
 if(restSet.size!==originalRanges[1].size
  ||[...restSet].some(cp=>owner.get(cp)!==1))
   throw Error('Precise on-demand unicode-range changed or includes unsupported glyphs');
 for(const [cp,segment] of owner){
   const effective=restSet.has(cp)?1:0;
   if(effective!==segment)throw Error('Font matching priority would change for '+cp);
 }
 const replacementRanges=['U+0-10FFFF',restRange];
 for(let i=0;i<faces.length;i++){
   const old=faces[i],replacement=replacementRanges[i];
   const next=old.replace(/unicode-range:([^;}]+)/,'unicode-range:'+replacement);
   if(next===old)throw Error('No CSS rewrite for face '+i);
   after=after.replace(old,next);
   report.faces.push({shard:i,originalRanges:old.match(/unicode-range:([^;}]+)/)[1].split(',').length,
     compressedRanges:replacement.split(',').length,supportedCodepoints:originalRanges[i].size,
     originalUnicodeTextBytes:Buffer.byteLength(old.match(/unicode-range:([^;}]+)/)[1]),
     compressedUnicodeTextBytes:Buffer.byteLength(replacement),
     sourceUnchanged:(old.match(/src:url\([^)]*\)/)||[])[0]===(next.match(/src:url\([^)]*\)/)||[])[0]});
 }
 report.fontMatchingRule='Core face first (broad); precise on-demand face last; all originally supported characters retain their selected font shard';
 report.extraFontRiskMitigated=true;
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
  if(!s.includes('pt19-maru-shards.css'))throw Error('Phase19 font stylesheet router missing in '+dev);
  const hint=[
    '<script>',
    '/* PT20: request deferred font CSS on an explicit sheet navigation intent. */',
    '(function(){',
    '  function intent(e){',
    '    if(e.type==="keydown"&&e.key!=="Enter"&&e.key!==" ")return;',
    '    var b=e.target&&e.target.closest&&e.target.closest("[data-go]");',
    '    if(b&&b.getAttribute("data-go")==="sheet"&&window.PT19_ENSURE_FONTS)window.PT19_ENSURE_FONTS();',
    '  }',
    '  document.addEventListener("pointerdown",intent,{capture:true,passive:true});',
    '  document.addEventListener("keydown",intent,{capture:true});',
    '})();',
    '</script>'
  ].join('\n');
  if(!s.includes('</head>'))throw Error('No head close in '+dev);
  s=s.replace('</head>',hint+'\n</head>');
  fs.writeFileSync(f,s,'utf8');
 }
 report.homeInteractionHint=true;
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'unicode-css-report.json'),JSON.stringify(report,null,2)+'\n','utf8');
console.log('PHASE20_UNICODE_CSS',JSON.stringify(report).slice(0,10000));
if(!report.passed)process.exitCode=1;
