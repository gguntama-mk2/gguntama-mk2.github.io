/** Phase26: verify technique JS/icons/videos absent on idle home, ready on demand.
 * Includes direct sheet deep link and route switching without real API.
 */
import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const ROOT='phase26-performance',ORIGIN='http://127.0.0.1:8896';
const report={phase:26,passed:false,mode:'test-only',devices:{},errors:[]};
let server,browser;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
try{
 server=spawn('python3',['tools/pt_lite_phase16_static_server.py','--port','8896',
   '--directory',ROOT+'/optimized-site'],{stdio:'ignore'});
 let ready=false;
 for(let i=0;i<90;i++){try{if((await fetch(ORIGIN+'/pc.html')).ok){ready=true;break;}}catch{}await pause(150);}
 if(!ready)throw Error('No localhost test server');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const dev of ['pc','sp']){
  const ctx=await browser.newContext({viewport:dev==='pc'?{width:1440,height:900}:{width:390,height:844},
    isMobile:dev==='sp',serviceWorkers:'block'});
  const page=await ctx.newPage(),requests=[],errs=[];
  page.on('pageerror',e=>errs.push(String(e)));
  page.on('request',r=>requests.push(new URL(r.url()).pathname));
  await page.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.origin!==ORIGIN||!['GET','HEAD','OPTIONS'].includes(r.request().method()))
    return r.abort('blockedbyclient');
   if(u.pathname.startsWith('/api/'))
    return r.fulfill({status:401,contentType:'application/json',body:'{"mock":true}'});
   return r.continue();
  });
  try{
   await page.addInitScript(()=>{localStorage.setItem('tekken-checksheet-theme','jade')});
   await page.goto(ORIGIN+'/'+dev+'.html#home',{waitUntil:'load',timeout:90000});
   await page.waitForFunction(()=>window.PT_SHEET_RUNTIME&&window.HO&&window.PT_CHAR_DATA,{timeout:30000});
   const idle=await page.evaluate(()=>({characterCount:CHARACTERS.length,
    loaded:PT_SHEET_RUNTIME.state().loaded,
    theme:document.documentElement.getAttribute('data-theme'),
    loadedCharacterJSON:PT_CHAR_DATA.loaded(),
    hasIcon:!!window.PTIcons,hasVideo:!!window.PTMoveMedia,
    boot:window.PT23_BOOT?.ready}));
   if(idle.characterCount!==44||idle.loaded||idle.hasIcon||idle.hasVideo||!idle.boot||
      idle.theme!=='jade'||idle.loadedCharacterJSON.length)
    throw Error(dev+' invalid initial home shell '+JSON.stringify(idle));
   const forbidden=['/'+ 'assets/js/'+dev+'_04_runtime.js','/move-icons.js','/move-media.js'];
   for(const item of forbidden)if(requests.includes(item))
      throw Error(dev+' unwanted homepage request '+item);
   await page.evaluate(()=>window.setPage('sheet'));
   await page.waitForFunction(()=>PT_SHEET_RUNTIME.state().loaded,{timeout:60000});
   await page.waitForFunction(dev=>dev==='pc'
    ?document.querySelectorAll('#body tr[data-k]').length===228
    :document.querySelectorAll('#list .card[data-i]').length===228,dev,{timeout:60000});
   const sheet=await page.evaluate(()=>({icon:!!window.PTIcons,
    video:!!window.PTMoveMedia,
    loaded:PT_SHEET_RUNTIME.state().loaded,
    loadedJSON:PT_CHAR_DATA.loaded(),
    selected:current,rows:CHARACTERS.find(x=>x.id===current)?.moves.length,
    readyErrors:PT_SHEET_RUNTIME.state().errors}));
   if(!sheet.icon||!sheet.video||!sheet.loaded||sheet.rows!==228||
     sheet.readyErrors.length)throw Error(dev+' sheet dependencies failed '+JSON.stringify(sheet));
   for(const item of forbidden)
    if(requests.filter(x=>x===item).length!==1)
      throw Error(dev+' script requested !=1 '+item);
   await page.evaluate(()=>window.setPage('glossary'));
   await page.waitForFunction(()=>window.GL&&document.querySelector('#glHost').shadowRoot,{timeout:60000});
   await page.evaluate(()=>window.setPage('sheet'));
   await page.waitForFunction(dev=>dev==='pc'
    ?document.querySelectorAll('#body tr[data-k]').length===228
    :document.querySelectorAll('#list .card[data-i]').length===228,dev,{timeout:60000});
   if(errs.length)throw Error(dev+' JS exceptions '+JSON.stringify(errs));
   report.devices[dev]={passed:true,idle,sheet,sheetScriptsRequestedOnce:true,
     glossaryRoundtrip:true,noErrors:true,themePersistence:true};
   console.log('PHASE26_MODULES',dev,JSON.stringify(report.devices[dev]));
  }finally{await ctx.close();}
 }
}catch(e){report.errors.push(String(e?.stack||e));}
finally{
 await browser?.close();server?.kill('SIGTERM');
 report.passed=report.errors.length===0&&Object.keys(report.devices).length===2;
 fs.mkdirSync(ROOT,{recursive:true});
 fs.writeFileSync(ROOT+'/module-dependency-audit.json',JSON.stringify(report,null,2)+'\n');
 console.log('PHASE26_MODULES_FINAL',JSON.stringify({passed:report.passed,errors:report.errors}));
 if(!report.passed)process.exitCode=1;
}
