/* PROJECT T 管理者ページ：背景の差し替え・ギャラリーの画像追加。
   - 背景：キャラの背景を、選んだ画像に替える（16:9にそろえて保存）。「元に戻す」で、サイトに入っている絵に戻る
   - ギャラリー：キャラの画像を増やす（元の画像はそのまま）。追加した画像は削除できる
   権限（管理者・CSRF・Origin）・画像の種類の判定・容量の上限・監査ログは、すべてサーバー側。公開サイトは、開き直す（または再読み込みする）と反映される */
(function () {
  "use strict";
  var API = location.hostname === "www.project-t-god.com" ? "https://api.project-t-god.com" : "";
  var CHAR_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
  var BG_W = 1400, BG_H = 788, EYE_W = 480, EYE_H = 120, MAX_BYTES = 12 * 1024 * 1024;
  var make = function (tag, text, cls) { var x = document.createElement(tag); if (text !== undefined) x.textContent = text; if (cls) x.className = cls; return x; };
  var ctx, host, characters = [], items = [], ui = {}, urls = {}, busy = false, uiGen = 0, cropping = false;

  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  async function request(path, init) {
    init = init || {};
    if (init.method === "POST") return request1(path, init);       // 書き込みは自動でやり直さない（二重登録を避ける）
    for (var n = 0; ; n++) {       // 読み取りだけ、通信エラー・サーバーの一時的な不調（502/503/504）なら、少し待ってやり直す（無料サーバーが起きるのを待つ）
      try { return await request1(path, init); }
      catch (e) { if (n >= 4 || !(e && e.retryable)) throw e; await sleep(1500 * Math.pow(2, n)); }
    }
  }
  async function request1(path, init) {
    var headers = Object.assign({}, init.headers || {}), write = init.method === "POST";
    if (write) { headers["X-CSRF-Token"] = ctx.csrf(); if (typeof init.body === "string") headers["Content-Type"] = "application/json"; }
    if (typeof AbortController !== "function") throw new Error("この環境では通信の時間制限が使えません");
    var res, ac = new AbortController(), to = setTimeout(function () { ac.abort(); }, write ? 120000 : 45000), raw, body;
    try { res = await fetch(API + path, Object.assign({ credentials: "include" }, init, { headers: headers, signal: ac.signal })); raw = await res.text(); if (ac.signal.aborted) throw new Error("aborted"); }
    catch (e) {
      var status = res && res.status, denied = status === 401 || status === 403;
      var ne = new Error(denied ? "HTTP " + status : write ? "書き込み結果が不明です。再送せず、最新の状態を確認してください。" : ac.signal.aborted ? "時間切れ（応答がありません）" : "通信できませんでした");
      ne.status = status; ne.retryable = !write && !denied && (!status || res.ok || status === 502 || status === 503 || status === 504); ne.unknownWrite = write && !denied; throw ne;
    } finally { clearTimeout(to); }
    try { body = JSON.parse(raw); } catch (_) { body = null; }
    if (body === null || typeof body !== "object") {
      var be = new Error(res.ok ? (write ? "書き込み結果が不明です。再送せず、最新の状態を確認してください。" : "サーバーの返答を読めませんでした") : "HTTP " + res.status);
      be.status = res.status; be.retryable = !write && !res.ok && (res.status === 502 || res.status === 503 || res.status === 504); be.unknownWrite = write && (res.ok || res.status >= 500); if (be.unknownWrite && !res.ok) be.message += "。書き込み結果が不明です。再送せず、最新の状態を確認してください。"; throw be;
    }
    if (!res.ok) { var er = new Error(typeof body.detail === "string" ? body.detail : "HTTP " + res.status); er.status = res.status; er.retryable = !write && (res.status === 502 || res.status === 503 || res.status === 504); er.unknownWrite = write && res.status >= 500; if (er.unknownWrite) er.message += "。書き込み結果が不明です。再送せず、最新の状態を確認してください。"; throw er; }
    return body;
  }
  function say(text, state) { ui.note.textContent = text; ui.note.dataset.state = state || "neutral"; }
  function cur() { return ui.char && ui.char.value; }
  function targetOf(id) { return { id: id, gen: uiGen, root: ui.root }; }
  function targetValid(t) { return !!t && t.gen === uiGen && t.root === ui.root && t.root && t.root.isConnected && cur() === t.id && characters.some(function (c) { return c.id === t.id; }); }
  function requireTarget(t) { if (!targetValid(t)) throw new Error("対象キャラまたは画面が変わりました。画像を選び直してください。"); }

  function pxs() { var w = ctx.win && ctx.win(); return w && w.PXS ? w.PXS : null; }
  function overridden() { return items.map(function (x) { return x.id; }); }   // 登録済みの絵（サイトに入っている絵ではない）
  function builtin(id) { var S = pxs(); return !!(S && S.has(id) && overridden().indexOf(id) < 0); }
  function builtinGallery(id) {
    var S = pxs(); if (!S) return [];
    var ov = overridden();
    return S.ids().filter(function (k) { return (k === id || k.indexOf(id + "~") === 0) && ov.indexOf(k) < 0; }).sort();
  }
  function entry(id) { return items.find(function (x) { return x.id === id; }); }

  async function loadItems() {
    var root = ui.root, r = await request("/api/v1/admin/px-overrides");
    if (root !== ui.root) throw new Error("画面が変わりました。");
    if (!r || !Array.isArray(r.items)) throw new Error("サーバーの返答の形が違います");      // 想定外の返答は、そのまま使わない（空にもしない）
    items = r.items.filter(function (x) { return x && typeof x.id === "string" && typeof x.sha === "string"; });
  }
  function fileUrl(it) {      // 登録済みの画像を表示用に取り出す（同じ画像は使い回す）
    if (urls[it.sha]) return Promise.resolve(urls[it.sha]);
    return fetch(API + "/api/v1/px-overrides/file/" + it.sha, { credentials: "omit" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.blob(); })
      .then(function (b) { return (urls[it.sha] = URL.createObjectURL(b)); });
  }
  function builtinUrl(id) {      // サイト内の絵は「必要になってから読み込む」ので、最初は空。読み込みを待って URL を取り直す
    var S = pxs(); if (!S) return Promise.reject(new Error("no PXS"));
    var u = S.url(id); if (u) return Promise.resolve(u);
    return Promise.resolve(S.bitmap(id)).then(function () { var v = S.url(id); if (!v) throw new Error("empty"); return v; });
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
  async function prepEyes(file) {     // 対戦履歴のキャラ札用：4:1（480×120）に中央で切り抜いて WebP にする
    var bm = await decode(file), w = bm.width || bm.naturalWidth, h = bm.height || bm.naturalHeight;
    var k = Math.max(EYE_W / w, EYE_H / h), cw = EYE_W / k, ch = EYE_H / k;
    var cv = document.createElement("canvas"); cv.width = EYE_W; cv.height = EYE_H;
    var g = cv.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bm, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, EYE_W, EYE_H);
    return toBlob(cv, "image/webp", 0.9);
  }
  // 切り抜きの画面：画像を拡大縮小（スライダー・マウスホイール・ピンチ）し、ドラッグで位置を動かして、枠（W×H）に入れる範囲を決める。決定で WebP の Blob、キャンセルで null
  function cropper(file, W, H, title) {
    return decode(file).then(function (bm) {
      return new Promise(function (done) {
        var iw = bm.width || bm.naturalWidth, ih = bm.height || bm.naturalHeight, k0 = Math.max(W / iw, H / ih);
        var z = 1, cx = iw / 2, cy = ih / 2, dispW = Math.min(720, Math.max(240, window.innerWidth - 56)), ds = dispW / W, dispH = Math.round(H * ds);
        var back = make("div"); back.style.cssText = "position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:12px;overflow:auto";
        var box = make("div"); box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", title);
        box.style.cssText = "background:var(--panel,#242740);color:var(--text,#e9eaf4);border:1px solid var(--line,#3a3e63);border-radius:12px;padding:14px;max-width:100%;display:grid;gap:10px";
        var cv = make("canvas"); cv.width = Math.round(W * ds); cv.height = dispH; cv.style.cssText = "width:" + cv.width + "px;height:" + dispH + "px;max-width:100%;background:#000;border-radius:8px;touch-action:none;cursor:grab";
        var g = cv.getContext("2d");
        function clamp() { var k = k0 * z, hw = W / k / 2, hh = H / k / 2; cx = Math.min(iw - hw, Math.max(hw, cx)); cy = Math.min(ih - hh, Math.max(hh, cy)); }
        function draw(ctx, sc) { var k = k0 * z * sc; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W * sc, H * sc); ctx.imageSmoothingQuality = "high"; ctx.drawImage(bm, 0, 0, iw, ih, W * sc / 2 - cx * k, H * sc / 2 - cy * k, iw * k, ih * k); }
        function paint() { clamp(); draw(g, ds); sl.value = String(z); }
        var sl = make("input"); sl.type = "range"; sl.min = "1"; sl.max = "8"; sl.step = "0.01"; sl.value = "1"; sl.setAttribute("aria-label", "拡大縮小"); sl.style.width = "100%";
        sl.addEventListener("input", function () { z = parseFloat(sl.value) || 1; paint(); });
        cv.addEventListener("wheel", function (e) { e.preventDefault(); z = Math.min(8, Math.max(1, z * Math.exp(-e.deltaY * 0.0015))); paint(); }, { passive: false });
        var ptrs = new Map(), last = null, pinch0 = null;
        cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); last = [e.clientX, e.clientY]; if (ptrs.size === 2) { var a = Array.from(ptrs.values()); pinch0 = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), z: z }; } cv.style.cursor = "grabbing"; });
        cv.addEventListener("pointermove", function (e) {
          if (!ptrs.has(e.pointerId)) return; var prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
          if (ptrs.size >= 2 && pinch0) { var a = Array.from(ptrs.values()); z = Math.min(8, Math.max(1, pinch0.z * Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) / (pinch0.d || 1))); paint(); return; }
          var k = k0 * z, scale = cv.getBoundingClientRect().width / W;      // 画面の1pxが、画像の何pxか
          cx -= (e.clientX - prev[0]) / scale / k; cy -= (e.clientY - prev[1]) / scale / k; paint();
        });
        function up(e) { ptrs.delete(e.pointerId); pinch0 = null; if (!ptrs.size) cv.style.cursor = "grab"; }
        cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
        var row = make("div"); row.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end";
        var ok = make("button", "この範囲で決定", "btn primary"), no = make("button", "キャンセル", "btn"), rs = make("button", "リセット", "btn"); ok.type = no.type = rs.type = "button";
        var closed = false, encoding = false, prev = document.activeElement;
        function close(v) { if (closed) return; closed = true; document.removeEventListener("keydown", onKey, true); back.remove(); if (prev && prev.isConnected && prev.focus) prev.focus(); done(v); }
        function onKey(e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(null); } }
        no.addEventListener("click", function () { close(null); });
        rs.addEventListener("click", function () { z = 1; cx = iw / 2; cy = ih / 2; paint(); });
        ok.addEventListener("click", function () { if (closed || encoding) return; encoding = true; ok.disabled = true; var out = document.createElement("canvas"); out.width = W; out.height = H; draw(out.getContext("2d"), 1); toBlob(out, "image/webp", 0.9).then(close, function () { close(null); }); });
        document.addEventListener("keydown", onKey, true);
        row.append(rs, no, ok);
        box.append(make("strong", title), make("small", "ドラッグで位置、スライダー・ホイール・ピンチで拡大縮小。枠の中が、保存される範囲です（" + W + "×" + H + "）。"), cv, sl, row);
        back.appendChild(box); document.body.appendChild(back); paint(); ok.focus();
      });
    });
  }
  var eyeMap = null;     // 元の目元画像（キャラ名→ファイル）。対戦履歴の部品から、必要になった時に1回だけ読む
  function loadEyeMap() {
    if (!eyeMap) eyeMap = fetch("js/26.js", { credentials: "same-origin" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (t) { var m = /PT_EYES=(\{[^}]*\})/.exec(t); if (!m) throw new Error("PT_EYES not found"); return JSON.parse(m[1]); })
      .catch(function (e) { eyeMap = null; throw e; });
    return eyeMap;
  }
  function norm(x) { return String(x).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function builtinEye(id) {      // キャラIDに合う元の目元画像のURL（無ければ reject）
    return loadEyeMap().then(function (m) { var k = Object.keys(m).find(function (n) { return norm(n) === norm(id); }); if (!k) throw new Error("none"); return m[k]; });
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
  async function upload(kind, file, prepared, target) {
    requireTarget(target);
    var image = kind === "bg" ? await prepBg(file) : kind === "eyes" ? (prepared ? file : await prepEyes(file)) : await prepGallery(file);
    requireTarget(target);  // 変換中にキャラ/画面が変わったら送信しない
    var fd = new FormData(); fd.append("character_id", target.id); fd.append("kind", kind); fd.append("image", image, "image");
    return request("/api/v1/admin/px-overrides/set", { method: "POST", body: fd });
  }
  async function cropAndUpload(file, title, target) {
    if (busy || cropping || !targetValid(target)) return;
    cropping = true;
    try {
      var b = await cropper(file, EYE_W, EYE_H, title);
      if (!b) return;
      requireTarget(target);
      await run("目元画像を差し替え", function () { return upload("eyes", b, true, target); });
    } catch (e) { if (target.root === ui.root) say(e.message, "error"); }
    finally { cropping = false; }
  }
  async function run(label, fn) {
    if (busy) return; busy = true; var root = ui.root; root.setAttribute("aria-busy", "true");
    try { await fn(); if (root !== ui.root) return; await loadItems(); if (root !== ui.root) return; render(); say(label + "しました。公開サイトは、開き直す（または再読み込みする）と反映されます。", "ok"); }
    catch (e) { if (root === ui.root) say(label + "：" + e.message, "error"); }
    finally { busy = false; root.removeAttribute("aria-busy"); }
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
    var id = cur(); ++uiGen; ui.body.replaceChildren(); if (!id) return;
    var target = targetOf(id);
    var ch = characters.find(function (c) { return c.id === id; });
    // 背景
    var bg = make("section", undefined, "pt-px-sec"); bg.appendChild(make("h3", "背景の差し替え"));
    var S = pxs(), o = entry(id);
    if (!o && !builtin(id)) {
      bg.appendChild(make("p", "このキャラには、まだ背景がありません（背景が入っているキャラだけ差し替えできます）。", "pt-px-sub"));
    } else {
      bg.appendChild(make("p", o ? "差し替え中の背景です。「元に戻す」でサイトに入っている絵に戻ります。" : "いまはサイトに入っている背景です。画像を選ぶと、1400×788（16:9）に中央で切り抜いて差し替えます。", "pt-px-sub"));
      bg.appendChild(thumb(o ? fileUrl(o) : builtinUrl(id), (ch ? ch.name : id) + "の背景"));
      var row = make("div", undefined, "pt-px-row");
      row.appendChild(picker(o ? "別の画像に差し替える" : "背景を差し替える", false, function (fs) { run("背景を差し替え", function () { return upload("bg", fs[0], false, target); }); }));
      if (o) { var rb = make("button", "元に戻す", "btn"); rb.type = "button"; rb.addEventListener("click", function () { remove(id, "差し替えた背景"); }); row.appendChild(rb); }
      bg.appendChild(row);
    }
    // ギャラリー
    var ga = make("section", undefined, "pt-px-sec"); ga.appendChild(make("h3", "ギャラリーの画像"));
    ga.appendChild(make("p", "追加した画像は、サイトのギャラリー（" + (ch ? ch.name : id) + "）の最後に並びます。元の画像はそのまま残ります。png / jpeg / webp / avif、1枚12MBまで。", "pt-px-sub"));
    var grid = make("div", undefined, "pt-px-grid");
    builtinGallery(id).forEach(function (k) { var c = make("div", undefined, "pt-px-card"); c.appendChild(thumb(builtinUrl(k), "サイトの画像")); c.appendChild(make("small", "サイト内の画像")); grid.appendChild(c); });
    items.filter(function (it) { return it.kind === "gallery" && it.character_id === id; }).forEach(function (it) {
      var c = make("div", undefined, "pt-px-card"); c.appendChild(thumb(fileUrl(it), "追加した画像" + it.id.split("~")[1]));
      var b = make("button", "削除", "btn pt-px-del"); b.type = "button"; b.addEventListener("click", function () { remove(it.id, "追加した画像"); }); c.appendChild(b); grid.appendChild(c);
    });
    ga.appendChild(grid);
    var r2 = make("div", undefined, "pt-px-row");
    r2.appendChild(picker("画像を追加する（複数選べます）", true, function (fs) {
      run("画像を追加", async function () { for (var i = 0; i < fs.length; i++) await upload("gallery", fs[i], false, target); });
    }));
    ga.appendChild(r2);
    // 目元画像（対戦履歴のキャラ札・絞り込みに出る細長い画像）
    var ey = make("section", undefined, "pt-px-sec"); ey.appendChild(make("h3", "目元画像（対戦履歴）"));
    var eo = entry("eye-" + id);
    ey.appendChild(make("p", eo ? "差し替え中の目元画像です。「元に戻す」でサイトに入っている画像に戻ります。" : "いまはサイトに入っている目元画像です。画像を選ぶと、480×120（4:1）に中央で切り抜いて差し替えます。対戦履歴のキャラ札に使われます。", "pt-px-sub"));
    var ef = thumb(eo ? fileUrl(eo) : builtinEye(id), (ch ? ch.name : id) + "の目元画像");
    ef.style.maxWidth = "480px"; var ei = ef.querySelector("img"); if (ei) ei.style.aspectRatio = "4 / 1"; ey.appendChild(ef);
    var r3 = make("div", undefined, "pt-px-row");
    r3.appendChild(picker(eo ? "別の画像に差し替える" : "目元画像を差し替える", false, function (fs) {
      cropAndUpload(fs[0], "目元画像の範囲を決める（" + (ch ? ch.name : id) + "）", target);
    }));
    if (eo) { var re = make("button", "元に戻す", "btn"); re.type = "button"; re.addEventListener("click", function () { remove("eye-" + id, "差し替えた目元画像"); }); r3.appendChild(re); }
    ey.appendChild(r3);
    ui.body.append(bg, ga, ey);
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
    ++uiGen; ctx = context; host = target; host.replaceChildren();
    var panel = make("section", undefined, "card"); ui.root = panel;
    panel.appendChild(make("h2", "背景・ギャラリー"));
    panel.appendChild(make("p", "キャラごとに、背景の差し替えと、ギャラリーの画像の追加ができます。技データ・チェックシートには影響しません。"));
    ui.char = make("select"); ui.char.addEventListener("change", render);
    ui.body = make("div"); ui.note = make("p", "キャラを選んでください。"); ui.note.setAttribute("role", "status"); ui.note.setAttribute("aria-live", "polite");
    panel.append(ui.char, ui.body, ui.note); host.appendChild(panel);
    loadItems().then(function () { if (ui.root === panel) setCharacters(ctx.characters()); }).catch(function (e) { if (ui.root !== panel) return; say("登録の一覧を取得できませんでした：" + e.message, "error"); setCharacters(ctx.characters()); });
  }
  function updateCharacters(list) { setCharacters(list); }
  window.PTAdminPxImages = Object.freeze({ mount: mount, updateCharacters: updateCharacters });
})();
