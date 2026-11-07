#!/usr/bin/env node
"use strict";
/* Phase 5 only: keep latest three update summaries in the homepage shell;
 * defer full update data and renderer to the update route. Test branch only.
 */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(process.cwd(),"test-litev1","assets");
const report={schema:5,mode:"test-only",devices:{},notes:"Home update summaries retained; full versions load only on update route"};
const existingReport=path.join(base,"data","phase5-update-optimization.json");
if(fs.existsSync(existingReport) &&
  ["pc","sp"].every(d=>fs.existsSync(path.join(base,"js",d+"_20.js")) &&
  !fs.readFileSync(path.join(base,"js","pc_17.js"),"utf8").includes("/*UPDJS-START*/") &&
  !fs.readFileSync(path.join(base,"js","sp_17.js"),"utf8").includes("/*UPDJS-START*/")){
  console.log("Stage5 full update archive already externalized; keeping verified result.");
  process.exit(0);
}
for(const device of ["pc","sp"]){
  const p=path.join(base,"js",device+"_17.js");
  const text=fs.readFileSync(p,"utf8");
  const start=text.indexOf("/*UPDJS-START*/"),endLabel="/*UPDJS-END*/";
  const end=text.indexOf(endLabel,start);
  if(start<0||end<=start)throw Error(device+": UPDATE section markers missing");
  const update=text.slice(start,end+endLabel.length),core=text.slice(0,start)+text.slice(end+endLabel.length);
  const declare=update.indexOf("const UPDATES = ");
  const term=update.indexOf("})();\n(function () {",declare);
  if(declare<0||term<0)throw Error(device+": compressed update declaration not matched");
  const declaration=update.slice(declare,term+5);
  const full=vm.runInNewContext(declaration+"\nUPDATES",{
    atob:globalThis.atob,TextDecoder:globalThis.TextDecoder,Uint8Array,Uint16Array,ArrayBuffer,console
  },{timeout:20000});
  if(!Array.isArray(full)||full.length<3)throw Error(device+": unexpected update data");
  const n=v=>String(v).split(".").map(x=>Number(x)||0);
  const sorted=full.slice().sort((a,b)=>{
    const x=n(a.v),y=n(b.v);
    for(let k=0;k<3;k++)if((x[k]||0)!==(y[k]||0))return (y[k]||0)-(x[k]||0);
    return 0;
  });
  const brief=sorted.slice(0,3).map(u=>({
    v:u.v,d:u.d||"",
    c:Array.from({length:Array.isArray(u.c)?u.c.length:0},()=>0),
    r:Object.fromEntries(Object.keys(u.r||{}).map(k=>[k,null])),
    g:(u.g||[]).slice()
  }));
  const shell="/* PROJECT T home-only update summaries: exact versions and counts. */\nconst UPDATES = "+JSON.stringify(brief)+";\n";
  fs.writeFileSync(p,shell+core,"utf8");
  let lazy=update.replace(/\bUPDATES\b/g,"PT_FULL_UPDATES");
  fs.writeFileSync(path.join(base,"js",device+"_20.js"),lazy+"\n","utf8");
  const loaderPath=path.join(base,"js",device+"_route-loader.js");
  let loader=fs.readFileSync(loaderPath,"utf8");
  const m=loader.match(/const modules=(\{[^\n]+\});/);
  const apis=loader.match(/const apis=(\{[^\n]+\});/);
  if(!m||!apis)throw Error(device+": route registration missing");
  const routes=JSON.parse(m[1]),targets=vm.runInNewContext("("+apis[1]+")",Object.create(null),{timeout:1000});
  routes.update="20";targets.update="UPD";
  loader=loader.replace(m[0],"const modules="+JSON.stringify(routes)+";");
  loader=loader.replace(apis[0],"const apis="+JSON.stringify(targets)+";");
  const call='if(api&&typeof api.show==="function")api.show();';
  if(!loader.includes(call))throw Error(device+": feature activation hook missing");
  loader=loader.replace(call,call+'if(page==="update"&&window.UPD&&typeof window.UPD.render==="function")window.UPD.render();');
  fs.writeFileSync(loaderPath,loader,"utf8");
  report.devices[device]={
    original_router_and_update_bytes:Buffer.byteLength(text),
    new_router_bytes:fs.statSync(p).size,
    deferred_update_bytes:fs.statSync(path.join(base,"js",device+"_20.js")).size,
    homepage_summary_bytes:Buffer.byteLength(shell),
    total_versions:full.length,brief_versions:brief.map(u=>u.v),
    checksum_first3:brief.map(u=>({v:u.v,date:u.d,common:u.c.length,characters:Object.keys(u.r).length}))
  };
}
fs.writeFileSync(path.join(base,"data","phase5-update-optimization.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
