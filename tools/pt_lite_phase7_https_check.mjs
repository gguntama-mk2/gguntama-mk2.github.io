import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const ROOT=(process.env.PT_PREVIEW_BASE || 'https://raw.githack.com/gguntama-mk2/gguntama-mk2.github.io/project-t-preview-20261107/test-litev1/').replace(/\/?$/, '/');
const DEST='test-litev1/assets/data/phase7-public-preview-report.json';
const SHOTS='phase7-preview-screenshots';
const data={schema:7,mode:'isolated-external-HTTPS-preview',source_branch:'project-t-preview-20261107',preview_base:ROOT,at:new Date().toISOString(),passed:false,browser:'Chromium',devices:{},issues:[],notes:['This is a third-party proxy, NOT a GitHub Pages deployment.','Network coverage is on the isolated preview origin; authenticated server behavior is disabled.']};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
async function verify(device){
  const context=await browser.newContext({
    viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},
    isMobile:device==='sp',
    deviceScaleFactor:1,
    ignoreHTTPSErrors:false
  });
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const errors=[],network=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',response=>{
    try {
      const url=new URL(response.url());
      const rel=url.pathname;
      const row={url:response.url(),status:response.status(),kind:response.request().resourceType(),type:response.headers()['content-type']||'',cache:response.headers()['cache-control']||'',compressed:response.headers()['content-encoding']||''};
      if(response.url().startsWith(ROOT))network.push(row);
      else external.push({...row,url:url.origin+url.pathname.slice(0,60)});
    }catch{}
  });
  const url=ROOT+device+'.html#home';
  const timing={};
  const t0=Date.now();
  const response=await page.goto(url,{waitUntil:'load',timeout:60000});
  timing.navigation_ms=Date.now()-t0;
  try{
    await page.waitForFunction(()=>window.PT_CHAR_DATA && window.PT_ROUTE_ASSETS && window.__PROJECT_T_PREVIEW && !!document.getElementById('ptPreviewNotice'),null,{timeout:20000});
  }catch(err){
    const state=await page.evaluate(()=>({ready:document.readyState,title:document.title,html:document.documentElement.outerHTML.slice(0,1200),PT_CHAR_DATA:!!window.PT_CHAR_DATA,PT_ROUTE_ASSETS:!!window.PT_ROUTE_ASSETS,guard:!!window.__PROJECT_T_PREVIEW,banner:!!document.getElementById('ptPreviewNotice')})).catch(e=>({error:String(e)}));
    data.issues.push({device:device+'-debug',response:{status:response.status(),type:response.headers()['content-type']},state,errors,network:network.slice(0,100),other:external.slice(0,15)});
    throw err;
  }
  await sleep(1500);
  const initial={
    http_status:response.status(),
    html_content_type:response.headers()['content-type']||'',
    page_title:await page.title(),
    previewBanner:await page.locator('#ptPreviewNotice').innerText(),
    featureCount:await page.evaluate(()=>PT_ROUTE_ASSETS.loaded().length),
    characterCount:await page.evaluate(()=>PT_CHAR_DATA.loaded().length),
    page:await page.evaluate(()=>document.documentElement.dataset.page),
    errors:[...errors]
  };
  if(initial.http_status!==200)throw Error(device+' preview HTML status '+initial.http_status);
  if(!initial.html_content_type.includes('text/html'))throw Error(device+' HTML MIME mismatch '+initial.html_content_type);
  if(initial.page!=='home')throw Error(device+' did not open home');
  if(initial.featureCount||initial.characterCount)throw Error(device+' did not preserve lazy first load');
  if(errors.length)throw Error(device+' JS exceptions on home '+errors.join(';'));
  const api=await page.evaluate(async()=>{
    const result=await fetch('/api/v1/me');
    return {status:result.status,body:await result.json()};
  });
  if(api.status!==401||api.body.error!=='preview_disabled')throw Error('Preview API guard broken');
  mkdirSync(SHOTS,{recursive:true});
  await page.screenshot({path:SHOTS+'/'+device+'-home.png',fullPage:false});
  const firstResources=network.length;
  await page.evaluate(()=>window.setPage('sheet'));
  await page.waitForFunction(()=>PT_CHAR_DATA.loaded().length>0,{timeout:45000});
  await page.waitForFunction(d=>d==='pc'?document.querySelectorAll('#body tr[data-k]').length>0:document.querySelectorAll('#list .card[data-i]').length>0,device,{timeout:45000});
  await page.evaluate(()=>window.setPage('vs'));
  await page.waitForFunction(()=>window.PT_ROUTE_ASSETS.loaded().includes('15')&&!!window.VS,{timeout:45000});
  const vs=await page.evaluate(()=>({present:!!document.getElementById('vsHost')?.shadowRoot,loaded:PT_ROUTE_ASSETS.loaded()}));
  if(!vs.present)throw Error(device+' VS did not mount');
  await page.screenshot({path:SHOTS+'/'+device+'-vs.png',fullPage:false});
  // Check browser cache on second navigation; the cache policy is recorded, not assumed.
  await page.goto(url,{waitUntil:'load',timeout:60000});
  await page.waitForFunction(()=>window.PT_ROUTE_ASSETS && window.PT_CHAR_DATA,{timeout:25000});
  await sleep(700);
  const perf=await page.evaluate(()=>{
    const res=performance.getEntriesByType('resource');
    return {resources:res.length,zeroTransfer:res.filter(r=>r.transferSize===0).length,
      js:res.filter(r=>r.name.includes('/assets/js/')).slice(0,5).map(r=>({name:r.name.split('/').pop(),transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize})),
      nav:performance.getEntriesByType('navigation').map(r=>({transferSize:r.transferSize,encodedBodySize:r.encodedBodySize,decodedBodySize:r.decodedBodySize,duration:Math.round(r.duration)}))}
  });
  const bad=network.filter(x=>x.status>=400);
  if(bad.length)throw Error(device+' preview asset failures: '+JSON.stringify(bad.slice(0,7)));
  if(errors.length)throw Error(device+' JS exceptions: '+errors.join(';'));
  const result={url,initial,apiGuard:api,firstLoad:{requestCount:firstResources,navigationMs:timing.navigation_ms,assetsByType:network.slice(0,firstResources).reduce((a,x)=>((a[x.kind]=(a[x.kind]||0)+1),a),{}),html:network.find(x=>x.url.includes(device+'.html'))},vs,cacheReload:perf,staticRequests:network.length,thirdPartyRequests:external.slice(0,10),httpErrors:bad,jsErrors:errors};
  await context.close();
  console.log('HTTPS_PREVIEW',device,JSON.stringify({status:result.initial.http_status,contentType:result.initial.html_content_type,requests:result.firstLoad.requestCount,cache:result.cacheReload.nav,issues:result.jsErrors,preview:result.url}));
  return result;
}
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const d of ['pc','sp']){
    try{data.devices[d]=await verify(d);}
    catch(e){data.issues.push({device:d,error:String(e?.stack||e)});}
  }
  data.passed=data.issues.length===0&&Object.keys(data.devices).length===2;
  if(!data.passed)process.exitCode=1;
}catch(e){data.issues.push({device:'setup',error:String(e?.stack||e)});process.exitCode=1;}
finally{
  await browser?.close();
  writeFileSync(DEST,JSON.stringify(data,null,2)+'\n');
  console.log('HTTPS_PREVIEW_FINAL',JSON.stringify({passed:data.passed,issues:data.issues,devices:Object.keys(data.devices)}));
}
