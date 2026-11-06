#!/usr/bin/env node
"use strict";
/* Extract full character moves to per-character JSON without modifying IDs or browser storage.
   Must run after stage1 split and stage2 image unbundling. TEST ONLY. */
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(process.cwd(),"test-litev1");
const jsdir=path.join(root,"assets/js"),datadir=path.join(root,"assets/data"),out=path.join(datadir,"characters");
fs.mkdirSync(out,{recursive:true});
function findArray(text){
  const m=/\bconst\s+CHARACTERS\s*=\s*\[/.exec(text);
  if(!m)throw Error("Missing CHARACTERS array");
  const start=m.index+m[0].length-1;
  let quote="",comment="",depth=0;
  for(let i=start;i<text.length;i++){
    const c=text[i],n=text[i+1];
    if(comment==="line"){if(c==="\n")comment="";continue;}
    if(comment==="block"){if(c==="*"&&n==="/"){i++;comment="";}continue;}
    if(quote){if(c==="\\"){i++;continue;}if(c===quote)quote="";continue;}
    if(c==='"'||c==="'"||c===String.fromCharCode(96)){quote=c;continue;}
    if(c==="/"&&n==="/"){comment="line";i++;continue;}
    if(c==="/"&&n==="*"){comment="block";i++;continue;}
    if(c==="[")depth++;
    else if(c==="]"){depth--;if(depth===0)return {start,end:i+1};}
  }
  throw Error("CHARACTERS unbalanced");
}
function ptLoadMoves(c){
  if(!c)return Promise.reject(new Error("unknown character"));
  if(c.__ptLoaded)return Promise.resolve(c);
  if(c.__ptPending)return c.__ptPending;
  const url="assets/data/characters/"+encodeURIComponent(c.id)+".json";
  c.__ptPending=fetch(url).then(r=>{
    if(!r.ok)throw new Error("HTTP "+r.status+" "+url);
    return r.json();
  }).then(p=>{
    if(!p||p.id!==c.id||!Array.isArray(p.moves)||p.moves.length!==c.moves.length)
      throw new Error("move payload mismatch: "+c.id);
    for(let i=0;i<p.moves.length;i++){
      const raw=p.moves[i],sk=c.moves[i];
      const k=raw&&typeof raw==="object"&&Number.isInteger(raw.k)?raw.k:i;
      if(k!==sk.k)throw new Error("stable move ID mismatch "+c.id+" "+i);
      const off=raw&&typeof raw==="object"&&Array.isArray(raw.off)?raw.off:[];
      const expected=Array.isArray(sk.off)?sk.off:[];
      if(JSON.stringify(off)!==JSON.stringify(expected))throw new Error("column mismatch "+c.id+" "+i);
    }
    c.moves=p.moves;
    c.__ptLoaded=true;
    return c;
  }).catch(e=>{c.__ptPending=null;throw e;});
  return c.__ptPending;
}
const loader="\n/* PTC-LAZY-START */\n"+ptLoadMoves.toString()+
  '\nwindow.PT_CHAR_DATA={load:ptLoadMoves,loaded:()=>CHARACTERS.filter(c=>c.__ptLoaded).map(c=>c.id),count:()=>CHARACTERS.length};\n/* PTC-LAZY-END */\n';
const pcGuard=[
'  if(c && !c.__ptLoaded) {',
'    const body=document.getElementById("body");',
'    document.getElementById("charName").textContent=c.name;',
'    body.innerHTML=\'<tr><td class="empty" colspan="24">技データを読み込み中…</td></tr>\';',
'    ptLoadMoves(c).then(()=>{ if(current===c.id)renderTable(); }).catch(err=>{',
'      console.error("PROJECT T character load failed",err);',
'      if(current===c.id)body.innerHTML=\'<tr><td class="empty" colspan="24">技データを読み込めませんでした。キャラクターを選び直して再試行してください。</td></tr>\';',
'    });',
'    return;',
'  }'
].join("\n");
const spGuard=[
'  if(C && !C.__ptLoaded) {',
'    const id=C.id; M=[];prog={done:0,total:0};',
'    ptLoadMoves(C).then(()=>{ if(current===id){buildMoves();renderTop();renderList();} }).catch(err=>{',
'      console.error("PROJECT T character load failed",err);',
'      if(current===id){const el=document.getElementById("list");if(el)el.textContent="技データを読み込めませんでした。キャラクターを選び直して再試行してください。";}',
'    });',
'    return;',
'  }'
].join("\n");
const registry={};
const report={schema:3,mode:"test-only",strategy:"per-character JSON; full move data downloaded only on selection",devices:{}};
for(const device of ["pc","sp"]){
  const file=path.join(jsdir,device+"_04.js"),text=fs.readFileSync(file,"utf8");
  const {start,end}=findArray(text);
  const chars=vm.runInNewContext("("+text.slice(start,end)+")",Object.create(null),{timeout:30000});
  if(!Array.isArray(chars)||chars.length<30)throw Error("Unexpected character count for "+device);
  const seen=new Set();
  const skeleton=chars.map(c=>{
    if(!c||typeof c.id!=="string"||!/^[a-z0-9-]+$/.test(c.id)||seen.has(c.id)||!Array.isArray(c.moves))
      throw Error("Unexpected character ID/moves: "+String(c&&c.id));
    seen.add(c.id);
    const d=JSON.parse(JSON.stringify(c));
    d.moves=c.moves.map((raw,i)=>{
      const r={k:raw&&typeof raw==="object"&&Number.isInteger(raw.k)?raw.k:i};
      if(raw&&typeof raw==="object"&&Array.isArray(raw.off)&&raw.off.length)r.off=raw.off;
      return r;
    });
    return d;
  });
  const all=JSON.stringify(chars);
  if(registry.all && registry.all!==all)throw Error("PC/SP CHARACTER payloads differ");
  registry.all=all;
  for(const c of chars){
    const p=path.join(out,c.id+".json"),data=JSON.stringify({id:c.id,moves:c.moves})+"\n";
    if(fs.existsSync(p) && fs.readFileSync(p,"utf8")!==data)throw Error("inconsistent move payload "+c.id);
    fs.writeFileSync(p,data);
    if(JSON.parse(fs.readFileSync(p,"utf8")).moves.length!==c.moves.length)throw Error("Roundtrip failed "+c.id);
  }
  const meta=JSON.stringify(skeleton);
  let next=text.slice(0,start)+meta+text.slice(end);
  const marker=start+meta.length,semi=next.indexOf(";",marker);
  if(semi<marker||semi-marker>12)throw Error("array terminator not found");
  next=next.slice(0,semi+1)+loader+next.slice(semi+1);
  if(device==="pc"){
    const anchor="function renderTable() {\n  const c = CHARACTERS.find(x => x.id === current);";
    if(!next.includes(anchor))throw Error("PC render anchor missing");
    next=next.replace(anchor,anchor+"\n"+pcGuard);
  }else{
    const anchor="function buildMoves() {\n  C = CHARACTERS.find(x => x.id === current);";
    if(!next.includes(anchor))throw Error("SP build anchor missing");
    next=next.replace(anchor,anchor+"\n"+spGuard);
    const list="function renderList(keepClosed) {\n";
    if(!next.includes(list))throw Error("SP list anchor missing");
    next=next.replace(list,list+'  if(C && !C.__ptLoaded){ const el=document.getElementById("list"); if(el)el.textContent="技データを読み込み中…"; return; }\n');
    const top="function renderTop() {\n";
    if(!next.includes(top))throw Error("SP top anchor missing");
    next=next.replace(top,top+'  if(C && !C.__ptLoaded){ const el=document.getElementById("barNum"); if(el)el.textContent="技データを読み込み中…"; }\n');
  }
  fs.writeFileSync(file,next,"utf8");
  report.devices[device]={source_js_bytes:Buffer.byteLength(text),new_js_bytes:Buffer.byteLength(next),data_array_bytes:Buffer.byteLength(text.slice(start,end)),metadata_bytes:Buffer.byteLength(meta),character_count:chars.length};
}
const files=fs.readdirSync(out).filter(x=>x.endsWith(".json"));
report.character_json_files=files.length;
report.character_json_bytes=files.reduce((n,f)=>n+fs.statSync(path.join(out,f)).size,0);
report.preserved=["stable move IDs","off columns","moves order","existing storage keys","bookmark/check progress"];
fs.writeFileSync(path.join(datadir,"character-lazy-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
