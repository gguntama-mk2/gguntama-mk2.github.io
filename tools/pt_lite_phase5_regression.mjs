import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const root='http://127.0.0.1:8767';
const output='test-litev1/assets/data/phase5-regression-report.json';
const server=spawn('python3',['-m','http.server','8767','--bind','127.0.0.1'],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const report={schema:5,mode:'test-only',at:new Date().toISOString(),passed:false,network:{},storage:{},errors:[],notes:[]};
let browser;
function group(url){
  const path=new URL(url).pathname;
  if(/\/assets\/data\/characters\//.test(path))return 'character_json';
  if(/\/assets\/pxstore\//.test(path))return 'pxstore_images';
  if(/\/assets\/media\//.test(path))return 'other_media';
  if(/\/assets\/js\//.test(path))return 'javascript';
  if(/\/assets\/css\//.test(path))return 'css';
  if(/\.html$/.test(path))return 'html';
  return 'other';
}
async function collect(device){
  const context=await browser.newContext({viewport:device==='pc'?{width:1366,height:768}:{width:390,height:844},isMobile:device==='sp',deviceScaleFactor:1});
  const page=await context.newPage();
  const rows=[],bad=[],jsErrors=[];
  page.on('pageerror',e=>jsErrors.push(e.message));
  page.on('response',res=>{
    if(!res.url().startsWith(root+'/'))return;
    const h=res.headers(),size=Number(h['content-length']);
    rows.push({path:new URL(res.url()).pathname,status:res.status(),bytes:Number.isFinite(size)?size:0,kind:group(res.url())});
    if(res.status()>=400)bad.push({path:new URL(res.url()).pathname,status:res.status()});
  });
  await page.goto(root+'/test-litev1/'+device+'.html#home',{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>window.PT_ROUTE_ASSETS&&window.PT_CHAR_DATA,{timeout:25000});
  // Observe the first view with no user interaction or scrolling. External URLs are excluded.
  await wait(2500);
  const totals={};
  for(const x of rows){totals[x.kind]=(totals[x.kind]||0)+x.bytes;}
  const total=rows.reduce((n,x)=>n+x.bytes,0);
  const info={
    total_local_bytes:total,under_1mb:total<1000000,
    groups:totals,request_count:rows.length,
    loaded_character_ids:await page.evaluate(()=>window.PT_CHAR_DATA.loaded()),
    loaded_feature_codes:await page.evaluate(()=>window.PT_ROUTE_ASSETS.loaded()),
    top_responses:[...rows].sort((a,b)=>b.bytes-a.bytes).slice(0,14),
    bad_responses:bad,page_errors:jsErrors
  };
  console.log('NETWORK',device,JSON.stringify(info));
  assert.equal(bad.length,0,device+' local HTTP errors');
  assert.equal(jsErrors.length,0,device+' page errors');
  await context.close();
  return info;
}
async function stateCompatibility(){
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const base=root+'/test-litev1/';
  await page.goto(base+'pc.html#sheet',{waitUntil:'load',timeout:45000});
  await page.waitForFunction(()=>window.PT_CHAR_DATA&&window.PT_CHAR_DATA.loaded().includes('alisa'),{timeout:30000});
  const chosen=await page.evaluate(()=>{
    const c=CHARACTERS.find(c=>c.id==='alisa');
    if(!c)throw Error('alisa missing');
    const idx=c.moves.findIndex((raw,i)=>!(raw.off||[]).includes('startup'));
    if(idx<0)throw Error('No eligible move');
    const raw=c.moves[idx],k=Number.isInteger(raw.k)?raw.k:idx;
    return {id:c.id,k,moveName:raw.name,idx};
  });
  const checkKey=chosen.id+':'+chosen.k+':startup',memoKey=chosen.id+':'+chosen.k+':memo',reviewKey=chosen.id+':'+chosen.k;
  const legacy={
    'tekken-checksheet-v1':JSON.stringify({[checkKey]:true}),
    'tekken-checksheet-memo-v1':JSON.stringify({[memoKey]:'保存互換テスト・あいうえお'}),
    'tekken-checksheet-review-v1':JSON.stringify({[reviewKey]:true}),
    'tekken-checksheet-last':'alisa'
  };
  await page.evaluate(values=>{for(const [k,v] of Object.entries(values))localStorage.setItem(k,v);},legacy);
  async function validate(device){
    await page.goto(base+device+'.html#sheet',{waitUntil:'load',timeout:45000});
    await page.waitForFunction(()=>window.PT_CHAR_DATA&&window.PT_CHAR_DATA.loaded().includes('alisa'),{timeout:30000});
    await page.waitForFunction(({device,k})=>device==='pc'
      ? !!document.querySelector('#body tr[data-k="'+k+'"] input[type="checkbox"]')
      : !!document.querySelector('#list .card[data-i="'+k+'"]'),{device,k:chosen.k},{timeout:30000});
    const actual=await page.evaluate(({checkKey,memoKey,reviewKey})=>{
      const state=JSON.parse(localStorage.getItem('tekken-checksheet-v1')||'{}');
      const memos=JSON.parse(localStorage.getItem('tekken-checksheet-memo-v1')||'{}');
      const reviews=JSON.parse(localStorage.getItem('tekken-checksheet-review-v1')||'{}');
      return {check:state[checkKey],memo:memos[memoKey],review:reviews[reviewKey],last:localStorage.getItem('tekken-checksheet-last')};
    },{checkKey,memoKey,reviewKey});
    assert.equal(actual.check,true,'legacy checkbox state');
    assert.equal(actual.memo,'保存互換テスト・あいうえお','legacy note');
    assert.equal(actual.review,true,'legacy bookmark');
    assert.equal(actual.last,'alisa','legacy selection');
    const visible=await page.evaluate(({device,k})=>{
      if(device==='pc'){
        const tr=document.querySelector('#body tr[data-k="'+k+'"]');
        return {checked:Array.from(tr.querySelectorAll('input[type=checkbox]')).some(x=>x.checked),reviewClass:tr.classList.contains('rv')};
      }
      const card=document.querySelector('#list .card[data-i="'+k+'"]');
      const progress=document.getElementById('barNum')?.textContent||'';
      return {card:!!card,progress};
    },{device,k:chosen.k});
    assert.equal(device==='pc'?visible.checked:visible.card,true,'UI state visible');
    if(device==='pc')assert.equal(visible.reviewClass,true,'UI bookmark present');
    console.log('STORAGE',device,JSON.stringify({actual,visible,chosen}));
    return {actual,visible};
  }
  const pc1=await validate('pc'),sp=await validate('sp'),pc2=await validate('pc');
  // Real UI input must still save to the historical key. Use current selected row/checkbox.
  const result=await page.evaluate(({k,key})=>{
    const row=document.querySelector('#body tr[data-k="'+k+'"]');
    const check=Array.from(row.querySelectorAll('input[type=checkbox]')).find(e=>e.checked);
    if(!check)throw Error('No checked checkbox');
    check.click();
    return {after:JSON.parse(localStorage.getItem('tekken-checksheet-v1')||'{}')[key],checked:check.checked};
  },{k:chosen.k,key:checkKey});
  assert.notEqual(result.after,true,'checkbox input must update saved state');
  assert.equal(result.checked,false,'checkbox DOM must change');
  await page.reload({waitUntil:'load',timeout:45000});
  await page.waitForFunction(k=>!!document.querySelector('#body tr[data-k="'+k+'"] input[type=checkbox]'),chosen.k,{timeout:30000});
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem('tekken-checksheet-v1')||'{}')[key],checkKey),result.after);
  assert.equal(errors.length,0,'JS runtime errors on state compatibility pages');
  await context.close();
  return {chosen,pc1,sp,pc2,clickedAndPersisted:true,errors};
}
try{
  await wait(1100);
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  for(const device of ['pc','sp'])report.network[device]=await collect(device);
  report.storage=await stateCompatibility();
  report.passed=true;
}catch(e){
  report.errors.push(String(e&&e.stack||e));
  console.error('PHASE5 FAIL',e);
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  server.kill();
  fs.mkdirSync('test-litev1/assets/data',{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
  console.log('PHASE5',JSON.stringify({passed:report.passed,network:Object.fromEntries(Object.entries(report.network).map(([k,v])=>[k,{total:v.total_local_bytes,under_1mb:v.under_1mb}])),errors:report.errors}));
}
