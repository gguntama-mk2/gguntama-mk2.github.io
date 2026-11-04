/* PROJECT T 管理者ページ：技のアイコン設定。
   技を選び、アイコン（トルネード・パワークラッシュ…）にチェックを付けて保存すると、公開サイトの技表（技コマンドの欄の右はし）に反映される。
   設定していない技は、サイトの自動の決まりのまま。「自動に戻す」で、設定を消せる。
   権限（管理者・CSRF・Origin）・入力の検証・監査ログは、すべてサーバー側。 */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var CHAR_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
  var make = function (tag, text, cls) { var x = document.createElement(tag); if (text !== undefined) x.textContent = text; if (cls) x.className = cls; return x; };
  var ctx, host, characters = [], overrides = {}, catalog = [], sel = null, ui = {};

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
  function autoOf(charId, mv) {
    try { var w = ctx.win(); return iconsApi().auto(charId, mv, w.moveInfo(mv).tags.map(function (t) { return t.id; })); } catch (e) { return []; }
  }
  function kOf(mv, i) { return Number.isSafeInteger(mv.k) ? mv.k : i; }
  function effective(charId, mv, k) {
    var o = overrides[charId] && overrides[charId][String(k)];
    return o ? { icons: o.icons, custom: true } : { icons: autoOf(charId, mv), custom: false };
  }
  function label(id) { var c = catalog.find(function (x) { return x.id === id; }); return c ? c.label : id; }
  function iconImg(id, size) {
    var img = make("img"); img.src = "icons/" + id + ".webp"; img.alt = label(id); img.title = label(id); img.width = size; img.height = size; img.draggable = false; return img;
  }

  async function loadOverrides() {
    var d = await request("/api/v1/admin/move-icons");
    overrides = {}; d.entries.forEach(function (e) { (overrides[e.character_id] = overrides[e.character_id] || {})[String(e.site_k)] = e; });
  }
  function currentChar() { return characters.find(function (c) { return c.id === ui.char.value; }); }
  function renderList() {
    var c = currentChar(); ui.list.replaceChildren(); if (!c) return;
    var q = ui.q.value.normalize("NFKC").toLowerCase().trim(), shown = 0;
    var table = make("table"), head = make("tr");
    ["k", "技名", "コマンド", "いまの表示", "設定", ""].forEach(function (t) { head.appendChild(make("th", t)); });
    table.appendChild(head);
    c.moves.forEach(function (mv, i) {
      if (shown >= 250) return;
      var k = kOf(mv, i), cmd = (mv.a && mv.a.command) || "";
      if (q && (String(k) + " " + mv.name + " " + cmd).normalize("NFKC").toLowerCase().indexOf(q) < 0) return;
      shown++;
      var e = effective(c.id, mv, k), tr = make("tr");
      tr.appendChild(make("td", String(k))); tr.appendChild(make("td", mv.name)); tr.appendChild(make("td", cmd));
      var td = make("td"); td.className = "pt-mi-cell"; e.icons.forEach(function (id) { td.appendChild(iconImg(id, 22)); }); if (!e.icons.length) td.textContent = "なし";
      tr.appendChild(td); tr.appendChild(make("td", e.custom ? "管理者の設定" : "自動"));
      var b = make("button", "選ぶ"); b.type = "button"; b.className = "btn"; b.addEventListener("click", function () { choose(c, mv, k); });
      var bt = make("td"); bt.appendChild(b); tr.appendChild(bt);
      table.appendChild(tr);
    });
    ui.list.appendChild(table);
    ui.count.textContent = shown >= 250 ? "最初の250件を表示しています。検索で絞り込んでください。" : shown + "件";
  }
  function choose(c, mv, k) {
    sel = { char: c.id, k: k, name: mv.name, mv: mv };
    var e = effective(c.id, mv, k), have = {}; e.icons.forEach(function (id) { have[id] = 1; });
    ui.editor.replaceChildren(); ui.editor.hidden = false;
    ui.editor.appendChild(make("h3", c.name + "　" + k + " · " + mv.name));
    var grid = make("div", undefined, "pt-mi-grid");
    ui.boxes = {};
    catalog.forEach(function (it) {
      var lab = make("label", undefined, "pt-mi-opt"), cb = make("input"); cb.type = "checkbox"; cb.checked = !!have[it.id]; ui.boxes[it.id] = cb;
      lab.append(cb, iconImg(it.id, 32), make("span", it.label)); grid.appendChild(lab);
    });
    ui.editor.appendChild(grid);
    var auto = autoOf(c.id, mv);
    ui.editor.appendChild(make("p", "自動の判定：" + (auto.length ? auto.map(label).join("、") : "なし") + (e.custom ? "　（いまは管理者の設定が優先されています）" : "")));
    var save = make("button", "この内容で保存"); save.type = "button"; save.className = "btn primary";
    var reset = make("button", "自動に戻す"); reset.type = "button"; reset.className = "btn"; reset.disabled = !e.custom;
    save.addEventListener("click", function () { act(save, "set"); }); reset.addEventListener("click", function () { act(reset, "reset"); });
    var row = make("div", undefined, "pt-mi-actions"); row.append(save, reset); ui.editor.appendChild(row);
    ui.editor.scrollIntoView({ block: "nearest" });
  }
  async function act(btn, which) {
    if (!sel) return;
    var picked = catalog.filter(function (it) { return ui.boxes[it.id].checked; }).map(function (it) { return it.id; });
    if (which === "set" && picked.length > 6) { say("アイコンは6つまでです。", "error"); return; }
    if (which === "reset" && !confirm(sel.name + " のアイコン設定を消して、自動の判定に戻しますか？")) return;
    btn.disabled = true;
    try {
      await request("/api/v1/admin/move-icons/" + which, { method: "POST", body: JSON.stringify(which === "set" ? { character_id: sel.char, site_k: sel.k, move_name: sel.name, icons: picked } : { character_id: sel.char, site_k: sel.k }) });
      say(sel.name + (which === "set" ? " のアイコンを保存しました。公開サイトには、1分ほどで反映されます。" : " を自動の判定に戻しました。"), "ok");
      await loadOverrides(); var c = currentChar(), mv = sel.mv, k = sel.k; renderList(); if (c) choose(c, mv, k);
    } catch (e) { say("保存できませんでした：" + e.message, "error"); btn.disabled = false; }
  }
  function setCharacters(list) {
    characters = Array.isArray(list) ? list.filter(function (c) { return c && CHAR_RE.test(c.id) && Array.isArray(c.moves); }) : [];
    if (!ui.char) return;
    var prev = ui.char.value; ui.char.replaceChildren();
    characters.forEach(function (c) { var o = make("option", c.name + "（" + (c.en || c.id) + "）"); o.value = c.id; ui.char.appendChild(o); });
    if (characters.some(function (c) { return c.id === prev; })) ui.char.value = prev;
    ui.editor.hidden = true; sel = null; renderList();
  }
  function mount(target, context) {
    ctx = context; host = target; host.replaceChildren();
    var panel = make("section", undefined, "card");
    panel.appendChild(make("h2", "技のアイコン設定"));
    panel.appendChild(make("p", "技ごとに、技表のコマンド欄の右はしに出すアイコンを設定します。設定していない技は、自動の判定（トルネード・パワークラッシュ・ヒートエンゲージ・回復可能体力）のままです。"));
    ui.char = make("select"); ui.char.addEventListener("change", function () { ui.editor.hidden = true; sel = null; renderList(); });
    ui.q = make("input"); ui.q.type = "search"; ui.q.placeholder = "技名・コマンド・kで検索"; ui.q.addEventListener("input", renderList);
    var bar = make("div", undefined, "pt-mi-bar"); bar.append(ui.char, ui.q);
    ui.count = make("p", ""); ui.list = make("div", undefined, "tw"); ui.editor = make("div", undefined, "pt-mi-editor"); ui.editor.hidden = true;
    ui.note = make("p", "技を選んでください。"); ui.note.setAttribute("role", "status"); ui.note.setAttribute("aria-live", "polite");
    panel.append(bar, ui.count, ui.list, ui.editor, ui.note); host.appendChild(panel);
    var w = ctx.win && ctx.win(); var ic = w && w.PTIcons; catalog = ic ? ic.catalog : [];
    loadOverrides().then(function () { setCharacters(ctx.characters()); }).catch(function (e) { say("設定の一覧を取得できませんでした：" + e.message, "error"); setCharacters(ctx.characters()); });
  }
  function updateCharacters(list) { var w = ctx && ctx.win && ctx.win(); if (w && w.PTIcons) catalog = w.PTIcons.catalog; setCharacters(list); }
  window.PTAdminMoveIcons = Object.freeze({ mount: mount, updateCharacters: updateCharacters });
})();
