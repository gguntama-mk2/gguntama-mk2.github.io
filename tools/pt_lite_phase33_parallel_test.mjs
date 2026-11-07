/** Phase33 parallel-fetch/ordered-execution test with intentionally delayed
 * local script responses. Strictly localhost, synthetic API, no production.
 * Individual scripts are delayed 275ms: sequential network chains would
 * exceed the 220ms simultaneous-request window.
 */
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const DIR='phase33-performance',ORIGIN='http://127.0.0.1:8897';
const result={phase:33,passed:false,mode:'localhost-isolated',checks:[],errors:[]};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let browser,server;
try{
 server=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port','8897',
  '--directory',DIR+'/optimized-site'],{stdio:'ignore'});
 let ok=false;for(let i=0;i<80;i++){try{if((await fetch(ORIGIN+'/pc.html')).ok){ok=true;break;}}catch{}await delay(150);}
 if(!ok)throw Error('Local site server unavailable');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of ['pc','sp']){
  for(const event of ['pointerover','pointerdown','focusin','keydown']){
   const context=await browser.newContext({
    viewport:dev==='pc'?{width:1440,height:900}:{width:390,height:844},
    isMobile:dev==='sp',serviceWorkers:'block'
   });
   const page=await context.newPage(),events=[],jsonRequests=[],errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   const files=['/move-icons.js','/move-media.js','/assets/js/'+dev+'_04_runtime.js'];
   page.on('request',r=>{
    const path=new URL(r.url()).pathname;
    if(files.includes(path))events.push({path,at:Date.now()});
    if(path==='/assets/data/characters/alisa.json')jsonRequests.push({path,at:Date.now()});
   });
   await page.route('**/*',async r=>{
    const req=r.request(),u=new URL(req.url());
    if(u.origin!==ORIGIN||!['GET','HEAD','OPTIONS'].includes(req.method()))
     return r.abort('blockedbyclient');
    if(u.pathname.startsWith('/api/'))
     return r.fulfill({status:401,contentType:'application/json',body:'{"testOnly":true}'});
    if(files.includes(u.pathname))await delay(275);
    return r.continue();
   });
   try{
    await page.goto(ORIGIN+'/'+dev+'.html#home',{waitUntil:'load',timeout:90000});
    await page.waitForFunction(()=>window.PT_SHEET_RUNTIME&&window.PT19_ENSURE_FONTS,{timeout:30000});
    const before=await page.evaluate(()=>({
     page:document.documentElement.dataset.page,
     ready:PT_SHEET_RUNTIME.state().loaded,
     fontCss:!!document.querySelector('link[href*="pt19-maru-shards.css"]')
    }));
    if(before.page!=='home'||before.ready||before.fontCss||events.length||jsonRequests.length)
     throw Error(dev+' scripts/fonts loaded without sheet intent '+JSON.stringify(before));
    const t0=Date.now();
    await page.evaluate(event=>{
     const t=document.querySelector('[data-go="sheet"]');
     if(!t)throw Error('Missing sheet UI navigation target');
     if(event==='keydown')t.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter'}));
     else if(event==='focusin')t.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));
     else t.dispatchEvent(new PointerEvent(event,{bubbles:true}));
    },event);
    await page.waitForFunction(()=>window.PT_SHEET_RUNTIME.state().loaded,{timeout:30000});
    await page.evaluate(()=>window.PT19_FONT_READY);
    await page.evaluate(()=>window.PT_SHEET_RUNTIME.fontPrewarm());
    const current=await page.evaluate(()=>({
     page:document.documentElement.dataset.page,
     icons:!!window.PTIcons,media:!!window.PTMoveMedia,
     runtime:PT_SHEET_RUNTIME.state(),fontCssCount:document.querySelectorAll('link[href*="pt19-maru-shards.css"]').length
    }));
    if(current.page!=='home'||!current.icons||!current.media||!current.runtime.loaded||current.runtime.errors.length)
     throw Error(dev+' intent prewarm failed '+JSON.stringify(current));
    if(events.length!==3||files.some(f=>events.filter(e=>e.path===f).length!==1))
     throw Error(dev+' scripts were not requested once '+JSON.stringify(events));
    const spread=Math.max(...events.map(e=>e.at))-Math.min(...events.map(e=>e.at));
    if(spread>220)throw Error(dev+' script requests remained sequential; spread='+spread+'ms '+JSON.stringify(events));
    if(current.fontCssCount!==1)throw Error(dev+' fonts CSS not fetched once');
    if(!(await page.evaluate(()=>document.fonts.check('400 16px "MaruGoKawa"',"技表発生"))))throw Error(dev+' selected Japanese glyphs not prewarmed');
    if(jsonRequests.length!==1)throw Error(dev+' character JSON not prewarmed once on '+event+' '+JSON.stringify(jsonRequests));
    const jsonStartDelta=Math.abs(jsonRequests[0].at-Math.min(...events.map(e=>e.at)));
    if(jsonStartDelta>220)throw Error(dev+' character JSON did not start alongside sheet runtime '+jsonStartDelta+'ms');
    await page.evaluate(()=>window.setPage('sheet'));
    await page.waitForFunction(dev=>dev==='pc'
      ?document.querySelectorAll('#body tr[data-k]').length===228
      :document.querySelectorAll('#list .card[data-i]').length===228,dev,{timeout:50000});
    if(jsonRequests.length!==1)throw Error(dev+' character JSON requested twice after sheet render');
    if(errors.length)throw Error(dev+' page exceptions: '+errors.join(';'));
    const test={device:dev,event,passed:true,scriptRequestSpreadMs:spread,
      scriptRequests:events.map(e=>e.path),characterJsonStartDeltaMs:jsonStartDelta,
      characterJsonFetches:jsonRequests.length,prewarmCompletedMs:Date.now()-t0,
      noEagerHome:true,samePageAfterIntent:true,sheetRenderedRows:228};
    result.checks.push(test);
    console.log('PHASE33_PARALLEL_INTENT',JSON.stringify(test));
   }finally{await context.close();}
  }
 }
}catch(e){result.errors.push(String(e?.stack||e));}
finally{
 await browser?.close();server?.kill('SIGTERM');
 result.passed=result.errors.length===0&&result.checks.length===8;
 fs.mkdirSync(DIR,{recursive:true});
 fs.writeFileSync(DIR+'/parallel-intent-report.json',JSON.stringify(result,null,2)+'\n');
 console.log('PHASE33_PARALLEL_INTENT_FINAL',JSON.stringify({
  passed:result.passed,checks:result.checks.length,errors:result.errors}));
 if(!result.passed)process.exitCode=1;
}
