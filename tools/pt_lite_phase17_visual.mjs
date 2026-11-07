/** PROJECT T Phase17: real browser visual parity on localhost (no external network).
 * Compare settled home/sheet screenshots across PC/mobile. Screenshot changes
 * from the clock or anti-aliasing are tolerated within a small budget.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const ROOT='phase17-performance';
const BEFORE='phase16-performance/optimized-site',AFTER='phase17-performance/optimized-site';
const SERVERS=[{port:8781,root:BEFORE},{port:8782,root:AFTER}];
const result={phase:17,mode:'local-browser-side-by-side',passed:false,comparisons:[],errors:[],
  notes:'After fonts.ready; all external requests and writes denied; on-screen images decoded before screenshot.'};
let browser;const servers=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function startServers(){
 for(const {port,root} of SERVERS){
  const p=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port',String(port),'--directory',root],{stdio:'ignore'});
  servers.push(p);
  let ready=false;
  for(let n=0;n<80;n++){
   try{const r=await fetch('http://127.0.0.1:'+port+'/pc.html');if(r.ok){ready=true;break;}}catch{}
   await pause(150);
  }
  if(!ready)throw Error('HTTP server did not start on '+port);
 }
}
async function capture(port,dev,route){
 const origin='http://127.0.0.1:'+port;
 const ctx=await browser.newContext({viewport:dev==='pc'?{width:1440,height:900}:{width:390,height:844},
   deviceScaleFactor:1,isMobile:dev==='sp',serviceWorkers:'block'});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await ctx.route('**/*',r=>{
  const u=new URL(r.request().url());
  if(u.origin!==origin || !['GET','HEAD','OPTIONS'].includes(r.request().method()))
   return r.abort('blockedbyclient');
  if(u.pathname.startsWith('/api/'))
   return r.fulfill({status:401,contentType:'application/json',body:'{"detail":"mock"}'});
  return r.continue();
 });
 const cdp=await ctx.newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:20,downloadThroughput:1_250_000,uploadThroughput:250_000});
 try{
  await page.goto(origin+'/'+dev+'.html#home',{waitUntil:'load',timeout:85000});
  await page.waitForFunction(()=>!!window.PT_ROUTE_ASSETS && !!window.PT_CHAR_DATA,{timeout:30000});
  if(route!=='home'){
   await page.evaluate(route=>window.setPage(route),route);
   if(route==='sheet')await page.waitForFunction(dev=>dev==='pc'
    ? document.querySelectorAll('#body tr[data-k]').length===228
    : document.querySelectorAll('#list .card[data-i]').length===228,dev,{timeout:60000});
  }
  await page.evaluate(async()=>{
   await Promise.race([document.fonts.ready,new Promise(res=>setTimeout(res,8000))]);
   await Promise.all([...document.querySelectorAll('img')].filter(img=>{
    const r=img.getBoundingClientRect(),s=getComputedStyle(img);
    return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0&&s.visibility!=='hidden'&&s.display!=='none';
   }).map(img=>Promise.race([img.decode().catch(()=>{}),new Promise(res=>setTimeout(res,5000))])));
  });
  await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
  await pause(650);
  const metric=await page.evaluate(()=>{
   const els=typeof CHARACTERS==='undefined' ? 0 : CHARACTERS.length;
   const sheet=document.documentElement.dataset.page==='sheet';
   const font=getComputedStyle(document.body).fontFamily;
   return {
    route:document.documentElement.dataset.page||'sheet',characters:els,
    fontFamily:font,viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    firstPaint:performance.getEntriesByType('paint').map(p=>({name:p.name,ms:Math.round(p.startTime)})),
    sheetRows:sheet?document.querySelectorAll('#body tr[data-k],#list .card[data-i]').length:null,
    title:document.title,maruReady:document.fonts.check('16px "MaruGoKawa"')
   };
  });
  assert.equal(metric.route,route);
  assert.equal(errors.length,0,errors.join(';'));
  const shot=await page.screenshot({animations:'disabled',fullPage:false});
  return {metric,shot};
 }finally{await ctx.close();}
}
function pixelCompare(a,b){
 return Promise.all([sharp(a).removeAlpha().raw().toBuffer({resolveWithObject:true}),
   sharp(b).removeAlpha().raw().toBuffer({resolveWithObject:true})]).then(([x,y])=>{
   assert.equal(x.info.width,y.info.width);
   assert.equal(x.info.height,y.info.height);
   assert.equal(x.data.length,y.data.length);
   let mae=0,distinct=0;
   for(let i=0;i<x.data.length;i++){
    const d=Math.abs(x.data[i]-y.data[i]);mae+=d;if(d>14)distinct++;
   }
   return {meanAbsPixelDifference:+(mae/x.data.length).toFixed(3),
    changedChannelFraction:+(distinct/x.data.length).toFixed(4)};
 });
}
try{
 await startServers();browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 fs.mkdirSync(ROOT,{recursive:true});
 for(const dev of ['pc','sp']){
  for(const route of ['home','sheet']){
   try{
    const before=await capture(8781,dev,route),after=await capture(8782,dev,route);
    const pixels=await pixelCompare(before.shot,after.shot);
    const item={device:dev,route,baseline:before.metric,optimized:after.metric,
      ...pixels,passed:before.metric.sheetRows===after.metric.sheetRows
         &&before.metric.title===after.metric.title
         &&before.metric.fontFamily===after.metric.fontFamily
         &&pixels.meanAbsPixelDifference<=8.0};
    result.comparisons.push(item);
    fs.writeFileSync(path.join(ROOT,'visual-'+dev+'-'+route+'-baseline.png'),before.shot);
    fs.writeFileSync(path.join(ROOT,'visual-'+dev+'-'+route+'-optimized.png'),after.shot);
    if(!item.passed)result.errors.push({device:dev,route,pixels,reason:'visual parity exceeded allowed tolerance'});
    console.log('PHASE17_VISUAL',JSON.stringify(item).slice(0,3000));
   }catch(e){result.errors.push({device:dev,route,error:String(e?.stack||e).slice(0,1600)});}
  }
 }
}catch(e){result.errors.push({setup:String(e?.stack||e)});}
finally{
 await browser?.close();
 for(const server of servers){server.kill('SIGTERM');}
 result.passed=result.errors.length===0;
 fs.writeFileSync(path.join(ROOT,'visual-report.json'),JSON.stringify(result,null,2)+'\n');
 console.log('PHASE17_VISUAL_FINAL',JSON.stringify({passed:result.passed,errors:result.errors}));
 if(!result.passed)process.exitCode=1;
}
