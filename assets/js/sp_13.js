
/*MENUJS-START*/
/* 右上のメニュー（全ページ共通・PC版もスマホ版も同じ）
   ・画面の右上の角に、小さなタブ（ハンバーガー）を固定で置く。押すと、右からパネルが開く。
   ・パネルの中：ページへのリンク（2列・同じ大きさ）／デザイン（配色）の選択／小さなボブ。内容は上に詰めて並べる。
   ・パネルの右端の白い帯（縦書きの「CLOSE」）を押すと、メニューが閉じて元の画面に戻る。暗い背景を押す・Esc でも閉じる。
   ・リンクを押すと、そのページへ移ってメニューが閉じる（ページの切り替えそのものは views.js の setPage）。
   ・メニューの中身（HTML）は、PC版・スマホ版の本体に直接書いてある（#mnTab・#mn）。ここでは見た目（CSS）と開け閉めだけを受け持つ。
   ・デザインの選択（#theme）は、以前はPC版が右上、スマホ版が「⋯」のシートの中にあったが、ここにまとめた（選んだ配色の保存は、本体の initTheme）。
   ・ボブは、保管庫（pxstore.js）にある、ボブの背景画像から切り抜いた小さな絵（_bobmini）。
   ・ビルド番号（作った日時＋部品のソースの短い記号）は、画面には出さない。内部の記録として window.TEKKEN_BUILD と <html data-build> にだけ入れる（コンボ集が、新しいビルドを開いたときに古い保存データを更新するかどうかを決めるのに使う）。番号は build_stamp.txt（sync_every.py が作る）から、組み立て時に入る。 */
(function () {
  const tab = document.getElementById("mnTab"), mn = document.getElementById("mn");
  if (!tab || !mn) return;
  const panel = document.getElementById("mnPanel");
  const BUILD = "2026.11.01 05:00 (0b58cb)";
  window.TEKKEN_BUILD = BUILD;
  if (BUILD) {
    document.documentElement.setAttribute("data-build", BUILD);
  }
  const css = `
:root { --mn-tab: 56px; }
@media (max-width: 719.98px) { :root { --mn-tab: 52px; } }
.mn-tab { position: fixed; z-index: 40; top: env(safe-area-inset-top, 0px); right: env(safe-area-inset-right, 0px); width: var(--mn-tab); height: var(--mn-tab); box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; padding: 2px 0 0; border: 2px solid var(--pop-edge, var(--line)); border-top: 0; border-right: 0; border-radius: 0 0 0 20px; background: var(--accent); color: var(--on); font: inherit; cursor: pointer; box-shadow: -3px 3px 0 var(--pop-shadow, rgba(0, 0, 0, .4)); -webkit-tap-highlight-color: transparent; transition: transform .22s var(--pop-ease, ease), box-shadow .22s var(--pop-ease, ease); }
.mn-tab:hover { transform: translate(1px, -1px); box-shadow: -4px 4px 0 var(--pop-shadow, rgba(0, 0, 0, .4)); }
.mn-tab:active { transform: translate(-1px, 1px); box-shadow: -1px 1px 0 var(--pop-shadow, rgba(0, 0, 0, .4)); }
.mn-tab:focus-visible { outline: 3px solid var(--text); outline-offset: -5px; }
.mn-bars { display: grid; gap: 4px; width: 24px; }
.mn-bars i { display: block; height: 3px; border-radius: 3px; background: currentColor; transition: transform .22s var(--pop-ease, ease); }
.mn-tab:hover .mn-bars i:nth-child(2) { transform: scaleX(.62); transform-origin: right; }
.mn-tx { font-size: .5625rem; font-weight: 800; letter-spacing: .14em; line-height: 1; padding-left: .14em; }
.mn { position: fixed; z-index: 100; inset: 0; visibility: hidden; pointer-events: none; transition: visibility 0s linear .32s; }
.mn.on { visibility: visible; pointer-events: auto; transition: visibility 0s; }
.mn-back { position: absolute; inset: 0; background: rgba(8, 9, 20, .62); opacity: 0; transition: opacity .28s ease; }
.mn.on .mn-back { opacity: 1; }
.mn-panel { position: absolute; top: 0; right: 0; bottom: 0; width: min(100vw, 30rem); display: flex; background: var(--accent); color: var(--on); transform: translateX(104%); transition: transform .32s cubic-bezier(.2, .8, .2, 1); box-shadow: -10px 0 40px rgba(0, 0, 0, .45); outline: 0; }
.mn.on .mn-panel { transform: none; }
.mn-body { position: relative; flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: stretch; justify-content: flex-start; gap: 16px; padding: calc(18px + env(safe-area-inset-top, 0px)) 16px calc(18px + env(safe-area-inset-bottom, 0px)); overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain; }
.mn-ttl { margin: 0; font-size: .75rem; font-weight: 800; letter-spacing: .3em; opacity: .72; }
.mn-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-rows: minmax(4.25rem, auto); gap: 10px; }
.mn-links button { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; min-width: 0; padding: 8px 14px; box-sizing: border-box; border: 2px solid var(--pop-edge, var(--line)); border-radius: 18px; background: var(--panel); color: var(--text); font: inherit; text-align: left; cursor: pointer; box-shadow: 0 4px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); -webkit-tap-highlight-color: transparent; transition: transform .22s var(--pop-ease, ease), box-shadow .22s var(--pop-ease, ease), background .15s; }
.mn-links button .en { font-size: .625rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--sub); line-height: 1.2; }
.mn-links button b { font-size: clamp(.75rem, 3.7vw, 1rem); font-weight: 800; line-height: 1.3; overflow-wrap: anywhere; text-wrap: balance; word-break: auto-phrase; }   /* 8文字の名前（技チェックシート・アップデート内容）が、どの幅でも1行に収まる大きさ。収まらないときは、半分ずつで折り返す */
.mn-links button:hover { transform: translateY(-2px); box-shadow: 0 6px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.mn-links button:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.mn-links button:focus-visible { outline: 3px solid var(--text); outline-offset: 2px; }
.mn-links button[aria-current="page"] { background: var(--text); color: var(--bg); border-color: var(--text); }
.mn-links button[aria-current="page"] .en { color: var(--bg); opacity: .7; }
.mn .themebox { display: flex; align-items: center; gap: 10px; margin: 0; font-size: .875rem; font-weight: 800; color: var(--on); }
.mn .themebox label { flex: none; }
.mn .themesel { flex: 1; min-width: 0; min-height: 2.75rem; padding: 8px 12px 8px 14px; background: var(--panel); color: var(--text); border: 2px solid var(--pop-edge, var(--line)); border-radius: 999px; font: inherit; font-size: max(16px, 1rem); box-shadow: 0 3px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); cursor: pointer; }
.mn-bob { flex: none; align-self: flex-end; width: min(9rem, 40vw); aspect-ratio: 300 / 328; margin-top: auto; background: center / contain no-repeat; filter: drop-shadow(0 5px 0 rgba(0, 0, 0, .28)); transform: rotate(-4deg); transform-origin: 50% 90%; pointer-events: none; -webkit-user-select: none; user-select: none; }
.mn.on .mn-bob { animation: mnBob 3.2s ease-in-out .5s infinite; }
@keyframes mnBob { 0%, 100% { transform: rotate(-4deg) translateY(0); } 50% { transform: rotate(-1deg) translateY(-6px); } }
.mn-close { flex: none; width: 2.75rem; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 16px; padding: calc(20px + env(safe-area-inset-top, 0px)) 0 20px; border: 0; background: #fff; color: #15151a; font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background .15s; }
.mn-close:hover { background: #f1f1f4; }
.mn-close:focus-visible { outline: 3px solid #15151a; outline-offset: -6px; }
.mn-x { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; }
.mn-cl { writing-mode: vertical-rl; font-size: .9375rem; font-weight: 800; letter-spacing: .34em; line-height: 1; white-space: nowrap; }
@media (max-width: 719.98px) { .mn-panel { width: 100vw; } .mn-links { gap: 8px; } .mn-links button { padding: 8px 10px; } .mn-body { padding-left: 14px; padding-right: 14px; } }
@media (max-height: 560px) { .mn-bob { display: none; } }
@media (prefers-reduced-motion: reduce) { .mn-panel, .mn-back, .mn-tab, .mn-links button, .mn .mn-bob { transition: none !important; animation: none !important; } }
@media print { .mn-tab, .mn { display: none !important; } }
html[data-theme="navy"] .mn-tab, html[data-theme="navy"] .mn-panel { --on: #1a1330; }
header.top .top-row { padding-right: calc(var(--mn-tab) - 4px); }
@media (max-width: 1829.98px) { .titlebar .titleright { margin-right: 0; } }
/* 広い画面（最大化など）：中身は幅1800pxで中央に寄るので、右の余白（＝(画面幅 − 見出し欄の幅) ÷ 2）がメニューのタブより狭いうちは、その足りない分だけ時計を左へ寄せる。
   スクロールバーが出ている窓（画面幅1830〜1950pxほど）でも、時計とメニューのタブが重ならず、タブとの間に10px以上あく。余白が足りれば0になり、ほかの幅は今までどおり */
@media (min-width: 1830px) { .titlebar .titleright { margin-right: 0; } }
`;
  const st = document.createElement("style"); st.id = "mnCss"; st.textContent = css; document.head.appendChild(st);

  /* ボブ：保管庫の絵を、背景画像（画像要素ではない）として貼る */
  const bob = document.getElementById("mnBob");
  if (bob && window.PXS && PXS.has("_bobmini")) bob.style.backgroundImage = 'url("' + PXS.url("_bobmini") + '")';
  if (bob) bob.addEventListener("contextmenu", e => e.preventDefault());

  let isOpen = false;
  const focusables = () => [...panel.querySelectorAll("button, select, a[href], [tabindex]:not([tabindex='-1'])")].filter(el => !el.disabled && el.offsetParent !== null);
  function setOpen(on) {
    if (on === isOpen) return;
    isOpen = on;
    mn.classList.toggle("on", on);
    mn.setAttribute("aria-hidden", on ? "false" : "true");
    tab.setAttribute("aria-expanded", on ? "true" : "false");
    tab.setAttribute("aria-label", on ? "メニューを閉じる" : "メニューを開く");
    if (on) {
      if (typeof hidePop === "function") { try { hidePop(); } catch (_) {} }
      const cur = panel.querySelector('.mn-links [aria-current="page"]') || panel.querySelector(".mn-links button");
      setTimeout(() => { if (isOpen && cur) cur.focus({ preventScroll: true }); }, 30);
    } else {
      tab.focus({ preventScroll: true });
    }
  }
  window.MN = { open: () => setOpen(true), close: () => setOpen(false), isOpen: () => isOpen };
  tab.addEventListener("click", () => setOpen(!isOpen));
  mn.addEventListener("click", e => {
    if (e.target.closest("[data-mn-close]")) { setOpen(false); return; }
    if (e.target.closest(".mn-links [data-go]")) setOpen(false);          // リンクを押したら、移ったあとにメニューは閉じる（移る処理は views.js）
  });
  // 暗い背景の上でスクロールしても、後ろのページが動かないように
  const stop = e => { if (e.target.closest && e.target.closest(".mn-back")) e.preventDefault(); };
  mn.addEventListener("wheel", stop, { passive: false });
  mn.addEventListener("touchmove", stop, { passive: false });
  document.addEventListener("keydown", e => {
    if (!isOpen) return;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false); return; }
    if (e.key === "Tab") {                                                   // Tab で、メニューの外へ出ないようにする
      const f = focusables(); if (!f.length) return;
      const a = document.activeElement, i = f.indexOf(a);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); }
    }
  }, true);
  window.addEventListener("popstate", () => setOpen(false));
})();

/*MENUJS-END*/
