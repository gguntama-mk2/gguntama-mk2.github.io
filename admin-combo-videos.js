/* PROJECT T 管理者ページ：コンボ動画登録。
   コンボ集の収録コンボ（サイトに公開されているコンボ）を選び、YouTube に投稿した動画のURLを登録すると、公開サイトのコンボ集のカードに「動画を再生」が付く
   （サイトの従来の仕組みと同じ、YouTube の埋め込み再生。動画そのものは持たない）。
   ここで登録した動画は、コンボのデータの「動画（YouTubeのURL）」欄より優先して出る。「登録を解除」で、コンボのデータの内容に戻る。
   コンボのデータ（combos-live.json）には書き込まない。権限（管理者・CSRF・Origin）・URLの検査・監査ログは、すべてサーバー側。 */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var CHAR_RE = /^[a-z0-9][a-z0-9-]{0,47}$/, YT_ID = /^[A-Za-z0-9_-]{11}$/;
  var make = function (tag, text, cls) { var x = document.createElement(tag); if (text !== undefined) x.textContent = text; if (cls) x.className = cls; return x; };
  var ctx, host, ui = {}, chars = [], emb = {}, embRev = 0, live = null, registry = {}, sel = null, ready = false;

  async function request(path, init) {
    init = init || {};
    var headers = Object.assign({}, init.headers || {});
    if (init.method === "POST") { headers["X-CSRF-Token"] = ctx.csrf(); headers["Content-Type"] = "application/json"; }
    var res = await fetch(API + path, Object.assign({ credentials: "include" }, init, { headers: headers }));
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : "HTTP " + res.status);
    return body;
  }
  function say(text, state) { if (!ui.note) return; ui.note.textContent = text; ui.note.dataset.state = state || "neutral"; }

  /* ---- YouTube のURL（サイトのコンボ集 ytParse と同じ決まり。保存前の確認とプレビュー用。最終の検査はサーバー） ---- */
  function ytStart(v) {
    v = String(v == null ? "" : v).trim().toLowerCase(); if (!v) return 0;
    if (/^\d+$/.test(v)) return Math.min(+v, 43199);
    var m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(v);
    if (!m || !(m[1] || m[2] || m[3])) return 0;
    return Math.min((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0), 43199);
  }
  function ytParse(s) {
    s = String(s == null ? "" : s).trim();
    if (!s || s.length > 300 || /\s/.test(s)) return null;
    if (YT_ID.test(s)) return { id: s, start: 0 };
    var u; try { u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : "https://" + s); } catch (_) { return null; }
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    var h = u.hostname.toLowerCase().replace(/^(?:www|m|music)\./, ""), p = u.pathname.split("/").filter(Boolean), id = "";
    if (h === "youtu.be") id = p[0] || "";
    else if (h === "youtube.com" || h === "youtube-nocookie.com") {
      if (p[0] === "watch") id = u.searchParams.get("v") || "";
      else if (["embed", "shorts", "live", "v"].indexOf(p[0]) >= 0) id = p[1] || "";
    } else return null;
    if (!YT_ID.test(id)) return null;
    var hs = /[#&]t=([^&]+)/.exec(u.hash || "");
    return { id: id, start: ytStart(u.searchParams.get("t") || u.searchParams.get("start") || (hs ? hs[1] : "")) };
  }
  function canon(p) { return "https://youtu.be/" + p.id + (p.start ? "?t=" + p.start : ""); }
  function player(p, title) {            // YouTube の埋め込み（サイトのコンボ集と同じ youtube-nocookie.com）
    var f = make("iframe"); f.className = "pt-cv-frame"; f.title = title;
    f.src = "https://www.youtube-nocookie.com/embed/" + p.id + "?rel=0&playsinline=1" + (p.start ? "&start=" + p.start : "");
    f.setAttribute("allow", "encrypted-media; picture-in-picture"); f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin"); f.loading = "lazy";
    return f;
  }

  /* ---- コンボの一覧：サイトに公開されているコンボ（公開データ combos-live.json。無いキャラは、ファイルに入っている収録データ） ---- */
  function rowsOf(list) {
    var seen = {}, out = [];
    (Array.isArray(list) ? list : []).forEach(function (x) {
      if (!x || typeof x !== "object" || !Number.isInteger(x.k) || x.k < 1 || seen[x.k]) return;
      seen[x.k] = 1; out.push({ k: x.k, g: String(x.g || ""), n: String(x.n || ""), c: String(x.c || ""), d: x.d == null ? "" : String(x.d), yt: typeof x.yt === "string" ? x.yt : "" });
    });
    return out;
  }
  function combosOf(cid) { return rowsOf(live && live.combos && Array.isArray(live.combos[cid]) ? live.combos[cid] : emb[cid]); }
  async function loadLive() {
    live = null;
    try {
      var r = await fetch("combos-live.json?r=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      var p = await r.json();
      if (p && p.format === "tekken-combo-live" && Number.isInteger(p.rev) && p.rev > embRev && p.combos && typeof p.combos === "object") live = p;
    } catch (_) { /* 取れないときは、収録データで一覧を出す */ }
  }
  async function loadRegistry() {
    var d = await request("/api/v1/admin/combo-videos");
    registry = {}; d.entries.forEach(function (e) { (registry[e.character_id] = registry[e.character_id] || {})[String(e.combo_k)] = e; });
  }
  function regOf(cid, k) { return registry[cid] && registry[cid][String(k)] || null; }
  function label(c) { return c.n || c.c || "コンボ"; }

  function charsWithCombos() { return chars.filter(function (c) { return combosOf(c.id).length; }); }
  function fillChars() {
    if (!ui.char) return;
    var prev = ui.char.value, list = charsWithCombos(); ui.char.replaceChildren();
    list.forEach(function (c) {
      var n = combosOf(c.id).length, r = Object.keys(registry[c.id] || {}).length;
      var o = make("option", c.name + "（コンボ " + n + "件" + (r ? "・登録 " + r + "件" : "") + "）"); o.value = c.id; ui.char.appendChild(o);
    });
    if (list.some(function (c) { return c.id === prev; })) ui.char.value = prev;
  }
  function pageSize() { return window.matchMedia("(max-width:800px)").matches ? 30 : 200; }
  function closeEditor() {
    sel = null; delete ui.editor.dataset.open; ui.backdrop.hidden = true; ui.editor.replaceChildren();
    ui.editor.appendChild(make("p", "左の一覧でコンボの「選ぶ」を押すと、ここに動画の登録欄が出ます。", "pt-cv-hint"));
  }
  function renderList() {
    ui.list.replaceChildren();
    var cid = ui.char.value, all = combosOf(cid);
    if (!ready) { ui.count.textContent = "読み込み中…"; return; }
    if (!all.length) { ui.count.textContent = "サイトに公開されているコンボがありません。コンボ集でコンボを公開すると、ここに出ます。"; ui.more.hidden = true; return; }
    var q = ui.q.value.normalize("NFKC").toLowerCase().trim(), f = ui.filter.value;
    var rows = all.filter(function (c) {
      var has = !!(regOf(cid, c.k) || ytParse(c.yt));
      if (f === "with" && !has) return false;
      if (f === "without" && has) return false;
      if (f === "admin" && !regOf(cid, c.k)) return false;
      return !q || (c.k + " " + c.g + " " + c.n + " " + c.c + " " + c.d).normalize("NFKC").toLowerCase().indexOf(q) >= 0;
    });
    var limit = ui.visibleLimit || pageSize(), shown = rows.slice(0, limit);
    var table = make("table", undefined, "pt-cv-list"), thead = make("thead"), tbody = make("tbody"), head = make("tr");
    ["k", "分類", "コンボ名", "コマンド", "ダメージ", "動画", ""].forEach(function (t) { head.appendChild(make("th", t)); });
    thead.appendChild(head); table.append(thead, tbody);
    shown.forEach(function (c) {
      var tr = make("tr"), reg = regOf(cid, c.k), own = ytParse(c.yt);
      if (sel && sel.cid === cid && sel.k === c.k) tr.dataset.sel = "1";
      tr.appendChild(make("td", String(c.k))); tr.appendChild(make("td", c.g)); tr.appendChild(make("td", c.n)); tr.appendChild(make("td", c.c)); tr.appendChild(make("td", c.d));
      var st = make("td"), tag = make("span", reg ? "登録済み" : own ? "コンボのデータで設定" : "なし", "pt-cv-st"); tag.dataset.kind = reg ? "admin" : own ? "own" : "none";
      st.appendChild(tag); tr.appendChild(st);
      var b = make("button", "選ぶ", "btn"); b.type = "button"; b.addEventListener("click", function () { choose(cid, c); });
      var bt = make("td"); bt.appendChild(b); tr.appendChild(bt);
      tbody.appendChild(tr);
    });
    ui.list.appendChild(table);
    var nReg = Object.keys(registry[cid] || {}).length;
    ui.count.textContent = shown.length + " / " + rows.length + "件表示（このキャラのコンボ " + all.length + "件・ここで登録した動画 " + nReg + "件）";
    ui.more.hidden = shown.length >= rows.length;
    ui.more.textContent = "さらに " + Math.min(pageSize(), rows.length - shown.length) + "件を表示（残り " + (rows.length - shown.length) + "件）";
  }
  function choose(cid, c) {
    sel = { cid: cid, k: c.k, combo: c };
    renderList();
    var ch = chars.find(function (x) { return x.id === cid; }), reg = regOf(cid, c.k), own = ytParse(c.yt);
    ui.editor.replaceChildren(); ui.editor.dataset.open = "1"; ui.backdrop.hidden = false;
    var closeBtn = make("button", "× 閉じる", "btn pt-cv-close"); closeBtn.type = "button"; closeBtn.addEventListener("click", function () { closeEditor(); renderList(); });
    ui.editor.appendChild(closeBtn);
    ui.editor.appendChild(make("h3", (ch ? ch.name : cid) + "　#" + c.k + " · " + label(c)));
    if (c.c) ui.editor.appendChild(make("p", c.c, "pt-cv-cmd"));
    var lab = make("label", "動画（YouTubeのURL）", "pt-cv-lab"); lab.htmlFor = "ptCvUrl";
    var input = make("input"); input.type = "text"; input.id = "ptCvUrl"; input.maxLength = 300; input.inputMode = "url"; input.autocomplete = "off"; input.spellcheck = false;
    input.placeholder = "例：https://youtu.be/xxxxxxxxxxx"; input.value = reg ? reg.yt : "";
    var save = make("button", reg ? "この動画に変更する" : "この動画を登録する", "btn primary"); save.type = "button";
    var prev = make("button", "プレビュー", "btn"); prev.type = "button";
    var reset = make("button", "登録を解除", "btn danger"); reset.type = "button"; reset.disabled = !reg;
    var row = make("div", undefined, "pt-cv-actions"); row.append(save, prev, reset);
    var msg = make("p", "", "pt-cv-msg"); msg.setAttribute("role", "status");
    var box = make("div", undefined, "pt-cv-preview");
    function show(p, cap) {
      box.replaceChildren(make("p", cap, "pt-cv-hint"), player(p, label(c) + " の動画"));
      var a = make("a", "YouTubeで開く", "pt-cv-open"); a.href = canon(p); a.target = "_blank"; a.rel = "noopener noreferrer"; box.appendChild(a);
    }
    function parsed() {
      var p = ytParse(input.value);
      msg.dataset.state = p ? "neutral" : "error";
      msg.textContent = p ? "" : (input.value.trim() ? "動画のURLを読み取れませんでした。YouTubeの動画のURL（例：https://youtu.be/xxxxxxxxxxx）を貼ってください。" : "YouTubeの動画のURLを貼ってください。");
      if (!p) input.focus();
      return p;
    }
    prev.addEventListener("click", function () { var p = parsed(); if (p) show(p, "プレビュー（まだ登録していません）：" + canon(p)); });
    input.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); prev.click(); } });
    save.addEventListener("click", async function () {
      var p = parsed(); if (!p) return;
      save.disabled = true;
      try {
        await request("/api/v1/admin/combo-videos/set", { method: "POST", body: JSON.stringify({ character_id: cid, combo_k: c.k, combo_name: label(c).slice(0, 120), yt: canon(p) }) });
        await loadRegistry(); fillChars(); choose(cid, c);
        say("「" + label(c) + "」に動画を登録しました。公開サイトのコンボ集には、1分ほどで反映されます。", "ok");
      } catch (e) { msg.dataset.state = "error"; msg.textContent = "登録できませんでした：" + e.message; save.disabled = false; }
    });
    reset.addEventListener("click", async function () {
      if (!confirm("「" + label(c) + "」の動画の登録を解除しますか？" + (own ? "\n（解除すると、コンボのデータで設定されている動画に戻ります）" : "\n（解除すると、このコンボの動画は表示されなくなります）"))) return;
      reset.disabled = true;
      try {
        await request("/api/v1/admin/combo-videos/reset", { method: "POST", body: JSON.stringify({ character_id: cid, combo_k: c.k }) });
        await loadRegistry(); fillChars(); choose(cid, c);
        say("「" + label(c) + "」の動画の登録を解除しました。", "ok");
      } catch (e) { msg.dataset.state = "error"; msg.textContent = "解除できませんでした：" + e.message; reset.disabled = false; }
    });
    ui.editor.append(lab, input, row, msg);
    ui.editor.appendChild(make("p", "YouTubeに投稿した動画のURLを貼って「登録する」を押すと、公開サイトのコンボ集のこのコンボに「動画を再生」が付きます。「?t=90」のように開始位置を付けたURLも使えます。", "pt-cv-hint"));
    var rp = reg ? ytParse(reg.yt) : null;
    if (rp) show(rp, "いま登録されている動画：" + reg.yt);
    else if (own) show(own, "いまは、コンボのデータで設定されている動画が出ています：" + canon(own) + "（ここで登録すると、登録した動画が優先されます）");
    else box.appendChild(make("p", "このコンボには、まだ動画がありません。", "pt-cv-hint"));
    ui.editor.appendChild(box);
  }
  async function refresh() {
    if (!host) return;
    say("読み込み中…");
    try { await Promise.all([loadLive(), loadRegistry()]); ready = true; say("コンボを選んでください。"); }
    catch (e) { ready = true; say("登録の一覧を取得できませんでした：" + e.message, "error"); }
    fillChars(); closeEditor(); renderList();
  }
  function mount(target, context) {
    ctx = context; host = target; host.replaceChildren();
    var panel = make("section", undefined, "card");
    panel.appendChild(make("h2", "コンボ動画登録"));
    panel.appendChild(make("p", "コンボ集のコンボに、YouTubeに投稿した動画を登録します。登録すると、公開サイトのコンボ集のカードに「動画を再生」が付き、YouTubeの動画が埋め込みで再生されます（従来の動画と同じ表示です）。動画そのものはYouTubeに置いたまま、URLだけを登録します。", "pt-cv-hint"));
    ui.char = make("select"); ui.char.setAttribute("aria-label", "キャラクター"); ui.char.addEventListener("change", function () { ui.visibleLimit = 0; closeEditor(); renderList(); });
    ui.q = make("input"); ui.q.type = "search"; ui.q.placeholder = "コンボ名・コマンド・分類・kで検索"; ui.q.addEventListener("input", function () { ui.visibleLimit = 0; renderList(); });
    ui.filter = make("select"); ui.filter.setAttribute("aria-label", "動画の有無で絞り込む");
    [["all", "すべてのコンボ"], ["with", "動画あり"], ["without", "動画なし"], ["admin", "ここで登録した動画"]].forEach(function (o) { var x = make("option", o[1]); x.value = o[0]; ui.filter.appendChild(x); });
    ui.filter.addEventListener("change", function () { ui.visibleLimit = 0; renderList(); });
    var reload = make("button", "一覧を更新", "btn"); reload.type = "button"; reload.addEventListener("click", function () { refresh(); });
    var bar = make("div", undefined, "pt-cv-bar"); bar.append(ui.char, ui.q, ui.filter, reload);
    ui.count = make("p", "", "pt-cv-count");
    ui.list = make("div", undefined, "tw"); ui.editor = make("aside", undefined, "pt-cv-editor");
    var wrap = make("div", undefined, "pt-cv-wrap"); wrap.append(ui.list, ui.editor);
    ui.more = make("button", "さらに表示", "btn pt-cv-more"); ui.more.type = "button"; ui.more.hidden = true;
    ui.more.addEventListener("click", function () { ui.visibleLimit = (ui.visibleLimit || pageSize()) + pageSize(); renderList(); });
    ui.backdrop = make("div", undefined, "pt-cv-backdrop"); ui.backdrop.hidden = true;
    ui.backdrop.addEventListener("click", function () { closeEditor(); renderList(); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && !host.hidden && ui.editor.dataset.open === "1") { ev.preventDefault(); closeEditor(); renderList(); } });
    ui.note = make("p", "読み込み中…", "pt-cv-note"); ui.note.setAttribute("role", "status"); ui.note.setAttribute("aria-live", "polite");
    panel.append(bar, ui.count, wrap, ui.more, ui.note); host.append(panel, ui.backdrop);
    closeEditor();
  }
  // 管理画面が、サイト（pc.html）の収録データを読み終えたときに呼ぶ：キャラの一覧と、ファイルに入っているコンボ
  function updateData(d) {
    chars = (d && Array.isArray(d.characters) ? d.characters : []).filter(function (c) { return c && CHAR_RE.test(c.id); }).map(function (c) { return { id: c.id, name: c.name || c.id }; });
    emb = d && d.combos && typeof d.combos === "object" ? d.combos : {};
    embRev = d && Number.isInteger(d.rev) && d.rev >= 0 ? d.rev : 0;
    return refresh();
  }
  window.PTAdminComboVideos = Object.freeze({ mount: mount, updateData: updateData, refresh: refresh });
})();
