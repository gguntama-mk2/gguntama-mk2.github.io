// Static regression for UX-03 on the choice screen. No browser/JS runtime claim.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
assert.ok(html.includes('a.btn:focus-visible { border-color: var(--gold); outline: 3px solid #8dd7ff; outline-offset: 3px; }'));
assert.ok(html.includes('small { display: block; margin-top: 28px; opacity: .85; line-height: 1.7; }'));
assert.ok(html.includes('別の端末やブラウザでは同じ保存内容が表示されない場合があります。'));
assert.ok(html.includes('サイトデータを削除すると、保存した内容が消える場合があります。'));
assert.ok(html.includes('id="goPc" href="pc.html"'));
assert.ok(html.includes('id="goSp" href="sp.html"'));
assert.ok(html.includes('location.replace((phone ? "sp.html" : "pc.html") + location.hash)'));
console.log('PASS: UX-03 index focus and storage guidance');
