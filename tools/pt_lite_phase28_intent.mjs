/** Phase28: verify sheet-link prewarm timing independently of rendered UI.
 * Home must never eagerly fetch font CSS; explicit pointer/keyboard intent may.
 */
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const ROOT='phase28-performance', ORIGIN='http://127.0.0.1:8895';
const result={phase:28,mode:'local-test-only',passed:false,checks:[],errors:[]};
let browser,server;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 server=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port','8895','--directory',ROOT+'/optimized-site'],{stdio:'ignore'});
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(ORIGIN+'/pc.html')).ok){ready=true;break}}catch{}await sleep(180)}
 if(!ready)throw Error('Test site server unavailable');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of ['pc','sp']){
  for(const event of ['pointerover','pointerdown','focusin','keydown']){
   const ctx=await browser.newContext({viewport:dev==='pc'?{width:1440,height:900}:{width:390,height:844},
     isMobile:dev==='sp',serviceWorkers:'block'});
   const page=await ctx.newPage(),errors=[],css=[],fonts=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('request',r=>{let u=new URL(r.url());if(u.pathname.includes('pt19-maru-shards'))css.push(u.pathname);
    if(u.pathname.includes('pt18-maru'))fonts.push(u.pathname)});
   await page.route('**/*',r=>{
    const req=r.request(),u=new URL(req.url());
    if(u.origin!==ORIGIN||!['GET','HEAD','OPTIONS'].includes(req.method()))return r.abort('blockedbyclient');
    if(u.pathname.startsWith('/api/'))return r.fulfill({status:401,contentType:'application/json',body:'{"mock":true}'});
    return r.continue();
   });
   try{
    await page.goto(ORIGIN+'/'+dev+'.html#home',{waitUntil:'load',timeout:90000});
    await page.waitForFunction(()=>!!window.PT_CHAR_DATA&&!!window.PT19_ENSURE_FONTS&&typeof window.setPage==='function',{timeout:30000});
    const initial=await page.locator('link[href*="pt19-maru-shards.css"]').count();
    if(initial!==0||css.length)throw Error(dev+' font CSS loaded eagerly before sheet navigation');
    const eventState=await page.evaluate(event=>{
      const target=document.querySelector('[data-go="sheet"]');
      if(!target)throw Error('Missing sheet navigation control');
      if(event==='keydown')target.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter'}));
      else if(event==='pointerdown')target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
      else if(event==='pointerover')target.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));
      else target.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));
      return document.documentElement.getAttribute('data-page');
    },event);
    await page.waitForFunction(()=>document.querySelector('link[href*="pt19-maru-shards.css"]')!==null,{timeout:10000});
    await page.evaluate(()=>window.PT19_FONT_READY);
    await page.evaluate(()=>window.PT_SHEET_RUNTIME.fontPrewarm());
    if(css.length!==1)throw Error('CSS requested '+css.length+' times for '+dev+' '+event);
    if(eventState!=='home')throw Error('Intent event changed route '+dev+' '+event+' route='+eventState);
    if(fonts.length<1||fonts.length>2)throw Error('Expected only actual on-demand font-face shards on sheet intent '+dev+' '+event+' '+fonts.join(','));
    await page.evaluate(()=>window.setPage('sheet'));
    await page.waitForFunction(dev=>dev==='pc'
       ?document.querySelectorAll('#body tr[data-k]').length===228
       :document.querySelectorAll('#list .card[data-i]').length===228,dev,{timeout:50000});
    if(errors.length)throw Error('Page JS exception '+errors.join(';'));
    const item={device:dev,event,cssRequests:css.length,earlyFontRequests:fonts.length,
     sheetRows:228,fontCSSAlreadyReadyBeforeSheet:true,passed:true};
    result.checks.push(item);
    console.log('PHASE28_INTENT_CHECK',JSON.stringify(item));
   }finally{await ctx.close();}
  }
 }
}catch(e){result.errors.push(String(e?.stack||e));}
finally{
 await browser?.close();server?.kill('SIGTERM');
 result.passed=result.errors.length===0&&result.checks.length===8;
 fs.mkdirSync(ROOT,{recursive:true});
 fs.writeFileSync(ROOT+'/intent-prewarm.json',JSON.stringify(result,null,2)+'\n');
 console.log('PHASE28_INTENT_FINAL',JSON.stringify({passed:result.passed,checks:result.checks.length,errors:result.errors}));
 if(!result.passed)process.exitCode=1;
}
