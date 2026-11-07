/** PROJECT T Phase21 test-only CSS + font delivery optimization.
 * Never edit tracked production source assets; operate on CI test copy only.
 */
import fs from 'node:fs';
import path from 'node:path';
import {minify} from 'terser';
const ROOT=path.resolve('phase21-performance'),SITE=path.join(ROOT,'optimized-site');
const file=path.join(SITE,'assets/css/pt19-maru-shards.css');
const report={phase:21,passed:false,mode:'test-copy-only',css:{},html:{},errors:[]};
function bounds(t){
 const w=t.match(/^U\+([0-9a-f]+)(\?+)$/i);
 if(w){const a=parseInt(w[1],16)*16**w[2].length;return [a,a+16**w[2].length-1];}
 const m=t.match(/^U\+([0-9a-f]{1,6})(?:-([0-9a-f]{1,6}))?$/i);
 if(!m)throw Error('Unexpected range '+t);
 const a=parseInt(m[1],16),b=m[2]?parseInt(m[2],16):a;
 if(a>b||b>0x10ffff)throw Error('Invalid range '+t);
 return [a,b];
}
function format(a,b){
 if(a===b)return 'U+'+a.toString(16).toUpperCase();
 let best='U+'+a.toString(16).toUpperCase()+'-'+b.toString(16).toUpperCase();
 for(let k=1;k<5;k++){
  const n=16**k;
  if(a%n!==0||b!==a+n-1)continue;
  const x='U+'+(a/n).toString(16).toUpperCase()+'?'.repeat(k);
  if(x.length<best.length)best=x;
 }
 return best;
}
function exactOptimize(cssList){
 const chars=new Set();
 for(const t of cssList.split(',')){const [a,b]=bounds(t);for(let x=a;x<=b;x++)chars.add(x);}
 const arr=[...chars].sort((a,b)=>a-b),runs=[];
 for(const v of arr){const prev=runs.at(-1);if(prev&&v===prev[1]+1)prev[1]=v;else runs.push([v,v]);}
 const out=runs.map(([a,b])=>format(a,b)).join(',');
 const check=new Set();
 for(const t of out.split(',')){const [a,b]=bounds(t);for(let x=a;x<=b;x++)check.add(x);}
 if(check.size!==chars.size||[...check].some(x=>!chars.has(x)))throw Error('Font face codepoint coverage changed');
 return {out,codepoints:chars.size,ranges:runs.length};
}
const router=[
 '(function(){',
 'var t,ok,no;',
 'window.PT19_FONT_READY=new Promise(function(r,j){ok=r;no=j});',
 'function ensure(){if(t)return;t=document.createElement("link");t.rel="stylesheet";t.href="assets/css/pt19-maru-shards.css";',
 't.onload=function(){document.fonts.ready.then(ok,no)};t.onerror=function(){no(Error("font CSS failed"))};document.head.appendChild(t)}',
 'function page(){if(document.documentElement.getAttribute("data-page")!=="home")ensure()}',
 'function hint(e){if(e.type==="keydown"&&e.key!=="Enter"&&e.key!==" ")return;',
 'var b=e.target&&e.target.closest&&e.target.closest("[data-go=sheet]");if(b)ensure()}',
 'window.PT19_ENSURE_FONTS=ensure;',
 'new MutationObserver(page).observe(document.documentElement,{attributes:true,attributeFilter:["data-page"]});',
 'addEventListener("hashchange",page);',
 '["pointerover","pointerdown","focusin","keydown"].forEach(function(n){document.addEventListener(n,hint,{capture:true,passive:n!=="keydown"})});',
 'page()',
 '})();'
].join('');
try{
 const original=fs.readFileSync(file,'utf8');
 const faces=[...original.matchAll(/@font-face\s*\{[^}]*font-family:"MaruGoKawa"[^}]*\}/g)].map(x=>x[0]);
 if(faces.length!==2)throw Error('Expected two MaruGoKawa @font-face declarations');
 const originalRange=faces[1].match(/unicode-range:([^;}]+)/)?.[1]||'';
 const safe=exactOptimize(originalRange);
 if(safe.codepoints!==1038)throw Error('Wrong on-demand codepoint set '+safe.codepoints);
 // For @font-face, normal style and weight 400 are descriptor defaults.
 // Removing these declarations does not change font choice or glyph metrics.
 const dropDefaults=face=>{
  if(!face.includes('font-style:normal;')||!face.includes('font-weight:400;'))
   throw Error('Missing known normal/400 font-face defaults');
  return face.replace('font-style:normal;','').replace('font-weight:400;','');
 };
 const core=dropDefaults(faces[0]);
 const replacement=dropDefaults(faces[1].replace(/unicode-range:([^;}]+)/,'unicode-range:'+safe.out));
 const nextCss=original.replace(faces[0],core).replace(faces[1],replacement);
 if(!nextCss.includes(core))throw Error('Core font-face semantics changed');
 if(replacement.match(/src:url\([^)]*\)/)?.[0]!==faces[1].match(/src:url\([^)]*\)/)?.[0])
   throw Error('Font source path changed');
 if(nextCss.length>original.length)throw Error('CSS compression expanded');
 fs.writeFileSync(file,nextCss,'utf8');
 report.css={beforeBytes:Buffer.byteLength(original),afterBytes:Buffer.byteLength(nextCss),
  savedBytes:Buffer.byteLength(original)-Buffer.byteLength(nextCss),
  oldRanges:originalRange.split(',').length,newRanges:safe.out.split(',').length,
  unchangedFontFiles:true,exactOnDemandCodepoints:safe.codepoints,
  removedOnlyRedundantDefaultDescriptors:true};
 const minified=await minify(router,{compress:false,mangle:false,format:{comments:false}});
 if(!minified.code?.includes('PT19_FONT_READY')||!minified.code.includes('PT19_ENSURE_FONTS'))
   throw Error('Minified router lost required APIs');
 const combined='<script>'+minified.code+'</script>';
 const oldA=/<script>\s*\/\* Phase19 test-copy font routing:[\s\S]*?<\/script>/g;
 const oldB=/<script>\s*\/\* PT20: request deferred font CSS[\s\S]*?<\/script>/g;
 for(const dev of ['pc','sp']){
  const p=path.join(SITE,dev+'.html'),before=fs.readFileSync(p,'utf8');
  if([...before.matchAll(oldA)].length!==1||[...before.matchAll(oldB)].length!==1)
    throw Error('Old font router script anchors not unique in '+dev);
  const after=before.replace(oldA,combined).replace(oldB,'');
  if(after===before)throw Error('Router replacement did not occur');
  fs.writeFileSync(p,after,'utf8');
  report.html[dev]={beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(after),
    savedBytes:Buffer.byteLength(before)-Buffer.byteLength(after),
    earlyPointerHover:true,keyboardFocus:true,touchPointerdown:true};
  if(report.html[dev].savedBytes<200)throw Error('Home JS savings too small in '+dev);
 }
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'css-delivery-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE21_CSS_DELIVERY',JSON.stringify(report));
if(!report.passed)process.exitCode=1;
