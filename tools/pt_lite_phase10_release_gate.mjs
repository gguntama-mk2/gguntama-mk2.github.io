import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const BASE='https://project-t-lite-preview-20261107-guntama1205-4982.vercel.app/';
const REPORT='test-litev1/assets/data/phase10-release-gate-report.json';
const LIMIT=1000000;
const out={phase:10,at:new Date().toISOString(),base:BASE,passed:false,network:{},storage:{},checks:[],failures:[],notes:[
  'Chrome CDP encodedDataLength measures network transfer, including headers/compression, with a 2500ms observation window after page load.',
  'The preview has no live account back-end. Real login, upload, and authenticated API endpoints are not tested.',
  'Production and Vercel use different origins; browser storage is only shared across PC and SP paths on the same origin.',
  'Cache performance varies by browser/CDN/region; report raw headers and repeat navigation without assuming immutable assets.'
]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;
function check(name,ok,info={}){out.checks.push({name,passed:!!ok,info});if(!ok)out.failures.push({name,info});console.log(ok?'PASS':'FAIL',name,JSON.stringify(info).slice(0,1200));}
function kind(url){const p=new URL(url).pathname;
  if(/\/assets\/data\/characters\//.test(p))return 'character';
  if(/\/assets\/pxstore\//.test(p))return 'images';
  if(/\/assets\/media\//.test(p))return 'media';
  if(/\/assets\/js\//.test(p)||/\/(move-icons|move-media-preview)\.js$/.test(p))return 'js';
  if(/\/assets\/css\//.test(p))return 'css';
  if(/\/icons\//.test(p))return 'icons';
  if(/\/(pc|sp)\.html$/.test(p))return 'html';
  if(/\/api\//.test(p))return 'api';
  return 'other';
}
async function trace(page){
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  const pending=new Map(),rows=[];
  cdp.on('Network.responseReceived',event=>{
    const a=pending.get(event.requestId)||{};
    Object.assign(a,{url:event.response.url,status:event.response.status,headers:event.response.headers,
      cache:!!event.response.fromDiskCache,worker:!!event.response.fromServiceWorker});
    pending.set(event.requestId,a);
  });
  cdp.on('Network.requestServedFromCache',event=>{
    const a=pending.get(event.requestId)||{};a.cache=true;pending.set(event.requestId,a);
  });
  cdp.on('Network.loadingFinished',event=>{
    const a=pending.get(event.requestId)||{};a.bytes=event.encodedDataLength||0;
    rows.push(a);pending.delete(event.requestId);
  });
  cdp.on('Network.loadingFailed',event=>{
    const a=pending.get(event.requestId)||{};a.failed=event.errorText;
    rows.push(a);pending.delete(event.requestId);
  });
  return {rows,pending};
}
function summarize(arr){
  const groups={},samples={},errors=[],details=[];
  let total=0;
  for(const a of arr){
    if(!a.url)continue;
    const k=kind(a.url); const bytes=Math.round(a.bytes||0);total+=bytes;
    groups[k]=(groups[k]||0)+bytes;
    const h=a.headers||{};
    const info={path:new URL(a.url).pathname,origin:new URL(a.url).origin,status:a.status||0,bytes,kind:k,
      cacheControl:h['cache-control']||h['Cache-Control']||'',etag:h.etag||h.ETag||'',
      contentEncoding:h['content-encoding']||h['Content-Encoding']||'',hit:!!a.cache,failed:a.failed||null};
    details.push(info);
    if(a.status>=400||a.failed)errors.push(info);
    if(!samples[k]||samples[k].bytes<bytes)samples[k]=info;
  }
  return {totalBytes:total,requestCount:details.length,groups,cacheHits:details.filter(x=>x.hit).length,
    errors,headers:samples,largest:details.sort((a,b)=>b.bytes-a.bytes).slice(0,14)};
}
async function network(device){
  const ctx=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},
    isMobile:device==='sp',serviceWorkers:'block',deviceScaleFactor:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const c=await trace(page);
  const begin=Date.now();
  const response=await page.goto(BASE+device+'.html#home',{waitUntil:'load',timeout:85000});
  await page.waitForFunction(()=>window.PT_CHAR_DATA&&window.PT_ROUTE_ASSETS&&document.documentElement.dataset.page==='home',null,{timeout:25000});
  await sleep(2500);
  const cold=summarize(c.rows.slice());
  const firstNavMs=Date.now()-begin-2500;
  const ready=await page.evaluate(()=>({characters:PT_CHAR_DATA.loaded().length,modules:PT_ROUTE_ASSETS.loaded().length,
    preview:!!window.__PROJECT_T_PREVIEW,icons:!!window.PTIcons,media:!!window.PTMoveMedia}));
  check(device+' GET home 200',response.status()===200,{status:response.status()});
  check(device+' first 2.5s <1MB',cold.totalBytes<LIMIT,{bytes:cold.totalBytes,groups:cold.groups});
  check(device+' first-view no failed assets',cold.errors.length===0,{errors:cold.errors.slice(0,5)});
  check(device+' first-view no JS error',errors.length===0,{errors});
  check(device+' home character/modules deferred',ready.characters===0&&ready.modules===0,{ready});
  const offset=c.rows.length,t0=Date.now();
  await page.reload({waitUntil:'load',timeout:85000});await sleep(800);
  const warm=summarize(c.rows.slice(offset));
  check(device+' refresh no failed assets',warm.errors.length===0,{errors:warm.errors.slice(0,5)});
  check(device+' refresh traffic <=120% cold',warm.totalBytes<=cold.totalBytes*1.2,{cold:cold.totalBytes,warm:warm.totalBytes,hits:warm.cacheHits});
  out.network[device]={firstNavMs,reloadMs:Date.now()-t0,cold,warm,ready};
  await ctx.close();
}
async function cacheHeaders(){
  const ctx=await browser.newContext();
  const paths=[
    'pc.html','sp.html','assets/js/pc_17.js','assets/js/sp_17.js',
    'assets/css/pc_00.css','assets/css/sp_00.css',
    'assets/data/characters/alisa.json','icons/homing.webp','combos-live.json'
  ];
  out.cacheAudit={tested:[],policy:'short revalidation for current unversioned code and data'};
  for(const path of paths){
    try{
      const res=await ctx.request.get(BASE+path,{timeout:35000});
      const h=res.headers(),item={path,status:res.status(),cacheControl:h['cache-control']||'',robots:h['x-robots-tag']||'',mime:h['content-type']||'',etag:h.etag||''};
      out.cacheAudit.tested.push(item);
      check('stage10 HTTP cache revalidation '+path,
        item.status===200 && /max-age=0/.test(item.cacheControl)&&/must-revalidate/.test(item.cacheControl),item);
      check('stage10 noindex header '+path,/noindex/.test(item.robots),item);
    }catch(e){out.failures.push({name:'cache audit '+path,error:String(e)});}
  }
  await ctx.close();
}
async function storage(){
  // Discover a move in a disposable context, then seed a fresh browser profile before any app initialization.
  let ctx=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  let page=await ctx.newPage();const err=[];
  page.on('pageerror',e=>err.push(e.message));
  await page.goto(BASE+'pc.html#sheet',{waitUntil:'load',timeout:65000});
  await page.waitForFunction(()=>window.PT_CHAR_DATA&&window.PT_CHAR_DATA.loaded().includes('alisa'),null,{timeout:35000});
  const item=await page.evaluate(()=>{
    const c=CHARACTERS.find(x=>x.id==='alisa');
    if(!c)return null;
    const i=c.moves.findIndex(m=>!(m.off||[]).includes('startup'));
    if(i<0)return null;
    const m=c.moves[i];return{id:c.id,k:Number.isInteger(m.k)?m.k:i,name:m.name};
  });
  assert.ok(item,'alisa move not present');
  const checkKey=item.id+':'+item.k+':startup';
  const memoKey=item.id+':'+item.k+':memo';
  const reviewKey=item.id+':'+item.k;
  const message='旧データ保存互換確認・あいうえお';
  const seed={
    'tekken-checksheet-v1':JSON.stringify({[checkKey]:true}),
    'tekken-checksheet-memo-v1':JSON.stringify({[memoKey]:message}),
    'tekken-checksheet-review-v1':JSON.stringify({[reviewKey]:true}),
    'tekken-checksheet-last':'alisa'
  };
  await ctx.close();
  ctx=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  await ctx.addInitScript(values=>{
    if(!sessionStorage.getItem('__pt_phase10_seeded')){
      for(const [k,v] of Object.entries(values))localStorage.setItem(k,v);
      sessionStorage.setItem('__pt_phase10_seeded','1');
    }
  },seed);
  page=await ctx.newPage();page.on('pageerror',e=>err.push(e.message));
  async function one(device){
    await page.goto(BASE+device+'.html#sheet',{waitUntil:'load',timeout:65000});
    await page.waitForFunction(()=>window.PT_CHAR_DATA&&window.PT_CHAR_DATA.loaded().includes('alisa'),null,{timeout:35000});
    await page.waitForFunction(arg=>arg.device==='pc'?
      !!document.querySelector('#body tr[data-k="'+arg.k+'"] input[type="checkbox"]'):
      !!document.querySelector('#list .card[data-i="'+arg.k+'"]'),{device,k:item.k},{timeout:35000});
    const values=await page.evaluate(arg=>{
      const s=JSON.parse(localStorage.getItem('tekken-checksheet-v1')||'{}');
      const m=JSON.parse(localStorage.getItem('tekken-checksheet-memo-v1')||'{}');
      const b=JSON.parse(localStorage.getItem('tekken-checksheet-review-v1')||'{}');
      const row=document.querySelector('#body tr[data-k="'+arg.k+'"]');
      return {device:arg.device,check:s[arg.checkKey]===true,memo:m[arg.memoKey]===arg.message,
        review:b[arg.reviewKey]===true,last:localStorage.getItem('tekken-checksheet-last')==='alisa',
        checkedUI:arg.device==='pc'?[...row.querySelectorAll('input[type=checkbox]')].some(x=>x.checked):null,
        reviewUI:arg.device==='pc'?row.classList.contains('rv'):null,
        spCard:arg.device==='sp'?!!document.querySelector('#list .card[data-i="'+arg.k+'"]'):null};
    },{device,k:item.k,checkKey,memoKey,reviewKey,message});
    check('legacy storage '+device+' across navigation',values.check&&values.memo&&values.review&&values.last,values);
    if(device==='pc')check('legacy UI restores check+bookmark',values.checkedUI&&values.reviewUI,values);
    return values;
  }
  const pc=await one('pc'),sp=await one('sp'),again=await one('pc');
  const edit=await page.evaluate(arg=>{
    const row=document.querySelector('#body tr[data-k="'+arg.k+'"]');
    const x=[...row.querySelectorAll('input[type=checkbox]')].find(c=>c.checked);
    if(!x)throw Error('Expected checked checkbox');
    x.click();return {checked:x.checked,saved:JSON.parse(localStorage.getItem('tekken-checksheet-v1')||'{}')[arg.checkKey]};
  },{k:item.k,checkKey});
  await page.reload({waitUntil:'load',timeout:65000});
  await page.waitForFunction(k=>!!document.querySelector('#body tr[data-k="'+k+'"] input[type=checkbox]'),item.k,{timeout:35000});
  const retained=await page.evaluate(k=>JSON.parse(localStorage.getItem('tekken-checksheet-v1')||'{}')[k],checkKey);
  check('real UI click persists old storage key',edit.checked===false&&edit.saved!==true&&retained!==true,{edit,retained});
  check('storage test no JS error',err.length===0,{errors:err});
  const clean=await browser.newContext({serviceWorkers:'block'});
  const newPage=await clean.newPage();
  await newPage.goto(BASE+'pc.html#home',{waitUntil:'domcontentloaded',timeout:65000});
  const isEmpty=await newPage.evaluate(()=>!localStorage.getItem('tekken-checksheet-v1'));
  check('different browser profile has isolated localStorage',isEmpty,{isEmpty});
  out.storage={item,keys:Object.keys(seed),pc,sp,again,edit,retained,isolatedProfile:isEmpty,
    note:'Same-origin PC/SP compatible. Production domain localStorage cannot be read from Vercel staging.'};
  await clean.close();await ctx.close();
}
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const dev of ['pc','sp'])try{await network(dev);}catch(e){out.failures.push({name:dev+' network setup',error:String(e?.stack||e).slice(0,1800)});}
  try{await storage();}catch(e){out.failures.push({name:'storage setup',error:String(e?.stack||e).slice(0,1800)});}
  try{await cacheHeaders();}catch(e){out.failures.push({name:'cache headers setup',error:String(e?.stack||e).slice(0,1800)});}
}catch(e){out.failures.push({name:'browser startup',error:String(e?.stack||e).slice(0,1800)});}
finally{
  await browser?.close();
  out.passed=out.failures.length===0;
  fs.writeFileSync(REPORT,JSON.stringify(out,null,2)+'\n');
  console.log('PHASE10_FINAL',JSON.stringify({passed:out.passed,failures:out.failures,network:Object.fromEntries(Object.entries(out.network).map(([k,v])=>[k,{cold:v.cold.totalBytes,warm:v.warm.totalBytes,groups:v.cold.groups}])),storage:!!out.storage.item}).slice(0,7500));
  if(!out.passed)process.exitCode=1;
}