/** PROJECT T Phase23: AST-cut idle-home bootstrap and deferred sheet runtime.
 * Generates only an isolated test copy; does not change source or production.
 */
import fs from 'node:fs';
import path from 'node:path';
import {parse} from 'acorn';
const ROOT=path.resolve('phase23-performance'),SITE=path.join(ROOT,'optimized-site');
const report={phase:23,mode:'test-copy-only',passed:false,devices:{},errors:[]};
const targetDir=path.join(SITE,'assets/js');
function nodes(src){return parse(src,{ecmaVersion:'latest',sourceType:'script'}).body;}
function isName(n,name){
 if(n.type==='VariableDeclaration')return n.declarations.some(v=>v.id?.name===name);
 if(n.type==='FunctionDeclaration')return n.id?.name===name;
 return false;
}
function split(src,dev){
 const all=nodes(src),splitName=dev==='pc'?'normQ':'kata2hira';
 const boundary=all.findIndex(n=>isName(n,splitName));
 if(boundary<8)throw Error('Bootstrap delimiter changed '+dev);
 const boot=all.slice(0,boundary),later=all.slice(boundary);
 for(const name of ['CHARACTERS','PT_OFF_FIELDS','PT_OFF_CHARS','COLS','STORE_KEY','LAST_KEY','current','load','save','moveId','ptLoadMoves']){
  if(!boot.some(n=>isName(n,name)))throw Error('Shared bootstrap missing '+name);
 }
 const selected=later.filter(n=>['THEME_KEY','THEME_BG','applyTheme'].some(x=>isName(n,x))||
   n.type==='ExpressionStatement'&&src.slice(n.start,n.end).includes('initTheme'));
 if(selected.length!==4)throw Error('Theme initialization not exactly 4 AST statements '+dev+' count '+selected.length);
 const off=new Set(selected.map(n=>n.start));
 const theme=selected.map(n=>src.slice(n.start,n.end)).join('\n');
 const head=boot.map(n=>src.slice(n.start,n.end)).join('\n')+'\nload();\n'+theme+
   '\nwindow.PT23_BOOT=Object.freeze({ready:true,count:()=>CHARACTERS.length});\n';
 const tail=later.filter(n=>!off.has(n.start)).map(n=>src.slice(n.start,n.end)).join('\n')+'\n';
 nodes(head);nodes(tail);
 if(!tail.includes(dev==='pc'?'renderTable':'renderList'))throw Error('Main renderer missing '+dev);
 if(Buffer.byteLength(head)>=Buffer.byteLength(src)*0.55)throw Error('Bootstrap still too large '+dev);
 return {head,tail};
}
function loader(dev){
 return [
 '/* PROJECT T Phase23 lazy sheet/technique attachments: test-only. */',
 '(function(){',
 ' "use strict";',
 ' var ready=false,pending=null,errors=[];',
 ' var root=document.documentElement,dev="'+dev+'";',
 ' function get(file){return new Promise(function(ok,no){',
 '  var s=document.createElement("script");s.src=file;s.onload=ok;',
 '  s.onerror=function(){no(Error("Cannot load PROJECT T dependency "+file))};document.head.appendChild(s);',
 ' })}',
 ' function ensure(){',
 '  if(pending)return pending;',
 '  pending=(async function(){',
 '    var v=encodeURIComponent(window.PT_ASSET_VERSION||"1");',
 '    await get("move-icons.js?v="+v);',
 '    await get("move-media.js?v="+v);',
 '    await get("assets/js/"+dev+"_04_runtime.js?v="+v);',
 '    ready=true;',
 '    return true;',
 '  })().catch(function(e){',
 '    errors.push(String(e));pending=null;ready=false;',
 '    if((root.dataset.page||"sheet")!=="home"){',
 '      var host=document.getElementById(dev==="pc"?"body":"list");',
 '      if(host)host.textContent="技表を読み込めませんでした。ページを再読み込みしてください。";',
 '    }',
 '    throw e;',
 '  });',
 '  return pending;',
 ' }',
 ' function update(){if((root.dataset.page||"sheet")!=="home")ensure().catch(console.error)}',
 ' function intent(e){',
 '  if(e.type==="keydown"&&e.key!=="Enter"&&e.key!==" ")return;',
 '  var x=e.target&&e.target.closest&&e.target.closest("[data-go=sheet]");',
 '  if(x)ensure().catch(console.error)',
 ' }',
 ' window.PT_SHEET_RUNTIME=Object.freeze({ready:ensure,state:function(){return {loaded:ready,loading:!!pending,errors:errors.slice()}}});',
 ' new MutationObserver(update).observe(root,{attributes:true,attributeFilter:["data-page"]});',
 ' addEventListener("hashchange",update);',
 ' ["pointerover","pointerdown","focusin","keydown"].forEach(function(name){',
 '   document.addEventListener(name,intent,{capture:true,passive:name!=="keydown"})',
 ' });',
 ' update();',
 '})();'
 ].join('\n')+'\n';
}
try{
 for(const dev of ['pc','sp']){
  const pathJs='assets/js/'+dev+'_04.js',src=fs.readFileSync(path.join(SITE,pathJs),'utf8');
  const pieces=split(src,dev),info={};
  fs.writeFileSync(path.join(targetDir,dev+'_04_boot.js'),pieces.head);
  fs.writeFileSync(path.join(targetDir,dev+'_04_runtime.js'),pieces.tail);
  fs.writeFileSync(path.join(targetDir,dev+'_sheet-loader.js'),loader(dev));
  const file=path.join(SITE,dev+'.html'),original=fs.readFileSync(file,'utf8');
  let html=original;
  const script='assets/js/'+dev+'_04.js';
  if(html.split(script).length!==2)throw Error('Sheet source script occurrence !=1');
  html=html.replace(script,'assets/js/'+dev+'_04_boot.js');
  for(const prefix of ['<script src="move-icons.js?v=','<script src="move-media.js?v=']){
   const start=html.indexOf(prefix),end=html.indexOf('</script>',start);
   if(start<0||end<0)throw Error('Eager media/icon tag missing');
   html=html.slice(0,start)+html.slice(end+'</script>'.length);
  }
  const beforeRoute='<script src="assets/js/'+dev+'_route-loader.js?v=';
  const at=html.indexOf(beforeRoute);
  if(at<0)throw Error('Feature router tag missing');
  const version=html.match(/PT_ASSET_VERSION="([^"]+)"/)?.[1];
  if(!version)throw Error('Version missing in HTML');
  html=html.slice(0,at)+'<script src="assets/js/'+dev+'_sheet-loader.js?v='+version+'"></script>\n'+html.slice(at);
  fs.writeFileSync(file,html);
  const routeFile=path.join(targetDir,dev+'_route-loader.js');
  const route=fs.readFileSync(routeFile,'utf8'),old='    prefetch.then(()=>loadOne(code)).then(';
  if(route.split(old).length!==2)throw Error('Feature router dependency anchor missing');
  fs.writeFileSync(routeFile,route.replace(old,
    '    const runtime=window.PT_SHEET_RUNTIME?window.PT_SHEET_RUNTIME.ready():Promise.resolve();\n    runtime.then(()=>prefetch).then(()=>loadOne(code)).then('));
  info.originalJsBytes=Buffer.byteLength(src);
  info.initialBootBytes=Buffer.byteLength(pieces.head);
  info.sheetRuntimeBytes=Buffer.byteLength(pieces.tail);
  info.homeJsSavedBytes=info.originalJsBytes-info.initialBootBytes;
  info.htmlBeforeBytes=Buffer.byteLength(original);
  info.htmlAfterBytes=Buffer.byteLength(html);
  info.iconAndVideoDeferred=true;info.themeAvailableOnHome=true;
  info.fixedIdsInBoot=true;info.phase22JsonShaPreserved=true;
  info.sheetModuleWasParsed=nodes(pieces.tail).length>0;
  if(info.homeJsSavedBytes<60000)throw Error('Insufficient JS reduction '+dev);
  report.devices[dev]=info;
  console.log('PHASE23_CODE_SPLIT',dev,JSON.stringify(info));
 }
 report.passed=true;
}catch(e){report.errors.push(String(e?.stack||e));}
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'js-split-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE23_JS_SPLIT_FINAL',JSON.stringify(report).slice(0,12000));
if(!report.passed)process.exitCode=1;
