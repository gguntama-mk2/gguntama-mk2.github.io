import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const BASE='http://127.0.0.1:8772/test-litev1/';
const REPORT='test-litev1/assets/data/phase6-ui-regression-report.json';
const server=spawn('python3',['-m','http.server','8772','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const summary={schema:6,mode:'test-only',timestamp:new Date().toISOString(),passed:false,devices:{},failures:[],notes:[
  'API interactions are mocked as unauthorized. OAuth and authenticated destructive operations are NOT tested.',
  'Test uses local static server and an isolated browser profile; it does not alter production user data.'
]};
let browser;
async function caseRun(rows,name,fn){
  const start=Date.now();
  try{const detail=await fn();rows.push({name,passed:true,duration_ms:Date.now()-start,detail});console.log('PASS',name,JSON.stringify(detail??'').slice(0,400));}
  catch(e){const failure=String(e?.stack||e);rows.push({name,passed:false,duration_ms:Date.now()-start,error:failure.slice(0,3000)});summary.failures.push({name,error:failure.slice(0,3000)});console.error('FAIL',name,failure.slice(0,1500));}
}
function hostSnapshot(page,id){
  return page.evaluate(id=>{
    const host=document.getElementById(id);
    const root=host?.shadowRoot||host;
    return {exists:!!host,shadow:!!host?.shadowRoot,children:root?.children.length||0,
      chars:(root?.textContent||'').trim().length,buttons:root?.querySelectorAll('button').length||0,
      inputs:root?.querySelectorAll('input').length||0};
  },id);
}
async function navigate(page,name,code,host){
  await page.evaluate(s=>window.setPage(s),name);
  await page.waitForFunction(c=>window.PT_ROUTE_ASSETS?.loaded().includes(c),code,{timeout:name==='punish'?85000:30000});
  await page.waitForFunction(h=>{
    const el=document.getElementById(h);
    const root=el?.shadowRoot||el;
    return !!root&&root.children.length>0;
  },host,{timeout:15000});
  const data=await hostSnapshot(page,host);
  assert.equal(data.exists,true,'missing '+host);
  assert.equal(data.chars>20,true,'empty '+host);
  return data;
}
async function openDevice(device){
  const context=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},isMobile:device==='sp'});
  await context.route('**/api/v1/**',route=>route.fulfill({status:401,contentType:'application/json',body:'{"error":"unauthorized"}'}));
  const page=await context.newPage();
  page.setDefaultTimeout(18000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const requestCount=new Map();
  page.on('request',req=>{
    const p=new URL(req.url()).pathname;
    if(p.includes('/assets/pxstore/'))requestCount.set(p,(requestCount.get(p)||0)+1);
  });
  await page.goto(BASE+device+'.html#home',{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>window.PT_ROUTE_ASSETS&&window.PT_CHAR_DATA&&window.PXS,{timeout:30000});
  return {context,page,errors,requestCount};
}
async function testDevice(device){
  const rows=[];summary.devices[device]={cases:rows};
  const {context,page,errors,requestCount}=await openDevice(device);
  try{
    await caseRun(rows,device+' home/cache',async()=>{
      const d=await page.evaluate(async()=>{
        await PXS.ready();
        const id=PXS.has('anna')?'anna':PXS.ids().find(x=>CHARACTERS.some(c=>c.id===x));
        if(!id)throw Error('No gallery image found');
        const a=await PXS.bitmap(id),b=await PXS.bitmap(id);
        return {same:a===b,width:a.width||a.naturalWidth,height:a.height||a.naturalHeight,url:PXS.url(id),id,
          characterFetched:PT_CHAR_DATA.loaded(),featuresFetched:PT_ROUTE_ASSETS.loaded()};
      });
      assert.equal(d.same,true,'same decoded image should be reused');
      assert.equal(d.width>0&&d.height>0,true,'image decode failed');
      assert.equal(d.characterFetched.length,0,'home should not load character JSON');
      assert.equal(d.featuresFetched.length,0,'home should not load route modules');
      const p='/test-litev1/'+d.url;
      assert.equal((requestCount.get(p)||0)<=1,true,'image bitmap fetched more than once');
      return {...d,fetchCount:requestCount.get(p)||0};
    });
    await caseRun(rows,device+' combo',async()=>{
      const s=await navigate(page,'combo','06','cbHost');
      const input=page.locator('#cbHost #cb-q');
      await input.fill('9LP');
      const val=await input.inputValue();assert.equal(val,'9LP');
      await input.fill('');
      return {...s,search:val,api:await page.evaluate(()=>typeof CB?.count)};
    });
    await caseRun(rows,device+' glossary',async()=>{
      const s=await navigate(page,'glossary','07','glHost');
      const input=page.locator('#glHost #gl-q');
      await input.fill('フレーム');
      const val=await input.inputValue();
      await input.fill('');
      const count=await page.evaluate(()=>window.GL?.count());
      assert.equal(count>10,true,'glossary terms missing');
      return {...s,termCount:count,search:val};
    });
    await caseRun(rows,device+' punish',async()=>{
      const s=await navigate(page,'punish','08','pnHost');
      const count=await page.evaluate(()=>window.PN?.count());
      assert.equal(Number.isInteger(count)&&count>0,true,'punish data unavailable');
      const q=page.locator('#pnHost #pn-q');
      if(await q.count()){await q.fill('10');await q.fill('');}
      return {...s,punishCount:count,loadedCharacters:await page.evaluate(()=>window.PT_CHAR_DATA.loaded().length)};
    });
    await caseRun(rows,device+' stage',async()=>{
      const s=await navigate(page,'stage','09','sgHost');
      const n=await page.evaluate(()=>window.SG?.count());assert.equal(n>5,true,'stages missing');
      const input=page.locator('#sgHost #sg-q');
      if(await input.count()){await input.fill('**no-stage**');await input.fill('');}
      return {...s,stageCount:n};
    });
    await caseRun(rows,device+' gallery/lightbox',async()=>{
      const s=await navigate(page,'gallery','12','gaHost');
      const gallery=await page.evaluate(()=>{
        const id=PXS.ids().find(x=>CHARACTERS.some(c=>c.id===x)&&PXS.has(x));
        if(!id)throw Error('No gallery character');
        current=id;GA.show();
        return {id,cardCount:document.querySelectorAll('#gaHost .ga-card').length};
      });
      assert.equal(gallery.cardCount>0,true,'gallery has no clickable image');
      await page.locator('#gaHost .ga-card').first().click();
      await page.waitForFunction(()=>!!document.querySelector('.ga-lb.on'),{timeout:15000});
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('.ga-lb.on'),{timeout:15000});
      return {...s,...gallery,lightboxOpenedAndClosed:true};
    });
    await caseRun(rows,device+' login (unauthenticated)',async()=>{
      const s=await navigate(page,'login','14','lgHost');
      await page.waitForFunction(()=>!!document.getElementById('lgHost')?.shadowRoot?.getElementById('lg-login-actions'),{timeout:15000});
      const d=await page.evaluate(()=>{
        const root=document.getElementById('lgHost').shadowRoot;
        return {status:(root.getElementById('lg-status')?.textContent||'').slice(0,100),
          actions:root.getElementById('lg-login-actions')?.children.length||0};
      });
      return {...s,...d};
    });
    await caseRun(rows,device+' VS search/detail (mock data)',async()=>{
      const s=await navigate(page,'vs','15','vsHost');
      // In-memory test entry: does not write to the backend or the user's records.
      await page.evaluate(()=>{
        VS.setMatches([{id:'phase6-test-match',startedAt:'2026-09-10T12:00:00',
          playerCharacter:'alisa',opponentCharacter:'anna',result:'win',
          playerRank:1,opponentRank:2,playerTekkenPower:100000,opponentTekkenPower:92000}]);
      });
      const count=await page.evaluate(()=>window.VS.getMatches().length);assert.equal(count,1);
      const q=page.locator('#vsHost #vs-q');await q.fill('phase6-unknown-match-xyz');
      const filtered=await page.evaluate(()=>document.getElementById('vsHost').shadowRoot.getElementById('vs-matches')?.textContent);
      await q.fill('');
      assert.equal(String(filtered).trim(),'0','VS search failed to filter');
      await page.evaluate(()=>VS.loadMatch('phase6-test-match'));
      const opened=await page.evaluate(()=>document.getElementById('vsHost').shadowRoot.getElementById('vs-side')?.classList.contains('vs-side-open'));
      assert.equal(opened,true,'VS detail did not open');
      await page.keyboard.press('Escape');
      await page.evaluate(()=>VS.setMatches([]));
      return {...s,count,filtered,opened};
    });
    for(const [route,host] of [['privacy','prHost'],['price','pcHost'],['download','dlHost'],['guide','gdHost']]){
      await caseRun(rows,device+' '+route,()=>navigate(page,route,'16',host));
    }
    await caseRun(rows,device+' update + sheet',async()=>{
      const s=await navigate(page,'update','20','updHost');
      const n=await page.evaluate(()=>typeof PT_FULL_UPDATES==='undefined'?0:PT_FULL_UPDATES.length);
      assert.equal(n,34,'update history count changed');
      await page.evaluate(()=>setPage('sheet'));
      await page.waitForFunction(()=>PT_CHAR_DATA.loaded().length>0,{timeout:30000});
      return {...s,updateCount:n,sheetLoaded:true};
    });
    await caseRun(rows,device+' route cache',async()=>{
      await page.evaluate(()=>setPage('home'));
      await page.evaluate(()=>setPage('vs'));
      const number=await page.evaluate(d=>document.querySelectorAll('script[src$="'+d+'_15.js"]').length,device);
      assert.equal(number,1,'duplicate route script injected');
      return {vsScriptElements:number};
    });
    await caseRun(rows,device+' JS errors',async()=>{
      assert.deepEqual(errors,[],'unexpected browser JS errors');
      return {pageErrors:errors.length};
    });
  }finally{await context.close();}
}

async function retryRoute(device){
  const rows=[];summary.devices[device].recovery=rows;
  const context=await browser.newContext({viewport:{width:1000,height:750}});
  await context.route('**/api/v1/**',route=>route.fulfill({status:401,contentType:'application/json',body:'{}'}));
  const page=await context.newPage();
  let blocked=0;
  await page.route('**/assets/js/'+device+'_15.js',async route=>{
    if(blocked++===0)await route.fulfill({status:503,contentType:'text/javascript',body:'/* deliberately simulated outage */'});
    else await route.continue();
  });
  try{
    await page.goto(BASE+device+'.html#home',{waitUntil:'load',timeout:45000});
    await caseRun(rows,device+' route failure/retry',async()=>{
      await page.evaluate(()=>window.setPage('vs'));
      await page.waitForFunction(()=>!!document.querySelector('#vsHost button.pt-route-retry'),{timeout:25000});
      await page.locator('#vsHost button.pt-route-retry').click();
      await page.waitForFunction(()=>PT_ROUTE_ASSETS.loaded().includes('15')&&!!window.VS,{timeout:25000});
      const s=await hostSnapshot(page,'vsHost');
      assert.equal(s.shadow,true,'VS did not recover');
      return {simulatedFailures:1,retryWorked:true,host:s};
    });
  }finally{await context.close();}
}

async function imageFallback(){
  const rows=[];summary.images=rows;
  const context=await browser.newContext({viewport:{width:1280,height:800}});
  await context.addInitScript(()=>{window.__PX_NO_AVIF=true;});
  const page=await context.newPage();
  try{
    await page.goto(BASE+'pc.html#home',{waitUntil:'load',timeout:45000});
    await caseRun(rows,'forced no-AVIF fallback',async()=>{
      const d=await page.evaluate(async()=>{
        await PXS.ready();const id=PXS.ids().find(i=>PXS.has('_fb_'+i));
        if(!id)return {notTestable:true,reason:'No fallback image in PXS manifest'};
        const img=await PXS.bitmap(id);
        return {fallback:PXS.fallback(),id,width:img.width||img.naturalWidth,height:img.height||img.naturalHeight};
      });
      if(!d.notTestable){
        assert.equal(d.fallback,true,'fallback mode inactive');
        assert.equal(d.width>0,true,'fallback failed to decode');
      }
      return d;
    });
  }finally{await context.close();}
}

async function characterRetry(){
  const rows=[];summary.dataRecovery=rows;
  const context=await browser.newContext();
  await context.route('**/api/v1/**',route=>route.fulfill({status:401,contentType:'application/json',body:'{}'}));
  const page=await context.newPage();
  let count=0;
  await page.route('**/assets/data/characters/anna.json',async route=>{
    if(count++===0)await route.fulfill({status:503,contentType:'application/json',body:'{"error":"temporary"}'});
    else await route.continue();
  });
  try{
    await page.goto(BASE+'pc.html#home',{waitUntil:'load',timeout:45000});
    await caseRun(rows,'character JSON failure/retry',async()=>{
      const d=await page.evaluate(async()=>{
        const c=CHARACTERS.find(c=>c.id==='anna');if(!c)throw Error('anna missing');
        let failed=false;
        try{await PT_CHAR_DATA.load(c)}catch(e){failed=true}
        if(!failed)throw Error('transient failure did not reject');
        await PT_CHAR_DATA.load(c);
        return {failed,loaded:c.__ptLoaded,moveCount:c.moves.length,firstMove:c.moves[0]?.name};
      });
      assert.equal(d.failed&&d.loaded,true,'lazy retry unsuccessful');
      assert.equal(d.moveCount>100,true,'move data missing');
      return d;
    });
  }finally{await context.close();}
}
try{
  await sleep(900);
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const d of ['pc','sp'])await testDevice(d);
  for(const d of ['pc','sp'])await retryRoute(d);
  await imageFallback();
  await characterRetry();
  summary.passed=summary.failures.length===0;
  if(!summary.passed)process.exitCode=1;
}catch(e){summary.failures.push({name:'suite initialization',error:String(e?.stack||e)});process.exitCode=1;}
finally{
  try{await browser?.close();}catch{}
  server.kill();
  fs.mkdirSync('test-litev1/assets/data',{recursive:true});
  fs.writeFileSync(REPORT,JSON.stringify(summary,null,2)+'\n');
  console.log('PHASE6 RESULT',JSON.stringify({passed:summary.passed,failures:summary.failures.slice(0,12),deviceCases:Object.fromEntries(Object.entries(summary.devices).map(([d,v])=>[d,{tested:v.cases.length,passed:v.cases.filter(x=>x.passed).length}]))}));
}
