'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {EXPECTED,assess,treeObjects}=require('../tools/lite-phase30-36/preflight.cjs');
const staging={branch:EXPECTED.staging,objects:{'pc.html':'de1a841d8fc4924c7a3007af877e40e39418c564','sp.html':'83988ae9a8df5f3a487686ed5bc5d5544bb7d44e'},artifact:null};
const source={branch:EXPECTED.staging,objects:{'pc.html':EXPECTED.pc,'sp.html':EXPECTED.sp,[EXPECTED.runtime]:'a'.repeat(40)},artifact:{sourceCommit:EXPECTED.upstreamPhase36,runtimeBlob:'a'.repeat(40),independentVerification:true}};
test('actual staging metadata is HOLD due to divergent pc/sp and no generated runtime',()=>{
 const r=assess(staging);assert.equal(r.decision,'HOLD');
 for(const code of ['PC_SOURCE_MISMATCH','SP_SOURCE_MISMATCH','GENERATED_RUNTIME_ABSENT','BUILD_ARTIFACT_NOT_INDEPENDENTLY_VERIFIED'])assert.ok(r.reasons.includes(code));
});
test('main is never eligible',()=>assert.ok(assess({...source,branch:'main'}).reasons.includes('WRONG_BRANCH')));
test('even hypothetically matching sources only authorize REVIEW, not execution',()=>{
 const r=assess(source);assert.equal(r.decision,'REVIEW_ONLY');assert.equal(r.runtimeOptimizationApplied,false);assert.equal(r.productionSafe,false);
});
test('missing independent attestation fails closed',()=>assert.ok(assess({...source,artifact:null}).reasons.includes('BUILD_ARTIFACT_NOT_INDEPENDENTLY_VERIFIED')));
test('wrong generated runtime hash fails closed',()=>assert.equal(assess({...source,artifact:{...source.artifact,runtimeBlob:'b'.repeat(40)}}).decision,'HOLD'));
test('upstream mismatch fails closed',()=>assert.equal(assess({...source,artifact:{...source.artifact,sourceCommit:'0'.repeat(40)}}).decision,'HOLD'));
test('read git ls-tree metadata without reading large HTML',()=>{
 const s='100644 blob '+EXPECTED.pc+'\tpc.html\n100644 blob '+EXPECTED.sp+'\tsp.html\n';
 const r=treeObjects(s);assert.equal(r['pc.html'],EXPECTED.pc);assert.equal(r['sp.html'],EXPECTED.sp);
});
test('malformed tree rows are ignored and never counted',()=>assert.equal(Object.keys(treeObjects('README\n100644 blob INVALID\tpc.html')).length,0));
