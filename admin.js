/* PROJECT T 管理者ページ（admin.html）
   ・ログインは PROJECT T の通常のログイン（Cookie）。管理者かどうかは、サーバーの /api/v1/me の is_admin（毎回サーバーが DB で判定）。
     ここでの表示切り替えは見た目だけで、権限のもとではない（書き込み API は、サーバーが毎回、管理者・CSRF・Origin を確かめる）。
   ・技チェックシートの列・タグ・技の元データは、同じサイトの pc.html（?ptpreview=1）を iframe で読み、その COLS / INFO_TAGS / CHARACTERS / moveInfo を直接使う（二重に定義しない）。
   ・編集 → 下書き保存 → プレビュー → 公開。公開するまで一般のサイトには出ない。保存・公開は expected_version で同時編集を検知する。
   ・画面に出す文字はすべて textContent で入れる（HTML として解釈しない）。 */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var MULTI = { hit: 1, counter: 1, wall: 1, gimmick: 1 };       // 複数行で入れる列
  var EXTRA_T = [["whf", "追撃可能（壁際のみ）・ヒット側"], ["whc", "コンボ始動（壁際のみ）・ヒット側"], ["wcf", "追撃可能（壁際のみ）・カウンター側"], ["wcc", "コンボ始動（壁際のみ）・カウンター側"]];
  var ACTION_JA = { admin_grant: "管理者を付与", admin_grant_noop: "管理者の付与（すでに管理者）", admin_revoke: "管理者を解除", admin_revoke_noop: "管理者の解除（管理者ではなかった）",
    admin_revoke_denied_self: "自分の解除を拒否", admin_revoke_denied_last: "最後の管理者の解除を拒否", admin_bootstrap: "初期設定で管理者に", admin_account_deleted: "管理者が退会",
    admin_delete_account_denied_last: "最後の管理者の退会を拒否", checksheet_save_draft: "下書きを保存", checksheet_publish: "公開", checksheet_revert: "公開済みに戻す", checksheet_remove_override: "上書きを削除（元データへ）",
    checksheet_rebase: "最新の元データに合わせて保存", checksheet_save_denied_base_changed: "下書き保存を拒否（元データが更新済み）", checksheet_publish_denied_base_changed: "公開を拒否（元データが更新済み）", cloud_review_update: "クラウド解析の調査状況を更新" };
  var HIST_JA = { save_draft: "下書きを保存", publish: "公開", revert_to_published: "公開済みに戻す", remove_override: "上書きを削除", rebase: "最新の元データに合わせて保存" };
  var FIELD_JA = { name: "技名", y: "読み", t: "タグ", tg: "取得・消費", ss: "強化状態", off: "対象外" };
  // 元データが更新されたときの案内（固定の文言）
  var MSG_BASE = ["元の技チェックシートデータが更新されています。", "この編集データは古い元データを基準に作成されています。", "最新データへ統合してから公開してください。"];
  var MSG_PUBLISH_CONFIRM = "この内容を一般公開の技チェックシートへ反映します。よろしいですか？";
  var MSG_GRANT_CONFIRM = "このユーザーへ管理者権限を付与しますか？";

  var S = { me: null, csrf: "", tab: "sheet", cols: [], tags: [], chars: [], win: null, spWin: null, ovr: {}, cur: null, dirty: false, colCache: {}, pvTimer: 0, pageHash: {} };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function h(tag, attrs) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v); else if (k === "value") e.value = v;
      else e.setAttribute(k, v === true ? "" : v);
    });
    (function add(list) {
      list.forEach(function (c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) return add(c);
        e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    })(Array.prototype.slice.call(arguments, 2));
    return e;
  }
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  // サーバーの日時は UTC（末尾に Z が付かない形）なので、UTC として読んでから、ブラウザの時刻（日本なら日本時間）で表示する
  var fmtAt = function (s) { if (!s) return ""; try { var t = /(Z|[+-]\d\d:?\d\d)$/.test(s) ? s : s + "Z"; return new Date(t).toLocaleString("ja-JP", { hour12: false }); } catch (_) { return s; } };
  var shortId = function (s) { return s ? s.slice(0, 8) + "…" : "（初期設定／退会済み）"; };
  // 元データの指紋（base_hash）。サーバーの checksheet_base.py と、まったく同じ文字列を SHA-256 にかける：
  //   {"char_id":…,"moves":[…]} を、キーを並べ替え・空白なし・日本語そのままの JSON にする（配列の順は意味を持つので、そのまま）
  function canon(v) {
    if (v === null || typeof v !== "object") return JSON.stringify(v);
    if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
    return "{" + Object.keys(v).sort().filter(function (k) { return v[k] !== undefined; }).map(function (k) { return JSON.stringify(k) + ":" + canon(v[k]); }).join(",") + "}";
  }
  async function baseHashOf(id, moves) {
    var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canon({ char_id: id, moves: moves })));
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  var short8 = function (s) { return s ? s.slice(0, 8) : "（なし）"; };

  // ------------------------------------------------------------ API
  async function api(path, opt) {
    opt = opt || {};
    var method = opt.method || "GET", init = { method: method, credentials: "include", headers: {} };
    if (method !== "GET") { init.headers["Content-Type"] = "application/json"; init.headers["X-CSRF-Token"] = S.csrf; init.body = JSON.stringify(opt.body || {}); }
    var r = await fetch(API + path, init), data = null;
    try { data = await r.json(); } catch (_) {}
    if (r.status === 403 && method !== "GET" && !opt.retried && data && /CSRF/.test(String(data.detail))) { await loadMe(); return api(path, Object.assign({}, opt, { retried: true })); }
    if (!r.ok) {
      var d = data && data.detail, e = new Error(typeof d === "string" ? d : (d && d.message) || ("HTTP " + r.status));
      e.status = r.status; e.detail = d; throw e;
    }
    return data;
  }
  async function loadMe() { var me = await api("/api/v1/me"); S.me = me; S.csrf = me.csrf_token || ""; return me; }

  // ------------------------------------------------------------ 確認ダイアログ（画面の中に出す。文字は textContent）
  // opt: { title, body:[要素/文字], actions:[{label, value, cls}] } → 押されたボタンの value を返す（Esc・外側クリックは null）。最初に焦点が当たるのは「キャンセル」側
  function modal(opt) {
    return new Promise(function (resolve) {
      var prev = document.activeElement, done = false;
      var finish = function (v) { if (done) return; done = true; document.removeEventListener("keydown", onKey, true); back.remove(); if (prev && prev.focus) { try { prev.focus(); } catch (_) {} } resolve(v); };
      var onKey = function (ev) { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); finish(null); } };
      var btns = (opt.actions || []).map(function (a) {
        return h("button", { type: "button", class: "btn" + (a.cls ? " " + a.cls : ""), "data-act": a.act || String(a.value), text: a.label, onclick: function () { finish(a.value); } });
      });
      var box = h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "ptModalTitle", id: "ptModal" },
        h("h2", { id: "ptModalTitle", text: opt.title }), h("div", { class: "mbody" }, opt.body || []), h("div", { class: "row mact" }, btns));
      var back = h("div", { class: "modal-back", onclick: function (ev) { if (ev.target === back) finish(null); } }, box);
      document.addEventListener("keydown", onKey, true);
      document.body.appendChild(back);
      var first = btns.filter(function (b) { return b.dataset.act === "cancel"; })[0] || btns[btns.length - 1];
      if (first) first.focus();
    });
  }
  var confirmModal = function (title, lines, okLabel, danger) {
    return modal({ title: title, body: lines.map(function (t) { return typeof t === "string" ? h("p", { text: t }) : t; }),
      actions: [{ label: "キャンセル", value: false, act: "cancel" }, { label: okLabel, value: true, act: "ok", cls: danger ? "danger" : "primary" }] });
  };

  // ------------------------------------------------------------ 起動
  var app = $("#app");
  var sec = { sheet: h("section", { id: "secSheet" }), users: h("section", { id: "secUsers", hidden: true }), audit: h("section", { id: "secAudit", hidden: true }), media: h("section", { id: "secMedia", hidden: true }), icons: h("section", { id: "secIcons", hidden: true }), px: h("section", { id: "secPx", hidden: true }), players: h("section", { id: "secPlayers", hidden: true }), tournaments: h("section", { id: "secTournaments", hidden: true }), cloud: h("section", { id: "secCloud", hidden: true }) };
  async function boot() {
    // 他のページの中に埋め込まれて（クリックジャッキング）、管理者に気づかれず「公開」などを押させられないよう、枠の中では動かさない
    if (window.top !== window.self) { app.replaceChildren(h("div", { class: "center card" }, h("h2", { text: "このページは、他のページの中では使えません" }), h("p", null, h("a", { href: location.href, target: "_top", rel: "noopener", text: "新しいページとして開く" })))); return; }
    try { await loadMe(); }
    catch (e) {
      if (e.status === 401) return showLogin();
      return showMsg("サーバーにつながりませんでした", "しばらくしてから、もう一度開いてください。（" + e.message + "）");
    }
    if (!S.me.is_admin) return showMsg("このページは管理者専用です", "このアカウントには管理者の権限がありません。");
    $("#who").replaceChildren(
      h("span", { class: "who-name", text: "ログイン中：" + (S.me.display_name || "（名前なし）") }),
      h("span", { class: "who-id", text: "PROJECT T ID " + S.me.project_t_id }),
      copyUserIdButton(S.me.project_t_id, "PROJECT T IDをコピー"));
    $("#tabs").hidden = false;
    $("#tabs").addEventListener("click", function (ev) { var b = ev.target.closest("button[data-tab]"); if (b) setTab(b.dataset.tab); });
    app.replaceChildren(sec.sheet, sec.users, sec.audit, sec.media, sec.icons, sec.px, sec.players, sec.tournaments, sec.cloud);
    window.PTAdminMoveMedia.mount(sec.media, { csrf: function () { return S.csrf; }, characters: function () { return effChars(); } });
    window.PTAdminMoveIcons.mount(sec.icons, { csrf: function () { return S.csrf; }, characters: function () { return effChars(); }, win: function () { return S.win; } });
    var comCtx = { characters: function () { return S.chars || []; } };
    window.PTAdminCommunity.mountPlayers(sec.players, comCtx); window.PTAdminCommunity.mountTournaments(sec.tournaments, comCtx);
    window.PTAdminPxImages.mount(sec.px, { csrf: function () { return S.csrf; }, characters: function () { return S.chars || []; }, win: function () { return S.win; } });
    window.PTAdminCloudAnalysis.mount(sec.cloud, { csrf: function () { return S.csrf; } });
    buildSheetSkeleton();
    setTab("sheet");
  }
  function showMsg(title, text) { app.replaceChildren(h("div", { class: "center card" }, h("h2", { text: title }), h("p", { text: text }), h("p", null, h("a", { href: "pc.html#home", text: "サイトに戻る" })))); }
  function showLogin() {
    var back = encodeURIComponent(location.origin + location.pathname);
    app.replaceChildren(h("div", { class: "center card" }, h("h2", { text: "ログインが必要です" }), h("p", { text: "PROJECT T のアカウントでログインしてください。管理者の権限があるアカウントだけが使えます。" }),
      h("p", { class: "row", style: "justify-content:center" },
        h("a", { class: "btn primary", href: API + "/auth/discord/start?mode=login&return_to=" + back, text: "Discord でログイン" }),
        h("a", { class: "btn", href: API + "/auth/google/start?mode=login&return_to=" + back, text: "Google でログイン" }))));
  }
  // 技名・コマンドを技チェックシートで変えたら、アイコン設定・技動画登録にも同じ内容を出す
  // いま開いているキャラ＝編集中の内容／ほかのキャラ＝保存済みの下書き（なければ公開中の内容、なければ元データ）
  function effChars() {
    return (S.chars || []).map(function (c) {
      var mv = S.cur && S.cur.id === c.id && Array.isArray(S.cur.moves) ? S.cur.moves : (S.ovMoves && S.ovMoves[c.id]);
      return Array.isArray(mv) ? { id: c.id, en: c.en, name: c.name, moves: mv } : c;
    });
  }
  function syncMoveTabs(force) {
    try {
      if (!S.chars) return;
      var sig = (S.cur ? S.cur.id + "|" + JSON.stringify((S.cur.moves || []).map(function (m) { return [m.k, m.name, m.a && m.a.command]; })) : "") + "|" + (S._ovVer || 0);
      if (!force && S._effSig === sig && S._effBase === S.chars) return;
      S._effSig = sig; S._effBase = S.chars;
      var e = effChars(); window.PTAdminMoveIcons.updateCharacters(e); window.PTAdminMoveMedia.updateCharacters(e);
    } catch (x) { console.error("[admin] アイコン・動画の一覧への反映に失敗しました", x); }
  }
  async function loadOverlays() {            // 上書き（下書き・公開）のあるキャラの技一覧を、まだ取っていないものだけ取得
    if (!S.ovr || !S.chars) return;
    S.ovMoves = S.ovMoves || {};
    var ids = Object.keys(S.ovr).filter(function (id) { return !(id in S.ovMoves) && !(S.cur && S.cur.id === id); });
    if (!ids.length) return;
    var gen = (S._ovGen = (S._ovGen || 0) + 1);
    for (var i = 0; i < ids.length; i += 6) {
      await Promise.all(ids.slice(i, i + 6).map(async function (id) {
        try { var r = await api("/api/v1/admin/checksheet/" + encodeURIComponent(id)); S.ovMoves[id] = r.exists ? r.moves : (r.published ? r.published.moves : null); }
        catch (e) { /* 取れなかったキャラは元データのまま表示する */ }
      }));
      if (gen !== S._ovGen) return;
    }
    S._ovVer = (S._ovVer || 0) + 1; syncMoveTabs();
  }
  function setTab(t) {
    S.tab = t;
    Object.keys(sec).forEach(function (k) { sec[k].hidden = k !== t; });
    document.querySelectorAll("#tabs button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tab === t)); });
    if (t === "icons" || t === "media") { syncMoveTabs(); loadOverlays(); }
    if (t === "users") loadUsers(); else if (t === "audit") loadAudit(); else if (t === "cloud") window.PTAdminCloudAnalysis.refresh();
  }
  window.addEventListener("beforeunload", function (e) { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });

  // ------------------------------------------------------------ 技チェックシート：骨組み
  var D = {};   // よく使う要素
  function buildSheetSkeleton() {
    D.banner = h("div", { id: "banner" });
    D.chars = h("div", { id: "chars" });
    D.tool = h("div", { class: "card pt-sheet-toolbar", id: "tool" });
    D.diff = h("div", { class: "card", id: "diffBox", hidden: true });
    D.editor = h("div", { class: "editor card", id: "editor" });
    D.hist = h("div", { class: "card", id: "hist" });
    D.pcFrame = h("iframe", { id: "pvPC", title: "PC版プレビュー（元データの読み込み）", src: "pc.html?ptpreview=1#sheet" });
    D.spFrame = null;
    D.spBox = h("div", { id: "spBox" });
    D.pvBox = h("div", { class: "card" }, h("div", { class: "row" }, h("b", { text: "プレビュー" }), h("span", { class: "muted", text: "実際のサイトの技チェックシートに、編集中の内容をその場で映します（保存・公開はされません）" }),
      h("label", { class: "chk" }, h("input", { type: "checkbox", onchange: function (ev) { toggleSP(ev.target.checked); } }), "スマホ版も見る")),
      h("div", { class: "pv" }, D.pcFrame, D.spBox));
    D.charPicker = h("select", { id: "ptSheetCharPicker", "aria-label": "編集するキャラクターを選ぶ", onchange: function (ev) {
      var id = ev.target.value;
      if (!id || (S.cur && id === S.cur.id)) return;
      if (S.dirty && !confirm("保存していない変更があります。破棄して移動しますか？")) {
        ev.target.value = S.cur ? S.cur.id : "";
        return;
      }
      S.dirty = false; openChar(id);
    } });
    sec.sheet.replaceChildren(D.banner, h("div", { class: "card pt-sheet-character-panel" },
      h("div", { class: "pt-sheet-mobile-picker" }, h("label", { for: "ptSheetCharPicker", text: "編集するキャラクター" }), D.charPicker),
      h("div", { class: "pt-sheet-char-caption", text: "キャラクターを選ぶ" }), D.chars),
      D.tool, D.diff, D.editor, D.hist, D.pvBox);
    D.chars.textContent = "元データ（サイトの技表）を読み込んでいます…（数十秒かかることがあります）";
    D.pcFrame.addEventListener("load", onBaseLoaded);
  }
  function toggleSP(on) {
    if (!on) { D.spBox.replaceChildren(); D.spFrame = null; S.spWin = null; return; }
    D.spFrame = h("iframe", { id: "pvSP", title: "スマホ版プレビュー", src: "sp.html?ptpreview=1#sheet" });
    D.spFrame.addEventListener("load", function () { S.spWin = D.spFrame.contentWindow; postPreview(); });
    D.spBox.replaceChildren(D.spFrame);
  }
  async function onBaseLoaded() {
    var W = D.pcFrame.contentWindow;
    try {
      var J = function (expr) { return JSON.parse(W.eval("JSON.stringify(" + expr + ")")); };
      S.cols = J("COLS.map(function(c){return {id:c.id,label:c.label}})");
      S.tags = J("INFO_TAGS.map(function(t){return {id:t.id,label:t.label,full:t.full}})");
      S.chars = J("CHARACTERS.map(function(c){return {id:c.id,en:c.en,name:c.name,moves:c.moves}})");
      window.PTAdminMoveMedia.updateCharacters(S.chars);
      S.win = W; window.PTAdminMoveIcons.updateCharacters(S.chars); window.PTAdminPxImages.updateCharacters(S.chars);
      S.win = W;
    } catch (e) { D.chars.textContent = "元データを読み込めませんでした：" + e.message; return; }
    if (!(window.crypto && crypto.subtle)) { D.chars.textContent = "この環境では元データの指紋（SHA-256）を計算できないため、編集できません。https で開いたページから使ってください。"; return; }
    try { S.pageHash = {}; await Promise.all(S.chars.map(async function (c) { S.pageHash[c.id] = await baseHashOf(c.id, c.moves); })); }
    catch (e) { D.chars.textContent = "元データの指紋を計算できませんでした：" + e.message; return; }
    await refreshOverview();
    renderChars();
    var keep = S.cur && baseOf(S.cur.id) ? S.cur.id : null;      // 元データを読み直したときは、開いていたキャラを開き直す
    S.cur = null;
    if (keep) openChar(keep); else if (S.chars.length) openChar(S.chars[0].id);
  }
  function reloadBase() {
    guardThen(function () { D.chars.textContent = "元データ（サイトの技表）を読み込み直しています…"; D.pcFrame.src = "pc.html?ptpreview=1&_=" + Date.now() + "#sheet"; });
  }
  async function refreshOverview() {
    try { var r = await api("/api/v1/admin/checksheet"); S.ovr = {}; r.characters.forEach(function (c) { S.ovr[c.char_id] = c; }); }
    catch (e) { banner("err", "一覧を取得できませんでした：" + e.message); }
  }
  function banner(kind, text, actions) {
    D.banner.replaceChildren();
    if (!text) return;
    var b = h("div", { class: "banner " + (kind || "") }, Array.isArray(text) ? text.map(function (t) { return h("div", { text: t }); }) : text);
    (actions || []).forEach(function (a) { b.appendChild(document.createTextNode(" ")); b.appendChild(h("button", { type: "button", class: "btn" + (a.cls ? " " + a.cls : ""), text: a.label, onclick: a.fn })); });
    D.banner.appendChild(b);
  }
  function renderChars() {
    D.chars.replaceChildren();
    if (D.charPicker) {
      var oldValue = D.charPicker.value;
      D.charPicker.replaceChildren();
      S.chars.forEach(function (c) {
        var opt = h("option", { value: c.id, text: c.name + "（" + c.en + "） · " + c.moves.length + "技" });
        D.charPicker.appendChild(opt);
      });
      var selectedId = S.cur ? S.cur.id : oldValue;
      if (selectedId && S.chars.some(function (x) { return x.id === selectedId; })) D.charPicker.value = selectedId;
    }
    S.chars.forEach(function (c) {
      var o = S.ovr[c.id], badge = null, stale = null;
      if (o) badge = h("span", { class: "badge " + (o.has_unpublished_changes ? "draft" : "pub"), text: o.has_unpublished_changes ? "未公開の変更" : "公開中" });
      if (o && o.base_status === "changed") stale = h("span", { class: "badge stale", title: "サイトの元データが、この編集のもとにした版から更新されています。最新の元データで編集し直してください", text: "元データ更新あり" });
      else if (o && o.public_live === false) stale = h("span", { class: "badge stale", text: "公開中の上書きは一時停止" });
      D.chars.appendChild(h("button", { type: "button", "data-char": c.id, "aria-pressed": String(!!S.cur && S.cur.id === c.id), onclick: function () { guardThen(function () { openChar(c.id); }); } }, c.name + "（" + c.en + "）", " ", String(c.moves.length) + "技", badge, stale));
    });
  }
  function guardThen(fn) { if (S.dirty && !confirm("保存していない変更があります。破棄して移動しますか？")) return; S.dirty = false; fn(); }

  // ------------------------------------------------------------ キャラを開く
  function baseOf(id) { return S.chars.find(function (c) { return c.id === id; }); }
  function syncHeaderHeight() { var hd = document.querySelector("header"); if (hd) document.documentElement.style.setProperty("--hh", hd.offsetHeight + "px"); }
  window.addEventListener("resize", syncHeaderHeight); window.addEventListener("load", syncHeaderHeight); setTimeout(syncHeaderHeight, 300); setTimeout(syncHeaderHeight, 1500);
  async function openChar(id) {
    var base = baseOf(id); if (!base) return;
    if (S.cur && S.cur.id !== id && S.ovMoves) { delete S.ovMoves[S.cur.id]; S._ovVer = (S._ovVer || 0) + 1; }   // 離れるキャラは、次にアイコン・動画の一覧を開くとき最新を取り直す
    banner("", "読み込み中…");
    var r;
    try { r = await api("/api/v1/admin/checksheet/" + encodeURIComponent(id)); }
    catch (e) { return banner("err", "読み込めませんでした：" + e.message); }
    S.dirty = false;
    var pageHash = S.pageHash[id];
    S.cur = { id: id, name: base.name, version: r.exists ? r.version : 0, exists: r.exists,
      pageHash: pageHash,                                            // この画面が読み込んだ元データの指紋
      contentBase: r.exists ? r.saved_base_hash : pageHash,          // いま編集している内容が、どの元データをもとにしているか（保存・公開のとき、サーバーへ送る）
      savedBase: r.exists ? r.saved_base_hash : null,                // サーバーに保存してある下書きの、もとの元データ
      currentHash: r.current_base_hash, manifestOk: !!r.manifest_ok, // サーバーが確かめた「いま公開されている元データ」の指紋
      moves: clone(r.exists ? r.moves : base.moves), serverMoves: r.exists ? clone(r.moves) : null,
      published: r.published ? { version: r.published.version, moves: r.published.moves, at: r.published.at, by: r.published.by, live: r.published.public_live, baseStatus: r.published.base_status } : null,
      updatedBy: r.updated_by, updatedAt: r.updated_at, sel: 0, filter: "", hist: [], ref: null };
    banner("");
    D.diff.hidden = true;
    S.colCache = {};
    renderChars(); renderAll(); loadHistory(); schedulePreview(0);
    notifyBase(); S._effBase = null; syncMoveTabs();
  }
  function renderAll() { renderTool(); renderEditor(); }

  // ------------------------------------------------------------ 元データの更新（base_hash）
  // current＝編集のもとにした元データが、いまの元データと同じ／changed＝元データが更新された／stale＝この画面が読み込んだ元データが古い／unknown＝いまの指紋を確かめられない
  function baseState() {
    var c = S.cur;
    if (!c.manifestOk || !c.currentHash) return "unknown";
    if (c.pageHash !== c.currentHash) return "stale";
    if (c.contentBase !== c.currentHash) return "changed";
    return "current";
  }
  function baseActions() {
    var st = baseState();
    if (st === "changed") return [{ label: "最新データとの差分を見る", fn: function () { showDiff(); } }, { label: "最新データをベースに再編集", cls: "primary", fn: function () { rebase(); } }];
    if (st === "stale") return [{ label: "元データを読み込み直す", cls: "primary", fn: reloadBase }];
    return [];
  }
  function notifyBase(okMsg) {       // okMsg があれば、その一文を先頭に付けて出す（元データの注意が、操作完了の表示で消えないように）
    var c = S.cur, st = baseState(), lines = [];
    if (st === "changed") lines = MSG_BASE.slice();
    else if (st === "stale") lines = ["この画面が読み込んだ元データと、サーバーが確認した最新の元データが食い違っています。", "元データを読み込み直してから、編集してください。", "読み込み直しても直らないときは、サイトの checksheet-base.json が、pc.html／sp.html と同時に公開されていない可能性があります。"];
    else if (st === "unknown") lines = ["サイトの元データの最新の状態を確認できません。下書きの保存はできますが、確認できるまで公開はできません。"];
    if (c.published && c.published.live === false) lines.push("いま公開中の上書きは、元データの更新により、一般のサイトでは一時的に表示されていません（元データのまま表示されています）。");
    if (lines.length) banner(st === "unknown" ? "" : "warn", okMsg ? [okMsg].concat(lines) : lines, baseActions());
    else if (okMsg) banner("ok", okMsg);
  }
  // 保存・公開の前に呼ぶ。続けてよいときだけ true。更新されていれば、案内を出して false（警告だけで進めさせない）
  async function ensureBaseOk() {
    var st = baseState();
    if (st === "current" || st === "unknown") return true;
    if (st === "stale") {
      var s = await modal({ title: "元データを読み込み直してください", body: [h("p", { text: "この画面が読み込んだ元データと、サーバーが確認した最新の元データが食い違っています。" }), h("p", { text: "読み込み直してから、編集してください。" }), h("p", { class: "muted", text: "読み込み直しても直らないときは、サイトの checksheet-base.json が pc.html／sp.html と同時に公開されていない可能性があります。" })],
        actions: [{ label: "キャンセル", value: null, act: "cancel" }, { label: "元データを読み込み直す", value: "reload", cls: "primary", act: "reload" }] });
      if (s === "reload") reloadBase();
      return false;
    }
    var v = await modal({ title: "元データが更新されています", body: MSG_BASE.map(function (t) { return h("p", { text: t }); }),
      actions: [{ label: "最新データとの差分を見る", value: "diff", act: "diff" }, { label: "最新データをベースに再編集", value: "rebase", cls: "primary", act: "rebase" }, { label: "キャンセル", value: null, act: "cancel" }] });
    if (v === "diff") showDiff(); else if (v === "rebase") rebase();
    return false;
  }
  function baseChangedByServer(d) {      // サーバーが 409（base_changed）で断った：画面の状態を、サーバーの言うとおりに直す
    var c = S.cur;
    c.currentHash = d.current_base_hash || c.currentHash; c.manifestOk = true;
    c.savedBase = d.saved_base_hash || c.savedBase;
    renderTool(); notifyBase();
    return ensureBaseOk();
  }
  // 最新の元データをベースに、編集をやり直す（自動で混ぜ合わせはしない）。これまでの編集は「参照用」に残し、差分画面から技ごとに取り込める
  async function rebase() {
    var c = S.cur;
    if (baseState() === "stale") { return ensureBaseOk(); }
    var ok = await confirmModal("最新の元データをベースに再編集", ["編集画面を、いまの最新の元データで作り直します。", "これまでの編集内容は消さずに参照用に残します。差分の画面から、必要な技だけを取り込み直してください。", "（保存するまで、サーバーには何も反映されません）"], "再編集を始める", false);
    if (!ok) return;
    c.ref = clone(c.moves); c.moves = clone(baseOf(c.id).moves); c.contentBase = c.pageHash; c.sel = 0; S.colCache = {};
    touch(); renderAll();
    banner("warn", ["最新の元データをベースに、編集画面を作り直しました。以前の編集内容は参照用に残してあります。", "必要な編集を取り込み直してから、「下書きを保存」→「公開する」の順に進んでください。元データと同じ内容にしたいときは「上書きを削除」を使ってください。"],
      [{ label: "以前の編集との差分を見る", fn: function () { showDiff(); } }]);
    showDiff();
  }
  function fieldLabel(k) { return FIELD_JA[k] || k; }
  function colLabel(id) { var c = S.cols.filter(function (x) { return x.id === id; })[0]; return c ? c.label : (id === "ci" ? "コマンド表示用(ci)" : id); }
  function fieldDiffs(x, y) {
    var out = [], same = function (p, q) { return JSON.stringify(p) === JSON.stringify(q); };
    Object.keys(Object.assign({}, x, y)).forEach(function (k) {
      if (k === "k" || k === "a") return;
      if (!same(x[k], y[k])) out.push({ label: fieldLabel(k), key: k, l: x[k], r: y[k] });
    });
    var ax = x.a || {}, ay = y.a || {};
    Object.keys(Object.assign({}, ax, ay)).forEach(function (k) { if (!same(ax[k], ay[k])) out.push({ label: colLabel(k), col: k, l: ax[k], r: ay[k] }); });
    return out;
  }
  function diffMoves(left, right) {
    var ml = {}, mr = {};
    left.forEach(function (m) { ml[m.k] = m; }); right.forEach(function (m) { mr[m.k] = m; });
    var changed = [];
    left.forEach(function (m) { if (m.k in mr) { var f = fieldDiffs(m, mr[m.k]); if (f.length) changed.push({ l: m, r: mr[m.k], fields: f }); } });
    var kl = left.filter(function (m) { return m.k in mr; }).map(function (m) { return m.k; }).join(","), kr = right.filter(function (m) { return m.k in ml; }).map(function (m) { return m.k; }).join(",");
    return { onlyL: left.filter(function (m) { return !(m.k in mr); }), onlyR: right.filter(function (m) { return !(m.k in ml); }), changed: changed, reordered: kl !== kr };
  }
  var vtxt = function (v) { if (v === undefined) return "（なし）"; var s = typeof v === "string" ? v : JSON.stringify(v); s = s.replace(/\n/g, " ⏎ "); return s.length > 160 ? s.slice(0, 160) + "…" : (s === "" ? "（空）" : s); };
  // 差分画面。再編集の前：左＝編集データ／右＝最新の元データ（読むだけ）。再編集のあと：左＝以前の編集内容／右＝いまの編集（技ごとに取り込める）
  function showDiff() {
    var c = S.cur, after = !!c.ref;
    var L = after ? c.ref : c.moves, R = after ? c.moves : baseOf(c.id).moves;
    var d = diffMoves(L, R), box = D.diff;
    var ln = after ? "以前の編集内容" : "あなたの編集データ", rn = after ? "いまの編集（最新の元データがもと）" : "最新の元データ";
    box.hidden = false;
    var head = h("div", { class: "row" }, h("b", { text: "差分：" + ln + "　と　" + rn }), h("span", { class: "muted", text: after ? "必要な技だけ「取り込む」で、いまの編集に反映します" : "読むだけの画面です（ここでは何も変わりません）" }), h("span", { style: "flex:1" }),
      h("button", { type: "button", class: "btn", id: "diffClose", text: "閉じる", onclick: function () { box.hidden = true; } }));
    var parts = [head];
    var sect = function (title, n) { return h("div", { class: "dsec", text: title + "（" + n + "）" }); };
    var mv = function (m, btn) { return h("div", { class: "drow" }, h("span", { class: "k", text: "#" + m.k }), " ", h("span", { text: m.name }), (m.a && m.a.command) ? h("span", { class: "muted", text: "　" + m.a.command }) : null, btn ? [" ", btn] : null); };
    if (d.reordered) parts.push(h("div", { class: "banner warn", text: "技の並び順が違います。並び順は、指紋（元データの照合）の対象です。" }));
    if (!d.onlyL.length && !d.onlyR.length && !d.changed.length && !d.reordered) parts.push(h("div", { class: "muted", text: "違いはありません。" }));
    if (d.onlyL.length) {
      parts.push(sect(rn + "に無い技（" + ln + "だけにある）", d.onlyL.length));
      d.onlyL.forEach(function (m) { parts.push(mv(m, after ? h("button", { type: "button", class: "btn", "data-take": m.k, text: "取り込む（追加）", onclick: function () { c.moves.push(clone(m)); afterTake(); } }) : null)); });
    }
    if (d.onlyR.length) {
      parts.push(sect(ln + "に無い技（" + rn + "だけにある）", d.onlyR.length));
      d.onlyR.forEach(function (m) { parts.push(mv(m, after ? h("button", { type: "button", class: "btn", "data-take": m.k, text: "この技を削除", onclick: function () { c.moves = c.moves.filter(function (x) { return x.k !== m.k; }); c.sel = Math.min(c.sel, Math.max(0, c.moves.length - 1)); afterTake(); } }) : null)); });
    }
    if (d.changed.length) {
      parts.push(sect("内容が違う技", d.changed.length));
      d.changed.forEach(function (x) {
        var useField = function (f) {      // 項目ごとに、以前の編集の値だけをいまの編集へ反映する（技の中のほかの項目は、最新の元データのまま）
          var i = c.moves.findIndex(function (m) { return m.k === x.l.k; }); if (i < 0) return;
          var m = c.moves[i];
          if (f.col) { m.a = m.a || {}; if (f.l === undefined) delete m.a[f.col]; else m.a[f.col] = clone(f.l); }
          else if (f.l === undefined) delete m[f.key]; else m[f.key] = clone(f.l);
          afterTake();
        };
        var tbl = h("table", null, h("thead", null, h("tr", null, h("th", { text: "項目" }), h("th", { text: ln }), h("th", { text: rn }), after ? h("th", { text: "" }) : null)),
          h("tbody", null, x.fields.map(function (f) { return h("tr", null, h("td", { text: f.label }), h("td", { text: vtxt(f.l) }), h("td", { text: vtxt(f.r) }),
            after ? h("td", null, h("button", { type: "button", class: "btn", "data-take-field": x.l.k + ":" + (f.col || f.key), text: "この項目だけ以前の値にする", onclick: function () { useField(f); } })) : null); })));
        var take = after ? h("button", { type: "button", class: "btn", "data-take": x.l.k, text: "技ごと取り込む（全項目を以前の内容にする）", onclick: function () { var i = c.moves.findIndex(function (m) { return m.k === x.l.k; }); if (i >= 0) c.moves[i] = clone(x.l); afterTake(); } }) : null;
        parts.push(h("details", { open: d.changed.length <= 5 }, h("summary", null, "#" + x.l.k + " " + x.l.name + "　", h("span", { class: "muted", text: x.fields.map(function (f) { return f.label; }).join("・") }), take ? [" ", take] : null), h("div", { class: "tw" }, tbl)));
      });
    }
    box.replaceChildren.apply(box, parts);
    function afterTake() { touch(); renderEditor(); showDiff(); }
    return d;
  }

  // ------------------------------------------------------------ ツールバー
  function status() {
    var c = S.cur;
    if (!c.exists) return "上書きなし（サイトの元データのまま）";
    var s = "下書き 版" + c.version + (c.published ? "／公開中 版" + c.published.version : "／まだ公開していません");
    if (c.published && JSON.stringify(c.published.moves) !== JSON.stringify(S.dirty ? c.moves : (c.serverMoves || c.moves))) s += "（未公開の変更あり）";
    return s;
  }
  var BASE_BADGE = { current: "元データ：最新と一致", changed: "元データ：更新あり（再編集が必要）", stale: "元データ：この画面が古い", unknown: "元データ：最新を確認できません" };
  // 「下書きを保存」は一般のサイトには出ない。「公開する」を押したときだけ、一般公開の技チェックシートに反映される
  function renderTool() {
    var c = S.cur; D.tool.replaceChildren();
    if (!c) return;
    var st = baseState(), rebasePending = c.exists && c.contentBase !== c.savedBase;
    var heading = h("div", { class: "pt-sheet-tool-heading" },
      h("b", { text: c.name }), h("span", { class: "muted", text: status() + (S.dirty ? "　● 未保存の変更あり" : "") }),
      h("span", { class: "badge " + (st === "current" ? "pub" : "stale"), id: "baseBadge", "data-state": st, text: BASE_BADGE[st] }));
    var mainActions = h("div", { class: "pt-sheet-primary-actions" },
      h("button", { type: "button", class: "btn", id: "btnSave", text: "下書きを保存", disabled: !S.dirty && c.exists && !rebasePending,
        title: "一般のサイトには出ません。「公開する」を押したときだけ反映されます", onclick: function () { saveDraft(); } }),
      h("button", { type: "button", class: "btn primary", id: "btnPublish", text: "公開する", disabled: !c.exists && !S.dirty,
        title: "一般公開の技チェックシートに反映します", onclick: publish }));
    var extraActions = h("div", { class: "pt-sheet-extra-actions" },
      h("button", { type: "button", class: "btn", text: "元データを読み込む",
        title: "サイトの最新技データを下書きとして読み込みます", onclick: loadBase }),
      h("button", { type: "button", class: "btn", text: "公開済みに戻す", disabled: !c.published,
        title: "下書きを公開中の内容に戻します", onclick: revert }),
      h("button", { type: "button", class: "btn danger", text: "上書きを削除", disabled: !c.exists,
        title: "上書きを削除し元データに戻します", onclick: removeOverride }));
    var more = h("details", { class: "pt-sheet-more" },
      h("summary", { text: "その他の操作（元データ・復元・削除）" }), extraActions);
    D.tool.append(heading, mainActions, more,
      h("p", { class: "muted pt-sheet-tool-note",
        text: "下書きを保存してもサイトは変わりません。「公開する」で一般公開に反映されます。" }));
  }
  async function loadBase() {
    var c = S.cur;
    if (baseState() === "stale") return ensureBaseOk();
    var ok = await confirmModal("元データを読み込む", ["元データ（サイトに埋め込まれた最新の技の一覧）を、下書きとして読み込みます。", "いまの編集内容は置き換わります（保存するまで反映されません）。"], "読み込む", false);
    if (!ok) return;
    c.moves = clone(baseOf(c.id).moves); c.contentBase = c.pageHash; c.sel = 0; touch(); renderAll(); banner(""); notifyBase();
  }
  function diffSummary(from, to) {
    var a = {}, b = {}, add = 0, del = 0, chg = 0;
    (from || []).forEach(function (m) { a[m.k] = JSON.stringify(m); }); (to || []).forEach(function (m) { b[m.k] = JSON.stringify(m); });
    Object.keys(b).forEach(function (k) { if (!(k in a)) add++; else if (a[k] !== b[k]) chg++; });
    Object.keys(a).forEach(function (k) { if (!(k in b)) del++; });
    return "追加 " + add + "／変更 " + chg + "／削除 " + del;
  }
  function explain(e) {
    var d = e.detail && typeof e.detail === "object" ? e.detail : null, code = d && (d.code || d.error);
    if (e.status === 409 && code === "version_conflict") { conflict(d.current_version); return; }
    if (e.status === 409 && code === "base_changed") { baseChangedByServer(d); return; }
    if (e.status === 503 && code === "base_unverifiable") { S.cur.manifestOk = false; renderTool(); banner("err", ["サイトの元データの最新の状態を確認できないため、公開できません。", "しばらくしてから、もう一度お試しください。（下書きの保存は、そのままできます）"]); return; }
    banner("err", e.message);
  }
  function conflict(cv) {
    banner("err", "ほかの管理者が先に保存しました（最新は版" + cv + "）。このまま保存すると上書きになります。", [
      { label: "最新を読み込み直す（自分の編集は破棄）", fn: function () { S.dirty = false; openChar(S.cur.id); } },
      { label: "自分の編集で上書きする", cls: "danger", fn: function () { if (confirm("ほかの管理者の変更を、いまの編集内容で上書きします。よろしいですか？")) { S.cur.version = cv; saveDraft(); } } }]);
  }
  async function saveDraft(skipCheck) {
    var c = S.cur;
    if (!skipCheck && !(await ensureBaseOk())) return false;       // 元データが更新されていたら、案内を出して止める（サーバーも同じ判定で 409 を返す）
    banner("", "保存中…");
    try {
      var r = await api("/api/v1/admin/checksheet/" + encodeURIComponent(c.id), { method: "POST", body: { moves: c.moves, expected_version: c.version, base_hash: c.contentBase } });
      c.version = r.version; c.exists = true; c.serverMoves = clone(c.moves); c.savedBase = c.contentBase; c.ref = null; S.dirty = false;
      if (r.base_status === "current") { c.currentHash = c.contentBase; c.manifestOk = true; }
      await refreshOverview(); renderChars(); renderTool(); loadHistory();
      banner("ok", r.rebased ? "最新の元データに合わせて保存しました（版" + r.version + "）。公開するまで、一般のサイトには出ません。" : r.changed ? "下書きを保存しました（版" + r.version + "）。公開するまで、一般のサイトには出ません。" : "変更はありませんでした。");
      return true;
    } catch (e) { explain(e); return false; }
  }
  async function publish() {
    var c = S.cur;
    if (!(await ensureBaseOk())) return;
    var before = c.published ? c.published.moves : baseOf(c.id).moves;
    var ok = await confirmModal("公開の確認", [MSG_PUBLISH_CONFIRM, "対象：" + c.name, "公開前との違い：" + diffSummary(before, c.moves), "公開してから一般のサイトに出るまで、最大1分ほどかかります。"], "公開する", false);
    if (!ok) return;
    if (S.dirty || !c.exists || c.contentBase !== c.savedBase) { if (!(await saveDraft(true))) return; }   // 公開する内容を、先に下書きとして保存する（確認は済んでいる）
    try {
      var r = await api("/api/v1/admin/checksheet/" + encodeURIComponent(c.id) + "/publish", { method: "POST", body: { expected_version: c.version } });
      c.published = { version: c.version, moves: clone(c.moves), live: true, baseStatus: "current" };
      await refreshOverview(); renderChars(); renderTool(); loadHistory();
      banner("ok", r.changed ? "公開しました。" : "すでに公開済みの内容です。");
    } catch (e) { explain(e); }
  }
  async function revert() {
    var c = S.cur;
    if (!(await confirmModal("公開済みに戻す", ["下書きを、公開中の内容に戻します。", "いまの下書きの変更は（履歴の保存分を除き）失われます。"], "公開中の内容に戻す", true))) return;
    try { await api("/api/v1/admin/checksheet/" + encodeURIComponent(c.id) + "/revert", { method: "POST", body: { expected_version: c.version } }); S.dirty = false; await refreshOverview(); await openChar(c.id); notifyBase("公開中の内容に戻しました。"); }
    catch (e) { explain(e); }
  }
  async function removeOverride() {
    var c = S.cur;
    if (!(await confirmModal("上書きの削除", ["「" + c.name + "」の上書きを削除します。", "サイトは、埋め込まれた元データの表示に戻ります（公開中の内容も消えます。履歴は残ります）。"], "上書きを削除する", true))) return;
    try { await api("/api/v1/admin/checksheet/" + encodeURIComponent(c.id) + "/delete", { method: "POST", body: { expected_version: c.version } }); S.dirty = false; await refreshOverview(); await openChar(c.id); notifyBase("上書きを削除しました（元データに戻りました）。"); }
    catch (e) { explain(e); }
  }

  // ------------------------------------------------------------ 履歴
  async function loadHistory() {
    var c = S.cur; D.hist.replaceChildren(h("b", { text: "変更履歴" }), " ", h("span", { class: "muted", text: "新しい順（最大40件）。「読み込む」で、その版の下書きを編集画面に出します（保存するまで反映されません）" }));
    try {
      var r = await api("/api/v1/admin/checksheet/" + encodeURIComponent(c.id) + "/history");
      var ul = h("ul", { class: "hist" });
      if (!r.history.length) ul.appendChild(h("li", { class: "muted", text: "まだ履歴はありません" }));
      r.history.forEach(function (x) {
        ul.appendChild(h("li", null, "版" + x.version + "　" + (HIST_JA[x.action] || x.action) + "　" + fmtAt(x.at) + "　", h("code", { text: shortId(x.actor) }), " ", h("span", { class: "muted", title: "この版のもとにした元データの指紋（先頭8文字）", text: "元データ " + short8(x.base_hash) }), " ",
          x.has_snapshot ? h("button", { type: "button", class: "btn", text: "読み込む", onclick: function () { loadSnapshot(x.id); } }) : null));
      });
      D.hist.appendChild(ul);
    } catch (e) { D.hist.appendChild(h("p", { class: "muted", text: "履歴を取得できませんでした：" + e.message })); }
  }
  async function loadSnapshot(hid) {
    if (!(await confirmModal("履歴を読み込む", ["この版の内容を編集画面に読み込みます。", "いまの編集内容は置き換わります（保存するまで反映されません）。"], "読み込む", false))) return;
    try {
      var r = await api("/api/v1/admin/checksheet/" + encodeURIComponent(S.cur.id) + "/history/" + hid);
      if (!r.moves) return banner("warn", "この履歴には内容の保存がありません。");
      S.cur.moves = clone(r.moves); S.cur.contentBase = r.base_hash || null; S.cur.sel = 0; touch(); renderAll();     // その版が、どの元データをもとにしていたかも一緒に戻す
      banner(""); notifyBase();
    } catch (e) { banner("err", e.message); }
  }

  // ------------------------------------------------------------ 編集画面
  function touch() { S.dirty = true; renderTool(); schedulePreview(450); }
  function nextK() {
    var m = -1; S.cur.moves.forEach(function (x) { m = Math.max(m, x.k); }); baseOf(S.cur.id).moves.forEach(function (x) { m = Math.max(m, x.k); });
    if (S.cur.published) S.cur.published.moves.forEach(function (x) { m = Math.max(m, x.k); });
    return m + 1;
  }
  function renderEditor() {
    var c = S.cur;
    var oldList = D.editor.querySelector("#mlist"), keepTop = oldList && S.listFor === (c && c.id) ? oldList.scrollTop : 0, keepY = window.pageYOffset;
    D.editor.replaceChildren();
    if (!c) return;
    S.listFor = c.id;
    var baseK = {}; baseOf(c.id).moves.forEach(function (m) { baseK[m.k] = JSON.stringify(m); });
    var list = h("div", { id: "mlist" });
    var picker = h("select", { id: "ptSheetMovePicker", "aria-label": "編集する技を選ぶ",
      onchange: function (ev) { if (!ev.target.value) return; c.sel = Number(ev.target.value); renderEditor(); } });
    var search = h("input", { type: "search", id: "ptSheetMoveSearch", placeholder: "技名・コマンド・kで検索",
      value: c.filter || "", "aria-label": "技を検索", oninput: function (ev) { c.filter = ev.target.value; updateFilteredMoves(); } });
    var matches = h("div", { class: "pt-sheet-matches", role: "status" });
    c.moves.forEach(function (m, i) {
      var cmd = (m.a && m.a.command) || "";
      var cls = !(m.k in baseK) ? "new" : (baseK[m.k] !== JSON.stringify(m) ? "chg" : "");
      list.appendChild(h("button", { type: "button", "data-index": i, "aria-pressed": String(i === c.sel),
        onclick: function () { c.sel = i; renderEditor(); } },
        h("span", { class: "k", text: "#" + m.k }), h("span", { class: cls, text: m.name }),
        cmd ? h("div", { class: "muted", text: cmd }) : null));
    });
    function updateFilteredMoves() {
      var q = (c.filter || "").normalize("NFKC").toLowerCase().trim(), options = [], count = 0, selected = "";
      Array.prototype.forEach.call(list.children, function (btn, i) {
        var m = c.moves[i], cmd = (m.a && m.a.command) || "";
        var show = !q || (String(m.k) + " " + m.name + " " + cmd + " " + (m.y || "")).normalize("NFKC").toLowerCase().indexOf(q) >= 0;
        btn.hidden = !show;
        if (show) {
          count++; options.push(h("option", { value: i, text: "#" + m.k + " · " + m.name + (cmd ? " / " + cmd : "") }));
          if (i === c.sel) selected = String(i);
        }
      });
      picker.replaceChildren.apply(picker, [h("option", { value: "", text: count ? "技を選択…" : "該当する技がありません" })].concat(options));
      picker.value = selected;
      matches.textContent = count + " / " + c.moves.length + " 技";
    }
    var left = h("div", { class: "mleft" },
      h("label", { class: "pt-sheet-move-search-label", for: "ptSheetMoveSearch", text: "技を検索" }),
      search, matches,
      h("div", { class: "pt-sheet-mobile-picker" },
        h("label", { for: "ptSheetMovePicker", text: "編集する技" }), picker),
      h("div", { class: "row pt-sheet-list-actions" },
        h("button", { type: "button", class: "btn", text: "＋技を追加", onclick: addMove }),
        missingBase().length ? h("select", { "aria-label": "元データから技を復元", onchange: function (ev) { restoreBase(+ev.target.value); } },
          h("option", { value: "", text: "元データから復元…" }),
          missingBase().map(function (m) { return h("option", { value: m.k, text: "#" + m.k + " " + m.name }); })) : null),
      list, h("div", { class: "muted pt-sheet-legend", text: "● 元データから変更　＋新規（元データに無い）" }));
    updateFilteredMoves();
    D.editor.append(left, h("div", { class: "pt-sheet-form-area" },
      c.moves[c.sel] ? form(c.moves[c.sel]) :
        h("div", { class: "muted", text: c.moves.length ? "左の一覧から技を選んでください" : "このキャラクターの技はまだありません。「＋技を追加」から作れます。" })));
    list.scrollTop = keepTop;
    var on = list.querySelector('[aria-pressed="true"]');
    if (on && !on.hidden && (on.offsetTop < list.scrollTop || on.offsetTop + on.offsetHeight > list.scrollTop + list.clientHeight))
      list.scrollTop = Math.max(0, on.offsetTop - Math.round(list.clientHeight / 3));
    if (Math.abs(window.pageYOffset - keepY) > 1) window.scrollTo(window.pageXOffset, keepY);
  }
  function missingBase() { var have = {}; S.cur.moves.forEach(function (m) { have[m.k] = 1; }); return baseOf(S.cur.id).moves.filter(function (m) { return !have[m.k]; }); }
  function restoreBase(k) { var m = baseOf(S.cur.id).moves.find(function (x) { return x.k === k; }); if (!m) return; S.cur.moves.push(clone(m)); S.cur.sel = S.cur.moves.length - 1; touch(); renderEditor(); }
  function addMove() { var c = S.cur; c.moves.push({ k: nextK(), name: "新しい技", a: {}, off: [] }); c.sel = c.moves.length - 1; c.filter = ""; touch(); renderEditor(); }

  function choices(colId) {
    if (S.colCache[colId]) return S.colCache[colId];
    var cnt = {}, add = function (v) { if (v) cnt[v] = (cnt[v] || 0) + 1; };
    var feed = function (moves) { moves.forEach(function (m) { var v = m.a && m.a[colId]; if (typeof v !== "string") return; if (MULTI[colId]) v.split("\n").forEach(function (l) { add(l.trim()); }); else add(v.trim()); }); };
    S.chars.forEach(function (c) { feed(c.moves); });     // 元データの、全キャラの「同じ列」の値だけ
    feed(S.cur.moves);
    return (S.colCache[colId] = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a] || a.localeCompare(b, "ja"); }).slice(0, 500));
  }
  function setAns(m, col, v) { m.a = m.a || {}; if (v === "") delete m.a[col]; else m.a[col] = v; touch(); }
  function form(m) {
    var c = S.cur, i = c.sel, g = h("div", { class: "grid" });
    var field = function (label, ctrl, extra) { g.append(h("div", { class: "lab", text: label }), ctrl, extra || h("span")); };
    field("技名", h("input", { value: m.name, oninput: function (ev) { m.name = ev.target.value; touch(); var b = $("#mlist button[aria-pressed=true] span:nth-child(2)"); if (b) b.textContent = m.name; } }));
    field("読み", h("input", { value: m.y || "", oninput: function (ev) { if (ev.target.value) m.y = ev.target.value; else delete m.y; touch(); } }));
    g.append(h("div", { class: "lab muted", text: "各列の答え" }), h("div", { class: "muted", text: "入力欄の候補は、全キャラの「同じ列」に今ある値です（自由に書き換えられます）" }), h("div", { class: "muted", text: "対象外" }));
    S.cols.concat([{ id: "ci", label: "コマンド表示用(ci)" }]).forEach(function (col) {
      var v = (m.a && m.a[col.id]) || "", ctrl;
      var offBox = h("label", { class: "chk off" }, h("input", { type: "checkbox", checked: (m.off || []).indexOf(col.id) >= 0 ? true : null, onchange: function (ev) { m.off = (m.off || []).filter(function (x) { return x !== col.id; }); if (ev.target.checked) m.off.push(col.id); touch(); } }), "対象外");
      if (col.id === "ci") offBox = h("span");
      if (MULTI[col.id]) {
        var ta = h("textarea", { rows: "2", oninput: function (ev) { setAns(m, col.id, ev.target.value); } }); ta.value = v;
        ctrl = h("div", null, ta, h("select", { onchange: function (ev) { if (!ev.target.value) return; ta.value = ta.value ? ta.value.replace(/\n+$/, "") + "\n" + ev.target.value : ev.target.value; ev.target.value = ""; setAns(m, col.id, ta.value); } },
          h("option", { value: "", text: "候補から行を追加…" }), choices(col.id).map(function (x) { return h("option", { value: x, text: x }); })));
      } else {
        var dlid = "dl-" + col.id, dl = document.getElementById(dlid);
        if (!dl) { dl = h("datalist", { id: dlid }); document.body.appendChild(dl); }
        if (dl.dataset.char !== c.id) { dl.replaceChildren.apply(dl, choices(col.id).map(function (x) { return h("option", { value: x }); })); dl.dataset.char = c.id; }
        ctrl = h("input", { list: dlid, value: v, oninput: function (ev) { setAns(m, col.id, ev.target.value); } });
      }
      field(col.label, ctrl, offBox);
    });
    // タグ
    var tg = h("div", { class: "tags" }), eff = effectiveTags(m), auto = autoTags(m), tokens = (m.t || "").split(/[,，\s]+/).filter(Boolean);
    var known = {}; S.tags.forEach(function (t) { known[t.id] = 1; }); EXTRA_T.forEach(function (t) { known[t[0]] = 1; });
    var stateOf = function (id) { return tokens.indexOf("-" + id) >= 0 ? "off" : tokens.indexOf(id) >= 0 ? "on" : "auto"; };
    var all = S.tags.map(function (t) { return [t.id, t.label, t.full]; }).concat(EXTRA_T.map(function (t) { return [t[0], t[1], t[1]]; }));
    all.forEach(function (t) {
      if (t[0] === "gn" || t[0] === "gu") return;     // 取得・消費は下の「取得・消費」欄（tg）で入れる
      var sel = h("select", { onchange: function (ev) { setTag(m, t[0], ev.target.value); } },
        h("option", { value: "auto", text: "自動" + (eff[t[0]] !== undefined ? "（いま" + (eff[t[0]] ? "付く" : "付かない") + "）" : "") }), h("option", { value: "on", text: "付ける" }), h("option", { value: "off", text: "外す" }));
      sel.value = stateOf(t[0]);
      tg.appendChild(h("div", { class: "t", title: t[2] }, sel, h("span", { text: t[1] + (auto[t[0]] ? "（自動判定あり）" : "") })));
    });
    g.append(h("div", { class: "lab", text: "タグ（t）" }), tg, h("span"));
    var other = tokens.filter(function (x) { return !known[x.replace(/^-/, "")]; }).join(",");
    field("その他のタグ指定", h("input", { value: other, placeholder: "例：dl,wy（上にない指定。英数字とカンマ）", onchange: function (ev) { setOtherTokens(m, ev.target.value); } }));
    var ta2 = h("textarea", { rows: "2", placeholder: "1行に1つ。例：スネークアイを取得／ガンマチャージを消費", oninput: function (ev) { var v = ev.target.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean).join("|"); if (v) m.tg = v; else delete m.tg; touch(); } });
    ta2.value = (m.tg || "").split("|").join("\n");
    field("取得・消費（tg）", ta2);
    field("強化状態（ss）", h("input", { value: m.ss || "", placeholder: "例：スネークアイ保有時", oninput: function (ev) { if (ev.target.value) m.ss = ev.target.value; else delete m.ss; touch(); } }));
    var bm = baseOf(c.id).moves.find(function (x) { return x.k === m.k; });
    return h("div", null, g, h("div", { class: "row", style: "margin-top:12px" },
      h("span", { class: "muted", text: "固定ID k=" + m.k + (bm ? "" : "（元データに無い新しい技）") }), h("span", { style: "flex:1" }),
      h("button", { type: "button", class: "btn", text: "↑", title: "上へ", disabled: i === 0, onclick: function () { move(i, -1); } }),
      h("button", { type: "button", class: "btn", text: "↓", title: "下へ", disabled: i === c.moves.length - 1, onclick: function () { move(i, 1); } }),
      h("button", { type: "button", class: "btn", text: "複製", onclick: function () { var n = clone(m); n.k = nextK(); n.name = m.name + "（コピー）"; c.moves.splice(i + 1, 0, n); c.sel = i + 1; touch(); renderEditor(); } }),
      bm ? h("button", { type: "button", class: "btn", text: "この技を元データに戻す", onclick: function () { if (confirm("この技を元データの内容に戻します。")) { c.moves[i] = clone(bm); touch(); renderEditor(); } } }) : null,
      h("button", { type: "button", class: "btn danger", text: "削除", onclick: function () { if (!confirm("「" + m.name + "」を削除します（保存・公開するまで反映されません）。")) return; c.moves.splice(i, 1); c.sel = Math.min(i, c.moves.length - 1); touch(); renderEditor(); } })));
  }
  function move(i, d) { var a = S.cur.moves, j = i + d; if (j < 0 || j >= a.length) return; var t = a[i]; a[i] = a[j]; a[j] = t; S.cur.sel = j; touch(); renderEditor(); }
  function autoTags(m) { try { var o = clone(m); delete o.t; var r = {}; S.win.moveInfo(o).tags.forEach(function (t) { r[t.id] = 1; }); return r; } catch (_) { return {}; } }
  function effectiveTags(m) { try { var r = {}; S.tags.forEach(function (t) { r[t.id] = false; }); S.win.moveInfo(clone(m)).tags.forEach(function (t) { r[t.id] = true; }); return r; } catch (_) { return {}; } }
  function setTag(m, id, state) {
    var tokens = (m.t || "").split(/[,，\s]+/).filter(Boolean).filter(function (x) { return x !== id && x !== "-" + id; });
    if (state === "on") tokens.push(id); else if (state === "off") tokens.push("-" + id);
    if (tokens.length) m.t = tokens.join(","); else delete m.t;
    touch(); renderEditor();
  }
  function setOtherTokens(m, text) {
    var known = {}; S.tags.forEach(function (t) { known[t.id] = 1; }); EXTRA_T.forEach(function (t) { known[t[0]] = 1; });
    var keep = (m.t || "").split(/[,，\s]+/).filter(Boolean).filter(function (x) { return known[x.replace(/^-/, "")]; });
    var extra = text.split(/[,，\s]+/).filter(Boolean);
    if (extra.some(function (x) { return !/^-?[A-Za-z0-9]+$/.test(x); })) { banner("warn", "タグ指定は、英数字とカンマ（先頭に - を付けると外す指定）だけで書いてください。"); return; }
    var all = extra.concat(keep); if (all.length) m.t = all.join(","); else delete m.t;
    touch(); renderEditor();
  }

  // ------------------------------------------------------------ プレビュー
  function schedulePreview(ms) { clearTimeout(S.pvTimer); S.pvTimer = setTimeout(postPreview, ms); }
  function postPreview() {
    var c = S.cur; if (!c) return;
    var msg = { type: "pt-preview", char: c.id, moves: c.moves };
    [S.win, S.spWin].forEach(function (w) { if (w) { try { w.postMessage(msg, location.origin); } catch (_) {} } });
  }

  // ------------------------------------------------------------ 管理者の一覧
  // Desktop: comparison table / Mobile: each account as a full-width card.
  // Keeping the toolbar mounted preserves the keyboard/focus while filtering on phones.
  var USERS_PAGE_SIZE = 50, usersRequest = 0, usersSearchTimer = null;
  var usersNote = function (kind, text) {
    if (S.usersMsg) S.usersMsg.replaceChildren(text ? h("div", { class: "banner " + kind, text: text }) : "");
  };
  async function copyAdminText(value, button) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      button.textContent = "コピー済み";
      button.setAttribute("aria-label", "コピーしました");
      setTimeout(function () {
        if (button.isConnected) { button.textContent = "コピー"; button.setAttribute("aria-label", "IDをコピー"); }
      }, 1600);
    } catch (_) { usersNote("err", "コピーできませんでした。IDを長押ししてコピーしてください。"); }
  }
  function copyUserIdButton(value, label) {
    var b = h("button", { type: "button", class: "btn pt-copy", "aria-label": label, title: label,
      text: "コピー", onclick: function () { copyAdminText(value, b); } });
    return b;
  }
  function identityStatus(u) {
    if (!u.tekken_id) return h("span", { class: "badge", text: "未連携" });
    return h("span", { class: u.tekken_id_enabled ? "badge pub" : "badge stale", text: u.tekken_id_enabled ? "有効" : "無効" });
  }
  function roleAction(u, mine) {
    if (u.is_admin && mine)
      return h("button", { type: "button", class: "btn", disabled: true, title: "自分自身の管理者権限は解除できません", text: "自分の権限は変更不可" });
    return u.is_admin
      ? h("button", { type: "button", class: "btn danger", "data-revoke": u.project_t_id, text: "管理者を解除",
          onclick: function () { changeRole(u.project_t_id, "revoke"); } })
      : h("button", { type: "button", class: "btn", "data-grant": u.project_t_id, text: "管理者にする",
          onclick: function () { changeRole(u.project_t_id, "grant"); } });
  }
  function userField(label, content, extraClass) {
    return h("div", { class: "pt-user-field" + (extraClass ? " " + extraClass : "") },
      h("dt", { text: label }), h("dd", null, content));
  }
  function userCard(u) {
    var mine = u.project_t_id === S.me.project_t_id;
    return h("article", { class: "pt-user-card", "aria-label": (u.display_name || "名前なし") + " のアカウント" },
      h("div", { class: "pt-user-head" },
        h("div", null, h("div", { class: "pt-user-name", text: u.display_name || "（名前なし）" }),
          mine ? h("div", { class: "pt-user-self", text: "ログイン中のアカウント" }) : null),
        h("span", { class: u.is_admin ? "badge pub" : "badge", text: u.is_admin ? "管理者" : "一般" })),
      h("dl", { class: "pt-user-fields" },
        userField("TEKKEN ID", h("div", { class: "pt-user-id-row" },
          u.tekken_id ? h("code", { text: u.tekken_id }) : h("span", { class: "muted", text: "未連携" }),
          u.tekken_id ? identityStatus(u) : null,
          u.tekken_id ? copyUserIdButton(u.tekken_id, "TEKKEN IDをコピー") : null)),
        userField("PROJECT T ID", h("div", { class: "pt-user-id-row" },
          h("code", { text: u.project_t_id }), copyUserIdButton(u.project_t_id, "PROJECT T IDをコピー"))),
        h("div", { class: "pt-user-extra" },
          userField("ログイン方法", u.providers && u.providers.length ? u.providers.join("・") : "不明"),
          userField("登録日", fmtAt(u.created_at) || "不明"))),
      h("div", { class: "pt-user-action" }, roleAction(u, mine)));
  }
  function userRow(u) {
    var mine = u.project_t_id === S.me.project_t_id;
    return h("tr", null,
      h("td", null, h("code", { text: u.project_t_id })),
      h("td", null, u.tekken_id ? h("code", { text: u.tekken_id }) : h("span", { class: "muted", text: "未連携" })),
      h("td", null, identityStatus(u)),
      h("td", { text: u.display_name || "（名前なし）" }),
      h("td", { text: (u.providers || []).join("・") }),
      h("td", { text: fmtAt(u.created_at) }),
      h("td", null, h("span", { class: u.is_admin ? "badge pub" : "badge", text: u.is_admin ? "管理者" : "一般" })),
      h("td", null, roleAction(u, mine)));
  }
  function buildUsersUI() {
    var input = h("input", { type: "search", id: "ptUsersSearch", autocomplete: "off",
      placeholder: "PROJECT T ID・TEKKEN ID・名前", "aria-label": "ユーザーを検索",
      oninput: function (ev) {
        S.usersQuery = ev.target.value.trim();
        S.usersOffset = 0;
        clearTimeout(usersSearchTimer);
        usersSearchTimer = setTimeout(function () { loadUsers(); }, 320);
      },
      onkeydown: function (ev) {
        if (ev.key === "Enter") {
          ev.preventDefault(); clearTimeout(usersSearchTimer);
          S.usersQuery = ev.target.value.trim(); S.usersOffset = 0;
          loadUsers();
        }
      } });
    input.value = S.usersQuery || "";
    var grantInput = h("input", { type: "text", id: "grantId", autocomplete: "off",
      placeholder: "PROJECT T ID（36文字）", "aria-label": "管理者にするPROJECT T ID" });
    var grantBtn = h("button", { type: "button", class: "btn", id: "grantBtn", text: "管理者権限を付与",
      onclick: function () { var v = grantInput.value.trim(); if (v) changeRole(v, "grant"); } });
    grantInput.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); grantBtn.click(); } });
    var counter = h("span", { class: "pt-users-count" });
    var warning = h("div", { class: "banner warn", id: "adminCountWarn", hidden: true });
    var message = h("div", { id: "usersMsg", role: "status", "aria-live": "polite" });
    var resultLabel = h("p", { class: "pt-users-result-label", role: "status" });
    var tableBody = h("tbody");
    var table = h("table", { "aria-label": "管理者とTEKKEN IDの一覧" },
      h("thead", null, h("tr", null,
        ["PROJECT T ID", "TEKKEN ID", "連携状態", "名前", "ログイン方法", "登録日", "権限", "操作"].map(function (t) { return h("th", { text: t }); }))),
      tableBody);
    var cards = h("div", { class: "pt-users-cards", "aria-label": "ユーザー一覧" });
    var empty = h("p", { class: "pt-users-empty", hidden: true, text: "該当するユーザーはいません。" });
    var pages = h("div", { class: "pt-users-pagination" });
    S.usersMsg = message;
    S.usersUI = { search: input, count: counter, warn: warning, msg: message,
      label: resultLabel, tbody: tableBody, cards: cards, empty: empty, pages: pages };
    sec.users.replaceChildren(h("div", { class: "card" },
      h("div", { class: "pt-users-title" }, h("h2", { text: "ユーザー管理" }), counter),
      warning, message,
      h("div", { class: "pt-users-controls" },
        h("div", { class: "pt-users-search" }, h("label", { for: "ptUsersSearch", text: "ユーザーを検索" }), input),
        h("details", { class: "pt-users-grant" },
          h("summary", { text: "管理者を追加する" }),
          h("div", { class: "row" }, grantInput, grantBtn))),
      h("details", { class: "pt-users-policy" },
        h("summary", { text: "管理者の運用ルール" }),
        h("p", { text: "管理者アカウントは二段階認証（2FA）を有効にし、アカウントを共有せず、必要以上に権限を付与しないでください。自分自身と最後の管理者は解除できません。" })),
      resultLabel,
      h("div", { class: "pt-users-desktop tw" }, table), cards, empty, pages));
  }
  async function loadUsers(q, keepNote, offset) {
    if (!S.usersUI) buildUsersUI();
    if (typeof q === "string") {
      S.usersQuery = q.trim();
      S.usersOffset = 0;
      S.usersUI.search.value = q;
    }
    if (typeof offset === "number") S.usersOffset = Math.max(0, offset);
    if (!keepNote) usersNote("", "");
    var ui = S.usersUI, seq = ++usersRequest;
    ui.label.textContent = "ユーザーを読み込み中…";
    var query = (S.usersQuery || "").slice(0, 64), skip = S.usersOffset || 0;
    try {
      var url = "/api/v1/admin/users?limit=" + USERS_PAGE_SIZE + "&offset=" + skip + (query ? "&q=" + encodeURIComponent(query) : "");
      var r = await api(url);
      if (seq !== usersRequest) return;
      ui.count.textContent = query ? "検索結果 " + r.total + " 人 ／ 管理者 " + r.admins + " 人" : "登録 " + r.total + " 人 ／ 管理者 " + r.admins + " 人";
      ui.warn.hidden = r.admins >= 2;
      if (!ui.warn.hidden) ui.warn.textContent = "管理者が" + r.admins + "人だけです。予備の管理者をもう1人置くことをおすすめします。";
      ui.tbody.replaceChildren.apply(ui.tbody, r.users.map(userRow));
      ui.cards.replaceChildren.apply(ui.cards, r.users.map(userCard));
      ui.empty.hidden = r.users.length !== 0;
      ui.label.textContent = r.total ? (skip + 1) + "～" + (skip + r.users.length) + " 件を表示（全 " + r.total + " 件）" : "検索結果はありません";
      var page = Math.floor(skip / USERS_PAGE_SIZE) + 1, totalPages = Math.max(1, Math.ceil(r.total / USERS_PAGE_SIZE));
      ui.pages.replaceChildren(
        h("button", { type: "button", class: "btn", disabled: skip === 0, text: "前のページ",
          onclick: function () { loadUsers(undefined, false, skip - USERS_PAGE_SIZE); } }),
        h("span", { class: "muted", text: page + " / " + totalPages + " ページ" }),
        h("button", { type: "button", class: "btn", disabled: skip + r.users.length >= r.total, text: "次のページ",
          onclick: function () { loadUsers(undefined, false, skip + USERS_PAGE_SIZE); } }));
    } catch (e) {
      if (seq === usersRequest) {
        ui.label.textContent = "ユーザーを取得できませんでした";
        usersNote("err", e.message);
      }
    }
  }
  // 付与・解除前には対象アカウントを必ずサーバーから読み直す。
  async function changeRole(pid, act) {
    var u;
    try { u = await api("/api/v1/admin/users/" + encodeURIComponent(pid)); }
    catch (e) { return usersNote("err", e.status === 404 ? "その PROJECT T ID のユーザーは見つかりませんでした。" : e.message); }
    var has = function (p) { return (u.providers || []).indexOf(p) >= 0 ? "連携あり" : "連携なし"; };
    var others = (u.providers || []).filter(function (p) { return p !== "discord" && p !== "google"; });
    var dl = h("dl", { class: "who-dl", id: "targetInfo" },
      h("dt", { text: "PROJECT T ID" }), h("dd", null, h("code", { text: u.project_t_id })),
      h("dt", { text: "TEKKEN ID" }), h("dd", { text: u.tekken_id || "未連携" }),
      h("dt", { text: "連携状態" }), h("dd", { text: u.tekken_id ? (u.tekken_id_enabled ? "有効" : "無効") : "未連携" }),
      h("dt", { text: "表示名" }), h("dd", { text: u.display_name || "（名前なし）" }),
      h("dt", { text: "Discord" }), h("dd", { text: has("discord") }),
      h("dt", { text: "Google" }), h("dd", { text: has("google") }),
      others.length ? [h("dt", { text: "その他" }), h("dd", { text: others.join("・") })] : null,
      h("dt", { text: "いまの権限" }), h("dd", { text: u.is_admin ? "管理者" : "一般" }));
    if (act === "grant" && u.is_admin) return usersNote("ok", "このユーザーは、すでに管理者です。");
    if (act === "revoke" && !u.is_admin) return usersNote("ok", "このユーザーは、管理者ではありません。");
    var ok = act === "grant"
      ? await confirmModal("管理者権限の付与", [MSG_GRANT_CONFIRM, dl, "管理者は技チェックシートを編集・公開できます。付与先は二段階認証（2FA）を有効にしたアカウントにしてください。"], "管理者権限を付与する", true)
      : await confirmModal("管理者権限の解除", ["このユーザーから管理者権限を外しますか？", dl], "管理者権限を解除する", true);
    if (!ok) return;
    try {
      var result = await api("/api/v1/admin/users/" + encodeURIComponent(u.project_t_id) + "/" + act, { method: "POST" });
      usersNote("ok", result.changed ? (act === "grant" ? "管理者にしました。" : "管理者から外しました。") : "変更はありませんでした（すでにその状態です）。");
    } catch (e) { usersNote("err", e.message); }
    loadUsers(undefined, true);
  }

  // ------------------------------------------------------------ 操作の記録
  async function loadAudit() {
    var box = sec.audit; box.replaceChildren(h("div", { class: "muted", text: "読み込み中…" }));
    try {
      var r = await api("/api/v1/admin/audit?limit=200"), tb = h("tbody");
      r.entries.forEach(function (a) {
        var det = a.details ? Object.keys(a.details).map(function (k) { return k + "=" + a.details[k]; }).join(" ") : "";
        var tr = h("tr", null, h("td", { text: fmtAt(a.at) }), h("td", { text: ACTION_JA[a.action] || a.action }), h("td", null, h("code", { text: shortId(a.actor) })),
          h("td", null, a.target ? h("code", { text: shortId(a.target) }) : ""), h("td", { text: (a.object_type || "") + (a.object_id && a.object_type === "checksheet" ? "：" + a.object_id : "") }), h("td", { text: det }));
        ["日時","操作","した人","された人","対象","詳細"].forEach(function (label, i) { tr.children[i].dataset.label = label; });
        tb.appendChild(tr);
      });
      box.replaceChildren(h("div", { class: "card" }, h("b", { text: "操作の記録（新しい順・最大200件）" }),
        h("div", { class: "tw" }, h("table", { class: "pt-mobile-table" }, h("thead", null, h("tr", null, ["日時", "操作", "した人", "された人", "対象", "詳細"].map(function (t) { return h("th", { text: t }); }))), tb))));
    } catch (e) { box.replaceChildren(h("div", { class: "banner err", text: e.message })); }
  }

  boot();
})();
