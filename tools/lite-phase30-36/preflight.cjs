'use strict';
/* PROJECT T: test-only, fail-closed compatibility check for Lite Phase30-36.
 * Reads only Git tree metadata, never large HTML contents or production data.
 */
const {execFileSync}=require('node:child_process');
const EXPECTED=Object.freeze({
  staging:'test/project-t-integrated-20261113',
  upstreamPhase36:'a4683054946f4e1773772d9a422eba108adb4193',
  pc:'eb0987f503cb3a4894e5a89b5f5185a76e3751bc',
  sp:'121dd33b18279248674c8286ffb1e5d0374808b3',
  runtime:'assets/js/sp_04_runtime.js'
});
function assess({branch,objects,artifact}){
 const reasons=[];
 if(branch!==EXPECTED.staging)reasons.push('WRONG_BRANCH');
 if(objects['pc.html']!==EXPECTED.pc)reasons.push('PC_SOURCE_MISMATCH');
 if(objects['sp.html']!==EXPECTED.sp)reasons.push('SP_SOURCE_MISMATCH');
 if(!objects[EXPECTED.runtime])reasons.push('GENERATED_RUNTIME_ABSENT');
 if(!artifact||artifact.sourceCommit!==EXPECTED.upstreamPhase36||
   artifact.runtimeBlob!==objects[EXPECTED.runtime]||artifact.independentVerification!==true)
   reasons.push('BUILD_ARTIFACT_NOT_INDEPENDENTLY_VERIFIED');
 return {decision:reasons.length?'HOLD':'REVIEW_ONLY',reasons,
  runtimeOptimizationApplied:false,productionSafe:false};
}
function treeObjects(lines){
 const out=Object.create(null);
 for(const line of lines.split('\n')){
  if(!line)continue;
  const m=line.match(/^\d+ blob ([a-f0-9]{40})\t(.+)$/);
  if(m)out[m[2]]=m[1];
 }
 return out;
}
function inspectRepo(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:2*1024*1024}).trim();
 const branch=git('symbolic-ref','--short','HEAD');
 const rows=git('ls-tree','-r','HEAD','--','pc.html','sp.html',EXPECTED.runtime);
 return assess({branch,objects:treeObjects(rows),artifact:null});
}
if(require.main===module){
 try{const report=inspectRepo();console.log(JSON.stringify(report,null,2));process.exitCode=report.decision==='HOLD'?2:0;}
 catch(err){console.error(JSON.stringify({decision:'HOLD',reason:'INSPECTION_FAILED',detail:String(err.message).slice(0,180)}));process.exitCode=2;}
}
module.exports={EXPECTED,assess,treeObjects,inspectRepo};
