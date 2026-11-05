/* PROJECT T 管理者ページ：技のアイコン設定。
   技を選び、アイコン（トルネード・パワークラッシュ…）にチェックを付けて保存すると、公開サイトの技表（技コマンドの欄の右はし）に反映される。
   設定していない技は、サイトの自動の決まりのまま。「自動に戻す」で、設定を消せる。
   権限（管理者・CSRF・Origin）・入力の検証・監査ログは、すべてサーバー側。 */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var CHAR_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
  var make = function (tag, text, cls) { var x = document.createElement(tag); if (text !== undefined) x.textContent = text; if (cls) x.className = cls; return x; };
  var ctx, host, characters = [], overrides = {}, catalog = [], sel = null, ui = {}, checked = {}, bulkPick = { c: {}, g: {}, a: {} }, bulkMode = "add";
  var ckey = function (c, k) { return c + "/" + k; };
  var nChecked = function () { return Object.keys(checked).length; };

  async function request(path, init) {
    init = init || {};
    var headers = Object.assign({}, init.headers || {});
    if (init.method === "POST") { headers["X-CSRF-Token"] = ctx.csrf(); headers["Content-Type"] = "application/json"; }
    var res = await fetch(API + path, Object.assign({ credentials: "include" }, init, { headers: headers }));
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : "HTTP " + res.status);
    return body;
  }
  function say(text, state) { ui.note.textContent = text; ui.note.dataset.state = state || "neutral"; }
  function iconsApi() { var w = ctx.win && ctx.win(); return w && w.PTIcons ? w.PTIcons : null; }
  var ZN = { c: "コマンドの横", g: "地上ヒット・ガード時", a: "空中ヒット時" };
  function isCmd(id) { var c = catalog.find(function (x) { return x.id === id; }); return !!(c && c.cmd); }
  function order(list) { return catalog.map(function (it) { return it.id; }).filter(function (id) { return list.indexOf(id) >= 0; }); }
  function splitFlat(list) {            // 従来の形式（場所を分けない一覧）：ホーミング／パワークラッシュ→コマンドの横、ほか→地上ヒット・ガード時
    var l = order(list || []); return { c: l.filter(isCmd), g: l.filter(function (id) { return !isCmd(id); }), a: [] };
  }
  function autoPlace(charId, mv) {
    try { var w = ctx.win(); return iconsApi().autoSplit(charId, mv, w.moveInfo(mv).tags.map(function (t) { return t.id; })); } catch (e) { return { c: [], g: [], a: [] }; }
  }
  function flatten(p) { return order([].concat(p.c, p.g, p.a)); }
  function kOf(mv, i) { return Number.isSafeInteger(mv.k) ? mv.k : i; }
  function effective(charId, mv, k) {
    var o = overrides[charId] && overrides[charId][String(k)];
    if (!o) return { place: autoPlace(charId, mv), custom: false };
    var zoned = Array.isArray(o.ground) || Array.isArray(o.air);
    return { place: zoned ? { c: order(o.icons || []), g: order(o.ground || []), a: order(o.air || []) } : splitFlat(o.icons), custom: true };
  }
  function placeText(p) { return [["c", p.c], ["g", p.g], ["a", p.a]].filter(function (x) { return x[1].length; }).map(function (x) { return ZN[x[0]] + "：" + x[1].map(label).join("、"); }).join("　／　") || "なし"; }
  function label(id) { var c = catalog.find(function (x) { return x.id === id; }); return c ? c.label : id; }
  function iconImg(id, size) {
    var img = make("img"); img.src = "icons/" + id + ".webp"; img.alt = label(id); img.title = label(id); img.width = size; img.height = size; img.draggable = false; return img;
  }

  async function loadOverrides() {
    var d = await request("/api/v1/admin/move-icons");
    overrides = {}; d.entries.forEach(function (e) { (overrides[e.character_id] = overrides[e.character_id] || {})[String(e.site_k)] = e; });
  }
  function closeEditor() {
    sel = null; delete ui.editor.dataset.open; ui.editor.replaceChildren();
    if (nChecked()) { renderBulk(); delete ui.editor.dataset.open; return; }
    ui.editor.appendChild(make("p", "左の一覧で技の「選ぶ」を押すと、ここにアイコン一覧が出ます。右はしのチェックを入れると、複数の技にまとめて設定できます。", "pt-mi-hint"));
  }
  function updateBulkBar() {
    var n = nChecked();
    if (ui.bulkBtn) { ui.bulkBtn.hidden = !n; ui.bulkBtn.textContent = "選択中 " + n + "件にアイコンを設定する"; }
  }
  function onCheckChange() { updateBulkBar(); if (!sel) { renderBulk(); if (!nChecked()) closeEditor(); } }
  function zoneEditor(have, onChange) {
    ui.boxes = { c: {}, g: {}, a: {} };
    var wrap = make("div", undefined, "pt-mi-zones");
    function box(z, id) {
      var cb = make("input"); cb.type = "checkbox"; cb.checked = !!have[z][id]; cb.setAttribute("aria-label", ZN[z] + "：" + label(id)); ui.boxes[z][id] = cb;
      cb.addEventListener("change", function () { if (onChange) onChange(z, id, cb.checked); }); return cb;
    }
    wrap.appendChild(make("h4", "コマンドの横（地上・空中にかかわらず出るもの）"));
    var g1 = make("div", undefined, "pt-mi-grid");
    catalog.filter(function (it) { return it.cmd; }).forEach(function (it) { var lab = make("label", undefined, "pt-mi-opt"); lab.append(box("c", it.id), iconImg(it.id, 28), make("span", it.label)); g1.appendChild(lab); });
    wrap.appendChild(g1);
    wrap.appendChild(make("h4", "ヒットしたときに出す（地上／空中）"));
    var tb = make("table", undefined, "pt-mi-matrix"), hd = make("tr");
    ["アイコン", "地上ヒット・ガード時", "空中ヒット時"].forEach(function (x) { hd.appendChild(make("th", x)); }); tb.appendChild(hd);
    catalog.filter(function (it) { return !it.cmd; }).forEach(function (it) {
      var tr = make("tr"), n = make("td", undefined, "pt-mi-nm"); n.append(iconImg(it.id, 22), make("span", it.label.split("（")[0])); n.title = it.label;
      var g = make("td", undefined, "pt-mi-ck2"), a = make("td", undefined, "pt-mi-ck2"); g.appendChild(box("g", it.id)); a.appendChild(box("a", it.id));
      tr.append(n, g, a); tb.appendChild(tr);
    });
    wrap.appendChild(tb);
    return wrap;
  }
  function pickedOf() { var o = {}; ["c", "g", "a"].forEach(function (z) { o[z] = order(Object.keys(ui.boxes[z]).filter(function (id) { return ui.boxes[z][id].checked; })); }); return o; }
  function renderBulk() {
    var keys = Object.keys(checked), n = keys.length;
    ui.editor.replaceChildren(); ui.editor.dataset.open = "1";
    var closeBtn = make("button", "× 閉じる", "btn pt-mi-close"); closeBtn.type = "button"; closeBtn.addEventListener("click", function () { delete ui.editor.dataset.open; });
    ui.editor.appendChild(closeBtn);
    ui.editor.appendChild(make("h3", "まとめて設定：" + n + "件を選択中"));
    var save = make("button", n + "件に保存"); save.type = "button"; save.className = "btn primary";
    var modes = make("div", undefined, "pt-mi-modes");
    var MODEHINT = { add: "いま付いているアイコンは残して、選んだアイコンを足します", remove: "選んだアイコンだけを、取り外します", replace: "選んだアイコンだけにします（選ばなかった欄は、空になります）" };
    [["add", "追加する"], ["remove", "外す"], ["replace", "置き換える"]].forEach(function (m) {
      var lab = make("label", undefined, "pt-mi-mode"), r = make("input"); r.type = "radio"; r.name = "pt-mi-mode"; r.value = m[0]; r.checked = bulkMode === m[0];
      r.addEventListener("change", function () { bulkMode = m[0]; hint.textContent = MODEHINT[m[0]]; }); lab.append(r, make("span", m[1])); modes.appendChild(lab);
    });
    var hint = make("p", MODEHINT[bulkMode], "pt-mi-hint");
    var reset = make("button", "自動に戻す"); reset.type = "button"; reset.className = "btn";
    var clear = make("button", "選択をすべて外す"); clear.type = "button"; clear.className = "btn";
    save.addEventListener("click", function () { bulkAct("set"); });
    reset.addEventListener("click", function () { bulkAct("reset"); });
    clear.addEventListener("click", function () { checked = {}; bulkPick = { c: {}, g: {}, a: {} }; updateBulkBar(); closeEditor(); renderList(); });
    var row = make("div", undefined, "pt-mi-actions"); row.append(save, reset, clear); ui.editor.appendChild(row);
    ui.editor.appendChild(modes); ui.editor.appendChild(hint);
    ui.editor.appendChild(zoneEditor(bulkPick, function (z, id, on) { if (on) bulkPick[z][id] = 1; else delete bulkPick[z][id]; }));
    var names = keys.slice(0, 8).map(function (k) { var c = checked[k]; return c.cname + " " + c.k + " " + c.name; });
    ui.editor.appendChild(make("p", "保存を押すまで、チェックもアイコンの選択も残ります。対象：" + names.join("、") + (n > 8 ? " ほか" + (n - 8) + "件" : ""), "pt-mi-hint"));
  }
  async function bulkAct(which) {
    var keys = Object.keys(checked), picked = pickedOf(), any = picked.c.length + picked.g.length + picked.a.length;
    if (!keys.length) return;
    if (which === "set" && ["c", "g", "a"].some(function (z) { return picked[z].length > 6; })) { say("アイコンは、1つの欄に6つまでです。", "error"); return; }
    if (which === "reset" && !confirm(keys.length + "件の技のアイコン設定を消して、自動の判定に戻しますか？")) return;
    if (which === "set" && !any && bulkMode !== "replace") { say("追加・取り外しするアイコンを選んでください。", "error"); return; }
    if (which === "set" && !any && !confirm("アイコンが1つも選ばれていません。" + keys.length + "件を「アイコンなし」にしますか？")) return;
    var btns = ui.editor.querySelectorAll("button"); btns.forEach(function (b) { b.disabled = true; });
    var done = 0, skipped = 0, failed = [], i = 0;
    async function worker() {
      while (i < keys.length) {
        var key = keys[i++], c = checked[key];
        try {
          var next = picked;
          if (which === "set" && bulkMode !== "replace") {          // 追加／取り外し：その技のいまのアイコン（管理者の設定、なければ自動）を欄ごとにもとにして計算する
            var cur = effective(c.char, c.mv, c.k).place; next = {};
            ["c", "g", "a"].forEach(function (z) { next[z] = order(bulkMode === "add" ? cur[z].concat(picked[z]) : cur[z].filter(function (x) { return picked[z].indexOf(x) < 0; })); });
            if (["c", "g", "a"].some(function (z) { return next[z].length > 6; })) throw new Error("アイコンが6つを超えます");
            if (["c", "g", "a"].every(function (z) { return next[z].join() === cur[z].join(); })) { delete checked[key]; skipped++; continue; }   // 変わらない技は、書き込まない
          }
          await request("/api/v1/admin/move-icons/" + which, { method: "POST", body: JSON.stringify(which === "set" ? { character_id: c.char, site_k: c.k, move_name: c.name, icons: next.c, ground: next.g, air: next.a } : { character_id: c.char, site_k: c.k }) });
          delete checked[key]; done++;
        } catch (e) { failed.push(c.name + "（" + e.message + "）"); }
        say("保存中… " + (done + failed.length) + " / " + keys.length, "neutral");
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
    try { await loadOverrides(); } catch (e) {}
    if (!failed.length) bulkPick = { c: {}, g: {}, a: {} };
    updateBulkBar(); renderList(); closeEditor();
    say(done + "件を" + (which === "set" ? "保存しました。公開サイトには、1分ほどで反映されます。" : "自動の判定に戻しました。") + (skipped ? "　（変更がなかった" + skipped + "件は、そのままです）" : "") + (failed.length ? "　保存できなかった技が" + failed.length + "件あります（チェックは残してあります）：" + failed.slice(0, 3).join("、") : ""), failed.length ? "error" : "ok");
  }
  function currentChar() { return characters.find(function (c) { return c.id === ui.char.value; }); }
  function renderList() {
    var c = currentChar(); ui.list.replaceChildren(); if (!c) return;
    var q = ui.q.value.normalize("NFKC").toLowerCase().trim(), shown = 0;
    var table = make("table", undefined, "pt-mi-list"), head = make("tr");
    ["k", "技名", "コマンド", "いまの表示", "設定", "", ""].forEach(function (t) { head.appendChild(make("th", t)); });
    var allTh = head.lastChild, allCb = make("input"); allCb.type = "checkbox"; allCb.title = "表示中の技をすべてチェック／解除"; allCb.setAttribute("aria-label", "表示中の技をすべてチェック"); allTh.appendChild(allCb);
    var visible = [];
    table.appendChild(head);
    c.moves.forEach(function (mv, i) {
      if (shown >= 250) return;
      var k = kOf(mv, i), cmd = (mv.a && mv.a.command) || "";
      if (q && (String(k) + " " + mv.name + " " + cmd).normalize("NFKC").toLowerCase().indexOf(q) < 0) return;
      shown++;
      var e = effective(c.id, mv, k), tr = make("tr");
      if (sel && sel.char === c.id && sel.k === k) tr.dataset.sel = "1";
      tr.appendChild(make("td", String(k))); tr.appendChild(make("td", mv.name)); tr.appendChild(make("td", cmd));
      var td = make("td"), box = make("div", undefined, "pt-mi-cell");
      [["c", "横"], ["g", "地"], ["a", "空"]].forEach(function (z) { if (!e.place[z[0]].length) return; var g = make("span", undefined, "pt-mi-zg"); g.title = ZN[z[0]]; g.appendChild(make("b", z[1])); e.place[z[0]].forEach(function (id) { g.appendChild(iconImg(id, 22)); }); box.appendChild(g); });
      if (!flatten(e.place).length) box.textContent = "なし"; td.appendChild(box);
      tr.appendChild(td); tr.appendChild(make("td", e.custom ? "管理者の設定" : "自動"));
      var b = make("button", "選ぶ"); b.type = "button"; b.className = "btn"; b.addEventListener("click", function () { choose(c, mv, k); });
      var bt = make("td"); bt.appendChild(b); tr.appendChild(bt);
      var ck = make("td", undefined, "pt-mi-ck"), cb = make("input"), key = ckey(c.id, k); cb.type = "checkbox"; cb.checked = !!checked[key]; cb.setAttribute("aria-label", mv.name + "を一括設定の対象にする");
      var entry = { char: c.id, cname: c.name, k: k, name: mv.name, mv: mv };
      cb.addEventListener("change", function () { if (cb.checked) checked[key] = entry; else delete checked[key]; syncAll(); onCheckChange(); });
      visible.push({ cb: cb, key: key, entry: entry });
      ck.appendChild(cb); tr.appendChild(ck);
      table.appendChild(tr);
    });
    function syncAll() { var n = visible.filter(function (v) { return checked[v.key]; }).length; allCb.checked = visible.length > 0 && n === visible.length; allCb.indeterminate = n > 0 && n < visible.length; }
    allCb.addEventListener("change", function () { visible.forEach(function (v) { v.cb.checked = allCb.checked; if (allCb.checked) checked[v.key] = v.entry; else delete checked[v.key]; }); syncAll(); onCheckChange(); });
    syncAll(); updateBulkBar();
    ui.list.appendChild(table);
    ui.count.textContent = shown >= 250 ? "最初の250件を表示しています。検索で絞り込んでください。" : shown + "件";
  }
  function choose(c, mv, k) {
    sel = { char: c.id, k: k, name: mv.name, mv: mv };
    renderList();                                                  // 選んだ行に印を付ける（ページの位置は動かさない）
    var e = effective(c.id, mv, k), have = { c: {}, g: {}, a: {} }; ["c", "g", "a"].forEach(function (z) { e.place[z].forEach(function (id) { have[z][id] = 1; }); });
    ui.editor.replaceChildren(); ui.editor.dataset.open = "1";
    var closeBtn = make("button", "× 閉じる", "btn pt-mi-close"); closeBtn.type = "button"; closeBtn.addEventListener("click", function () { closeEditor(); renderList(); });
    ui.editor.appendChild(closeBtn);
    ui.editor.appendChild(make("h3", c.name + "　" + k + " · " + mv.name));
    var save = make("button", "この内容で保存"); save.type = "button"; save.className = "btn primary";
    var reset = make("button", "自動に戻す"); reset.type = "button"; reset.className = "btn"; reset.disabled = !e.custom;
    save.addEventListener("click", function () { act(save, "set"); }); reset.addEventListener("click", function () { act(reset, "reset"); });
    var row = make("div", undefined, "pt-mi-actions"); row.append(save, reset); ui.editor.appendChild(row);   // 保存ボタンは上に置く
    ui.editor.appendChild(zoneEditor(have));
    ui.editor.appendChild(make("p", "自動の判定　" + placeText(autoPlace(c.id, mv)) + (e.custom ? "　（いまは管理者の設定が優先されています）" : ""), "pt-mi-hint"));
  }
  async function act(btn, which) {
    if (!sel) return;
    var picked = pickedOf();
    if (which === "set" && ["c", "g", "a"].some(function (z) { return picked[z].length > 6; })) { say("アイコンは、1つの欄に6つまでです。", "error"); return; }
    if (which === "reset" && !confirm(sel.name + " のアイコン設定を消して、自動の判定に戻しますか？")) return;
    btn.disabled = true;
    try {
      await request("/api/v1/admin/move-icons/" + which, { method: "POST", body: JSON.stringify(which === "set" ? { character_id: sel.char, site_k: sel.k, move_name: sel.name, icons: picked.c, ground: picked.g, air: picked.a } : { character_id: sel.char, site_k: sel.k }) });
      say(sel.name + (which === "set" ? " のアイコンを保存しました。公開サイトには、1分ほどで反映されます。" : " を自動の判定に戻しました。"), "ok");
      await loadOverrides(); var c = currentChar(), mv = sel.mv, k = sel.k; if (c) choose(c, mv, k);
    } catch (e) { say("保存できませんでした：" + e.message, "error"); btn.disabled = false; }
  }
  function setCharacters(list) {
    characters = Array.isArray(list) ? list.filter(function (c) { return c && CHAR_RE.test(c.id) && Array.isArray(c.moves); }) : [];
    if (!ui.char) return;
    var prev = ui.char.value; ui.char.replaceChildren();
    characters.forEach(function (c) { var o = make("option", c.name + "（" + (c.en || c.id) + "）"); o.value = c.id; ui.char.appendChild(o); });
    if (characters.some(function (c) { return c.id === prev; })) ui.char.value = prev;
    closeEditor(); renderList();
  }
  function mount(target, context) {
    ctx = context; host = target; host.replaceChildren();
    var panel = make("section", undefined, "card");
    panel.appendChild(make("h2", "技のアイコン設定"));
    panel.appendChild(make("p", "技ごとに、技表に出すアイコンを設定します。ホーミング・パワークラッシュは、コマンドの右はし。そのほかは、「地上ヒット・ガード時」「空中ヒット時」の欄に出ます。設定していない技は、自動の判定（トルネード・ヒートエンゲージ・リカバリアブルダメージ→地上ヒット・ガード時、ホーミング・パワークラッシュ→コマンドの横）のままです。"));
    ui.char = make("select"); ui.char.addEventListener("change", function () { closeEditor(); renderList(); });
    ui.q = make("input"); ui.q.type = "search"; ui.q.placeholder = "技名・コマンド・kで検索"; ui.q.addEventListener("input", renderList);
    var bar = make("div", undefined, "pt-mi-bar"); bar.append(ui.char, ui.q);
    ui.count = make("p", ""); ui.bulkBtn = make("button", "", "btn primary pt-mi-bulkbtn"); ui.bulkBtn.type = "button"; ui.bulkBtn.hidden = true; ui.bulkBtn.addEventListener("click", function () { if (!sel) renderBulk(); }); ui.list = make("div", undefined, "tw"); ui.editor = make("aside", undefined, "pt-mi-editor"); ui.editor.setAttribute("aria-label", "アイコンの設定"); closeEditor();
    var wrap = make("div", undefined, "pt-mi-wrap"); wrap.append(ui.list, ui.editor);
    ui.note = make("p", "技を選んでください。"); ui.note.setAttribute("role", "status"); ui.note.setAttribute("aria-live", "polite");
    panel.append(bar, ui.count, ui.bulkBtn, wrap, ui.note); host.appendChild(panel);
    var w = ctx.win && ctx.win(); var ic = w && w.PTIcons; catalog = ic ? ic.catalog : [];
    loadOverrides().then(function () { setCharacters(ctx.characters()); }).catch(function (e) { say("設定の一覧を取得できませんでした：" + e.message, "error"); setCharacters(ctx.characters()); });
  }
  function updateCharacters(list) { var w = ctx && ctx.win && ctx.win(); if (w && w.PTIcons) catalog = w.PTIcons.catalog; setCharacters(list); }
  window.PTAdminMoveIcons = Object.freeze({ mount: mount, updateCharacters: updateCharacters });
})();
