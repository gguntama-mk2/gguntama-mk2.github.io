/**
 * Phase 9 – compare live PROJECT T production and independently deployed Vercel.
 * READ-ONLY: no login, server mutations or user data. Browser contexts are ephemeral.
 * Output: JSON report and paired screenshot PNG/diffs.
 */
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdirSync, writeFileSync } from 'node:fs';

const SOURCE={
  production:'https://www.project-t-god.com/',
  preview:'https://project-t-lite-preview-20261107-asf281d07-guntama1205-4982.vercel.app/'
};
const OUT='test-litev1/assets/data/phase9-production-vs-preview.json';
const SHOTS='phase9-compare-screenshots';
mkdirSync(SHOTS,{recursive:true});
const summary={
  phase:9,at:new Date().toISOString(),
  source:SOURCE,scope:'read-only, anonymous, isolated localStorage',
  passed:false,devices:{},failures:[],warnings:[],diffs:[],
  expectedDifferences:[
    'preview adds PTPreviewNotice banner and disables real OAuth/API calls',
    'preview fetches feature scripts, images, and character JSON lazily',
    'production and preview may display distinct clock values, fonts timing, ad content and dynamic timestamps'
  ]
};
let browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function cleanText(s){return String(s||'').replace(/\s+/g,' ').trim();}
function error(e){return String(e?.stack||e).slice(0,1400);}
async function getState(page,device,route){
  return page.evaluate(({route,device})=>{
    const hostIds={combo:'cbHost',glossary:'glHost',punish:'pnHost',stage:'sgHost',
      gallery:'gaHost',vs:'vsHost',login:'lgHost',update:'updHost',privacy:'prHost'};
    const id=hostIds[route],host=id?document.getElementById(id):null;
    const root=host?.shadowRoot||host;
    const nodes=[...document.querySelectorAll('[data-go]')].filter(x=>!x.closest('#ptPreviewNotice'));
    const nav=Array.from(new Set(nodes.map(x=>x.getAttribute('data-go')).filter(Boolean))).sort();
    const bodyRoot=device==='pc'?document.getElementById('body'):document.getElementById('list');
    const tbodyRows=document.querySelectorAll('#body tr[data-k]').length;
    const spRows=document.querySelectorAll('#list .card[data-i]').length;
    const rect=(el)=>{if(!el)return null;const r=el.getBoundingClientRect();return {width:Math.round(r.width),height:Math.round(r.height),left:Math.round(r.left),top:Math.round(r.top)};};
    const hostText=(root?.textContent||'');
    const counts={
      characters:Array.isArray(window.CHARACTERS)?CHARACTERS.length:null,
      combo:window.CB&&typeof CB.count==='function'?CB.count():null,
      glossary:window.GL&&typeof GL.count==='function'?GL.count():null,
      punish:window.PN&&typeof PN.count==='function'?PN.count():null,
      stages:window.SG&&typeof SG.count==='function'?SG.count():null,
      updates:typeof PT_FULL_UPDATES!=='undefined'&&PT_FULL_UPDATES?PT_FULL_UPDATES.length:null,
      sheetRows:device==='pc'?tbodyRows:spRows,
      galleryCards:document.querySelectorAll('#gaHost .ga-card').length
    };
    const vsEl=document.getElementById('vsHost');
    return {
      route,currentPage:document.documentElement.dataset.page||null,title:document.title,
      nav,counts,
      host:{id,exists:!!host,shadow:!!host?.shadowRoot,children:root?.children.length||0,textLength:hostText.trim().length,
        controls:root?.querySelectorAll('button,input,select').length||0},
      html:{width:document.documentElement.scrollWidth,viewport:innerWidth,overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)},
      sheet:{visible:!!bodyRoot,rows:device==='pc'?tbodyRows:spRows},
      mainMenu:rect(document.getElementById('mnTab')),
      loadedModules:window.PT_ROUTE_ASSETS?.loaded?.()||null,
      loadedCharacterData:window.PT_CHAR_DATA?.loaded?.()||null,
      previewBanner:!!document.getElementById('ptPreviewNotice'),
      authGuard:!!window.__PROJECT_T_PREVIEW,
      vsMounted:!!vsEl?.shadowRoot&&!!window.VS
    };
  },{route,device});
}
async function navigate(page,route,device){
  await page.evaluate(route=>{if(typeof window.setPage!=='function')throw Error('setPage unavailable');window.setPage(route);},route);
  await page.waitForFunction(r=>document.documentElement.dataset.page===r,route,{timeout:45000});
  if(route==='sheet'){
    await page.waitForFunction(d=>d==='pc'?document.querySelectorAll('#body tr[data-k]').length>0:document.querySelectorAll('#list .card[data-i]').length>0,device,{timeout:65000});
  }
  if(route==='vs'){
    await page.waitForFunction(()=>!!document.getElementById('vsHost')?.shadowRoot&&!!window.VS,{timeout:55000});
  }
  if(route==='glossary'){
    await page.waitForFunction(()=>typeof window.GL?.count==='function'&&window.GL.count()>0,{timeout:60000});
  }
  if(route==='stage'){
    await page.waitForFunction(()=>typeof window.SG?.count==='function'&&window.SG.count()>0,{timeout:40000});
  }
  if(route==='combo'){
    await page.waitForFunction(()=>!!document.getElementById('cbHost')&&(document.getElementById('cbHost').textContent||'').trim().length>20,{timeout:60000});
  }
  if(route==='update' && !!(await page.evaluate(()=>!!window.PT_ROUTE_ASSETS))){
    await page.waitForFunction(()=>typeof PT_FULL_UPDATES!=='undefined'&&PT_FULL_UPDATES?.length>0,{timeout:50000});
  }
  await sleep(600);
}
async function runOrigin(browser,device,label){
  const ctx=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},isMobile:device==='sp',deviceScaleFactor:1,ignoreHTTPSErrors:false,serviceWorkers:'block'});
  // Never issue real account-state mutations in this comparison.
  await ctx.route('**/*',async route=>{
    if(!['GET','HEAD','OPTIONS'].includes(route.request().method()))
      return route.fulfill({status:403,contentType:'application/json',body:'{"error":"comparison_read_only"}'});
    return route.continue();
  });
  const page=await ctx.newPage();page.setDefaultTimeout(18000);
  const errors=[],requestFailures=[],firstPartyHttpErrors=[],thirdPartyHttpErrors=[],warnings=[],states={},shots={},timings={};
  page.on('pageerror',e=>errors.push(e.message.slice(0,350)));
  page.on('requestfailed',r=>{if(requestFailures.length<35)requestFailures.push({url:r.url().slice(0,200),error:r.failure()?.errorText});});
  const firstOrigin=new URL(SOURCE[label]).origin;
  page.on('response',response=>{
    try{
      if(response.status()<400)return;
      const u=new URL(response.url()),isFirst=u.origin===firstOrigin;
      const list=isFirst?firstPartyHttpErrors:thirdPartyHttpErrors;
      if(list.length<30)list.push({status:response.status(),url:u.origin+u.pathname.slice(0,130),type:response.request().resourceType()});
    }catch{}
  });
  const url=SOURCE[label]+device+'.html#home';
  let response;
  try{
    const start=Date.now();
    response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:135000});
    await page.waitForFunction(()=>typeof window.setPage==='function',{timeout:95000});
    await sleep(1700);
    timings.homeNavigationMs=Date.now()-start;
    timings.navResource=await page.evaluate(()=>performance.getEntriesByType('navigation').map(n=>({transferSize:n.transferSize,encodedBodySize:n.encodedBodySize,decodedBodySize:n.decodedBodySize,domContentLoadedEventEnd:Math.round(n.domContentLoadedEventEnd),duration:Math.round(n.duration)})));
    states.home=await getState(page,device,'home');
    shots.home=SHOTS+'/'+device+'-'+label+'-home.png';
    await page.screenshot({path:shots.home,animations:'disabled'});
    for(const route of ['sheet','combo','glossary','stage','vs','gallery','update']){
      try{
        const t0=Date.now();await navigate(page,route,device);
        timings[route+'Ms']=Date.now()-t0;
        states[route]=await getState(page,device,route);
        if(['sheet','vs'].includes(route)){
          shots[route]=SHOTS+'/'+device+'-'+label+'-'+route+'.png';
          await page.screenshot({path:shots[route],animations:'disabled'});
        }
        console.log('ROUTE',label,device,route,JSON.stringify({count:states[route].counts,host:states[route].host}).slice(0,300));
      }catch(e){
        states[route]={error:error(e),...await getState(page,device,route).catch(()=>({}))};
        warnings.push(route+': '+error(e));
        console.error('ROUTE_FAIL',label,device,route,error(e).slice(0,350));
      }
    }
    return {url,httpStatus:response.status(),contentType:response.headers()['content-type'],states,shots,timings,errors,
      requestFailures,firstPartyHttpErrors,thirdPartyHttpErrors,warnings};
  }catch(e){
    return {url,httpStatus:response?.status()||null,error:error(e),states,shots,timings,errors,requestFailures,firstPartyHttpErrors,thirdPartyHttpErrors,warnings};
  }finally{await ctx.close();}
}
function imageDiff(left,right,dest){
  try{
    const a=PNG.sync.read(Buffer.from(left)),b=PNG.sync.read(Buffer.from(right));
    if(a.width!==b.width||a.height!==b.height)return {error:'size mismatch',a:[a.width,a.height],b:[b.width,b.height]};
    const out=new PNG({width:a.width,height:a.height});
    const count=pixelmatch(a.data,b.data,out.data,a.width,a.height,{threshold:.1,includeAA:false});
    writeFileSync(dest,PNG.sync.write(out));
    return {differentPixels:count,totalPixels:a.width*a.height,differentPercent:Math.round(10000*count/(a.width*a.height))/100,diffImage:dest};
  }catch(e){return {error:error(e)};}
}
function check(device,prod,preview){
  const diff=[],issues=[],warnings=[];
  if(prod.httpStatus!==200)issues.push('production HTTP '+prod.httpStatus);
  if(preview.httpStatus!==200)issues.push('preview HTTP '+preview.httpStatus);
  if(!prod.states.home||!preview.states.home)issues.push('home unavailable at one or both origins');
  else{
    const p=prod.states.home,q=preview.states.home;
    if(p.nav.length&&q.nav.length){
      const missing=p.nav.filter(k=>!q.nav.includes(k)),added=q.nav.filter(k=>!p.nav.includes(k));
      if(missing.length)issues.push('preview navigation missing: '+missing.join(','));
      if(added.length)warnings.push('preview extra nav: '+added.join(','));
      diff.push({kind:'nav',production:p.nav.length,preview:q.nav.length,missing,added});
    }
    if(Number.isFinite(p.counts.characters)&&Number.isFinite(q.counts.characters)&&p.counts.characters!==q.counts.characters){
      issues.push('character count differs '+p.counts.characters+' vs '+q.counts.characters);
    }
    if(q.html.overflow>20&&p.html.overflow<=20)warnings.push('preview horizontal overflow '+q.html.overflow+'px on '+device);
  }
  for(const route of ['sheet','combo','glossary','stage','vs','gallery','update']){
    const p=prod.states[route]||{},q=preview.states[route]||{};
    if(q.error||!q.currentPage)issues.push('preview '+route+' failed: '+String(q.error||'missing').slice(0,250));
    if(p.error||!p.currentPage)warnings.push('production '+route+' unavailable: '+String(p.error||'missing').slice(0,180));
    if(p.currentPage&&q.currentPage&&p.currentPage!==q.currentPage)issues.push(route+' page mismatch '+p.currentPage+'/'+q.currentPage);
    const pairs=route==='sheet'?['sheetRows']:route==='glossary'?['glossary']:route==='stage'?['stages']:route==='combo'?['combo']:route==='update'?['updates']:route==='gallery'?['galleryCards']:[];
    for(const key of pairs){
      const left=p.counts?.[key],right=q.counts?.[key];
      if(left!==null&&right!==null&&Number.isFinite(left)&&Number.isFinite(right)&&left!==right)issues.push(route+' '+key+' differs: '+left+' vs '+right);
      diff.push({kind:route,key,production:left??null,preview:right??null});
    }
    if(route==='vs'&&p.vsMounted&&(!q.vsMounted))issues.push('preview VS did not mount');
  }
  if(preview.errors.length)issues.push('preview JS errors: '+preview.errors.slice(0,4).join('|'));
  if(preview.firstPartyHttpErrors.length)issues.push('preview HTTP failures: '+JSON.stringify(preview.firstPartyHttpErrors.slice(0,6)));
  if(prod.errors.length)warnings.push('production JS errors: '+prod.errors.slice(0,5).join('|'));
  if(prod.firstPartyHttpErrors.length)warnings.push('production first-party errors: '+JSON.stringify(prod.firstPartyHttpErrors.slice(0,4)));
  return {issues,warnings,diff};
}
try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const device of ['pc','sp']){
    const prod=await runOrigin(browser,device,'production');
    const preview=await runOrigin(browser,device,'preview');
    const compare=check(device,prod,preview);
    const shotDiffs={};
    for(const route of ['home','sheet','vs']){
      if(!prod.shots[route]||!preview.shots[route])continue;
      try{
        const {readFileSync}=await import('node:fs');
        const left=readFileSync(prod.shots[route]),right=readFileSync(preview.shots[route]);
        shotDiffs[route]=imageDiff(left,right,SHOTS+'/'+device+'-diff-'+route+'.png');
      }catch(e){shotDiffs[route]={error:error(e)};}
    }
    summary.devices[device]={production:prod,preview,comparison:compare,screenshotDiffs:shotDiffs};
    summary.failures.push(...compare.issues.map(x=>device+': '+x));
    summary.warnings.push(...compare.warnings.map(x=>device+': '+x));
    console.log('DEVICE',device,JSON.stringify({prodMs:prod.timings.homeNavigationMs,previewMs:preview.timings.homeNavigationMs,
      productionBytes:prod.timings.navResource?.[0]?.decodedBodySize,previewBytes:preview.timings.navResource?.[0]?.decodedBodySize,
      issues:compare.issues,warnings:compare.warnings,screenshotDiffs:shotDiffs}).slice(0,3000));
  }
  summary.passed=summary.failures.length===0;
  if(!summary.passed)process.exitCode=1;
}catch(e){summary.failures.push('setup: '+error(e));process.exitCode=1;}
finally{
  await browser?.close();
  writeFileSync(OUT,JSON.stringify(summary,null,2)+'\n');
  console.log('PHASE9_FINAL',JSON.stringify({passed:summary.passed,failures:summary.failures,warnings:summary.warnings,devices:Object.keys(summary.devices)}).slice(0,7000));
}
