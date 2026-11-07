/** Phase18 test-only AVIF optimization: preserve WebP fallbacks, verify pixels.
 * Only adopt a new AVIF if substantially smaller at very high visual fidelity.
 * Unaccepted candidates are never emitted, so art remains unchanged.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const ROOT=path.resolve('phase18-performance');
const SITE=path.join(ROOT,'optimized-site');
const media=path.join(SITE,'assets/media');
const HEROES=['356e885b36a307552b9b.webp','6bdfaa0c26f6f7e4588c.webp'];
const report={phase:18,mode:'test-copy-only',testTargets:HEROES,encodings:[],
  adopted:[],avoided:[],errors:[],savedBytesForImages:0,feature:'picture/source AVIF with original WebP fallback'};
function pixelMetrics(a,b){
 if(a.info.width!==b.info.width||a.info.height!==b.info.height||
    a.info.channels!==b.info.channels)throw Error('Decoded dimensions differ');
 let total=0,total2=0,out=0;const n=a.data.length;
 for(let i=0;i<n;i++){
  const d=Math.abs(a.data[i]-b.data[i]);total+=d;total2+=d*d;if(d>25)out++;
 }
 const mse=total2/n;
 return {psnr:mse===0?99:+(10*Math.log10(65025/mse)).toFixed(2),
  mae:+(total/n).toFixed(3),fractionOver25:+(out/n).toFixed(6)};
}
try{
 const map={};
 for(const name of HEROES){
  const f=path.join(media,name),src=fs.readFileSync(f);
  const input=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let best=null;
  for(const q of [84,90,94,98]){
   const avif=await sharp(src).avif({quality:q,effort:5,chromaSubsampling:'4:4:4'}).toBuffer();
   const decoded=await sharp(avif).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const metrics=pixelMetrics(input,decoded);
   const significant=avif.length<=src.length*0.90;
   const acceptable=significant&&metrics.psnr>=45&&metrics.mae<=1.1&&metrics.fractionOver25<=0.008;
   const row={name,quality:q,originalBytes:src.length,avifBytes:avif.length,
     ...metrics,acceptable};
   report.encodings.push(row);
   if(acceptable&&(!best||avif.length<best.bytes.length))best={bytes:avif,row};
  }
  if(!best){report.avoided.push({name,reason:'No AVIF saved >=10% at PSNR >=45dB and strict pixel fidelity'});continue;}
  const avifName='pt18-'+name.slice(0,-5)+'-'+best.row.quality+'.avif';
  const avifPath=path.join(media,avifName);
  fs.writeFileSync(avifPath,best.bytes);
  map['assets/media/'+name]='assets/media/'+avifName;
  report.savedBytesForImages+=src.length-best.bytes.length;
  report.adopted.push({...best.row,output:'assets/media/'+avifName});
 }
 // Use native picture with original WebP fallback; preserve existing img CSS.
 if(report.adopted.length){
  for(const dev of ['pc','sp']){
   const file=path.join(SITE,'assets/js/'+dev+'_10.js');
   const text=fs.readFileSync(file,'utf8');
   const needle=/const chrHtml=\(k,img\)=>[^;]*;/;
   const match=text.match(needle);
   if(!match)throw Error('Character-hero renderer not located for '+dev);
   const first=JSON.stringify('<div class="chr" aria-hidden="true">');
   const open=JSON.stringify('<picture style="display:contents"><source type="image/avif" srcset="');
   const mid=JSON.stringify('">');
   const img0=JSON.stringify('<img src="');
   const img1=JSON.stringify('" alt="" loading="lazy" decoding="async" fetchpriority="low" draggable="false">');
   const close=JSON.stringify('</picture>');
   const end=JSON.stringify('</div>');
   const replacement='const PT18_AVIF='+JSON.stringify(map)+';'+
    'const chrHtml=(k,img)=>{const avif=PT18_AVIF[img];return '+
    first+'+(avif?'+open+'+avif+'+mid+':"")+'+
    img0+'+img+'+img1+'+(avif?'+close+':"")+'+end+';};';
   fs.writeFileSync(file,text.replace(needle,replacement));
  }
 }
}catch(e){report.errors.push(String(e?.stack||e));}
report.passed=report.errors.length===0;
fs.mkdirSync(ROOT,{recursive:true});
fs.writeFileSync(path.join(ROOT,'avif-report.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE18_AVIF',JSON.stringify({
 passed:report.passed,adopted:report.adopted,savedBytes:report.savedBytesForImages,
 avoided:report.avoided,errors:report.errors
}).slice(0,9000));
if(!report.passed)process.exitCode=1;
