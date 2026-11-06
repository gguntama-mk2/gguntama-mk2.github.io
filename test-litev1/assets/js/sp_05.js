
/*PTOVR-START*/
/* 技チェックシートの「公開データ」を反映する（管理者が管理画面で「公開」した技の一覧）。
   ・サーバーの GET /api/v1/checksheet/overrides から、公開済みのキャラだけを取り、そのキャラの技の一覧を丸ごと入れ替える。
   ・つながらない・遅い（6秒）・形が違うときは、何もしない（埋め込んだ元のデータのまま表示。閲覧は止めない）。
   ・受け取った技は、決まった項目だけを、決まった型だけで作り直して使う（表示は textContent なので HTML は実行されない。さらに念のため）。
   ・入れ替えたら、技の固定ID（ks）を作り直し、一覧と表を描き直す。
   ・管理画面のプレビュー用：URL に ?ptbase=1 があれば通信しない（元のデータを読むため）。?ptpreview=1 なら、管理画面（同じサイトの親ページ）からのデータで一時的に入れ替える（保存しない）。 */
(function () {
  "use strict";
  var TIMEOUT_MS = 6000, MAX_CHARS = 20000000, MAX_MOVES = 800;
  var q = location.search || "";
  var PREVIEW = /[?&]ptpreview=1(&|$)/.test(q), NOFETCH = PREVIEW || /[?&]ptbase=1(&|$)/.test(q);
  var st = window.PTOVR = { status: "idle", applied: [], reason: "" };
  var str = function (v, n) { return typeof v === "string" && v.length <= n ? v : null; };
  function cleanMove(m) {
    if (!m || typeof m !== "object" || !Number.isInteger(m.k) || m.k < 0) return null;
    var name = str(m.name, 200); if (!name) return null;
    var o = { k: m.k, name: name }, v;
    if ((v = str(m.y, 400)) !== null && m.y !== undefined) o.y = v;
    if (m.a && typeof m.a === "object" && !Array.isArray(m.a)) {
      var a = {}; Object.keys(m.a).forEach(function (c) { var s = str(m.a[c], 1000); if (s !== null && /^[a-z][A-Za-z0-9_]{0,23}$/.test(c)) a[c] = s; });
      o.a = a;
    }
    if (Array.isArray(m.off)) o.off = m.off.filter(function (c) { return typeof c === "string" && /^[a-z][A-Za-z0-9_]{0,23}$/.test(c); }).slice(0, 40);
    if ((v = str(m.t, 200)) !== null && m.t !== undefined) o.t = v;
    if ((v = str(m.tg, 600)) !== null && m.tg !== undefined) o.tg = v;
    if ((v = str(m.ss, 120)) !== null && m.ss !== undefined) o.ss = v;
    return o;
  }
  function cleanMoves(list) {
    if (!Array.isArray(list) || list.length > MAX_MOVES) return null;
    var out = [], seen = {};
    for (var i = 0; i < list.length; i++) { var m = cleanMove(list[i]); if (!m || seen[m.k]) return null; seen[m.k] = 1; out.push(m); }
    return out;
  }
  function setMoves(c, moves) {
    c.moves = moves; c.ks = new Set();
    moves.forEach(function (raw, idx) { c.ks.add(typeof moveId === "function" ? moveId(raw, idx) : raw.k); });
  }
  function rerender() {
    try {
      if (typeof renderChars === "function") renderChars();
      if (typeof renderTable === "function") renderTable();                                   // PC版
      else if (typeof buildMoves === "function") { buildMoves(); renderTop(); renderList(); }   // スマホ版
    } catch (e) { console.error("[PTOVR] 描き直しに失敗しました", e); }
  }
  function apply(payload) {
    var chars = payload && payload.characters;
    if (!chars || typeof chars !== "object" || typeof CHARACTERS === "undefined") { st.status = "bad-shape"; return; }
    var applied = [];
    CHARACTERS.forEach(function (c) {
      if (!Object.prototype.hasOwnProperty.call(chars, c.id)) return;
      var o = chars[c.id], moves = o && cleanMoves(o.moves);
      if (!moves) { console.warn("[PTOVR] 形が正しくないので、" + c.id + " は元のデータのままにします"); return; }
      if (JSON.stringify(moves) === JSON.stringify(c.moves)) return;
      setMoves(c, moves); applied.push(c.id);
    });
    st.applied = applied; st.status = "ok";
    if (applied.length) rerender();
  }
  function whenReady(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

  if (PREVIEW) {
    // 管理画面のプレビュー：親ページ（同じ origin）からの {type:"pt-preview", char, moves} だけ受け取り、その場で入れ替える（保存しない）
    window.addEventListener("message", function (ev) {
      if (ev.source !== window.parent || ev.origin !== location.origin) return;
      var d = ev.data; if (!d || d.type !== "pt-preview" || typeof d.char !== "string") return;
      var c = (window.CHARACTERS || CHARACTERS).find(function (x) { return x.id === d.char; }), moves = cleanMoves(d.moves);
      if (!c || !moves) return;
      setMoves(c, moves);
      if (typeof selectChar === "function") selectChar(c.id);                                  // スマホ版
      else { current = c.id; if (typeof hidePop === "function") hidePop(); }                    // PC版（保存はしない）
      rerender();
      st.status = "preview"; st.applied = [c.id];
    });
    return;
  }
  if (NOFETCH) { st.status = "disabled"; return; }

  var base = window.PROJECT_T_AUTH_API_BASE || "";       // 本番は https://api.project-t-god.com。それ以外（ローカル）は同じサイトの中
  var ctl = window.AbortController ? new AbortController() : null;
  var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT_MS);
  var req;
  try {
    req = fetch(base + "/api/v1/checksheet/overrides", { credentials: "omit", signal: ctl ? ctl.signal : undefined, headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (t) { if (t.length > MAX_CHARS) throw new Error("too large"); return JSON.parse(t); });
  } catch (e) { st.status = "skipped"; st.reason = String(e); return; }
  req.then(function (payload) { clearTimeout(timer); whenReady(function () { try { apply(payload); } catch (e) { st.status = "failed"; st.reason = String(e); console.error("[PTOVR]", e); } }); })
     .catch(function (e) { clearTimeout(timer); st.status = "failed"; st.reason = String(e && e.message || e); });   // 失敗しても何もしない（元のデータのまま）
})();
/*PTOVR-END*/
