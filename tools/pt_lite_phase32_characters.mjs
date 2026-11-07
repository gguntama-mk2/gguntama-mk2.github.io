/** PROJECT T Phase32: all 44 character switches, font shards & lazy images.
 * Uses local test server, blocks all real API / nonlocal network and writes.
 * Verifies actual visible sheet rows against move metadata and JSON identity.
 */
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const ROOT='phase32-performance',HOST='http://127.0.0.1:8893';
const result={phase:32,mode:'isolated-browser',passed:false,devices:{},errors:[],
 caveats:['Representative localhost Chromium rendering; external requests blocked.',
          'No real OAuth/video uploads; all 44 full character records loaded in memory only.']};
let server,browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function serve(){
 server=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port','8893','--directory',ROOT+'/optimized-site'],{stdio:'ignore'});
 for(let i=0;i<90;i++){try{if((await fetch(HOST+'/pc.html')).ok)return;}catch{}await pause(200)}
 throw Error('Local test server failed');
}
try{
 await serve();browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of ['pc','sp']){
  const ctx=await browser.newContext({viewport:dev==='pc'?{width:1440,height:900}:{width:390,height:844},
   isMobile:dev==='sp',serviceWorkers:'block'});
  const page=await ctx.newPage(),pageErrors=[],fontRequests=[],imgRequests=[],external=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('request',r=>{
   const u=new URL(r.url());
   if(u.pathname.includes('pt18-maru-'))fontRequests.push(u.pathname);
   if(r.resourceType()==='image')imgRequests.push(u.pathname);
  });
  await page.route('**/*',route=>{
   const req=route.request(),u=new URL(req.url());
   if(u.origin!==HOST){external.push(req.url());return route.abort('blockedbyclient');}
   if(!['GET','HEAD','OPTIONS'].includes(req.method()))return route.abort('blockedbyclient');
   if(u.pathname.startsWith('/api/'))return route.fulfill({status:401,contentType:'application/json',body:'{"ok":false,"mock":true}'});
   return route.continue();
  });
  const start=Date.now();
  await page.goto(HOST+'/'+dev+'.html#home',{waitUntil:'load',timeout:90000});
  await page.waitForFunction(()=>!!window.PT_CHAR_DATA&&typeof window.setPage==='function',{timeout:60000});
  const homeImages=imgRequests.length;
  const homeFontCSS=await page.locator('link[href*="pt19-maru-shards.css"]').count();
  if(homeFontCSS!==0)throw Error(dev+' home unexpectedly preloaded font-shard CSS');
  await page.evaluate(()=>window.setPage('sheet'));
  await page.waitForFunction(()=>!!document.querySelector('#body,#list'),{timeout:20000});
  await page.evaluate(()=>window.PT19_FONT_READY);
  const ids=await page.evaluate(()=>CHARACTERS.map(c=>({id:c.id,expected:c.moves.length,name:c.name})));
  if(ids.length!==44)throw Error(dev+' expected 44 characters, found '+ids.length);
  const audit=[],firstImages=imgRequests.length;
  for(const {id,expected,name} of ids){
   const before=Date.now();
   const tested=await page.evaluate(async({id,dev})=>{
    const c=CHARACTERS.find(x=>x.id===id);
    await window.PT_CHAR_DATA.load(c);
    if(dev==='pc'){current=id;save();renderChars();renderTable();}
    else selectChar(id);
    await document.fonts.ready;
    const count=dev==='pc'?document.querySelectorAll('#body tr[data-k]').length
      :document.querySelectorAll('#list .card[data-i]').length;
    const display=dev==='pc'?document.getElementById('charName').textContent:
      (document.getElementById('charName')?.textContent||document.getElementById('ctname')?.textContent||'');
    return {id:c.id,expected:c.moves.length,shown:count,
      loaded:!!c.__ptLoaded,header:display.slice(0,70),font:getComputedStyle(document.body).fontFamily};
   },{id,dev});
   // Smartphone renders card chunks (60 per animation frame). Wait for
   // its final frame rather than treating the first partial chunk as data loss.
   await page.waitForFunction(({dev,expected})=>{
    const count=dev==='pc'?document.querySelectorAll('#body tr[data-k]').length
      :document.querySelectorAll('#list .card[data-i]').length;
    return count===expected;
   },{dev,expected},{timeout:30000});
   tested.shown=await page.evaluate(dev=>dev==='pc'
    ?document.querySelectorAll('#body tr[data-k]').length
    :document.querySelectorAll('#list .card[data-i]').length,dev);
   if(!tested.loaded||tested.shown!==expected)
    throw Error(dev+' '+id+' visible rows mismatch '+JSON.stringify(tested));
   audit.push({...tested,elapsedMs:Date.now()-before});
  }
  await page.evaluate(()=>document.fonts.ready);
  const cssCount=await page.locator('link[href*="pt19-maru-shards.css"]').count();
  const fontPaths=[...new Set(fontRequests)];
  const renderedImageRequests=imgRequests.length;
  const issues={cssCount,homeFontCSS,pageErrors,external,
    uniqueFontRequests:fontPaths,initialHomeImageRequests:homeImages,
    imageRequestsWhenEnteringSheet:firstImages-homeImages,
    totalImageRequestsAfter44:renderedImageRequests,
    chars:ids.length};
  if(cssCount!==1||!fontPaths.some(x=>x.includes('first-view'))||pageErrors.length)
   throw Error(dev+' CSS/font/page error '+JSON.stringify(issues));
  result.devices[dev]={passed:true,elapsedMs:Date.now()-start,audit,
    ...issues,moveRowsTotal:audit.reduce((s,x)=>s+x.shown,0)};
  console.log('PHASE32_ALL_CHARS',dev,JSON.stringify({
    passed:true,characters:audit.length,moveRows:result.devices[dev].moveRowsTotal,
    cssOnce:cssCount,fonts:fontPaths,homeImages,after44Images:renderedImageRequests,
    elapsedMs:Date.now()-start}));
  await ctx.close();
 }
}catch(e){result.errors.push(String(e?.stack||e));}
finally{
 await browser?.close();server?.kill('SIGTERM');
 result.passed=!result.errors.length&&Object.keys(result.devices).length===2;
 fs.mkdirSync(ROOT,{recursive:true});
 fs.writeFileSync(ROOT+'/44-character-audit.json',JSON.stringify(result,null,2)+'\n');
 console.log('PHASE32_ALL_CHARS_FINAL',JSON.stringify({passed:result.passed,errors:result.errors,
  devices:Object.fromEntries(Object.entries(result.devices).map(([k,v])=>[k,{characters:v.audit.length,moveRows:v.moveRowsTotal,fonts:v.uniqueFontRequests}]))}));
 if(!result.passed)process.exitCode=1;
}
