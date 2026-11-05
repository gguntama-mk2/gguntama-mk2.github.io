/* PROJECT T：技のアイコン（技表の「技コマンドの欄」の右はしに出す小さな印）。
   - アイコン画像は icons/ にある（黒枠＝ふつうの印／白枠＝ハードウォールブレイク・ハードフロアブレイク）
   - どの技にどのアイコンを出すかは、①下の決まり（自動）と ②管理者ページで設定した内容（API：/api/v1/move-icons）の2つ。
     ②が登録されている技は ② を優先する（「なし」も登録できる）。取得できないときは ① だけで表示する。
   - 技のデータ・チェック状態・メモは触らない。コマンドの表示（コマンドを表示：ON/OFF）に合わせて出し入れする */
(function () {
  "use strict";
  if (window.PTIcons) return;
  var PREVIEW = /[?&]ptpreview=1(&|$)/.test(location.search);   // 管理画面の編集プレビュー（iframe）では、表には出さない

  /* 並び順＝画面に出る順。label はマウスを乗せたときの説明 */
  var CATALOG = [
    ["tornado", "トルネード", "tornado.webp"],
    ["powercrush", "パワークラッシュ", "powercrush.webp"],
    ["heatengage", "ヒートエンゲージ（ヒートダッシュ・ヒート発動時・ヒート発動投げ・ヒートバースト）", "heatengage.webp"],
    ["recoverable", "リカバリアブルダメージ", "recoverable.webp"],
    ["homing", "ホーミング", "homing.webp"],
    ["forcedcrouch", "強制しゃがみ", "forcedcrouch.webp"],
    ["floorgimmick", "フロアギミック発動", "floorgimmick.webp"],
    ["wallbreak", "ウォールブレイク", "wallbreak.webp"],
    ["hardwallbreak", "ハードウォールブレイク", "hardwallbreak.webp"],
    ["wallblast", "ウォールブラスト", "wallblast.webp"],
    ["wallbound", "ウォールバウンド", "wallbound.webp"],
    ["balconybreak", "バルコニーブレイク", "balconybreak.webp"],
    ["floorbreak", "フロアブレイク", "floorbreak.webp"],
    ["hardfloorbreak", "ハードフロアブレイク", "hardfloorbreak.webp"],
    ["floorblast", "フロアブラスト", "floorblast.webp"]
  ];
  var BY_ID = {}; CATALOG.forEach(function (c, i) { BY_ID[c[0]] = { id: c[0], label: c[1], file: c[2], order: i }; });
  var MAX_ICONS = 6;

  /* 回復可能体力を削る技（キャラ別）。名前が完全に同じ技だけ。レイジアーツは全部（タグ「レイジアーツ」）なので、ここには書かない */
  var RECOVERABLE = {
    "dragunov": ["セレーションカッター～打撃投げ", "イナーシャルキック", "イナーシャルキック(ガード投げ)", "イナーシャルキック(ガード投げ・ヒート中)", "ステップインマンティス(近距離)", "マンティスヒール(近距離)", "マンティスヒール(遠距離)", "インテグラルレイヴ・クラッチ", "ブリザードストレッチスリーパー"],
    "kuma": ["ブラッドサッカー"],
    "nina": ["震通掌破", "キスショットペネトレイター", "サディスティックキューピット", "居反肘落とし脇固め", "居反肘落とし脇固め(青)", "膝十字固め(左側面)", "飛びつき前方回転逆三角絞め", "裏裸絞め", "裏閂鷹羽絞め", "裏閂鷹羽絞め(青)", "捨逆脇固め", "捨逆脇固め(青)", "首捻顔固め", "首捻顔固め(青)", "股裂き腕十字固め", "股裂き腕十字固め(青)", "背負い逆十字固め", "背負い逆十字固め(青)", "前転腕十字固め", "前転腕十字固め(青)", "膝十字固め(B)", "膝十字固め(B)(青)", "回転アキレス腱固め", "回転アキレス腱固め(青)"],
    "shaheen": ["ダストストーム", "ホーネット", "ホーネット(ヒート状態)", "ホーネット(青)", "フラーシュ・ホーネット", "アクセルスピナー", "サイレントキル", "シャラク・サイレントキル"],
    "lidia": ["天穿星流れ(レベル3)"],
    "heihachi": ["究極多聞伐折羅", "究極轟ぱちき", "究極轟ぱちき～雷神呼法"]
  };
  var RECSET = {};
  Object.keys(RECOVERABLE).forEach(function (c) { RECSET[c] = {}; RECOVERABLE[c].forEach(function (n) { RECSET[c][key(n)] = 1; }); });
  function key(v) { return String(v || "").normalize("NFKC").replace(/\s+/g, ""); }

  /* ① 自動の決まり。tagIds＝その技に付くタグ（pc・tn・he・hb・ra など） */
  function auto(charId, raw, tagIds) {
    var o = (raw && typeof raw === "object") ? raw : { name: String(raw || "") };
    var n = String(o.name || ""), c = String((o.a && o.a.command) || "");
    var t = {}; (tagIds || []).forEach(function (x) { t[x] = 1; });
    var out = [];
    if (t.tn) out.push("tornado");
    if (t.pc) out.push("powercrush");
    // ヒートが発動する技：ヒート発動時／ヒート発動可能状態の技・ヒートバースト・ヒート発動投げ・ヒートが発動していない状態からのヒートダッシュ
    // （同じ名前でも「(ヒート発動時)」などが付いていない技・ヒートが発動したあとの技（～ヒートダッシュ(ヒート中)、(ヒートダッシュ)）には付けない）
    if (t.he || t.hb || /^ヒート発動可能状態/.test(c) || (/～ヒートダッシュ$/.test(n) && !/^ヒート[中＆]/.test(c))) out.push("heatengage");
    // ホーミング：技表の「ホーミング性能」が「あり」の技（技のタグ hm。側面投げ・背面投げ等は元データでホーミングなし）
    if (t.hm) out.push("homing");
    if (t.ra || (RECSET[charId] && RECSET[charId][key(n)])) out.push("recoverable");
    return out;
  }

  /* ② 管理者ページで設定した内容 */
  var overrides = null, loading = null, loadedAt = 0;
  function apiBase() {
    var b = typeof window.PROJECT_T_AUTH_API_BASE === "string" ? window.PROJECT_T_AUTH_API_BASE.trim() : "";
    if (!b) { try { b = localStorage.getItem("project-t-auth-api-base") || ""; } catch (e) { b = ""; } }
    if (!b && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) b = "http://localhost:8000";
    b = b.replace(/\/$/, "");
    if (b === "https://api.project-t-god.com" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(b)) return b;
    return "";
  }
  function clean(list) {
    var seen = {}, out = [];
    (Array.isArray(list) ? list : []).forEach(function (id) { if (typeof id === "string" && BY_ID[id] && !seen[id]) { seen[id] = 1; out.push(id); } });
    out.sort(function (a, b) { return BY_ID[a].order - BY_ID[b].order; });
    return out.slice(0, MAX_ICONS);
  }
  function load() {
    if (loading) return loading;
    if (overrides && Date.now() - loadedAt < 300000) return Promise.resolve(overrides);
    var base = apiBase(); if (!base) return Promise.resolve(null);
    loading = fetch(base + "/api/v1/move-icons", { credentials: "omit", headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { overrides = j && j.schema === 1 && j.characters && typeof j.characters === "object" ? j.characters : {}; loadedAt = Date.now(); return overrides; })
      .catch(function () { if (!overrides) { overrides = {}; loadedAt = Date.now(); } return overrides; })   // 取得できなくても、自動の決まりだけで表示する
      .then(function (m) { loading = null; refresh(); return m; });
    return loading;
  }
  var CHAR_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
  function iconsFor(charId, k, autoList) {
    var row = overrides && CHAR_RE.test(String(charId)) && overrides[charId] && Object.prototype.hasOwnProperty.call(overrides[charId], String(k)) ? overrides[charId][String(k)] : null;
    return row ? clean(row) : clean(autoList);
  }

  /* 見た目 */
  var CSS = [
    ".pt-ic{display:none}",
    ".head .nm.pt-has-ic{position:relative}",
    ".pt-has-ic>.pt-ic{display:flex;position:absolute;right:10px;bottom:calc(6px + (var(--cmd-h,23px) - 22px) / 2);gap:2px;z-index:1}",
    ".head .nm.pt-has-ic>.pt-ic{right:2px;bottom:calc((var(--cmd-h,1.375rem) - 22px) / 2)}",
    ".pt-ic img{display:block;width:22px;height:22px;border-radius:4px;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;pointer-events:auto}",
    ".mcmd.off+.pt-ic,.cmdtxt.off+.pt-ic{visibility:hidden}",     /* コマンドが隠れているときは、アイコンも隠す */
    ".nm.pt-has-ic>.mcmd{margin-right:var(--pt-ic-w,0)}",
    ".head .nm.pt-has-ic>.cmdtxt{margin-right:var(--pt-ic-w,0)}"
  ].join("\n");
  function ensureStyle() {
    if (document.getElementById("pt-ic-style")) return;
    var st = document.createElement("style"); st.id = "pt-ic-style"; st.textContent = CSS; (document.head || document.documentElement).appendChild(st);
  }
  var assetBase = (function () { try { var s = document.currentScript && document.currentScript.src; return s ? s.replace(/[^\/]*$/, "") + "icons/" : "icons/"; } catch (e) { return "icons/"; } })();

  function paint(strip) {
    var host = strip.parentNode; if (!host) return;
    var ids = iconsFor(strip.dataset.c, strip.dataset.k, strip._auto || []);
    var sig = ids.join(",");
    if (strip._sig === sig) return;
    strip._sig = sig;
    while (strip.firstChild) strip.removeChild(strip.firstChild);
    ids.forEach(function (id) {
      var m = BY_ID[id], img = document.createElement("img");
      img.src = assetBase + m.file; img.alt = m.label; img.title = m.label; img.width = 22; img.height = 22; img.draggable = false; img.decoding = "async";
      strip.appendChild(img);
    });
    host.classList.toggle("pt-has-ic", ids.length > 0);
    if (ids.length) host.style.setProperty("--pt-ic-w", (ids.length * 24 + 4) + "px"); else host.style.removeProperty("--pt-ic-w");
  }
  var refreshQueued = false;
  function refresh() {
    var strips = document.querySelectorAll(".pt-ic[data-c]");
    var changed = false;
    strips.forEach(function (s) { var before = s._sig; paint(s); if (s._sig !== before) changed = true; });
    if (changed) { try { if (typeof window.scheduleFit === "function") window.scheduleFit(); } catch (e) {} }
  }

  /* 技表・カードに差し込む。host＝技名の欄(.nm)、cmdEl＝コマンドの要素、raw＝技のデータ、tagIds＝その技のタグ */
  function attach(host, cmdEl, charId, raw, tagIds) {
    try {
      if (PREVIEW || !host || !cmdEl || !raw || typeof raw !== "object" || raw.k === undefined) return;
      ensureStyle();
      var strip = document.createElement("span"); strip.className = "pt-ic"; strip.dataset.c = String(charId); strip.dataset.k = String(raw.k);
      strip._auto = auto(charId, raw, tagIds);
      cmdEl.insertAdjacentElement("afterend", strip);
      paint(strip);
      if (!overrides) load();
    } catch (e) { /* アイコンが出せなくても、技表はこれまでどおり */ }
  }

  window.PTIcons = Object.freeze({ attach: attach, auto: auto, iconsFor: iconsFor, catalog: CATALOG.map(function (c) { return { id: c[0], label: c[1], file: c[2] }; }), refresh: refresh, reload: function () { overrides = null; loadedAt = 0; return load(); } });
})();
