/** PROJECT T Phase16: offline-to-production, localhost-only browser performance audit.
 * Measures observed transfer bytes (CDP Network.loadingFinished), request counts,
 * navigation milestones and feature-lazy deltas. NO external requests or API writes.
 * The numbers represent an isolated local server, not the real CDN/mobile network.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const ROOT = 'http://127.0.0.1:8776/';
const OUTPUT = process.argv.find(x => x.startsWith('--out='))?.slice(6) || 'phase16-performance/baseline.json';
const SITE = process.argv.find(x => x.startsWith('--site='))?.slice(7) || '.';
const profiles = [
  {name:'desktop-fast', downloadBps:1_250_000, uploadBps:250_000, latency:20},
  {name:'mobile-4g-simulated', downloadBps:250_000, uploadBps:125_000, latency:80}
];
const result={phase:22, type:'isolated-localhost-simulation', at:new Date().toISOString(),
  passed:false, notes:[
  'Strict local CSP blocks external resource loads; browser DNS denies non-local hosts.',
  'Only a disposable localhost static server is used; /api/* returns synthetic 401 and writes are denied.',
  'Sheet and glossary measure after document.fonts.ready so network font bytes count under 4G.',
  'Timings are environment-specific, not production Web Vitals.',
  'No production authentication, uploads, private user data or GitHub Pages are contacted.'
], devices:{}, failures:[]};
let server, browser;

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function serve(){
  server=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port','8776','--directory',SITE],{stdio:'ignore'});
  for(let i=0;i<90;i++){
    try{const response=await fetch(ROOT+'pc.html');if(response.status===200)return;}catch{}
    await sleep(150);
  }
  throw Error('local static server failed to start');
}
function summariseNetwork(events){
  const items=events.filter(e=>e.origin==='local'&&!e.api);
  const requestCounts={},bytesByType={};
  for(const x of items){
    let kind=x.type||'Other';
    requestCounts[kind]=(requestCounts[kind]||0)+1;
    bytesByType[kind]=(bytesByType[kind]||0)+(x.bytes||0);
  }
  for(const key in bytesByType)bytesByType[key]=Math.round(bytesByType[key]);
  return {
    requestCount:items.length,
    transferBytes:Math.round(items.reduce((a,x)=>a+(x.bytes||0),0)),
    cachedCount:items.filter(x=>x.fromCache||x.fromDiskCache).length,
    response304:items.filter(x=>x.status===304).length,
    byType:requestCounts,
    bytesByType,
    topByTransfer:[...items].sort((a,b)=>(b.bytes||0)-(a.bytes||0)).slice(0,8).map(x=>({
      path:x.path,bytes:Math.round(x.bytes||0),type:x.type,status:x.status
    }))
  };
}
async function run(device,profile){
  const ctx=await browser.newContext({
    viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},
    isMobile:device==='sp',deviceScaleFactor:1,serviceWorkers:'block'
  });
  const page=await ctx.newPage(),cdp=await ctx.newCDPSession(page),reqs=new Map(),completed=[],pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  // Playwright route() disables the browser HTTP cache. Instead the local
  // test server supplies 401 for /api and CSP blocks third-party resources.
  // This preserves real Chromium cache semantics for measured navigations.
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{
    offline:false,latency:profile.latency,
    downloadThroughput:profile.downloadBps,
    uploadThroughput:profile.uploadBps
  });
  cdp.on('Network.requestWillBeSent',e=>{
    let url;try{url=new URL(e.request.url);}catch{return;}
    reqs.set(e.requestId,{url:e.request.url,path:url.pathname,origin:url.origin===new URL(ROOT).origin?'local':'blocked',
      api:url.pathname.startsWith('/api/'),type:e.type||'Other',status:null,bytes:0,fromCache:false,fromDiskCache:false});
  });
  cdp.on('Network.responseReceived',e=>{
    const x=reqs.get(e.requestId);if(!x)return;
    x.status=e.response.status;x.type=e.type;x.fromDiskCache=!!e.response.fromDiskCache;
  });
  cdp.on('Network.requestServedFromCache',e=>{
    const x=reqs.get(e.requestId);if(x)x.fromCache=true;
  });
  cdp.on('Network.loadingFinished',e=>{
    const x=reqs.get(e.requestId);if(!x)return;
    x.bytes=e.encodedDataLength;
    completed.push({...x});
    reqs.delete(e.requestId);
  });
  cdp.on('Network.loadingFailed',e=>{reqs.delete(e.requestId);});
  const snapshots={};
  const snapshot=()=>completed.map(x=>({...x}));
  const delta=(before,after)=>summariseNetwork(after.slice(before.length));
  try{
    const t0=Date.now();
    await page.goto(ROOT+device+'.html#home',{waitUntil:'load',timeout:90000});
    await page.waitForFunction(()=>!!window.PT_ROUTE_ASSETS&&!!window.PT_CHAR_DATA,{timeout:45000});
    await sleep(500);
    const coldTime=Date.now()-t0;
    const cold=snapshot();
    const home=await page.evaluate(()=>{
      const nav=performance.getEntriesByType('navigation')[0];
      return {
        title:document.title,htmlBytes:document.documentElement.outerHTML.length,
        navDomContentLoadedMs:Math.round(nav?.domContentLoadedEventEnd||0),
        navLoadMs:Math.round(nav?.loadEventEnd||0),
        navTtfbMs:Math.round(nav?.responseStart||0),
        loadedCharacters:window.PT_CHAR_DATA.loaded(),
        loadedRoutes:window.PT_ROUTE_ASSETS.loaded(),
        serviceWorkerControlled:!!navigator.serviceWorker?.controller,
        timings:performance.getEntriesByType('resource').length
      };
    });
    assert.deepEqual(home.loadedCharacters,[],'home must not eagerly load character JSON');
    assert.deepEqual(home.loadedRoutes,[],'home must not eagerly load feature modules');
    snapshots.coldHome={elapsedMs:coldTime,performance:home,network:summariseNetwork(cold)};

    let marker=snapshot();
    const t1=Date.now();
    await page.evaluate(()=>window.setPage('sheet'));
    await page.waitForFunction(d=>d==='pc'?
      document.querySelectorAll('#body tr[data-k]').length===228:
      document.querySelectorAll('#list .card[data-i]').length===228,
      device,{timeout:90000});
    await page.evaluate(()=>window.PT19_FONT_READY||Promise.resolve());
    await page.evaluate(()=>document.fonts.ready);
    // Settle all lazy images visible in this viewport so 4G font-load timing
    // does not randomly absorb/defer 30–50 KB of image bytes per run.
    await page.waitForLoadState('networkidle',{timeout:45000});
    await sleep(200);
    snapshots.sheet={elapsedMs:Date.now()-t1,network:delta(marker,snapshot())};
    marker=snapshot();
    const t2=Date.now();
    await page.evaluate(()=>window.setPage('glossary'));
    await page.waitForFunction(()=>window.GL?.count?.()===280,{timeout:90000});
    await page.evaluate(()=>document.fonts.ready);
    await sleep(200);
    snapshots.glossary={elapsedMs:Date.now()-t2,network:delta(marker,snapshot())};
    marker=snapshot();
    const t3=Date.now();
    await page.evaluate(()=>window.setPage('sheet'));
    await page.waitForFunction(d=>d==='pc'?
      document.querySelectorAll('#body tr[data-k]').length===228:
      document.querySelectorAll('#list .card[data-i]').length===228,
      device,{timeout:90000});
    await page.evaluate(()=>document.fonts.ready);
    await sleep(200);
    snapshots.returnToSheet={elapsedMs:Date.now()-t3,network:delta(marker,snapshot())};
    // Navigate to a DIFFERENT document first. Returning to the same URL now
    // performs a full navigation (not a hash change and not a forced reload).
    await page.goto(ROOT+'index.html?choose=1',{waitUntil:'load',timeout:90000});
    marker=snapshot();
    const t4=Date.now();
    await page.goto(ROOT+device+'.html#home',{waitUntil:'load',timeout:90000});
    await page.waitForFunction(()=>!!window.PT_ROUTE_ASSETS&&!!window.PT_CHAR_DATA,{timeout:45000});
    await sleep(500);
    snapshots.warmHome={elapsedMs:Date.now()-t4,network:delta(marker,snapshot())};

    assert.equal(pageErrors.length,0,'uncaught JS errors');
    assert.equal(home.serviceWorkerControlled,false,'unexpected service worker');
    return {...snapshots,pageErrors};
  } finally {
    await cdp.detach().catch(()=>{});
    await ctx.close();
  }
}
try{
  await serve();
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost']});
  for(const profile of profiles){
    result.devices[profile.name]={};
    for(const device of ['pc','sp']){
      try{
        const info=await run(device,profile);
        result.devices[profile.name][device]=info;
        console.log('PHASE16_METRIC',JSON.stringify({
          profile:profile.name,device,
          coldHome:info.coldHome, sheet:info.sheet,
          glossary:info.glossary,returnToSheet:info.returnToSheet,warmHome:info.warmHome
        }).slice(0,15000));
      }catch(e){
        result.failures.push({profile:profile.name,device,error:String(e?.stack||e).slice(0,2500)});
      }
    }
  }
}catch(e){result.failures.push({setup:String(e?.stack||e)});}
finally{
  await browser?.close();
  if(server && server.exitCode===null) {
    await new Promise(resolve=>{
      server.once('exit',resolve);
      server.kill('SIGTERM');
      setTimeout(resolve,2500).unref();
    });
  }
  result.passed=result.failures.length===0;
  fs.mkdirSync('phase16-performance',{recursive:true});
  fs.writeFileSync(OUTPUT,JSON.stringify(result,null,2)+'\n');
  console.log('PHASE16_PERFORMANCE_FINAL',JSON.stringify({
    passed:result.passed,failures:result.failures
  }));
  if(!result.passed)process.exitCode=1;
}