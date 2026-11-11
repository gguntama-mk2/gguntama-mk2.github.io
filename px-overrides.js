/* PROJECT T 公開サイト：管理者ページで登録した「背景の差し替え」「ギャラリーの追加画像」を、絵の保管庫（PXS）に上乗せする。
   - 保管庫（HTMLの中の絵）はそのまま。登録された絵だけを、同じ名前（背景＝キャラID、ギャラリー追加＝キャラID~番号）で上書き／追加して見せる
   - 登録の一覧は、開くたびに「変わっていないか」をサーバーに確かめる（古い一覧を使い回さない）。取りに行くのは、ページの読み込みと同時
     （HTML の先頭の PXO_PRE。ここに来るころには、もう届いている）
   - 背景の絵は、届いたものから順にすぐ差し替える（全部そろうのを待たない）。ギャラリーの追加画像は、そのキャラのギャラリーを開いたときに取る
   - 通信に失敗したときは、数回やり直す。それでも取れなければ、何もしない＝いままでの絵のまま
   - 開いたままのタブに戻ってきたとき（30秒以上たっていれば）も、一覧を確かめ直す
   - 画像本体は https://api.project-t-god.com（または手元の確認用サーバー）からだけ読む */
(function () {
  "use strict";
  var S = window.PXS;
  if (!S || window.PXO) return;
  var ID_RE = /^[a-z0-9][a-z0-9-]{0,47}(~[2-9]\d{0,2})?$/, SHA_RE = /^[0-9a-f]{64}$/, MIME_RE = /^image\/(png|jpeg|webp|avif)$/;
  function apiBase() {
    var b = typeof window.PROJECT_T_AUTH_API_BASE === "string" ? window.PROJECT_T_AUTH_API_BASE.trim() : "";
    if (!b) { try { b = localStorage.getItem("project-t-auth-api-base") || ""; } catch (e) { b = ""; } }
    if (!b && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) b = "http://localhost:8000";
    b = b.replace(/\/$/, "");
    if (b === "https://api.project-t-god.com" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(b)) return b;
    return "";
  }
  var base = apiBase();
  var ov = Object.create(null);          // id → { id, sha, mime, bg, pre, p, blob, url }
  var wrap = {
    has: function (id) { return !!ov[id] || S.has(id); },
    url: function (id) { var o = ov[id]; return o && o.url ? o.url : S.url(id); },
    blob: function (id) { var o = ov[id]; return o && o.blob ? o.blob : S.blob(id); },
    bitmap: function (id) { return ov[id] ? bmp(ov[id]).catch(function (e) { return fallback(id, e, "bitmap"); }) : S.bitmap(id); },
    /* ギャラリーは原寸の絵。差し替えた背景は、その絵（登録した絵そのまま）を原寸として出す */
    gallery: function (id) { return ov[id] ? bmp(ov[id]).catch(function (e) { return fallback(id, e, "gallery"); }) : S.gallery(id); },
    /* 登録された絵の「版」（画像の指紋）。同じ名前でも、絵が替わると変わる。使い回しの記憶（キャッシュ）の見分けに使う。保管庫の絵は "" */
    rev: function (id) { return ov[id] ? ov[id].sha : ""; },
    ready: S.ready,
    fallback: S.fallback,
    ids: function () {
      var set = Object.create(null); S.ids().forEach(function (k) { set[k] = 1; }); Object.keys(ov).forEach(function (k) { set[k] = 1; });
      return Object.keys(set);
    }
  };
  function fallback(id, err, kind) {      // 登録された絵が取れなかったとき：サイトに入っている絵があれば、それを出す（空白にしない）
    if (S.has(id)) return S[kind](id);
    throw err;
  }
  function bmp(o) {
    return load(o).then(function () {
      if (typeof createImageBitmap === "function") return createImageBitmap(o.blob).catch(function () { return img(o); });
      return img(o);
    });
  }
  function img(o) { return new Promise(function (ok, ng) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ng(new Error("decode")); }; im.src = o.url; }); }
  window.PXS = Object.freeze(wrap);
  window.PXO = Object.freeze({
    count: function () { return Object.keys(ov).length; },
    ids: function () { return Object.keys(ov); },
    refresh: function () { return base ? refresh() : Promise.resolve(); }
  });
  if (!base) return;

  /* ---- 通信（失敗したら、間をあけて数回やり直す。「ない」「権限がない」などの確定した答えは、やり直さない） ---- */
  function httpError(status) { var e = new Error("HTTP " + status); e.status = status; return e; }
  function retry(fn, times) {
    var n = 0;
    function go() {
      return fn().catch(function (err) {
        var st = err && err.status;
        if (n >= times || (st && st >= 400 && st < 500 && st !== 408 && st !== 429)) throw err;
        n++;
        return new Promise(function (ok) { setTimeout(ok, 600 * n * n); }).then(go);
      });
    }
    return go();
  }
  function fetchManifest() {
    // cache: "no-cache" ＝ 保存してある一覧があっても、使う前に必ずサーバーへ確かめる
    return retry(function () {
      return fetch(base + "/api/v1/px-overrides", { credentials: "omit", cache: "no-cache", headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw httpError(r.status); return r.json(); });
    }, 3);
  }
  function fetchFile(sha) {
    // 画像は指紋（sha）が名前なので、保存してあるものをそのまま使ってよい（中身が変わることがない）
    return retry(function () {
      return fetch(base + "/api/v1/px-overrides/file/" + sha, { credentials: "omit" })
        .then(function (r) { if (!r.ok) throw httpError(r.status); return r.blob(); });
    }, 2);
  }
  function clean(j) {
    if (!j || j.schema !== 1 || !Array.isArray(j.items)) throw new Error("bad manifest");     // 変な返事で、いまの登録を消さない
    return j.items.filter(function (it) { return it && ID_RE.test(String(it.id)) && SHA_RE.test(String(it.sha)) && MIME_RE.test(String(it.mime)); });
  }

  /* ---- 画像本体を取り出す（1回だけ。取れなかったら、次に使うときにもう一度） ---- */
  function load(o) {
    if (o.p) return o.p;
    var pre = o.pre; o.pre = null;
    var first = pre ? pre.catch(function () { return fetchFile(o.sha); }) : fetchFile(o.sha);
    o.p = first.then(function (b) {
      var t = new Blob([b], { type: o.mime }); o.blob = t; o.url = URL.createObjectURL(t); return t;
    });
    o.p.catch(function (err) { o.p = null; if (err && err.status === 404) refreshSoon(); });   // 「ない」＝一覧が古い。一覧をもう一度確かめる
    return o.p;
  }
  function retire(o) { if (o.url) { var u = o.url; setTimeout(function () { try { URL.revokeObjectURL(u); } catch (e) {} }, 8000); } }

  /* ---- 画面への知らせ（まとめて1回） ---- */
  var nt = 0;
  function notify() {
    if (nt) return;
    nt = setTimeout(function () {
      nt = 0;
      try { window.dispatchEvent(new Event("pxs-fallback")); } catch (e) {}      // いま出ている背景を、登録された絵に替える
      try { window.dispatchEvent(new Event("pxo-change")); } catch (e) {}
      try { if (window.GA && typeof window.GA.onChar === "function") window.GA.onChar(); } catch (e) {}      // ギャラリーを開いたままなら描き直す
    }, 0);
  }

  /* ---- 一覧と、いまの状態を突き合わせる（増えた・変わった・消えた） ---- */
  var PRE = window.PXO_PRE && window.PXO_PRE.base === base ? window.PXO_PRE : null;
  function reconcile(items) {
    var want = Object.create(null), changed = false, eager = [];
    items.forEach(function (it) { want[it.id] = it; });
    Object.keys(ov).forEach(function (id) { if (!want[id]) { retire(ov[id]); delete ov[id]; changed = true; } });
    items.forEach(function (it) {
      var cur = ov[it.id];
      if (cur && cur.sha === it.sha) return;
      if (cur) retire(cur);
      var o = ov[it.id] = { id: it.id, sha: it.sha, mime: it.mime, bg: it.id.indexOf("~") < 0, pre: null, p: null, blob: null, url: "" };
      if (PRE && PRE.files && PRE.files[it.sha]) o.pre = PRE.files[it.sha];
      changed = true;
      if (o.bg) eager.push(o);       // 背景は、すぐ使える形にしておく。ギャラリーの追加画像は、開いたときに取る
    });
    if (changed) notify();           // 名前の一覧（枚数）が変わった：いったん知らせる
    return Promise.all(eager.map(function (o) {
      return load(o).then(function () { if (ov[o.id] === o) notify(); }).catch(function () {});
    }));
  }

  /* ---- 確かめ直し ---- */
  var last = 0, busy = null, soon = 0, lastSoon = 0;
  function refresh(first) {
    if (busy) return busy;
    last = Date.now();
    busy = (first || fetchManifest()).then(clean).then(reconcile).catch(function () {}).then(function () { busy = null; });
    return busy;
  }
  function refreshSoon() {        // 「ない」の返事が続いても、10秒に1回だけ
    if (soon || Date.now() - lastSoon < 10000) return;
    soon = setTimeout(function () { soon = 0; lastSoon = Date.now(); refresh(); }, 300);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden && Date.now() - last > 30000) refresh(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) refresh(); });

  // 最初の一覧は、ページの先頭で取りに行ってあるもの（PXO_PRE）を使う。なければ、ここで取る。
  refresh(PRE && PRE.manifest ? PRE.manifest.catch(function () { return fetchManifest(); }) : null);
})();
