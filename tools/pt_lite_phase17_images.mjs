/** PROJECT T Phase17: conservative font/image UX changes in TEST COPY only.
 * Operates on the prebuilt phase16-performance/optimized-site directory.
 * Never changes the committed source or authenticates to real external services.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SITE=path.resolve(process.argv.find(x=>x.startsWith('--site='))?.slice(7)
 ||'phase17-performance/optimized-site');
const OUT=path.resolve('phase17-performance/image-report.json');
const report={phase:17,mode:'test-copy-only',fontDisplayChanges:[],scriptChanges:[],
  imageCandidates:[],imageAccepted:[],totalImageBytesSaved:0,errors:[]};
const read=p=>fs.readFileSync(path.join(SITE,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(SITE,p),s,'utf8');
function replaceExactly(p,needle,replacement,label){
 let s=read(p);
 const parts=s.split(needle);
 if(parts.length!==2)throw Error(label+' anchor count '+(parts.length-1)+' in '+p);
 s=parts.join(replacement);
 write(p,s);
 report.scriptChanges.push({path:p,label});
}
try{
 for(const device of ['pc','sp']){
  const p='assets/css/'+device+'_00.css';
  const original=read(p);
  const needle=/(@font-face\s*\{\s*font-family:\s*"MaruGoKawa";[^}]*?font-display:\s*)block(\s*;[^}]*\})/;
  if(!needle.test(original))throw Error('Cannot safely locate MaruGoKawa face in '+p);
  const changed=original.replace(needle,'$1swap$2');
  if(changed===original)throw Error('Font display not changed in '+p);
  write(p,changed);
  report.fontDisplayChanges.push({path:p,font:'MaruGoKawa',from:'block',to:'swap',
    glyphsChanged:false,fontUrlChanged:false});
 }
 // Asynchronous decoding changes no source pixels, sizes or layout dimensions.
 const pc='assets/js/pc_04.js';
 const pcText=read(pc);
 if(!pcText.includes('im.loading="lazy"'))throw Error('PC already-lazy image anchor changed');
 write(pc,pcText.replace('im.loading="lazy"',
     'im.decoding="async";im.fetchPriority="low";im.loading="lazy"'));
 report.scriptChanges.push({path:pc,label:'offscreen PC character thumbnails decode async / low priority'});
 const sp='assets/js/sp_04.js';
 const spText=read(sp),m=spText.match(/im\.src=c\.img;b\.prepend\(im\)/g)||[];
 if(m.length!==1)throw Error('Mobile thumbnail anchor count '+m.length);
 write(sp,spText.replace('im.src=c.img;b.prepend(im)',
    'im.loading="lazy";im.decoding="async";im.fetchPriority="low";im.src=c.img;b.prepend(im)'));
 report.scriptChanges.push({path:sp,label:'mobile character selector thumbnails lazy and async'});
 // The two large homepage character illustrations use the exact same files.
 // Defer their *requests* while below the fold; do not change the art or CSS.
 for(const device of ['pc','sp']){
  const script='assets/js/'+device+'_10.js';
  const source=read(script);
  const marker='decoding="async" draggable="false"></div>';
  if(source.split(marker).length!==2)throw Error('Hero image tag anchor changed in '+script);
  const updated=source.replace(marker,
   'loading="lazy" decoding="async" fetchpriority="low" draggable="false"></div>');
  write(script,updated);
  report.scriptChanges.push({path:script,label:'lazy load below-fold homepage hero images without changing pixels'});
 }


 // Optional very high-fidelity reencoding of large WebP artwork, accepted
 // only after decoding both originals and outputs into identical RGB(A) dimensions.
 // Icons and tiny sprites are never touched. If no gain, retain exact original.
 const media=path.join(SITE,'assets/media');
 const files=fs.readdirSync(media).filter(x=>x.endsWith('.webp')
    &&fs.statSync(path.join(media,x)).size>28000)
    .sort((a,b)=>fs.statSync(path.join(media,b)).size-fs.statSync(path.join(media,a)).size)
    .slice(0,16);
 for(const name of files){
  const filename=path.join(media,name),source=fs.readFileSync(filename);
  const a=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const originalPixels=a.data;
  const pixelCount=a.info.width*a.info.height*a.info.channels;
  let best=null;
  for(const q of [82,86,90,94]){
   let candidate;
   try{candidate=await sharp(source).webp({quality:q,effort:5}).toBuffer();}
   catch(e){throw Error('webp reencode '+name+': '+String(e));}
   if(candidate.length>=source.length*0.93)continue;
   const b=await sharp(candidate).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   if(b.info.width!==a.info.width||b.info.height!==a.info.height||b.info.channels!==a.info.channels)
    throw Error('dimension or channel mismatch '+name);
   let mse=0,mae=0,outliers=0;
   for(let i=0;i<pixelCount;i++){
    const d=Math.abs(originalPixels[i]-b.data[i]);mse+=d*d;mae+=d;
    if(d>25)outliers++;
   }
   mse/=pixelCount;mae/=pixelCount;
   const psnr=mse===0?99:10*Math.log10(65025/mse);
   const outlierFraction=outliers/pixelCount;
   if(psnr>=45 && mae<=1.3 && outlierFraction<=0.004){
    if(!best||candidate.length<best.buffer.length)
     best={buffer:candidate,q,psnr:+psnr.toFixed(2),mae:+mae.toFixed(3),
       outlierFraction:+outlierFraction.toFixed(5)};
   }
  }
  report.imageCandidates.push({name,bytes:source.length,
    eligible:!!best});
  if(best){
   fs.writeFileSync(filename,best.buffer);
   report.totalImageBytesSaved+=source.length-best.buffer.length;
   report.imageAccepted.push({name,beforeBytes:source.length,
    afterBytes:best.buffer.length,quality:best.q,PSNR_dB:best.psnr,
    meanChannelDifference:best.mae,largeDifferenceFraction:best.outlierFraction,
    width:a.info.width,height:a.info.height});
  }
 }
}catch(e){report.errors.push(String(e?.stack||e));}
report.passed=report.errors.length===0;
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(report,null,2)+'\n');
console.log('PHASE17_IMAGE_FONT_POLICY',JSON.stringify({
 passed:report.passed,fonts:report.fontDisplayChanges,js:report.scriptChanges,
 candidates:report.imageCandidates.length,optimizedImages:report.imageAccepted.length,
 imageSavings:report.totalImageBytesSaved,images:report.imageAccepted,errors:report.errors
}).slice(0,12000));
if(!report.passed)process.exitCode=1;
