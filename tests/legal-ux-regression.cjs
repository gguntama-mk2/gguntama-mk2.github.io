// UX-02 bilingual site navigation checks for privacy and terms on staging branch.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
for (const filename of ['privacy.html','terms.html']) {
 const html=fs.readFileSync(path.join(__dirname,'..',filename),'utf8');
 assert.ok(html.includes('<nav aria-label="サイト内ナビゲーション">'),filename);
 assert.ok(html.includes('.site nav a:focus-visible,.brand:focus-visible{outline:3px solid #8dd7ff;outline-offset:3px}'),filename);
 assert.ok(html.includes('@media(pointer:coarse){.site nav a{min-height:44px}}'),filename);
 for (const en of ['About','Privacy Policy','Terms','Open app']) {
   assert.ok(html.includes('<span lang="en">'+en+'</span>'),filename+' '+en);
 }
 for (const href of ['about.html','privacy.html','terms.html','./']) assert.ok(html.includes('href="'+href+'"'),filename+' '+href);
}
console.log('PASS: UX-02 privacy and terms accessible navigation');
