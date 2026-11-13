// PROJECT T staged UX-02 + UX-06 regression (Node built-ins only).
// Static contract tests: not an end-to-end browser, screen-reader or deploy proof.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '..', 'about.html'), 'utf8');
const count = (re) => (html.match(re) || []).length;
assert.match(html, /<html lang="ja">/);
assert.equal(count(/<nav aria-label="サイト内ナビゲーション">/g), 1);
assert.equal(count(/<a\\b/g), 17, 'preserve the original anchor count');
assert.equal(count(/<script\\b/g), 1, 'do not change the original script count');
assert.match(html, /\\.site nav a:focus-visible,\\.brand:focus-visible\\{outline:3px solid #8dd7ff;/);
assert.match(html, /@media\\(pointer:coarse\\)\\{\\.site nav a\\{min-height:44px\\}\\}/);
for (const link of ['about.html', 'privacy.html', 'terms.html', './']) {
  assert.ok(html.includes('href="' + link + '"'), 'nav link missing: ' + link);
}
for (const en of ['About', 'Privacy Policy', 'Terms', 'Open app']) {
  assert.ok(html.includes('<span lang="en">' + en + '</span>'), 'English language span missing: ' + en);
}
assert.equal(count(/<h2>チェックシートの保存について/g), 1);
assert.ok(html.indexOf('<h2>チェックシートの保存について') < html.indexOf('<h2>お問い合わせ'));
assert.match(html, /Checklist progress and notes may be stored in your current browser/);
assert.match(html, /Clearing site data may remove saved content/);
assert.match(html, /If a storage warning appears/);
assert.equal(count(/<h2>お問い合わせ/g), 1);
assert.ok(!html.includes('<nav aria-label="Site">'));
console.log('PASS: staged about.html UX-02/UX-06 static regression');
