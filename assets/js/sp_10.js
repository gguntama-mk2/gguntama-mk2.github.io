
/* ============================================================
   トップページ（技チェックシート・コンボ集・確定反撃表・ステージ・格ゲー用語集と同じページの中で切り替える画面）
   ------------------------------------------------------------
   ・ヒーロー：タイトル・ひとこと説明・ボタン。その下に、色つきのパネルを2枚（参考サイトの、キャラが1人で立つパネルのつくり）。
       女の子は左、リーは右を向いているので、向いている側（外側）に、学習内容のカード（各ページへの入口）を置く。
       左＝覚える（技チェックシート・確定反撃表・格ゲー用語集）／右＝活かす（コンボ集・ステージ・キャラ数や技数）。
       狭い画面でも、「カード｜女の子」「リー｜カード」の並びのまま、どちらも向いている側にカードが来るようにする。
   ・HOW TO USE：技チェックシートの使い方
   ・SEARCH：検索欄の使い方（技名・コマンド・数字ジャンプ）
   ・UPDATE：アップデート内容の新しい順（UPDATES）
   配色は、ページ全体の配色テーマの変数（--bg --panel --line --text --sub --accent …）をそのまま使う。
   表示・非表示は、ほかのページと同じく <html data-page="home"> と CSS で切り替える（HO.show / HO.hide は、数字などの更新用）。
   ============================================================ */
(function () {
  const host = document.getElementById("hoHost");
  if (!host) return;
  if (!host.attachShadow) { host.textContent = "このブラウザではトップページを表示できません。「技チェックシート」から使えます。"; return; }
  const root = host.attachShadow({ mode: "open" });
  const css = `
:host { display: block; color: var(--text); font-family: inherit; }
* { box-sizing: border-box; }
a, button { font: inherit; }
button { -webkit-tap-highlight-color: transparent; }
.en { font-family: var(--font-ui); text-transform: uppercase; letter-spacing: .14em; font-weight: 700; }
.ho { max-width: 1100px; margin: 0 auto; padding: 4px 0 8px; }

/* ヒーロー */
.hero { position: relative; overflow: hidden; margin: 0 0 40px; padding: 58px 36px 34px; border: 1px solid var(--line); border-radius: 4px;
  background: radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, var(--accent) 22%, var(--panel)) 0%, var(--panel) 52%, color-mix(in srgb, var(--bg) 70%, var(--panel)) 100%);
  clip-path: polygon(0 0, calc(100% - 28px) 0, 100% 28px, 100% 100%, 28px 100%, 0 calc(100% - 28px)); }
.hero::before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .5;
  background: repeating-linear-gradient(-58deg, transparent 0 22px, color-mix(in srgb, var(--accent) 9%, transparent) 22px 24px); background-position: 0 var(--sy, 0px); }
.hero > * { position: relative; z-index: 1; }
.hero > .hdeco { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.hhd { max-width: 52em; margin: 0 auto 14px; text-align: center; }   /* 名言の文字の見た目の上下の空きが同じになるよう、上を12px広げて下を12px狭めた（2026-10-21。ふつうの画面幅で、上42px：下69px だった） */
.hero h2 { margin: 0; font-size: clamp(1.45rem, 4.6vw, 2.7rem); line-height: 1.26; font-weight: 400; }
.hero h2 .qt { display: block; font-family: "Rockglazer", "Palatino Linotype", Palatino, Georgia, serif; font-weight: 400; font-style: normal; font-synthesis: none; letter-spacing: .01em; text-wrap: balance; overflow-wrap: break-word; }
.hero h2 .qj { display: block; max-width: 34em; margin: 26px auto 0; color: var(--text); font-family: "HakkouMincho", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "MS PMincho", serif; font-size: clamp(.95rem, 2.1vw, 1.45rem); font-weight: 400; font-style: normal; font-synthesis: none; letter-spacing: .06em; line-height: 1.9; text-wrap: balance; word-break: auto-phrase; overflow-wrap: break-word; }   /* 日本語訳：英語の名言より小さく（人名と同じ明朝） */
.hero h2 .by { display: block; margin-top: 16px; color: var(--sub); font-family: "HakkouMincho", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "MS PMincho", serif; font-size: 1.0625rem; font-weight: 400; font-synthesis: none; letter-spacing: .1em; line-height: 1.6; text-align: right; }   /* 人名は、名言の右下（下のカードの「-ベンジャミン・フランクリン-」と同じ） */
.btn { display: inline-flex; align-items: center; gap: 10px; min-height: 46px; padding: 0 22px; border: 1px solid var(--line); border-radius: 2px; background: color-mix(in srgb, var(--panel) 80%, transparent); color: var(--text); font-size: .9375rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: border-color .15s, transform .15s, background .15s;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px)); }
.btn:hover { border-color: var(--accent); transform: translateY(-1px); }
.btn:focus-visible { outline: 2px solid var(--ok); outline-offset: 3px; }
.btn.pri { background: var(--accent); border-color: var(--accent); color: var(--on); }
.btn .ar { font-family: var(--font-ui); letter-spacing: .06em; }

/* ステージ：色つきのパネルを2枚。キャラは枠に入れず、パネルのふちに立たせる。
   女の子は左向きなので右側に立たせて、左に学習内容。リーは右向きなので左側に立たせて、右に学習内容（向いている側に内容が来る） */
.stage { display: grid; gap: 72px; margin: 34px 0 56px; }
.pn { --pad: 32px; position: relative; display: grid; column-gap: 28px; row-gap: 18px; padding: var(--pad); border: 3px solid #14141c; border-radius: 26px; color: #14141c; background: var(--pnbg);
  box-shadow: 0 22px 40px -28px rgba(0, 0, 0, .7); }
.pn.g { --pnbg: linear-gradient(135deg, #ffe27a 0%, #ffc23d 100%); grid-template-columns: minmax(0, 1fr) clamp(150px, 16vw, 196px); grid-template-areas: "hd chr" "cards chr"; }
.pn.l { --pnbg: linear-gradient(135deg, #b4f1da 0%, #55cfa4 100%); grid-template-columns: clamp(150px, 16vw, 196px) minmax(0, 1fr); grid-template-areas: "chr hd" "chr cards"; }
.pn::before { content: ""; position: absolute; inset: 0; z-index: 0; border-radius: 23px; pointer-events: none; background: repeating-linear-gradient(-58deg, rgba(255, 255, 255, .26) 0 13px, transparent 13px 26px); background-position: 0 var(--sy, 0px); }
.pn > * { position: relative; z-index: 1; }
.pn-hd { grid-area: hd; align-self: start; min-width: 0; }
.pn-hd .no { display: inline-block; margin: 0 0 10px; padding: 2px 12px; border-radius: 99px; background: #14141c; color: #fff; font-size: .75rem; }
.pn-hd h3 { margin: 0 0 8px; font-size: clamp(1.5rem, 3.2vw, 2.25rem); line-height: 1.22; letter-spacing: .02em; font-weight: 800; text-wrap: balance; }
.pn-hd h3 .ln { display: inline-block; }
.pn-hd p { margin: 0; max-width: 38em; color: #2b2b36; font-size: .9375rem; line-height: 1.8; }
/* 名言パネル：名言を大きく、その下に人名を小さく（白光明朝。フォントがないときは、手元の明朝体） */
.pn.q .pn-hd h3, .pn.q .pn-hd p { font-family: "HakkouMincho", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "MS PMincho", serif; font-weight: 400; font-style: normal; font-synthesis: none; }
.pn.q .pn-hd h3 { margin: 0 0 8px; font-size: clamp(1.95rem, 4.3vw, 3.2rem); line-height: 1.4; letter-spacing: .04em; word-break: auto-phrase; }   /* 白光明朝は縦長（字幅がせまい）ので、そのぶん大きく */
.pn.q.l .pn-hd h3 { font-size: clamp(1.55rem, 3.25vw, 2.6rem); line-height: 1.4; }
.pn.q .pn-hd p { max-width: none; font-size: 1.0625rem; line-height: 1.6; letter-spacing: .1em; color: #2b2b36; text-align: right; }   /* 人名は、名言の右下 */
.pn .cards { grid-area: cards; align-self: end; }
.chr { grid-area: chr; position: relative; z-index: 2; align-self: end; width: 100%; margin: calc(-1 * var(--pad) - 56px) 0 calc(-1 * var(--pad) - 3px); }
.chr::after { content: ""; position: absolute; left: 2%; right: 2%; bottom: -5px; z-index: -1; height: 18px; border-radius: 50%; background: radial-gradient(closest-side, rgba(20, 20, 28, .38), transparent); }
.chr img { display: block; width: 100%; height: auto; filter: drop-shadow(0 4px 0 rgba(20, 20, 28, .12)); pointer-events: none; -webkit-user-drag: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
/* 黄色い枠(01)の女の子と緑の枠(02)のリー：頭が枠の上へはみ出さないよう、画像の高さを枠の高さ(上辺〜下辺)にそろえる。画面が900px以下のときは、もともと枠の中に収まっているのでそのまま */
@media (min-width: 901px) {
  .pn.g .chr, .pn.l .chr { align-self: stretch; margin: calc(-1 * var(--pad) - 3px) 0; }
  .pn.g .chr img, .pn.l .chr img { position: absolute; left: 0; bottom: 0; width: 100%; height: 100%; object-fit: contain; object-position: center bottom; }
  .pn.g { min-height: calc(clamp(150px, 16vw, 196px) * 900 / 368 - 53px); }   /* 枠の高さは今までどおり（これまでは画像の高さで決まっていた） */
  .pn.g .chr::after, .pn.l .chr::after { left: 8%; right: 8%; }
}
.meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 14px; margin: 0; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); color: var(--text); list-style: none; }
.meta li { display: grid; gap: 2px; min-width: 0; }
.meta .k { color: var(--sub); font-size: .625rem; }
.meta .v { font-size: 1.25rem; font-weight: 800; line-height: 1.15; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.meta .v small { font-size: .75rem; font-weight: 700; color: var(--sub); margin-left: 3px; }
.meta .v.t { font-size: .9375rem; font-weight: 700; }

/* セクション見出し */
.sec { margin: 0 0 40px; }
.sh { display: flex; align-items: baseline; gap: 14px; margin: 0 0 18px; padding: 0 0 10px; border-bottom: 1px solid var(--line); position: relative; }
.sh::after { content: ""; position: absolute; left: 0; bottom: -1px; width: 88px; height: 3px; background: var(--accent); }
.sh .no { color: var(--accent); font-size: .9375rem; }
.sh h3 { margin: 0; font-size: 1.375rem; line-height: 1.2; }
.sh .ja { margin-left: auto; color: var(--sub); font-size: .8125rem; }


/* 学習内容のカード（押すとそのページへ） */
.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; }
.cards > li { min-width: 0; display: flex; }
.cards > li > .meta { width: 100%; }
.card { position: relative; display: grid; align-content: start; gap: 4px; width: 100%; min-width: 0; margin: 0; padding: 12px 14px 10px; border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 12px; background: var(--panel); color: var(--text); text-align: left; cursor: pointer; transition: border-color .15s, transform .15s, box-shadow .15s; }
.card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 10px 26px -14px rgba(20, 20, 28, .7); }
.card:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }
.card .top { display: flex; align-items: center; gap: 8px; color: var(--accent); font-size: .6875rem; }
.card .top .no { font-size: 1rem; letter-spacing: .06em; }
.card .top .lb { color: var(--sub); }
.card h4 { margin: 0; font-size: 1.0625rem; line-height: 1.3; }
.card p { margin: 0; color: var(--sub); font-size: .8125rem; line-height: 1.65; }
.card .go { justify-self: end; margin-top: 2px; color: var(--accent); font-size: .6875rem; }

/* HOW TO USE */
.steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 0; padding: 0; list-style: none; counter-reset: st; }
.steps li { position: relative; min-width: 0; padding: 18px 16px 16px; border: 1px solid var(--line); border-top: 3px solid var(--accent); border-radius: 4px; background: var(--panel); }
.steps .n { display: block; margin: 0 0 6px; color: var(--accent); font-size: 1.5rem; line-height: 1; }
.steps h4 { margin: 0 0 6px; font-size: 1rem; }
.steps p { margin: 0; color: var(--sub); font-size: .8125rem; line-height: 1.75; }
.steps b { color: var(--text); }

/* SEARCH */
.tips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 14px; margin: 0; padding: 0; list-style: none; }
.tips li { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 12px; align-items: baseline; padding: 12px 14px; border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 4px; background: var(--panel); }
.tips code { padding: 2px 10px; border: 1px solid color-mix(in srgb, var(--accent) 55%, var(--line)); border-radius: 2px; background: color-mix(in srgb, var(--accent) 12%, var(--panel)); color: var(--text); font-family: var(--font-ui); font-size: .9375rem; font-weight: 700; white-space: nowrap; }
.tips span { color: var(--sub); font-size: .8125rem; line-height: 1.7; }

/* UPDATE */
.upds { display: grid; gap: 8px; margin: 0 0 12px; padding: 0; list-style: none; }
.upds li { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: 4px 14px; align-items: baseline; padding: 12px 14px; border: 1px solid var(--line); border-radius: 4px; background: var(--panel); }
.upds .v { color: var(--accent); font-size: .9375rem; }
.upds time { color: var(--sub); font-size: .8125rem; font-variant-numeric: tabular-nums; }
.upds .t { min-width: 0; font-size: .875rem; line-height: 1.7; overflow-wrap: anywhere; }
.upds .none { color: var(--sub); font-size: .875rem; }

/* フッター */
.foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 20px; margin: 48px 0 0; padding: 18px 0 0; border-top: 1px solid var(--line); color: var(--sub); font-size: .75rem; }
.foot nav { display: flex; flex-wrap: wrap; gap: 6px 16px; }
.foot button { padding: 0; border: 0; background: none; color: var(--sub); font-size: .75rem; cursor: pointer; }
.foot button:hover { color: var(--accent); }
.foot button:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }

@media (max-width: 900px) {
  .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stage { gap: 40px; margin-top: 0; }
  .pn { --pad: 20px; row-gap: 14px; column-gap: 14px; }
  .pn.g { grid-template-columns: minmax(0, 1fr) clamp(124px, 34%, 232px); grid-template-areas: "hd hd" "cards chr"; }
  .pn.l { grid-template-columns: clamp(124px, 34%, 232px) minmax(0, 1fr); grid-template-areas: "hd hd" "chr cards"; }
  .cards { grid-template-columns: minmax(0, 1fr); }
  .chr { margin-top: 0; }
  .card .go { display: none; }
}
@media (max-width: 640px) {
  .hero { padding: 30px 14px 24px; margin-bottom: 30px; clip-path: polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px)); }
  .hhd { margin-bottom: 0; }
  .hero h2 .qj { margin-top: 20px; }
  .hero h2 .by { font-size: .875rem; }
  .btn { flex: 1 1 100%; justify-content: space-between; }
  .pn { --pad: 16px; border-radius: 22px; }
  .pn::before { border-radius: 19px; }
  .pn-hd p { font-size: .8125rem; line-height: 1.7; }
  .card { padding: 10px 12px 9px; }
  .card h4 { font-size: .9375rem; }
  .card p { font-size: .75rem; line-height: 1.55; }
  .meta { grid-template-columns: minmax(0, 1fr); padding: 10px 12px; gap: 6px; }
  .meta li { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  .meta .k { letter-spacing: .06em; white-space: nowrap; }
  .meta .v { font-size: 1.0625rem; white-space: nowrap; }
  .meta .v.t { font-size: .875rem; }
  .steps, .tips { grid-template-columns: minmax(0, 1fr); }
  .sh h3 { font-size: 1.125rem; }
  .sh .ja { display: none; }
  .upds li { grid-template-columns: auto minmax(0, 1fr); }
  .upds .t { grid-column: 1 / -1; }
}
@media (max-width: 350px) {
  .pn.g, .pn.l { grid-template-columns: minmax(0, 1fr); }
  .pn.g { grid-template-areas: "hd" "cards" "chr"; }
  .pn.l { grid-template-areas: "hd" "cards" "chr"; }
  .chr { width: 150px; justify-self: center; }
}
/* パララックスの飾り：画面に固定した層（スクロールより遅く流れる）と、ヒーロー内の層。色はテーマの強調色と、ポップな差し色 */
.deco { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.s { position: absolute; left: 0; top: 0; display: block; width: var(--sz, 40px); height: var(--sz, 40px); opacity: .26; will-change: transform; }
.s svg { display: block; width: 100%; height: 100%; overflow: visible; }
.k1 { color: var(--accent); } .k2 { color: #ffd34e; } .k3 { color: #4fd8ff; } .k4 { color: #ff7eb6; } .k5 { color: #7ae8b0; }
.hdeco .s { opacity: .34; }
/* 名言のスクロールに合わせたフェードイン（scroll で opacity と位置を変える。JS が動かない・動きを減らす設定のときは、最初から全部見える） */
.fi { will-change: opacity, transform; }
@media (prefers-reduced-motion: reduce) { .btn, .card { transition: none; } .btn:hover, .card:hover { transform: none; } .s { will-change: auto; } }






















































































/*POP-START*/
/* ポップ：丸い・ぷっくり・触ると弾む（トップページ） */
.hero { border: 2px solid var(--pop-edge, var(--line)); border-radius: 38px; clip-path: none; box-shadow: 0 8px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.hero::before { border-radius: inherit; }
.btn { border-width: 2px; border-color: var(--pop-edge, var(--line)); border-radius: 999px; clip-path: none; box-shadow: 0 4px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); transition: transform .22s var(--pop-ease, ease), box-shadow .22s var(--pop-ease, ease); }
.btn:hover { transform: translateY(-3px); box-shadow: 0 7px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.btn:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.pn { border-radius: 38px; box-shadow: 0 10px 0 rgba(20, 20, 28, .55), 0 28px 40px -26px rgba(0, 0, 0, .7); }
.pn::before { border-radius: 35px; }
.pn-hd .no { padding: 3px 14px; box-shadow: 0 3px 0 rgba(0, 0, 0, .35); }
.meta { border: 2px solid var(--pop-edge, var(--line)); border-radius: 20px; box-shadow: 0 4px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.sh { border-bottom-width: 2px; }
.sh::after { height: 6px; bottom: -4px; border-radius: 999px; }
.card { border: 2px solid var(--pop-edge, var(--line)); border-radius: 22px; box-shadow: 0 5px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); transition: transform .26s var(--pop-ease, ease), box-shadow .26s var(--pop-ease, ease); }
.card:hover { border-color: var(--accent); transform: translateY(-4px) rotate(-.4deg); box-shadow: 0 9px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.card:active { transform: translateY(1px); box-shadow: 0 2px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.card .go { padding: 1px 10px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 16%, transparent); }
.steps li { border: 2px solid var(--pop-edge, var(--line)); border-radius: 24px; box-shadow: 0 5px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.steps .n { display: inline-grid; place-items: center; min-width: 46px; height: 46px; padding: 0 12px; margin: 0 0 10px; border-radius: 999px; background: var(--accent); color: var(--on); font-size: 1.15rem; box-shadow: 0 3px 0 color-mix(in srgb, var(--accent) 50%, #000); }
.tips li { border: 2px solid var(--pop-edge, var(--line)); border-radius: 22px; box-shadow: 0 4px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.tips code { padding: 3px 14px; border-width: 2px; border-radius: 999px; }
.upds li { border: 2px solid var(--pop-edge, var(--line)); border-radius: 20px; box-shadow: 0 3px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.foot { border-top-width: 2px; }
.foot button { padding: 4px 12px; border-radius: 999px; }
.foot button:hover { background: color-mix(in srgb, var(--accent) 14%, transparent); }
@media (max-width: 640px) { .meta li { flex-wrap: wrap; } .meta .k { letter-spacing: .02em; } .meta .v { margin-left: auto; text-align: right; } }
@media (prefers-reduced-motion: reduce) { .btn:hover, .card:hover, .card:active, .btn:active { transform: none; } }
/*POP-END*/
`;
  const PAGES_INFO = [
    { go: "login", no: "00", en: "Login", ja: "ログイン", s: "PROJECT Tアカウントへログインし、Discord・Google・YouTubeなどの連携を管理します。" },
    { go: "sheet", no: "01", en: "Move Check", ja: "技チェックシート", s: "技ごとにデータをチェック。ブックマーク機能やメモも完備。" },
    { go: "combo", no: "04", en: "Combo List", ja: "コンボ集", s: "始動技ごとにコンボを掲載。コンボ登録機能も利用可能。" },
    { go: "punish", no: "02", en: "Punish List", ja: "確定反撃表", s: "フレーム・状況ごとに確定反撃を確認。相手キャラを選択することで逆引き検索も可能" },
    { go: "update", no: "06", en: "Update", ja: "アップデート内容", s: "バージョンごとの調整内容を、キャラ別に確認できます。" },
    { go: "stage", no: "05", en: "Stage", ja: "ステージ", s: "ステージごとのギミック・形状・広さなどの詳細情報を確認可能。" },
    { go: "glossary", no: "03", en: "Glossary", ja: "格ゲー用語集", s: "格ゲー共通用語や鉄拳用語を掲載。検索機能で読みなども検索可能。" },
    { go: "gallery", no: "07", en: "Gallery", ja: "ギャラリー", s: "これまでに追加した背景画像を、キャラごとに見られます。" },
    { go: "vs", no: "08", en: "VS", ja: "VS", s: "対戦履歴と録画動画を試合単位で確認。ラウンドや対戦内容もまとめて振り返れます。" },
    { go: "privacy", no: "09", en: "Privacy", ja: "プライバシーポリシー", s: "PROJECT Tの取得情報・利用目的・外部サービス連携・データ削除方針を確認できます。" },
    { go: "price", no: "10", en: "Pricing", ja: "利用料金", s: "このサイトは無料で使えます。今後の活動の応援（YouTube メンバーシップ）はこちら。" }
  ];
  const STEPS = [
    ["調べたいキャラを選択", "上のキャラ一覧から選びます。キャラごとに、チェックの進み具合が自動で保存されます。"],
    ["確認・暗記", "<b>発生・ダメージ・ガード状況</b>など覚えた項目にチェック。右クリック(スマホは長押し)で正解を確認可能。"],
    ["情報を検索", "検索バーに技名・コマンド・フレーム・状況などを入力しデータを検索。"],
    ["ブックマーク", "主力技などの覚えたい技をブックマーク可能。"]
  ];
  const TIPS = [
    ["コマンドを指定", "コマンドを入力して検索。"],
    ["フレームを入力", "フレームを入力すると該当する技へジャンプ可能。リンクの左の「✖」で解除できます。"],
    ["ワード検索", "「ヒート」「上」など、技表内の文字（攻撃判定も）を対象にして検索可能。"],
    ["ギミック検索", "「ウォールブレイク」などの各種ギミックを検索可能。"]
  ];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function statsHtml() {
    const chars = (typeof CHARACTERS !== "undefined") ? CHARACTERS : [];
    const n = chars.length, mv = chars.reduce((a, c) => a + ((c.moves && c.moves.length) || 0), 0);
    const ver = document.querySelector("p.ver"), vt = ver ? ver.textContent.trim() : "";
    const m = /Ver\.[\d.]+/.exec(vt), dt = /技データ取得：([^\s]+)/.exec(vt);
    return '<li><span class="k en">Characters</span><span class="v">' + n + '<small>キャラ</small></span></li>' +
      '<li><span class="k en">Moves</span><span class="v">' + mv.toLocaleString("en-US") + '<small>技</small></span></li>' +
      (m ? '<li><span class="k en">Game version</span><span class="v t">' + esc(m[0]) + '</span></li>' : "") +
      (dt ? '<li><span class="k en">Data</span><span class="v t">' + esc(dt[1]) + '</span></li>' : "");
  }
  function updatesHtml() {
    let list = [];
    try { if (Array.isArray(UPDATES)) list = UPDATES.slice(); } catch (e) {}   // データは、この部品より後ろで宣言される（宣言の前に触ると例外になるので、読めるときだけ使う）
    const num = v => String(v).split(".").map(x => +x || 0);
    list.sort((a, b) => { const x = num(a.v), y = num(b.v); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (y[i] || 0) - (x[i] || 0); return 0; });
    if (!list.length) return '<li><span class="none">アップデート情報はまだありません。</span></li>';
    return list.slice(0, 3).map(u => {
      const nCom = u.c ? u.c.length : 0, nChar = u.r ? Object.keys(u.r).length : 0;
      const parts = [];
      if (nCom) parts.push("全キャラ共通の変更 " + nCom + "件");
      if (nChar) parts.push(nChar + "キャラの技を変更");
      const g = (u.g || []).find(x => !/^(適用日時|アップデートの影響)/.test(x)) || "";
      const t = parts.length ? parts.join("／") : (g.length > 70 ? g.slice(0, 70) + "…" : g);
      return '<li><span class="v en">Ver.' + esc(u.v) + '</span><time>' + esc(u.d || "") + '</time><span class="t">' + esc(t) + '</span></li>';
    }).join("");
  }
  /* ---- パララックスの飾り（図形はSVG。色は強調色＋差し色） ---- */
  const SVGS = {
    star: '<svg viewBox="0 0 48 48"><path d="M24 5l5.1 12.2L42 18.4l-9.8 8.5 3 12.7L24 32.8l-11.2 6.8 3-12.7L6 18.4l12.9-1.2z" fill="currentColor" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 48 48"><path d="M24 3c1.6 11 6 19.4 21 21-15 1.6-19.4 10-21 21-1.6-11-6-19.4-21-21C18 22.4 22.4 14 24 3z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>',
    ring: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="8"/></svg>',
    dot: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="currentColor"/></svg>',
    squig: '<svg viewBox="0 0 96 32"><path d="M6 16c9-14 18 14 27 0s18 14 27 0 18 14 27 0" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 48 48"><path d="M24 8v32M8 24h32" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/></svg>',
    sq: '<svg viewBox="0 0 48 48"><rect x="5" y="5" width="38" height="38" rx="15" fill="currentColor"/></svg>',
    tri: '<svg viewBox="0 0 48 48"><path d="M24 9L41 37H7z" fill="currentColor" stroke="currentColor" stroke-width="9" stroke-linejoin="round"/></svg>'
  };
  /* [形, 色, 横の位置(%), 縦の位置(画面の高さに対する割合), 大きさ(px), 動く速さ(スクロールの何倍か)、回る速さ(100pxスクロールあたりの度)] */
  const PAGE_DECO = [
    ["star", "k2", 6, .12, 44, .16, 5], ["ring", "k3", 90, .2, 52, .1, -4], ["squig", "k4", 80, .55, 84, .22, 0], ["dot", "k5", 12, .42, 26, .3, 0],
    ["spark", "k1", 93, .78, 46, .14, 8], ["sq", "k3", 4, .72, 34, .2, 6], ["plus", "k4", 22, .9, 30, .26, -7], ["tri", "k2", 70, .08, 30, .12, 5],
    ["ring", "k5", 52, .95, 38, .18, 3], ["star", "k4", 36, .3, 26, .28, -6], ["dot", "k2", 64, .62, 20, .34, 0], ["squig", "k5", 3, .3, 70, .12, 0],
    ["spark", "k3", 46, .12, 30, .2, -5], ["plus", "k1", 97, .45, 26, .3, 6]
  ];
  /* ヒーローの中：枠の中の位置（%）。要素の中心が画面の中央にあるときを基準に、ずれる量（data-par の倍率）が決まる */
  const HERO_DECO = [
    ["star", "k2", 5, 14, 42, .22, 6], ["ring", "k3", 91, 12, 50, -.14, -5], ["squig", "k4", 84, 76, 80, .3, 0], ["dot", "k5", 10, 70, 24, -.2, 0],
    ["spark", "k1", 93, 48, 38, .18, 8], ["plus", "k4", 20, 88, 26, -.26, -6], ["sq", "k3", 4, 44, 28, .24, 7]
  ];
  const shapeHtml = (d, inHero) => '<span class="s ' + d[1] + '" style="--sz:' + d[4] + 'px' + (inHero ? ';left:' + d[2] + '%;top:' + d[3] + '%' : '') + '" data-x="' + d[2] + '" data-y="' + d[3] + '" data-sp="' + d[5] + '" data-rt="' + d[6] + '">' + SVGS[d[0]] + '</span>';
  const byGo = id => PAGES_INFO.find(p => p.go === id);
  const cardHtml = p => '<li><button type="button" class="card" data-go="' + p.go + '">' +
    '<span class="top"><span class="no en">' + p.no + '</span><span class="lb en">' + p.en + '</span></span>' +
    '<h4>' + p.ja + '</h4><p>' + p.s + '</p><span class="go en">Open →</span></button></li>';
  const chrHtml = (k, img) => '<div class="chr" aria-hidden="true"><img src="' + img + '" alt="" decoding="async" draggable="false"></div>';
  const GIRL = "assets/media/356e885b36a307552b9b.webp", LEE = "assets/media/6bdfaa0c26f6f7e4588c.webp";   // 2枚の画像（組み立て時にWebPのdata URIへ差し替わる）
  const panelHtml = (k, no, ttl, desc, ids, extra, img, hid) =>
    '<section class="pn ' + k + ' q" aria-labelledby="' + hid + '"><div class="pn-hd"><span class="no en">' + no + '</span><h3 id="' + hid + '" class="fi">' + ttl + '</h3><p class="fi">' + desc + '</p></div>' +
    '<ul class="cards">' + ids.map(i => cardHtml(byGo(i))).join("") + (extra || "") + '</ul>' + chrHtml(k, img) + '</section>';
  function build() {
    root.innerHTML = '<style>' + css + '</style>' +
      '<div class="deco" aria-hidden="true">' + PAGE_DECO.map(d => shapeHtml(d, false)).join("") + '</div>' +
      '<div class="ho">' +
        '<section class="hero" aria-labelledby="ho-h">' +
          '<div class="hdeco" aria-hidden="true">' + HERO_DECO.map(d => shapeHtml(d, true)).join("") + '</div>' +
          '<div class="hhd">' +
            '<h2 id="ho-h"><span class="qt" lang="en">The first and greatest victory is to conquer yourself; to be conquered by yourself is of all things most shameful and vile.</span><span class="qj" lang="ja">最初にして最大の勝利とは自分自身に打ち勝つことだ。自分自身に敗北することは、あらゆることの中で最も羞恥であり卑劣なことだ。</span><span class="by">-アリストクレス-</span></h2>' +
          '</div>' +
        '</section>' +
        '<div class="stage">' +
          panelHtml("g", "01 · Learn", '<span class="ln">知識への投資は、</span><span class="ln">常に最大の利子を生む。</span>', "-ベンジャミン・フランクリン-", ["sheet", "punish", "glossary"], "", GIRL, "ho-pg") +
          panelHtml("l", "02 · Practice", '<span class="ln">特別なことをするために、</span><span class="ln">特別なことを行う必要はない。</span><span class="ln">普段どおりの当たり前のことを、</span><span class="ln">当たり前にやる。</span>', "-イチロー-", ["combo", "stage"], '<li><ul class="meta" id="ho-meta">' + statsHtml() + '</ul></li>', LEE, "ho-pl") +
        '</div>' +
        '<section class="sec" aria-labelledby="ho-u"><div class="sh"><span class="no en">01</span><h3 class="en" id="ho-u">How to use</h3><span class="ja">技チェックシートの使い方</span></div>' +
          '<ol class="steps">' + STEPS.map((s, i) => '<li><span class="n en">0' + (i + 1) + '</span><h4>' + s[0] + '</h4><p>' + s[1] + '</p></li>').join("") + '</ol></section>' +
        '<section class="sec" aria-labelledby="ho-s"><div class="sh"><span class="no en">02</span><h3 class="en" id="ho-s">Search</h3><span class="ja">検索欄の使い方</span></div>' +
          '<ul class="tips">' + TIPS.map(t => '<li><code>' + esc(t[0]) + '</code><span>' + t[1] + '</span></li>').join("") + '</ul></section>' +
        '<section class="sec" aria-labelledby="ho-n"><div class="sh"><span class="no en">03</span><h3 class="en" id="ho-n">Update</h3><span class="ja">アップデート内容</span></div>' +
          '<ul class="upds" id="ho-upds">' + updatesHtml() + '</ul>' +
          '<button type="button" class="btn" data-go="update"><span>アップデート内容をすべて見る</span><span class="ar en">→</span></button></section>' +
        '<footer class="foot"><span>非公式のファン制作ツールです。チェック・メモ・ブックマークは、このブラウザに保存されます。</span>' +
          '<nav aria-label="ページへ移動">' + [...PAGES_INFO].sort((a, b) => ["sheet", "combo", "punish", "update", "stage", "glossary", "gallery", "vs", "privacy", "price", "download"].indexOf(a.go) - ["sheet", "combo", "punish", "update", "stage", "glossary", "gallery", "vs", "privacy", "price", "download"].indexOf(b.go)).map(p => '<button type="button" data-go="' + p.go + '">' + p.ja + '</button>').join("") + '</nav></footer>' +
      '</div>';
  }
  root.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("[data-go]");
    if (!b || typeof window.setPage !== "function") return;
    window.setPage(b.dataset.go);
    window.scrollTo(0, 0);
  });
  build();

  /* ---- スクロールに合わせた動き（パララックス・名言のフェードイン） ----
     ・画面に固定した飾りは、スクロールより遅く（速さが違うぶん奥行きが出る）上へ流れ、画面の外へ出たら反対側から戻る。
     ・ヒーローの中の飾りは、画面の中央を基準に、要素ごとの倍率で上下にずれる。縞模様の背景も、少し遅れて動く。
     ・名言（01・02のパネル）は、画面の下から入ってくるあいだに、行ごとに少しずつ現れる（透明→不透明・下から上へ）。
     ・「動きを減らす」設定のときは、飾りは動かさず、名言は最初から全部見せる。 */
  const prm = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let raf = 0;
  const isHome = () => document.documentElement.getAttribute("data-page") === "home";
  function tick() {
    raf = 0;
    if (!isHome()) return;
    const vh = window.innerHeight || 800, y = prm.matches ? 0 : (window.pageYOffset || 0);
    const H = vh + 160;
    root.querySelectorAll(".deco .s").forEach(el => {
      const sp = +el.dataset.sp, rt = +el.dataset.rt, bx = +el.dataset.x, by = +el.dataset.y;
      const t = (((by * vh - y * sp) % H) + H) % H - 80;
      el.style.transform = "translate3d(" + (bx / 100 * (window.innerWidth || 1000)).toFixed(1) + "px," + t.toFixed(1) + "px,0) rotate(" + (y / 100 * rt).toFixed(1) + "deg)";
    });
    root.querySelectorAll(".hdeco .s").forEach(el => {
      const r = el.parentNode.getBoundingClientRect(), k = +el.dataset.sp, rt = +el.dataset.rt;
      const c = r.top + r.height * (+el.dataset.y) / 100;
      el.style.transform = prm.matches ? "" : "translate3d(0," + clamp((c - vh / 2) * -k, -90, 90).toFixed(1) + "px,0) rotate(" + (y / 100 * rt).toFixed(1) + "deg)";
    });
    root.querySelectorAll(".hero, .pn").forEach(el => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sy", prm.matches ? "0px" : ((r.top + r.height / 2 - vh / 2) * -.35).toFixed(1) + "px");
    });
    root.querySelectorAll(".pn-hd").forEach(hd => {
      const lines = hd.querySelectorAll("h3 .ln, p.fi");
      const items = lines.length ? [...lines] : [...hd.querySelectorAll(".fi")];
      items.forEach((el, i) => {
        if (prm.matches) { el.style.opacity = ""; el.style.transform = ""; return; }
        const r = el.getBoundingClientRect();
        const p = clamp((vh * .92 - r.top - i * 22) / (vh * .3), 0, 1), e = 1 - Math.pow(1 - p, 3);
        el.style.opacity = e.toFixed(3);
        el.style.transform = p >= 1 ? "" : "translate3d(0," + ((1 - e) * 30).toFixed(1) + "px,0)";
      });
    });
  }
  const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  if (prm.addEventListener) prm.addEventListener("change", schedule);

  window.HO = {
    show() {   // 表示するたびに、キャラ数・技数・アップデート内容を数え直す（アップデートのデータは、この部品より後に読み込まれる）
      const m = root.getElementById("ho-meta"); if (m) m.innerHTML = statsHtml();
      const u = root.getElementById("ho-upds"); if (u) u.innerHTML = updatesHtml();
      schedule();
    },
    hide() {}
  };
  window.addEventListener("load", () => window.HO.show());   // 全部の部品が読み込まれたあとで、もう一度数え直す
})();

