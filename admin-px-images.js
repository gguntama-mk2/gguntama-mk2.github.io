/* PROJECT T 管理者ページ：背景の差し替え・ギャラリーの画像追加。
   - 背景：キャラの背景を、選んだ画像に替える（16:9にそろえて保存）。「元に戻す」で、サイトに入っている絵に戻る
   - ギャラリー：キャラの画像を増やす（元の画像はそのまま）。追加した画像は削除できる
   権限（管理者・CSRF・Origin）・画像の種類の判定・容量の上限・監査ログは、すべてサーバー側。公開サイトには1分ほどで反映される */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var CHAR_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
  var BG_W = 1400, BG_H = 788, MAX_BYTES = 12 * 1024 * 1024;
  var make = function (tag, text, cls) { var x = document.createElement(tag); if (text !== undefined) x.textContent = text; if (cls) x.className = cls; return x; };
  var ctx, host, characters = [], items = [], ui = {}, urls = {}, busy = false;

  async function request(path, init) {
    init = init || {};
    var headers = Object.assign({}, init.headers || {});
    if (init.method === "POST") { headers["X-CSRF-Token"] = ctx.csrf(); if (typeof init.body === "string") headers["Content-Type"] = "application/json"; }
    var res = await fetch(API + path, Object.assign({ credentials: "include" }, init, { headers: headers }));
    var body = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(typeof body.detail === "string" ? body.detail : "HTTP " + res.status);
    return body;
  }
  function say(text, state) { ui.note.textContent = text; ui.note.dataset.state = state || "neutral"; }
  function cur() { return ui.char && ui.char.value; }
  function pxs() { var w = ctx.win && ctx.win(); return w && w.PXS ? w.PXS : null; }
  function overridden() { return items.map(function (x) { return x.id; }); }   // 登録済みの絵（サイトに入っている絵ではない）
  function builtin(id) { var S = pxs(); return !!(S && S.has(id) && overridden().indexOf(id) < 0); }
  function builtinGallery(id) {
    var S = pxs(); if (!S) return [];
    var ov = overridden();
    return S.ids().filter(function (k) { return (k === id || k.indexOf(id + "~") === 0) && ov.indexOf(k) < 0; }).sort();
  }
  function entry(id) { return items.find(function (x) { return x.id === id; }); }

  async function loadItems() { items = (await request("/api/v1/admin/px-overrides")).items || []; }
  function fileUrl(it) {      // 登録済みの画像を表示用に取り出す（同じ画像は使い回す）
    if (urls[it.sha]) return Promise.resolve(urls[it.sha]);
    return fetch(API + "/api/v1/px-overrides/file/" + it.sha, { credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); })
      .then(function (b) { return (urls[it.sha] = URL.createObjectURL(b)); });
  }
  function thumb(src, label) {
    var f = make("figure", undefined, "pt-px-fig"); var im = make("img"); im.alt = label; im.loading = "lazy"; im.draggable = false;
    if (typeof src === "string") im.src = src; else src.then(function (u) { im.src = u; }).catch(function () { im.alt = label + "（表示できません）"; });
    f.appendChild(im); return f;
  }
  async function decode(file) {
    if (typeof createImageBitmap === "function") { try { return await createImageBitmap(file); } catch (e) {} }
    return new Promise(function (ok, ng) { var u = URL.createObjectURL(file), im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ng(new Error("画像として読めませんでした")); }; im.src = u; });
  }
  function toBlob(cv, type, q) { return new Promise(function (ok, ng) { cv.toBlob(function (b) { b ? ok(b) : ng(new Error("画像を変換できませんでした")); }, type, q); }); }
  async function prepBg(file) {       // 16:9（1400×788）に中央で切り抜いて WebP にする
    var bm = await decode(file), w = bm.width || bm.naturalWidth, h = bm.height || bm.naturalHeight;
    var k = Math.max(BG_W / w, BG_H / h), cw = BG_W / k, ch = BG_H / k;
    var cv = document.createElement("canvas"); cv.width = BG_W; cv.height = BG_H;
    var g = cv.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bm, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, BG_W, BG_H);
    return toBlob(cv, "image/webp", 0.92);
  }
  async function prepGallery(file) {  // そのまま保存（大きすぎるときだけ、縮めて WebP にする）
    if (/^image\/(png|jpeg|webp|avif)$/.test(file.type) && file.size <= MAX_BYTES) return file;
    var bm = await decode(file), w = bm.width || bm.naturalWidth, h = bm.height || bm.naturalHeight, k = Math.min(1, 4096 / Math.max(w, h));
    var cv = document.createElement("canvas"); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    cv.getContext("2d").drawImage(bm, 0, 0, cv.width, cv.height);
    var b = await toBlob(cv, "image/webp", 0.92);
    if (b.size > MAX_BYTES) throw new Error("画像が大きすぎます（12MBまで）");
    return b;
  }
  async function upload(kind, file) {
    var fd = new FormData(); fd.append("character_id", cur()); fd.append("kind", kind);
    fd.append("image", kind === "bg" ? await prepBg(file) : await prepGallery(file), "image");
    return request("/api/v1/admin/px-overrides/set", { method: "POST", body: fd });
  }
  async function run(label, fn) {
    if (busy) return; busy = true; ui.root.setAttribute("aria-busy", "true");
    try { await fn(); await loadItems(); render(); say(label + "しました。公開サイトには、1分ほどで反映されます。", "ok"); }
    catch (e) { say(label + "できませんでした：" + e.message, "error"); }
    finally { busy = false; ui.root.removeAttribute("aria-busy"); }
  }
  async function remove(id, label) {
    if (!confirm(label + "を削除します。元に戻せません。よろしいですか？")) return;
    await run("削除", function () { return request("/api/v1/admin/px-overrides/remove", { method: "POST", body: JSON.stringify({ id: id }) }); });
  }
  function picker(text, multiple, cb) {
    var lab = make("label", undefined, "btn pt-px-pick"); lab.appendChild(make("span", text));
    var inp = make("input"); inp.type = "file"; inp.accept = "image/png,image/jpeg,image/webp,image/avif"; inp.multiple = !!multiple; inp.hidden = true;
    inp.addEventListener("change", function () { var fs = Array.prototype.slice.call(inp.files || []); inp.value = ""; if (fs.length) cb(fs); });
    lab.appendChild(inp); return lab;
  }
  function render() {
    var id = cur(); ui.body.replaceChildren(); if (!id) return;
    var ch = characters.find(function (c) { return c.id === id; });
    // 背景
    var bg = make("section", undefined, "pt-px-sec"); bg.appendChild(make("h3", "背景の差し替え"));
    var S = pxs(), o = entry(id);
    if (!o && !builtin(id)) {
      bg.appendChild(make("p", "このキャラには、まだ背景がありません（背景が入っているキャラだけ差し替えできます）。", "pt-px-sub"));
    } else {
      bg.appendChild(make("p", o ? "差し替え中の背景です。「元に戻す」でサイトに入っている絵に戻ります。" : "いまはサイトに入っている背景です。画像を選ぶと、1400×788（16:9）に中央で切り抜いて差し替えます。", "pt-px-sub"));
      bg.appendChild(thumb(o ? fileUrl(o) : (S ? S.url(id) : ""), (ch ? ch.name : id) + "の背景"));
      var row = make("div", undefined, "pt-px-row");
      row.appendChild(picker(o ? "別の画像に差し替える" : "背景を差し替える", false, function (fs) { run("背景を差し替え", function () { return upload("bg", fs[0]); }); }));
      if (o) { var rb = make("button", "元に戻す", "btn"); rb.type = "button"; rb.addEventListener("click", function () { remove(id, "差し替えた背景"); }); row.appendChild(rb); }
      bg.appendChild(row);
    }
    // ギャラリー
    var ga = make("section", undefined, "pt-px-sec"); ga.appendChild(make("h3", "ギャラリーの画像"));
    ga.appendChild(make("p", "追加した画像は、サイトのギャラリー（" + (ch ? ch.name : id) + "）の最後に並びます。元の画像はそのまま残ります。png / jpeg / webp / avif、1枚12MBまで。", "pt-px-sub"));
    var grid = make("div", undefined, "pt-px-grid");
    builtinGallery(id).forEach(function (k) { var c = make("div", undefined, "pt-px-card"); c.appendChild(thumb(S ? S.url(k) : "", "サイトの画像")); c.appendChild(make("small", "サイト内の画像")); grid.appendChild(c); });
    items.filter(function (it) { return it.kind === "gallery" && it.character_id === id; }).forEach(function (it) {
      var c = make("div", undefined, "pt-px-card"); c.appendChild(thumb(fileUrl(it), "追加した画像" + it.id.split("~")[1]));
      var b = make("button", "削除", "btn pt-px-del"); b.type = "button"; b.addEventListener("click", function () { remove(it.id, "追加した画像"); }); c.appendChild(b); grid.appendChild(c);
    });
    ga.appendChild(grid);
    var r2 = make("div", undefined, "pt-px-row");
    r2.appendChild(picker("画像を追加する（複数選べます）", true, function (fs) {
      run("画像を追加", async function () { for (var i = 0; i < fs.length; i++) await upload("gallery", fs[i]); });
    }));
    ga.appendChild(r2);
    ui.body.append(bg, ga);
  }
  function setCharacters(list) {
    characters = Array.isArray(list) ? list.filter(function (c) { return c && CHAR_RE.test(c.id); }) : [];
    if (!ui.char) return;
    var prev = ui.char.value; ui.char.replaceChildren();
    characters.forEach(function (c) { var o = make("option", c.name + "（" + (c.en || c.id) + "）"); o.value = c.id; ui.char.appendChild(o); });
    if (characters.some(function (c) { return c.id === prev; })) ui.char.value = prev;
    render();
  }
  function mount(target, context) {
    ctx = context; host = target; host.replaceChildren();
    var panel = make("section", undefined, "card"); ui.root = panel;
    panel.appendChild(make("h2", "背景・ギャラリー"));
    panel.appendChild(make("p", "キャラごとに、背景の差し替えと、ギャラリーの画像の追加ができます。技データ・チェックシートには影響しません。"));
    ui.char = make("select"); ui.char.addEventListener("change", render);
    ui.body = make("div"); ui.note = make("p", "キャラを選んでください。"); ui.note.setAttribute("role", "status"); ui.note.setAttribute("aria-live", "polite");
    panel.append(ui.char, ui.body, ui.note); host.appendChild(panel);
    loadItems().then(function () { setCharacters(ctx.characters()); }).catch(function (e) { say("登録の一覧を取得できませんでした：" + e.message, "error"); setCharacters(ctx.characters()); });
  }
  function updateCharacters(list) { setCharacters(list); }
  window.PTAdminPxImages = Object.freeze({ mount: mount, updateCharacters: updateCharacters });
})();
