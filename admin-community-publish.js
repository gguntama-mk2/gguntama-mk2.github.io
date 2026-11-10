/* PROJECT T 管理者ページ：「公開」（プレイヤー・大会・イベントのデータを、下書きから公開サイトへ）。
   - 公開先はサーバー（/api/v1/admin/community/...）。公開サイトは /api/v1/community/published を読む
   - 公開の前に、いま公開中の版との差分（追加・削除・変更）を見せ、確認してから送る
   - 公開のたびに「版」が増える。履歴から「この版に戻す」（公開中を戻す）／「下書きに取り込む」（手元の下書きを置き換える）ができる
   - ほかの人が先に公開していたら（版がずれていたら）送らず、読み直しを促す */
(function () {
  "use strict";
  var C = null, api = null, csrf = null, ui = {};
  var S = { status: null, current: null, published: null, loading: false, err: "" };
  function h() { return C.ui.h.apply(null, arguments); }
  function btn() { return C.ui.btn.apply(null, arguments); }
  function fmt(ts) { if (!ts) return "—"; try { return new Date(ts * 1000).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false }); } catch (_) { return String(ts); } }
  function canon(x) { if (Array.isArray(x)) return "[" + x.map(canon).join(",") + "]"; if (x && typeof x === "object") return "{" + Object.keys(x).sort().map(function (k) { return JSON.stringify(k) + ":" + canon(x[k]); }).join(",") + "}"; return JSON.stringify(x === undefined ? null : x); }
  function nameOf(kind, x) { return (x && (x.name || (x.override && x.override.name))) || (x && x.id) || "?"; }
  /* 公開中（pub）と下書き（dr）の違いを、種類ごとに「追加／削除／変更」の名前の一覧にする */
  function diff(pub, dr) {
    var out = { kinds: [], total: 0 };
    [["players", "プレイヤー"], ["tournaments", "大会"], ["events", "イベント"]].forEach(function (k) {
      var a = {}, b = {}; (pub && pub[k[0]] || []).forEach(function (x) { if (x && x.id) a[x.id] = x; }); (dr[k[0]] || []).forEach(function (x) { if (x && x.id) b[x.id] = x; });
      var add = [], del = [], chg = [];
      Object.keys(b).forEach(function (id) { if (!a[id]) add.push(nameOf(k[0], b[id])); else if (canon(a[id]) !== canon(b[id])) chg.push(nameOf(k[0], b[id])); });
      Object.keys(a).forEach(function (id) { if (!b[id]) del.push(nameOf(k[0], a[id])); });
      out.kinds.push({ key: k[0], label: k[1], add: add, del: del, chg: chg, n: add.length + del.length + chg.length }); out.total += add.length + del.length + chg.length;
    });
    var other = [];
    if (canon(pub && pub.countries || {}) !== canon(dr.countries || {})) other.push("国・地域の名前");
    if (canon(pub && pub.regions || []) !== canon(dr.regions || [])) other.push("地域の区分け");
    if (canon(pub && pub.calendar || {}) !== canon(dr.calendar || {})) other.push("カレンダーの取得元");
    out.other = other; out.total += other.length;
    return out;
  }
  function diffView(d, pubExists) {
    var box = h("div", { class: "pt-pb-diff" });
    if (!pubExists) { box.appendChild(h("p", { text: "まだ一度も公開していません。公開すると、下書きの内容がそのまま公開サイトに載ります。" })); return box; }
    if (!d.total) { box.appendChild(h("p", { class: "pt-pb-same", text: "下書きと公開中の内容は同じです。" })); return box; }
    d.kinds.forEach(function (k) {
      if (!k.n) return;
      var sec = h("div", { class: "pt-pb-kind" }, h("strong", { text: k.label + "：" + k.n + "件" }));
      [["追加", k.add, "add"], ["削除", k.del, "del"], ["変更", k.chg, "chg"]].forEach(function (r) {
        if (!r[1].length) return;
        sec.appendChild(h("div", { class: "pt-pb-row " + r[2] }, [h("span", { class: "pt-pb-tag", text: r[0] + " " + r[1].length }), h("span", { text: r[1].slice(0, 40).join("、") + (r[1].length > 40 ? " ほか" + (r[1].length - 40) + "件" : "") })]));
      });
      box.appendChild(sec);
    });
    if (d.other.length) box.appendChild(h("div", { class: "pt-pb-kind" }, h("strong", { text: "そのほかの変更：" + d.other.join("、") })));
    return box;
  }
  function say(t, state) { if (ui.note) { ui.note.textContent = t; ui.note.dataset.state = state || "neutral"; } }
  function errText(e) { var d = e && e.detail; return (d && (d.message || (d.errors && d.errors[0]))) || (e && e.message) || String(e); }
  async function load() {
    S.loading = true; S.err = ""; draw();
    try {
      S.status = await api("/api/v1/admin/community");
      S.current = S.status.current;
      S.published = S.current ? (await api("/api/v1/admin/community/history/" + S.current)).data : null;
    } catch (e) { S.err = "公開の状態を読めませんでした：" + errText(e); S.status = null; S.published = null; S.current = null; }
    S.loading = false; draw();
  }
  async function publish() {
    var dr = C.getState(); delete dr.savedAt;
    var er = C.validate(dr); if (er.length) return say("公開できません（下書きに問題があります）：" + er.slice(0, 3).join(" / "), "error");
    var d = diff(S.published, dr);
    if (S.published && !d.total) return say("下書きと公開中の内容が同じなので、公開するものがありません。", "ok");
    var note = (ui.noteInput && ui.noteInput.value || "").trim().slice(0, 120);
    var okd = await confirmModal("公開サイトに反映します", [h("p", { text: "公開中：" + (S.current ? "版 " + S.current : "なし") + " → 新しい版として公開します。差分：" }), diffView(d, !!S.published), h("p", { text: "公開すると、サイトを開いている人には1〜2分以内に反映されます。以前の版には「履歴」から戻せます。" })], "公開する");
    if (!okd) return;
    say("公開しています…", "neutral");
    try {
      var r = await api("/api/v1/admin/community/publish", { method: "POST", body: { data: dr, note: note, expected_version: S.current } });
      if (ui.noteInput) ui.noteInput.value = "";
      await load();
      say(r.changed ? "公開しました（版 " + r.current + "）。" : "公開中の内容と同じだったため、新しい版は作られませんでした。", "ok");
    } catch (e) {
      if (e && e.status === 409) { await load(); say("公開できませんでした：ほかの人が先に公開しています。いま公開中の内容と差分を確かめてから、もう一度公開してください。", "error"); }
      else say("公開できませんでした：" + errText(e), "error");
    }
  }
  async function rollback(ver) {
    var okd = await confirmModal("以前の版に戻します", [h("p", { text: "公開中の内容を、版 " + ver + " の内容に戻します（新しい版として公開されます）。手元の下書きは変わりません。" })], "この版に戻す", true);
    if (!okd) return;
    try { var r = await api("/api/v1/admin/community/rollback", { method: "POST", body: { version: ver, expected_version: S.current } }); await load(); say("版 " + ver + " の内容で公開し直しました（版 " + r.current + "）。", "ok"); }
    catch (e) { if (e && e.status === 409) await load(); say("戻せませんでした：" + errText(e), "error"); }
  }
  async function pull(ver) {
    var okd = await confirmModal("公開中の版を下書きに取り込みます", [h("p", { text: "手元の下書きを、版 " + ver + " の内容で置き換えます。いまの下書きは「直前に戻す」で1回分だけ戻せます。" })], "下書きに取り込む", true);
    if (!okd) return;
    try {
      var r = await api("/api/v1/admin/community/history/" + ver);
      if (C.replaceState(r.data, "版 " + ver + " を下書きに取り込みました。")) { C.redraw(); draw(); say("版 " + ver + " を下書きに取り込みました。プレイヤー管理・トーナメント管理の画面に反映されています。", "ok"); }
      else say("下書きに取り込めませんでした（下書きの保存に失敗）。", "error");
    } catch (e) { say("取り込めませんでした：" + errText(e), "error"); }
  }
  function confirmModal(title, body, okLabel, danger) {
    if (window.PTAdminModal) return window.PTAdminModal(title, body, okLabel, danger);
    return Promise.resolve(confirm(title + "\n\n" + body.map(function (b) { return b.textContent; }).join("\n")));
  }
  function draw() {
    var el = ui.root; if (!el) return; el.replaceChildren();
    var card = h("section", { class: "card" }); card.appendChild(h("h2", { text: "公開（プレイヤー・大会・イベント）" }));
    card.appendChild(h("p", { class: "pt-cm-sub", text: "プレイヤー管理・トーナメント管理で編集した下書きを、公開サイト（www.project-t-god.com）に反映します。公開のたびに「版」が1つ増え、履歴から以前の版に戻せます。" }));
    if (S.loading) { card.appendChild(h("p", { text: "公開の状態を読み込んでいます…" })); el.appendChild(card); return; }
    if (S.err) { card.appendChild(h("p", { class: "pt-pb-err", text: S.err })); card.appendChild(btn("読み直す", load)); el.appendChild(card); return; }
    var dr = C.getState(); delete dr.savedAt;
    var cur = S.status && S.status.entries.filter(function (e) { return e.version === S.current; })[0];
    var st = h("div", { class: "pt-pb-status" }, [
      h("div", {}, [h("span", { class: "pt-pb-k", text: "公開中" }), h("strong", { text: cur ? "版 " + cur.version + "（" + fmt(cur.published_at) + "）" : "まだ公開していません" }), cur ? h("small", { text: "プレイヤー " + cur.counts.players + " / 大会 " + cur.counts.tournaments + " / イベント " + cur.counts.events + (cur.note ? " ／ メモ：" + cur.note : "") }) : ""]),
      h("div", {}, [h("span", { class: "pt-pb-k", text: "この端末の下書き" }), h("strong", { text: "プレイヤー " + dr.players.length + " / 大会 " + dr.tournaments.length + " / イベント " + dr.events.length })])]);
    card.appendChild(st);
    var d = diff(S.published, dr);
    card.appendChild(h("h3", { text: "下書きと公開中の差分" }));
    card.appendChild(diffView(d, !!S.published));
    ui.noteInput = h("input", { type: "text", maxlength: "120", placeholder: "この公開のメモ（任意。例：韓国のプレイヤー3名を追加）" });
    var bar = h("div", { class: "pt-cm-bar" }, [ui.noteInput, btn("この下書きを公開する", publish, "primary"), btn("読み直す", load)]);
    if (S.published) bar.appendChild(btn("公開中の内容を下書きに取り込む", function () { pull(S.current); }));
    card.appendChild(bar);
    ui.note = h("p", { role: "status", "aria-live": "polite" }); card.appendChild(ui.note);
    el.appendChild(card);
    var hist = h("section", { class: "card" }); hist.appendChild(h("h2", { text: "公開の履歴" }));
    hist.appendChild(h("p", { class: "pt-cm-sub", text: "直近 " + (S.status ? S.status.keep : 30) + " 版まで残ります。「この版に戻す」は公開中の内容を戻します（新しい版として積まれます）。「下書きに取り込む」は手元の下書きを置き換えます。" }));
    if (!S.status || !S.status.entries.length) hist.appendChild(h("p", { text: "履歴はまだありません。" }));
    else {
      var tbl = h("table", { class: "pt-cm-tbl" }), body = h("tbody");
      tbl.appendChild(h("thead", {}, h("tr", {}, ["版", "公開日時", "件数", "メモ", ""].map(function (t) { return h("th", { text: t }); })))); tbl.appendChild(body);
      S.status.entries.forEach(function (e) {
        var isCur = e.version === S.current;
        body.appendChild(h("tr", { class: isCur ? "is-current" : "" }, [
          h("td", {}, [h("strong", { text: "版 " + e.version }), isCur ? h("span", { class: "pt-cm-badge v-verified", text: "公開中" }) : "", e.rollback_of ? h("small", { text: " 版" + e.rollback_of + "に戻した" }) : ""]),
          h("td", { text: fmt(e.published_at) }),
          h("td", { text: "P " + e.counts.players + " / T " + e.counts.tournaments + " / E " + e.counts.events }),
          h("td", { text: e.note || "—" }),
          h("td", { class: "pt-cm-act" }, [isCur ? "" : btn("この版に戻す", function () { rollback(e.version); }), btn("下書きに取り込む", function () { pull(e.version); })])]));
      });
      hist.appendChild(tbl);
    }
    el.appendChild(hist);
  }
  window.PTAdminCommunityPublish = Object.freeze({
    mount: function (el, context) { C = window.PTAdminCommunity; api = context.api; csrf = context.csrf; ui.root = el; load(); },
    refresh: function () { if (ui.root) load(); },
    _test: { diff: diff, canon: canon }
  });
})();
