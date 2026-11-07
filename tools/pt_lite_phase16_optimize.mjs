/** Phase16 reproducible, semantics-conservative JS whitespace minifier.
 * Generates a local TEST COPY only. Does not mutate Git-tracked source files.
 * No identifier mangling, constant folding, dead-code removal, or HTML/CSS changes.
 * License / preserve comments are retained.
 */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {minify} from 'terser';
const ROOT=process.cwd();
const OUT=path.resolve(ROOT,'phase16-performance','optimized-site');
const REPORT=path.resolve(ROOT,'phase16-performance','optimization.json');
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
fs.mkdirSync(OUT,{recursive:true});
const summary={schema:16,mode:'test-copy-only',source:'Phase15 integrated source',
  target:'phase16-performance/optimized-site',
  strategy:'Terser parser/formatter only: no compress, no mangle',
  changed:[],unchanged:0,errors:[]};
for(const name of paths){
  if(!/^(assets\/|icons\/|[^/]+$)/.test(name))continue;
  const src=path.join(ROOT,name),dst=path.join(OUT,name);
  if(!fs.statSync(src).isFile())continue;
  fs.mkdirSync(path.dirname(dst),{recursive:true});
  if(/^assets\/js\/(?:pc|sp)_(?:\d{2}|route-loader)\.js$/.test(name)){
    const original=fs.readFileSync(src,'utf8');
    let output;
    try{
      const result=await minify(original,{
        compress:false,mangle:false,module:false,
        ecma:2020,
        format:{comments:/^!|@license|@preserve|copyright/i}
      });
      if(typeof result.code!=='string')throw Error('No formatted JS output');
      output=result.code;
      if(!output.endsWith('\n'))output+='\n';
    }catch(e){summary.errors.push({path:name,error:String(e)});continue;}
    fs.writeFileSync(dst,output,'utf8');
    const from=Buffer.byteLength(original),to=Buffer.byteLength(output);
    if(to>from)summary.errors.push({path:name,error:'minifier increased bytes'});
    else summary.changed.push({path:name,beforeBytes:from,afterBytes:to,savedBytes:from-to});
  }else{
    fs.copyFileSync(src,dst);
    summary.unchanged++;
  }
}
summary.totalOriginal=summary.changed.reduce((a,x)=>a+x.beforeBytes,0);
summary.totalOptimized=summary.changed.reduce((a,x)=>a+x.afterBytes,0);
summary.totalSaved=summary.changed.reduce((a,x)=>a+x.savedBytes,0);
summary.passed=summary.errors.length===0 && summary.changed.length>=15;
fs.mkdirSync(path.dirname(REPORT),{recursive:true});
fs.writeFileSync(REPORT,JSON.stringify(summary,null,2)+'\n');
console.log('PHASE16_MINIFY',JSON.stringify({
  passed:summary.passed,
  changed:summary.changed.length,
  originalBytes:summary.totalOriginal,
  optimizedBytes:summary.totalOptimized,
  savedBytes:summary.totalSaved,
  top:summary.changed.toSorted((a,b)=>b.savedBytes-a.savedBytes).slice(0,10),
  errors:summary.errors
}).slice(0,8000));
if(!summary.passed)process.exitCode=1;
