/* PROJECT T 公開サイト：管理者ページで登録した「背景の差し替え」「ギャラリーの追加画像」を、絵の保管庫（PXS）に上乗せする。
   - 保管庫（HTMLの中の絵）はそのまま。登録された絵だけを、同じ名前（背景＝キャラID、ギャラリー追加＝キャラID~番号）で上書き／追加して見せる
   - 取得できないとき（通信エラーなど）は、何もしない＝いままでの絵のまま
   - 画像本体は https://api.project-t-god.com（または手元の確認用サーバー）からだけ読む */
(function () {
  "use strict";
  var S = window.PXS;
  if (!S || window.PXO) return;
  function apiBase() {
    var b = typeof window.PROJECT_T_AUTH_API_BASE === "string" ? window.PROJECT_T_AUTH_API_BASE.trim() : "";
    if (!b) { try { b = localStorage.getItem("project-t-auth-api-base") || ""; } catch (e) { b = ""; } }
    if (!b && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) b = "http://localhost:8000";
    b = b.replace(/\/$/, "");
    if (b === "https://api.project-t-god.com" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(b)) return b;
    return "";
  }
  var ID_RE = /^[a-z0-9][a-z0-9-]{0,47}(~[2-9]\d{0,2})?$/;
  var ov = Object.create(null);          // id → { blob, url }
  var wrap = {
    has: function (id) { return !!ov[id] || S.has(id); },
    url: function (id) { return ov[id] ? ov[id].url : S.url(id); },
    blob: function (id) { return ov[id] ? ov[id].blob : S.blob(id); },
    bitmap: function (id) { return ov[id] ? bmp(ov[id]) : S.bitmap(id); },
    /* ギャラリーは原寸の絵。差し替えた背景は、その絵（登録した絵そのまま）を原寸として出す */
    gallery: function (id) { return ov[id] ? bmp(ov[id]) : S.gallery(id); },
    ready: S.ready,
    fallback: S.fallback,
    ids: function () {
      var set = Object.create(null); S.ids().forEach(function (k) { set[k] = 1; }); Object.keys(ov).forEach(function (k) { set[k] = 1; });
      return Object.keys(set);
    }
  };
  function bmp(o) {
    if (typeof createImageBitmap === "function") return createImageBitmap(o.blob).catch(function () { return img(o); });
    return img(o);
  }
  function img(o) { return new Promise(function (ok, ng) { var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ng(new Error("decode")); }; im.src = o.url; }); }
  window.PXS = Object.freeze(wrap);
  window.PXO = Object.freeze({ count: function () { return Object.keys(ov).length; }, ids: function () { return Object.keys(ov); } });

  var base = apiBase();
  if (!base) return;
  fetch(base + "/api/v1/px-overrides", { credentials: "omit", headers: { Accept: "application/json" } })
    .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then(function (j) {
      var items = j && j.schema === 1 && Array.isArray(j.items) ? j.items.filter(function (it) { return it && ID_RE.test(String(it.id)) && /^[0-9a-f]{64}$/.test(String(it.sha)) && /^image\/(png|jpeg|webp|avif)$/.test(String(it.mime)); }) : [];
      return Promise.all(items.map(function (it) {
        return fetch(base + "/api/v1/px-overrides/file/" + it.sha, { credentials: "omit" })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); })
          .then(function (b) { var t = new Blob([b], { type: it.mime }); ov[it.id] = { blob: t, url: URL.createObjectURL(t) }; })
          .catch(function () {});
      }));
    })
    .then(function () {
      if (!Object.keys(ov).length) return;
      try { window.dispatchEvent(new Event("pxs-fallback")); } catch (e) {}      // いま出ている背景を、登録された絵に替える
      try { window.dispatchEvent(new Event("pxo-change")); } catch (e) {}
      try { if (window.GA && typeof window.GA.onChar === "function") window.GA.onChar(); } catch (e) {}      // ギャラリーを開いたままなら描き直す
    })
    .catch(function () {});
})();
