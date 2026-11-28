/* PN06 共通部品：厳格な検証・正準化・操作ID。クライアント(管理画面)とサーバー(試験用ストア)の両方が同じ関数を呼ぶ。
   PN07: JSON正準化とUTF-8 SHA-256（同期・隔離試作用）。 */
(function (g) {
  "use strict";
  var MIN_F = 10, MAX_F = 39, MAX_MOVES = 50, STD = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
  var clone = function (x) { return JSON.parse(JSON.stringify(x)); };
  // JSONデータのみ。内部の任意フィールド undefined は JSON と同様に省略する。
  function canon(x) { if (Array.isArray(x)) return "[" + x.map(function (v) { return canon(v === undefined ? null : v); }).join(",") + "]"; if (x && typeof x === "object") return "{" + Object.keys(x).filter(function(k){return x[k] !== undefined;}).sort().map(function (k) { return JSON.stringify(k) + ":" + canon(x[k]); }).join(",") + "}"; return JSON.stringify(x); }
  function jsonData(x) {
    if (x === null || typeof x === "string" || typeof x === "boolean") return true;
    if (typeof x === "number") return Number.isFinite(x) && !Object.is(x, -0);
    if (Array.isArray(x)) return Object.keys(x).length === x.length && Array.from(x).every(jsonData);
    if (!x || typeof x !== "object" || Object.prototype.toString.call(x) !== "[object Object]") return false;
    return Object.keys(x).every(function(k){return jsonData(x[k]);});
  }
  // FIPS 180-4 SHA-256; no network/dependency. Node oracle tested separately.
  var K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function fp(x) {
    var bytes = new TextEncoder().encode(canon(x)), n = bytes.length, buf = new Uint8Array(Math.ceil((n+9)/64)*64); buf.set(bytes); buf[n]=128;
    var d = new DataView(buf.buffer); d.setUint32(buf.length-8, Math.floor(n/0x20000000)); d.setUint32(buf.length-4,(n*8)>>>0);
    var h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19], w=new Uint32Array(64), R=function(v,b){return (v>>>b)|(v<<(32-b));};
    for(var o=0;o<buf.length;o+=64){
      for(var j=0;j<16;j++) w[j]=d.getUint32(o+j*4);
      for(var j=16;j<64;j++){var a=w[j-15],b=w[j-2];w[j]=w[j-16]+(R(a,7)^R(a,18)^(a>>>3))+w[j-7]+(R(b,17)^R(b,19)^(b>>>10));}
      var a=h[0],b=h[1],c=h[2],e=h[3],f=h[4],q=h[5],r=h[6],t=h[7];
      for(var j=0;j<64;j++){var t1=(t+(R(f,6)^R(f,11)^R(f,25))+((f&q)^(~f&r))+K[j]+w[j])|0,t2=((R(a,2)^R(a,13)^R(a,22))+((a&b)^(a&c)^(b&c)))|0;t=r;r=q;q=f;f=(e+t1)|0;e=c;c=b;b=a;a=(t1+t2)|0;}
      var v=[a,b,c,e,f,q,r,t];h=h.map(function(x,i){return (x+v[i])>>>0;});
    }return h.map(function(v){return ("00000000"+v.toString(16)).slice(-8);}).join("");
  }
  function opId() { var a = new Uint8Array(16); (g.crypto || require("node:crypto").webcrypto).getRandomValues(a); return "op-" + Array.prototype.map.call(a, function (v) { return ("0" + v.toString(16)).slice(-2); }).join(""); }
  function isInt(v) { return Number.isSafeInteger(v) && !Object.is(v, -0); }
  function keysOk(o, allowed) { return Object.keys(o).every(function (k) { return allowed.indexOf(k) >= 0; }); }
  function frameOf(id) { return +String(id).split(":")[1]; }
  function stateOf(id) { return String(id).split(":")[0]; }
  function order(slots) { return slots.slice().sort(function (a, b) { return (stateOf(a.slot_id) < stateOf(b.slot_id) ? 1 : stateOf(a.slot_id) > stateOf(b.slot_id) ? -1 : 0) || frameOf(a.slot_id) - frameOf(b.slot_id); }); }
  /* 検証。builtin＝組み込み(NET原本)の枠配列、moves＝その技表。
     errors：保存不可（形式・参照・重複・偽装）。unverified：保存可だが公開不可（原本に無く、管理者確認も無い技）。*/
  function validateSlots(slots, moves, builtin) {
    var errors = [], unverified = [], seen = {}, ks = {}, bmap = {};
    (moves || []).forEach(function (m) { ks[m.k] = m; }); (builtin || []).forEach(function (s) { bmap[s.slot_id] = s; });
    if (!Array.isArray(slots) || !jsonData(slots)) return { errors: ["枠の一覧が配列ではありません"], unverified: [] };
    slots.forEach(function (s, i) {
      if (!s || typeof s !== "object" || Array.isArray(s)) { errors.push("枠のデータが不正です（" + (i + 1) + "番目）"); return; }
      if (typeof s.slot_id !== "string" || !/^(stand|crouch):\d{1,2}$/.test(s.slot_id)) { errors.push("枠の指定が不正です（" + (i + 1) + "番目）"); return; }
      var id = s.slot_id, b = bmap[id], f = frameOf(id);
      if (id !== stateOf(id) + ":" + f) errors.push("枠IDが正準ではありません：" + id);
      var custom = STD.indexOf(f) < 0;
      if ((custom && s.custom !== true) || (!custom && s.custom !== undefined && s.custom !== false)) errors.push("枠属性が不正です：" + id);
      if (!keysOk(s, ["slot_id", "mode", "custom", "moves"])) errors.push("未知の項目があります：" + id);
      if (seen[id]) { errors.push("枠が重複しています：" + id); return; } seen[id] = 1;
      if (!b && !(f >= MIN_F && f <= MAX_F)) errors.push("枠の指定が不正です（" + MIN_F + "〜" + MAX_F + "F）：" + id);
      if (["auto", "manual", "hidden"].indexOf(s.mode) < 0) { errors.push("設定方法が不正です：" + id); return; }
      if (!Array.isArray(s.moves)) { errors.push("技の一覧が不正です：" + id); return; }
      if (s.mode !== "manual") { if (s.moves.length) errors.push("自動・表示なしの枠に技は登録できません：" + id); return; }
      if (!s.moves.length) errors.push("手動の枠に技がありません（表示しない場合は『表示なし』を選びます）：" + id);
      if (s.moves.length > MAX_MOVES) errors.push("技が多すぎます（" + MAX_MOVES + "件まで）：" + id);
      var dup = {}, bk = {}; if (b) b.moves.forEach(function (m) { (bk[m.k] = bk[m.k] || []).push(m); });
      s.moves.forEach(function (m, j) {
        if (!m || typeof m !== "object" || Array.isArray(m) || !keysOk(m, ["k", "raw", "att", "review"])) { errors.push("技の指定が不正です：" + id + " " + (j + 1) + "番目"); return; }
        if (!isInt(m.k)) { errors.push("技IDが不正です（整数のみ）：" + id + " " + (j + 1) + "番目"); return; }
        if (m.att !== undefined && m.att !== true) { errors.push("確認の指定が不正です：" + id); return; }
        var orig = (bk[m.k] || []).find(function (x) { return canon(x.raw) === canon(m.raw) && m.raw !== undefined; });
        if (m.raw !== undefined) { if (!orig) { errors.push("原本に無い行は登録できません（技ID " + m.k + "）：" + id); return; } }
        if (m.k < 0) { if (!orig) errors.push("技表外の行は新しく追加できません：" + id); return; }
        if (!orig && !ks[m.k] && !m.review) { errors.push("存在しない技ID " + m.k + "：" + id); return; }
        var dk = m.k + "|" + (m.raw === undefined ? "" : canon(m.raw)); if (dup[dk]) errors.push("同じ技が重複しています（技ID " + m.k + "）：" + id); dup[dk] = 1;
        if (m.review || (!orig && m.att !== true)) unverified.push({ slot: id, k: m.k, review: m.review });
        if (orig && m.att) errors.push("原本の行に確認の指定は不要です：" + id);
      });
    });
    // 組み込み枠は削除せず auto/hidden/復元で操作する。
    (builtin || []).forEach(function(b){if(!seen[b.slot_id]) errors.push("原本の枠が欠落しています：" + b.slot_id);});
    return { errors: errors, unverified: unverified };
  }
  /* 組み込み(原本)との差だけを上書きとして持つ */
  function slotEq(a, b) { return canon({ mode: a.mode, moves: a.moves.map(function (m) { return { k: m.k, raw: m.raw, att: m.att, review: m.review }; }) }) === canon({ mode: b.mode, moves: b.moves.map(function (m) { return { k: m.k, raw: m.raw, att: m.att, review: m.review }; }) }); }
  function overrides(slots, builtin) { var bm = {}; builtin.forEach(function (s) { bm[s.slot_id] = s; }); var out = []; slots.forEach(function (s) { var b = bm[s.slot_id]; if (b) { if (!slotEq(s, b)) out.push(clone(s)); } else if (!(s.mode === "auto" && !s.moves.length && !s.custom)) out.push(clone(s)); }); return order(out); }
  function applyOverrides(builtin, ovr) { var m = {}; clone(builtin).forEach(function (s) { m[s.slot_id] = s; }); (ovr || []).forEach(function (o) { m[o.slot_id] = clone(o); }); return order(Object.keys(m).map(function (k) { return m[k]; })); }
  function summary(slots) { var m = {}; slots.forEach(function (s) { m[s.slot_id] = s.mode + ":" + s.moves.map(function (x) { return x.k + (x.att ? "*" : ""); }).join(","); }); return m; }
  function diff(a, b) { var A = summary(a), B = summary(b), out = []; Object.keys(Object.assign({}, A, B)).sort().forEach(function (k) { var fallback = STD.indexOf(frameOf(k)) >= 0 ? "auto:" : "未設定"; if ((A[k] || fallback) !== (B[k] || fallback)) out.push({ slot: k, before: A[k] || fallback, after: B[k] || fallback }); }); return out; }
  /* PN-K1: 公開前の保留(HOLD)判定。未決事項を勝手に確定せず、公開だけを止める。下書き保存は妨げない。
     HOLD_AUTO_MEANING  : 原本のある枠を「自動」にした場合の意味が未決(解除は独立承認証拠を検証したサーバーが policy.auto_meaning===true を渡した場合のみ)。
     HOLD_MIXED_RESOLVER: NET原本が無いキャラに手動の枠を入れると他枠の自動結果が消える問題が未解決(解除は実解決器との一致証拠つきの検証済み承認で policy.mixed_resolver===true の場合のみ)。 */
  function publishHolds(slots, builtin, policy) {
    policy = policy || {}; var holds = [], bm = {}; (builtin || []).forEach(function (b) { bm[b.slot_id] = 1; });
    var au = (slots || []).filter(function (s) { return s.mode === "auto" && bm[s.slot_id]; }).map(function (s) { return s.slot_id; });
    if (au.length && policy.auto_meaning !== true) holds.push({ code: "HOLD_AUTO_MEANING", slots: au });
    var man = (slots || []).filter(function (s) { return s.mode === "manual" || s.mode === "hidden"; }).map(function (s) { return s.slot_id; });
    if (!(builtin || []).length && man.length && policy.mixed_resolver !== true) holds.push({ code: "HOLD_MIXED_RESOLVER", slots: man });
    return holds;
  }
  var HOLD_TEXT = { HOLD_AUTO_MEANING: "既存の枠を「自動」にした場合の意味が未決のため、公開できません（下書きは保存できます）", HOLD_MIXED_RESOLVER: "NET未設定キャラに手動の枠を入れると他の枠の自動結果が消える問題が未解決のため、公開できません（下書きは保存できます）" };
  g.PTCore = { publishHolds: publishHolds, HOLD_TEXT: HOLD_TEXT, MIN_F: MIN_F, MAX_F: MAX_F, MAX_MOVES: MAX_MOVES, STD: STD, clone: clone, canon: canon, fp: fp, jsonData: jsonData, opId: opId, validateSlots: validateSlots, overrides: overrides, applyOverrides: applyOverrides, order: order, diff: diff, frameOf: frameOf, stateOf: stateOf };
  if (typeof module !== "undefined") module.exports = g.PTCore;
})(typeof window !== "undefined" ? window : globalThis);
