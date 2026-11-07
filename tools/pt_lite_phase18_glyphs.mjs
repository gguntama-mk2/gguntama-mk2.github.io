/**
 * PROJECT T phase18: baseline browser-visible glyph census for conservative
 * MaruGoKawa unicode-range partition. Synthetic localhost only; no live API.
 */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const ROOT='phase18-performance';
const SITE='phase18-performance/baseline-site';
const ORIGIN='http://127.0.0.1:8786';
const errors=[],samples=[];
let server,browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
try{
 server=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port','8786','--directory',SITE],{stdio:'ignore'});
 let ready=false;
 for(let n=0;n<100;n++){try{if((await fetch(ORIGIN+'/pc.html')).ok){ready=true;break;}}catch{} await sleep(150)}
 if(!ready)throw Error('No local server');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const device of ['pc','sp']){
  const ctx=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},
   serviceWorkers:'block',isMobile:device==='sp'});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(String(e)));
  await ctx.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.origin!==ORIGIN||!['GET','HEAD','OPTIONS'].includes(r.request().method()))
    return r.abort('blockedbyclient');
   if(u.pathname.startsWith('/api/'))
    return r.fulfill({status:401,contentType:'application/json',body:'{"ok":false,"mock":true}'});
   return r.continue();
  });
  await page.goto(ORIGIN+'/'+device+'.html#home',{waitUntil:'load',timeout:90000});
  await page.waitForFunction(()=>!!window.PT_ROUTE_ASSETS&&!!window.PT_CHAR_DATA,{timeout:45000});
  for(const route of ['home','sheet']){
   if(route==='sheet'){
    await page.evaluate(()=>window.setPage('sheet'));
    await page.waitForFunction(d=>d==='pc'
     ?document.querySelectorAll('#body tr[data-k]').length===228
     :document.querySelectorAll('#list .card[data-i]').length===228,device,{timeout:60000});
   }
   await page.evaluate(()=>document.fonts.ready);
   const values=await page.evaluate(()=>{
    // innerText excludes hidden UI; textContent would include stale/hidden routes.
    const visible=document.body.innerText;
    const labels=[...document.querySelectorAll('[aria-label], [title]')]
     .filter(x=>{
      const s=getComputedStyle(x),r=x.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
     }).map(x=>[x.getAttribute('aria-label'),x.getAttribute('title')].filter(Boolean).join(' '));
    return {visibleText:visible,labels:labels.join(' '),
      page:document.documentElement.dataset.page||'sheet',
      bodyFont:getComputedStyle(document.body).fontFamily};
   });
   samples.push({device,route,characters:[...new Set(values.visibleText+values.labels)].join(''),
     bodyFont:values.bodyFont,visibleLength:values.visibleText.length});
   console.log('PHASE18_GLYPH_SAMPLE',device,route,
     'characters',samples.at(-1).characters.length,'visibleLength',values.visibleText.length);
  }
  await ctx.close();
 }
}catch(e){errors.push(String(e?.stack||e))}
finally{
 await browser?.close();server?.kill('SIGTERM');
 const all=[...new Set(samples.flatMap(x=>[...x.characters]))].join('');
 fs.mkdirSync(ROOT,{recursive:true});
 fs.writeFileSync(ROOT+'/glyph-census.json',JSON.stringify({
   phase:18,passed:errors.length===0,samples,union:all,
   unionSize:[...all].length,errors,
   caveat:'Browser-visible HTML text census; actual CSS font-shaping and glyph coverage validated separately.'
 },null,2));
 console.log('PHASE18_GLYPH_CENSUS_FINAL',JSON.stringify({passed:errors.length===0,unionSize:[...all].length,errors}));
 if(errors.length)process.exitCode=1;
}
