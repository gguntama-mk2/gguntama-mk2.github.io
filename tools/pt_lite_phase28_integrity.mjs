/** Phase28: directly linked sheet must hydrate, original checks reject corrupted data.
 * Only local generated site and mocked fetches. No real API or user data.
 */
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const DIR='phase28-performance',ORIGIN='http://127.0.0.1:8894';
const report={phase:28,mode:'test-only',passed:false,devices:{},errors:[]};
let server,browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 server=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port','8894','--directory',DIR+'/optimized-site'],{stdio:'ignore'});
 let ready=false;
 for(let i=0;i<90;i++){try{if((await fetch(ORIGIN+'/pc.html')).ok){ready=true;break;}}catch{}await pause(150);}
 if(!ready)throw Error('No localhost server');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of ['pc','sp']){
  const ctx=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},
    isMobile:device==='sp',serviceWorkers:'block'});
  const page=await ctx.newPage(),errs=[];
  page.on('pageerror',e=>errs.push(String(e)));
  await page.route('**/*',r=>{
   const req=r.request(),u=new URL(req.url());
   if(u.origin!==ORIGIN||!['GET','HEAD','OPTIONS'].includes(req.method()))
     return r.abort('blockedbyclient');
   if(u.pathname.startsWith('/api/'))
     return r.fulfill({status:401,contentType:'application/json',body:'{"mock":true}'});
   return r.continue();
  });
  try{
   await page.goto(ORIGIN+'/'+device+'.html#sheet',{waitUntil:'load',timeout:90000});
   await page.waitForFunction(()=>!!window.PT_CHAR_DATA&&Array.isArray(CHARACTERS)&&typeof current==='string',{timeout:40000});
   await page.waitForFunction(dev=>{
    const c=CHARACTERS.find(x=>x.id===current);
    if(!c||!c.__ptLoaded)return false;
    const n=dev==='pc'?document.querySelectorAll('#body tr[data-k]').length:
      document.querySelectorAll('#list .card[data-i]').length;
    return n===c.moves.length;
   },device,{timeout:60000});
   const direct=await page.evaluate(()=>{
    const c=CHARACTERS.find(x=>x.id===current);
    return {selected:c.id,total:c.moves.length,storedIds:c.ks.size,
      loaded:window.PT_CHAR_DATA.loaded().includes(c.id),
      fixedIdSample:c.moves.slice(0,5).map(x=>x.k)};
   });
   if(!direct.loaded||direct.total!==direct.storedIds)throw Error(device+' direct deep link move IDs not preserved');
   if(errs.length)throw Error(device+' JS exception '+errs.join(';'));
   const retry=await browser.newContext({viewport:{width:420,height:820},serviceWorkers:'block'});
   const second=await retry.newPage();
   await second.route('**/*',r=>{
    const req=r.request(),u=new URL(req.url());
    if(u.origin!==ORIGIN||!['GET','HEAD','OPTIONS'].includes(req.method()))
      return r.abort('blockedbyclient');
    if(u.pathname.startsWith('/api/'))
      return r.fulfill({status:401,contentType:'application/json',body:'{"mock":true}'});
    return r.continue();
   });
   await second.goto(ORIGIN+'/'+device+'.html#home',{waitUntil:'load',timeout:90000});
   await second.waitForFunction(()=>!!window.PT_CHAR_DATA&&CHARACTERS.length===44,{timeout:40000});
   let corruptedCalls=0;
   const override=async r=>{
    const response=await r.fetch();
    const payload=await response.json();
    const first=payload.moves[0];
    if(!first)throw Error('Missing default technique for corruption test');
    const old=Array.isArray(first.off)?first.off:[];
    first.off=old.includes('guard')?old.filter(x=>x!=='guard'):[...old,'guard'];
    corruptedCalls++;
    await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(payload)});
   };
   await second.route('**/assets/data/characters/alisa.json*',override);
   const failure=await second.evaluate(async()=>{
    const c=CHARACTERS.find(x=>x.id==='alisa');
    try{await PT_CHAR_DATA.load(c);return {rejected:false};}
    catch(e){return {rejected:true,message:String(e),loaded:c.__ptLoaded===true,
      stableIds:c.ks.size,rows:c.moves.length};}
   });
   if(!failure.rejected||failure.loaded||!failure.message.includes('checksum'))
     throw Error(device+' rejected corrupted mask check missing '+JSON.stringify(failure));
   if(corruptedCalls!==1)throw Error(device+' corruption test intercepted '+corruptedCalls+' requests');
   await second.unroute('**/assets/data/characters/alisa.json*',override);
   const fixed=await second.evaluate(async()=>{
    const c=CHARACTERS.find(x=>x.id==='alisa');await PT_CHAR_DATA.load(c);
    return {loaded:c.__ptLoaded===true,rows:c.moves.length,stableIds:c.ks.size};
   });
   if(!fixed.loaded||fixed.rows!==fixed.stableIds)
     throw Error(device+' healthy lazy JSON retry failed '+JSON.stringify(fixed));
   await retry.close();
   report.devices[device]={passed:true,direct,corruptRejected:true,retryHealthy:fixed};
   console.log('PHASE28_DEEPLINK',device,JSON.stringify(report.devices[device]));
  }finally{await ctx.close();}
 }
}catch(e){report.errors.push(String(e?.stack||e));}
finally{
 await browser?.close();server?.kill('SIGTERM');
 report.passed=report.errors.length===0&&Object.keys(report.devices).length===2;
 fs.mkdirSync(DIR,{recursive:true});
 fs.writeFileSync(DIR+'/integrity-report.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHASE28_INTEGRITY_FINAL',JSON.stringify({passed:report.passed,errors:report.errors}));
 if(!report.passed)process.exitCode=1;
}
