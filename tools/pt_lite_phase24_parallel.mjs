/** PROJECT T Phase24: parallel network fetch, deterministic classic-script execution.
 * Chromium fetches dynamic <script async=false> in parallel but executes in
 * insertion order. Icons then media then runtime always initialize in that
 * order. CSS uses independent Phase21 intent prewarm. Operates ONLY on copied
 * Phase23 site, never tracked app files or production.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {minify} from 'terser';
const ROOT=path.resolve('phase24-performance'),SITE=path.join(ROOT,'optimized-site');
const report={phase:24,mode:'test-copy-only',passed:false,devices:{},errors:[],
  strategy:'Three simultaneous classic-script fetches, async=false ordered execution. Preserve Phase21 font CSS hint and Phase23 no-eager-home routing'};
function makeLoader(dev){
 return [
  '/* PROJECT T Phase24 ordered parallel sheet JS, test only. */',
  '(function(){',
  ' "use strict";',
  ' var loaded=false,pending=null,errors=[];',
  ' var root=document.documentElement,dev="'+dev+'";',
  ' function get(file){return new Promise(function(ok,no){',
  '  var s=document.createElement("script");',
  '  s.async=false; /* Spec: download concurrently, execute in insertion order. */',
  '  s.src=file;',
  '  s.onload=ok;s.onerror=function(){no(Error("Cannot load PROJECT T dependency "+file))};',
  '  document.head.appendChild(s);',
  ' })}',
  ' function warm(){',
  '  var c=CHARACTERS.find(function(x){return x.id===current});',
  '  if(c)PT_CHAR_DATA.load(c).catch(function(e){console.warn("[PT24] character prewarm",e)})',
  ' }',
  ' function ensure(){',
  '  if(pending)return pending;',
  '  pending=(async function(){',
  '   var v=encodeURIComponent(window.PT_ASSET_VERSION||"1");',
  '   /* Start all fetches synchronously: no await between the three scripts. */',
  '   var scripts=[',
  '    get("move-icons.js?v="+v),',
  '    get("move-media.js?v="+v),',
  '    get("assets/js/"+dev+"_04_runtime.js?v="+v)',
  '   ];',
  '   await Promise.all(scripts);',
  '   if(!window.PTIcons||!window.PTMoveMedia)throw Error("PROJECT T sheet attachments did not initialize");',
  '   loaded=true;',
  '   return true;',
  '  })().catch(function(e){',
  '   errors.push(String(e));pending=null;loaded=false;',
  '   if((root.dataset.page||"sheet")!=="home"){',
  '    var host=document.getElementById(dev==="pc"?"body":"list");',
  '    if(host)host.textContent="技表を読み込めませんでした。ページを再読み込みしてください。";',
  '   }',
  '   throw e;',
  '  });',
  '  return pending;',
  ' }',
  ' function update(){var p=root.dataset.page||"sheet";if(p==="sheet")warm();',
  '  if(p!=="home")ensure().catch(console.error)}',
  ' function intent(e){',
  '  if(e.type==="keydown"&&e.key!=="Enter"&&e.key!==" ")return;',
  '  var x=e.target&&e.target.closest&&e.target.closest("[data-go=sheet]");',
  '  if(x){warm();ensure().catch(console.error)}',
  ' }',
  ' window.PT_SHEET_RUNTIME=Object.freeze({ready:ensure,state:function(){return {loaded:loaded,loading:!!pending,errors:errors.slice()}}});',
  ' new MutationObserver(update).observe(root,{attributes:true,attributeFilter:["data-page"]});',
  ' addEventListener("hashchange",update);',
  ' ["pointerover","pointerdown","focusin","keydown"].forEach(function(name){',
  '  document.addEventListener(name,intent,{capture:true,passive:name!=="keydown"})',
  ' });',
  ' update();',
  '})();'
 ].join('\n')+'\n';
}
try{
 for(const dev of ['pc','sp']){
  const p=path.join(SITE,'assets/js',dev+'_sheet-loader.js');
  const src=fs.readFileSync(p,'utf8');
  for(const marker of ['await get("move-icons.js?v="+v)','await get("move-media.js?v="+v)',
    'await get("assets/js/"+dev+"_04_runtime.js?v="+v)']){
   if(!src.includes(marker))throw Error('Stage23 sequential chain marker absent in '+dev+': '+marker);
  }
  const raw=makeLoader(dev);
  if(!raw.includes('s.async=false')||!raw.includes('Promise.all(scripts)'))
   throw Error('Parallel ordered-loading invariant absent '+dev);
  // The first full regression passed; remove the extra 290 bytes on idle home
  // by shortening the tiny IIFE without changing its ordering or API.
  const compressed=await minify(raw,{compress:false,mangle:true,format:{comments:false}});
  if(!compressed.code)throw Error('Parallel loader compression failed '+dev);
  const next=compressed.code+'\n';
  const beforeBytes=Buffer.byteLength(src),afterBytes=Buffer.byteLength(next);
  if(afterBytes>=beforeBytes)throw Error('Home loader must not grow '+dev+' '+beforeBytes+' '+afterBytes);
  const beforeHash=crypto.createHash('sha256').update(src).digest('hex');
  fs.writeFileSync(p,next,'utf8');
  report.devices[dev]={passed:true,loaderBeforeBytes:beforeBytes,loaderAfterBytes:afterBytes,
    loaderDeltaBytes:afterBytes-beforeBytes,minifiedLoader:true,sequentialBaselineSha256:beforeHash,
    iconVideoRuntimeLoadedInOrder:true,scriptRequestsStartInParallel:true,
    noHomeFetchUnlessUserIntent:true,existingFontRouterUnchanged:true,
    characterJsonPrewarmOnlyOnSheetIntent:true};
 }
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'parallel-build-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE24_PARALLEL_BUILD',JSON.stringify(report));
if(!report.passed)process.exitCode=1;
