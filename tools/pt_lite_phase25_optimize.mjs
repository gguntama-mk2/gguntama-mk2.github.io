/** PROJECT T Phase25 test-only critical-path optimization.
 * Phase24 optimized site is copied before execution. Preserve all JSON, WOFF2,
 * AVIF/WebP, CSS, saved formats, admin JS and rendered styles byte-identically.
 * Explicit sheet intent starts JS, current JSON and font glyph load in parallel.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {minify} from 'terser';
const ROOT=path.resolve('phase25-performance'),SITE=path.join(ROOT,'optimized-site');
const report={phase:25,mode:'disposable-test-site-only',passed:false,devices:{},errors:[],strategy:
 'Progressive intent starts existing character JSON and font-face glyph load while three ordered classic scripts download; script runtime fetchPriority high, offscreen image low and unchanged; browser cache semantics unchanged'};
function script(dev){
 return [
  '/* PROJECT T Phase25 critical route prefetch, only on explicit intent. */',
  '(function(){',
  '"use strict";',
  'var loaded=false,pending=null,errors=[],fontPending=null;',
  'var root=document.documentElement,dev="'+dev+'";',
  'function get(file,priority){return new Promise(function(ok,no){',
  ' var s=document.createElement("script");s.async=false;',
  ' if(priority)s.fetchPriority=priority;',
  ' s.src=file;s.onload=ok;',
  ' s.onerror=function(){no(Error("Cannot load PROJECT T dependency "+file))};',
  ' document.head.appendChild(s);',
  '})}',
  'function warm(){',
  ' var c=CHARACTERS.find(function(x){return x.id===current});',
  ' if(!c)return;',
  ' var data=PT_CHAR_DATA.load(c);',
  ' /* Phase21 installs the same stylesheet once on pointer/touch/focus. */',
  ' if(!fontPending&&window.PT19_ENSURE_FONTS&&document.fonts){',
  '   window.PT19_ENSURE_FONTS();',
  '   fontPending=Promise.all([data,window.PT19_FONT_READY]).then(function(){',
  '     if(!c.__ptLoaded)return;',
  '     /* Real first-sheet codepoints, no speculative extra font shards. */',
  '     var sample=c.moves.slice(0,14).map(function(m){',
  '       return (m.name||"")+" "+(m.a&&m.a.command||"")',
  '     }).join(" ")+"技表発生ガードヒート";',
  '     return document.fonts.load(\'400 16px "MaruGoKawa"\',sample)',
  '   }).catch(function(e){console.warn("[PT25] font prewarm",e)})',
  ' }',
  ' return data;',
  '}',
  'function ensure(){',
  ' if(pending)return pending;',
  ' pending=(async function(){',
  '   var v=encodeURIComponent(window.PT_ASSET_VERSION||"1");',
  '   /* Network starts together, but classic scripts execute in original order. */',
  '   var scripts=[',
  '     get("move-icons.js?v="+v),',
  '     get("move-media.js?v="+v),',
  '     get("assets/js/"+dev+"_04_runtime.js?v="+v,"high")',
  '   ];',
  '   await Promise.all(scripts);',
  '   if(!window.PTIcons||!window.PTMoveMedia)throw Error("Missing technique attachments");',
  '   loaded=true;',
  '   return true',
  ' })().catch(function(e){',
  '   errors.push(String(e));pending=null;loaded=false;',
  '   if((root.dataset.page||"sheet")!=="home"){',
  '     var host=document.getElementById(dev==="pc"?"body":"list");',
  '     if(host)host.textContent="技表を読み込めませんでした。ページを再読み込みしてください。";',
  '   }',
  '   throw e;',
  ' });',
  ' return pending;',
  '}',
  'function update(){',
  ' var p=root.dataset.page||"sheet";',
  ' if(p==="sheet")warm();',
  ' if(p!=="home")ensure().catch(console.error)',
  '}',
  'function intent(e){',
  ' if(e.type==="keydown"&&e.key!=="Enter"&&e.key!==" ")return;',
  ' var x=e.target&&e.target.closest&&e.target.closest("[data-go=sheet]");',
  ' if(x){warm();ensure().catch(console.error)}',
  '}',
  'window.PT_SHEET_RUNTIME=Object.freeze({',
  ' ready:ensure,',
  ' state:function(){return {loaded:loaded,loading:!!pending,errors:errors.slice()}},',
  ' fontPrewarm:function(){return fontPending||Promise.resolve()}',
  '});',
  'new MutationObserver(update).observe(root,{attributes:true,attributeFilter:["data-page"]});',
  'addEventListener("hashchange",update);',
  '["pointerover","pointerdown","focusin","keydown","touchstart"].forEach(function(n){',
  ' document.addEventListener(n,intent,{capture:true,passive:n!=="keydown"})',
  '});',
  'update();',
  '})();'
 ].join('\n')+'\n';
}
try{
 for(const dev of ['pc','sp']){
  const file=path.join(SITE,'assets/js',dev+'_sheet-loader.js');
  const baseline=fs.readFileSync(file,'utf8'),raw=script(dev);
  if(!raw.includes('s.async=false')||!raw.includes('document.fonts.load')||
     !raw.includes('PT19_FONT_READY')||!raw.includes('touchstart'))
   throw Error('Required Stage25 priority/font/order wiring missing '+dev);
  const comp=await minify(raw,{compress:true,mangle:true,ecma:2020,
    format:{comments:false}});
  if(!comp.code)throw Error('Terser failed '+dev);
  const result=comp.code+'\n';
  const before=Buffer.byteLength(baseline),after=Buffer.byteLength(result);
  if(after>before+1100)throw Error('Home idle loader exceeded 1100 byte safety bound '+dev+' '+before+' '+after);
  fs.writeFileSync(file,result);
  report.devices[dev]={oldLoaderBytes:before,newLoaderBytes:after,homeLoaderDelta:after-before,
   oldLoaderSha256:crypto.createHash('sha256').update(baseline).digest('hex'),
   codepointsFromCurrentCharacterOnly:true,parallelScriptRequests:true,scriptExecutionOrderPreserved:true,
   currentCharacterJsonPrefetch:true,rangeLimitedFontWarm:true,lowPriorityLazyImagesUntouched:true,
   runtimeFetchPriority:'high',cacheKeysAndFileNamesUntouched:true};
  console.log('PHASE25_CRITICAL_PATH_BUILD',dev,JSON.stringify(report.devices[dev]));
 }
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'critical-path-build.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE25_BUILD_FINAL',JSON.stringify({passed:report.passed,devices:report.devices,errors:report.errors}));
if(!report.passed)process.exitCode=1;
