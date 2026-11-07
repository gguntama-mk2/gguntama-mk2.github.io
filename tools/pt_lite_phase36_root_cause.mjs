/** Phase36 CPU/root-cause diagnostics from 3 paired 6-profile CDP runs.
 * All values observational; renderMinusFit is NOT an exact DOM construction time.
 */
import fs from 'node:fs';
const ROOT='phase36-performance';
const source=JSON.parse(fs.readFileSync(ROOT+'/paired-repeat-report.json','utf8'));
const out={phase:36,passed:false,rounds:source.rounds?.length||0,profiles:{},
 notes:[
 'fitTimeMs and lastRunMs are existing Phase26 instrumentation; lastRunMs includes more than card construction.',
 'renderRemainderMs=lastRunMs-fitTimeMs is a residual containing DOM creation, app logic and scheduling—not isolated DOM time.',
 'CDP LayoutDuration and RecalcStyleDuration are browser metrics across full sheet load; they cannot identify individual forced-layout callsites.',
 'No claim of forced-layout root cause is made without a Chrome trace/callsite profile.',
 'Pairwise medians are environment-specific, three samples each; inspect all rounds before accepting speed claims.'
 ]};
try{
 if(!source.passed||out.rounds<3)throw Error('Incomplete A/B samples');
 for(const profile of ['desktop-fast','mobile-4g-simulated','low-end-cpu4x-4g']){
  out.profiles[profile]={};
  for(const device of ['pc','sp']){
   const s=source.comparisons?.[profile]?.[device];
   if(!s||s.rounds<3)throw Error('Missing profile '+profile+'/'+device);
   function describe(arr){
    const v=arr.map(x=>x.appStats).filter(x=>x&&Number.isFinite(x.fitTimeMs)&&Number.isFinite(x.lastRunMs));
    const median=xs=>xs.slice().sort((a,b)=>a-b)[Math.floor(xs.length/2)];
    return {samples:v.length,fitTimeMs:v.map(x=>+x.fitTimeMs.toFixed(3)),
      renderRunMs:v.map(x=>+x.lastRunMs.toFixed(3)),
      renderRemainderMs:v.map(x=>+(x.lastRunMs-x.fitTimeMs).toFixed(3)),
      medianFitTimeMs:v.length?median(v.map(x=>x.fitTimeMs)):null,
      medianRemainderMs:v.length?median(v.map(x=>x.lastRunMs-x.fitTimeMs)):null};
   }
   const before=describe(s.before),after=describe(s.after);
   out.profiles[profile][device]={before,after,mainThread:s.mainThread,firstRows:s.median.firstRowsMs,
      fitMedianDeltaMs:before.medianFitTimeMs!==null&&after.medianFitTimeMs!==null
       ?+(after.medianFitTimeMs-before.medianFitTimeMs).toFixed(3):null};
   if(device==='sp'&&(before.samples!==3||after.samples!==3))throw Error('Missing fit instrumentation '+profile+'/'+device);
  }
 }
 out.passed=true;
}catch(e){out.error=String(e.stack||e)}
fs.writeFileSync(ROOT+'/root-cause-profile.json',JSON.stringify(out,null,2)+'\n');
console.log('PHASE36_ROOT_CAUSE_PROFILE',JSON.stringify({passed:out.passed,profiles:out.profiles['low-end-cpu4x-4g'],error:out.error}).slice(0,7000));
if(!out.passed)process.exitCode=1;
