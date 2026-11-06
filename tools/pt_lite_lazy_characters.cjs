#!/usr/bin/env node
/** Stage3 test: split moves per-character, preserve every ID/k. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.resolve(__dirname,"../test-litev1");
const dir=path.join(base,"assets/data/characters");
fs.mkdirSync(dir,{recursive:true});
const manifest={};let expectedOrder;
const loader=String.raw`
/* PROJECT T lazy move loader; keep character ids and move k immutable. */
const PT_CHAR_MOVE_ROOT = "assets/data/characters/";
function ptLoadMoves(id) {
  const c=CHARACTERS.find(x=>x.id===id);
  if(!c)return Promise.reject(new Error("Unknown character: "+id));
  if(c.__ptLoaded)return Promise.resolve(c);
  if(!c.__ptPromise){
    c.__ptPromise=fetch(PT_CHAR_MOVE_ROOT+encodeURIComponent(id)+".json")
     .then(r=>{if(!r.ok)throw new Error("Move fetch HTTP "+r.status);return r.json();})
     .then(moves=>{
       if(!Array.isArray(moves))throw new Error("Invalid moves: "+id);
       const ks=new Set();
       for(let i=0;i<moves.length;i++){
         const m=moves[i],k=m&&typeof m==="object"&&Number.isInteger(m.k)?m.k:i;
         if(ks.has(k))throw new Error("Duplicate k="+k+" for "+id);
         ks.add(k);
       }
       c.moves=moves;c.ks=ks;c.__ptLoaded=true;return c;
     }).catch(err=>{c.__ptPromise=null;console.error("PROJECT T move load failed",id,err);throw err;});
  }
  return c.__ptPromise;
}
window.PT_LOAD_CHAR=ptLoadMoves;
`;
const pcPatch=String.raw`function renderTable() {
  const __ptId=current,__ptChar=CHARACTERS.find(x=>x.id===__ptId);
  if(__ptChar&&!__ptChar.__ptLoaded){
    ptLoadMoves(__ptId).then(()=>{
      if(current===__ptId){renderTable();renderChars();}
    }).catch(()=>{});
  }
`;
const spPatch=String.raw`function buildMoves() {
  const __ptId=current,__ptChar=CHARACTERS.find(x=>x.id===__ptId);
  if(__ptChar&&!__ptChar.__ptLoaded){
    ptLoadMoves(__ptId).then(()=>{
      if(current===__ptId){buildMoves();renderTop();renderList();renderChars();}
    }).catch(()=>{});
  }
`;
function extract(device){
 const file=path.join(base,"assets/js",device+"_04.js");
 let source=fs.readFileSync(file,"utf8");
 const start=source.indexOf("const CHARACTERS = [");
 if(start<0)throw Error(device+": no CHARACTERS");
 const open=source.indexOf("[",start);
 const tail=/^\];/gm;tail.lastIndex=open;
 const end=tail.exec(source);if(!end)throw Error("unterminated CHARACTERS");
 const arrayText=source.slice(open,end.index+1);
 const rows=vm.runInNewContext("("+arrayText+")",Object.create(null),{timeout:15000});
 if(!Array.isArray(rows)||rows.length<40)throw Error("unexpected count");
 const ids=[];
 const skinny=rows.map(c=>{
   if(!/^[a-z0-9-]+$/.test(c.id)||!Array.isArray(c.moves))throw Error("invalid character");
   const moves=JSON.parse(JSON.stringify(c.moves)),seen=new Set();
   for(let i=0;i<moves.length;i++){
     const m=moves[i],k=m&&typeof m==="object"&&Number.isInteger(m.k)?m.k:i;
     if(seen.has(k))throw Error("duplicate move ID "+c.id+" "+k);
     seen.add(k);
   }
   const text=JSON.stringify(moves),bytes=Buffer.byteLength(text);
   fs.writeFileSync(path.join(dir,c.id+".json"),text,"utf8");
   if(manifest[c.id]){
     if(manifest[c.id].moves!==moves.length||manifest[c.id].bytes!==bytes)throw Error("PC/SP mismatch: "+c.id);
   } else manifest[c.id]={moves:moves.length,bytes};
   ids.push(c.id);
   const small=JSON.parse(JSON.stringify(c));small.moves=[];return small;
 });
 if(expectedOrder&&JSON.stringify(ids)!==JSON.stringify(expectedOrder))throw Error("character order mismatch");
 expectedOrder=ids;
 source=source.slice(0,start)+"const CHARACTERS = "+JSON.stringify(skinny)+";\n"+loader+source.slice(end.index+2);
 if(device==="pc"){
   if(!source.includes("function renderTable() {"))throw Error("no PC renderTable");
   source=source.replace("function renderTable() {",pcPatch);
 }else{
   if(!source.includes("function buildMoves() {"))throw Error("no SP buildMoves");
   source=source.replace("function buildMoves() {",spPatch);
 }
 fs.writeFileSync(file,source,"utf8");
 return {code_bytes:Buffer.byteLength(source),characters:ids.length};
}
const pc=extract("pc"),sp=extract("sp");
const report={schema:3,mode:"test-only",pc,sp,character_count:Object.keys(manifest).length,characters:manifest,
 note:"Experimental. Cross-character consumers require verification."};
fs.writeFileSync(path.join(base,"assets/data/character-lazy-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({pc,sp,character_count:report.character_count,move_count:Object.values(manifest).reduce((n,c)=>n+c.moves,0)},null,2));
