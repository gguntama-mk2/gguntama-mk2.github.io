// UX-08 + UX-09 static regression checks on the isolated test branch.
// These are source-level guards, NOT an assistive-tech or browser execution pass.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const get = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const media = get('move-media.js');
const icons = get('admin-move-icons.js');
assert.ok(media.includes('function noImage(reason)'));
assert.ok(media.includes('reason === "thumb-error" ? "サムネイルを読み込めませんでした" : "動画は未登録です"'));
assert.ok(media.includes('p.replaceChildren(noImage("thumb-error"))'));
assert.ok(icons.includes('ui.note.setAttribute("aria-live", state === "error" ? "assertive" : "polite")'));
assert.ok(icons.includes('ui.note.textContent = text'));
assert.ok(icons.includes('ui.note.dataset.state = state || "neutral"'));
console.log('PASS: UX-08 thumbnail fallback / UX-09 icon admin live region');
