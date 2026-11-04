/* PROJECT T：技の動画（技表の MOVIE 列・拡大再生）。
   公開済みの動画だけを、API（/api/v1/move-media）から取得して表示する。取得できない・登録が無いときは、何も変えない。
   - 動画は「キャラ＋固定ID(k)＋技名」が全部一致したときだけ出す（別の技に別の動画が付かないように）
   - URL はこのモジュールが組み立てる（APIの配信元＋決まった形のパスだけ。APIが返した絶対URLは使わない）
   - 技のチェック状態・メモ・技データは触らない */
(function () {
  "use strict";
  if (window.PTMoveMedia) return;
  if (/[?&]ptpreview=1(&|$)/.test(location.search)) return;   // 管理画面の編集プレビュー（iframe）では動かさない
  var ASSET_RE = /^\/api\/v1\/move-media\/asset\/([a-z0-9][a-z0-9-]{0,47})\/(\d{1,7})\/(thumb\.jpg|poster\.jpg|video\.mp4)\?v=(\d{1,6})$/;
  var CHAR_RE = /^[a-z0-9][a-z0-9-]{0,47}$/;
  var manifest = null, loading = null, loadedAt = 0, lastChar = window.__ptMvChar || "";

  function apiBase() {
    var b = typeof window.PROJECT_T_AUTH_API_BASE === "string" ? window.PROJECT_T_AUTH_API_BASE.trim() : "";
    if (!b) { try { b = localStorage.getItem("project-t-auth-api-base") || ""; } catch (e) { b = ""; } }
    if (!b && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) b = "http://localhost:8000";
    b = b.replace(/\/$/, "");
    // 配信元として使ってよいのは、本番の API と、手元の開発用サーバーだけ
    if (b === "https://api.project-t-god.com" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(b)) return b;
    return "";
  }
  function nameKey(v) { return String(v || "").normalize("NFKC").replace(/\s+/g, "").toLocaleLowerCase("ja"); }
  function assetUrl(base, path, char, k, kind) {
    var m = typeof path === "string" ? ASSET_RE.exec(path) : null;
    if (!m || m[1] !== char || m[2] !== String(k) || m[3] !== kind) return null;
    return base + path;
  }
  /* 技ひとつ分の動画情報。登録が無い・技名が違う・URLの形がおかしい、のときは null */
  function mediaFor(char, k, moveName) {
    var base = apiBase(); if (!base || !manifest || !CHAR_RE.test(String(char))) return null;
    var row = manifest[char] && manifest[char][String(k)];
    if (!row || typeof row.move_name !== "string" || nameKey(row.move_name) !== nameKey(moveName)) return null;
    var thumb = assetUrl(base, row.thumbnail, char, k, "thumb.jpg"), large = assetUrl(base, row.lightbox, char, k, "poster.jpg"), video = assetUrl(base, row.video, char, k, "video.mp4");
    if (!thumb || !video) return null;
    var fps = typeof row.fps === "number" && isFinite(row.fps) && row.fps >= 1 && row.fps <= 120 ? row.fps : 30;
    return { thumb: thumb, large: large, video: video, fps: fps };
  }
  function hasAny(char) { return !!(manifest && manifest[char] && Object.keys(manifest[char]).length); }

  function load() {
    if (loading) return loading;
    if (manifest && Date.now() - loadedAt < 300000) return Promise.resolve(manifest);
    var base = apiBase(); if (!base) return Promise.resolve(null);
    loading = fetch(base + "/api/v1/move-media", { credentials: "omit", headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { var c = j && j.schema === 1 && j.characters && typeof j.characters === "object" ? j.characters : {}; manifest = c; loadedAt = Date.now(); return manifest; })
      .catch(function () { if (!manifest) { manifest = {}; loadedAt = Date.now(); } return manifest; })   // 取得できなくても、技表はこれまでどおり（しばらく取り直さない）
      .then(function (m) { loading = null; return m; });
    return loading;
  }

  /* ---------- 見た目 ---------- */
  var CSS = [
    ".pt-no-image{display:inline-flex;align-items:center;justify-content:center;width:160px;height:90px;max-width:100%;border:1px dashed var(--line,#444);border-radius:6px;color:var(--sub,#888);font-size:.6875rem;letter-spacing:.08em}",
    "th.pt-mv{width:184px;min-width:184px;text-align:center}",
    "td.pt-mv{width:184px;min-width:184px;height:var(--row-h,112px);padding:0 6px;text-align:center;vertical-align:middle;border-right:1px solid var(--line,#333)}",
    "col.c-mv{width:184px}",
    "@media (max-width:1000px){table.pt-has-mv{min-width:1304px}}",   /* 狭い画面は、これまでの最小幅(1120px)＋動画列。表の枠の中で横にスクロールする */
    ".pt-thumb{position:relative;display:inline-block;padding:0;border:1px solid var(--line,#444);border-radius:6px;background:#000;cursor:pointer;width:160px;height:90px;max-width:100%;overflow:hidden;line-height:0}",
    ".pt-thumb:focus-visible{outline:2px solid var(--accent,#f0c040);outline-offset:2px}",
    ".pt-thumb img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;-webkit-user-drag:none}",
    ".pt-thumb .pt-play{position:absolute;right:4px;bottom:4px;background:rgba(0,0,0,.65);color:#fff;border-radius:999px;font-size:.6875rem;line-height:1;padding:3px 6px}",
    ".pt-mvs{padding:6px 12px 8px;text-align:left}",
    ".pt-lb{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:12px}",
    ".pt-lb-panel{background:var(--panel,#1a1b26);color:var(--text,#eee);border:1px solid var(--line,#444);border-radius:10px;width:min(1280px,96vw);max-height:96vh;display:flex;flex-direction:column;overflow:hidden}",
    ".pt-lb-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 12px;border-bottom:1px solid var(--line,#444)}",
    ".pt-lb-bar strong{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".pt-lb video{display:block;width:100%;aspect-ratio:16/9;max-height:calc(96vh - 110px);background:#000}",
    ".pt-lb-ctl{display:flex;flex-wrap:wrap;gap:8px;padding:8px 12px;justify-content:center}",
    ".pt-lb-btn{font:inherit;font-size:.8125rem;color:var(--text,#eee);background:transparent;border:1px solid var(--line,#555);border-radius:999px;padding:5px 12px;cursor:pointer}",
    ".pt-lb-btn:hover{border-color:var(--accent,#f0c040)}",
    ".pt-lb-err{margin:0;padding:8px 12px;color:#ff8a80;font-size:.8125rem;text-align:center}"
  ].join("\n");
  function ensureStyle() {
    if (document.getElementById("pt-mv-style")) return;
    var st = document.createElement("style"); st.id = "pt-mv-style"; st.textContent = CSS; document.head.appendChild(st);
  }
  function el(tag, cls, text) { var x = document.createElement(tag); if (cls) x.className = cls; if (text !== undefined) x.textContent = text; return x; }

  function noImage() { var s = el("span", "pt-no-image", "NO IMAGE"); s.setAttribute("aria-label", "動画は未登録です"); return s; }
  function thumbButton(char, k, name, m) {
    var b = el("button", "pt-thumb"); b.type = "button"; b.setAttribute("aria-label", name + " の動画を見る");
    var img = document.createElement("img"); img.src = m.thumb; img.alt = ""; img.width = 160; img.height = 90; img.decoding = "async"; img.draggable = false;
    img.addEventListener("error", function () { var p = b.parentNode; if (p) { p.replaceChildren(noImage()); } }, { once: true });
    b.append(img, el("span", "pt-play", "▶ 再生"));
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); openBox(name, m, b); });
    return b;
  }

  /* ---------- 拡大再生 ---------- */
  var box = null, prevFocus = null;
  function closeBox() {
    if (!box) return;
    var v = box.querySelector("video"); if (v) { try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {} }
    box.remove(); box = null; document.removeEventListener("keydown", onKey, true);
    if (prevFocus && prevFocus.isConnected) prevFocus.focus(); prevFocus = null;
  }
  function onKey(e) {
    if (!box) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeBox(); return; }
    if (e.key === "Tab") {
      var f = Array.prototype.filter.call(box.querySelectorAll("button, video[controls]"), function (x) { return !x.disabled; });
      if (!f.length) return;
      var i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }
  function openBox(name, m, trigger) {
    closeBox(); ensureStyle(); prevFocus = trigger;
    var shell = el("div", "pt-lb"), panel = el("section", "pt-lb-panel");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", name);
    var bar = el("div", "pt-lb-bar"), title = el("strong", "", name), close = el("button", "pt-lb-btn", "× 閉じる"); close.type = "button"; close.addEventListener("click", closeBox);
    bar.append(title, close);
    var video = document.createElement("video");
    video.src = m.video; if (m.large) video.poster = m.large;
    video.controls = true; video.playsInline = true; video.loop = true; video.preload = "metadata";
    video.defaultMuted = false; video.muted = false; video.volume = 0.5;      // 初めから音あり・音量 50%
    video.setAttribute("aria-label", name);
    var err = el("p", "pt-lb-err"); err.setAttribute("role", "alert"); err.hidden = true;
    video.addEventListener("error", function () { err.textContent = "動画を読み込めませんでした。時間をおいて、もう一度お試しください。"; err.hidden = false; });
    var step = 1 / m.fps, ctl = el("div", "pt-lb-ctl");
    function btn(label, fn) { var b = el("button", "pt-lb-btn", label); b.type = "button"; b.addEventListener("click", fn); return b; }
    ctl.append(
      btn("−1コマ", function () { video.pause(); video.currentTime = Math.max(0, video.currentTime - step); }),
      btn("再生 / 一時停止", function () { if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } else video.pause(); }),
      btn("+1コマ", function () { video.pause(); video.currentTime = Math.min(isFinite(video.duration) ? video.duration : 1e6, video.currentTime + step); }));
    panel.append(bar, video, err, ctl); shell.appendChild(panel);
    shell.addEventListener("click", function (e) { if (e.target === shell) closeBox(); });
    document.body.appendChild(shell); box = shell; document.addEventListener("keydown", onKey, true);
    close.focus();
    var p = video.play(); if (p && p.catch) p.catch(function () {});             // 音つき自動再生がブラウザに止められたときは、再生ボタンで
  }

  /* ---------- PC：技表に MOVIE 列を足す（動画がなくても常に出す。無い技は NO IMAGE） ---------- */
  function clearPc() {
    document.querySelectorAll("th.pt-mv, td.pt-mv, col.c-mv").forEach(function (n) { n.remove(); });
    var t = document.querySelector("#body"); t = t && t.closest("table"); if (t) t.classList.remove("pt-has-mv");
  }
  function pcSheet(char) {
    lastChar = window.__ptMvChar = char;
    var body = document.getElementById("body"), head = document.getElementById("headRow"); if (!body || !head) return;
    clearPc();
    if (!apiBase()) return;
    if (!manifest) { load().then(function () { if (lastChar === char) pcSheet(char); }); return; }
    ensureStyle();
    var table = body.closest("table"), cg = table && table.querySelector("colgroup");
    if (cg) { var c = document.createElement("col"); c.className = "c-mv"; cg.insertBefore(c, cg.firstChild); }
    var th = el("th", "pt-mv", "MOVIE"); th.scope = "col"; head.insertBefore(th, head.firstChild);
    body.querySelectorAll("tr[data-k]").forEach(function (tr) {
      var nt = tr.querySelector(".nt"), name = nt ? nt.textContent : "", td = el("td", "pt-mv");
      var m = mediaFor(char, tr.dataset.k, name);
      td.appendChild(m ? thumbButton(char, tr.dataset.k, name, m) : noImage());
      tr.insertBefore(td, tr.firstChild);
    });
    table.classList.add("pt-has-mv");
    if (typeof window.scheduleFit === "function") window.scheduleFit();
  }

  /* ---------- スマホ：動画のある技のカードに、サムネイルを出す ---------- */
  function spCard(card, char) {
    lastChar = window.__ptMvChar = char;
    if (!card || card.querySelector(".pt-mvs") || !apiBase()) return;
    if (!manifest) { load().then(function () { if (lastChar === char) spRescan(char); }); return; }
    var nt = card.querySelector(".nt"), name = nt ? nt.textContent : "", m = mediaFor(char, card.dataset.i, name);
    if (!m) return;
    ensureStyle();
    var wrap = el("div", "pt-mvs"); wrap.appendChild(thumbButton(char, card.dataset.i, name, m));
    var head = card.querySelector(".head"); if (head && head.nextSibling) card.insertBefore(wrap, head.nextSibling); else card.appendChild(wrap);
  }
  function spRescan(char) { document.querySelectorAll("#list .card[data-i]").forEach(function (c) { spCard(c, char); }); }

  window.PTMoveMedia = Object.freeze({ pcSheet: pcSheet, spCard: spCard, close: closeBox, _mediaFor: mediaFor });
  // このファイルの読み込みが、技表の最初の描画より遅かったとき：すでにある表・カードに、あとから足す
  if (window.__ptMvChar) { if (document.getElementById("headRow")) pcSheet(window.__ptMvChar); else spRescan(window.__ptMvChar); }
})();
