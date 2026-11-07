/** Phase12 local-only mock API browser contract: no real OAuth, account change or upload. */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
const ROOT='http://127.0.0.1:8768/';
const FILE='phase12-release-audit/phase12-api-mock-browser.json';
const MOCK='http://localhost:8000';
const test={phase:12,mode:'local fake auth/media API only',at:new Date().toISOString(),passed:false,devices:{},failures:[],guarantees:[
  'No traffic is sent to real api.project-t-god.com, Discord, Google, YouTube or production website.',
  'No POST/PATCH/PUT/DELETE request is permitted; OAuth links are inspected without clicking.',
  'Both login and movie APIs are replaced with in-memory mock responses on isolated Chromium contexts.',
  'This does not replace real OAuth, real video encoding/stream playback or authenticated administrator testing.'
]};
let server,browser;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+cQkQAAAAASUVORK5CYII=','base64');
const video={schema:1,characters:{alisa:{'0':{
 move_name:'リードジャブ',
 thumbnail:'/api/v1/move-media/asset/alisa/0/thumb.jpg',
 lightbox:'/api/v1/move-media/asset/alisa/0/poster.jpg',
 video:'/api/v1/move-media/asset/alisa/0/video.mp4',
 fps:60
}}}};
const icons={schema:1,characters:{}};
function check(value,where,msg,extra){if(!value){test.failures.push({where,msg,extra});throw Error(where+': '+msg+' '+JSON.stringify(extra??{}));}}
async function localServer(){
  server=spawn('python3',['-m','http.server','8768','--bind','127.0.0.1','--directory','phase11-pages-package/site'],{stdio:'ignore'});
  for(let n=0;n<80;n++){try{const r=await fetch(ROOT+'pc.html');if(r.ok)return;}catch{}await sleep(200);}
  throw Error('local static server unavailable');
}
async function run(device){
  const ctx=await browser.newContext({viewport:device==='pc'?{width:1440,height:900}:{width:390,height:844},isMobile:device==='sp',
     serviceWorkers:'block',deviceScaleFactor:1});
  const page=await ctx.newPage(),requests=[],failures=[],jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(String(e)));
  await ctx.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    const local=['localhost','127.0.0.1'].includes(url.hostname);
    if(!local){requests.push({blockedExternal:url.origin+url.pathname.slice(0,60)});return route.abort('blockedbyclient');}
    if(!['GET','HEAD','OPTIONS'].includes(req.method())){failures.push('write attempt '+req.method()+' '+url.pathname);return route.fulfill({status:403,contentType:'application/json',body:'{"error":"mock_read_only"}'});}
    if(url.pathname.startsWith('/api/')){
      requests.push({mock: url.pathname,method:req.method()});
      let status=200,data={};
      if(req.method()==='OPTIONS')data={};
      else if(url.pathname==='/api/v1/move-media')data=video;
      else if(url.pathname==='/api/v1/move-icons')data=icons;
      else if(url.pathname==='/api/v1/me'){status=401;data={detail:'Not logged in'};}
      else if(url.pathname.startsWith('/api/v1/move-media/asset/')){
        if(url.pathname.endsWith('/thumb.jpg')||url.pathname.endsWith('/poster.jpg'))return route.fulfill({status:200,contentType:'image/png',headers:{'Access-Control-Allow-Origin':'*'},body:image});
        return route.fulfill({status:206,contentType:'video/mp4',headers:{'Access-Control-Allow-Origin':'*','Accept-Ranges':'bytes'},body:Buffer.from('')});
      }else{status=404;data={detail:'mock_not_implemented'};}
      return route.fulfill({status,contentType:'application/json',headers:{
        'Access-Control-Allow-Origin':ROOT.slice(0,-1),'Access-Control-Allow-Credentials':'true',
        'Access-Control-Allow-Methods':'GET,HEAD,OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type, X-CSRF-Token'
      },body:JSON.stringify(data)});
    }
    return route.continue();
  });
  try{
    await page.goto(ROOT+device+'.html#home',{waitUntil:'load',timeout:70000});
    await page.waitForFunction(()=>typeof window.setPage==='function'&&!!window.PTMoveMedia&&!!window.PTIcons,null,{timeout:30000});
    await page.evaluate(()=>setPage('login'));
    await page.waitForFunction(()=>{
      const r=document.getElementById('lgHost')?.shadowRoot;
      return !!r?.querySelector('#login-discord')?.href.includes('/auth/discord/start')
        && r?.querySelector('#lg-status')?.innerText.includes('未ログイン');
    },null,{timeout:35000});
    const auth=await page.evaluate(()=>{
      const r=document.getElementById('lgHost').shadowRoot;
      const ids=['login-discord','login-google','discord-connect','google-connect','youtube-connect'];
      return {apiBase:window.PROJECT_T_AUTH_API_BASE,links:Object.fromEntries(ids.map(id=>[id,r.getElementById(id).href])),
          status:r.getElementById('lg-status')?.textContent?.trim(),showLogin:!r.getElementById('lg-login-actions').hidden,
          loginDisabled:r.getElementById('login-discord')?.style.pointerEvents==='none'};
    });
    check(auth.showLogin&&!auth.loginDisabled,device,'login links not usable in local mock',auth);
    for(const [id,addr] of Object.entries(auth.links)){
      const u=new URL(addr);
      check(u.origin===MOCK,device,id+' points to unexpected API',addr);
      check(u.pathname.startsWith('/auth/'),device,id+' missing OAuth route',addr);
      check(u.searchParams.get('mode')===(id.startsWith('login')?'login':'link'),device,id+' bad mode',addr);
      check(u.searchParams.get('return_to')===ROOT+device+'.html#login',device,id+' bad return destination',addr);
    }
    await page.evaluate(()=>setPage('sheet'));
    await page.waitForFunction(d=>d==='pc'?document.querySelectorAll('#body tr[data-k]').length===228:document.querySelectorAll('#list .card[data-i]').length===228,device,{timeout:45000});
    try{
      await page.waitForFunction(d=>d==='pc'?!!document.querySelector('#body tr[data-k="0"] button.pt-thumb')
      :!!document.querySelector('#list .card[data-i="0"] button.pt-thumb'),device,{timeout:12000});
    }catch(_){
      const diag=await page.evaluate(d=>{
        const el=document.querySelector(d==='pc'?'#body tr[data-k="0"]':'#list .card[data-i="0"]');
        const nm=el?.querySelector('.nt')?.textContent||'';
        return {rowExists:!!el,name:nm,htmlSnippet:el?.outerHTML.slice(0,800),mockWithActual:window.PTMoveMedia?PTMoveMedia._mediaFor('alisa','0',nm):null,
          mockWithExpected:window.PTMoveMedia?PTMoveMedia._mediaFor('alisa','0','リードジャブ'):null,
          movieColumn:document.querySelectorAll('th.pt-mv').length,movieCells:document.querySelectorAll('td.pt-mv').length,
          current:typeof current!=='undefined'?current:null,
          charId:typeof C!=='undefined'&&C?.id?C.id:null,
          status:window.PTOVR?.status,
          modules:window.PT_ROUTE_ASSETS?.loaded(),scriptBase:window.PROJECT_T_AUTH_API_BASE};
      },device);
      console.log('THUMBNAIL_DIAG',device,JSON.stringify({diag,mockRoutes:requests.filter(x=>x.mock),blockedExternal:requests.filter(x=>x.blockedExternal),jsErrors}).slice(0,7500));
      throw Error('no thumbnail: '+JSON.stringify(diag).slice(0,1500));
    }
    const movie=await page.evaluate(device=>({
      rowCount:device==='pc'?document.querySelectorAll('#body tr[data-k]').length:document.querySelectorAll('#list .card[data-i]').length,
      movieHeader:document.querySelectorAll('#headRow th.pt-mv').length,
      movieCells:document.querySelectorAll('#body td.pt-mv').length,
      thumbnail:document.querySelector(device==='pc'?'#body tr[data-k="0"] button.pt-thumb img':'#list .card[data-i="0"] button.pt-thumb img')?.src,
      mockMedia:!!window.PTMoveMedia,iconModule:!!window.PTIcons,
      previewDisabled:!window.__PROJECT_T_PREVIEW
    }),device);
    check(movie.previewDisabled&&movie.mockMedia&&movie.iconModule,device,'production modules/preview guard mismatch',movie);
    check(movie.thumbnail?.startsWith(MOCK+'/api/v1/move-media/asset/alisa/0/thumb.jpg'),device,'movie URL/ID mapping differs',movie.thumbnail);
    if(device==='pc')check(movie.movieHeader===1&&movie.movieCells===228,device,'movie column count changed',movie);
    await page.locator(device==='pc'?'#body tr[data-k="0"] button.pt-thumb':'#list .card[data-i="0"] button.pt-thumb').click();
    await page.waitForSelector('.pt-lb video',{timeout:10000});
    const lightbox=await page.evaluate(()=>{
      const v=document.querySelector('.pt-lb video');
      return {muted:v.muted,defaultMuted:v.defaultMuted,volume:v.volume,source:v.src,controls:v.controls,
        frameBtns:[...document.querySelectorAll('.pt-lb-ctl button')].map(e=>e.textContent.trim())};
    });
    check(!lightbox.muted&&!lightbox.defaultMuted&&lightbox.volume===0.5,device,'volume defaults incorrect',lightbox);
    check(lightbox.source===MOCK+'/api/v1/move-media/asset/alisa/0/video.mp4',device,'video API path changed',lightbox.source);
    check(lightbox.frameBtns.some(x=>x.includes('1コマ')),device,'frame advance controls missing',lightbox);
    await page.keyboard.press('Escape');
    check(await page.locator('.pt-lb').count()===0,device,'lightbox Escape close broken');
    // Verify the unchanged administrator page is auth-gated; no real user data is accessed.
    await page.goto(ROOT+'admin.html',{waitUntil:'load',timeout:45000});
    await page.waitForTimeout(1200);
    const admin=await page.evaluate(()=>({text:document.querySelector('main')?.innerText?.slice(0,550)||document.body.innerText.slice(0,550),
      isAdmin:!!document.querySelector('#adminPanel'),url:location.pathname}));
    check(/ログインが必要|ログイン|アクセス|認証/.test(admin.text),device,'unauthenticated admin does not show expected gate',admin);
    check(failures.length===0,device,'write requests were attempted',failures);
    check(jsErrors.length===0,device,'JavaScript exceptions',jsErrors);
    test.devices[device]={auth,movie,lightbox,admin,mockRoutes:requests.filter(x=>x.mock),externalRequestsBlocked:requests.filter(x=>x.blockedExternal),jsErrors};
    console.log('DEVICE',device,JSON.stringify({movie,lightbox,login:auth.status,admin:admin.text.slice(0,150),readMockRequests:requests.filter(x=>x.mock).length,blockedExternal:requests.filter(x=>x.blockedExternal).length}).slice(0,2700));
  }finally{await ctx.close();}
}
try{
  await localServer();
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const d of ['pc','sp']){
    try{await run(d);}
    catch(e){test.failures.push({device:d,error:String(e?.stack||e).slice(0,1700)});}
  }
}catch(e){test.failures.push({setup:String(e?.stack||e).slice(0,1800)});}
finally{
  await browser?.close();server?.kill();
  test.passed=test.failures.length===0;
  fs.mkdirSync('phase12-release-audit',{recursive:true});
  fs.writeFileSync(FILE,JSON.stringify(test,null,2)+'\n');
  console.log('PHASE12_MOCK_FINAL',JSON.stringify({passed:test.passed,devices:Object.keys(test.devices),failures:test.failures}).slice(0,4000));
  if(!test.passed)process.exitCode=1;
}