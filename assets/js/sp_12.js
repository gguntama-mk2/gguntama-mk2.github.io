
/*GAJS-START*/
/* ギャラリー（ページ）：これまでに足した背景画像を見るページ。PC版・スマホ版で同じ部品。
   ・キャラの選び方は、ほかのページと同じ：PC版は上のキャラのアイコンのパネル（全キャラ）、スマホ版は「キャラ選択」のプルダウン。選ぶと、そのキャラの背景画像が小さく並ぶ。
   ・小さな絵を押すと、画面いっぱいに拡大して見られる（ライトボックス。外側・Esc・「閉じる」で戻る。複数枚あるときは ← → で前後）。
   ・スマホ版は、拡大表示の左上の「横向き」で、画像を90度回して横長いっぱいに見られる（端末の向きの固定を解かなくても使える。もう一度押すと戻る）。
   ・絵は、保管庫（pxstore.js）から取り出して <canvas> に描く。<img> も画像のURLも使わないので、右クリックの「画像を保存」・ドラッグ・長押しの保存・
     コピー・文字の選択は出ない（ここでも、右クリック・ドラッグ・コピー・選択を止めている）。印刷でも出ない。
     ※ 画面の撮影（スクリーンショット）までは防げない。「ふつうの操作では取り出せない」ようにするための守り。
   ・画像を足すとき：apply_px.py の CHARS に足すだけ（保管庫に入れば、ここに自動で出る）。同じキャラの2枚目以降は、保管庫の名前を「キャラID~2」「キャラID~3」にする。 */
(function () {
  const host = document.getElementById("gaHost");
  if (!host) return;
  const css = `
.ga { max-width: 1100px; margin: 0 auto; padding: 4px 0 8px; }
.ga-hd { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 14px; margin: 4px 0 14px; }
.ga-ttl { margin: 0; font-size: 1.125rem; font-weight: 800; }
.ga-sub { margin: 0; font-size: .8125rem; color: var(--sub); }
.ga-grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 17rem)); gap: 16px; }
.ga-card { display: block; width: 100%; padding: 0; box-sizing: border-box; border: 2px solid var(--pop-edge, var(--line)); border-radius: 18px; overflow: hidden; background: var(--panel); color: var(--text); font: inherit; text-align: left; cursor: zoom-in; box-shadow: 0 5px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); -webkit-tap-highlight-color: transparent; transition: transform .22s var(--pop-ease, ease), box-shadow .22s var(--pop-ease, ease), border-color .15s; }
.ga-card:hover { border-color: var(--accent); transform: translateY(-3px); box-shadow: 0 8px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.ga-card:active { transform: translateY(1px); box-shadow: 0 2px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.ga-card:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.ga-card canvas { display: block; width: 100%; height: auto; aspect-ratio: 16 / 9; background: var(--panel2); pointer-events: none; }
.ga-card .cap { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 12px 9px; font-size: .8125rem; font-weight: 800; }
.ga-card .cap i { font-style: normal; font-size: .6875rem; font-weight: 700; color: var(--sub); }
.ga-empty { margin: 8px 0 18px; padding: 18px 16px; border: 2px dashed var(--line); border-radius: 18px; color: var(--sub); font-size: .875rem; text-align: center; }
.ga, .ga-lb { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.ga-lb { position: fixed; z-index: 120; inset: 0; display: grid; place-items: center; visibility: hidden; opacity: 0; transition: opacity .2s ease, visibility 0s linear .2s; }
.ga-lb.on { visibility: visible; opacity: 1; transition: opacity .2s ease, visibility 0s; }
.ga-lb-back { position: absolute; inset: 0; background: rgba(6, 7, 14, .9); }
.ga-lb-stage { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.ga-lb-fig { position: relative; margin: 0; display: grid; justify-items: center; gap: 10px; max-width: 96vw; pointer-events: none; }
/* 拡大した絵の枠：幅と高さをどちらも式で決めて（絵の縦横比 --ar ＝ふつうは16:9）、枠の線は外側の影で描く（線の分だけ中身がゆがまない）。canvas は枠いっぱいに置き、object-fit: contain で、万一枠の比がずれても絵は伸ばさない。端末を横にしても、「横向き」にしても同じ */
.ga-lb-img { position: relative; box-sizing: content-box; width: min(94vw, calc((100vh - 8.5rem) * var(--ar, 1.7766))); height: min(calc(94vw / var(--ar, 1.7766)), calc(100vh - 8.5rem)); width: min(94vw, calc((100dvh - 8.5rem) * var(--ar, 1.7766))); height: min(calc(94vw / var(--ar, 1.7766)), calc(100dvh - 8.5rem)); border: 0; border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 0 0 2px var(--pop-edge, var(--line)), 0 10px 0 rgba(0, 0, 0, .35), 0 30px 60px -20px rgba(0, 0, 0, .8); pointer-events: auto; }
.ga-lb-img canvas { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
.ga-shield { position: absolute; inset: 0; background: transparent; }
.ga-lb-cap { margin: 0; color: #f3f3f6; font-size: .875rem; font-weight: 800; text-align: center; pointer-events: auto; }
.ga-lb-cap i { font-style: normal; font-weight: 700; opacity: .7; margin-left: .6em; }
.ga-lb-x, .ga-lb-nav, .ga-lb-rot { position: absolute; z-index: 2; display: grid; place-items: center; width: 2.75rem; height: 2.75rem; padding: 0; border: 2px solid var(--pop-edge, var(--line)); border-radius: 999px; background: var(--panel); color: var(--text); font: inherit; font-size: 1.25rem; font-weight: 800; line-height: 1; cursor: pointer; box-shadow: 0 3px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); pointer-events: auto; -webkit-tap-highlight-color: transparent; }
.ga-lb-x { top: calc(12px + env(safe-area-inset-top, 0px)); right: calc(12px + env(safe-area-inset-right, 0px)); }
.ga-lb-nav { top: 50%; transform: translateY(-50%); }
.ga-lb-nav.pv { left: calc(10px + env(safe-area-inset-left, 0px)); }
.ga-lb-nav.nx { right: calc(10px + env(safe-area-inset-right, 0px)); }
.ga-lb-rot { top: calc(12px + env(safe-area-inset-top, 0px)); left: calc(12px + env(safe-area-inset-left, 0px)); width: auto; grid-auto-flow: column; gap: 6px; padding: 0 14px 0 10px; font-size: .8125rem; }
.ga-lb-rot svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ga-lb.land .ga-lb-rot { background: var(--accent); border-color: var(--accent); color: var(--on); }
html[data-theme="navy"] .ga-lb.land .ga-lb-rot { color: #1a1330; }
.ga-lb-x:focus-visible, .ga-lb-nav:focus-visible, .ga-lb-rot:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
.ga-lb-nav[hidden], .ga-lb-rot[hidden] { display: none; }
/* 横長の画面（端末を横にしたとき）は、画像を画面いっぱいに。説明の文字は省く */
@media (orientation: landscape) and (max-height: 600px) { .ga-lb-img { width: min(calc(100vw - 1.5rem), calc((100vh - 1.5rem) * var(--ar, 1.7766))); height: min(calc((100vw - 1.5rem) / var(--ar, 1.7766)), calc(100vh - 1.5rem)); width: min(calc(100dvw - 1.5rem), calc((100dvh - 1.5rem) * var(--ar, 1.7766))); height: min(calc((100dvw - 1.5rem) / var(--ar, 1.7766)), calc(100dvh - 1.5rem)); } .ga-lb-cap { display: none; } .ga-lb-rot { display: none; } }
/* 縦長の画面で「横向き」を押したとき：画面を右へ90度回して、長いほうの辺いっぱいに使う（スマホ版） */
@media (orientation: portrait) {
  .ga-lb.land .ga-lb-stage { inset: auto; top: 0; left: 100vw; left: 100dvw; width: 100vh; width: 100dvh; height: 100vw; height: 100dvw; transform-origin: 0 0; transform: rotate(90deg); }
  .ga-lb.land .ga-lb-img { width: min(calc(100vh - 1.5rem), calc((100vw - 1.5rem) * var(--ar, 1.7766))); height: min(calc((100vh - 1.5rem) / var(--ar, 1.7766)), calc(100vw - 1.5rem)); width: min(calc(100dvh - 1.5rem), calc((100dvw - 1.5rem) * var(--ar, 1.7766))); height: min(calc((100dvh - 1.5rem) / var(--ar, 1.7766)), calc(100dvw - 1.5rem)); }
  .ga-lb.land .ga-lb-fig { max-width: none; }
  .ga-lb.land .ga-lb-cap { display: none; }
}
@media (max-width: 719.98px) { .ga-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .ga-card .cap { padding: 6px 10px 8px; font-size: .75rem; } }
@media (prefers-reduced-motion: reduce) { .ga-card, .ga-lb { transition: none; } }
@media print { .ga, .ga-lb { display: none !important; } }
`;
  const st = document.createElement("style"); st.id = "gaCss"; st.textContent = css; document.head.appendChild(st);

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = () => window.PXS || null;
  const charName = id => { const c = (typeof CHARACTERS !== "undefined" ? CHARACTERS : []).find(x => x.id === id); return c ? c.name : id; };
  /* そのキャラの絵（保管庫の名前の並び）：「キャラID」「キャラID~2」「キャラID~3」… */
  const imgsOf = id => { const S = store(); return S ? S.ids().filter(k => k === id || k.indexOf(id + "~") === 0).sort() : []; };

  /* 画像を canvas に描く（枠に合わせて、縦横比はそのまま。保管庫から取り出した絵だけを使う）
     【決まり】ギャラリーに出す絵は、元の絵そのまま（原寸）だけ。保管庫の「ギャラリー用の原寸」（PXS.gallery）から取り、背景用に縮めた絵は使わない。
     一覧の小さな絵（640px）は、その原寸の絵を縮めて描く。拡大表示は、原寸のままの大きさで描く（縮めない） */
  const cache = {};
  function bitmapOf(key) { if (!cache[key]) cache[key] = store().gallery(key); return cache[key]; }
  function draw(cv, bm, maxW) {
    const w = bm.width || bm.naturalWidth, h = bm.height || bm.naturalHeight;
    const k = Math.min(1, maxW / w);
    cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
    const g = cv.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(bm, 0, 0, cv.width, cv.height);
    return w / h;
  }

  /* ---- ページの中身 ---- */
  let shown = false;
  function render() {
    const id = (typeof current === "string") ? current : "";
    const keys = imgsOf(id), nm = charName(id);
    let h = '<div class="ga">';
    h += '<div class="ga-hd"><h3 class="ga-ttl">' + esc(nm) + 'の画像</h3>' + (keys.length ? '<p class="ga-sub">' + keys.length + '枚　押すと拡大します</p>' : '') + '</div>';
    if (keys.length) {
      h += '<ul class="ga-grid">' + keys.map((k, i) => '<li><button type="button" class="ga-card" data-k="' + esc(k) + '" data-i="' + i + '" aria-label="' + esc(nm) + 'の画像' + (keys.length > 1 ? (i + 1) : '') + 'を拡大"><canvas width="640" height="360" aria-hidden="true"></canvas><span class="cap"><span>画像' + (keys.length > 1 ? ' ' + (i + 1) : '') + '</span><i>押すと拡大</i></span></button></li>').join("") + '</ul>';
    } else {
      h += '<p class="ga-empty">' + esc(nm) + 'の画像は、まだありません。</p>';
    }
    h += '</div>';
    host.innerHTML = h;
    host.querySelectorAll(".ga-card").forEach(b => {
      const cv = b.querySelector("canvas");
      bitmapOf(b.dataset.k).then(bm => { draw(cv, bm, 640); }).catch(() => {});
    });
  }

  /* ---- ライトボックス ---- */
  let lb = null, lbKeys = [], lbI = 0, lbFrom = null;
  const SP = !!document.getElementById("charBtn");   // スマホ版だけ「横向き」を出す（PC版には、上のキャラ選択のボタンが無い）
  function setLand(on) {
    if (!lb) return;
    lb.classList.toggle("land", on);
    const b = lb.querySelector(".ga-lb-rot"); if (!b) return;
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.setAttribute("aria-label", on ? "画像を縦向きに戻す" : "画像を横向きにして見る");
    b.querySelector("span").textContent = on ? "縦に戻す" : "横向き";
  }
  function build() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "ga-lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "背景画像の拡大"); lb.setAttribute("aria-hidden", "true");
    const rot = SP ? '<button type="button" class="ga-lb-rot" data-lbr aria-pressed="false" aria-label="画像を横向きにして見る"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="11" rx="2"/><path d="M12 3.5v2M8 4.5l1 1.5M16 4.5l-1 1.5"/></svg><span>横向き</span></button>' : '';
    lb.innerHTML = '<div class="ga-lb-back" data-lbx></div><div class="ga-lb-stage">' +
      '<button type="button" class="ga-lb-x" data-lbx aria-label="閉じる">✕</button>' + rot +
      '<button type="button" class="ga-lb-nav pv" data-lbn="-1" aria-label="前の画像" hidden>‹</button>' +
      '<button type="button" class="ga-lb-nav nx" data-lbn="1" aria-label="次の画像" hidden>›</button>' +
      '<figure class="ga-lb-fig"><div class="ga-lb-img"><canvas aria-hidden="true"></canvas><div class="ga-shield"></div></div><figcaption class="ga-lb-cap"></figcaption></figure></div>';
    document.body.appendChild(lb);
    lb.addEventListener("click", e => {
      if (e.target.closest("[data-lbx]")) { closeLb(); return; }
      const n = e.target.closest("[data-lbn]"); if (n) { go(+n.dataset.lbn); return; }
      if (e.target.closest("[data-lbr]")) setLand(!lb.classList.contains("land"));
    });
    return lb;
  }
  function paintLb() {
    const key = lbKeys[lbI], cv = lb.querySelector("canvas"), box = lb.querySelector(".ga-lb-img");
    const id = key.split("~")[0], nm = charName(id);
    lb.querySelector(".ga-lb-cap").innerHTML = esc(nm) + 'の画像' + (lbKeys.length > 1 ? '<i>' + (lbI + 1) + ' / ' + lbKeys.length + '</i>' : '');
    lb.querySelectorAll(".ga-lb-nav").forEach(b => { b.hidden = lbKeys.length < 2; });
    bitmapOf(key).then(bm => { if (lbKeys[lbI] !== key) return; const ar = draw(cv, bm, Infinity); box.style.setProperty("--ar", ar); }).catch(() => {});
  }
  function go(d) { if (lbKeys.length < 2) return; lbI = (lbI + d + lbKeys.length) % lbKeys.length; paintLb(); }
  function openLb(keys, i, from) {
    build(); lbKeys = keys; lbI = i; lbFrom = from || null;
    paintLb();
    lb.classList.add("on"); lb.setAttribute("aria-hidden", "false");
    setTimeout(() => { const x = lb.querySelector(".ga-lb-x"); if (x) x.focus({ preventScroll: true }); }, 30);
  }
  function closeLb() {
    if (!lb || !lb.classList.contains("on")) return;
    lb.classList.remove("on"); lb.setAttribute("aria-hidden", "true"); setLand(false);
    if (lbFrom && document.contains(lbFrom)) lbFrom.focus({ preventScroll: true });
  }

  /* ---- 取り出し・保存・コピーを止める（ギャラリーと拡大表示の中だけ） ---- */
  const guard = e => { if (e.target.closest && (e.target.closest(".ga") || e.target.closest(".ga-lb"))) e.preventDefault(); };
  ["contextmenu", "dragstart", "selectstart", "copy", "cut"].forEach(t => document.addEventListener(t, guard, true));

  host.addEventListener("click", e => {
    const c = e.target.closest(".ga-card");
    if (c) openLb([...host.querySelectorAll(".ga-card")].map(x => x.dataset.k), +c.dataset.i, c);
  });
  document.addEventListener("keydown", e => {
    if (!lb || !lb.classList.contains("on")) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeLb(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "Tab") {
      const f = [...lb.querySelectorAll("button:not([hidden])")]; if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
    }
  }, true);

  window.GA = {
    show() { shown = true; render(); },
    hide() { shown = false; closeLb(); host.innerHTML = ""; },
    onChar() { if (shown) { closeLb(); render(); } }
  };
})();

/*GAJS-END*/
