/** Stage27 statistically honest paired repeat benchmark. No prod access.
 * Three A/B rounds under the same Chromium CDP profiles. Reports medians,
 * individual rounds, separated first rendered rows, fonts ready and settled
 * lazy-image finish instead of hiding variability in a single total.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
const ROOT='phase29-performance',RUNS=3;
const summary={phase:29,mode:'3 paired CDP localhost runs per 3 profiles/devices, including x4 CPU',
 passed:false,rounds:[],comparisons:{},failures:[],notes:[
  'Each row is measured on a disposable local server; no production CDN involved.',
  'firstRowsMs means all default character cards/rows are in the DOM, not all offscreen lazy images settled.',
  'fontReadyMs and settledMs are separate so image scheduling does not masquerade as core speed.',
  'One-time variance is not a statistically significant population estimate.',
  'Main-thread counters come from Chromium Performance.getMetrics from sheet navigation to 228-card/row DOM completion.'
 ]};
function median(v){const x=v.slice().sort((a,b)=>a-b);return x[Math.floor(x.length/2)];}
async function execute(site,out){
 const args=['tools/pt_lite_phase29_perf.mjs','--site='+site,'--out='+out];
 const ok=await new Promise((resolve,reject)=>{
  const p=spawn('node',args,{stdio:['ignore','pipe','pipe']});
  let err='',last='';
  p.stdout.on('data',b=>{last+=b.toString();if(last.length>20000)last=last.slice(-20000)});
  p.stderr.on('data',b=>{err+=b.toString();if(err.length>16000)err=err.slice(-16000)});
  p.on('error',reject);
  p.on('exit',code=>resolve({code,err,last}));
 });
 if(ok.code!==0)throw Error('Browser benchmark failed '+site+' '+ok.code+' '+ok.err.slice(-2500)+' '+ok.last.slice(-2500));
 const r=JSON.parse(fs.readFileSync(out,'utf8'));
 if(!r.passed)throw Error('Benchmark report incomplete '+out+JSON.stringify(r.failures));
 return r;
}
try{
 fs.mkdirSync(path.join(ROOT,'repeats'),{recursive:true});
 for(let i=0;i<RUNS;i++){
  const aPath=path.join(ROOT,'repeats','before-'+(i+1)+'.json'),
        bPath=path.join(ROOT,'repeats','after-'+(i+1)+'.json');
  const a=await execute(path.join(ROOT,'baseline-site'),aPath);
  const b=await execute(path.join(ROOT,'optimized-site'),bPath);
  summary.rounds.push({index:i+1,before:aPath,after:bPath});
  console.log('PHASE29_REPEATED_ROUND',i+1,'of',RUNS);
 }
 for(const profile of ['desktop-fast','mobile-4g-simulated','low-end-cpu4x-4g']){
  summary.comparisons[profile]={};
  for(const dev of ['pc','sp']){
   const before=[],after=[];
   for(let i=1;i<=RUNS;i++){
    for(const [label,list] of [['before',before],['after',after]]){
     const raw=JSON.parse(fs.readFileSync(path.join(ROOT,'repeats',label+'-'+i+'.json'),'utf8'));
     const obj=raw.devices[profile][dev];
     list.push({
      homeBytes:obj.coldHome.network.transferBytes,
      homeMs:obj.coldHome.elapsedMs,
      sheetBytes:obj.sheet.network.transferBytes,
      sheetImageBytes:obj.sheet.network.bytesByType.Image||0,
      sheetNonImageBytes:obj.sheet.network.transferBytes-(obj.sheet.network.bytesByType.Image||0),
      firstRowsMs:obj.sheet.firstRowsMs,
      fontReadyMs:obj.sheet.fontReadyMs,
      settledMs:obj.sheet.elapsedMs,
      cacheWarmHomeBytes:obj.warmHome.network.transferBytes,
      mainThread:obj.sheet.mainThread||{},
      appStats:obj.sheet.appStats?.stage26||null
     });
    }
   }
   const measures=['homeBytes','homeMs','sheetBytes','sheetImageBytes','sheetNonImageBytes',
                   'firstRowsMs','fontReadyMs','settledMs','cacheWarmHomeBytes'];
   const stats={rounds:RUNS,before,after,median:{},winningRounds:{},mainThread:{}};
   for(const key of measures){
    const a=median(before.map(x=>x[key])),b=median(after.map(x=>x[key]));
    stats.median[key]={before:a,after:b,diff:b-a,saved:a-b};
    stats.winningRounds[key]=before.filter((x,i)=>after[i][key]<x[key]).length;
   }
   for(const key of ['LayoutCount','RecalcStyleCount','ScriptDuration','TaskDuration','LayoutDuration','RecalcStyleDuration']){
     const prev=before.map(x=>x.mainThread[key]).filter(v=>Number.isFinite(v));
     const next=after.map(x=>x.mainThread[key]).filter(v=>Number.isFinite(v));
     if(prev.length===RUNS&&next.length===RUNS){
       const a=median(prev),b=median(next);
       stats.mainThread[key]={before:a,after:b,saved:+(a-b).toFixed(6),
         winningRounds:before.filter((x,i)=>after[i].mainThread[key]<x.mainThread[key]).length};
     }
   }
   if(stats.median.homeBytes.after>stats.median.homeBytes.before+1100)
    throw Error(profile+'/'+dev+' home bytes regression >1100');
   if(stats.median.sheetNonImageBytes.after>stats.median.sheetNonImageBytes.before+1100)
    throw Error(profile+'/'+dev+' sheet non-image transfer regression >1100');
   if(after.some(x=>x.cacheWarmHomeBytes>1500))
    throw Error(profile+'/'+dev+' warm-cache regression');
   // The real performance effect is exposed as median and win counts,
   // never convert one negative sample into a success claim.
   summary.comparisons[profile][dev]=stats;
   console.log('PHASE29_REPEAT_MEDIANS',profile,dev,JSON.stringify({medians:stats.median,mainThread:stats.mainThread,
     appStats:after.map(x=>x.appStats)}));
  }
 }
 summary.passed=true;
}catch(e){summary.failures.push(String(e?.stack||e));}
fs.writeFileSync(path.join(ROOT,'paired-repeat-report.json'),JSON.stringify(summary,null,2)+'\n');
console.log('PHASE29_REPEATED_FINAL',JSON.stringify({passed:summary.passed,rounds:summary.rounds.length,
 failures:summary.failures}).slice(0,8000));
if(!summary.passed)process.exitCode=1;
