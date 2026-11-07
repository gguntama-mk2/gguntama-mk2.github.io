/**
 * PROJECT T Phase 11: smoke-test a self-contained GitHub Pages release candidate
 * on a local same-origin HTTP server, without changing production or contacting
 * authenticated backends.
 */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const ROOT='http://127.0.0.1:8768/';
const SITE='phase11-pages-package/site';
const OUT='phase11-pages-package/browser-report.json';
const report={schema:11,mode:'localhost-pages-candidate',at:new Date().toISOString(),
  passed:false,devices:{},failures:[],notes:[
    'All site static assets use the same origin. User authentication, API writes and OAuth are NOT part of this anonymous smoke test.',
    'This is an unpublished release candidate. Production main, DNS and Vercel environment remain unchanged.'
  ]};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
let server,browser;
async function start(){
  server=spawn('python3',['-m','http.server','8768','--bind','127.0.0.1','--directory',SITE],{stdio:'ignore'});
  for(let i=0;i<80;i++){
    try{const r=await fetch(ROOT+'pc.html');if(r.status===200)return;}catch{}
    await pause(250);
  }
  throw new Error('localhost server did not start');
}
async function test(device){
  const ctx=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},
    isMobile:device==='sp',deviceScaleFactor:1,serviceWorkers:'block'});
  const page=await ctx.newPage(),bad=[],errors=[],resourceUrls=[];
  // Phase15: never leave the isolated localhost test, call live OAuth,
  // or perform any POST/PATCH/PUT/DELETE (including APIs).
  await ctx.route('**/*', async route => {
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==new URL(ROOT).origin || !['GET','HEAD','OPTIONS'].includes(request.method()))
      return route.abort('blockedbyclient');
    if(url.pathname.startsWith('/api/'))
      return route.fulfill({status:401,contentType:'application/json',body:'{"detail":"test_only"}'});
    return route.continue();
  });
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',req=>resourceUrls.push(req.url()));
  page.on('response',r=>{
    const url=new URL(r.url());
    if(url.origin!==new URL(ROOT).origin)return;
    if(url.pathname.startsWith('/api/'))return; // No local auth backend in static-only test
    if(r.status()>=400&&bad.length<40)bad.push({url:url.pathname,status:r.status()});
  });
  const started=Date.now();
  const response=await page.goto(ROOT+device+'.html#home',{waitUntil:'load',timeout:65000});
  await page.waitForFunction(()=>!!window.PT_ROUTE_ASSETS&&!!window.PT_CHAR_DATA,{timeout:30000});
  await pause(950);
  const home=await page.evaluate(device=>{
    return {
      title:document.title,
      preview:!!window.__PROJECT_T_PREVIEW,
      banner:!!document.querySelector('#ptPreviewNotice'),
      robots:document.querySelector('meta[name="robots"]')?.content||'',
      version:window.PT_ASSET_VERSION||'',
      loadedCharacters:window.PT_CHAR_DATA.loaded(),
      loadedModules:window.PT_ROUTE_ASSETS.loaded(),
      moveIcons:!!window.PTIcons, moveMedia:!!window.PTMoveMedia,
      nav:[...new Set([...document.querySelectorAll('[data-go]')].map(n=>n.dataset.go).filter(Boolean))],
      jsResources:performance.getEntriesByType('resource').filter(n=>n.name.includes('/assets/js/')).map(n=>new URL(n.name).searchParams.get('v')),
      sourceIntegrity:document.querySelector('script[src*="/' + device + '_04.js"]')?.getAttribute('src')||''
    };
  },device);
  assert.equal(response.status(),200,'HTML');
  assert.ok(!home.preview&&!home.banner&&!/noindex/.test(home.robots),'no preview interlock in release');
  assert.ok(/^[a-z0-9-]{7,20}$/i.test(home.version),'release version embedded');
  assert.ok(home.jsResources.length>=8 && home.jsResources.every(v=>v===home.version),'JS cache version');
  assert.ok(home.sourceIntegrity.includes('?v='+home.version),'core script version');
  assert.equal(home.loadedCharacters.length,0,'character loading deferred');
  assert.equal(home.loadedModules.length,0,'feature modules lazy');
  assert.ok(home.nav.length>=14,'complete navigation');
  assert.ok(home.moveMedia && home.moveIcons,'real media and icons modules restored');
  const routes={};
  await page.evaluate(()=>window.setPage('sheet'));
  await page.waitForFunction(d=>d==='pc'?document.querySelectorAll('#body tr[data-k]').length>0:document.querySelectorAll('#list .card[data-i]').length>0,device,{timeout:40000});
  // Mobile intentionally renders card batches through requestAnimationFrame:
  // wait for the final batch instead of mistaking an intermediate 180/228 for data loss.
  await page.waitForFunction(d=>d==='pc'
     ?document.querySelectorAll('#body tr[data-k]').length===228
     :document.querySelectorAll('#list .card[data-i]').length===228,device,{timeout:35000});
  routes.sheet=await page.evaluate(d=>({rows:d==='pc'?document.querySelectorAll('#body tr[data-k]').length:document.querySelectorAll('#list .card[data-i]').length,
    loaded:PT_CHAR_DATA.loaded(),background:getComputedStyle(document.querySelector('.pxbg'),'::before').backgroundImage,
    movieColumn:document.querySelectorAll('#headRow th.pt-mv').length}),device);
  assert.equal(routes.sheet.rows,228,'alisa move count');
  assert.ok(routes.sheet.loaded.includes('alisa'),'alisa lazy JSON');
  assert.ok(routes.sheet.background.includes(ROOT+'assets/pxstore/'),'background same-origin');
  if(device==='pc')assert.equal(routes.sheet.movieColumn,1,'MOVIE module column');
  await page.evaluate(()=>window.setPage('glossary'));
  await page.waitForFunction(()=>typeof window.GL?.count==='function'&&GL.count()>0,{timeout:30000});
  routes.glossary=await page.evaluate(()=>GL.count());assert.equal(routes.glossary,280);
  await page.evaluate(()=>window.setPage('stage'));
  await page.waitForFunction(()=>typeof window.SG?.count==='function'&&SG.count()>0,{timeout:30000});
  routes.stage=await page.evaluate(()=>SG.count());assert.equal(routes.stage,21);
  await page.evaluate(()=>window.setPage('update'));
  await page.waitForFunction(()=>typeof PT_FULL_UPDATES!=='undefined'&&PT_FULL_UPDATES?.length>0,{timeout:30000});
  routes.updates=await page.evaluate(()=>PT_FULL_UPDATES.length);assert.equal(routes.updates,34);
  await page.evaluate(()=>window.setPage('gallery'));
  await page.waitForFunction(()=>document.querySelectorAll('#gaHost .ga-card').length>0,{timeout:30000});
  routes.gallery=await page.evaluate(()=>document.querySelectorAll('#gaHost .ga-card').length);assert.ok(routes.gallery>=1);
  await page.evaluate(()=>window.setPage('vs'));
  await page.waitForFunction(()=>!!window.VS&&!!document.querySelector('#vsHost')?.shadowRoot,{timeout:35000});
  routes.vs=await page.evaluate(()=>!!document.querySelector('#vsHost')?.shadowRoot);
  await page.evaluate(()=>window.setPage('combo'));
  await page.waitForFunction(()=>!!window.CB&&!!document.querySelector('#cbHost')?.shadowRoot,{timeout:35000});
  routes.combo=await page.evaluate(()=>!!document.querySelector('#cbHost')?.shadowRoot);
  assert.ok(routes.vs&&routes.combo,'VS and Combo route mounted');
  if(device==='pc'){
    const all=await page.evaluate(async()=>{
      const failed=[];
      for (const c of CHARACTERS) {
        try{await PT_CHAR_DATA.load(c);}catch(e){failed.push({id:c.id,error:String(e)});}
      }
      return {total:CHARACTERS.length,loaded:PT_CHAR_DATA.loaded().length,failed};
    });
    routes.characters=all;
    assert.equal(all.total,44,'44 characters');
    assert.equal(all.loaded,44,'44 independent JSONs fetched');
    assert.equal(all.failed.length,0,'no failed character JSONs');
  }
  const local=new URL(ROOT).origin;
  const assetExternal=resourceUrls.filter(u=>/\/assets\//.test(u)&&new URL(u).origin!==local);
  const proxy=resourceUrls.filter(u=>/githubraw\.com|raw\.githubusercontent\.com/i.test(u));
  assert.equal(assetExternal.length,0,'assets must be same-origin');
  assert.equal(proxy.length,0,'no GitHub raw proxy requests');
  assert.equal(bad.length,0,'static network errors');
  assert.equal(errors.length,0,'uncaught JS exceptions');
  const result={httpStatus:response.status(),durationMs:Date.now()-started,home,routes,
    staticHttpErrors:bad,jsErrors:errors,externalAssetRequests:assetExternal,proxyRequests:proxy,
    totalRequests:resourceUrls.length,localOrigin:local};
  await ctx.close();
  return result;
}
async function storage(){
  const ctx=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  const sample={check:'alisa:0:startup',memo:'alisa:0:memo',review:'alisa:0'};
  await ctx.addInitScript(seed=>{
    if(sessionStorage.getItem('__pt_phase11_seeded'))return;
    for(const [k,v] of Object.entries(seed))localStorage.setItem(k,v);
    sessionStorage.setItem('__pt_phase11_seeded','1');
  },{
    'tekken-checksheet-v1':JSON.stringify({[sample.check]:true}),
    'tekken-checksheet-memo-v1':JSON.stringify({[sample.memo]:'軽量化移行・旧メモ維持'}),
    'tekken-checksheet-review-v1':JSON.stringify({[sample.review]:true}),
    'tekken-checksheet-last':'alisa'
  });
  const page=await ctx.newPage(),roundtrip={};
  for(const device of ['pc','sp','pc']){
    await page.goto(ROOT+device+'.html#sheet',{waitUntil:'load',timeout:65000});
    await page.waitForFunction(()=>PT_CHAR_DATA?.loaded().includes('alisa'),{timeout:35000});
    await page.waitForFunction(d=>d==='pc'?!!document.querySelector('#body tr[data-k="0"]'):!!document.querySelector('#list .card[data-i="0"]'),device,{timeout:35000});
    const val=await page.evaluate(()=>{
      const check=JSON.parse(localStorage.getItem('tekken-checksheet-v1')||'{}');
      const memo=JSON.parse(localStorage.getItem('tekken-checksheet-memo-v1')||'{}');
      const review=JSON.parse(localStorage.getItem('tekken-checksheet-review-v1')||'{}');
      return {check:check['alisa:0:startup'],memo:memo['alisa:0:memo'],review:review['alisa:0'],
        last:localStorage.getItem('tekken-checksheet-last')};
    });
    assert.equal(val.check,true);assert.equal(val.memo,'軽量化移行・旧メモ維持');
    assert.equal(val.review,true);assert.equal(val.last,'alisa');
    roundtrip[device+(Object.keys(roundtrip).length+1)] = val;
  }
  await ctx.close();
  return roundtrip;
}
try{
  await start();
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const dev of ['pc','sp']){
    try{report.devices[dev]=await test(dev);}
    catch(e){report.failures.push({device:dev,error:String(e?.stack||e).slice(0,2300)});}
  }
  try{report.storage=await storage();}
  catch(e){report.failures.push({device:'storage',error:String(e?.stack||e).slice(0,2300)});}
}catch(e){report.failures.push({device:'setup',error:String(e?.stack||e).slice(0,2300)});}
finally{
  await browser?.close();
  server?.kill();
  report.passed=report.failures.length===0;
  fs.mkdirSync('phase11-pages-package',{recursive:true});
  fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
  console.log('PHASE11_FINAL',JSON.stringify({passed:report.passed,
    devices:Object.fromEntries(Object.entries(report.devices).map(([k,v])=>[k,{rows:v.routes.sheet.rows,glossary:v.routes.glossary,stage:v.routes.stage,updates:v.routes.updates,characters:v.routes.characters,requests:v.totalRequests}])),
    errors:report.failures}).slice(0,9000));
  if(!report.passed)process.exitCode=1;
}