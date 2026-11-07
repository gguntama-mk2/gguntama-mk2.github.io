import {chromium} from 'playwright';
import {writeFileSync} from 'node:fs';
const URLS={production:'https://www.project-t-god.com/',preview:'https://project-t-lite-preview-20261107-guntama1205-4982.vercel.app/'};
const devices=['pc','sp'];
const out={created:new Date().toISOString(),runs:{}};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
for(const label of ['production','preview']){
  for(const device of devices){
    const ctx=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},isMobile:device==='sp',serviceWorkers:'block'});
    const page=await ctx.newPage(),bad=[];
    page.on('response',r=>{if(r.status()>=400&&bad.length<20)bad.push({status:r.status(),url:r.url()});});
    try{
      await page.goto(URLS[label]+device+'.html#home',{waitUntil:'domcontentloaded',timeout:130000});
      await page.waitForFunction(()=>typeof window.setPage==='function',null,{timeout:25000});
      await page.evaluate(()=>setPage('sheet'));
      await page.waitForFunction(d=>d==='pc'?document.querySelectorAll('#body tr[data-k]').length>0:document.querySelectorAll('#list .card[data-i]').length>0,device,{timeout:40000});
      await page.waitForTimeout(2500);
      const sheet=await page.evaluate(()=>{
        const layer=document.querySelector('.pxbg'),before=layer?getComputedStyle(layer,'::before'):null;
        let url='';try{url=window.PXS?.url('alisa')||'';}catch(e){url='ERROR '+e.message;}
        return {
          current:(typeof current==='undefined')?'undef':current,
          page:window.pageNow?.(),dataPage:document.documentElement.dataset.page??null,
          dataPx:document.documentElement.dataset.px??null,
          backgroundLayer:!!layer,layerStyle:layer?.getAttribute('style')||'',layerKey:layer?.dataset.k||'',layerOpacity:layer?getComputedStyle(layer).opacity:'',
          computedBg:before?.backgroundImage||'',beforeVisibility:before?.visibility||'',
          pxHas:!!window.PXS?.has('alisa'),pxUrl:url,ptMove:!!window.PTMoveMedia,ptIcons:!!window.PTIcons,
          apiBase:window.PROJECT_T_AUTH_API_BASE?'configured':'disabled',
          movieColumn:document.querySelectorAll('#headRow th.pt-mv').length,
          movieCells:document.querySelectorAll('#body td.pt-mv').length,
          headTitles:[...document.querySelectorAll('#headRow th')].slice(0,6).map(x=>x.textContent.trim())
        };
      });
      const img=await page.evaluate(async()=>{try{const u=window.PXS?.url('alisa');if(!u)return{error:'no image url'};const r=await fetch(u,{cache:'force-cache'});return{url:u,status:r.status,type:r.headers.get('content-type'),length:r.headers.get('content-length')};}catch(e){return{error:String(e)}}});
      await page.evaluate(()=>setPage('gallery'));
      await page.waitForTimeout(2500);
      const gallery=await page.evaluate(()=>({cards:document.querySelectorAll('#gaHost .ga-card').length,rootChildren:document.getElementById('gaHost')?.children.length,loaded:window.PT_ROUTE_ASSETS?.loaded()}));
      out.runs[label+'-'+device]={sheet,img,gallery,errors:bad};
    }catch(e){out.runs[label+'-'+device]={error:String(e),errors:bad};}
    await ctx.close();
    console.log('DIAG',label,device,JSON.stringify(out.runs[label+'-'+device]).slice(0,4500));
  }
}
await browser.close();
writeFileSync('test-litev1/assets/data/phase9-visual-diagnosis.json',JSON.stringify(out,null,2)+'\n');
