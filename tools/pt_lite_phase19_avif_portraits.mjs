/** Phase19: AVIF fidelity/size audit on the actual 44 portrait assets.
 * Test every selected candidate with decoded pixel comparison. Do not replace
 * WebP portrait images until an equivalent <picture> UI is verified per route.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const root='phase19-performance',site=path.join(root,'optimized-site'),media=path.join(site,'assets/media');
const report={phase:19,mode:'candidate-only',evaluated:[],eligible:[],avoided:[],
 rules:{minRelativeReduction:.10,minPSNR:45,maxMAE:1.1,maxLargeDeltaRatio:.008},errors:[]};
try{
 const charJS=fs.readFileSync('assets/js/pc_04.js','utf8');
 const images=[...new Set([...charJS.matchAll(/"img":"(assets\/media\/[^"]+\.webp)"/g)].map(m=>m[1]))];
 if(images.length!==44)throw Error('Expected 44 portrait images; found '+images.length);
 const ranking=images.map(name=>({name,bytes:fs.statSync(path.join(site,name)).size}))
  .sort((a,b)=>b.bytes-a.bytes).slice(0,18);
 for(const {name,bytes} of ranking){
  const src=fs.readFileSync(path.join(site,name));
  const a=await sharp(src).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let best=null;
  for(const q of [90,96]){
   const b0=await sharp(src).avif({quality:q,effort:4,chromaSubsampling:'4:4:4'}).toBuffer();
   const b=await sharp(b0).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   if(b.info.width!==a.info.width||b.info.height!==a.info.height||
      b.info.channels!==a.info.channels)throw Error('AVIF changed dimensions '+name);
   let sum=0,sumSq=0,large=0;
   for(let i=0;i<b.data.length;i++){
    const d=Math.abs(a.data[i]-b.data[i]);sum+=d;sumSq+=d*d;if(d>25)large++;
   }
   const n=b.data.length,mse=sumSq/n,psnr=mse?10*Math.log10(65025/mse):99;
   const mae=sum/n, outlier=large/n, savings=1-b0.length/src.length;
   const eligible=savings>=.10 && psnr>=45 && mae<=1.1 && outlier<=.008;
   report.evaluated.push({name,quality:q,webpBytes:src.length,avifBytes:b0.length,
    savingsPct:+(100*savings).toFixed(2),PSNR:+psnr.toFixed(2),MAE:+mae.toFixed(3),
    largeDeltaFraction:+outlier.toFixed(5),eligible});
   if(eligible&&(!best||b0.length<best.avifBytes))best={name,quality:q,
    webpBytes:bytes,avifBytes:b0.length,PSNR:+psnr.toFixed(2)};
  }
  if(best)report.eligible.push(best);else report.avoided.push(name);
 }
 report.allImagesUntouched=true;
}catch(e){report.errors.push(String(e?.stack||e))}
report.passed=!report.errors.length;
fs.mkdirSync(root,{recursive:true});
fs.writeFileSync(path.join(root,'portrait-avif-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log('PHASE19_AVIF_PORTRAIT_AUDIT',JSON.stringify({passed:report.passed,
 evaluated:report.evaluated.length,eligible:report.eligible,avoided:report.avoided.length,
 imageFilesUntouched:report.allImagesUntouched,errors:report.errors}).slice(0,5000));
if(!report.passed)process.exitCode=1;
