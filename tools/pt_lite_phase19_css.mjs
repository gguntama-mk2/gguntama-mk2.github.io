/** PROJECT T Phase19: defer Phase18 unicode-range font declarations from home.
 * Only modifies a disposable test site. Font files / text / UI remain unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('phase19-performance');
const site=path.join(root,'optimized-site');
const cssDir=path.join(site,'assets/css');
const cssPath=path.join(cssDir,'pt19-maru-shards.css');
const report={phase:19,mode:'test-copy-only',passed:false,cssBefore:{},cssAfter:{},
  deferredRuleCount:0,bytesDeferred:0,stylesIdentical:true,errors:[]};
try{
 const faces=[];
 for(const dev of ['pc','sp']){
  const css=path.join(cssDir,dev+'_00.css');
  const before=fs.readFileSync(css,'utf8');
  const re=/@font-face\s*\{\s*font-family:\s*"MaruGoKawa";[^}]*\}/g;
  const found=[...before.matchAll(re)];
  if(found.length!==2)throw Error(dev+' expected two Phase18 font faces, found '+found.length);
  for(const m of found)
   if(!m[0].includes('unicode-range:')||!m[0].includes('pt18-maru-'))
    throw Error('Expected Phase18 unicode-range font face is missing');
  if(!faces.length)faces.push(...found.map(m=>m[0]));
  else for(let i=0;i<faces.length;i++)if(faces[i]!==found[i][0])
    throw Error('Desktop/mobile font-face declarations differ');
  const after=before.replace(re,'');
  fs.writeFileSync(css,after,'utf8');
  report.cssBefore[dev]=Buffer.byteLength(before);
  report.cssAfter[dev]=Buffer.byteLength(after);
  const page=path.join(site,dev+'.html');
  let html=fs.readFileSync(page,'utf8');
  if(html.includes('pt19-maru-shards.css'))throw Error('Script already injected: '+dev);
  const script=[
    '<script>',
    '/* Phase19 test-copy font routing: load only outside home. */',
    '(function(){',
    ' "use strict";',
    ' var tag=null,resolveReady,rejectReady;',
    ' window.PT19_FONT_READY=new Promise(function(ok,fail){resolveReady=ok;rejectReady=fail;});',
    ' function ensure(){',
    '  if(tag)return;',
    '  tag=document.createElement("link");',
    '  tag.rel="stylesheet";',
    '  tag.href="assets/css/pt19-maru-shards.css";',
    '  tag.onload=function(){document.fonts.ready.then(resolveReady,rejectReady);};',
    '  tag.onerror=function(){rejectReady(Error("PT19 font stylesheet failed"));};',
    '  document.head.appendChild(tag);',
    ' }',
    ' function refresh(){',
    '  if(document.documentElement.getAttribute("data-page")!=="home")ensure();',
    ' }',
    ' new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:["data-page"]});',
    ' addEventListener("hashchange",refresh,{passive:true});',
    ' refresh();',
    ' window.PT19_ENSURE_FONTS=ensure;',
    '})();',
    '</script>'
  ].join('\n');
  if(!html.includes('</head>'))throw Error('Head tag missing in '+dev);
  html=html.replace('</head>',script+'\n</head>');
  fs.writeFileSync(page,html,'utf8');
 }
 fs.writeFileSync(cssPath,faces.join('\n')+'\n','utf8');
 report.deferredRuleCount=faces.length;
 report.deferredCssBytes=fs.statSync(cssPath).size;
 report.bytesDeferred=report.cssBefore.pc-report.cssAfter.pc;
 report.cssSavingsSameBoth=report.cssBefore.pc-report.cssAfter.pc===report.cssBefore.sp-report.cssAfter.sp;
 if(!report.cssSavingsSameBoth||report.bytesDeferred<3000)throw Error('Not enough CSS deferred');
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,'css-deferred.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE19_CSS_DEFER',JSON.stringify(report));
if(!report.passed)process.exitCode=1;
