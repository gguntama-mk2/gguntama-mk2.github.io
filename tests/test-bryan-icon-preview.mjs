#!/usr/bin/env node
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const source=fs.readFileSync(new URL("../move-icons.js",import.meta.url),"utf8");
const fixture=JSON.parse(fs.readFileSync(new URL("../test-data/bryan-icon-candidates-v2.json",import.meta.url),"utf8"));
assert.equal(fixture.moves.length,20);
assert.equal(fixture.moves.reduce((n,r)=>n+r.icons.length,0),22);
function boot(query) {
 const created=[];
 const doc={
  currentScript:{src:"https://example.invalid/move-icons.js"},
  head:{appendChild(){}},documentElement:{appendChild(){}},
  getElementById(){return null},
  createElement(tag){const e={tag,style:{},appendChild(x){this.child=x}};created.push(e);return e},
  querySelectorAll(){return []}
 };
 const window={};
 const ctx={window,document:doc,location:{search:query,hostname:"example.invalid"},URL,console,fetch(){return Promise.reject(new Error("offline"))},setTimeout,Promise};
 vm.runInNewContext(source,ctx);
 return {p:window.PTIcons,created};
}
const active=boot("?pticons=bryan-test");
assert.equal(active.p.testPreview().enabled,true);
const inactive=boot("");
assert.equal(inactive.p.testPreview().enabled,false);
for(const r of fixture.moves) {
 const id=String(r.k);
 assert.equal(Number.isInteger(r.k),true);
 assert.equal(r.character_id,undefined);
 assert.ok(Array.isArray(r.icons));
}
assert.ok(!fixture.moves.some(r=>[212,213,214].includes(r.k)));
assert.ok(source.includes("key(row[0]) !== key(raw.name)"));
assert.ok(source.includes("merged.length <= MAX_ICONS"));
assert.ok(source.includes("strip._candidate = candidateIcons(charId, raw)"));
console.log("PASS: 20 Bryan candidates / 22 icons; opt-in guarded; excluded throws; safe additive merge");
