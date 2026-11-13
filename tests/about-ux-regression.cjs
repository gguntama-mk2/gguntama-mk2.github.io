// PROJECT T staged UX-02 + UX-06 regression (Node built-ins only).
// Static contract checks; NOT a browser, screen-reader or deployment test.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'about.html'), 'utf8');
const occurrences = (value) => html.split(value).length - 1;
assert.ok(html.includes('<html lang="ja">'));
assert.equal(occurrences('<nav aria-label="サイト内ナビゲーション">'), 1);
assert.equal(occurrences('<a '), 17, 'preserve original anchors');
assert.equal(occurrences('<script '), 1, 'preserve original script');
assert.ok(html.includes('.site nav a:focus-visible,.brand:focus-visible{outline:3px solid #8dd7ff;'));
assert.ok(html.includes('@media(pointer:coarse){.site nav a{min-height:44px}}'));
for (const link of ['about.html', 'privacy.html', 'terms.html', './']) {
  assert.ok(html.includes('href="' + link + '"'), 'missing nav URL: ' + link);
}
for (const en of ['About', 'Privacy Policy', 'Terms', 'Open app']) {
  assert.ok(html.includes('<span lang="en">' + en + '</span>'), 'missing en language: ' + en);
}
assert.equal(occurrences('<h2>チェックシートの保存について'), 1);
assert.ok(html.indexOf('<h2>チェックシートの保存について') < html.indexOf('<h2>お問い合わせ'));
for (const text of ['Checklist progress and notes may be stored in your current browser',
  'Clearing site data may remove saved content', 'If a storage warning appears']) {
  assert.ok(html.includes(text), 'missing storage explanation: ' + text);
}
assert.equal(occurrences('<h2>お問い合わせ'), 1);
assert.ok(!html.includes('<nav aria-label="Site">'));
console.log('PASS: about UX-02/UX-06 static contract');
