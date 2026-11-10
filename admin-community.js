/* PROJECT T 管理者ページ：プレイヤー管理／トーナメント管理（大会結果・イベントカレンダー）。ローカル保存のみ。
   - データの形は、公開テスト版（PROJECT_T_PC_PLAYERS_GEMINI_IMPORT_TEST）の DATA / SEED と同じ。読めない項目も、消さずにそのまま持ち回る
   - 下書きは localStorage「PROJECT_T_ADMIN_COMMUNITY_DRAFT_V1」。保存の前に検証し、保存に失敗したら変更を取り消す（保存できたように見せない）
   - 本番のサーバー・公開サイトには、いっさい接続しない（サーバー連携は別段階） */
(function () {
  "use strict";
  var KEY = "PROJECT_T_ADMIN_COMMUNITY_DRAFT_V1", BKEY = KEY + "_BACKUP";
  var CC_RE = /^[A-Z]{2}$/, ID_RE = /^[a-z0-9][a-z0-9_-]{0,47}$/, VERIF = ["unverified", "partial", "verified"];
  var VLABEL = { unverified: "未確認", partial: "一部確認", verified: "確認済み" };
  var PCATS = ["pro", "streamer"], PCLABEL = { pro: "PRO", streamer: "STREAMER" };   // 公開ページの PRO / STREAMER 区分
  /* SNS・配信サイト：決まった種類（1種類につき1件までは socials の中に、同じ種類の2件目以降と「その他」は socials.others に入れる） */
  var SOC = [["x", "X"], ["youtube", "YouTube"], ["twitch", "Twitch"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["niconico", "ニコニコ"], ["bluesky", "Bluesky"], ["facebook", "Facebook"], ["discord", "Discord"], ["kick", "Kick"], ["website", "ホームページ・ブログ"]];
  var SOC_MAX = 20, SOC_LABEL_MAX = 24;
  function socName(k) { for (var i = 0; i < SOC.length; i++) if (SOC[i][0] === k) return SOC[i][1]; return ""; }
  /* 保存形式（socials）→ 編集画面の行 */
  function socRows(socials) {
    var so = socials || {}, rows = [];
    SOC.forEach(function (s) { if (so[s[0]]) rows.push({ k: s[0], label: so[s[0] + "_label"] || "", url: so[s[0]], ver: so[s[0] + "_verification"] === "verified" ? "verified" : "" }); });
    (Array.isArray(so.others) ? so.others : []).forEach(function (o) { if (o && o.url) rows.push({ k: socName(o.platform) ? o.platform : "other", label: o.label || "", url: o.url, ver: o.verification === "verified" ? "verified" : "" }); });
    return rows;
  }
  /* 編集画面の行 → 保存形式。入力のないSNSは消える。元の socials にある、このSNS欄以外の項目はそのまま残す */
  function socPack(rows, old) {
    var out = Object.assign({}, old || {}); delete out.others;
    SOC.forEach(function (s) { delete out[s[0]]; delete out[s[0] + "_verification"]; delete out[s[0] + "_label"]; });
    var others = [];
    rows.forEach(function (r) {
      var u = String(r.url || "").trim(), lab = String(r.label || "").trim(), ver = r.ver === "verified" ? "verified" : "source-unverified"; if (!u) return;
      if (r.k !== "other" && socName(r.k) && !out[r.k]) { out[r.k] = u; out[r.k + "_verification"] = ver; if (lab) out[r.k + "_label"] = lab; }
      else others.push({ platform: socName(r.k) ? r.k : "other", label: lab, url: u, verification: ver });
    });
    if (others.length) out.others = others;
    return out;
  }
  var ST = null, ctx = { characters: function () { return []; } }, loadNote = "", ui = {};

  /* ---------- 小道具 ---------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (k === "class") e.className = v; else if (k === "text") e.textContent = v; else if (k.slice(0, 2) === "on") e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, ""); else if (v !== false && v != null) e.setAttribute(k, v);
    });
    [].concat(kids == null ? [] : kids).forEach(function (c) { if (c != null) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function btn(t, fn, cls) { return h("button", { type: "button", class: "btn" + (cls ? " " + cls : ""), onclick: fn, text: t }); }
  function lines(s) { return String(s || "").split(/\r?\n|,|、/).map(function (x) { return x.trim(); }).filter(Boolean); }
  function nowIso() { return new Date().toISOString(); }
  function isDate(s, loose) {
    var m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(String(s || "")); if (!m) return false;
    if (!loose && !m[3]) return false;
    var mo = m[2] ? +m[2] : 1, d = m[3] ? +m[3] : 1; if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
    var t = new Date(Date.UTC(+m[1], mo - 1, d)); return t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
  }
  function safeUrl(u) { try { return new URL(u).protocol === "https:"; } catch (e) { return false; } }
  function download(name, obj) {
    var a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" })), download: name });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function badge(v) { return h("span", { class: "pt-cm-badge v-" + (VERIF.indexOf(v) >= 0 ? v : "unverified"), text: VLABEL[v] || "未確認" }); }

  /* ---------- データの形 ---------- */
  /* ---------- サムネイル（公開ページの選手一覧に出る四角い画像。画像が無いときは文字） ---------- */
  var THUMB_RE = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+\/=]+$/, THUMB_MAX = 120000;
  function initials(p) { var t = String(p.thumbText == null ? "" : p.thumbText).trim(); return t || String(p.name || "").slice(0, 2).toUpperCase(); }
  function thumbEl(p, big) {
    var e = h("span", { class: "pt-cm-thumb" + (big ? " big" : ""), "aria-hidden": "true" });
    if (p.thumbnail && THUMB_RE.test(p.thumbnail)) { e.classList.add("has-img"); e.appendChild(h("img", { src: p.thumbnail, alt: "" })); } else e.textContent = initials(p);
    return e;
  }
  function emptyState() { return { schema: 1, meta: {}, countries: {}, regions: [], players: [], tournaments: [], events: [], calendar: { sources: [] } }; }
  function playerCat(p) { return p.category === "pro" ? "pro" : "streamer"; }
  function playerVerif(p) { return VERIF.indexOf(p.verification) >= 0 ? p.verification : (p.sourceUnverified === false ? "verified" : "unverified"); }
  function effEvent(e) { return Object.assign({}, e, e.override || {}); }
  function refsOf(pid) {
    return ST.tournaments.filter(function (t) { return (t.placements || []).some(function (x) { return x.playerId === pid; }); });
  }

  /* ---------- 検証（読込・保存の前に必ず通す） ---------- */
  function validate(S) {
    var er = [], ids = {};
    function dup(kind, list) { var seen = {}; list.forEach(function (x, i) { var id = x && x.id; if (!ID_RE.test(String(id))) er.push(kind + (i + 1) + "番目：IDが不正です（半角の英小文字・数字・-_、48文字まで）：" + id); else if (seen[id]) er.push(kind + "のIDが重複しています：" + id); seen[id] = 1; }); return seen; }
    if (!S || typeof S !== "object" || !Array.isArray(S.players) || !Array.isArray(S.tournaments) || !Array.isArray(S.events)) return ["データの構造が正しくありません（players / tournaments / events の配列が必要です）"];
    var pids = dup("プレイヤー", S.players); dup("大会", S.tournaments); dup("イベント", S.events);
    var cc = S.countries || {};
    S.players.forEach(function (p) {
      var n = "プレイヤー「" + p.id + "」";
      if (!p.name || typeof p.name !== "string") er.push(n + "：登録名がありません");
      if (p.country && !CC_RE.test(p.country)) er.push(n + "：国コードが不正です（英大文字2文字）：" + p.country);
      if (p.characters != null && !Array.isArray(p.characters)) er.push(n + "：使用キャラクターが配列ではありません");
      if (p.sources != null && !Array.isArray(p.sources)) er.push(n + "：情報源が配列ではありません");
      (p.sources || []).forEach(function (u) { if (!safeUrl(u)) er.push(n + "：情報源のURLが https ではありません：" + u); });
      if (p.verification != null && VERIF.indexOf(p.verification) < 0) er.push(n + "：情報確認状態が不正です：" + p.verification);
      if (p.category != null && PCATS.indexOf(p.category) < 0) er.push(n + "：カテゴリが不正です（pro か streamer）：" + p.category);
      if (p.categoryBasis != null && (typeof p.categoryBasis !== "string" || p.categoryBasis.length > 200)) er.push(n + "：カテゴリの根拠メモは200文字までです");
      if (p.verification === "verified" && !(p.sources || []).length) er.push(n + "：「確認済み」にするには、情報源が1件以上必要です");
      if (p.thumbnail != null && p.thumbnail !== "" && (typeof p.thumbnail !== "string" || !THUMB_RE.test(p.thumbnail) || p.thumbnail.length > THUMB_MAX)) er.push(n + "：サムネイル画像の形式が正しくありません（webp / jpeg / png、約90KBまで）");
      if (p.thumbText != null && (typeof p.thumbText !== "string" || p.thumbText.length > 4)) er.push(n + "：サムネイルの表示文字は4文字までです");
      SOC.forEach(function (s) { var u = p.socials && p.socials[s[0]]; if (u && !safeUrl(u)) er.push(n + "：" + s[1] + "のURLが https ではありません"); if (p.socials && p.socials[s[0] + "_verification"] === "verified" && !u) er.push(n + "：" + s[1] + "が「確認済み」ですがURLがありません"); });
      if (p.socials && p.socials.others != null) {
        if (!Array.isArray(p.socials.others)) er.push(n + "：SNSの追加分（others）が配列ではありません");
        else {
          if (p.socials.others.length + SOC.filter(function (s) { return p.socials[s[0]]; }).length > SOC_MAX) er.push(n + "：SNSは" + SOC_MAX + "件までです");
          p.socials.others.forEach(function (o, i) {
            var m = n + "：追加したSNS " + (i + 1) + "件目";
            if (!o || typeof o !== "object") { er.push(m + "の形が正しくありません"); return; }
            if (!o.url || !safeUrl(o.url)) er.push(m + "のURLが https ではありません");
            if ((o.platform === "other" || !socName(o.platform)) && !String(o.label || "").trim()) er.push(m + "（その他）には表示名が必要です");
            if (o.label != null && String(o.label).length > SOC_LABEL_MAX) er.push(m + "の表示名は" + SOC_LABEL_MAX + "文字までです");
          });
        }
      }
      SOC.forEach(function (s) { if (p.socials && p.socials[s[0] + "_label"] != null && String(p.socials[s[0] + "_label"]).length > SOC_LABEL_MAX) er.push(n + "：" + s[1] + "の表示名は" + SOC_LABEL_MAX + "文字までです"); });
    });
    S.tournaments.forEach(function (t) {
      var n = "大会「" + t.id + "」", seen = {}, tie = {};
      if (!t.name) er.push(n + "：大会名がありません");
      if (!isDate(t.date, true)) er.push(n + "：開催日が不正です（YYYY / YYYY-MM / YYYY-MM-DD）：" + t.date);
      if (t.country && !CC_RE.test(t.country)) er.push(n + "：国コードが不正です（英大文字2文字）：" + t.country);
      if (t.source && !safeUrl(t.source)) er.push(n + "：公式結果URLが https ではありません");
      if (!Array.isArray(t.placements)) { er.push(n + "：placements が配列ではありません"); return; }
      t.placements.forEach(function (x, i) {
        if (!(Number.isInteger(x.rank) && x.rank >= 1)) er.push(n + "：" + (i + 1) + "行目の順位が不正です");
        if (x.playerId) { if (!pids[x.playerId]) er.push(n + "：登録されていない選手IDです：" + x.playerId); if (seen[x.playerId]) er.push(n + "：同じ選手が2回入っています：" + x.playerId); seen[x.playerId] = 1; }
        else if (!x.playerName) er.push(n + "：" + (i + 1) + "行目に選手がありません");
      });
    });
    S.events.forEach(function (e0) {
      var e = effEvent(e0), n = "イベント「" + e0.id + "」";
      if (!e.name) er.push(n + "：イベント名がありません");
      if (!isDate(e.start_date)) er.push(n + "：開始日が不正です（YYYY-MM-DD）：" + e.start_date);
      if (e.end_date && (!isDate(e.end_date) || e.end_date < e.start_date)) er.push(n + "：終了日が不正です");
      if (e.start_time_jst && !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.start_time_jst)) er.push(n + "：開始時刻が不正です（HH:MM）");
      if (e.source_url && !safeUrl(e.source_url)) er.push(n + "：公式ページURLが https ではありません");
      if (e.country && !CC_RE.test(e.country)) er.push(n + "：国コードが不正です（英大文字2文字）：" + e.country);
    });
    return er;
  }

  /* ---------- 保存（下書き） ---------- */
  function readRaw() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function persist(S) {
    var s = JSON.stringify(Object.assign({ savedAt: nowIso() }, S)), old = readRaw();
    try {
      if (old) localStorage.setItem(BKEY, old);          // 書き換える前の状態を、1世代だけ残す
      localStorage.setItem(KEY, s);
      if (localStorage.getItem(KEY) !== s) throw new Error("書き込みを確認できませんでした");
      return null;
    } catch (e) { try { if (old) localStorage.setItem(KEY, old); } catch (e2) {} return e && e.message ? e.message : String(e); }
  }
  /* 下書きが PRO / STREAMER の区分を持たない古い形のとき、保存済みの登録内容（seed）の区分をこの画面の中だけで補う（保存は次に変更したとき） */
  function fillCats(S) {
    var seed = window.PT_COMMUNITY_SEED; if (!seed || !Array.isArray(seed.players) || !S || !Array.isArray(S.players)) return;
    var m = {}; seed.players.forEach(function (p) { if (p && PCATS.indexOf(p.category) >= 0) m[p.id] = p; });
    S.players.forEach(function (p) { if (p && PCATS.indexOf(p.category) < 0 && m[p.id]) { p.category = m[p.id].category; if (m[p.id].categoryBasis && !p.categoryBasis) p.categoryBasis = m[p.id].categoryBasis; } });
  }
  function boot() {
    var raw = readRaw(), seed = window.PT_COMMUNITY_SEED;
    if (raw) {
      try { var j = JSON.parse(raw), er = validate(j); if (!er.length) { ST = j; fillCats(ST); loadNote = "端末内の下書きを読み込みました。"; return; } loadNote = "下書きに問題があるため、保存済みの登録内容で開きました（" + er[0] + "）。「直前に戻す」で直前の下書きを復元できます。"; }
      catch (e) { loadNote = "下書きを読めなかったため、保存済みの登録内容で開きました。「直前に戻す」で直前の下書きを復元できます。"; }
    }
    ST = seed ? clone(seed) : emptyState();
    if (!raw) loadNote = seed ? "登録内容を読み込みました。" : "登録データがありません。JSONを読み込んでください。";
  }
  function commit(fn, ok) {            // 変更→検証→保存。どれかに失敗したら、変更を取り消す
    var snap = clone(ST), next = clone(ST);
    try { fn(next); } catch (e) { say(String(e.message || e), "error"); return false; }
    var er = validate(next);
    if (er.length) { say("保存できません：" + er.slice(0, 5).join(" / ") + (er.length > 5 ? " ほか" + (er.length - 5) + "件" : ""), "error"); return false; }
    var pe = persist(next);
    if (pe) { ST = snap; say("保存に失敗しました。変更は取り消しました：" + pe, "error"); return false; }
    ST = next; say(ok || "保存しました（この端末の下書き）。", "ok"); return true;
  }
  function say(t, state) { Object.keys(ui).forEach(function (k) { if (ui[k] && ui[k].note) { ui[k].note.textContent = t; ui[k].note.dataset.state = state || "neutral"; } }); }

  /* ---------- JSON の読込（構造・ID・参照を検証してから反映） ---------- */
  function normalizeImport(j, kind) {
    var out = {};
    if (Array.isArray(j)) out[kind] = j;
    else if (j && typeof j === "object") {
      ["players", "tournaments", "events"].forEach(function (k) { if (Array.isArray(j[k])) out[k] = j[k]; });
      ["countries", "regions"].forEach(function (k) { if (j[k]) out[k] = j[k]; });
      if (j.calendar) out.calendar = j.calendar;
      if (kind === "events" && j.sources && !j.calendar) out.calendar = { sources: j.sources };
      if (!out[kind] && Array.isArray(j.items)) out[kind] = j.items;
    }
    return out;
  }
  function importFile(kind, file, after) {
    var fr = new FileReader();
    fr.onerror = function () { say("ファイルを読めませんでした。", "error"); };
    fr.onload = function () {
      var j; try { j = JSON.parse(String(fr.result)); } catch (e) { say("読み込めません：JSONとして正しくありません（" + e.message + "）。データは変わっていません。", "error"); return; }
      var inc = normalizeImport(j, kind);
      if (!inc[kind]) { say("読み込めません：" + kind + " の配列が見つかりません。データは変わっていません。", "error"); return; }
      var next = clone(ST); ["players", "tournaments", "events"].forEach(function (k) { if (inc[k]) next[k] = inc[k]; });
      if (inc.countries && typeof inc.countries === "object") next.countries = Object.assign({}, next.countries, inc.countries);
      if (inc.regions) next.regions = inc.regions; if (inc.calendar) next.calendar = Object.assign({}, next.calendar, inc.calendar);
      var er = validate(next);
      if (er.length) { say("読み込めません（" + er.length + "件の問題。データは変わっていません）：" + er.slice(0, 4).join(" / "), "error"); return; }
      var msg = "「" + file.name + "」を読み込みます。\n" + Object.keys(inc).filter(function (k) { return Array.isArray(inc[k]); }).map(function (k) { return k + "：" + ST[k].length + " → " + inc[k].length + " 件"; }).join("\n") + "\n\n現在の内容は置き換わります（直前の状態は「直前に戻す」で復元できます）。よろしいですか？";
      if (!confirm(msg)) return;
      if (commit(function (n) { Object.keys(next).forEach(function (k) { n[k] = next[k]; }); }, "読み込みました。")) after();
    };
    fr.readAsText(file);
  }
  function filePick(text, kind, after) {
    var inp = h("input", { type: "file", accept: ".json,application/json", hidden: true, onchange: function () { var f = inp.files && inp.files[0]; inp.value = ""; if (f) importFile(kind, f, after); } });
    return h("label", { class: "btn" }, [h("span", { text: text }), inp]);
  }
  function restoreBtn(after) {
    return btn("直前に戻す", function () {
      var b; try { b = localStorage.getItem(BKEY); } catch (e) { b = null; }
      if (!b) { say("戻せる下書きがありません。", "error"); return; }
      var j; try { j = JSON.parse(b); } catch (e) { say("直前の下書きを読めませんでした。", "error"); return; }
      var er = validate(j); if (er.length) { say("直前の下書きに問題があり、戻せません：" + er[0], "error"); return; }
      if (!confirm("直前の下書きに戻します。いまの内容は置き換わります。よろしいですか？")) return;
      if (commit(function (n) { Object.keys(j).forEach(function (k) { if (k !== "savedAt") n[k] = j[k]; }); }, "直前の下書きに戻しました。")) after();
    });
  }
  function exportSet(after) {
    var wrap = h("span", { class: "pt-cm-exp" });
    wrap.append(
      btn("players.json", function () { download("players.json", { schema: 1, players: ST.players, countries: ST.countries, regions: ST.regions, meta: ST.meta }); }),
      btn("tournaments.json", function () { download("tournaments.json", { schema: 1, tournaments: ST.tournaments }); }),
      btn("calendar-events.json", function () { download("calendar-events.json", Object.assign({ schema: 1 }, ST.calendar, { events: ST.events })); }),
      btn("全部まとめて", function () { download("community-all.json", Object.assign({ savedAt: nowIso() }, ST)); }));
    return wrap;
  }

  /* ---------- 一覧の共通部品 ---------- */
  function sel(options, value, onchange, allLabel) {
    var s = h("select", { onchange: onchange });
    if (allLabel) s.appendChild(h("option", { value: "", text: allLabel }));
    options.forEach(function (o) { s.appendChild(h("option", { value: o[0], text: o[1] })); });
    s.value = value || ""; return s;
  }
  function allCountries() {
    var set = Object.assign({}, ST.countries); ST.players.concat(ST.tournaments, ST.events.map(effEvent)).forEach(function (x) { if (x.country && CC_RE.test(x.country)) set[x.country] = set[x.country] || x.country; });
    return Object.keys(set).sort().map(function (c) { return [c, cname(c)]; });
  }
  function cname(c) { return (ST.countries[c] || c || "未登録") + (c ? "（" + c + "）" : ""); }
  function field(label, input, hint) { return h("label", { class: "pt-cm-f" }, [h("span", { text: label }), input, hint ? h("small", { text: hint }) : null]); }
  function inp(v, o) { var e = h("input", Object.assign({ type: "text", value: v == null ? "" : v }, o || {})); return e; }
  function rowsEditor(items, make, add, addLabel) {   // 行を足す・消す形の入力欄
    var box = h("div", { class: "pt-cm-rows" });
    function draw() {
      box.replaceChildren();
      items.forEach(function (it, i) { var r = h("div", { class: "pt-cm-row" }, make(it, i)); r.appendChild(btn("削除", function () { items.splice(i, 1); draw(); }, "danger")); box.appendChild(r); });
      box.appendChild(btn(addLabel, function () { items.push(add()); draw(); }));
    }
    draw(); return box;
  }

  /* ================= プレイヤー管理 ================= */
  var PF = { q: "", country: "", team: "", verif: "", cat: "", hidden: false };
  function mountPlayers(el, context) {
    ctx = context || ctx; if (!ST) boot(); var U = ui.p = { root: el, note: h("p", { role: "status", "aria-live": "polite", text: loadNote }) }; drawPlayers();
  }
  function drawPlayers() {
    var el = ui.p.root, list = ST.players; el.replaceChildren();
    var card = h("section", { class: "card" }); card.appendChild(h("h2", { text: "プレイヤー管理" }));
    card.appendChild(h("p", { class: "pt-cm-sub", text: "変更はこの端末の下書きに保存されます。公開サイトには自動では反映されません。" }));
    var bar = h("div", { class: "pt-cm-bar" });
    var q = h("input", { type: "search", placeholder: "名前・IDで検索", value: PF.q, oninput: function () { PF.q = q.value; drawRows(); } });
    var teams = Array.from(new Set(list.map(function (p) { return p.teamFromSource; }).filter(Boolean))).sort().map(function (t) { return [t, t]; });
    var cs = Array.from(new Set(list.map(function (p) { return p.country; }).filter(Boolean))).sort().map(function (c) { return [c, cname(c)]; });
    bar.append(q, sel(cs, PF.country, function (e) { PF.country = e.target.value; drawRows(); }, "すべての国・地域"), sel(teams, PF.team, function (e) { PF.team = e.target.value; drawRows(); }, "すべての所属"),
      sel(PCATS.map(function (c) { return [c, PCLABEL[c]]; }), PF.cat, function (e) { PF.cat = e.target.value; drawRows(); }, "PRO / STREAMER すべて"),
      sel(VERIF.map(function (v) { return [v, VLABEL[v]]; }), PF.verif, function (e) { PF.verif = e.target.value; drawRows(); }, "すべての確認状態"),
      h("label", { class: "pt-cm-chk" }, [h("input", { type: "checkbox", checked: PF.hidden, onchange: function (e) { PF.hidden = e.target.checked; drawRows(); } }), " 非表示も表示"]));
    card.appendChild(bar);
    var bar2 = h("div", { class: "pt-cm-bar" }); bar2.append(btn("新規登録", function () { editPlayer(null); }, "primary"), btn("並び順を入れ替える", function () { reorderPlayers(PF.country || ""); }), filePick("JSON読込", "players", drawPlayers), restoreBtn(drawPlayers), exportSet());
    card.appendChild(bar2);
    var count = h("p", { class: "pt-cm-count" }), tbl = h("table", { class: "pt-cm-tbl" }); var body = h("tbody");
    tbl.appendChild(h("thead", {}, h("tr", {}, ["名前", "国・地域", "PRO / STREAMER", "所属", "使用キャラクター", "確認状態", ""].map(function (t) { return h("th", { text: t }); })))); tbl.appendChild(body);
    function drawRows() {
      body.replaceChildren(); var qq = PF.q.trim().toLowerCase(), n = 0;
      list.forEach(function (p) {
        if (p.hidden && !PF.hidden) return; if (PF.country && p.country !== PF.country) return; if (PF.team && p.teamFromSource !== PF.team) return; if (PF.verif && playerVerif(p) !== PF.verif) return; if (PF.cat && playerCat(p) !== PF.cat) return;
        if (qq && ![p.id, p.name].concat(p.aliases || []).join(" ").toLowerCase().includes(qq)) return; n++;
        var chars = (p.characters || []).map(function (c) { return h("span", { class: "pt-cm-chip" + (c.verification === "unverified" || !c.verification ? " unv" : ""), text: c.name }); });
        body.appendChild(h("tr", { class: p.hidden ? "is-hidden" : "" }, [
          h("td", {}, [h("div", { class: "pt-cm-namecell" }, [thumbEl(p), h("span", {}, [h("strong", { text: p.name }), h("small", { text: " " + p.id })])])]), h("td", { text: cname(p.country) }), h("td", {}, h("span", { class: "pt-cm-badge cat-" + playerCat(p), text: PCLABEL[playerCat(p)] })), h("td", { text: p.teamFromSource || "—" }),
          h("td", {}, chars.length ? chars : [h("small", { text: "未登録" })]), h("td", {}, badge(playerVerif(p))),
          h("td", { class: "pt-cm-act" }, [btn("編集", function () { editPlayer(p.id); }), btn(p.hidden ? "再表示" : "非表示", function () { commit(function (S) { S.players.forEach(function (x) { if (x.id === p.id) { x.hidden = !p.hidden; x.updatedAt = nowIso(); } }); }); drawPlayers(); }), btn("削除", function () { delPlayer(p); }, "danger")])]));
      });
      count.textContent = n + " 名を表示（登録 " + list.length + " 名）";
    }
    card.append(count, tbl, ui.p.note); el.appendChild(card); drawRows();
  }
  /* ---------- 並び順の入れ替え（国ごと／全体） ---------- */
  var RC = { country: "" };
  function subsetIds(country) { return ST.players.filter(function (p) { return !country || p.country === country; }).map(function (p) { return p.id; }); }
  function applyOrder(S, country, ids) {   // 選んだ国の選手だけを新しい順に並べ直す。ほかの国の選手の位置は動かさない
    var slots = [], byId = {};
    S.players.forEach(function (p, i) { byId[p.id] = p; if (!country || p.country === country) slots.push(i); });
    if (slots.length !== ids.length || ids.some(function (id, k) { return !byId[id] || (country && byId[id].country !== country) || ids.indexOf(id) !== k; })) throw new Error("並び順を更新できませんでした（選手の一覧が変わっています）。画面を開き直してください。");
    slots.forEach(function (pos, k) { S.players[pos] = byId[ids[k]]; });
  }
  function reorderPlayers(country, focus) {
    RC.country = country || "";
    var el = ui.p.root, drag = null; el.replaceChildren();
    var card = h("section", { class: "card pt-cm-order" }); card.appendChild(h("h2", { text: "プレイヤーの並び順を入れ替える" }));
    card.appendChild(h("p", { class: "pt-cm-sub", text: "国を選ぶと、その国のプレイヤーだけが並びます。「↑」「↓」ボタン、または左の「⋮⋮」をつかんでドラッグすると順番が変わります。押した時点で保存され、公開ページの国別一覧にもこの順番で表示されます（この端末の下書き）。" }));
    var cs = Array.from(new Set(ST.players.map(function (p) { return p.country; }).filter(Boolean))).sort().map(function (c) { return [c, cname(c) + "　" + ST.players.filter(function (p) { return p.country === c; }).length + "名"]; });
    var pick = sel(cs, RC.country, function (e) { reorderPlayers(e.target.value); }, "すべての国（全体の順番）");
    var list = h("ol", { class: "pt-cm-olist" }), count = h("p", { class: "pt-cm-count" });
    function save(ids, msg, f) { if (commit(function (S) { applyOrder(S, RC.country, ids); }, msg || "並び順を保存しました。")) reorderPlayers(RC.country, f); }
    function moveTo(id, targetId, before) {
      var ids = subsetIds(RC.country).filter(function (x) { return x !== id; }), at = ids.indexOf(targetId);
      if (at < 0) return; ids.splice(before ? at : at + 1, 0, id); save(ids, null, { id: id, act: "drag" });
    }
    function shift(id, delta) { var ids = subsetIds(RC.country), i = ids.indexOf(id), j = i + delta; if (i < 0 || j < 0 || j >= ids.length) return; ids.splice(i, 1); ids.splice(j, 0, id); save(ids, null, { id: id, act: delta < 0 ? "up" : "down" }); }
    function edge(id, last) { var ids = subsetIds(RC.country).filter(function (x) { return x !== id; }); if (last) ids.push(id); else ids.unshift(id); save(ids, null, { id: id, act: last ? "last" : "first" }); }
    function clearMarks() { list.querySelectorAll(".drop-before,.drop-after,.dragging").forEach(function (x) { x.classList.remove("drop-before", "drop-after", "dragging"); }); }
    var ids = subsetIds(RC.country), n = ids.length;
    ids.forEach(function (id, i) {
      var p = ST.players.filter(function (x) { return x.id === id; })[0];
      var li = h("li", { class: "pt-cm-orow" + (p.hidden ? " is-hidden" : ""), "data-id": id });
      var handle = h("span", { class: "pt-cm-handle", draggable: "true", title: "つかんでドラッグ", "aria-hidden": "true", text: "⋮⋮" });
      handle.addEventListener("dragstart", function (e) { drag = id; li.classList.add("dragging"); try { e.dataTransfer.setData("text/plain", id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setDragImage(li, 14, 14); } catch (x) {} });
      handle.addEventListener("dragend", function () { drag = null; clearMarks(); });
      li.addEventListener("dragover", function (e) { if (!drag || drag === id) return; e.preventDefault(); var r = li.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2; li.classList.toggle("drop-before", before); li.classList.toggle("drop-after", !before); });
      li.addEventListener("dragleave", function () { li.classList.remove("drop-before", "drop-after"); });
      li.addEventListener("drop", function (e) { e.preventDefault(); if (!drag || drag === id) return; var r = li.getBoundingClientRect(), before = e.clientY < r.top + r.height / 2, from = drag; drag = null; clearMarks(); moveTo(from, id, before); });
      function ab(t, act, fn, dis, title) { var b = btn(t, fn); b.dataset.act = act; b.disabled = !!dis; b.title = title || t; b.setAttribute("aria-label", p.name + "：" + (title || t)); return b; }
      li.append(h("span", { class: "pt-cm-no", text: String(i + 1) }), handle, thumbEl(p),
        h("span", { class: "pt-cm-oname" }, [h("strong", { text: p.name }), h("small", { text: " " + p.id + (p.hidden ? "（非表示）" : "") + (RC.country ? "" : " · " + cname(p.country)) })]),
        h("span", { class: "pt-cm-oact" }, [ab("先頭へ", "first", function () { edge(id, false); }, i === 0, "先頭へ"), ab("↑", "up", function () { shift(id, -1); }, i === 0, "1つ上へ"), ab("↓", "down", function () { shift(id, 1); }, i === n - 1, "1つ下へ"), ab("最後へ", "last", function () { edge(id, true); }, i === n - 1, "最後へ"), ab("編集", "edit", function () { editPlayer(id); }, false, "編集（サムネイルの設定もここ）")]));
      list.appendChild(li);
    });
    count.textContent = n + " 名" + (RC.country ? "（" + cname(RC.country) + "）" : "（すべての国。国ごとの順番は、全体の順番の中の相対的な並びが使われます）");
    var bar = h("div", { class: "pt-cm-bar" }, [h("label", { class: "pt-cm-f inline" }, [h("span", { text: "国・地域" }), pick]),
      btn("名前順（A→Z）に並べる", function () {
        if (n < 2) return; if (!confirm((RC.country ? cname(RC.country) : "すべての国") + "の " + n + " 名を、名前順（A→Z）に並べ替えます。よろしいですか？（「直前に戻す」で1回分は元に戻せます）")) return;
        var sorted = subsetIds(RC.country).map(function (x) { return ST.players.filter(function (p) { return p.id === x; })[0]; }).sort(function (a, b) { return String(a.name).toLowerCase().localeCompare(String(b.name).toLowerCase(), "ja"); }).map(function (p) { return p.id; });
        save(sorted, "名前順に並べ替えました。");
      }), restoreBtn(function () { reorderPlayers(RC.country); }), btn("プレイヤー一覧へ戻る", drawPlayers, "primary")]);
    card.append(bar, count, list, ui.p.note); el.appendChild(card);
    if (focus) { var r = list.querySelector('[data-id="' + focus.id + '"]'); if (r) { var b = r.querySelector('[data-act="' + focus.act + '"]:not([disabled])') || r.querySelector("button:not([disabled])"); if (b) b.focus({ preventScroll: false }); r.scrollIntoView({ block: "nearest" }); } }
  }
  function delPlayer(p) {
    var r = refsOf(p.id);
    if (r.length) { say("「" + p.name + "」は大会戦績に使われているため削除できません（" + r.map(function (t) { return t.name; }).join("、") + "）。非表示にするか、先に大会側の順位から外してください。", "error"); return; }
    if (!confirm("「" + p.name + "」を削除します。この下書きから消え、元に戻せません（直前に戻すで1回分は復元できます）。よろしいですか？")) return;
    commit(function (S) { S.players = S.players.filter(function (x) { return x.id !== p.id; }); }, "削除しました。"); drawPlayers();
  }
  function editPlayer(id) {
    var isNew = !id, src = isNew ? { id: "", name: "", country: "", category: "streamer", characters: [], socials: {}, sources: [], verification: "unverified" } : clone(ST.players.filter(function (p) { return p.id === id; })[0]);
    var p = src; p.socials = p.socials || {}; p.characters = p.characters || []; var srcs = (p.sources || []).slice();
    var el = ui.p.root; el.replaceChildren(); var card = h("section", { class: "card" }); card.appendChild(h("h2", { text: isNew ? "プレイヤーの新規登録" : "プレイヤーの編集：" + p.name }));
    var fId = inp(p.id, { placeholder: "例：nobi（半角の英小文字・数字・-_）" });
    var fName = inp(p.name), fAlias = h("textarea", { rows: 2, placeholder: "別名・日本語名（改行かカンマ区切り）" }); fAlias.value = (p.aliases || []).join("\n");
    var fCountry = sel(allCountries(), p.country, function () {}, "未登録");
    var fTeam = inp(p.teamFromSource || "", { placeholder: "未確認なら空欄" });
    var fCat = sel(PCATS.map(function (c) { return [c, c === "pro" ? "PRO（プロゲーマー）" : "STREAMER（配信者・コミュニティ）"]; }), playerCat(p), function () {});
    var fCatBasis = inp(p.categoryBasis || "", { placeholder: "例：所属：Team Falcons（区分の根拠メモ。公開ページには出ません）", maxlength: 200 });
    var fDesc = h("textarea", { rows: 3 }); fDesc.value = p.sourceSummary || "";
    // 資料の原文メモ（公開ページには出ない。すべて編集できる）
    var MEMO = [["sourceCharactersOriginal", "提出資料の元の記載（キャラクター）", "元の表記のメモです。ここから使用キャラクターへ自動変換はしません。"], ["sourceNameOriginal", "資料上の名前"], ["sourceCountryOriginal", "資料上の国・活動拠点"], ["sourceXHandle", "資料上のXユーザー名（@なし）"], ["sourceStreaming", "資料上の配信サービス"], ["sourceUnclearCharacters", "表記不明のキャラクター（カンマ区切り）"], ["importedFrom", "取り込み元の資料名"], ["importedDate", "取り込み日", "例：2026-11-08"]];
    var memoIn = {}; MEMO.forEach(function (m) { var v = p[m[0]]; memoIn[m[0]] = inp(Array.isArray(v) ? v.join("、") : (v == null ? "" : v)); });
    var memoBox = h("details", { class: "pt-cm-memo", open: MEMO.some(function (m) { return p[m[0]] != null && p[m[0]] !== "" && !(Array.isArray(p[m[0]]) && !p[m[0]].length); }) }, [h("summary", { text: "資料の原文メモ（公開ページには表示されません）" }), h("div", {}, MEMO.map(function (m) { return field(m[1], memoIn[m[0]], m[2]); }))]);
    var chars = p.characters.map(function (c) { return { name: c.name || "", context: c.context || "", verification: c.verification || "unverified" }; });
    var known = ctx.characters().map(function (c) { return c.name; }), dl = h("datalist", { id: "ptCmChars" }); known.forEach(function (n) { dl.appendChild(h("option", { value: n })); });
    var cEd = rowsEditor(chars, function (c) {
      var n = inp(c.name, { list: "ptCmChars", placeholder: "キャラクター名", oninput: function () { c.name = n.value; hint.textContent = known.length && n.value && known.indexOf(n.value) < 0 ? "鉄拳8の登録キャラと一致しません" : ""; } }), hint = h("small", { class: "pt-cm-warn" });
      return [n, inp(c.context, { placeholder: "根拠・出典", oninput: function (e) { c.context = e.target.value; } }), sel([["unverified", "未確認"], ["confirmed", "確認済み"]], c.verification, function (e) { c.verification = e.target.value; }), hint];
    }, function () { return { name: "", context: "", verification: "unverified" }; }, "キャラクターを追加");
    var socItems = socRows(p.socials);
    var socOpts = SOC.map(function (s) { return [s[0], s[1]]; }).concat([["other", "その他（名称を入力）"]]);
    var sBox = h("div", { class: "pt-cm-soc" }, [rowsEditor(socItems, function (it) {
      var lab = inp(it.label, { placeholder: it.k === "other" ? "表示名（必須）" : "表示名（任意）", maxlength: String(SOC_LABEL_MAX), "aria-label": "SNSの表示名", oninput: function (e) { it.label = e.target.value; } });
      var kSel = sel(socOpts, it.k, function (e) { it.k = e.target.value; lab.placeholder = it.k === "other" ? "表示名（必須）" : "表示名（任意）"; }); kSel.setAttribute("aria-label", "SNSの種類");
      var url = inp(it.url, { placeholder: "https://…", "aria-label": "SNSのURL", oninput: function (e) { it.url = e.target.value; } });
      var ver = sel([["", "未確認"], ["verified", "本人確認済み"]], it.ver, function (e) { it.ver = e.target.value; }); ver.setAttribute("aria-label", "確認状態");
      return [kSel, lab, url, ver];
    }, function () {
      var used = {}; socItems.forEach(function (x) { used[x.k] = 1; });
      var free = SOC.filter(function (s) { return !used[s[0]]; })[0];
      return { k: free ? free[0] : "other", label: "", url: "", ver: "" };
    }, "SNSを追加")]);
    var fVer = sel(VERIF.map(function (v) { return [v, VLABEL[v]]; }), playerVerif(p), function () {});
    /* サムネイル：画像（正方形に切り抜いて小さくする）か、文字。画像があれば画像が優先 */
    var tm = { img: (p.thumbnail && THUMB_RE.test(p.thumbnail)) ? p.thumbnail : "" }, crop = { img: null, zoom: 1, x: 0, y: 0 };
    var tText = inp(p.thumbText || "", { maxlength: "4", placeholder: "例：NO（空欄なら名前の先頭2文字）", oninput: function () { drawThumb(); } });
    var tPrev = h("div", { class: "pt-cm-thumbprev" }), tHint = h("small", { class: "pt-cm-warn" });
    function drawThumb() { tPrev.replaceChildren(thumbEl({ name: fName.value, thumbnail: tm.img, thumbText: tText.value }, true)); }
    var cv = h("canvas", { width: "200", height: "200", class: "pt-cm-cv", "aria-label": "切り抜きのプレビュー" });
    function paintCrop(c, S, bg) {
      var g = c.getContext("2d"), im = crop.img; g.clearRect(0, 0, S, S); if (bg) { g.fillStyle = bg; g.fillRect(0, 0, S, S); }
      var base = Math.max(S / im.naturalWidth, S / im.naturalHeight) * crop.zoom, dw = im.naturalWidth * base, dh = im.naturalHeight * base, mx = Math.max(0, (dw - S) / 2), my = Math.max(0, (dh - S) / 2);
      g.drawImage(im, (S - dw) / 2 - crop.x / 100 * mx, (S - dh) / 2 - crop.y / 100 * my, dw, dh);
    }
    function slider(label, min, max, step, key) { var r = h("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(crop[key]), "aria-label": label, oninput: function () { crop[key] = parseFloat(r.value); if (crop.img) paintCrop(cv, 200, "#0b1d33"); } }); return h("label", { class: "pt-cm-sl" }, [h("span", { text: label }), r]); }
    var cropBox = h("div", { class: "pt-cm-crop", hidden: true }, [cv, h("div", { class: "pt-cm-crop-ctl" }, [slider("拡大", 1, 4, 0.05, "zoom"), slider("左右の位置", -100, 100, 1, "x"), slider("上下の位置", -100, 100, 1, "y"),
      h("div", { class: "pt-cm-bar" }, [btn("この範囲を使う", function () {
        if (!crop.img) return;
        var out = "", S = 160;
        for (var k = 0; k < 3 && (!out || out.length > 90000); k++) {
          var c = document.createElement("canvas"); c.width = c.height = S; paintCrop(c, S, null);
          out = c.toDataURL("image/webp", k === 0 ? 0.86 : 0.7);
          if (out.indexOf("data:image/webp") !== 0) { paintCrop(c, S, "#ffffff"); out = c.toDataURL("image/jpeg", k === 0 ? 0.86 : 0.7); }
          S = S === 160 ? 128 : 96;
        }
        if (!THUMB_RE.test(out) || out.length > THUMB_MAX) { tHint.textContent = "画像を小さくできませんでした。別の画像でお試しください。"; return; }
        tm.img = out; tHint.textContent = ""; cropBox.hidden = true; crop.img = null; drawThumb();
      }, "primary"), btn("やめる", function () { cropBox.hidden = true; crop.img = null; })])])]);
    var tFile = h("input", { type: "file", accept: "image/png,image/jpeg,image/webp,image/gif", hidden: true, onchange: function () {
      var file = tFile.files && tFile.files[0]; tFile.value = ""; if (!file) return;
      if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) { tHint.textContent = "画像は png / jpeg / webp / gif を選んでください。"; return; }
      if (file.size > 12 * 1024 * 1024) { tHint.textContent = "画像が大きすぎます（12MBまで）。"; return; }
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); if (!im.naturalWidth || !im.naturalHeight) { tHint.textContent = "画像を読み込めませんでした。"; return; } crop.img = im; crop.zoom = 1; crop.x = 0; crop.y = 0; cropBox.querySelectorAll("input[type=range]").forEach(function (r, i) { r.value = i === 0 ? "1" : "0"; }); tHint.textContent = ""; cropBox.hidden = false; paintCrop(cv, 200, "#0b1d33"); };
      im.onerror = function () { URL.revokeObjectURL(url); tHint.textContent = "画像を読み込めませんでした。"; };
      im.src = url;
    } });
    var thumbBox = h("div", { class: "pt-cm-thumbbox" }, [h("div", { class: "pt-cm-bar" }, [tPrev, btn("画像を選ぶ", function () { tFile.click(); }), btn("画像を削除", function () { tm.img = ""; tHint.textContent = ""; drawThumb(); }), tFile]), cropBox, field("表示する文字（画像が無いときに表示）", tText, "画像を設定すると、画像が優先して表示されます。"), tHint]);
    fName.addEventListener("input", drawThumb); drawThumb();
    var srcModel = srcs.map(function (u) { return { u: u }; });
    var sEd2 = rowsEditor(srcModel, function (o) { return [inp(o.u, { placeholder: "https://…", oninput: function (e) { o.u = e.target.value; } })]; }, function () { return { u: "" }; }, "情報源を追加");
    var form = h("div", { class: "pt-cm-form" }, [field("ID", fId, "大会戦績との紐付けに使います。変更すると、大会側の選手IDも一緒に更新します。"), field("登録名", fName), field("別名・日本語名", fAlias), field("国・地域", fCountry), field("PRO / STREAMER", fCat, "公開ページで、国を選んだあとに出る「PRO」「STREAMER」のどちらに載せるかを決めます。"), field("区分の根拠メモ", fCatBasis, "なぜその区分にしたかのメモです（任意・公開ページには出ません）。"), h("div", { class: "pt-cm-f" }, [h("span", { text: "サムネイル（選手一覧の四角い画像）" }), thumbBox]), field("所属チーム", fTeam),
      h("div", { class: "pt-cm-f" }, [h("span", { text: "使用キャラクター" }), cEd, dl]), h("div", { class: "pt-cm-f" }, [h("span", { text: "SNS・配信サイト（確認できたものだけ入力。「SNSを追加」で何件でも追加できます）" }), sBox]),
      field("紹介文", fDesc), h("div", { class: "pt-cm-f" }, [h("span", { text: "情報源（https）" }), sEd2]), field("情報確認状態", fVer, "「確認済み」には情報源が必要です。"), memoBox]);
    var save = btn("保存", function () {
      var np = clone(src); np.id = fId.value.trim(); np.name = fName.value.trim(); np.aliases = lines(fAlias.value); np.country = fCountry.value; np.category = fCat.value === "pro" ? "pro" : "streamer"; if (fCatBasis.value.trim()) np.categoryBasis = fCatBasis.value.trim(); else delete np.categoryBasis;
      if (fTeam.value.trim()) np.teamFromSource = fTeam.value.trim(); else delete np.teamFromSource;
      np.characters = chars.filter(function (c) { return c.name.trim(); }).map(function (c) { return { name: c.name.trim(), context: c.context.trim(), verification: c.verification }; });
      np.socials = socPack(socItems, src.socials);
      if (fDesc.value.trim()) np.sourceSummary = fDesc.value.trim(); else delete np.sourceSummary;
      if (tm.img) np.thumbnail = tm.img; else delete np.thumbnail;
      if (tText.value.trim()) np.thumbText = tText.value.trim(); else delete np.thumbText;
      MEMO.forEach(function (m) { var v = memoIn[m[0]].value.trim(); if (!v) delete np[m[0]]; else if (m[0] === "sourceUnclearCharacters") np[m[0]] = v.split(/[、,，\n]+/).map(function (x) { return x.trim(); }).filter(Boolean); else np[m[0]] = v; });
      np.sources = srcModel.map(function (o) { return o.u.trim(); }).filter(Boolean); np.verification = fVer.value; np.sourceUnverified = fVer.value !== "verified"; np.updatedAt = nowIso();
      if (commit(function (S) {
        if (isNew) { if (S.players.some(function (x) { return x.id === np.id; })) throw new Error("そのIDは既に使われています：" + np.id); S.players.push(np); return; }
        var i = S.players.findIndex(function (x) { return x.id === src.id; });
        if (np.id !== src.id) {          // IDを変えたら、大会戦績の選手IDも一緒に直す（紐付けが切れないように）
          if (S.players.some(function (x) { return x.id === np.id; })) throw new Error("そのIDは既に使われています：" + np.id);
          S.tournaments.forEach(function (t) { (t.placements || []).forEach(function (x) { if (x.playerId === src.id) x.playerId = np.id; }); });
        }
        S.players[i] = np;
      }, np.id !== src.id && !isNew ? "保存しました（IDを変えたので、大会戦績の選手IDも更新しました）。" : "保存しました（この端末の下書き）。")) drawPlayers();
    }, "primary");
    card.append(form, h("div", { class: "pt-cm-bar" }, [save, btn("キャンセル", drawPlayers)]), ui.p.note); el.appendChild(card);
  }

  /* ================= トーナメント管理 ================= */
  var TF = { tab: "results", q: "", year: "", country: "", cat: "", eq: "", month: "", day: "", mode: "", hidden: false };
  function mountTournaments(el, context) {
    ctx = context || ctx; if (!ST) boot(); ui.t = { root: el, note: h("p", { role: "status", "aria-live": "polite", text: loadNote }) }; drawT();
  }
  function drawT() {
    var el = ui.t.root; el.replaceChildren(); var card = h("section", { class: "card" }); card.appendChild(h("h2", { text: "トーナメント管理" }));
    card.appendChild(h("p", { class: "pt-cm-sub", text: "「大会結果」（確定した戦績）と「イベントカレンダー」（開催予定）は別のデータです。変更は端末の下書きに保存されます。" }));
    var tabs = h("div", { class: "pt-cm-tabs", role: "tablist" });
    [["results", "大会結果管理"], ["calendar", "イベントカレンダー管理"]].forEach(function (t) { tabs.appendChild(h("button", { type: "button", role: "tab", class: "btn", "aria-pressed": String(TF.tab === t[0]), onclick: function () { TF.tab = t[0]; drawT(); }, text: t[1] })); });
    card.appendChild(tabs); el.appendChild(card);
    if (TF.tab === "results") drawResults(card); else drawCalendar(card);
  }
  function drawResults(card) {
    var list = ST.tournaments, bar = h("div", { class: "pt-cm-bar" });
    var years = Array.from(new Set(list.map(function (t) { return String(t.date).slice(0, 4); }))).sort().map(function (y) { return [y, y + "年"]; });
    var cs = Array.from(new Set(list.map(function (t) { return t.country; }).filter(Boolean))).sort().map(function (c) { return [c, cname(c)]; });
    var cats = Array.from(new Set(list.map(function (t) { return t.category; }).filter(Boolean))).sort().map(function (c) { return [c, c]; });
    var q = h("input", { type: "search", placeholder: "大会名で検索", value: TF.q, oninput: function () { TF.q = q.value; rows(); } });
    bar.append(q, sel(years, TF.year, function (e) { TF.year = e.target.value; rows(); }, "開催年"), sel(cs, TF.country, function (e) { TF.country = e.target.value; rows(); }, "国"), sel(cats, TF.cat, function (e) { TF.cat = e.target.value; rows(); }, "大会区分"));
    var bar2 = h("div", { class: "pt-cm-bar" }); bar2.append(btn("大会を登録", function () { editTournament(null); }, "primary"), filePick("JSON読込", "tournaments", drawT), restoreBtn(drawT), exportSet());
    var count = h("p", { class: "pt-cm-count" }), body = h("tbody"), tbl = h("table", { class: "pt-cm-tbl" });
    tbl.appendChild(h("thead", {}, h("tr", {}, ["大会名", "開催", "国", "区分", "上位", ""].map(function (t) { return h("th", { text: t }); })))); tbl.appendChild(body);
    function rows() {
      body.replaceChildren(); var n = 0, qq = TF.q.trim().toLowerCase();
      list.forEach(function (t) {
        if (qq && !(t.name + " " + t.id).toLowerCase().includes(qq)) return; if (TF.year && String(t.date).slice(0, 4) !== TF.year) return; if (TF.country && t.country !== TF.country) return; if (TF.cat && t.category !== TF.cat) return; n++;
        var top = (t.placements || []).slice().sort(function (a, b) { return a.rank - b.rank; }).slice(0, 3).map(function (x) { return x.rank + "位 " + pname(x); }).join(" / ");
        body.appendChild(h("tr", {}, [h("td", {}, [h("strong", { text: t.name }), h("small", { text: " " + t.id })]), h("td", { text: t.dateLabel || t.date }), h("td", { text: cname(t.country) }), h("td", { text: t.category || "—" }), h("td", { text: top || "—" }),
          h("td", { class: "pt-cm-act" }, [btn("編集", function () { editTournament(t.id); }), btn("削除", function () { if (confirm("大会「" + t.name + "」を削除します。戦績も消えます（直前に戻すで1回分は復元できます）。よろしいですか？")) { commit(function (S) { S.tournaments = S.tournaments.filter(function (x) { return x.id !== t.id; }); }, "削除しました。"); drawT(); } }, "danger")])]));
      });
      count.textContent = n + " 件を表示（登録 " + list.length + " 件）";
    }
    card.append(bar, bar2, count, tbl, ui.t.note); rows();
  }
  function pname(x) { var p = x.playerId && ST.players.filter(function (q) { return q.id === x.playerId; })[0]; return p ? p.name : (x.playerName || "（未登録）"); }
  function editTournament(id) {
    var isNew = !id, t = isNew ? { id: "", name: "", date: "", country: "", category: "", placements: [], source: "", verification: "unverified" } : clone(ST.tournaments.filter(function (x) { return x.id === id; })[0]);
    var el = ui.t.root; el.replaceChildren(); var card = h("section", { class: "card" }); card.appendChild(h("h2", { text: isNew ? "大会の登録" : "大会の編集：" + t.name }));
    var fId = inp(t.id, { placeholder: "例：example2026（半角の英小文字・数字・-_）" }), fName = inp(t.name), fDate = inp(t.date, { placeholder: "2026-07-18 または 2026-07" }), fLabel = inp(t.dateLabel || "", { placeholder: "表示用（任意）例：2026年7月" });
    var fCountry = sel(allCountries(), t.country, function () {}, "未登録"), fCat = inp(t.category || "", { placeholder: "例：TWT 2026 Master" }), fPlace = inp(t.place || ""), fSrc = inp(t.source || "", { placeholder: "https://…（公式結果）" });
    var fVer = sel(VERIF.map(function (v) { return [v, VLABEL[v]]; }), VERIF.indexOf(t.verification) >= 0 ? t.verification : "unverified", function () {});
    var pl = (t.placements || []).map(function (x) { return { rank: x.rank, playerId: x.playerId || "", playerName: x.playerName || "" }; });
    var opts = ST.players.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }).map(function (p) { return [p.id, p.name + "（" + p.id + "）"]; });
    var pEd = rowsEditor(pl, function (x) {
      var r = inp(x.rank, { type: "number", min: 1, class: "pt-cm-rank", oninput: function (e) { x.rank = parseInt(e.target.value, 10); } }); r.type = "number";
      var s = sel(opts, x.playerId, function (e) { x.playerId = e.target.value; }, x.playerName ? "（未登録）" + x.playerName : "選手を選ぶ");
      return [r, s];
    }, function () { var m = pl.reduce(function (a, b) { return Math.max(a, b.rank || 0); }, 0); return { rank: m + 1, playerId: "", playerName: "" }; }, "順位を追加");
    var form = h("div", { class: "pt-cm-form" }, [field("大会ID", fId, "選手の戦績・イベントとの紐付けに使います。変更すると、関連づけも一緒に更新します。"), field("大会名", fName), field("開催日", fDate, "YYYY-MM-DD（月だけ分かる場合は YYYY-MM）"), field("表示用の日付", fLabel), field("国", fCountry), field("開催地の表示", fPlace), field("大会区分", fCat), field("公式結果URL", fSrc), field("情報確認状態", fVer),
      h("div", { class: "pt-cm-f" }, [h("span", { text: "順位と選手（同順位は同じ番号）" }), pEd])]);
    var save = btn("保存", function () {
      var nt = clone(t); nt.id = fId.value.trim(); nt.name = fName.value.trim(); nt.date = fDate.value.trim(); ["dateLabel", "place", "category", "source"].forEach(function (k) { delete nt[k]; });
      if (fLabel.value.trim()) nt.dateLabel = fLabel.value.trim(); if (fPlace.value.trim()) nt.place = fPlace.value.trim(); if (fCat.value.trim()) nt.category = fCat.value.trim(); if (fSrc.value.trim()) nt.source = fSrc.value.trim();
      if (fCountry.value) nt.country = fCountry.value; else delete nt.country; nt.verification = fVer.value; nt.updatedAt = nowIso();
      nt.placements = pl.filter(function (x) { return x.playerId || x.playerName; }).map(function (x) { var o = { rank: x.rank }; if (x.playerId) o.playerId = x.playerId; else o.playerName = x.playerName; return o; }).sort(function (a, b) { return a.rank - b.rank; });
      if (commit(function (S) {
        if (isNew) { if (S.tournaments.some(function (x) { return x.id === nt.id; })) throw new Error("その大会IDは既に使われています：" + nt.id); S.tournaments.push(nt); return; }
        var i = S.tournaments.findIndex(function (x) { return x.id === t.id; });
        if (nt.id !== t.id) {            // IDを変えたら、イベントの「関連する大会結果」も一緒に直す
          if (S.tournaments.some(function (x) { return x.id === nt.id; })) throw new Error("その大会IDは既に使われています：" + nt.id);
          S.events.forEach(function (e) { if (e.tournamentId === t.id) e.tournamentId = nt.id; });
        }
        S.tournaments[i] = nt;
      }, nt.id !== t.id && !isNew ? "保存しました（IDを変えたので、関連づけも更新しました）。" : "保存しました（この端末の下書き）。")) drawT();
    }, "primary");
    card.append(form, h("div", { class: "pt-cm-bar" }, [save, btn("キャンセル", drawT)]), ui.t.note); el.appendChild(card);
  }

  /* ---------- イベントカレンダー ---------- */
  function isManual(e) { return e.source_kind === "manual"; }
  function drawCalendar(card) {
    var list = ST.events, bar = h("div", { class: "pt-cm-bar" });
    var q = h("input", { type: "search", placeholder: "イベント名で検索", value: TF.eq, oninput: function () { TF.eq = q.value; rows(); } });
    var m = h("input", { type: "month", value: TF.month, onchange: function () { TF.month = m.value; rows(); }, "aria-label": "月" }), d = h("input", { type: "date", value: TF.day, onchange: function () { TF.day = d.value; rows(); }, "aria-label": "日" });
    var modes = Array.from(new Set(list.map(function (e) { return effEvent(e).mode; }).filter(Boolean))).map(function (x) { return [x, x]; });
    bar.append(q, m, d, sel(modes, TF.mode, function (e) { TF.mode = e.target.value; rows(); }, "開催形態"), h("label", { class: "pt-cm-chk" }, [h("input", { type: "checkbox", checked: TF.hidden, onchange: function (e) { TF.hidden = e.target.checked; rows(); } }), " 非表示も表示"]));
    var bar2 = h("div", { class: "pt-cm-bar" }); bar2.append(btn("イベントを追加", function () { editEvent(null); }, "primary"), btn("取得元の管理", srcPanel), filePick("JSON読込", "events", drawT), restoreBtn(drawT), exportSet());
    var count = h("p", { class: "pt-cm-count" }), body = h("tbody"), tbl = h("table", { class: "pt-cm-tbl" });
    tbl.appendChild(h("thead", {}, h("tr", {}, ["イベント", "開催日・開始時刻", "開催地・形態", "取得元", ""].map(function (t) { return h("th", { text: t }); })))); tbl.appendChild(body);
    function rows() {
      body.replaceChildren(); var n = 0, qq = TF.eq.trim().toLowerCase();
      list.slice().sort(function (a, b) { return effEvent(a).start_date < effEvent(b).start_date ? -1 : 1; }).forEach(function (e0) {
        var e = effEvent(e0); if (e0.hidden && !TF.hidden) return; if (qq && !(e.name + " " + e0.id).toLowerCase().includes(qq)) return;
        if (TF.month && String(e.start_date).slice(0, 7) !== TF.month) return; if (TF.day && !(e.start_date <= TF.day && TF.day <= (e.end_date || e.start_date))) return; if (TF.mode && e.mode !== TF.mode) return; n++;
        var edited = e0.override && Object.keys(e0.override).length;
        body.appendChild(h("tr", { class: e0.hidden ? "is-hidden" : "" }, [h("td", {}, [h("strong", { text: e.name }), e0.hidden ? h("small", { text: " （非表示）" }) : null, edited ? h("small", { class: "pt-cm-warn", text: " 管理者が修正済み" }) : null]),
          h("td", { text: e.start_date + (e.end_date && e.end_date !== e.start_date ? " 〜 " + e.end_date : "") + "　" + (e.start_time_jst ? e.start_time_jst + "（JST）" : "開始時刻：未確認") }), h("td", { text: (e.location || "—") + " / " + (e.mode || "—") }),
          h("td", {}, [h("span", { text: isManual(e0) ? "手動追加" : (e0.source_kind === "seed" ? "登録済み" : "自動取得") }), h("small", { text: " " + (e.source_name || "") + (e0.fetched_at ? "（取得 " + e0.fetched_at + "）" : "") })]),
          h("td", { class: "pt-cm-act" }, [btn("編集", function () { editEvent(e0.id); }), btn(e0.hidden ? "再表示" : "非表示", function () { commit(function (S) { S.events.forEach(function (x) { if (x.id === e0.id) x.hidden = !e0.hidden; }); }); drawT(); }),
            edited ? btn("取得値に戻す", function () { if (confirm("管理者の修正を取り消して、取得した元の値に戻します。よろしいですか？")) { commit(function (S) { S.events.forEach(function (x) { if (x.id === e0.id) delete x.override; }); }, "取得した値に戻しました。"); drawT(); } }) : null,
            isManual(e0) ? btn("削除", function () { if (confirm("イベント「" + e.name + "」を削除します。よろしいですか？")) { commit(function (S) { S.events = S.events.filter(function (x) { return x.id !== e0.id; }); }, "削除しました。"); drawT(); } }, "danger") : null])]));
      });
      count.textContent = n + " 件を表示（登録 " + list.length + " 件）";
    }
    card.append(bar, bar2, count, tbl, ui.t.note); rows();
  }
  function editEvent(id) {
    var isNew = !id, e0 = isNew ? { id: "", source_kind: "manual", status: "scheduled", game: "TEKKEN 8", mode: "オフライン" } : clone(ST.events.filter(function (x) { return x.id === id; })[0]);
    var manual = isManual(e0), e = isNew ? e0 : effEvent(e0), el = ui.t.root; el.replaceChildren(); var card = h("section", { class: "card" });
    card.appendChild(h("h2", { text: isNew ? "イベントの追加" : "イベントの編集：" + e.name }));
    if (!manual) card.appendChild(h("p", { class: "pt-cm-sub", text: "自動取得・登録済みのイベントです。修正は「管理者の修正」として別に保存され、取得した元の値は残ります。次回の自動取得でも、管理者の修正は上書きされません。" }));
    var f = {}; f.id = inp(e0.id, { placeholder: "例：manual-example-2026（半角の英小文字・数字・-_）" }); f.name = inp(e.name || ""); f.start_date = inp(e.start_date || "", { type: "date" }); f.end_date = inp(e.end_date || "", { type: "date" });
    f.start_time_jst = inp(e.start_time_jst || "", { type: "time" }); f.location = inp(e.location || "", { placeholder: "例：東京・日本" }); f.country = sel(allCountries(), e.country, function () {}, "未登録");
    f.mode = sel([["オフライン", "オフライン"], ["オンライン", "オンライン"], ["ハイブリッド", "ハイブリッド"], ["未確認", "未確認"]], e.mode || "未確認", function () {}); f.category = inp(e.category || ""); f.source_url = inp(e.source_url || "", { placeholder: "https://…（公式ページ）" }); f.source_name = inp(e.source_name || "", { placeholder: "取得元の名前" }); f.description = h("textarea", { rows: 2 }); f.description.value = e.description || "";
    var tOpts = ST.tournaments.map(function (t) { return [t.id, t.name]; }); f.tournamentId = sel(tOpts, e0.tournamentId || "", function () {}, "（関連づけなし）");
    var form = h("div", { class: "pt-cm-form" }, [field("イベントID", f.id, manual || isNew ? "変更できます。" : "変更できます。ただし自動取得のイベントは、次回の自動取得で別のイベントとして追加されることがあります。"), field("イベント名", f.name), field("開始日", f.start_date, "開催地の日付です。日本時間の日付と違うことがあります。"), field("終了日", f.end_date), field("開始時刻（日本時間）", f.start_time_jst, "未確認なら空欄のままにします（推測で入れません）。"),
      field("開催地", f.location), field("国", f.country), field("開催形態", f.mode), field("大会区分", f.category), field("公式ページURL", f.source_url), field("取得元の名前", f.source_name), field("メモ", f.description), field("関連する大会結果", f.tournamentId, "大会が終わったあとで、結果と関連づけます（結果は自動では作りません）。")]);
    var save = btn("保存", function () {
      function vals() { var o = {}; ["name", "start_date", "end_date", "start_time_jst", "location", "country", "mode", "category", "source_url", "source_name", "description"].forEach(function (k) { var v = String(f[k].value || "").trim(); o[k] = v || null; }); return o; }
      var v = vals();
      if (commit(function (S) {
        if (isNew) { var nid = f.id.value.trim(); if (S.events.some(function (x) { return x.id === nid; })) throw new Error("そのイベントIDは既に使われています：" + nid); var ne = Object.assign({ id: nid, source_kind: "manual", status: "scheduled", game: "TEKKEN 8", updatedAt: nowIso() }, v); if (!ne.source_name) ne.source_name = "管理者の手動追加"; if (f.tournamentId.value) ne.tournamentId = f.tournamentId.value; Object.keys(ne).forEach(function (k) { if (ne[k] == null) delete ne[k]; }); S.events.push(ne); return; }
        var t = S.events.filter(function (x) { return x.id === e0.id; })[0];
        var nid2 = f.id.value.trim(); if (nid2 !== e0.id) { if (S.events.some(function (x) { return x.id === nid2; })) throw new Error("そのイベントIDは既に使われています：" + nid2); t.id = nid2; }
        if (manual) { Object.keys(v).forEach(function (k) { if (v[k] == null) delete t[k]; else t[k] = v[k]; }); t.updatedAt = nowIso(); }
        else { var ov = {}; Object.keys(v).forEach(function (k) { if ((v[k] == null ? null : v[k]) !== (t[k] == null ? null : t[k])) ov[k] = v[k]; }); if (Object.keys(ov).length) { t.override = ov; t.override_updatedAt = nowIso(); } else delete t.override; }
        if (f.tournamentId.value) t.tournamentId = f.tournamentId.value; else delete t.tournamentId;
      }, "保存しました（この端末の下書き）。")) drawT();
    }, "primary");
    card.append(form, h("div", { class: "pt-cm-bar" }, [save, btn("キャンセル", drawT)]), ui.t.note); el.appendChild(card);
  }
  function srcPanel() {
    var el = ui.t.root; el.replaceChildren(); var card = h("section", { class: "card" }); card.appendChild(h("h2", { text: "自動取得の対象（取得元）" }));
    card.appendChild(h("p", { class: "pt-cm-sub", text: "自動取得の対象にするページの一覧です。公式の情報を優先してください。通信に失敗しても、登録済みのイベントは消しません。取得そのものは、この画面からは実行しません（サーバー連携は別段階）。" }));
    var srcs = clone(ST.calendar.sources || []).map(function (s) { return { name: s.name || "", url: s.url || "", enabled: s.enabled !== false, extra: s }; });
    var ed = rowsEditor(srcs, function (s) { return [inp(s.name, { placeholder: "名前", oninput: function (e) { s.name = e.target.value; } }), inp(s.url, { placeholder: "https://…", oninput: function (e) { s.url = e.target.value; } }), h("label", { class: "pt-cm-chk" }, [h("input", { type: "checkbox", checked: s.enabled, onchange: function (e) { s.enabled = e.target.checked; } }), " 取得する"])]; }, function () { return { name: "", url: "", enabled: true, extra: {} }; }, "取得元を追加");
    card.append(ed, h("div", { class: "pt-cm-bar" }, [btn("保存", function () {
      var out = srcs.filter(function (s) { return s.name || s.url; }).map(function (s) { return Object.assign({}, s.extra, { name: s.name.trim(), url: s.url.trim(), enabled: s.enabled }); });
      if (out.some(function (s) { return !s.name || !safeUrl(s.url); })) { say("取得元は、名前と https のURLが必要です。", "error"); return; }
      if (commit(function (S) { S.calendar = Object.assign({}, S.calendar, { sources: out }); }, "保存しました。")) drawT();
    }, "primary"), btn("戻る", drawT)]), ui.t.note); el.appendChild(card);
  }

  window.PTAdminCommunity = Object.freeze({
    mountPlayers: mountPlayers, mountTournaments: mountTournaments, onCharacters: function () {},
    _test: { validate: validate, socRows: socRows, socPack: socPack, SOC: SOC, get state() { return clone(ST); }, KEY: KEY, BKEY: BKEY, THUMB_RE: THUMB_RE }
  });
})();
