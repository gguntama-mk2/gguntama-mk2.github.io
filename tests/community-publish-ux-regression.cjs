// Staging-only static regression: accessible community publication load errors.
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const js=fs.readFileSync(path.join(__dirname,'..','admin-community-publish.js'),'utf8');
assert.ok(js.includes('h("p", { class: "pt-pb-err", role: "alert", text: S.err })'));
assert.ok(js.includes('card.appendChild(btn("読み直す", load))'));
assert.ok(js.includes('if (S.err)'));
assert.ok(js.includes('ui.note = h("p", { role: "status", "aria-live": "polite" })'));
console.log('PASS: community publication alert and retry affordance');
