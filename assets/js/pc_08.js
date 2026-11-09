
/*PNJS-START*/
/* ============================================================
   確定反撃表（技チェックシート・コンボ集・用語集と同じページの中で切り替える画面）
   ------------------------------------------------------------
   ネット上の確反集（15キャラは全技の一覧・21キャラは定番だけの一覧）を、技チェックシートの技データ（CHARACTERS）に照合し、キャラごとに足し引きして作ったデータ NET を使う（残り6キャラは技データから作った表）。
   NET に無いキャラが出た場合だけ、技データから自動で作った参考表を出す。
   ・自キャラ：発生フレームごとの区画に、立ち／しゃがみの表を並べる（条件付きの技にはバッジ）
   ・相手の技から調べる：相手キャラのガード硬直差が -10F 以上 -39F まで（マイナスが大きい側。-40F 以上の大きな不利は除く）の技と、自キャラの反撃候補（上位3つ）を並べる。
     「-N F以上」はマイナスが大きい（-N・-N-1…）側、「-N F以下」はマイナスが小さい（-N・-N+1…プラスまで）側という意味で使う。
     ガード硬直差に「s」が付く技（-11s など＝ガード後に相手が強制しゃがみ状態。上段は当たらない）なら、しゃがみの表から選ぶ。付かない技は立ちの表
   NET の行 = [発生F, 可変発生(1=F～), コマンド(照合できない行の表示用), 技名, 条件(h ヒート中 b ヒート発動 r レイジ d デビル w 立ち途中 c しゃがみ中 s キャラ固有の状態), 技データのk(-1=照合なし), 補足(1)=別の表で補った行, 注記, 追加情報{ov=コマンド表示の上書き dm=ダメージ表示 at=攻撃判定の上書き sp=同じ発生内の並び順 he=1 ヒート発動技（ヒートが発動していないとき使うとヒートが発動する技）}]
   ============================================================ */
(function () {
  const host = document.getElementById("pnHost");
  if (!host) return;
  if (!host.attachShadow) { host.textContent = "このブラウザでは確定反撃表を表示できません。新しいバージョンのブラウザでお試しください。"; return; }
  const root = host.attachShadow({ mode: "open" });
  const PN_CSS = `
  :host { display: block; }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  input, select { -webkit-user-select: text; user-select: text; }
  button { font: inherit; color: inherit; }
  button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }
  .wrappn { max-width: 1100px; margin: 0 auto; }
  .tabs { display: flex; flex-wrap: wrap; gap: 6px; margin: 0 0 12px; }
  .tab { padding: 8px 16px; border: 1px solid var(--line); border-radius: 99px; background: transparent; color: var(--sub); font-size: .875rem; font-weight: 700; cursor: pointer; }
  .tab:hover { color: var(--text); border-color: var(--sub); }
  .tab[aria-selected="true"] { color: var(--text); border-color: var(--accent); background: var(--accent-soft); }
  .pt { margin: 4px 0 2px; font-size: 1.125rem; line-height: 1.4; }
  .pt small { color: var(--sub); font-size: .8125rem; font-weight: 500; margin-left: 6px; }
  .sub { margin: 0 0 12px; color: var(--sub); font-size: .8125rem; line-height: 1.75; }
  .sub .warn { color: var(--text); }
  .filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 10px; }
  .fgrp { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
  .lbl { font-size: .8125rem; color: var(--sub); margin-right: 2px; }
  .chip { background: transparent; color: var(--sub); border: 1px solid var(--line); border-radius: 99px; padding: 4px 13px; font-size: .8125rem; cursor: pointer; white-space: nowrap; }
  .chip:hover { border-color: var(--sub); color: var(--text); }
  .chip[aria-pressed="true"] { color: var(--text); border-color: var(--accent); background: var(--accent-soft); font-weight: 700; }
  select, .search { background: var(--panel); color: var(--text); border: 1px solid var(--line); border-radius: 6px; padding: 5px 8px; font: inherit; font-size: .8125rem; }
  .search { border-radius: 8px; padding: 7px 12px; min-width: 14em; }
  .search::placeholder { color: var(--ph, var(--sub)); }
  select { cursor: pointer; max-width: 16em; }
  #pn-sort { max-width: 24em; }
  .stat { margin: 4px 0 10px; color: var(--sub); font-size: .8125rem; min-height: 1.4em; }
  .stat b { color: var(--text); }

  /* ---- 自キャラ：フレームごとの区画 ---- */
  .fr { margin: 0 0 14px; padding: 10px 12px 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }
  .fr h3 { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 10px; margin: 0 0 8px; font-size: 1rem; }
  .fr h3 .n { font-size: 1.125rem; font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
  .fr h3 small, .fr h3 .cnt { color: var(--sub); font-size: .75rem; font-weight: 400; }
  .chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr)); gap: 8px; }
  .fr .chips { align-items: start; }   /* 自キャラの表：カードは中身の高さのまま並べ、全部の枠の高さは下の --pch（いちばん高いカード）にそろえる */
  .fr .pc { box-sizing: border-box; min-height: var(--pch, 0px); }
  .pc { min-width: 0; padding: 7px 10px 8px; background: var(--panel2, var(--bg)); border: 1px solid var(--line); border-radius: 10px; }
  .pc.cd { border-style: dashed; }
  .pc .l1 { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
  .pc .cmd { font-size: .9375rem; font-weight: 800; letter-spacing: .02em; overflow-wrap: anywhere; }
  .pc.uk .cmd { font-weight: 700; }
  .pc .fr1 { color: var(--sub); font-size: .6875rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .pc .nm { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; margin: 1px 0 4px; color: var(--sub); font-size: .6875rem; line-height: 1.4; overflow: hidden; overflow-wrap: anywhere; min-height: 1.4em; }
  .pc .l3 { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: .75rem; }
  .pc .dm { font-weight: 700; font-variant-numeric: tabular-nums; }
  .bd { padding: 0 7px; border-radius: 99px; border: 1px solid var(--accent); color: var(--accent); font-size: .6875rem; font-weight: 700; line-height: 1.6; white-space: nowrap; }
  .bd.h { border-color: var(--line); color: var(--sub); font-weight: 500; max-width: 9em; overflow: hidden; text-overflow: ellipsis; }
  .bd.c { border-color: var(--sub); color: var(--text); font-weight: 700; }
  .bd.n { border-color: var(--line); color: var(--sub); font-weight: 500; white-space: normal; max-width: 100%; border-radius: 8px; line-height: 1.5; }
  /* タグ：ヒート発動技＝緑／ヒートスマッシュ＝技チェックシートと同じ赤／壁やられ(強)(中)＝文字色の枠／ギミック＝壁オレンジ・床青緑（ギミックはステージ一覧・技チェックシートと同じ色） */
  .bd.he { border-color: var(--kd-he, #10b981); background: color-mix(in srgb, var(--kd-he, #10b981) 28%, transparent); color: var(--text); }
  .bd.hs { border-color: var(--kd-hs, #ec4d63); background: color-mix(in srgb, var(--kd-hs, #ec4d63) 28%, transparent); color: var(--text); }
  .pc.he { border-left: 3px solid var(--kd-he, #10b981); }
  .pc.hs { border-left: 3px solid var(--kd-hs, #ec4d63); }
  .pc .l4 { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin-top: 4px; font-size: .75rem; }
  .bd.w, .bd.g { white-space: normal; max-width: 100%; border-radius: 8px; line-height: 1.5; }
  .bd.w { border-color: var(--sub); color: var(--text); }
  .bd.w.s { border-color: var(--text); background: color-mix(in srgb, var(--text) 16%, transparent); font-weight: 800; }
  .bd.g { border-color: #c2410c; background: #c2410c; color: #fff; }
  .bd.g.f { border-color: #0b7285; background: #0b7285; }
  .bd small { margin-left: 3px; font-size: .625rem; font-weight: 500; opacity: .9; }
  .at { display: flex; flex-wrap: wrap; gap: 3px; margin: 0 0 4px; }
  .ab { display: inline-block; padding: 0 6px; border-radius: 4px; font-size: .6875rem; font-weight: 800; line-height: 1.6; white-space: nowrap; }
  .ab.h { background: #d64545; color: #fff; }
  .ab.m { background: #f2c200; color: #2a2000; }
  .ab.sm { background: #8cc63f; color: #1a2600; }
  .ab.sl { background: #4fc3f7; color: #06293a; }
  .ab.l { background: #2f6fdb; color: #fff; }
  .ab.o { background: transparent; border: 1px solid var(--line); color: var(--sub); font-weight: 600; line-height: 1.45; }
  .lg { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; margin: 0 0 12px; color: var(--sub); font-size: .75rem; }
  .lg .lgi { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px; }
  .lg .lgi .bd { cursor: default; }
  .pc.jp { cursor: pointer; border-color: var(--accent); border-style: solid; }   /* ジャンプリンクの枠は、条件付きの技（.cd＝点線）でも通常の実線 */
  .pc.jp:hover { background: var(--accent-soft); }
  .pc.jp:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }
  .bd.j { background: var(--accent-soft); font-weight: 800; }
  .more { margin: 8px 0 0; padding: 5px 14px; border: 1px solid var(--line); border-radius: 99px; background: transparent; color: var(--accent); font-size: .8125rem; font-weight: 700; cursor: pointer; }
  .more:hover { border-color: var(--accent); }
  .none { margin: 0; color: var(--sub); font-size: .8125rem; }

  /* ---- 相手の技から調べる ---- */
  .gh { display: flex; align-items: baseline; gap: 10px; margin: 18px 0 8px; padding-bottom: 4px; border-bottom: 1px solid var(--line); font-size: 1rem; }
  .gh .n { font-size: 1.125rem; font-weight: 800; color: var(--accent); font-variant-numeric: tabular-nums; }
  .gh .cnt { color: var(--sub); font-size: .75rem; font-weight: 400; }
  .mv { display: grid; grid-template-columns: minmax(0, 17rem) minmax(0, 1fr); gap: 8px 14px; align-items: start; margin: 0 0 8px; padding: 9px 12px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }
  .mv.done { opacity: .62; }
  .mv h3 { margin: 0; font-size: .9375rem; line-height: 1.4; overflow-wrap: anywhere; }
  .mv .mm { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; margin: 3px 0 0; font-size: .8125rem; }
  .mv .mm .cmd { font-weight: 800; overflow-wrap: anywhere; }
  .mv .gd { padding: 0 8px; border-radius: 4px; background: var(--accent-soft); color: var(--text); font-weight: 800; font-size: .75rem; }
  .mv .hh { color: var(--sub); font-size: .75rem; }
  .mv .chips { grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr)); }
  .mv .bst { min-width: 0; }
  .mv .bg + .bg { margin-top: 8px; }
  .mv .rg { margin: 0 0 4px; }
  /* 立ち状態（「s」が付かない技のあと）／しゃがみ状態（「s」が付く技のあと＝強制しゃがみ）の色分け */
  .bd.sS { border-color: var(--kd-st, #5b8def); background: color-mix(in srgb, var(--kd-st, #5b8def) 28%, transparent); color: var(--text); font-weight: 700; }
  .bd.sC { border-color: var(--kd-cr, #ff6ec7); background: color-mix(in srgb, var(--kd-cr, #ff6ec7) 28%, transparent); color: var(--text); font-weight: 700; }
  .mv.sS, .fr.sS { border-left: 4px solid var(--kd-st, #5b8def); }
  .mv.sC, .fr.sC { border-left: 4px solid var(--kd-cr, #ff6ec7); }
  .mv .bg.sS { padding-left: 8px; border-left: 3px solid var(--kd-st, #5b8def); }
  .mv .bg.sC { padding-left: 8px; border-left: 3px solid var(--kd-cr, #ff6ec7); }
  .chip[data-stance="stand"][aria-pressed="true"] { border-color: var(--kd-st, #5b8def); background: color-mix(in srgb, var(--kd-st, #5b8def) 28%, transparent); }
  .chip[data-stance="crouch"][aria-pressed="true"] { border-color: var(--kd-cr, #ff6ec7); background: color-mix(in srgb, var(--kd-cr, #ff6ec7) 28%, transparent); }
  .chk { display: inline-flex; align-items: center; gap: 6px; margin: 6px 0 0; color: var(--sub); font-size: .75rem; cursor: pointer; }
  .chk input { width: 16px; height: 16px; accent-color: var(--accent); }
  .empty { margin: 24px 0; padding: 22px 16px; text-align: center; border: 1px dashed var(--line); border-radius: 12px; color: var(--sub); }


  @media (max-width: 819px) {
    .tab { min-height: 40px; }
    .chip { min-height: 36px; }
    select, .search { min-height: 40px; font-size: .9375rem; max-width: none; }
    .search { font-size: 16px; min-width: 0; width: 100%; }
    .filters { display: grid; grid-template-columns: 1fr; gap: 8px; }
    .fgrp select { width: 100%; }
    .chips { grid-template-columns: repeat(auto-fill, minmax(9.25rem, 1fr)); }
    .mv { grid-template-columns: 1fr; }
  }






















































































/*POP-START*/
/* ポップ：丸い・ぷっくり・触ると弾む（値は document の --pop-* から引き継ぐ） */
.btn,
.chip,
.fchip,
.tab,
.more,
.rchip,
.empty button,
.kana button,
.updtools button,
dialog .row button,
.bb,
.sclear { border-radius: 999px; box-shadow: 0 3px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); transition: transform .22s var(--pop-ease, ease), box-shadow .22s var(--pop-ease, ease); }
.btn:hover:not(:disabled),
.chip:hover:not(:disabled),
.fchip:hover:not(:disabled),
.tab:hover:not(:disabled),
.more:hover:not(:disabled),
.rchip:hover:not(:disabled),
.empty button:hover:not(:disabled),
.kana button:hover:not(:disabled),
.updtools button:hover:not(:disabled),
dialog .row button:hover:not(:disabled),
.bb:hover:not(:disabled),
.sclear:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.btn:active:not(:disabled),
.chip:active:not(:disabled),
.fchip:active:not(:disabled),
.tab:active:not(:disabled),
.more:active:not(:disabled),
.rchip:active:not(:disabled),
.empty button:active:not(:disabled),
.kana button:active:not(:disabled),
.updtools button:active:not(:disabled),
dialog .row button:active:not(:disabled),
.bb:active:not(:disabled),
.sclear:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.combo, .ent, .fr, .notes, .legend, .upd, .empty, .empty-msg { border-radius: 22px; box-shadow: 0 4px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.recipe, .preview, .pal, .mv, .pc, .fact, .fl, .updv, .updv > summary, .gx .gpic { border-radius: 16px; }
.mvbar, .toast { border-radius: 22px; box-shadow: 0 4px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.dlg, dialog { border: 2px solid var(--pop-edge, var(--line)); border-radius: 28px; box-shadow: 0 8px 0 var(--pop-shadow, rgba(0, 0, 0, .5)), 0 30px 60px -10px rgba(0, 0, 0, .55); }
.search, select, .catsel, .filters select, .fld input[type="text"], .fld select, .nfp select { border-radius: 999px; }
.search { padding-left: 16px; }
.pal button { border-radius: 14px; }
.pal button.dshbtn, .pal button.tchbtn, .pal button.hbbtn, .pal button.torbtn, .pal button.kkbtn { border-radius: 999px; }
.fld textarea, textarea.memo, .iodlg textarea, .memo textarea { border-radius: 16px; }
input[type="checkbox"] { border-radius: 8px; }
.bd.n, .bd.w, .bd.g, .ab, .mv .gd, .meta .k, mark { border-radius: 8px; }
.grip, .ggrip { border-radius: 10px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } .btn:hover, .chip:hover, .fchip:hover, .tab:hover, .more:hover, .card:hover { transform: none !important; } }
/*POP-END*/
`;

  /* ---------- 確反データ（ネット上の確反集を、技データに照合したもの） ---------- */
  const NET = /*PNDATA-START*/{"jin": {"src": "td", "stand": [[10, 0, "LPRP", "順突き", "", 1, 0, ""], [10, 0, "RPRK", "正拳～上段後ろ回し蹴り", "", 11, 0, ""], [10, 0, "RPRK6", "正拳～上段後ろ回し蹴り～前心", "", 12, 0, ""], [10, 0, "RPLP", "逆突き", "", 8, 0, ""], [10, 0, "1LP", "シットジャブ", "", 51, 0, ""], [12, 0, "4LPRP", "蠢魔天", "", 61, 0, ""], [13, 0, "WP", "正中線乱れ突き", "", 20, 0, "", {"he": 1}], [13, 0, "3LPRK", "左中段直突き～上段回し蹴り", "", 32, 0, ""], [13, 0, "ヒート中WP6", "正中線乱れ突き(ヒートダッシュ)", "h", 162, 0, "", {"ov": "WP6(ヒート中)"}], [13, 1, "6n3RP", "最速右回し突き", "", 134, 0, "", {"ov": "6n3RP"}], [14, 0, "6WP", "正拳二段突き", "", 29, 0, ""], [14, 1, "6n23RP", "右回し突き", "", 132, 0, ""], [15, 0, "2WK", "飛び二段蹴り", "", 50, 0, ""], [15, 0, "9RK", "前蹴上げ", "", 74, 0, ""], [15, 0, "4RPLP", "蠢魔刹", "", 63, 0, ""], [15, 0, "ヒート中RP+LK", "雷紅暗拳殺", "h", 178, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [15, 0, "ヒート中RP+LKRK", "雷紅月冥殺", "h", 180, 0, ""], [16, 1, "66RP", "胴抜き", "", 80, 0, "", {"he": 1}], [16, 1, "ヒート中66RP6", "胴抜き(ヒートダッシュ)", "h", 168, 0, "", {"ov": "66RP6(ヒート中)"}], [16, 0, "6RK", "右中段前蹴り", "", 27, 0, ""], [16, 0, "6RK6", "右中段前蹴り～前心", "", 28, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ(しゃがみ中)", "c", 109, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RKRK", "二段十字脚", "w", 108, 0, ""], [13, 0, "LPRP", "鬼八門", "w", 95, 0, ""], [13, 0, "立ち途中LPLKRPLPRKRP", "風間流六連撃・改", "w", 102, 0, ""], [14, 0, "RP", "追い突き", "w", 105, 0, ""], [15, 0, "9RK", "前蹴上げ", "", 74, 0, ""], [15, 0, "ヒート中RP+LK", "雷紅暗拳殺", "h", 178, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [15, 0, "ヒート中RP+LKRK", "雷紅月冥殺", "h", 180, 0, ""], [16, 1, "66RP", "胴抜き", "", 80, 0, "", {"he": 1}], [16, 1, "ヒート中66RP6", "胴抜き(ヒートダッシュ)", "h", 168, 0, "", {"ov": "66RP6(ヒート中)"}]]}, "kazuya": {"src": "net", "stand": [[10, 0, "LPLPRP", "閃光烈拳", "", 2, 0, ""], [10, 0, "LPRPRP", "鬼哭連拳", "", 4, 0, ""], [10, 0, "ヒート中LPLPRP6", "デビルブレイク", "h", 126, 0, "", {"ov": "ヒート中LPLPRP6"}], [10, 0, "ヒート中LPLPRP2", "デビルインフェルノ", "h", 127, 0, "", {"ov": "ヒート中LPLPRP2"}], [10, 0, "2LP", "シットジャブ", "", 39, 0, ""], [11, 0, "4LPRP", "速疾號打", "", 52, 0, ""], [12, 0, "WP", "絶影拳", "", 16, 0, ""], [13, 0, "3RKRK", "踵切り", "", 35, 0, ""], [13, 0, "1LPRP", "轟墜拳", "", 47, 0, "", {"he": 1}], [13, 0, "1LPRP6～", "轟墜拳(ヒートダッシュ)", "h", 153, 0, "", {"ov": "1LPRP6(ヒート中)"}], [13, 1, "6n3RP", "最速風神拳", "", -1, 0, "", {"ov": "6n3RP", "sp": 126, "at": "上"}], [14, 1, "6n23RP", "風神拳", "", 117, 0, ""], [15, 0, "3LPRP", "六腑凶襲拳", "", 25, 0, "", {"he": 1}], [15, 0, "3LPRP6～", "六腑凶襲拳(ヒートダッシュ)", "h", 151, 0, "", {"ov": "3LPRP6(ヒート中)"}], [15, 0, "3LPRK", "六腑閃烈脚", "", 27, 0, ""], [17, 1, "66～RP", "デビルフィスト", "", 79, 0, "", {"he": 1}], [17, 1, "ヒート中66RP", "カオスインフェルノ", "h", 136, 0, "", {"ov": "ヒート中66RP"}], [17, 1, "66～RP6～", "カオスインフェルノ(ヒートダッシュ)", "h", 160, 0, "", {"ov": "66RP6(ヒート中)"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 39, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RKRK(立ち途中に)", "踵落とし", "w", 88, 0, ""], [13, 0, "LPRP(立ち途中に)", "ダブルアッパー", "w", 84, 0, ""], [16, 0, "RP(立ち途中に)", "魔神拳", "w", 85, 0, ""], [17, 1, "66～RP", "デビルフィスト", "", 79, 0, "", {"he": 1}], [17, 1, "ヒート中66RP", "カオスインフェルノ", "h", 136, 0, "", {"ov": "ヒート中66RP"}], [17, 1, "ヒート中66RP4", "デビルフィスト", "h", 137, 0, "", {"ov": "ヒート中66RP4"}], [17, 1, "ヒート中66RP6", "カオスインフェルノ(ヒートダッシュ)", "h", 160, 0, "", {"ov": "66RP6(ヒート中)"}]]}, "jun": {"src": "td", "stand": [[10, 0, "LPRPRP", "槍連舞～出雲開手", "", 4, 0, ""], [10, 0, "9LP", "神逐・天", "", 99, 0, ""], [10, 0, "2LP", "シットジャブ", "", 56, 0, ""], [12, 0, "RPLPRK", "白連突抜(3)", "", 9, 0, ""], [13, 0, "WP", "瞬剄", "", 17, 0, "", {"he": 1}], [13, 0, "4RKRP", "白拍子", "", 95, 0, ""], [13, 0, "ヒート中WP6", "瞬剄(ヒートダッシュ)", "h", 223, 0, "", {"ov": "WP6(ヒート中)"}], [13, 0, "ヒート中RP+LK", "黄泉津大弓", "h", 233, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [15, 0, "1LPLPWP", "蓬莱円舞", "", 66, 0, ""], [16, 0, "3RPWP", "天叢雲剣", "", 49, 0, ""], [16, 0, "3RP", "瑞穂", "", 48, 0, ""], [17, 0, "6RP", "鬼殺し", "", 29, 0, ""], [17, 0, "6RP(ヒット or ガード時)WP", "天羽々斬剣", "", 32, 0, "", {"he": 1}], [17, 0, "ヒート中6RP(ヒット or ガード時)WP", "天羽々斬剣(ヒート状態)", "h", 224, 0, ""], [17, 0, "ヒート中6RP(ヒット or ガード時)WP6", "天羽々斬剣(ヒートダッシュ)", "h", 225, 0, "", {"ov": "6RP(ヒット or ガード時)WP6(ヒート中)"}]], "crouch": [[10, 0, "3LP", "神逐・地", "c", 144, 0, ""], [10, 0, "しゃがみ中LP", "シットジャブ(しゃがみ中)", "c", 143, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "一鶴", "w", 139, 0, ""], [13, 0, "RPLP", "百花王", "w", 137, 0, ""], [13, 0, "ヒート中RP+LK", "黄泉津大弓", "h", 233, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [14, 0, "LK", "祇王", "w", 138, 0, ""], [16, 0, "9RKLK", "鳳仙花・禊", "", 106, 0, ""], [18, 0, "WK", "流し香月", "w", 142, 0, ""]]}, "paul": {"src": "td", "stand": [[10, 0, "LPRP", "ワンツーパンチ", "", 1, 0, ""], [10, 0, "RPLK", "掛け閂", "", 4, 0, ""], [10, 0, "1LP", "シットジャブ", "", 62, 0, ""], [12, 0, "4LPRP", "双凰", "", 68, 0, ""], [12, 0, "2WP", "鉄山靠", "", 61, 0, ""], [13, 0, "6RP", "鳳拳右虎脚", "", 18, 0, "", {"he": 1}], [13, 0, "6RP6(ヒート中)", "鳳拳右虎脚(ヒートダッシュ)", "h", 177, 0, ""], [14, 0, "4LK", "閂剪み", "", 73, 0, ""], [15, 0, "3RP", "紅", "", 37, 0, ""], [15, 0, "9LKRK", "双飛天脚(9LK)", "", 87, 0, ""], [15, 0, "9LK(or8LK)", "飛天脚(9LK)", "", 86, 0, ""], [15, 0, "9RK", "ライジングトゥーキック", "", 92, 0, ""], [15, 1, "236RP", "崩拳(クリーンヒット)", "", 150, 0, "", {"ov": "236RP"}], [15, 1, "ヒート中236RP6", "崩拳(ヒートダッシュ)", "h", 183, 0, "", {"ov": "236RP6(ヒート中)"}], [18, 0, "ヒート中RP+LK", "万聖真竜破", "h", 195, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 62, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "トゥースマッシュ", "w", 116, 0, ""], [13, 0, "LKRP", "獅鷹", "w", 115, 0, ""], [14, 0, "3RPLP", "疾風崩激(しゃがみ中)", "c", 118, 0, ""], [14, 0, "しゃがみ中3RPLP(ジャスト)", "万聖龍砲拳(しゃがみ中)", "c", 120, 0, ""], [14, 0, "しゃがみ中3RPWP(ヒート中)", "万聖霹靂掌(しゃがみ中)", "hc", 123, 0, ""], [15, 0, "RP", "震月", "w", 113, 0, ""], [15, 0, "9LK(or8LK)", "飛天脚(9LK)", "", 86, 0, ""], [15, 0, "9LKRK(or8LKRK)", "双飛天脚(9LK)", "", 87, 0, ""], [15, 0, "9RK", "ライジングトゥーキック", "", 92, 0, ""], [18, 0, "ヒート中RP+LK", "万聖真竜破", "h", 195, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "law": {"src": "td", "stand": [[10, 0, "LPLPRP", "バラージナックルコンボ", "", 4, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 6, 0, ""], [10, 0, "LPLPRP6", "バラージナックルコンボ～チャージドラゴン", "", 5, 0, ""], [10, 0, "1LP", "シットジャブ", "", 69, 0, ""], [12, 0, "LKRK", "ハイキックドラゴンソード", "", 26, 0, ""], [12, 0, "9LPLK(or8LP)", "目突き～スラストロー", "", 101, 0, ""], [13, 0, "3LPRP", "ブラストクロウ", "", 46, 0, ""], [14, 0, "WKRK", "ドラゴンワイルドライド", "", 36, 0, ""], [14, 0, "4RKLK", "タイガーファング", "", 96, 0, ""], [14, 0, "ヒート中RP+LK", "ヘヴンリードラゴン", "h", 215, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [15, 0, "3RP", "ドラゴンレイズ", "", 50, 0, ""], [15, 0, "9RK", "ドラゴンライジングキック", "", 112, 0, ""], [16, 0, "4RPRP", "ナックルラッシュ", "", 86, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 69, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "フロントキック", "w", 139, 0, ""], [13, 0, "LPRP", "フラッシュナックル", "w", 136, 0, ""], [14, 0, "ヒート中RP+LK", "ヘヴンリードラゴン", "h", 215, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [15, 0, "RP", "ドラゴンアッパーカット", "w", 137, 0, ""]]}, "king": {"src": "net", "stand": [[10, 0, "LPRP", "掌底", "", 1, 0, ""], [10, 0, "RPLP", "ライトストレート～レフトアッパー", "", 8, 0, ""], [10, 0, "2LP", "レフトストレート", "", 48, 0, ""], [12, 0, "4LPRP", "スプリントフック～クロスアッパー", "", 74, 0, ""], [14, 0, "3LPRP", "エルボーフック", "", 36, 0, ""], [14, 0, "4RPLP", "アメリカンジャブ～スピニングバックエルボー", "", 77, 0, ""], [15, 0, "6RPLP", "エルボーインパクト", "", 23, 0, "", {"he": 1}], [15, 0, "6RPLP6～(ヒート状態で)", "エルボーインパクト(ヒートダッシュ)", "h", 198, 0, "", {"ov": "6RPLP6(ヒート中)"}], [15, 0, "9RK(or8RK)", "ジャンピングニーリフト", "", 89, 0, ""], [16, 0, "4LKWP(正面地上ヒット時)", "ギロチンドロップ", "", 82, 0, "正面地上ヒット時"], [17, 0, "ヒート中RP+LK", "ウルティモ・ハグワール", "h", 215, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "レフトストレート", "c", 48, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にRK", "トゥースマッシュ", "w", 118, 0, ""], [12, 0, "(相手しゃがみ中に)接近して2LP+LK", "豪腕ラリアット", "", 255, 0, "相手しゃがみ中"], [12, 0, "(相手しゃがみ中に)接近して2RP+RK", "バイアグラドライバー", "", 256, 0, "相手しゃがみ中"], [12, 0, "(相手しゃがみ中に)接近して2LPRK", "フリーダム・フェイスバスター", "", 257, 0, "相手しゃがみ中", {"he": 1}], [14, 0, "立ち途中にRPRP", "ラウンドトリップチョップ～ジャガースプリント", "w", 115, 0, ""], [14, 0, "立ち途中RPRP(ヒット時)4", "ラウンドトリップチョップ～立ち状態", "w", 116, 0, ""], [15, 0, "9RK(or8RK)", "ジャンピングニーリフト", "", 89, 0, ""], [15, 0, "しゃがんだ状態で3RP", "ボディスマッシュ", "c", 124, 0, ""]]}, "lars": {"src": "net", "stand": [[10, 0, "LPRP", "ワンツーパンチ", "", 4, 0, ""], [10, 0, "RPLP", "リングカレント～ＬＥ", "", 8, 0, ""], [10, 0, "2LP", "シットジャブ", "", 44, 0, ""], [12, 0, "6RPRK", "デスマスク", "", 24, 0, ""], [13, 0, "3LPLP", "ライトニングバラージ(2)", "", 34, 0, ""], [13, 0, "6LPRK", "パワースラッグ", "", 32, 0, ""], [13, 0, "3LPLP2", "ライトニングバラージ(2)～DE", "", 35, 0, ""], [14, 0, "6n4RPLP", "ボルトライナー", "", 93, 0, ""], [15, 0, "6WP", "インラッシュカレント", "", 30, 0, ""], [16, 0, "9LK(or8LKor7LK)", "トリガードスクリュー", "", 78, 0, ""], [17, 0, "WK", "エレクトリックショット", "", 15, 0, "", {"he": 1}], [17, 0, "4LKRK", "インパルスプラス", "", 70, 0, ""], [17, 0, "ヒート中WK6", "エレクトリックショット(ヒートダッシュ)", "h", 163, 0, "", {"ov": "WK6(ヒート中)"}], [18, 0, "ヒート中RP+LK", "サンダーバード・ディセント", "h", 170, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 44, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にRK", "シェルスマッシュ", "w", 107, 0, ""], [13, 0, "立ち途中にRPLP", "マルチプライカッター", "w", 102, 0, ""], [13, 0, "立ち途中にRPLK", "グラスブレイカー", "w", 103, 0, ""], [13, 0, "立ち途中にRPLK2～", "グラスブレイカー～ＬＥ", "w", 104, 0, ""], [15, 0, "立ち途中にLP", "ストリーマー", "w", 97, 0, ""], [15, 0, "立ち途中LP(ヒット時)6", "ストリーマー～SE", "w", 98, 0, ""], [16, 0, "9LK(or8LKor7LK)", "トリガードスクリュー", "", 78, 0, ""], [18, 0, "ヒート中RP+LK", "サンダーバード・ディセント", "h", 170, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "xiaoyu": {"src": "td", "stand": [[10, 0, "LP2RP", "雀連砲～背向け", "", 3, 0, ""], [10, 0, "LPRP", "雀連手", "", 1, 0, ""], [10, 0, "LP2長入れRP", "雀連砲～正面", "", 5, 0, "", {"ov": "LP2長入れRP"}], [10, 0, "LP2RP4", "雀連砲～擺歩", "", 4, 0, ""], [12, 0, "6WP", "隠者出廬", "", 26, 0, ""], [13, 0, "4RKLP", "玉兎進掌", "", 61, 0, "", {"he": 1}], [13, 0, "4RKLP6(ヒート中)", "玉兎進掌(ヒートダッシュ)", "h", 244, 0, ""], [14, 0, "LK", "括面脚", "", 10, 0, ""], [14, 0, "3RPWP", "月亮焔凰靠", "", 35, 0, ""], [14, 0, "3RPLK", "月亮燕旋腿", "", 33, 0, ""], [15, 0, "4WP", "挑打連掌", "", 62, 0, ""], [15, 0, "ヒート中RP+LK", "神鳥流星撃", "h", 252, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [16, 0, "9LK(or8LK)", "月下兎軽", "", 68, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 112, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "蒼空砲", "w", 111, 0, ""], [12, 0, "LPRK", "旋風十字脚～背向け", "w", 102, 0, ""], [14, 0, "立ち途中WPWP", "双壁掌", "w", 98, 0, "", {"ov": "立ち途中WPWP"}], [15, 0, "ヒート中RP+LK", "神鳥流星撃", "h", 252, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [16, 0, "9LK", "月下兎軽", "", 68, 0, ""]]}, "jack8": {"src": "cu", "stand": [[10, 0, "6RP", "ピリオドシューター", "", 35, 0, ""], [10, 0, "2LP", "シットジャブ", "", 71, 0, ""], [10, 0, "ヒート中RP+LK", "メテオフォールレイド", "h", 271, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [11, 0, "RPLP", "ストレート～エルボー", "", 5, 0, ""], [11, 0, "RPLK", "ストレート～ニープッシュミメシス", "", 10, 0, ""], [12, 0, "LPLP", "ジャブ～スレッジハマー", "", 1, 0, ""], [12, 0, "LPLP2", "ジャブ～スレッジハマー～ガンマハウリング", "", 2, 0, ""], [12, 0, "(相手しゃがみ中)接近して2LP+LK", "ＧＵＮボム", "", 289, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK", "dm": "30"}], [12, 0, "(相手しゃがみ中)接近して2RP+RK", "アイアンガンマン", "", 291, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2RP+RK", "dm": "25", "he": 1}], [13, 0, "3WK", "タイタンダンプ", "", 64, 0, ""], [14, 0, "6LPLP", "インパクトドライバー", "", 30, 0, ""], [14, 0, "4WP", "デュアルピリオドシューター", "", 108, 0, "", {"he": 1}], [14, 0, "ヒート中4WP6", "デュアルピリオドシューター(ヒートダッシュ)", "h", 265, 0, "", {"ov": "4WP6(ヒート中)"}], [15, 0, "3RP", "オペレイトアッパー", "", 56, 0, ""], [15, 0, "3RPLP(ホールド)", "アストロスイーパー(最大ホールド)", "", 59, 0, ""]], "crouch": [[10, 0, "ヒート中RP+LK", "メテオフォールレイド", "h", 271, 0, "ヒートスマッシュ・上段なのでしゃがみに当たらない", {"ov": "ヒート中RP+LK"}], [11, 0, "立ち途中RK", "トゥースマッシュ", "w", 167, 0, ""], [12, 0, "しゃがみ中3RKRP", "スパイクプレスミメシス", "c", 194, 0, ""], [12, 0, "(相手しゃがみ中)接近して2LP+LK", "ＧＵＮボム", "", 289, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK", "dm": "30"}], [12, 0, "(相手しゃがみ中)接近して2RP+RK", "アイアンガンマン", "", 291, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2RP+RK", "dm": "25", "he": 1}], [14, 0, "立ち途中RPLP", "バンプストッパー", "w", 161, 0, ""], [14, 0, "立ち途中RPRK", "バンプフィニッシャー", "w", 162, 0, ""], [15, 0, "立ち途中LP", "バイオレンスアッパー", "w", 159, 0, ""]]}, "nina": {"src": "td", "stand": [[10, 0, "LPRK", "PKコンボ", "", 8, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 1, 0, ""], [10, 0, "LPRP2(or8)", "ワンツーパンチ～横移動", "", 2, 0, ""], [10, 0, "2LP(or1LP)", "シットジャブ", "", 75, 0, ""], [11, 0, "1WP", "残響掌破", "", 92, 0, "", {"he": 1}], [11, 0, "1WP6(ヒート中)", "残響掌破(ヒートダッシュ)", "h", 213, 0, ""], [12, 0, "4LPRK", "ネックカッター＆グラスジョー", "", 95, 0, ""], [13, 0, "3LPRP", "アッパーストレート", "", 52, 0, ""], [13, 0, "3LPRP2(or8)", "アッパーストレート～横移動", "", 54, 0, ""], [13, 0, "3LPRP6", "アッパーストレート～掌握ステップ", "", 53, 0, ""], [14, 0, "6WKLP", "迅脚掌破", "", 48, 0, "", {"he": 1}], [14, 0, "4WKWP", "ミッシングエッジ～キスショット", "", 107, 0, ""], [14, 0, "6LK", "レプラホーンキック", "", 39, 0, ""], [14, 0, "4WKWP(ヒート中)", "ミッシングエッジ～キスショット(ヒート状態)", "h", 108, 0, ""], [14, 0, "6WKLP6(ヒート中)", "迅脚掌破(ヒートダッシュ)", "h", 211, 0, ""], [15, 0, "3RP", "サイレントアッパー", "", 56, 0, ""], [15, 0, "4LPRK", "リバースアイボリーカッター", "", 109, 0, ""], [16, 0, "ヒート中RP+LK", "バレット・アサシネーション", "h", 218, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [18, 0, "1WK", "ディバインキャノン", "", 93, 0, ""], [18, 0, "9RPLP(or8RPor7RP)", "ステープラーウィップ", "", 113, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 75, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "トゥースマッシュ", "w", 153, 0, ""], [13, 0, "LPWP", "フラッピングキスショット", "w", 149, 0, ""], [13, 0, "立ち途中LK", "スパイダーニー～腕挫腹固め", "w", 152, 0, ""], [13, 0, "立ち途中LPWP(ヒート中)", "フラッピングキスショット(ヒート状態)", "hw", 150, 0, ""], [14, 0, "しゃがみ中3RP", "サイレントアッパー", "c", 56, 0, "", {"ov": "しゃがみ中3RP"}], [15, 0, "RP", "パームアッパー", "w", 151, 0, ""], [16, 0, "ヒート中RP+LK", "バレット・アサシネーション", "h", 218, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [18, 0, "9RPLP(or8RPor7RP)", "ステープラーウィップ", "", 113, 0, ""], [18, 0, "1WK", "ディバインキャノン", "w", 93, 0, "", {"ov": "立ち途中WK"}]]}, "asuka": {"src": "net", "stand": [[10, 0, "LPRP", "槍連勁", "", 7, 0, ""], [10, 0, "LPLK", "翠連下蹴り", "", 12, 0, ""], [10, 0, "2LP", "シットジャブ", "", 58, 0, ""], [11, 0, "RK", "ハイキック", "", 22, 0, ""], [12, 0, "RPLK", "水芭蕉", "", 19, 0, ""], [12, 0, "3RK", "フロントキック", "", 55, 0, ""], [14, 0, "1LPRP", "巡り飛燕", "", 67, 0, "", {"he": 1}], [14, 0, "1LPRK", "巡り雨燕", "", 68, 0, ""], [14, 0, "9RP(or8RPor7RP)", "蘭月", "", 102, 0, ""], [14, 0, "LKLP", "百日紅", "", 21, 0, ""], [15, 0, "6WP", "禊ぎ祓い", "", 45, 0, ""], [15, 0, "3RP", "昇打(相手立ち状態)", "", 52, 0, ""], [16, 0, "WP", "圧勁", "", 25, 0, ""], [16, 0, "4LK", "竜車蹴り", "", 83, 0, ""], [16, 0, "ヒート中RP+LK", "瑞雲三相蹴り", "h", 181, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [17, 0, "6RP", "鬼殺し", "", 36, 0, ""], [17, 0, "6RP(ヒット時)LP", "鬼殺し～浪花の気焔", "", 38, 0, "ヒット時"]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 58, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "(立ち途中に)RK", "トゥースマッシュ", "w", 131, 0, ""], [13, 0, "(立ち途中に)RPLP", "１０連コンボ2発目", "w", 128, 0, ""], [13, 0, "(立ち途中に)RPWP", "琥珀～引き手入道", "w", 129, 0, ""], [14, 0, "(立ち途中に)LPRK", "紫勁腿", "w", 126, 0, ""], [14, 0, "9RP(or8RPor7RP)", "蘭月", "", 102, 0, ""], [16, 0, "ヒート中RP+LK", "瑞雲三相蹴り", "h", 181, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [18, 0, "(立ち途中に)LK", "香月", "w", 130, 0, ""]]}, "leroy": {"src": "td", "stand": [[10, 0, "LPRPRK", "正掌弾腿～独歩", "", 8, 0, ""], [10, 0, "2LP", "シットジャブ", "", 49, 0, ""], [12, 0, "RPRP", "直拳尖肘", "", 10, 0, ""], [12, 0, "4WP(ヒート中)", "義絶黒龍勁", "h", 78, 0, ""], [13, 0, "3LPRK", "短打弾腿～独歩", "", 37, 0, ""], [14, 0, "9WKWP", "空歩龍牙掌", "", 91, 0, ""], [14, 0, "WPWPLP", "連環拳・剛", "", 21, 0, "", {"he": 1}], [14, 0, "WPWPLP6(ヒート中)", "連環拳・剛(ヒートダッシュ)", "h", 164, 0, "", {"ov": "WPWPLP6(ヒート中)"}], [15, 0, "3RPWP", "双龍天昇", "", 42, 0, ""], [15, 0, "ヒート中RP+LK", "双竜仙雷霆撃", "h", 175, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 49, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "トゥースマッシュ", "w", 107, 0, ""], [13, 0, "LPRK", "斬肘弾腿～独歩", "w", 105, 0, ""], [14, 0, "9WKWP", "空歩龍牙掌", "", 91, 0, ""], [15, 0, "RP", "連環寸勁", "w", 106, 0, ""], [15, 0, "ヒート中RP+LK", "双竜仙雷霆撃", "h", 175, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "lili": {"src": "td", "stand": [[10, 0, "LPRP", "ワンツースラスト", "", 3, 0, ""], [10, 0, "LPLP", "トリコロール(2)～背向け", "", 1, 0, ""], [10, 0, "RPRK", "アーチキックコンボ", "", 9, 0, ""], [10, 0, "1LP", "シットジャブ", "", 60, 0, ""], [12, 0, "6RPLK", "マルスソード", "", 24, 0, ""], [12, 0, "WP", "トライアングルスプレッド", "", 17, 0, ""], [13, 0, "3RKRK", "シャットアップスタンプ", "", 40, 0, ""], [13, 0, "3RKRK4", "シャットアップスタンプ～背向け", "", 41, 0, "", {"ov": "3RKRK4"}], [15, 0, "LKLP", "ピーコックワルツ", "", 12, 0, "", {"he": 1}], [15, 0, "9LK", "カプリコーンキック", "", 80, 0, ""], [15, 0, "LKLP6(ヒート中)", "ピーコックワルツ(ヒートダッシュ)", "h", 178, 0, ""], [16, 0, "ヒート中RP+LK", "ロズィエ・ミレナーレmf", "h", 187, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 60, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "ケーンスマッシュ", "w", 121, 0, ""], [13, 0, "LPRP", "サレンデイジー(2)", "w", 113, 0, ""], [13, 0, "立ち途中LPRP6", "サレンデイジー(2)～パラードステップ", "w", 114, 0, ""], [14, 0, "3LP", "スラッシュヴァイン", "c", 122, 0, ""], [15, 0, "LK", "ハニーサックル(1)", "w", 118, 0, ""], [15, 0, "9LK", "カプリコーンキック", "", 80, 0, ""], [16, 0, "RP", "ライジングタクト", "w", 116, 0, ""], [16, 0, "ヒート中RP+LK", "ロズィエ・ミレナーレmf", "h", 187, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "hwoarang": {"src": "net", "stand": [[10, 0, "LPLP", "ダブルジャブ", "", 1, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 4, 0, ""], [10, 0, "LPRPLK", "ワンツーレフトフラミンゴ", "", 5, 0, ""], [10, 0, "LPRPRK", "ワンツーライトフラミンゴ", "", 6, 0, ""], [10, 0, "2LP", "シットジャブ", "", 53, 0, ""], [11, 0, "RKLK", "RLキック", "", 26, 0, ""], [13, 0, "3LPLK", "レフトアッパー＆ミドルキック～ＬＦ", "", 42, 0, ""], [13, 0, "3WK", "イグニッションバラージ", "", 52, 0, "", {"he": 1}], [13, 0, "ヒート状態で3WK6～", "イグニッションバラージ(ヒートダッシュ)", "h", 231, 0, "", {"ov": "3WK6(ヒート中)"}], [14, 0, "9WKRK", "フラッシングトライデント～右構え", "", 82, 0, ""], [15, 0, "3RP", "ライトアッパー", "", 43, 0, ""], [16, 0, "4LK", "レフトプラズマブレード", "", 66, 0, ""], [17, 0, "ヒート中RP+LK", "トリニティクレイモア", "h", 245, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 53, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にRKRK", "踵落とし～右構え", "w", 101, 0, ""], [12, 0, "立ち途中LPRK", "ツインマスタング～RF", "w", 95, 0, ""], [14, 0, "9WKRK", "フラッシングトライデント～右構え", "", 82, 0, ""], [14, 0, "立ち途中にLK", "バーストヒール", "w", 99, 0, ""], [15, 0, "立ち途中にRPLK", "クラッディングスピン～ＬＦ", "w", 97, 0, ""], [17, 0, "ヒート中RP+LK", "トリニティクレイモア", "h", 245, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "bryan": {"src": "td", "stand": [[10, 0, "LPRK", "スネークコンビネーション(2)", "", 7, 0, ""], [10, 0, "RPLK", "PKコンビネーション", "", 18, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 2, 0, ""], [10, 0, "2LP", "シットジャブ", "", 61, 0, ""], [12, 0, "RKLP", "スナイパーチェーン", "", 28, 0, ""], [13, 0, "9RPRPRPLK", "ゴアパラベラム", "", 108, 0, ""], [13, 0, "3RPLP", "ブラックアウトコンビネーション", "", 56, 0, ""], [13, 0, "スネークアイ保有時9RPRPRPRPRPLK", "ネオゴアパラベラム(スネークアイ)", "s", 170, 0, "", {"ov": "スネークアイ保有時9RPRPRPRPRPLK"}], [14, 1, "6n4RP", "ジェットアッパー", "", 126, 0, ""], [15, 0, "6RPLPRK", "ストマックコンビネーション", "", 43, 0, ""], [15, 1, "66RP", "マッハパンチ", "", 119, 0, "", {"he": 1}], [15, 0, "6RPLPRK(ヒット時)WP", "ストマックコンビネーション～スネークアイ", "", 44, 0, ""], [15, 1, "ヒート中66RP6", "マッハパンチ(ヒートダッシュ)", "h", 201, 0, "", {"ov": "66RP6(ヒート中)"}], [16, 0, "ヒート中RP+LK", "ノートリアスモンスター", "h", 207, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 61, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "トゥースマッシュ", "w", 136, 0, ""], [12, 0, "LK", "ニークラッシュ", "w", 134, 0, ""], [13, 0, "3RPLP", "スネークランページ", "c", 139, 0, ""], [13, 0, "9RPRPRPLK", "ゴアパラベラム", "", 108, 0, ""], [13, 0, "スネークアイ保有時9RPRPRPRPRPLK", "ネオゴアパラベラム(スネークアイ)", "s", 170, 0, "", {"ov": "スネークアイ保有時9RPRPRPRPRPLK"}], [15, 0, "LP", "リフトアッパー", "w", 131, 0, ""], [15, 0, "6RPLPRK(ヒット時)WP", "ストマックコンビネーション～スネークアイ", "", 44, 0, ""], [15, 1, "ヒート中66RP6", "マッハパンチ(ヒートダッシュ)", "h", 201, 0, "", {"ov": "66RP6(ヒート中)"}], [16, 0, "ヒート中RP+LK", "ノートリアスモンスター", "h", 207, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [19, 0, "RP", "アトミックブロー", "w", 132, 0, ""]]}, "claudio": {"src": "td", "stand": [[10, 0, "LPRP", "アッシュワイプ", "", 1, 0, ""], [10, 0, "1LP", "シットジャブ", "", 46, 0, ""], [12, 0, "6RPRP", "シンクライシス～SB", "", 23, 0, ""], [13, 0, "2WP", "スペルビア", "", 45, 0, ""], [14, 0, "LKRP", "レクイエスカット～SB", "", 10, 0, "", {"he": 1}], [14, 0, "ヒート中LKRP6", "レクイエスカット(ヒートダッシュ)", "h", 137, 0, "", {"ov": "LKRP6(ヒート中)"}], [15, 0, "9RK", "スカイエンドノヴァ", "", 80, 0, ""], [15, 0, "3LPRP", "スカイアーク", "", 32, 0, ""], [16, 0, "6WPWP", "クロスグレイヴ", "", 28, 0, ""], [16, 0, "スターバースト状態で6WPWP", "クロスグレイヴ・バースト(スターバースト状態)", "s", 126, 0, ""], [17, 0, "4RKRP", "シャイニングレイ～SB", "", 61, 0, "", {"he": 1}], [17, 0, "ヒート中4RKRP6", "シャイニングレイ(ヒートダッシュ)", "h", 138, 0, "", {"ov": "4RKRP6(ヒート中)"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 46, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "ホーリースマッシュ", "w", 108, 0, ""], [12, 0, "LPLP", "ディグニティショック～SB", "w", 101, 0, ""], [12, 0, "立ち途中LPRP", "マレフィックドロー", "w", 103, 0, ""], [12, 0, "スターバースト状態で立ち途中LPRP", "マレフィックドロー・バースト(スターバースト状態)", "ws", 134, 0, ""], [14, 0, "3RPWP", "ファイナルジャッジ～SB(しゃがみ中)", "c", 111, 0, ""], [15, 0, "RP", "シルヴィア～SB", "w", 105, 0, ""], [15, 0, "9RK", "スカイエンドノヴァ", "", 80, 0, ""]]}, "azucena": {"src": "td", "stand": [[10, 0, "LPRP", "ハイローストコンボ", "", 3, 0, ""], [10, 0, "LPLP", "ハイマウンテンコンボ～リベルタドール", "", 2, 0, ""], [10, 0, "1LP", "シットジャブ", "", 53, 0, ""], [10, 0, "LPRP4", "ハイローストコンボ～背向け", "", 4, 0, ""], [12, 0, "RKLP", "グアパプーノ～背向け", "", 15, 0, ""], [12, 0, "接近して(相手しゃがみ中)2LP+LK", "グッドルッキングガール", "", 186, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"dm": "35", "ov": "2LP+LK or 2RP+RK", "he": 1}], [13, 0, "3LPRK", "グランデコンボ(2)", "", 34, 0, ""], [14, 0, "LKLK", "グルーヴィープニャラーダ", "", 13, 0, "", {"he": 1}], [14, 0, "ヒート中LKLK6", "グルーヴィープニャラーダ(ヒートダッシュ)", "h", 160, 0, "", {"ov": "LKLK6(ヒート中)"}], [15, 0, "3RP", "マウントレーニア", "", 39, 0, ""], [15, 0, "ヒート中RP+LK", "アズセナスペシャルティ", "h", 173, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 53, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RKLP", "コンボ・デ・カントゥータ(2)", "w", 89, 0, ""], [12, 0, "接近して(相手しゃがみ中)2LP+LK", "グッドルッキングガール", "", 186, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"dm": "35", "ov": "2LP+LK or 2RP+RK", "he": 1}], [13, 0, "LP", "ゴールデンマウンテンフィスト", "w", 85, 0, ""], [15, 0, "RP", "レインボーマウンテンスイング", "w", 86, 0, ""], [15, 0, "ヒート中RP+LK", "アズセナスペシャルティ", "h", 173, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "raven": {"src": "td", "stand": [[10, 0, "RPRK", "PKコンボ～立ち状態", "", 6, 0, ""], [10, 0, "LPRPWK", "ワンツーパンチ～ソウルフィールド", "", 3, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 1, 0, ""], [10, 0, "RPRKヒット時6", "PKコンボ～スプリントミラージュ", "", 7, 0, ""], [10, 0, "RPRKヒット時2", "PKコンボ～しゃがみ", "", 8, 0, ""], [10, 0, "RPRKヒット時4", "PKコンボ～背向け", "", 9, 0, ""], [10, 0, "2LP(or1LP)", "シットジャブ", "", 49, 0, ""], [12, 0, "RKLP", "ブロッケンコネクト～背向け", "", 15, 0, ""], [13, 0, "1RPLP", "アサシンスティング", "", 54, 0, ""], [13, 0, "1RPLP2", "アサシンスティング～ソウルフィールド", "", 55, 0, "", {"ov": "1RPLP2"}], [14, 0, "WP", "クルセイダー", "", 25, 0, "", {"he": 1}], [14, 0, "4RKRK", "スカルクラッシュ～背向け", "", 70, 0, ""], [14, 0, "3LPヒットorガード時RK", "ダガーブロー～ファントムメイス", "", 37, 0, ""], [14, 0, "3LPヒットorガード時RK(ヒート中)", "ダガーブロー～ファントムメイス(ヒート状態)", "h", 38, 0, ""], [14, 0, "WP6(ヒート中)", "クルセイダー(ヒートダッシュ)", "h", 209, 0, ""], [15, 0, "6RK", "ランスキック", "", 33, 0, ""], [15, 0, "6RPLK", "タルタロス", "", 28, 0, ""], [15, 0, "3RKRKLK", "ギロチンジャック", "", 46, 0, ""], [16, 0, "3RP", "ディカステス･サイス(1)～背向け", "", 39, 0, ""], [18, 0, "ヒート中RP+LK", "パンデモニウム", "h", 218, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 49, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "マインゴーシュ", "w", 111, 0, ""], [13, 0, "立ち途中RP", "ジャックナイフエルボー", "w", 107, 0, ""], [14, 0, "LP", "ボディスラッシュ", "w", 106, 0, ""], [18, 0, "ヒート中RP+LK", "パンデモニウム", "h", 218, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "yoshimitsu": {"src": "net", "stand": [[6, 0, "LP+RK", "吉光ブレード", "", 32, 0, ""], [8, 0, "LP+RK(ヒート状態で)", "吉光ブレード(ヒート状態)", "h", 33, 0, ""], [8, 0, "LP+RK(無刀ノ極中に)", "吉光ブレード(強化)", "s", 343, 0, "無刀ノ極中に"], [10, 0, "LPLP", "殴り兜割り", "", 1, 0, ""], [10, 0, "LPLP(ヒート状態で)", "殴り兜割り(ヒート状態)", "h", 2, 0, ""], [10, 0, "LPLP(無刀ノ極中に)", "殴り兜割り(強化)", "s", 332, 0, "無刀ノ極中に"], [10, 0, "無刀ノ極中1LP", "卍舎ヶ判", "s", 357, 0, ""], [11, 0, "RPRP", "蝕喰～無刀ノ極", "", 7, 0, ""], [11, 0, "RPRPWP", "蝕喰～金打", "", 8, 0, ""], [11, 0, "RPLP(無刀ノ極中に)", "唐繰渦巻", "s", 335, 0, "無刀ノ極中に"], [12, 0, "3RK", "ミドルキック", "", 67, 0, ""], [13, 0, "3LPRK", "紅葉蹴り", "", 60, 0, ""], [14, 0, "4RPRP", "逢魔釘打ち", "", 133, 0, "", {"he": 1}], [14, 0, "4RPRP6～(ヒート状態で)", "逢魔釘打ち(ヒートダッシュ)", "h", 409, 0, ""], [14, 0, "4RPRP(無刀ノ極中に)", "逢魔釘打ち", "s", 133, 0, "無刀ノ極中に", {"ov": "無刀ノ極中4RPRP", "he": 1}], [14, 0, "4RPRP6～(ヒート状態で)(無刀ノ極中に)", "逢魔釘打ち(納刀)(ヒートダッシュ)", "hs", 412, 0, "無刀ノ極中に"], [15, 0, "3RP", "ステップインアッパー", "", 61, 0, ""], [15, 0, "9LK", "隼", "", 144, 0, ""], [15, 0, "無刀ノ極中9LK", "隼", "s", 144, 0, "", {"ov": "無刀ノ極中9LK"}], [15, 0, "無刀ノ極中3RP", "ステップインアッパー", "s", 61, 0, "", {"ov": "無刀ノ極中3RP"}], [17, 1, "623LP", "外法閃", "", 190, 0, ""], [18, 0, "ヒート中RP+LK", "神剣暴れ景清", "h", 420, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[6, 0, "LP+RK(立ち途中に)", "吉光ブレード", "w", 32, 0, "", {"ov": "立ち途中LP+RK"}], [6, 0, "2LP+RK(しゃがんだ状態で)", "吉光ブレード", "c", 32, 0, "", {"ov": "しゃがみ中LP+RK"}], [8, 0, "LP+RK(ヒート状態で)(立ち途中に)", "吉光ブレード(ヒート状態)", "hw", 33, 0, "", {"ov": "ヒート中立ち途中LP+RK"}], [8, 0, "2LP+RK(ヒート状態で)(しゃがんだ状態で)", "吉光ブレード(ヒート状態)", "hc", 33, 0, "", {"ov": "ヒート中しゃがみ中LP+RK"}], [8, 0, "LP+RK(無刀ノ極中に)(立ち途中に)", "吉光ブレード(強化)", "ws", 343, 0, "無刀ノ極中に", {"ov": "無刀ノ極中立ち途中LP+RK"}], [8, 0, "2LP+RK(無刀ノ極中に)(しゃがんだ状態で)", "吉光ブレード(強化)", "cs", -1, 0, "無刀ノ極中に", {"sp": 363, "at": "中(回復)", "ov": "無刀ノ極中しゃがみ中LP+RK"}], [10, 0, "しゃがみ中LP", "シットジャブ", "c", 213, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK(立ち途中に)", "祷葬痲呪", "w", 208, 0, ""], [11, 0, "RKWP(立ち途中に)", "祷葬痲呪～金打", "w", 209, 0, ""], [11, 0, "RK4～(立ち途中に)", "祷葬痲呪～無刀ノ極", "w", 210, 0, ""], [13, 0, "立ち途中LPRP", "紫電", "w", 201, 0, ""], [15, 0, "9LK", "隼", "", 144, 0, ""], [15, 0, "RPLP(立ち途中に)", "睨ぎ白道～卍蜻蛉", "w", 205, 0, ""], [17, 1, "623LP", "外法閃", "", 190, 0, ""], [18, 0, "ヒート中RP+LK", "神剣暴れ景清", "h", 420, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "steve": {"src": "net", "part": "crouch", "stand": [[10, 0, "LPLPRP", "ライトニングコンビネーション", "", 9, 0, ""], [10, 0, "LPRP", "ワンツー", "", 13, 0, ""], [10, 0, "LPLPRP6LK(or6RK)", "ライトニングコンビネーション～ダッキング", "", 10, 0, ""], [10, 0, "LPLPRPLK(orRK)", "ライトニングコンビネーション～ウィービング", "", 12, 0, ""], [10, 0, "LPLPRP4LK(or4RK)", "ライトニングコンビネーション～スウェー", "", 11, 0, ""], [10, 0, "1LP", "シットジャブ", "", 78, 0, ""], [12, 0, "RPLP6～", "ストレート～ボディ～ピーカブースタイル", "", 30, 0, ""], [12, 0, "RPLP4～", "ストレート～ボディ～フリッカー構え", "", 31, 0, ""], [12, 0, "RPRP", "クロムウェルコンビネーション", "", 33, 0, ""], [13, 0, "3LPRP", "アッパーストレート", "", 55, 0, ""], [13, 0, "4LPRP", "クイックドロー～ライオンハート", "", 87, 0, ""], [14, 0, "WP", "ソニックファング", "", 37, 0, "", {"he": 1}], [14, 0, "WP6～(ヒート状態で)", "ソニックファング(ヒートダッシュ)", "h", 253, 0, "", {"ov": "WP6(ヒート中)"}], [15, 0, "6WPRP", "ショットガンコンビネーション", "", 49, 0, ""], [15, 1, "66～RP", "ドラゴニックハンマー", "", 111, 0, ""], [16, 0, "1LKRP", "ダーティースマッシュ～ライオンハート", "", 81, 0, ""], [16, 0, "1LKRP4～", "ダーティースマッシュ～立ち状態", "", 82, 0, ""], [16, 0, "ヒート中RP+LK", "ブレトワルダ", "h", 264, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [17, 0, "8RP", "ドレッドノートアッパー", "", 101, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 78, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にLPLP", "イーグルスピア", "w", 122, 0, ""], [11, 0, "LPRP", "イーグルクロウ", "w", 126, 1, ""], [11, 0, "立ち途中LPLP6LK(or6RK)", "イーグルスピア～ダッキング", "w", 123, 0, ""], [11, 0, "立ち途中LPLP4LK(or4RK)", "イーグルスピア～スウェー", "w", 124, 0, ""], [11, 0, "立ち途中LPLPLK(orRK)", "イーグルスピア～ウィービング", "w", 125, 0, ""], [13, 0, "RPRP", "ナイトホークコンビネーション～ライオンハート", "w", 131, 1, ""], [13, 0, "立ち途中RPRP4", "ナイトホークコンビネーション～立ち状態", "w", 132, 0, ""], [14, 0, "WP", "ソニックファング", "w", 37, 1, "", {"ov": "立ち途中WP", "he": 1}], [14, 0, "WP6(or立ち途中WP6)(ヒート中)", "ソニックファング(ヒートダッシュ)", "hw", 253, 0, "", {"ov": "立ち途中WP6(ヒート中)"}], [16, 0, "3RP", "フィニッシュブロー", "c", 134, 1, ""], [16, 0, "ヒート中RP+LK", "ブレトワルダ", "h", 264, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "dragunov": {"src": "td", "stand": [[10, 0, "RPLP", "ワンツー", "", 12, 0, ""], [10, 0, "LPLK", "ロシアンフックラッシュ(2)", "", 6, 0, ""], [10, 0, "RPLP3", "ワンツー～スニーク", "", 16, 0, ""], [10, 0, "1LP", "シットジャブ", "", 64, 0, ""], [12, 0, "RKLP", "ストレートキック･ヘッドハンター", "", 23, 0, ""], [12, 0, "2LP+LK or 2RP+RK", "ニーストローク", "", 205, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK or 2RP+RK", "dm": "35"}], [14, 0, "4RKLK", "トスアップスラッシュ", "", 93, 0, "", {"he": 1}], [14, 0, "6RKLK", "コンビネーション・ホーク", "", 38, 0, ""], [14, 0, "9LP", "スマッシュサミング", "", 99, 0, ""], [14, 0, "ヒート中4RKLK6", "トスアップスラッシュ(ヒートダッシュ)", "h", 186, 0, "", {"ov": "4RKLK6(ヒート中)"}], [15, 0, "3RP", "サイドロックアッパー", "", 48, 0, ""], [15, 0, "ヒート中RP+LK", "ロシアンフック・エクストリーム", "h", 191, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [16, 0, "6WP", "スキャバード", "", 42, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 64, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "ジェリドスマッシュ", "w", 132, 0, ""], [12, 0, "WP", "フロストチャージ", "w", 134, 0, "", {"he": 1}], [12, 0, "LPLK", "ダブルヒルト", "w", 129, 0, ""], [12, 0, "LPRP", "キリオン", "w", 128, 0, ""], [12, 0, "立ち途中WP6", "フロストチャージ", "w", 134, 0, "", {"ov": "立ち途中WP6"}], [12, 0, "2LP+LK or 2RP+RK", "ニーストローク", "", 205, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK or 2RP+RK", "dm": "35"}], [12, 0, "ヒート中立ち途中WP6", "フロストチャージ(ヒートダッシュ)", "hw", 188, 0, "", {"ov": "立ち途中WP6(ヒート中)"}], [14, 0, "9LP", "スマッシュサミング", "", 99, 0, ""], [15, 0, "RP", "プロトンアッパー", "w", 130, 0, ""], [15, 0, "ヒート中RP+LK", "ロシアンフック・エクストリーム", "h", 191, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "leo": {"src": "td", "stand": [[10, 0, "LPRK", "連弾金鶏独立", "", 7, 0, ""], [10, 0, "LPRP", "合子手", "", 1, 0, ""], [10, 0, "1LP", "シットジャブ", "", 47, 0, ""], [11, 0, "RPRP", "降龍式鈴肘", "", 10, 0, ""], [13, 0, "9LPRP", "穿冲拳", "", 93, 0, ""], [14, 0, "4RPWP", "二郎担山", "", 71, 0, "", {"he": 1}], [14, 0, "6RPRP", "横打二郎担山", "", 21, 0, ""], [14, 0, "6RPRK", "横打擺腿", "", 22, 0, ""], [14, 0, "6RPRK3", "横打擺腿～進歩", "", 23, 0, ""], [14, 0, "ヒート中4RPWP6", "二郎担山(ヒートダッシュ)", "h", 194, 0, "", {"ov": "4RPWP6(ヒート中)"}], [15, 0, "3RP", "昇砲", "", 34, 0, ""], [15, 0, "9RK", "躍歩三浄提", "", 103, 0, ""], [15, 1, "66RP", "上歩撞拳", "", 107, 0, ""], [16, 0, "1RPRK", "背斬巻龍脚", "", 50, 0, "", {"he": 1}], [16, 0, "ヒート中RP+LK", "絶腿風火輪", "h", 203, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 47, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RKWP", "登脚背折靠", "w", 127, 0, "", {"he": 1}], [11, 0, "ヒート中立ち途中RKWP6", "登脚背折靠(ヒートダッシュ)", "hw", 196, 0, "", {"ov": "立ち途中RKWP6(ヒート中)"}], [13, 0, "WP", "肋胯靠", "w", 128, 0, ""], [13, 0, "立ち途中LKLP", "両儀ニ推", "w", 122, 0, ""], [13, 0, "立ち途中LKLP2", "両儀ニ推～仆歩", "w", 123, 0, ""], [13, 0, "9LPRP", "穿冲拳", "", 93, 0, ""], [15, 0, "RP", "上歩掛山", "w", 120, 0, ""], [15, 0, "9RK(or8RK)", "躍歩三浄提", "", 103, 0, ""], [15, 1, "66RP", "上歩撞拳", "", 107, 0, ""], [16, 0, "ヒート中RP+LK", "絶腿風火輪", "h", 203, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "shaheen": {"src": "td", "stand": [[10, 0, "RPLK", "ポリマ・ブラインディングサンド", "", 9, 0, ""], [10, 0, "LPRP", "スピカ", "", 1, 0, ""], [10, 0, "RPLK3", "ポリマ・ブラインディングサンド～スネークイン", "", 10, 0, ""], [10, 0, "1LP", "シットジャブ", "", 44, 0, ""], [12, 0, "6RPLK", "サイレントスティング", "", 19, 0, ""], [13, 0, "64RP", "ホーネット(ヒート状態)", "h", 73, 0, ""], [13, 0, "64RP(ジャスト)", "ホーネット(青)", "", 74, 0, "", {"ov": "64RP(ジャスト)"}], [13, 0, "RKLP", "ハルクスキック･アルゲニブ", "", 14, 0, ""], [14, 0, "1RPLP", "ラピッドバッシュ", "", 48, 0, "", {"he": 1}], [14, 0, "64RP", "ホーネット", "", 72, 0, ""], [14, 0, "1RPLP6(ヒート中)", "ラピッドバッシュ(ヒートダッシュ)", "h", 120, 0, ""], [15, 0, "9RK", "アルタイル", "", 68, 0, ""], [15, 0, "3RP", "ライジングファルコン", "", 30, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 44, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "ジョースマッシュ", "w", 83, 0, ""], [13, 0, "LKLK", "ダブルスコーピオン", "w", 82, 0, ""], [15, 0, "9RK", "アルタイル", "", 68, 0, ""], [16, 0, "RP", "ホークエッジ", "w", 79, 0, ""]]}, "kuma": {"src": "net", "stand": [[10, 0, "RPLP", "ストレート～エルボー", "", 5, 0, ""], [10, 0, "2LP", "シットジャブ", "", 29, 0, ""], [12, 0, "6RPLP", "ワイルドランバージャック", "", 14, 0, ""], [12, 0, "3RK", "フロントキック", "", 28, 0, ""], [13, 0, "WP", "熊剛掌破", "", 11, 0, "", {"he": 1}], [13, 0, "ヒート状態でWP6～", "熊剛掌破(ヒートダッシュ)", "h", 190, 0, "", {"ov": "WP6(ヒート中)"}], [13, 0, "ヒート中RP+LK", "サーモン一本釣り打法", "h", 209, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [14, 0, "2WP", "熊鉄山靠", "", 34, 0, ""], [14, 0, "1LPRP", "ダブルワイルドビンタ", "", 37, 0, ""], [14, 0, "1LPRP2～(orWK)", "ダブルワイルドビンタ～ハンティングスタイル", "", 38, 0, ""], [15, 0, "3RPLP", "熊武爪", "", 25, 0, ""], [15, 0, "ヒート状態で3RP+LK", "熊風神拳", "h", 204, 0, ""], [16, 0, "9LK", "熊三宝龍(1)", "", 74, 0, ""]], "crouch": [[11, 0, "立ち途中にRK", "ポースマッシュ", "w", 108, 0, ""], [13, 0, "立ち途中にLPRP", "バイオレンスクロー", "w", 100, 0, ""], [13, 0, "立ち途中にLPRP2～(orWK)", "バイオレンスクロー～ハンティングスタイル", "w", 101, 0, ""], [13, 0, "ヒート中RP+LK", "サーモン一本釣り打法", "h", 209, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [15, 0, "立ち途中にRP", "マッドアングラー", "w", 106, 0, ""], [15, 0, "ヒート中3RP+LK", "熊風神拳", "h", 204, 0, ""]]}, "feng": {"src": "cu", "stand": [[10, 0, "LPRP", "瞬連拳", "", 2, 0, ""], [10, 0, "LPRPRP", "疾火蓮弾", "", 3, 0, ""], [10, 0, "LPLK", "連還衝腿", "", 5, 0, ""], [10, 0, "ヒート中4LP", "神髄撲面掌", "h", 73, 0, ""], [10, 0, "2LP", "シットジャブ", "", 47, 0, ""], [10, 0, "LPRPRP4", "疾火蓮弾～背向け", "", 4, 0, ""], [12, 0, "4RKRP", "側腹蓮弾", "", 83, 0, ""], [12, 0, "ヒート中4RKWK", "側腹裂海踏", "h", 85, 0, ""], [13, 0, "4WP", "嶽寸靠", "", 87, 0, "", {"he": 1}], [13, 0, "ヒート中4WP6", "嶽寸靠(ヒートダッシュ)", "h", 187, 0, "", {"ov": "4WP6(ヒート中)"}], [15, 0, "3RKLK", "双旋脚", "", 45, 0, ""], [15, 0, "9RK", "飛天脚(9・8方向)", "", 97, 0, ""], [20, 0, "ヒート中RP+LK", "応竜破山靠", "h", 198, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [21, 0, "6LKRK", "龍歩昇雲", "", 28, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 47, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中RK", "登脚", "w", 123, 0, ""], [13, 0, "立ち途中LPLK", "疾歩蠍伏蹴", "w", 120, 0, "", {"he": 1}], [13, 0, "ヒート中立ち途中LPLK6", "疾歩蠍伏蹴(ヒートダッシュ)", "hw", 191, 0, "", {"ov": "立ち途中LPLK6(ヒート中)"}], [13, 0, "立ち途中LPRP", "疾歩蓮弾(2)", "w", 117, 0, ""], [15, 0, "立ち途中LK", "穿弓腿", "w", 122, 0, ""], [18, 0, "しゃがみ中3RP", "青紅仏破", "c", 127, 0, ""], [20, 0, "ヒート中RP+LK", "応竜破山靠", "h", 198, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "panda": {"src": "net", "stand": [[10, 0, "RPLP", "ストレート～エルボー", "", 5, 0, ""], [10, 0, "2LP", "シットジャブ", "", 29, 0, ""], [12, 0, "6RPLP", "ワイルドランバージャック", "", 14, 0, ""], [12, 0, "3RK", "フロントキック", "", 28, 0, ""], [13, 0, "WP", "熊剛掌破", "", 11, 0, "", {"he": 1}], [13, 0, "ヒート状態でWP6～", "熊剛掌破(ヒートダッシュ)", "h", 173, 0, ""], [14, 0, "2WP", "熊鉄山靠", "", 34, 0, ""], [14, 0, "1LPRP", "ダブルワイルドビンタ", "", 37, 0, ""], [14, 0, "1LPRP2～(orWK)", "ダブルワイルドビンタ～ハンティングスタイル", "", 38, 0, ""], [15, 0, "3RPLP", "熊武爪", "", 25, 0, ""], [15, 0, "ヒート中RP+LK", "熊猫必殺スーパーアタック", "h", 189, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [16, 0, "9LK", "熊三宝龍(1)", "", 74, 0, ""]], "crouch": [[11, 0, "立ち途中にRK", "ポースマッシュ", "w", 108, 0, ""], [13, 0, "立ち途中にLPRP", "バイオレンスクロー", "w", 100, 0, ""], [13, 0, "立ち途中にLPRP2～(orWK)", "バイオレンスクロー～ハンティングスタイル", "w", 101, 0, ""], [15, 0, "立ち途中にRP", "マッドアングラー", "w", 106, 0, ""], [15, 0, "ヒート中RP+LK", "熊猫必殺スーパーアタック", "h", 189, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "zafina": {"src": "cu", "stand": [[10, 0, "LPRP", "ワンツーパンチ", "", 1, 0, ""], [10, 0, "LPLK", "カリバーン～MS", "", 4, 0, ""], [10, 0, "LPRK", "キャストオフ～MT", "", 6, 0, ""], [10, 0, "1LP", "シットジャブ", "", 61, 0, ""], [12, 0, "ヒート中RP+LK", "カース・オブ・アザゼル", "h", 222, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [13, 0, "3LPRK", "バルムンク", "", 36, 0, ""], [13, 0, "3RKLP", "ミアズマベアラー", "", 46, 0, "", {"he": 1}], [13, 0, "3RKRP", "オルトス", "", 48, 0, ""], [13, 0, "3RKLP6(ヒート中)", "ミアズマベアラー(ヒートダッシュ)", "h", 216, 0, "", {"ov": "3RKLP6(ヒート中)"}], [14, 0, "6RK", "ウェスタ", "", 26, 0, ""], [15, 0, "3LKRK", "ハルファス", "", 40, 0, ""], [16, 0, "3RP", "アシュケロン", "", 37, 0, ""], [17, 0, "9RK(or8RK)", "ラハブ", "", 92, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 61, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中RK", "バシュム", "w", 114, 0, ""], [12, 0, "立ち途中LK", "シャルガズ～MS", "w", 112, 0, ""], [12, 0, "ヒート中RP+LK", "カース・オブ・アザゼル", "h", 222, 0, "ヒートスマッシュ・上段なのでしゃがみに当たらない", {"ov": "ヒート中RP+LK"}], [15, 0, "立ち途中LPRP", "アルラウネ", "w", 109, 0, ""], [17, 0, "9RK(or8RK)", "ラハブ", "", 92, 0, ""], [18, 0, "立ち途中RP", "レヴィアタン", "w", 110, 0, ""]]}, "lee": {"src": "td", "stand": [[10, 0, "LPLKLKLK", "アシッドレインキックコンビネーション", "", 14, 0, ""], [10, 0, "LPRPRK", "ワンツーミドル", "", 6, 0, ""], [10, 0, "LPRPRK(ジャスト)", "ワンツーミドル・カーディナル", "", 8, 0, ""], [10, 0, "2LP(or1LP)", "シットジャブ", "", 78, 0, ""], [11, 0, "RKRKRK", "マシンガンキック", "", 38, 0, ""], [11, 0, "RKRKRK(ジャスト)", "マシンガンキック・カーディナル", "", 40, 0, "", {"he": 1}], [11, 0, "ヒート中RKRKRK6", "マシンガンキック・カーディナル(ヒートダッシュ)", "h", 240, 0, "", {"ov": "RKRKRK6(ジャスト)(ヒート中)"}], [13, 0, "3RKRK", "ファビュラスウィップ", "", 75, 0, "", {"he": 1}], [13, 0, "ヒート中3RKRK6", "ファビュラスウィップ(ヒートダッシュ)", "h", 244, 0, "", {"ov": "3RKRK6(ヒート中)"}], [14, 0, "4LPLPRP", "トリプルファング", "", 105, 0, ""], [14, 0, "6RPLP", "ダブルシグナル", "", 46, 0, ""], [14, 0, "4LPLPRP(ジャスト：2発目)", "トリプルファング・カーディナル", "", 109, 0, "ジャスト", {"ov": "4LPLPRP(ジャスト：2段目)"}], [14, 0, "4LPWP(ジャスト)", "ダブルファング・カーディナル", "", 111, 0, ""], [15, 0, "9RK", "シルバーニー", "", 137, 0, ""], [15, 0, "6LKLKLKLKLKRK", "アシッドストーム", "", 52, 0, ""], [15, 1, "66LK", "インパルスショット", "", 150, 0, "", {"he": 1}], [15, 1, "ヒート中66LK6", "インパルスショット(ヒートダッシュ)", "h", 246, 0, "", {"ov": "66LK6(ヒート中)"}], [15, 0, "3RP", "シルバーアッパー", "", 66, 0, ""], [15, 0, "6LKLKLKLKLKRK(ジャスト)", "アシッドストーム・カーディナル", "", 53, 0, ""]], "crouch": [[10, 0, "LKLK", "インフィニティーキックコンボ(2)", "w", 168, 0, ""], [10, 0, "立ち途中LKLKRK", "インフィニティーキックコンボ(2)～ヒットマンスタイル", "w", 169, 0, ""], [10, 0, "しゃがみ中LP", "シットジャブ", "c", 78, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "トゥースマッシュ", "w", 176, 0, ""], [13, 0, "LPRK", "ワンダフルPK", "w", 161, 0, ""], [13, 0, "立ち途中LPRK(ジャスト)", "ワンダフルPK・カーディナル", "w", 261, 0, ""], [14, 0, "RPLK", "ヒールブースター", "w", 164, 0, ""], [14, 0, "立ち途中RPRK", "ヒールツイスター", "w", 166, 0, ""], [15, 0, "9RK(or8RKor7RK)", "シルバーニー", "", 137, 0, ""]]}, "alisa": {"src": "net", "part": "crouch", "stand": [[10, 0, "LP", "ジャブ", "", 0, 0, ""], [10, 0, "LPLP", "ストップビット", "", 1, 0, ""], [10, 0, "LPLPWP", "ストップビット～デストロイフォーム", "", 2, 0, ""], [10, 0, "LPRP", "ワンツータイピング", "", 3, 0, ""], [10, 0, "2LP", "シットジャブ", "", 47, 0, ""], [12, 0, "RP(ヒットorガード時)RP", "トラブルシューティング", "", 8, 0, "ヒット or ガード時"], [12, 0, "3RK", "フロントキック", "", 46, 0, ""], [13, 0, "LKRP", "クイックトリミング～デストロイフォーム", "", 13, 0, "", {"he": 1}], [13, 0, "(ヒート状態で)LKRP6～", "クイックトリミング(ヒートダッシュ)", "h", 14, 0, "", {"ov": "LKRP6(ヒート中)"}], [13, 0, "LK6RP", "クイックアクセス～デストロイフォーム", "", 16, 0, ""], [13, 0, "RK", "アクセレートキック", "", 17, 0, ""], [14, 0, "6LKRP", "デストロイアクセス～デストロイフォーム", "", 30, 0, ""], [14, 0, "6LKWP", "オートマチックトランスミッション～デストロイフォーム", "", 31, 0, ""], [14, 0, "6WP", "オーバーフロー", "", 36, 0, ""], [14, 0, "6WPLK(or6WPRK)", "オーバーフロー～ブート", "", 37, 0, ""], [14, 0, "6WP6LK(or6WP6RK)", "オーバーフロー～デュアルブート", "", 38, 0, ""], [15, 0, "4RKRK", "ダブルオーバーライド", "", 72, 0, ""], [15, 0, "9RK(or8RK)", "インバウンドキック(1)", "", 93, 0, ""], [16, 0, "3RP", "ピックアップ", "", 43, 0, ""], [17, 0, "9LK(ヒットorガード時)RP", "クレイドルスター", "", 90, 0, "ヒット or ガード時"], [18, 0, "4WK", "ダイナミックレンジ(1)", "", 76, 0, ""], [20, 0, "ヒート中RP+LK", "ホットフィックスプロトコル", "h", -1, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK", "dm": "50", "sp": 9999, "at": "中,中,中,中"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 120, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "(立ち途中に)RK", "キースマッシュ", "w", 137, 0, ""], [13, 0, "(立ち途中に)LPRP", "スピアフィッシング(2)", "w", 125, 0, ""], [13, 0, "(立ち途中に)LPRPWP", "スピアフィッシング(2)～デストロイフォーム", "w", 126, 0, ""], [15, 0, "9RKRK", "インバウンドキック", "", 94, 0, ""], [17, 0, "9LK(ヒットorガード時)RP", "クレイドルスター", "", 90, 0, "ヒット or ガード時"], [17, 0, "(立ち途中に)RP", "スナップショット", "w", 129, 0, ""], [20, 0, "ヒート中RP+LK", "ホットフィックスプロトコル", "h", -1, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK", "dm": "50", "sp": 9999, "at": "中,中,中,中"}]]}, "devil-jin": {"src": "td", "stand": [[10, 0, "LPLPRP", "閃光裂爪", "", 2, 0, ""], [10, 0, "LPRPRP", "鬼哭連拳", "", 4, 0, ""], [10, 0, "1LP", "シットジャブ", "", 47, 0, ""], [12, 0, "4LPRP", "蛇毒気掌", "", 56, 0, ""], [13, 0, "3LPRP", "悪鬼八門", "", 30, 0, ""], [13, 1, "6n3RP", "最速風神拳", "", 124, 0, "", {"ov": "6n3RP"}], [14, 0, "4RPLK", "無間羅刹", "", 61, 0, "", {"he": 1}], [14, 1, "6n23RP", "風神拳", "", 124, 0, ""], [14, 0, "ヒート中4RPLK6", "無間羅刹(ヒートダッシュ)", "h", 162, 0, "", {"ov": "4RPLK6(ヒート中)"}], [15, 0, "2WK", "紫雲二段蹴り", "", 46, 0, ""], [16, 0, "9WK", "飛倉", "", 75, 0, ""], [16, 0, "ヒート中9WK(ヒット or ガード時)WP", "飛倉滅焦波", "h", 76, 0, ""], [16, 1, "66RP", "胴抜き", "", 78, 0, "", {"he": 1}], [16, 1, "ヒート中66RP6", "胴抜き(ヒートダッシュ)", "h", 168, 0, "", {"ov": "66RP6(ヒート中)"}], [18, 0, "ヒート中RP+LK", "凶獄螺旋", "h", 171, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 47, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RKRK", "惨獄槌", "w", 102, 0, ""], [13, 0, "LPRP", "独角破嘩", "w", 95, 0, ""], [13, 0, "立ち途中LPRK", "天滅十字斬", "w", 97, 0, ""], [13, 0, "立ち途中LPRP(ヒット時)6", "独角破嘩～忌鴉", "w", 96, 0, ""], [14, 0, "RP", "阿頼耶", "w", 98, 0, ""], [16, 0, "9WK", "飛倉", "", 75, 0, ""], [16, 0, "ヒート中9WK(ヒット or ガード時)WP", "飛倉滅焦波", "h", 76, 0, ""], [16, 1, "66RP", "胴抜き", "", 78, 0, "", {"he": 1}], [16, 1, "ヒート中66RP6", "胴抜き(ヒートダッシュ)", "h", 168, 0, "", {"ov": "66RP6(ヒート中)"}], [18, 0, "ヒート中RP+LK", "凶獄螺旋", "h", 171, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "victor": {"src": "net", "stand": [[10, 0, "LPLPRP", "ダブルカボションカット", "", 2, 0, ""], [10, 0, "LPLPRP6", "ダブルカボションカット～パフューマー", "", 3, 0, ""], [12, 0, "RPRPヒット時RP", "クライベイビー・ソフィア～イアイ・ポズィション", "", -1, 0, "", {"sp": 11, "at": "上,中,中,上,特殊"}], [13, 0, "9LPLP", "グリンガレット", "", 68, 0, ""], [13, 0, "9LPLP2～(or9LPLPWK)", "グリンガレット～キャンセルイアイ・ポズィション", "", 70, 0, ""], [14, 0, "6RKLP", "カーヴィングカメオ", "", 27, 0, "", {"he": 1}], [14, 0, "ヒート状態で6RKLP6～", "カーヴィングカメオ(ヒートダッシュ)", "h", 150, 0, ""], [15, 0, "3RP", "アルカディア", "", 34, 0, ""], [15, 0, "9RK", "カリッジ・シャトヤンシー", "", 77, 0, ""], [17, 0, "4LKLP", "カヴァル", "", 62, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 95, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にRK", "プレイズスマッシュ", "w", 92, 0, ""], [11, 0, "1RP", "シットストレート", "", 52, 0, ""], [13, 0, "9LPLP", "グリンガレット", "", 68, 0, ""], [13, 0, "9LPLP2～(or9LPLPWK)", "グリンガレット～キャンセルイアイ・ポズィション", "", 70, 0, ""], [13, 0, "立ち途中にWP", "パーリ―ゲイツ", "w", 93, 0, ""], [13, 0, "立ち途中にWP6～", "パーリ―ゲイツ～パフューマー", "w", 94, 0, ""], [14, 0, "立ち途中RP", "バスケットカット", "w", 89, 0, ""], [15, 0, "立ち途中にLP", "オーバルカット", "w", 88, 0, ""]]}, "reina": {"src": "net", "stand": [[10, 0, "LPLPRP", "閃光烈拳～旋体", "", 2, 0, ""], [10, 0, "LPLPRP4～", "閃光烈拳～立ち状態", "", 3, 0, ""], [10, 0, "LPRP", "弐門拳", "", 4, 0, ""], [10, 0, "LPRPRP", "鬼哭連拳", "", 5, 0, ""], [10, 0, "2LP(or1LP)", "シットジャブ", "", 69, 0, ""], [10, 0, "LPRPRP2(or8)", "鬼哭連拳～運足・交", "", 6, 0, ""], [12, 0, "RPRPLP", "眼斬伐折羅", "", 11, 0, ""], [12, 0, "WP", "剛掌破", "", 25, 0, ""], [13, 0, "3LPRP", "無双伐折羅", "", 58, 0, "", {"he": 1}], [13, 0, "ヒート状態で3LPRP6～", "無双伐折羅(ヒートダッシュ)", "h", 215, 0, ""], [13, 1, "6n3RP", "最速風神拳", "", -1, 0, "", {"ov": "6n3RP", "sp": 163, "at": "上"}], [13, 1, "66～RP6～", "雷電～旋体", "", 105, 0, ""], [14, 0, "【RPLP】", "鬼太鼓", "", 17, 0, ""], [14, 1, "6n23RP", "風神拳", "", 154, 0, ""], [15, 0, "3RP", "妃蜂", "", 59, 0, ""], [17, 0, "9RK", "煌銀脚", "", 96, 0, ""], [21, 0, "ヒート中RP+LK", "鏖祗・覇道殲壊", "h", 226, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 69, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にRKRK", "四海落とし", "w", 117, 0, ""], [11, 0, "立ち途中にRKRK2～", "四海落とし～金剛壁", "w", 118, 0, ""], [13, 0, "立ち途中にLP", "独掌把～旋体", "w", 112, 0, ""], [13, 1, "6n3RP", "最速風神拳", "", -1, 0, "", {"ov": "6n3RP", "sp": 163, "at": "上"}], [13, 1, "66～RP6～", "雷電～旋体", "", 105, 0, ""], [15, 0, "しゃがんだ状態で3RK", "卍蹴り", "c", 123, 0, "", {"ov": "しゃがみ中3RK"}], [21, 0, "ヒート中RP+LK", "鏖祗・覇道殲壊", "h", 226, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "eddy": {"src": "net", "stand": [[10, 0, "LPRP", "ワンツーガロパンチ", "", 1, 0, ""], [10, 0, "LPRP6～", "ワンツーパンチ～バナネイラ", "", 2, 0, ""], [10, 0, "2LP(or1LP)", "シットジャブ", "", 38, 0, ""], [12, 0, "RPLP", "コンボ・フラカォン(2)", "", 10, 0, ""], [12, 0, "RPLK", "バチータ・ジ・コンパッソ～バナネイラ", "", 12, 0, ""], [12, 0, "(相手しゃがみ中)接近して2LP+LK", "ヴァンガチーヴァ・ザンガ", "", 199, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK", "dm": "30", "he": 1}], [12, 0, "2RP+RK", "ヴァンガチーヴァ・フネラウ", "", -1, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2RP+RK", "sp": 203.5, "at": "中段投げ"}], [13, 0, "3LPLK", "ジェイゼル", "", 33, 0, ""], [14, 0, "9LPLK", "オショッスィ", "", 73, 0, ""], [14, 0, "9LPRK", "オション", "", 76, 0, "", {"he": 1}], [14, 0, "ヒート中9LPRK6", "オション(ヒートダッシュ)", "h", 184, 0, "", {"ov": "9LPRK6(ヒート中)"}], [15, 0, "3LK", "ビリバ", "", 35, 0, ""], [15, 0, "4RPRK", "ゴデーミ～カウカニェイラ", "", 62, 0, ""], [18, 0, "ヒート中RP+LK", "カヴェイリーニャ・ザンガーダ", "h", 187, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 38, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にRKRK", "テンペスタージ(2)", "w", 110, 0, ""], [12, 0, "(相手しゃがみ中)接近して2LP+LK", "ヴァンガチーヴァ・ザンガ", "", 199, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK", "dm": "30", "he": 1}], [12, 0, "2RP+RK", "ヴァンガチーヴァ・フネラウ", "", -1, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2RP+RK", "sp": 203.5, "at": "中段投げ"}], [13, 0, "立ち途中にLPLK", "フズィラサォン～ネガチーヴァ", "w", 105, 0, ""], [13, 0, "立ち途中にLPRK", "シャペウ・ジ・コウロ", "w", 106, 0, ""], [14, 0, "9LPLK", "オショッスィ", "", 73, 0, ""], [14, 0, "9LPRK", "オション", "", 76, 0, "", {"he": 1}], [14, 0, "ヒート中9LPRK6", "オション(ヒートダッシュ)", "h", 184, 0, "", {"ov": "9LPRK6(ヒート中)"}], [15, 0, "立ち途中にRP", "マシャード", "w", 107, 0, ""], [18, 0, "ヒート中RP+LK", "カヴェイリーニャ・ザンガーダ", "h", 187, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "lidia": {"src": "net", "stand": [[10, 0, "LPRP", "連突き", "", 1, 0, ""], [10, 0, "LPRPRP", "連突き～中段追い突き～猫足", "", 2, 0, ""], [10, 0, "1LP", "シットジャブ", "", 60, 0, ""], [11, 0, "RPRP", "旋回二段撃～猫足", "", 7, 0, ""], [11, 0, "RPRK", "右上段逆突き～右中段前蹴り", "", 8, 0, ""], [12, 0, "6RPRK", "四十雀", "", 27, 0, ""], [13, 0, "3LPRP", "左中段鉤突き～背刀打ち", "", 44, 0, ""], [14, 0, "6WPLKWP", "乱れ桜", "", 39, 0, "", {"he": 1}], [14, 0, "6WPLK236WP", "乱れ桜(青)", "", 41, 0, "", {"he": 1}], [14, 0, "ヒート状態で6WPLKWP6～", "乱れ桜(ヒートダッシュ)", "h", 243, 0, ""], [14, 1, "66～RP", "神速正拳突き～騎馬立ち", "", 110, 0, ""], [14, 1, "ヒート状態で66～RP", "神速正拳突き(ヒート状態)～騎馬立ち", "h", 110, 0, "", {"ov": "ヒート中66RP"}], [14, 0, "6WPLK236WP6(ヒート中)", "乱れ桜(青)(ヒートダッシュ)", "h", 245, 0, ""], [15, 0, "LKRP", "岩鶴", "", 10, 0, ""], [15, 0, "LKRP(ジャスト)", "岩鶴(青)", "", 11, 0, "ジャスト"], [15, 0, "9RK", "鎌鼬", "", 108, 0, ""], [18, 0, "ヒート中RP+LK", "千華万咲撃", "h", 259, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 60, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中にRKRP", "顎砕～猫足", "w", 143, 0, ""], [12, 0, "しゃがんだ状態で3RP", "迅肘打", "c", 146, 0, "", {"he": 1}], [12, 0, "ヒート状態でしゃがんだ状態で3RP6～", "迅肘打(ヒートダッシュ)", "hc", 249, 0, ""], [13, 0, "立ち途中にLPRP", "白鷲～猫足", "w", 138, 0, ""], [13, 0, "立ち途中にLPRK", "荒鷲", "w", 139, 0, ""], [14, 0, "立ち途中にLK", "屋形越え", "w", 141, 0, ""], [14, 1, "66～RP", "神速正拳突き～騎馬立ち", "", 110, 0, ""], [14, 1, "ヒート状態で66～RP", "神速正拳突き(ヒート状態)～騎馬立ち", "h", 110, 0, "", {"ov": "ヒート中66RP"}], [15, 0, "立ち途中にRP", "上げ突き", "w", 140, 0, ""], [15, 0, "9RK", "鎌鼬", "", 108, 0, ""], [18, 0, "ヒート中RP+LK", "千華万咲撃", "h", 259, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "heihachi": {"src": "td", "stand": [[10, 0, "LPLPRP", "閃光烈拳", "", 2, 0, ""], [10, 0, "LPRPRP", "鬼哭連拳", "", 4, 0, ""], [10, 0, "LPRPRP2", "鬼哭連拳～風神呼法", "", 5, 0, ""], [10, 0, "武の境地状態でLPLPRP", "究極閃光烈拳", "s", 179, 0, ""], [10, 0, "1LP", "シットジャブ", "", 66, 0, ""], [11, 0, "RPRP", "怒拳骨", "", 17, 0, ""], [12, 0, "6WP", "ぱちき", "", 38, 0, ""], [12, 0, "WP", "剛掌破", "", 25, 0, ""], [12, 0, "武の境地状態でWP", "究極剛掌破", "s", 181, 0, ""], [13, 0, "3RPLP", "裏無双連拳", "", 47, 0, ""], [13, 0, "3RKRP", "百漢双撃", "", 53, 0, ""], [13, 0, "3LPRP", "無双徹拳", "", 42, 0, ""], [13, 0, "3LPRPホールドジャスト(青)", "極・無双徹拳(青)", "", 44, 0, "", {"ov": "3LPRPホールドジャスト(青)"}], [13, 0, "3LPRPホールドジャスト(金)", "極・無双徹拳(金)", "", 45, 0, "", {"ov": "3LPRPホールドジャスト(金)"}], [13, 1, "6n3RP", "最速風神拳", "", 144, 0, "", {"ov": "6n3RP"}], [13, 0, "武の境地状態で3RPLP", "究極無双連拳", "s", 182, 0, ""], [14, 0, "236RP", "金剛槍掌", "", 104, 0, "", {"he": 1}], [14, 1, "6n23RP", "風神拳", "", 144, 0, ""], [14, 0, "4LPRK", "鬼夜雷", "", 71, 0, ""], [14, 0, "4LKLK", "鰐下駄", "", 79, 0, ""], [14, 0, "ヒート中4LKLKRP", "鰐雷破砕衝", "h", 80, 0, ""], [14, 1, "ヒート中236RP6", "金剛槍掌(ヒートダッシュ)", "h", 200, 0, "", {"ov": "236RP6(ヒート中)"}], [15, 0, "3LKWPLP", "五虎退連弾", "", 50, 0, ""], [15, 0, "ヒート中RP+LK", "超・鉄槌堕とし", "h", 203, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [15, 0, "3LKWP236LP", "五虎退連弾(青)", "", 51, 0, ""], [15, 0, "ヒート中RP+LK6", "八色雷公崩し～雷神呼法", "h", 207, 0, "ヒートスマッシュ"], [19, 0, "9RPLP", "万漢螺旋掌", "", 90, 0, "", {"he": 1}], [19, 0, "ヒート中9RPLP6", "万漢螺旋掌(ヒートダッシュ)", "h", 196, 0, "", {"ov": "9RPLP6(ヒート中)"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ(しゃがみ中)", "c", 117, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RKRK", "踵落とし", "w", 114, 0, ""], [11, 0, "立ち途中RKRK2", "踵落とし～風神呼法", "w", 115, 0, ""], [13, 0, "LP", "金剛掌", "w", 109, 0, ""], [14, 1, "236RP", "金剛槍掌", "", 104, 0, "", {"he": 1}], [14, 1, "ヒート中236RP6", "金剛槍掌(ヒートダッシュ)", "h", 200, 0, "", {"ov": "236RP6(ヒート中)"}], [15, 0, "3RP", "剛風衝天", "c", 119, 0, ""], [15, 0, "ヒート中RP+LK", "超・鉄槌堕とし", "h", 203, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [19, 0, "9RPLP", "万漢螺旋掌", "", 90, 0, "", {"he": 1}], [19, 0, "ヒート中9RPLP6", "万漢螺旋掌(ヒートダッシュ)", "h", 196, 0, "", {"ov": "9RPLP6(ヒート中)"}]]}, "clive": {"src": "net", "stand": [[10, 0, "LPLP", "ダブルブロウ", "", 1, 0, ""], [10, 0, "LPLP6～", "ダブルブロウ～フェニックスシフト", "", 2, 0, ""], [10, 0, "LPRP", "フィニシングスティール", "", 3, 0, ""], [11, 0, "2RP", "シットストレート", "", 66, 0, ""], [12, 0, "RPLP", "マジックバースト", "", 6, 0, ""], [12, 0, "RPLP(ジャスト)", "マジックバースト(青)", "", 7, 0, "ジャスト"], [12, 0, "RKRK", "ラウンダバウト", "", 23, 0, ""], [12, 0, "RKRK6", "ラウンダバウト～フェニックスシフト", "", 24, 0, ""], [13, 0, "WP", "フレイムバッシュ", "", 26, 0, "", {"he": 1}], [13, 0, "WP6～", "フレイムバッシュ(ヒートダッシュ)", "h", 185, 0, "", {"ov": "WP6(ヒート中)"}], [14, 0, "3LPRPLP", "アウトロウバースト", "", 54, 0, ""], [14, 0, "3LPRPLP(ジャスト)", "アウトロウバースト(青)", "", 55, 0, "ジャスト"], [15, 0, "3RP", "ウィルムキラー", "", 58, 0, ""], [16, 0, "6WP", "プロミネンス", "", 43, 0, "", {"he": 1}], [16, 0, "ヒート中6WP", "プロミネンス(ヒート状態)", "h", 188, 0, ""], [16, 0, "ヒート中6WP6", "プロミネンス(ヒートダッシュ)", "h", 189, 0, "", {"ov": "6WP6(ヒート中)"}], [18, 0, "ヒート中RP+LK", "転生の獄炎", "h", 196, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 114, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "(立ち途中)RK", "サバトンスマッシュ", "w", 110, 0, ""], [11, 0, "(立ち途中)RK6～", "サバトンスマッシュ～フェニックスシフト", "w", 111, 0, ""], [11, 0, "2RP", "シットストレート", "", 66, 0, ""], [13, 0, "(立ち途中)LP6～", "ワイルドスティール(1)～フェニックスシフト", "w", 105, 0, ""], [13, 0, "(立ち途中)LPRP", "ワイルドスティール", "w", 106, 0, ""], [13, 0, "(立ち途中)WP", "フレイムバッシュ", "w", 26, 0, "", {"he": 1}], [13, 0, "ヒート中WP6", "フレイムバッシュ(ヒートダッシュ)", "h", 185, 0, "", {"ov": "WP6(ヒート中)"}], [15, 0, "(立ち途中)RP", "エコーブレイカー", "w", 107, 0, ""], [18, 0, "ヒート中RP+LK", "転生の獄炎", "h", 196, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "anna": {"src": "td", "stand": [[10, 0, "RPLK", "ダブルフェイスウォッシュ～カオスジャッジメント", "", 14, 0, ""], [10, 0, "LPRP", "ワンツー掌打", "", 1, 0, ""], [10, 0, "2LP", "シットジャブ", "", 52, 0, ""], [13, 0, "4RPRP", "往復ビンタ", "", 80, 0, ""], [13, 0, "3LPRP", "アッパーストレート", "", 32, 0, ""], [13, 0, "ヒート中RP+LK", "フロム・エール・ウィズ・ラブ", "h", 124, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [13, 0, "9LP", "フェイタルアタックコンビネーション(1)", "", 85, 0, ""], [14, 0, "WK", "アフロディアスタンプ", "", 26, 0, "", {"he": 1}], [14, 0, "LKRP", "サーバルクリーヴァ", "", 18, 0, ""], [14, 0, "6RPLK", "ポイズンストリング", "", 28, 0, ""], [15, 0, "3RP", "ステップインアッパー", "", 37, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 52, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "LK", "フェイスウォッシュ～カオスジャッジメント", "w", 131, 0, ""], [11, 0, "RK", "トゥースマッシュ", "w", 132, 0, ""], [13, 0, "LPRP", "オセロットラッシュ～プレジャータイム", "w", 129, 0, ""], [13, 0, "ヒート中RP+LK", "フロム・エール・ウィズ・ラブ", "h", 124, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [16, 0, "RP", "リフトショット", "w", 130, 0, ""]]}, "fahkumram": {"src": "td", "stand": [[10, 0, "LPRK", "ジャブ～ハイキック", "", 13, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 2, 0, ""], [10, 0, "1LP", "シットジャブ", "", 93, 0, ""], [12, 0, "RPLP", "ダブルティー・ソーク", "", 15, 0, ""], [13, 0, "LKLP", "アユタヤライトニングストレート(2)", "", 18, 0, ""], [13, 0, "ガルーダフォース状態で3WKLK", "ナーガイーター(ガルーダフォース)", "s", 167, 0, ""], [14, 0, "4LP", "ティー・ソーク・ラン", "", 98, 0, ""], [14, 0, "9LK", "エラワンタスク", "", 112, 0, "", {"he": 1}], [14, 0, "ヒート中9LK6", "エラワンタスク(ヒートダッシュ)", "h", 184, 0, "", {"ov": "9LK6(ヒート中)"}], [15, 0, "3RPLK", "バーンアウトスイッチハイ", "", 70, 0, ""], [15, 0, "3LPRK", "アイヤラーコンビネーション・ハイ", "", 61, 0, "", {"he": 1}], [15, 0, "ヒート中3LPRK6", "アイヤラーコンビネーション・ハイ(ヒートダッシュ)", "h", 180, 0, "", {"ov": "3LPRK6(ヒート中)"}], [15, 0, "6RPLP", "クロスブリッツ", "", 50, 0, ""], [15, 0, "ガルーダフォース状態で6RPLPRP", "ナーガスローター(ガルーダフォース)", "s", 165, 0, ""], [15, 0, "ヒート中6RPLPRP", "ナーガスローター", "h", 51, 0, ""], [16, 0, "ヒート中RP+LK", "ハヌマーン・インパクト", "h", 188, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 93, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "RK", "トゥースマッシュ", "w", 137, 0, ""], [13, 0, "LPRP", "コーラートコンビネーション", "w", 128, 0, "", {"he": 1}], [13, 0, "ヒート中立ち途中LPRP6", "コーラートコンビネーション(ヒートダッシュ)", "hw", 186, 0, "", {"ov": "立ち途中LPRP6(ヒート中)"}], [14, 0, "RPRK", "デュアルスライサー", "w", 130, 0, ""], [14, 0, "9LK", "エラワンタスク", "", 112, 0, "", {"he": 1}], [14, 0, "ヒート中9LK6", "エラワンタスク(ヒートダッシュ)", "h", 184, 0, "", {"ov": "9LK6(ヒート中)"}], [15, 0, "LK", "カウ・プラスメール", "w", 136, 0, ""], [16, 0, "ヒート中RP+LK", "ハヌマーン・インパクト", "h", 188, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "armorking": {"src": "cu", "stand": [[10, 0, "LPRP", "ワンツーパンチ", "", 1, 0, ""], [10, 0, "RPLP", "ライトストレート～レフトアッパー", "", 5, 0, ""], [10, 0, "2LP", "シットジャブ", "", 48, 0, ""], [12, 0, "3RK", "フロントキック", "", 45, 0, ""], [12, 0, "4LPRP", "ブラックジャブ～ヘルスタッブ", "", 68, 0, ""], [12, 0, "相手しゃがみ中2LP+LK", "デーモンボム", "", 205, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK", "dm": "35"}], [12, 0, "相手しゃがみ中2RP+RK", "ストームメイカー", "", 207, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2RP+RK", "dm": "35", "he": 1}], [12, 0, "4LPRP6", "ブラックジャブ～ヘルスタッブ～バッドジャガー", "", 69, 0, ""], [13, 0, "RKLK", "ハイキックトルネード", "", 11, 0, ""], [13, 0, "6LP+RK", "ショルダーインパクト", "", 38, 0, ""], [13, 1, "6n3RP", "最速ブラックスマッシュ", "", 163, 0, "", {"ov": "6n3RP"}], [14, 1, "6n23RP", "ブラックスマッシュ", "", 163, 0, ""], [15, 0, "9RPLP", "デスサンド", "", 83, 0, ""], [15, 0, "9RK", "ライジングトゥーキック", "", 85, 0, ""], [15, 0, "6RPLP", "ブラックエルボーフック", "", 27, 0, "", {"he": 1}], [15, 0, "ヒート中6RPLP6", "ブラックエルボーフック～ヒートダッシュ", "h", 26, 0, "", {"ov": "6RPLP6(ヒート中)"}], [16, 0, "4LK", "ダークトラースキック", "", 73, 0, ""], [17, 0, "ヒート中RP+LK", "インフィエルノ・ハグワール", "h", 173, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 48, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中RK", "トゥースマッシュ", "w", 116, 0, ""], [12, 0, "立ち途中RP", "地獄突き", "w", 109, 0, ""], [12, 0, "相手しゃがみ中2LP+LK", "デーモンボム", "", 205, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2LP+LK", "dm": "35"}], [12, 0, "相手しゃがみ中2RP+RK", "ストームメイカー", "", 207, 0, "しゃがみ状態への専用確反（しゃがみ投げ）", {"ov": "2RP+RK", "dm": "35", "he": 1}], [13, 0, "立ち途中LKLP", "プリズンクラッシャー", "w", 115, 0, "", {"he": 1}], [13, 0, "ヒート中立ち途中LKLP6", "プリズンクラッシャー～ヒートダッシュ", "hw", 114, 0, "", {"ov": "立ち途中LKLP6(ヒート中)"}], [15, 0, "9RK", "ライジングトゥーキック", "", 85, 0, ""], [15, 0, "9RPLP", "デスサンド", "", 83, 0, ""], [15, 0, "立ち途中LP", "かち上げエルボー", "w", 108, 0, ""], [17, 0, "ヒート中RP+LK", "インフィエルノ・ハグワール", "h", 173, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "miary": {"src": "cu", "stand": [[10, 0, "LPLPRP", "マンディニアイアイ", "", 2, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 4, 0, ""], [10, 0, "LPLPRPヒットorガード時6", "マンディニアイアイ～モラング・ミルス", "", 3, 0, ""], [10, 0, "2LP(or1LP)", "シットジャブ", "", 51, 0, ""], [11, 0, "RPRP", "レフナイナ", "", 8, 0, ""], [12, 0, "4LPRK", "ヴァヴァキニ・アヴァナ", "", 66, 0, ""], [13, 0, "LKRP", "バシ・レラフ", "", 14, 0, "", {"he": 1}], [13, 0, "3LPLP", "ファマキニアラ(2)", "", 38, 0, ""], [13, 0, "3LPLP6", "ファマキニアラ(2)～モラング・ミルス", "", 39, 0, ""], [13, 0, "4RPLK", "トゥンジャジャヌ・マスナ(2)", "", 68, 0, ""], [13, 0, "4RPLK6", "トゥンジャジャヌ・マスナ(2)～モラング・ミルス", "", 69, 0, ""], [13, 0, "LKRP6(ヒート中)", "バシ・レラフ(ヒートダッシュ)", "h", 170, 0, ""], [13, 0, "3LPRKヒット時", "シファカアナラ～バオバブ・ミール", "", 42, 0, "", {"ov": "3LPRK"}], [15, 0, "3RP", "ダルカマフィ", "", 44, 0, ""], [15, 0, "9RKRK", "ヴァリキャ・ル", "", 90, 0, ""], [15, 0, "WP", "マナフィキャ", "", 19, 0, ""], [15, 0, "WP6(ヒート中)", "マナフィキャ(ヒートダッシュ)", "h", 172, 0, ""], [16, 1, "66RP", "ラヌマスナ(1)", "", 98, 0, ""], [16, 1, "ヒート中66RP", "ラヌマスナ(1)", "h", 98, 0, "", {"ov": "ヒート中66RP"}], [17, 0, "ヒート中RP+LK", "フィタイン・ラトゥヴァタニ", "h", 179, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 51, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中RK", "トゥースマッシュ", "w", 114, 0, ""], [13, 0, "立ち途中LPRK", "ヴラメナ・ル", "w", 111, 0, "", {"he": 1}], [13, 0, "立ち途中LPRK6(ヒート中)", "ヴラメナ・ル(ヒートダッシュ)", "hw", 174, 0, ""], [15, 0, "立ち途中RP", "ダルカ・エンザナ", "w", 112, 0, ""], [15, 0, "9RKRK", "ヴァリキャ・ル", "", 90, 0, ""], [17, 0, "ヒート中RP+LK", "フィタイン・ラトゥヴァタニ", "h", 179, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}, "kunimitsu": {"src": "td", "stand": [[10, 0, "LPRPRP", "旋転斬", "", 7, 0, ""], [10, 0, "LPRPRP4", "旋転斬～背向け", "", 8, 0, ""], [10, 1, "66RKRP", "暴風雪", "", 100, 0, ""], [10, 0, "1LP", "シットジャブ", "", 54, 0, ""], [12, 0, "RKRP", "影撫で斬り～背向け", "", 20, 0, ""], [12, 0, "RPRP", "蓮宝刃", "", 11, 0, ""], [12, 0, "RPRPWP", "蓮宝刃～華遁", "", 12, 0, ""], [13, 0, "6RPLK", "凰針", "", 24, 0, ""], [13, 0, "236RP", "朧炎月", "", 104, 0, ""], [14, 0, "623RP", "天翔廻閃", "", 101, 0, ""], [14, 0, "ヒート中RP+LK", "蒼緋繚乱・空鏡", "h", -1, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK", "dm": "20,30", "sp": 9999, "at": "中,打投"}], [15, 0, "9LK", "綴隼", "", 88, 0, ""], [15, 0, "3RP", "上月斬", "", 35, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 54, 0, "", {"ov": "しゃがみ中LP"}], [10, 1, "66RKRP", "暴風雪", "", 100, 0, ""], [11, 0, "RK", "狐脚蹴", "w", 114, 0, ""], [12, 0, "LPLP", "時雨", "w", 109, 0, ""], [13, 0, "RPLP", "廻旋流刃", "w", 112, 0, "", {"he": 1}], [13, 0, "立ち途中RPLP6(ヒート中)", "廻旋流刃(ヒートダッシュ)", "hw", 184, 0, ""], [13, 1, "236RP", "朧炎月", "", 104, 0, ""], [14, 0, "623RP", "天翔廻閃", "", 101, 0, ""], [14, 0, "ヒート中RP+LK", "蒼緋繚乱・空鏡", "h", -1, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK", "dm": "20,30", "sp": 9999, "at": "中,打投"}], [15, 0, "LK", "楓", "w", 113, 0, ""], [15, 0, "9LK(or8LK)", "綴隼", "", 88, 0, ""]]}, "bob": {"src": "cu", "stand": [[10, 0, "LPLPRP", "ストレートロンデル", "", 6, 0, ""], [10, 0, "LPRP", "ワンツーパンチ", "", 7, 0, ""], [10, 0, "RPLP", "グランデステア(2)", "", 13, 0, ""], [10, 0, "1LP", "シットジャブ", "", 66, 0, ""], [12, 0, "6RPLK", "サークルワッパー", "", 31, 0, ""], [12, 0, "ヒート中6RPWP(ヒット or ガード時)LP", "アラカルト・フェデラルワッパー", "h", 0, 0, ""], [13, 0, "4RPRP", "コンビネーションビター(2)", "", 82, 0, ""], [14, 0, "2WPRPLP", "アピシウススペシャル", "", 63, 0, ""], [15, 1, "6n23LP", "ラングワッシャー", "", 161, 0, ""], [15, 0, "2RPRK", "コンビネーションバルド", "", 55, 0, ""], [16, 0, "8WPWP", "クラッカージャック", "", 109, 0, ""], [16, 0, "ヒート中RP+LK", "プリフィクス・ジャスティスビート", "h", 197, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}], [17, 0, "1WP", "アバスナイプ", "", 73, 0, ""]], "crouch": [[10, 0, "しゃがみ中LP", "シットジャブ", "c", 66, 0, "", {"ov": "しゃがみ中LP"}], [11, 0, "立ち途中RK", "トゥースマッシュ", "w", 138, 0, ""], [13, 0, "立ち途中LPRP", "スラッシュブッチャー", "w", 130, 0, "", {"he": 1}], [13, 0, "立ち途中LPLK", "ホットギモーヴ", "w", 131, 0, ""], [13, 0, "ヒート中立ち途中LPRP6", "スラッシュブッチャー(ヒートダッシュ)", "hw", 193, 0, "", {"ov": "立ち途中LPRP6(ヒート中)"}], [14, 0, "立ち途中RPLP", "スピナッチアッパー", "w", 133, 0, ""], [16, 0, "ヒート中RP+LK", "プリフィクス・ジャスティスビート", "h", 197, 0, "ヒートスマッシュ", {"ov": "ヒート中RP+LK"}]]}}/*PNDATA-END*/;

  /* ---------- 最適解の確反（「相手の技から調べる」で、指定した確反だけを出すキャラ） ----------
     BEST[キャラ].stand / .crouch = [{ g:[不利の下限,上限], r:"近"|"遠"（相手との距離）, l:[{ k:技データのk, fl:確反表の条件(あれば), ov:コマンド表示の上書き(あれば), c:同じk・同じ条件の行が複数あるときの表示コマンド(あれば), t:"立"|"し"（相手が立ち／しゃがみ状態のときだけ使える技のタグ）(あれば) }…] }…]
       stand＝ガード硬直差に「s」が付かない技（相手は立ち）／crouch＝「s」が付く技（相手は強制しゃがみ）。l の並びは、そのまま画面の並び（火力が高い・理想の順）
       g の範囲が重なる指定は足し合わせる（例：9LKRP は -17F から -39F まで、4WK は -18F から -39F まで）。同じ距離（r）の技は1つの枠にまとまる
     BEST[キャラ].strict = 1 のキャラは、立ち・しゃがみの両方で、指定のない不利フレームに「まだ設定されていません」と出し、自動の候補は混ぜない。
     strict が { stand:1 } や { crouch:1 } のキャラは、その状態だけ strict（もう一方は下の非 strict と同じ）。
     strict でないキャラ（状態）は、指定した不利フレームだけ最適解を出し、それ以外は従来どおり自動の候補（上位3つ）。ここにないキャラは全部自動
     シットジャブ（名前が「シットジャブ」の行と、発生10Fの2LP・1LP・しゃがみ中LP）は、指定があっても「しゃがみの表（s付きの技）」の -10F で「ほかに確反がない」ときしか出さない。立ちの表には出さない（bestFor / cands の isSit・sitOK）。ただし strict のしゃがみの表で、指定がシットジャブだけで外すと空になるとき（吉光の-10F）はそのまま出す
     いまの指定：全キャラ（熊・パンダ・ジャック8を除く）の「「s」付きの技・-10F＝しゃがみ中LP」／strict のキャラ：アリサ・飛鳥・ブライアン・アズセナ・アンナ・アーマーキング・ボブと、確反リストを指定した35キャラは、立ち・しゃがみの表を全不利フレーム分指定（クラウディオ・リディア・スティーブは立ちだけ strict、クライヴはしゃがみの-11Fだけ追加で strict なし）
     ヒートダッシュの表示は「〇〇6(ヒート中)」（確反表の ov）。コンボ集の始動技は「ヒート中〇〇6」なので、飛び先の照合は jkey で戻す */
  const BEST = /*PNBEST-START*/{"alisa":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1},{"k":1,"ov":"LPLP6"}]},{"g":[12,12],"r":"近","l":[{"k":8}]},{"g":[13,13],"r":"近","l":[{"k":13},{"k":16},{"k":14,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":30},{"k":31}]},{"g":[15,15],"r":"近","l":[{"k":94},{"k":72}]},{"g":[16,39],"r":"近","l":[{"k":43},{"k":94}]},{"g":[17,39],"r":"遠","l":[{"k":90}]},{"g":[18,39],"r":"遠","l":[{"k":76}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":120,"fl":"c","ov":"しゃがみ中LP"}]},{"g":[11,12],"r":"近","l":[{"k":137,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":125,"fl":"w"},{"k":126,"fl":"w"}]},{"g":[15,15],"r":"近","l":[{"k":94}]},{"g":[17,17],"r":"近","l":[{"k":129,"fl":"w"}]},{"g":[17,17],"r":"遠","l":[{"k":90}]},{"g":[18,39],"r":"近","l":[{"k":129,"fl":"w"}]}],"strict":1},"jin":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":8,"t":"立"},{"k":11,"t":"立"},{"k":12,"t":"立"},{"k":51,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":61,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":20},{"k":162,"fl":"h"},{"k":32},{"k":134,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":29,"t":"立"},{"k":132,"t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":50},{"k":74},{"k":132,"t":"立"}]},{"g":[15,15],"r":"遠","l":[{"k":63}]},{"g":[16,16],"r":"遠","l":[{"k":27},{"k":28},{"k":80},{"k":168,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":109,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":108,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":95,"fl":"w"},{"k":102,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":105,"fl":"w"}]},{"g":[15,15],"r":"近","l":[{"k":74},{"k":105,"fl":"w"}]},{"g":[16,16],"r":"近","l":[{"k":80},{"k":168,"fl":"h"},{"k":74},{"k":105,"fl":"w"}]},{"g":[17,39],"r":"近","l":[{"k":74},{"k":105,"fl":"w"}]}],"strict":1},"kazuya":{"stand":[{"g":[10,10],"r":"近","l":[{"k":2,"t":"立"},{"k":4,"t":"立"},{"k":39,"t":"し"},{"k":126,"fl":"h","t":"立"},{"k":127,"fl":"h","t":"立"}]},{"g":[11,11],"r":"近","l":[{"k":52,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":16}]},{"g":[13,13],"r":"近","l":[{"k":35},{"k":47},{"k":153,"fl":"h"},{"k":-1,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":117,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":25},{"k":151,"fl":"h"},{"k":27},{"k":117,"t":"立"}]},{"g":[16,16],"r":"近","l":[{"k":117,"t":"立"}]},{"g":[17,17],"r":"近","l":[{"k":79},{"k":136,"fl":"h"},{"k":160,"fl":"h"},{"k":117,"t":"立"}]},{"g":[18,39],"r":"近","l":[{"k":117,"t":"立"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":39,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":88,"fl":"w"}]},{"g":[13,15],"r":"近","l":[{"k":84,"fl":"w"}]},{"g":[16,16],"r":"近","l":[{"k":85,"fl":"w"},{"k":84,"fl":"w"}]},{"g":[17,17],"r":"近","l":[{"k":79},{"k":136,"fl":"h"},{"k":160,"fl":"h"},{"k":85,"fl":"w"},{"k":84,"fl":"w"}]},{"g":[18,39],"r":"近","l":[{"k":85,"fl":"w"},{"k":84,"fl":"w"}]}],"strict":1},"jun":{"stand":[{"g":[10,11],"r":"近","l":[{"k":4,"t":"立"},{"k":56,"t":"し"},{"k":99,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":9,"t":"立"}]},{"g":[13,14],"r":"近","l":[{"k":17},{"k":223,"fl":"h"},{"k":95},{"k":233,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":66}]},{"g":[16,16],"r":"近","l":[{"k":48},{"k":49}]},{"g":[17,17],"r":"近","l":[{"k":29},{"k":32},{"k":225,"fl":"h"},{"k":48},{"k":49}]},{"g":[18,39],"r":"近","l":[{"k":29},{"k":48},{"k":49}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":143,"fl":"c"},{"k":144,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":139,"fl":"w"},{"k":144,"fl":"c"}]},{"g":[13,13],"r":"近","l":[{"k":137,"fl":"w"},{"k":233,"fl":"h"}]},{"g":[14,15],"r":"近","l":[{"k":138,"fl":"w"}]},{"g":[16,16],"r":"近","l":[{"k":106},{"k":138,"fl":"w"}]},{"g":[17,17],"r":"近","l":[{"k":138,"fl":"w"}]},{"g":[18,18],"r":"近","l":[{"k":142,"fl":"w"},{"k":138,"fl":"w"}]},{"g":[19,39],"r":"近","l":[{"k":138,"fl":"w"}]}],"strict":1},"paul":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":4,"t":"立"},{"k":62,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":61},{"k":68}]},{"g":[13,13],"r":"近","l":[{"k":18,"t":"立"},{"k":177,"fl":"h","t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":73,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":37},{"k":86},{"k":87},{"k":92},{"k":150},{"k":183,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":37},{"k":92}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":62,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":116,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":115,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":118,"fl":"c"},{"k":120,"fl":"c"},{"k":123,"fl":"hc"}]},{"g":[15,15],"r":"近","l":[{"k":86},{"k":87},{"k":92},{"k":113,"fl":"w"}]},{"g":[16,39],"r":"近","l":[{"k":92},{"k":113,"fl":"w"}]}],"strict":1},"law":{"stand":[{"g":[10,11],"r":"近","l":[{"k":4,"t":"立"},{"k":5,"t":"立"},{"k":6,"t":"立"},{"k":69,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":26,"t":"立"},{"k":101,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":46}]},{"g":[14,14],"r":"近","l":[{"k":36},{"k":96},{"k":215,"fl":"h"}]},{"g":[15,39],"r":"近","l":[{"k":50},{"k":112}]},{"g":[16,16],"r":"遠","l":[{"k":86}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":69,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":139,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":136,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":215,"fl":"h"}]},{"g":[15,39],"r":"近","l":[{"k":137,"fl":"w"}]}],"strict":1},"king":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":8,"t":"立"},{"k":48,"t":"し"}]},{"g":[12,13],"r":"近","l":[{"k":74,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":36},{"k":77,"t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":89}]},{"g":[15,15],"r":"遠","l":[{"k":23},{"k":198,"fl":"h"}]},{"g":[16,39],"r":"遠","l":[{"k":82},{"k":23},{"k":198,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":48,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":118,"fl":"w"}]},{"g":[12,12],"r":"近","l":[{"k":118,"fl":"w"},{"k":255,"t":"し"},{"k":256,"t":"し"},{"k":257,"t":"し"}]},{"g":[13,13],"r":"近","l":[{"k":118,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":115,"fl":"w"},{"k":116,"fl":"w"}]},{"g":[15,39],"r":"近","l":[{"k":89},{"k":124,"fl":"c"}]}],"strict":1},"lars":{"stand":[{"g":[10,11],"r":"近","l":[{"k":4,"t":"立"},{"k":8,"t":"立"},{"k":44,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":24,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":24,"t":"立"},{"k":32},{"k":34},{"k":35}]},{"g":[14,14],"r":"近","l":[{"k":93}]},{"g":[15,15],"r":"近","l":[{"k":30}]},{"g":[16,16],"r":"近","l":[{"k":78},{"k":30}]},{"g":[17,17],"r":"近","l":[{"k":15},{"k":163,"fl":"h"},{"k":70},{"k":30}]},{"g":[18,39],"r":"近","l":[{"k":30}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":44,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":107,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":102,"fl":"w"},{"k":103,"fl":"w"},{"k":104,"fl":"w"}]},{"g":[15,15],"r":"近","l":[{"k":97,"fl":"w"},{"k":98,"fl":"w"}]},{"g":[16,16],"r":"近","l":[{"k":78},{"k":97,"fl":"w"},{"k":98,"fl":"w"}]},{"g":[17,39],"r":"近","l":[{"k":97,"fl":"w"},{"k":98,"fl":"w"}]}],"strict":1},"xiaoyu":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":3,"t":"立"},{"k":4,"t":"立"},{"k":5,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":26}]},{"g":[13,13],"r":"近","l":[{"k":61},{"k":244,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":10,"t":"立"},{"k":33},{"k":35}]},{"g":[15,15],"r":"近","l":[{"k":62},{"k":252,"fl":"h"}]},{"g":[16,16],"r":"近","l":[{"k":68},{"k":62}]},{"g":[17,39],"r":"近","l":[{"k":62}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":112,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":111,"fl":"w"}]},{"g":[12,13],"r":"近","l":[{"k":102,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":98,"fl":"w"}]},{"g":[15,15],"r":"近","l":[{"k":252,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":68}]}],"strict":1},"nina":{"stand":[{"g":[10,10],"r":"近","l":[{"k":1,"t":"立"},{"k":2,"t":"立"},{"k":8,"t":"立"},{"k":75,"t":"し"}]},{"g":[11,11],"r":"近","l":[{"k":92},{"k":213,"fl":"h","t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":95,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":52},{"k":53},{"k":54}]},{"g":[14,14],"r":"近","l":[{"k":39,"t":"立"},{"k":48},{"k":211,"fl":"h"},{"k":107,"t":"立"},{"k":108,"fl":"h","t":"立"}]},{"g":[15,17],"r":"近","l":[{"k":56},{"k":109}]},{"g":[18,39],"r":"近","l":[{"k":93},{"k":113},{"k":56},{"k":109}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":75,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":153,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":149,"fl":"w"},{"k":150,"fl":"hw"},{"k":152,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":56,"fl":"c"}]},{"g":[15,17],"r":"近","l":[{"k":151,"fl":"w"}]},{"g":[18,39],"r":"近","l":[{"k":93,"fl":"w"},{"k":113},{"k":151,"fl":"w"}]}],"strict":1},"asuka":{"strict":1,"stand":[{"g":[10,11],"r":"近","l":[{"k":7,"t":"立"},{"k":58,"t":"し"}]},{"g":[12,13],"r":"近","l":[{"k":19,"t":"立"},{"k":55}]},{"g":[14,14],"r":"近","l":[{"k":21},{"k":67},{"k":68},{"k":102,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":52}]},{"g":[16,16],"r":"近","l":[{"k":25},{"k":52}]},{"g":[17,17],"r":"近","l":[{"k":36},{"k":38},{"k":52}]},{"g":[18,39],"r":"近","l":[{"k":36},{"k":52}]},{"g":[15,15],"r":"遠","l":[{"k":45,"t":"立"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":58,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":131,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":128,"fl":"w"},{"k":129,"fl":"w"}]},{"g":[14,17],"r":"近","l":[{"k":126,"fl":"w"},{"k":102,"t":"立"}]},{"g":[18,39],"r":"近","l":[{"k":130,"fl":"w"}]}]},"leroy":{"stand":[{"g":[10,11],"r":"近","l":[{"k":8,"t":"立"},{"k":49,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":10,"t":"立"},{"k":78,"fl":"h"}]},{"g":[13,13],"r":"近","l":[{"k":37}]},{"g":[14,14],"r":"近","l":[{"k":21,"t":"立"},{"k":164,"fl":"h","t":"立"},{"k":91}]},{"g":[15,15],"r":"近","l":[{"k":42},{"k":175,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":42}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":49,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":107,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":105,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":91}]},{"g":[15,15],"r":"近","l":[{"k":106,"fl":"w"},{"k":175,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":106,"fl":"w"}]}],"strict":1},"lili":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":3,"t":"立"},{"k":9,"t":"立"},{"k":60,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":17},{"k":24,"t":"立"}]},{"g":[13,14],"r":"近","l":[{"k":40},{"k":41}]},{"g":[15,39],"r":"近","l":[{"k":80}]},{"g":[15,15],"r":"遠","l":[{"k":12},{"k":178,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":60,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":121,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":113,"fl":"w"},{"k":114,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":122,"fl":"c"}]},{"g":[15,15],"r":"近","l":[{"k":80},{"k":118,"fl":"w"}]},{"g":[16,39],"r":"近","l":[{"k":116,"fl":"w"},{"k":80}]}],"strict":1},"hwoarang":{"stand":[{"g":[10,10],"r":"近","l":[{"k":1,"t":"立"},{"k":4,"t":"立"},{"k":5,"t":"立"},{"k":6,"t":"立"},{"k":53,"t":"し"}]},{"g":[11,12],"r":"近","l":[{"k":26,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":42},{"k":52},{"k":231,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":82}]},{"g":[15,15],"r":"近","l":[{"k":43}]},{"g":[16,39],"r":"近","l":[{"k":66},{"k":43}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":53,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":101,"fl":"w"}]},{"g":[12,13],"r":"近","l":[{"k":95,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":82},{"k":99,"fl":"w"}]},{"g":[15,39],"r":"近","l":[{"k":97,"fl":"w"}]}],"strict":1},"bryan":{"strict":1,"stand":[{"g":[10,11],"r":"近","l":[{"k":7,"t":"立"},{"k":18,"t":"立"},{"k":61,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":28,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":108},{"k":56}]},{"g":[14,14],"r":"近","l":[{"k":126,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":43},{"k":44},{"k":126,"t":"立"}]},{"g":[16,39],"r":"近","l":[{"k":126,"t":"立"}]},{"g":[15,39],"r":"遠","l":[{"k":119},{"k":201,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":61,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":136,"fl":"w"}]},{"g":[12,12],"r":"近","l":[{"k":134,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":139,"fl":"c"},{"k":108},{"k":170,"fl":"s"}]},{"g":[15,18],"r":"近","l":[{"k":131,"fl":"w"}]},{"g":[19,39],"r":"近","l":[{"k":132,"fl":"w"},{"k":131,"fl":"w"}]}]},"claudio":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":46,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":23,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":45}]},{"g":[14,14],"r":"近","l":[{"k":10},{"k":137,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":32},{"k":80}]},{"g":[16,16],"r":"近","l":[{"k":80}]},{"g":[17,17],"r":"近","l":[{"k":61},{"k":138,"fl":"h"},{"k":80}]},{"g":[18,39],"r":"近","l":[{"k":80}]},{"g":[16,16],"r":"遠","l":[{"k":28},{"k":126,"fl":"s"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":46,"fl":"c","ov":"しゃがみ中LP"}]}],"strict":{"stand":1}},"azucena":{"strict":1,"stand":[{"g":[10,11],"r":"近","l":[{"k":2,"t":"立"},{"k":3,"t":"立"},{"k":53,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":15,"t":"立"},{"k":186,"t":"し"}]},{"g":[13,13],"r":"近","l":[{"k":34}]},{"g":[14,14],"r":"近","l":[{"k":13}]},{"g":[15,39],"r":"近","l":[{"k":39}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":53,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":89,"fl":"w"}]},{"g":[12,14],"r":"近","l":[{"k":89,"fl":"w"},{"k":186,"t":"し"}]},{"g":[15,39],"r":"近","l":[{"k":86,"fl":"w"}]}]},"raven":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":3,"t":"立"},{"k":6,"t":"立"},{"k":7,"t":"立"},{"k":8,"t":"立"},{"k":9,"t":"立"},{"k":49,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":15,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":54},{"k":55}]},{"g":[14,14],"r":"近","l":[{"k":25},{"k":209,"fl":"h"},{"k":37},{"k":38,"fl":"h"},{"k":70}]},{"g":[15,15],"r":"近","l":[{"k":28},{"k":33},{"k":46}]},{"g":[16,39],"r":"近","l":[{"k":39}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":49,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":111,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":111,"fl":"w"},{"k":107,"fl":"w"}]},{"g":[14,39],"r":"近","l":[{"k":106,"fl":"w"}]}],"strict":1},"yoshimitsu":{"stand":[{"g":[10,10],"r":"近","l":[{"k":1,"t":"立"},{"k":2,"fl":"h","t":"立"},{"k":332,"fl":"s","t":"立"},{"k":357,"fl":"s","t":"し"}]},{"g":[11,11],"r":"近","l":[{"k":7,"t":"立"},{"k":8,"t":"立"},{"k":335,"fl":"s"}]},{"g":[12,12],"r":"近","l":[{"k":67}]},{"g":[13,13],"r":"近","l":[{"k":60}]},{"g":[14,14],"r":"近","l":[{"k":133},{"k":133,"fl":"s"},{"k":409,"fl":"h"},{"k":412,"fl":"hs"}]},{"g":[15,15],"r":"近","l":[{"k":61},{"k":61,"fl":"s"},{"k":144},{"k":144,"fl":"s"}]},{"g":[16,16],"r":"近","l":[{"k":61},{"k":144}]},{"g":[17,17],"r":"近","l":[{"k":190},{"k":61},{"k":144}]},{"g":[18,39],"r":"近","l":[{"k":61},{"k":144}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":213,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":208,"fl":"w"},{"k":209,"fl":"w"},{"k":210,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":201,"fl":"w"}]},{"g":[15,39],"r":"近","l":[{"k":144},{"k":205,"fl":"w"}]},{"g":[17,17],"r":"遠","l":[{"k":190}]}],"strict":1},"steve":{"stand":[{"g":[10,11],"r":"近","l":[{"k":9,"t":"立"},{"k":10,"t":"立"},{"k":11,"t":"立"},{"k":12,"t":"立"},{"k":13,"t":"立"},{"k":78,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":30,"t":"立"},{"k":31,"t":"立"},{"k":33,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":55},{"k":87,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":37},{"k":253,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":49},{"k":111}]},{"g":[16,16],"r":"近","l":[{"k":81},{"k":82},{"k":264,"fl":"h"}]},{"g":[17,39],"r":"近","l":[{"k":101}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":78,"fl":"c","ov":"しゃがみ中LP"}]}],"strict":{"stand":1}},"dragunov":{"stand":[{"g":[10,11],"r":"近","l":[{"k":6,"t":"立"},{"k":12,"t":"立"},{"k":16,"t":"立"},{"k":64,"t":"し"}]},{"g":[12,13],"r":"近","l":[{"k":23,"t":"立"},{"k":205,"t":"し"}]},{"g":[14,14],"r":"近","l":[{"k":38,"t":"立"},{"k":93},{"k":186,"fl":"h"},{"k":99,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":48}]},{"g":[16,39],"r":"近","l":[{"k":42,"t":"立"},{"k":48}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":64,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":132,"fl":"w"}]},{"g":[12,13],"r":"近","l":[{"k":128,"fl":"w"},{"k":129,"fl":"w"},{"k":134,"fl":"w","c":"立ち途中WP"},{"k":188,"fl":"hw"},{"k":205,"t":"し"}]},{"g":[14,14],"r":"近","l":[{"k":99,"t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":130,"fl":"w"}]}],"strict":1},"leo":{"stand":[{"g":[10,10],"r":"近","l":[{"k":1,"t":"立"},{"k":7,"t":"立"},{"k":47,"t":"し"}]},{"g":[11,12],"r":"近","l":[{"k":10,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":93,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":21,"t":"立"},{"k":22,"t":"立"},{"k":23,"t":"立"},{"k":71},{"k":194,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":34},{"k":103}]},{"g":[16,16],"r":"近","l":[{"k":50},{"k":203,"fl":"h"},{"k":34},{"k":103}]},{"g":[17,39],"r":"近","l":[{"k":34},{"k":103}]},{"g":[15,15],"r":"遠","l":[{"k":107}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":47,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":127,"fl":"w"},{"k":196,"fl":"hw"}]},{"g":[13,14],"r":"近","l":[{"k":93},{"k":122,"fl":"w"},{"k":123,"fl":"w"},{"k":128,"fl":"w"}]},{"g":[15,15],"r":"近","l":[{"k":103},{"k":107},{"k":120,"fl":"w"}]},{"g":[16,39],"r":"近","l":[{"k":120,"fl":"w"}]}],"strict":1},"shaheen":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":9,"t":"立"},{"k":10,"t":"立"},{"k":44,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":19,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":14,"t":"立"},{"k":73,"fl":"h","t":"立"},{"k":74,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":48},{"k":120,"fl":"h"},{"k":72,"t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":30},{"k":68}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":44,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":83,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":82,"fl":"w"}]},{"g":[15,15],"r":"近","l":[{"k":68}]},{"g":[16,39],"r":"近","l":[{"k":79,"fl":"w"},{"k":68}]}],"strict":1},"feng":{"stand":[{"g":[10,11],"r":"近","l":[{"k":2,"t":"立"},{"k":3,"t":"立"},{"k":4,"t":"立"},{"k":5,"t":"立"},{"k":47,"t":"し"},{"k":73,"fl":"h","t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":83},{"k":85,"fl":"h"}]},{"g":[13,14],"r":"近","l":[{"k":87},{"k":187,"fl":"h"}]},{"g":[15,20],"r":"近","l":[{"k":97}]},{"g":[21,21],"r":"近","l":[{"k":28},{"k":97}]},{"g":[22,39],"r":"近","l":[{"k":97}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":47,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":123,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":117,"fl":"w"},{"k":120,"fl":"w"},{"k":191,"fl":"hw"}]},{"g":[15,17],"r":"近","l":[{"k":122,"fl":"w"}]},{"g":[18,18],"r":"近","l":[{"k":127,"fl":"c"},{"k":122,"fl":"w"}]},{"g":[19,39],"r":"近","l":[{"k":122,"fl":"w"}]}],"strict":1},"zafina":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":4,"t":"立"},{"k":6,"t":"立"},{"k":61,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":222,"fl":"h"}]},{"g":[13,13],"r":"近","l":[{"k":36},{"k":46},{"k":216,"fl":"h"},{"k":48}]},{"g":[14,14],"r":"近","l":[{"k":26}]},{"g":[15,15],"r":"近","l":[{"k":40}]},{"g":[16,16],"r":"近","l":[{"k":37}]},{"g":[17,17],"r":"近","l":[{"k":92},{"k":37}]},{"g":[18,39],"r":"近","l":[{"k":37}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":61,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":114,"fl":"w"}]},{"g":[12,14],"r":"近","l":[{"k":112,"fl":"w"},{"k":222,"fl":"h"}]},{"g":[15,16],"r":"近","l":[{"k":109,"fl":"w"}]},{"g":[17,17],"r":"近","l":[{"k":109,"fl":"w"},{"k":92}]},{"g":[18,18],"r":"近","l":[{"k":110,"fl":"w"},{"k":109,"fl":"w"}]},{"g":[19,39],"r":"近","l":[{"k":109,"fl":"w"},{"k":110,"fl":"w"}]}],"strict":1},"lee":{"stand":[{"g":[10,10],"r":"近","l":[{"k":6,"t":"立"},{"k":8,"t":"立"},{"k":14,"t":"立"},{"k":78,"t":"し"}]},{"g":[11,12],"r":"近","l":[{"k":38},{"k":40},{"k":240,"fl":"h"}]},{"g":[13,13],"r":"近","l":[{"k":75},{"k":244,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":46},{"k":105,"t":"立"},{"k":109,"t":"立"},{"k":111,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":52},{"k":53},{"k":66},{"k":137},{"k":150},{"k":246,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":52},{"k":53},{"k":66},{"k":137}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":78,"fl":"c"},{"k":168,"fl":"w"}]},{"g":[11,12],"r":"近","l":[{"k":78,"fl":"c"},{"k":168,"fl":"w"},{"k":176,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":161,"fl":"w"},{"k":261,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":164,"fl":"w"},{"k":166,"fl":"w"}]},{"g":[15,39],"r":"近","l":[{"k":137},{"k":164,"fl":"w"}]}],"strict":1},"devil-jin":{"stand":[{"g":[10,11],"r":"近","l":[{"k":2,"t":"立"},{"k":4,"t":"立"},{"k":47,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":56,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":30},{"k":124,"c":"6n3RP","t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":61,"t":"立"},{"k":162,"fl":"h","t":"立"},{"k":124,"c":"6n23RP","t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":46},{"k":124,"c":"6n23RP","t":"立"}]},{"g":[16,39],"r":"遠","l":[{"k":75},{"k":76,"fl":"h"},{"k":78},{"k":168,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":47,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":102,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":95,"fl":"w"},{"k":96,"fl":"w"},{"k":97,"fl":"w"}]},{"g":[14,39],"r":"近","l":[{"k":98,"fl":"w"}]},{"g":[16,39],"r":"遠","l":[{"k":75},{"k":76,"fl":"h"},{"k":78},{"k":168,"fl":"h"}]}],"strict":1},"victor":{"stand":[{"g":[10,11],"r":"近","l":[{"k":2,"t":"立"},{"k":3,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":-1,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":68},{"k":70}]},{"g":[14,14],"r":"近","l":[{"k":27},{"k":150,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":34},{"k":77}]},{"g":[16,39],"r":"近","l":[{"k":34}]},{"g":[17,17],"r":"遠","l":[{"k":62}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":95,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":52},{"k":92,"fl":"w"}]},{"g":[12,12],"r":"近","l":[{"k":92,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":68},{"k":70},{"k":93,"fl":"w"},{"k":94,"fl":"w"}]},{"g":[15,39],"r":"近","l":[{"k":89,"fl":"w"}]}],"strict":1},"reina":{"stand":[{"g":[10,11],"r":"近","l":[{"k":2,"t":"立"},{"k":3,"t":"立"},{"k":4,"t":"立"},{"k":5,"t":"立"},{"k":6,"t":"立"},{"k":69,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":11},{"k":25}]},{"g":[13,13],"r":"近","l":[{"k":58},{"k":215,"fl":"h"},{"k":105},{"k":-1,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":17},{"k":154,"t":"立"}]},{"g":[15,16],"r":"近","l":[{"k":59},{"k":154,"t":"立"}]},{"g":[17,17],"r":"近","l":[{"k":96},{"k":59},{"k":154,"t":"立"}]},{"g":[18,39],"r":"近","l":[{"k":59},{"k":154,"t":"立"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":69,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":117,"fl":"w"},{"k":118,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":105},{"k":112,"fl":"w"},{"k":-1,"t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":-1,"t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":123,"fl":"c"}]}],"strict":1},"eddy":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":2,"t":"立"},{"k":38,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":10,"t":"立"},{"k":12,"t":"立"},{"k":199,"t":"し"},{"k":-1,"t":"し"}]},{"g":[13,13],"r":"近","l":[{"k":33}]},{"g":[14,14],"r":"近","l":[{"k":73},{"k":76},{"k":184,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":35},{"k":62}]},{"g":[16,39],"r":"近","l":[{"k":35}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":38,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":110,"fl":"w"}]},{"g":[12,12],"r":"近","l":[{"k":110,"fl":"w"},{"k":199,"t":"し"},{"k":-1,"t":"し"}]},{"g":[13,13],"r":"近","l":[{"k":105,"fl":"w","t":"立"},{"k":106,"fl":"w","t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":73},{"k":76},{"k":184,"fl":"h"},{"k":105,"fl":"w","t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":107,"fl":"w"},{"k":105,"fl":"w","t":"立"}]}],"strict":1},"lidia":{"stand":[{"g":[10,10],"r":"近","l":[{"k":1,"t":"立"},{"k":2,"t":"立"},{"k":60,"t":"し"}]},{"g":[11,11],"r":"近","l":[{"k":7,"t":"立"},{"k":8,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":27,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":44}]},{"g":[14,14],"r":"近","l":[{"k":39,"t":"立"},{"k":243,"fl":"h"},{"k":41},{"k":245,"fl":"h"},{"k":110},{"k":110,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":10,"t":"立"},{"k":11,"t":"立"},{"k":108}]},{"g":[16,39],"r":"近","l":[{"k":108},{"k":10,"t":"立"},{"k":11,"t":"立"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":60,"fl":"c","ov":"しゃがみ中LP"}]}],"strict":{"stand":1}},"heihachi":{"stand":[{"g":[10,10],"r":"近","l":[{"k":2,"t":"立"},{"k":4,"t":"立"},{"k":5,"t":"立"},{"k":66,"t":"し"},{"k":179,"fl":"s","t":"立"}]},{"g":[11,11],"r":"近","l":[{"k":2,"t":"立"},{"k":4,"t":"立"},{"k":5,"t":"立"},{"k":66,"t":"し"},{"k":179,"fl":"s","t":"立"},{"k":17,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":25},{"k":38,"t":"立"},{"k":181,"fl":"s"}]},{"g":[13,13],"r":"近","l":[{"k":42},{"k":44},{"k":45},{"k":47},{"k":53},{"k":144,"c":"6n3RP","t":"立"},{"k":182,"fl":"s"}]},{"g":[14,14],"r":"近","l":[{"k":71},{"k":79,"t":"立"},{"k":80,"fl":"h","t":"立"},{"k":104},{"k":200,"fl":"h"},{"k":144,"c":"6n23RP","t":"立"},{"k":182,"fl":"s"}]},{"g":[15,18],"r":"近","l":[{"k":50},{"k":51},{"k":144,"c":"6n23RP","t":"立"},{"k":182,"fl":"s"}]},{"g":[19,19],"r":"近","l":[{"k":90},{"k":196,"fl":"h"},{"k":50},{"k":51},{"k":144,"c":"6n23RP","t":"立"},{"k":182,"fl":"s"}]},{"g":[20,39],"r":"近","l":[{"k":50},{"k":51},{"k":144,"c":"6n23RP","t":"立"},{"k":182,"fl":"s"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":117,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":114,"fl":"w"},{"k":115,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":109,"fl":"w"}]},{"g":[14,14],"r":"近","l":[{"k":104},{"k":200,"fl":"h"}]},{"g":[15,18],"r":"近","l":[{"k":119,"fl":"c"}]},{"g":[19,19],"r":"近","l":[{"k":90},{"k":196,"fl":"h"},{"k":119,"fl":"c"}]},{"g":[20,39],"r":"近","l":[{"k":119,"fl":"c"}]}],"strict":1},"clive":{"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":2,"t":"立"},{"k":3,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":6,"t":"立"},{"k":7,"t":"立"},{"k":23,"t":"立"},{"k":24,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":26},{"k":185,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":54},{"k":55}]},{"g":[15,39],"r":"近","l":[{"k":58}]},{"g":[16,39],"r":"遠","l":[{"k":43},{"k":189,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":114,"fl":"c","ov":"しゃがみ中LP"}]},{"g":[11,11],"r":"近","l":[{"k":66,"t":"し"}]}],"strict":{"stand":1}},"anna":{"strict":1,"stand":[{"g":[10,12],"r":"近","l":[{"k":1,"t":"立"},{"k":14,"t":"立"},{"k":52,"t":"し"}]},{"g":[13,13],"r":"近","l":[{"k":32},{"k":80,"t":"立"},{"k":85,"t":"立"},{"k":124,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":18},{"k":26},{"k":28,"t":"立"}]},{"g":[15,39],"r":"近","l":[{"k":37}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":52,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":131,"fl":"w"},{"k":132,"fl":"w"}]},{"g":[13,15],"r":"近","l":[{"k":129,"fl":"w"},{"k":124,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":130,"fl":"w"}]}]},"fahkumram":{"stand":[{"g":[10,11],"r":"近","l":[{"k":2,"t":"立"},{"k":13,"t":"立"},{"k":93,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":15,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":18},{"k":167,"fl":"s"}]},{"g":[14,14],"r":"近","l":[{"k":100,"t":"立"},{"k":98},{"k":112},{"k":184,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":50},{"k":51,"fl":"h"},{"k":61},{"k":180,"fl":"h"},{"k":70}]},{"g":[16,39],"r":"近","l":[{"k":70}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":93,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":137,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":128,"fl":"w"},{"k":186,"fl":"hw"}]},{"g":[14,14],"r":"近","l":[{"k":112},{"k":184,"fl":"h"},{"k":130,"fl":"w"}]},{"g":[15,39],"r":"近","l":[{"k":136,"fl":"w"}]}],"strict":1},"armorking":{"strict":1,"stand":[{"g":[10,11],"r":"近","l":[{"k":1,"t":"立"},{"k":5,"t":"立"},{"k":48,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":68,"t":"立"},{"k":69,"t":"立"},{"k":45},{"k":205,"t":"し"},{"k":207,"t":"し"}]},{"g":[13,13],"r":"近","l":[{"k":11,"t":"立"},{"k":68,"t":"立"},{"k":69,"t":"立"},{"k":163,"c":"6n3RP","t":"立"}]},{"g":[14,14],"r":"近","l":[{"k":163,"c":"6n23RP","t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":83},{"k":85},{"k":163,"c":"6n23RP","t":"立"}]},{"g":[16,39],"r":"近","l":[{"k":85},{"k":163,"c":"6n23RP","t":"立"}]},{"g":[13,13],"r":"遠","l":[{"k":38}]},{"g":[15,15],"r":"遠","l":[{"k":27},{"k":26,"fl":"h"}]},{"g":[16,39],"r":"遠","l":[{"k":73,"t":"立"},{"k":27},{"k":26,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":48,"fl":"c"}]},{"g":[11,11],"r":"近","l":[{"k":116,"fl":"w"}]},{"g":[12,12],"r":"近","l":[{"k":116,"fl":"w"},{"k":205,"t":"し"},{"k":207,"t":"し"}]},{"g":[13,14],"r":"近","l":[{"k":115,"fl":"w"},{"k":114,"fl":"hw"}]},{"g":[15,39],"r":"近","l":[{"k":83},{"k":85},{"k":108,"fl":"w"}]}]},"miary":{"stand":[{"g":[10,10],"r":"近","l":[{"k":2,"t":"立"},{"k":3,"t":"立"},{"k":4,"t":"立"},{"k":51,"t":"し"}]},{"g":[11,11],"r":"近","l":[{"k":8,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":66,"t":"立"}]},{"g":[13,14],"r":"近","l":[{"k":14},{"k":170,"fl":"h"},{"k":38},{"k":39},{"k":42},{"k":68,"t":"立"},{"k":69,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":19},{"k":172,"fl":"h"},{"k":44},{"k":90}]},{"g":[16,16],"r":"近","l":[{"k":98},{"k":98,"fl":"h"},{"k":44},{"k":90}]},{"g":[17,39],"r":"近","l":[{"k":44},{"k":90}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":51,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":114,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":111,"fl":"w"},{"k":174,"fl":"hw"}]},{"g":[15,39],"r":"近","l":[{"k":112,"fl":"w"},{"k":90}]}],"strict":1},"kunimitsu":{"stand":[{"g":[10,11],"r":"近","l":[{"k":7,"t":"立"},{"k":8,"t":"立"},{"k":54,"t":"し"},{"k":100}]},{"g":[12,12],"r":"近","l":[{"k":11,"t":"立"},{"k":12,"t":"立"},{"k":20,"t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":24,"t":"立"},{"k":104}]},{"g":[14,14],"r":"近","l":[{"k":101},{"k":-1,"fl":"h"}]},{"g":[15,39],"r":"近","l":[{"k":35},{"k":88}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":54,"fl":"c"},{"k":100}]},{"g":[11,11],"r":"近","l":[{"k":114,"fl":"w"}]},{"g":[12,12],"r":"近","l":[{"k":109,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":112,"fl":"w"},{"k":184,"fl":"hw"}]},{"g":[14,14],"r":"近","l":[{"k":101},{"k":-1,"fl":"h"}]},{"g":[15,39],"r":"近","l":[{"k":88},{"k":113,"fl":"w"}]}],"strict":1},"bob":{"strict":1,"stand":[{"g":[10,11],"r":"近","l":[{"k":6,"t":"立"},{"k":66,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":31,"t":"立"},{"k":0,"fl":"h","t":"立"}]},{"g":[13,13],"r":"近","l":[{"k":31,"t":"立"},{"k":0,"fl":"h","t":"立"},{"k":82,"t":"し"}]},{"g":[14,14],"r":"近","l":[{"k":63,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":63,"t":"立"},{"k":161},{"k":55}]},{"g":[16,16],"r":"近","l":[{"k":109},{"k":161}]},{"g":[17,39],"r":"近","l":[{"k":73},{"k":109},{"k":161}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":66,"fl":"c"}]},{"g":[11,12],"r":"近","l":[{"k":138,"fl":"w"}]},{"g":[13,13],"r":"近","l":[{"k":130,"fl":"w"},{"k":131,"fl":"w"},{"k":193,"fl":"hw"}]},{"g":[14,39],"r":"近","l":[{"k":133,"fl":"w"}]}]},"jack8":{"stand":[{"g":[10,10],"r":"近","l":[{"k":35,"t":"立"},{"k":71,"t":"し"},{"k":271,"fl":"h","t":"立"}]},{"g":[11,11],"r":"近","l":[{"k":5,"t":"立"},{"k":10,"t":"立"}]},{"g":[12,12],"r":"近","l":[{"k":1,"t":"立"},{"k":2,"t":"立"},{"k":289,"t":"し"},{"k":291,"t":"し"}]},{"g":[13,13],"r":"近","l":[{"k":64}]},{"g":[14,14],"r":"近","l":[{"k":30}]},{"g":[15,39],"r":"近","l":[{"k":56},{"k":59}]},{"g":[14,14],"r":"遠","l":[{"k":108},{"k":265,"fl":"h"}]}],"crouch":[{"g":[10,10],"r":"近","l":[{"k":271,"fl":"h","t":"立"}]},{"g":[11,11],"r":"近","l":[{"k":167,"fl":"w"}]},{"g":[12,13],"r":"近","l":[{"k":194,"fl":"c"},{"k":289},{"k":291}]},{"g":[14,14],"r":"近","l":[{"k":161,"fl":"w"},{"k":162,"fl":"w"}]},{"g":[15,39],"r":"近","l":[{"k":159,"fl":"w"}]}],"strict":1},"kuma":{"stand":[{"g":[10,11],"r":"近","l":[{"k":5,"t":"立"},{"k":29,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":14,"t":"立"},{"k":28}]},{"g":[13,13],"r":"近","l":[{"k":11},{"k":190,"fl":"h"},{"k":209,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":34},{"k":37,"t":"立"},{"k":38,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":25},{"k":204,"fl":"h"}]},{"g":[16,16],"r":"近","l":[{"k":74},{"k":25}]},{"g":[17,39],"r":"近","l":[{"k":25}]}],"crouch":[{"g":[11,12],"r":"近","l":[{"k":108,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":100,"fl":"w"},{"k":101,"fl":"w"},{"k":209,"fl":"h"}]},{"g":[15,15],"r":"近","l":[{"k":106,"fl":"w"},{"k":204,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":106,"fl":"w"}]}],"strict":1},"panda":{"stand":[{"g":[10,11],"r":"近","l":[{"k":5,"t":"立"},{"k":29,"t":"し"}]},{"g":[12,12],"r":"近","l":[{"k":14,"t":"立"},{"k":28}]},{"g":[13,13],"r":"近","l":[{"k":11},{"k":173,"fl":"h"},{"k":189,"fl":"h"}]},{"g":[14,14],"r":"近","l":[{"k":34},{"k":37,"t":"立"},{"k":38,"t":"立"}]},{"g":[15,15],"r":"近","l":[{"k":25},{"k":189,"fl":"h"}]},{"g":[16,16],"r":"近","l":[{"k":74},{"k":25}]},{"g":[17,39],"r":"近","l":[{"k":25}]}],"crouch":[{"g":[11,12],"r":"近","l":[{"k":108,"fl":"w"}]},{"g":[13,14],"r":"近","l":[{"k":100,"fl":"w"},{"k":101,"fl":"w"}]},{"g":[15,15],"r":"近","l":[{"k":106,"fl":"w"},{"k":189,"fl":"h"}]},{"g":[16,39],"r":"近","l":[{"k":106,"fl":"w"}]}],"strict":1}}/*PNBEST-END*/;

  const KEY = "tekken-punish-v1";
  const FRAMES = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 25];
  const MINS = [10, 12, 14, 16, 18, 20, 21, 25, 30, 35];
  const MAXG = 39;           // 相手の技から調べる：ガード硬直差が -40F 以上（マイナスがこれより大きい）の技は出さない
  const PAGE_N = 200;
  let pref = { mode: "mine", opp: "", min: 10, launch: false, nocond: false, stance: "stand", cap: 0, sort: "asc", chk: {} };
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "{}");
    if (p.mode === "opp") pref.mode = "opp";
    if (typeof p.opp === "string") pref.opp = p.opp;
    if (MINS.includes(p.min)) pref.min = p.min;
    if (p.launch) pref.launch = true;
    if (p.nocond) pref.nocond = true;
    if (p.stance === "crouch") pref.stance = "crouch";
    if (FRAMES.includes(p.cap)) pref.cap = p.cap;
    if (p.sort === "desc") pref.sort = "desc";
    if (p.chk && typeof p.chk === "object") pref.chk = p.chk;
  } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(pref)); } catch (_) {} };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nrm = s => String(s).normalize("NFKC").toLowerCase().replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)).replace(/[\s・･]/g, "");
  const charOf = id => CHARACTERS.find(c => c.id === id);
  let shown = false, dirty = true, limit = PAGE_N, qText = "";

  root.innerHTML = "<style>" + PN_CSS + `</style>
<div class="wrappn">
  <div class="tabs" role="tablist" aria-label="表示の切り替え">
    <button type="button" class="tab" role="tab" data-mode="mine" aria-selected="true">自キャラの確定反撃（フレーム別）</button>
    <button type="button" class="tab" role="tab" data-mode="opp" aria-selected="false">相手の技から調べる</button>
  </div>
  <div id="pn-body"></div>
</div>`;
  const body = root.getElementById("pn-body");

  /* ---------- 技データの読み取り ---------- */
  const PURE = /^(?:[0-9nN]|WP|WK|LP|RP|LK|RK|\+)+$/;
  const BTN_RE = /WP|WK|LP|RP|LK|RK/g;
  const num1 = s => { const m = /^\s*(\d+)\s*F/.exec(String(s || "")); return m ? +m[1] : null; };
  const guardN = s => { const m = /^[-\u2212\u2013]\s*(\d+)/.exec(String(s || "").trim()); return m ? +m[1] : null; };
  const firstNum = s => { const m = /\d+/.exec(String(s || "")); return m ? +m[0] : 0; };
  function tierOf(h) {
    if (/小浮/.test(h)) return { tier: 2, badge: "小浮" };
    if (/浮/.test(h)) return { tier: 3, badge: "浮" };
    if (/スクリュー/.test(h)) return { tier: 2, badge: "スクリュー" };
    if (/トルネード/.test(h)) return { tier: 2, badge: "トルネード" };
    if (/コンボ始動/.test(h)) return { tier: 1, badge: "始動" };
    return { tier: 0, badge: "" };
  }
  /* カウンターヒット時コンボ始動の技（全キャラ共通）の定義：確反は通常ヒットなので、次のどちらかに当てはまる技には、コンボ集へのリンクを作らない。
     ①技データ（ここ：chOnly）：通常ヒットでは浮き・始動にならず、カウンターの欄だけ「コンボ始動」とある技（例：ブライアンのニークラッシュ）
     ②コンボ集のデータ（CB.matcher）：その技から始まる現バージョンのコンボが、すべてカウンターヒット時限定（条件のタグが「カウンター」で「通常ヒット」ではない）の技
        （例：アーマーキングの 4LPRP・4LPRP6 は、2段目がカウンターヒットしたときだけコンボになる）。通常ヒットのコンボが無いので、matcher が0件を返し、リンクは出ない
     通常ヒットで始動・浮きになる技や、通常ヒットのコンボが1件でもある技（例：2LP+LK＝しゃがみへの確反でギミックを使うコンボがある）は、これまでどおりリンクを作る。
     リンク先と「コンボN件」の数は、通常ヒットで始動できるコンボだけ（同じ技のカウンターヒット時のコンボは含めない） */
  const chOnly = a => tierOf(String((a && a.hit) || "")).tier === 0 && /コンボ始動/.test(String((a && a.counter) || ""));
  /* 並び順：asc＝マイナスが小さい順（発生・不利が小さいほうから）／desc＝マイナスが大きい順 */
  const sortSel = labels => '<div class="fgrp"><label class="lbl" for="pn-sort">並び順</label><select id="pn-sort"><option value="asc"' + (pref.sort === "asc" ? " selected" : "") + ">マイナスが小さい順" + labels[0] + '</option><option value="desc"' + (pref.sort === "desc" ? " selected" : "") + ">マイナスが大きい順" + labels[1] + "</option></select></div>";
  /* 同じ発生の中の並び順：技チェックシートの技の並び（上から順）。シートにない行は近い技の後ろ */
  const cmpRow = (x, y) => (x.sp - y.sp) || (x.i - y.i);

  /* 攻撃判定の色分け：上＝赤 中＝黄 特殊中段（特中）＝黄緑 特殊下段（特下）＝水色 下＝青 ／ 投げ・特殊などは枠だけ */
  const AT_CLS = { "上": "h", "中": "m", "特中": "sm", "特下": "sl", "下": "l" };
  function atkHtml(s) {
    let out = "";
    for (let part of String(s == null ? "" : s).split(/[,，、]/)) {
      part = part.trim();
      if (!part || part === "-") continue;
      let rep = 1;
      const mm = /\s*[*＊]\s*(\d+)$/.exec(part);
      if (mm) { rep = Math.min(+mm[1], 9); part = part.slice(0, mm.index).trim(); }
      const m = /^(特中|特下|上|中|下)(?:[（(].*[）)])?$/.exec(part);
      const tag = '<span class="ab ' + (m ? AT_CLS[m[1]] : "o") + '" title="' + esc(part) + '">' + esc(part) + "</span>";
      for (let i = 0; i < rep; i++) out += tag;
    }
    return out ? '<div class="at" aria-label="攻撃判定">' + out + "</div>" : "";
  }
  const LEGEND = '<div class="lg" role="group" aria-label="攻撃判定の色"><span class="lbl">攻撃判定</span>' +
    [["h", "上", "上段"], ["m", "中", "中段"], ["sm", "特中", "特殊中段"], ["sl", "特下", "特殊下段"], ["l", "下", "下段"], ["o", "投", "投げ・特殊など"]].map(a => '<span class="lgi"><span class="ab ' + a[0] + '">' + (a[0] === "o" ? "-" : a[1]) + "</span>" + a[2] + "</span>").join("") + "</div>";
  const LEGEND2 = '<div class="lg" role="group" aria-label="タグの見かた"><span class="lbl">タグ</span>' + [
    ['<span class="bd he">ヒート発動技</span>', "使うとヒートが発動する"],
    ['<span class="bd hs">ヒートスマッシュ</span>', "ヒート中だけ出せる"],
    ['<span class="bd w s">壁やられ(強)</span><span class="bd w m">壁やられ(中)</span>', "壁際でヒットすると誘発（タグがない技は誘発しない）"],
    ['<span class="bd g">壁ギミック</span><span class="bd g f">床ギミック</span>', "ステージのギミックを誘発"]
  ].map(a => '<span class="lgi">' + a[0] + a[1] + "</span>").join("") + "</div>";
  const LEGEND3 = '<div class="lg" role="group" aria-label="状態の色"><span class="lbl">状態</span>' + [
    ['<span class="bd sS">立ち状態</span>', "相手が立っている（「s」が付かない技）"],
    ['<span class="bd sC">しゃがみ状態</span>', "相手が強制しゃがみ（-11sのように「s」が付く技）。上段は当たらない"]
  ].map(a => '<span class="lgi">' + a[0] + a[1] + "</span>").join("") + "</div>";
  /* 壁やられ(強)(中)とステージギミック：技データの「壁やられ」「ギミック」から読む（データのない技は誘発しない） */
  const WALL_COND = { "ヒット": "通常ヒットのみ", "カウンター": "CHのみ", "ガード": "ガード時のみ" };
  function wallOf(a) {
    const by = {}, out = [];
    for (const ln of String((a && a.wall) || "").split("\n")) {
      const m = /^\s*(?:(ヒット|カウンター|ガード)\s*[：:]\s*)?(.*)$/.exec(ln), w = /壁やられ\(([中強・]+)\)/.exec(m[2]);
      if (w) w[1].split("・").forEach(lv => { if (lv) (by[lv] = by[lv] || new Set()).add(m[1] || ""); });   // 「(強・中)」は、強と中の両方
    }
    for (const lv of ["強", "中"]) {
      if (!by[lv]) continue;
      const cs = [...by[lv]];
      out.push({ lv, q: (cs.includes("") || (cs.includes("ヒット") && cs.includes("カウンター"))) ? "" : cs.map(c => WALL_COND[c]).join("・") });
    }
    return out;
  }
  function gimOf(a) {
    const lines = String((a && a.gimmick) || "").split("\n").map(s => s.trim()).filter(Boolean), out = [];
    const names = lines.filter(s => s[0] !== "※"), notes = lines.filter(s => s[0] === "※").map(s => s.slice(1).replace(/^床：/, "").replace(/、/g, "・"));
    const wl = names.filter(n => /ウォール|バルコニー/.test(n)), fl = names.filter(n => /フロア/.test(n));
    if (wl.length) out.push({ f: 0, t: "壁ギミック", q: "", tip: wl.join("・") });
    if (fl.length) out.push({ f: 1, t: "床ギミック", q: notes.join("・"), tip: fl.join("・") + (notes.length ? "（" + notes.join("・") + "）" : "") });
    return out;
  }
  /* 【定義】ヒートダッシュに移行してコンボを行うタイプの確反（ヒートダッシュ移行技）は、コンボ集へのジャンプリンクの対象にする。
       ・ヒートダッシュ移行技 ＝ 技表の技名に「ヒートダッシュ」が入る技（「〇〇～ヒートダッシュ」「〇〇(ヒートダッシュ)」。例：アーマーキングの 6RPLP6・66RK6・立ち途中LKLP6）。技データから hd=1 を付ける
       ・ヒートダッシュ移行技は、技データの chOnly（カウンターヒット時だけコンボ始動）の対象外。リンクを作るかは、コンボ集のデータ（通常ヒットのコンボがあるか）だけで決める
       ・コンボ集での始動技の名前は「ヒート中＋コマンド」（例：ヒート中6RPLP6。分類は「ヒートダッシュ」）。確反表の表示「6RPLP6(ヒート中)」や、技表のコマンド「ヒート＆立ち途中LKLP6」「ヒート中66RK6」も、この形（hdKey）に直して照合する */
  const hdKey = c => "ヒート中" + String(c).replace(/\(ヒート中\)$/, "").replace(/^ヒート(?:中|[＆&])/, "");
  const jkey = c => String(c).replace(/^(.*6)\(ヒート中\)$/, "ヒート中$1");   // ヒートダッシュの表示「〇〇6(ヒート中)」→ コンボ集の始動技の形「ヒート中〇〇6」（技データから hd が分かるときは hdKey を使う）
  let jm = null;     // この技が始動技の「通常ヒットのコンボ」の数を返す関数（コンボ集があるとき。カウンターヒット時限定のコンボは数えない）。1件以上あれば、その技を押すとコンボ集のそのコンボへ飛ぶ
  function jumpFrom(el) {
    const cmd = el && el.dataset ? el.dataset.jump : "";
    if (!cmd || !window.CB || !CB.setMove || typeof window.setPage !== "function") return;
    if (CB.setMove(cmd, cmd + (el.dataset.jn ? "（" + el.dataset.jn + "）" : ""))) { window.setPage("combo"); window.scrollTo(0, 0); }
  }

  /* 確反集のデータがないキャラ：技データから素直な入力の技だけを集めた参考表 */
  const cache = {};
  function punishers(c) {
    if (cache[c.id]) return cache[c.id];
    const out = [], seen = new Set();
    for (const m of c.moves) {
      const a = m.a || {};
      const cmd = String(a.command || "").trim();
      const st = num1(a.startup);
      if (st == null || !cmd || !PURE.test(cmd) || !(cmd.match(BTN_RE) || []).length) continue;
      if (/投げ|返し|捌き|ガード不能/.test(String(a.attack || ""))) continue;
      const key = cmd + "|" + m.name;
      if (seen.has(key)) continue; seen.add(key);
      const h = String(a.hit || ""), t = tierOf(h);
      out.push({ k: m.k, name: m.name, cmd, at: String(a.attack || ""), f: st, p: 0, fl: "", nt: "", d1: firstNum(a.damage), dmg: String(a.damage || "-"), hit: h.split("\n")[0], tier: t.tier, badge: t.badge, ck: chOnly(a) ? 1 : 0, cond: 0, uk: 0, ex: 0, he: /ヒート発動技/.test(cmd) ? 1 : 0, hs: 0, wl: wallOf(a), gm: gimOf(a), i: out.length, n: (cmd.match(BTN_RE) || []).length });
    }
    out.sort((x, y) => y.tier - x.tier || y.d1 - x.d1 || x.f - y.f || x.n - y.n);
    return (cache[c.id] = out);
  }

  /* 確反集のあるキャラ：立ち／しゃがみの行 */
  const kcache = {};
  const kmap = c => kcache[c.id] || (kcache[c.id] = Object.fromEntries(c.moves.map(m => [m.k, m])));
  const kixc = {};
  const kix = c => kixc[c.id] || (kixc[c.id] = Object.fromEntries(c.moves.map((m, i) => [m.k, i])));
  function netRows(c, stance) {
    const key = c.id + "|" + stance;
    if (cache[key]) return cache[key];
    const d = NET[c.id];
    if (!d) return null;
    const out = (d[stance] || []).map((r, i) => mapNet(c, r, i));
    return (cache[key] = out);
  }
  function mapNet(c, r, i) {
    const km = kmap(c), ix = kix(c);
    {
      const m = r[5] >= 0 ? km[r[5]] : null, a = m ? (m.a || {}) : {}, x = r[8] || {};
      const h = String(a.hit || ""), t = m ? tierOf(h) : { tier: 0, badge: "" };
      const dmg = x.dm != null ? String(x.dm) : (m ? String(a.damage || "-") : "");
      return { f: r[0], p: r[1], k: r[5], name: r[3] || (m ? m.name : ""), fl: r[4], ex: r[6], nt: r[7],
        at: x.at != null ? String(x.at) : (m ? String(a.attack || "") : ""), sp: m ? ix[r[5]] : (x.sp != null ? x.sp : 1e4),
        cmd: x.ov || (m ? String(a.command || r[2]) : String(r[2]).replace(/,/g, "").replace(/~/g, "～")),
        d1: x.dm != null ? firstNum(x.dm) : (m ? firstNum(a.damage) : 0), dmg, hit: h.split("\n")[0],
        tier: t.tier, badge: t.badge, ck: m && chOnly(a) ? 1 : 0, hd: m && /ヒートダッシュ/.test(String(m.name || "")) ? 1 : 0, cond: /[hbrds]/.test(r[4]) ? 1 : 0, uk: m ? 0 : 1, he: x.he ? 1 : 0, hs: /^ヒートスマッシュ/.test(r[7] || "") ? 1 : 0, wl: wallOf(a), gm: gimOf(a), i };
    }
  }

  const LBL = { h: "ヒート中", b: "ヒート発動", r: "レイジ中", d: "デビル", w: "立ち途中", c: "しゃがみ中", s: "専用状態" };
  const LBL_RE = { h: /ヒート/, b: /ヒート/, r: /レイジ/, d: /デビル/, w: /立ち途中/, c: /しゃがみ|しゃがん/, s: /状態|中/ };
  function chipHtml(p) {
    const hitShort = p.hit && p.hit !== "-" && !p.badge ? '<span class="bd h" title="' + esc(p.hit) + '">' + esc(p.hit) + "</span>" : "";
    let cb = "";
    for (const ch of p.fl || "") if (LBL[ch] && !LBL_RE[ch].test(p.cmd)) cb += '<span class="bd c">' + LBL[ch] + "</span>";
    if (p.p) cb += '<span class="bd h" title="構えやダッシュを経由する技なので、発生は入力のしかたで前後します">発生が変動</span>';
    if (p.ex) cb += '<span class="bd h" title="元の一覧が途中までしか取得できなかったため、別の表から補った技です">補完</span>';
    let nt = p.nt || "", tg = "";
    if (p.hs) { tg += '<span class="bd hs" title="ヒート中だけ出せる技（ヒートスマッシュ）">ヒートスマッシュ</span>'; nt = nt.replace(/^ヒートスマッシュ[・、,]?/, ""); }
    if (p.he) tg += '<span class="bd he" title="ヒートが発動していないとき使うと、ヒートが発動する技（ヒート発動技）">ヒート発動技</span>';
    if (nt && !p.cmd.includes(nt.replace(/に$/, ""))) cb += '<span class="bd n" title="' + esc(nt) + '">' + esc(nt) + "</span>";
    let l4 = "";
    for (const t of p.cn || []) l4 += t === "立" ? '<span class="bd sS" title="しゃがみ状態の相手には上段が当たらないので、相手が立っているときだけ使える技です">相手立ち状態限定</span>' : '<span class="bd sC" title="しゃがみ状態の相手にだけ当たる技です">相手しゃがみ状態限定</span>';
    for (const w of p.wl || []) l4 += '<span class="bd w ' + (w.lv === "強" ? "s" : "m") + '" title="壁際でヒットすると壁やられ(' + w.lv + ')を誘発します' + (w.q ? "（" + w.q + "）" : "") + '">壁やられ(' + w.lv + ")" + (w.q ? "<small>" + esc(w.q) + "</small>" : "") + "</span>";
    for (const g of p.gm || []) l4 += '<span class="bd g' + (g.f ? " f" : "") + '" title="' + esc(g.tip) + 'を誘発します">' + g.t + (g.q ? "<small>" + esc(g.q) + "</small>" : "") + "</span>";
    const jc = p.hd ? hdKey(p.cmd) : jkey(p.cmd), jn = jm && (!p.ck || p.hd) ? jm(jc) : 0;   // カウンターヒット時コンボ始動の技には、コンボ集へのリンクを作らない（p.ck＝技データで判定／jm＝通常ヒットのコンボの数。上の定義を参照）。ヒートダッシュ移行技（p.hd）は p.ck の対象外
    return '<div class="pc' + (p.cond ? " cd" : "") + (p.uk ? " uk" : "") + (jn ? " jp" : "") + (p.hs ? " hs" : p.he ? " he" : "") + '"' + (jn ? ' role="button" tabindex="0" data-jump="' + esc(jc) + '" data-jn="' + esc(p.name) + '" title="' + esc(p.name) + "：押すと、この技から始まる通常ヒットのコンボ（" + jn + '件）をコンボ集で開きます"' : ' title="' + esc(p.name) + '"') + '><div class="l1"><b class="cmd">' + esc(p.cmd) + '</b><span class="fr1">発生' + p.f + "F" + (p.p ? "～" : "") + "</span></div>" +
      '<span class="nm">' + esc(p.name) + "</span>" + atkHtml(p.at) + '<div class="l3">' + (p.dmg ? '<span class="dm">' + esc(p.dmg) + "</span>" : "") + (p.badge ? '<span class="bd">' + esc(p.badge) + "</span>" : "") + tg + cb + hitShort + (jn ? '<span class="bd j">コンボ' + jn + "件</span>" : "") + "</div>" + (l4 ? '<div class="l4">' + l4 + "</div>" : "") + "</div>";
  }
  const pick = (list, maxSt, launchOnly) => list.filter(p => p.f <= maxSt && (!launchOnly || p.tier >= 1));

  /* シットジャブ（しゃがみ中LP）を確反に載せるのは、次の3つが全部そろうときだけ（全キャラ共通・「相手の技から調べる」）
     ①相手がしゃがみ状態（ガード硬直差に「s」が付く技＝しゃがみの表）　②-10F　③シットジャブのほかに確反になる技がない
     立ちの表（「s」が付かない技）には、-10Fでも載せない。 */
  const isSit = p => /^シットジャブ/.test(p.name || "") || (p.f === 10 && /^(2LP|1LP|しゃがみ中LP)$/.test(p.cmd || ""));   // 名前がシットジャブの技と、発生10Fの下＋LP（キングのレフトストレートなど）
  const sitOK = (low, g, others) => low && g === 10 && !others.length;
  /* ガード硬直差に「s」が付く技（-11s など）＝ガード後に相手が強制しゃがみ状態になる。しゃがみ状態の相手に上段は当たらないので、反撃はしゃがみの表から選ぶ
     （技の最後の段が下段かどうかでは決めない。全キャラ共通） */
  function forcedCrouch(a) { return /^[-\u2212\u2013]\s*\d+\s*s/i.test(String(a.guard || "").trim()); }
  /* 相手の技（不利 g F）に対する反撃候補の上位3つ */
  function cands(me, g, low) {
    const rows = netRows(me, low ? "crouch" : "stand");
    if (!rows) return pick(punishers(me), g, false).slice(0, 3);
    let ok = rows.filter(r => r.f <= g && !r.cond && r.k >= 0 && !/しゃがみ状態への専用/.test(r.nt));
    { const rest = ok.filter(r => !isSit(r)); if (!sitOK(low, g, rest)) ok = rest; }   // シットジャブは「しゃがみの表の-10Fで、ほかに確反がない」ときだけ
    // 同じ発生で、より短い入力の続きになっているだけの行（連続技の2段目・3段目）は候補から外す
    const keep = ok.filter(r => !ok.some(o => o !== r && o.f === r.f && o.cmd.length < r.cmd.length && r.cmd.startsWith(o.cmd)));
    return keep.sort((x, y) => y.tier - x.tier || y.d1 - x.d1 || x.f - y.f || x.i - y.i).slice(0, 3);
  }

  /* 最適解の確反：確反表の同じ技の行があればそれを使い、なければ技データから作る（l の並びを変えない） */
  function bestRow(c, sp, st) {
    const hit = netRows(c, st).find(r => r.k === sp.k && (r.fl || "") === (sp.fl || "") && (!sp.c || r.cmd === sp.c));
    let p = null;
    if (hit) { p = Object.assign({}, hit); if (sp.ov) p.cmd = sp.ov; }
    else {
      const m = kmap(c)[sp.k];
      if (!m) return null;
      const a = m.a || {};
      p = mapNet(c, [num1(a.startup) || 0, 0, String(a.command || ""), m.name, sp.fl || "", sp.k, 0, "", sp.ov ? { ov: sp.ov } : {}], 0);
    }
    if (sp.t) p.cn = [sp.t];                                   // 相手の状態の限定（立＝立ち状態限定／し＝しゃがみ状態限定）
    return p;
  }
  /* strict：1 ＝立ち・しゃがみの両方／{ stand:1 } や { crouch:1 } ＝その状態だけ（もう一方は従来どおり） */
  const strictOf = (d, st) => d.strict === 1 || !!(d.strict && d.strict[st] === 1);
  function bestFor(c, g, low) {
    const d = BEST[c.id];
    if (!d) return null;
    const st = low ? "crouch" : "stand", arr = d[st], strict = strictOf(d, st);
    if (!arr && !strict) return null;                        // 指定のない状態は、従来の自動候補
    let hits = [];                                             // この不利Fに当たる指定
    for (const e of (arr || [])) {
      if (g < e.g[0] || g > e.g[1]) continue;
      const list = e.l.map(sp => bestRow(c, sp, st)).filter(Boolean);
      if (list.length) hits.push({ r: e.r, list });
    }
    const flat = hits.flatMap(h => h.list);
    if (flat.some(isSit)) {                                    // シットジャブは「相手がしゃがみ状態・-10F・ほかに確反がない」ときだけ
      const others = low ? (netRows(c, "crouch") || []).filter(r => r.f <= g && !r.cond && r.k >= 0 && !isSit(r) && !/しゃがみ状態への専用/.test(r.nt)) : [1];
      if (!sitOK(low, g, others)) {
        const kept = hits.map(h => ({ r: h.r, list: h.list.filter(p => !isSit(p)) }));
        // しゃがみの表で、指定が「シットジャブだけ」のとき（吉光：発生6F・8Fの技もあるが、リストの-10Fはしゃがみ中LPだけ）は、空にせずそのまま出す
        if (kept.some(h => h.list.length) || !strict || !low) hits = kept;
      }
    }
    const groups = [];                                         // 同じ距離の指定は1つの枠にまとめる（下限から -39F まで続く指定が重なる）
    for (const h of hits) {
      if (!h.list.length) continue;
      const hit = groups.find(x => x.r === h.r);
      if (hit) hit.list.push(...h.list); else groups.push({ r: h.r, st, list: h.list });
    }
    if (groups.length) return { groups };
    return strict ? { note: (low ? "「s」付きの技（強制しゃがみ状態）の" : "") + "-" + g + "Fの最適解は、まだ設定されていません。" } : null;
  }
  const bestHtml = b => b.note ? '<p class="none">' + esc(b.note) + "</p>" :
    '<div class="bst">' + b.groups.map(g => '<div class="bg ' + (g.st === "crouch" ? "sC" : "sS") + '"><div class="rg"><span class="bd c ' + (g.st === "crouch" ? "sC" : "sS") + '">' + esc(g.r) + "距離・" + (g.st === "crouch" ? "しゃがみ" : "立ち") + "状態の相手へ</span></div><div class=\"chips\">" + g.list.map(chipHtml).join("") + "</div></div>").join("") + "</div>";

  /* ---------- 自キャラ ---------- */
  function renderMine() {
    const c = charOf(current) || CHARACTERS[0];
    const hasNet = !!NET[c.id];
    const stance = pref.stance === "crouch" ? "crouch" : "stand";
    let html = '<h2 class="pt">' + esc(c.name) + "<small>" + esc(c.en) + "</small></h2>" +
      '<p class="sub">ガードして-N Fの不利なら<b>発生N F以内</b>の技が確定反撃になります。キャラは上のボタンで切り替えられます。' + (hasNet ? "表は<b>立ち</b>（相手が立っている）と<b>しゃがみ</b>（技表で-11sのように「s」が付く技のあと。相手は強制しゃがみで、上段は当たりません）で分かれています。" : "") + "</p>";
    html += '<div class="filters">';
    if (hasNet) html += '<div class="fgrp"><span class="lbl">状態</span><button type="button" class="chip" data-stance="stand" aria-pressed="' + (stance === "stand") + '">立ち</button><button type="button" class="chip" data-stance="crouch" aria-pressed="' + (stance === "crouch") + '">しゃがみ</button></div>';
    html += '<div class="fgrp"><label class="lbl" for="pn-cap">不利フレーム</label><select id="pn-cap"><option value="0">すべて</option>' + FRAMES.map(n => '<option value="' + n + '"' + (pref.cap === n ? " selected" : "") + ">-" + n + "F（発生" + n + "F以内）</option>").join("") + "</select></div>" +
      sortSel(["", ""]) +
      '<div class="fgrp"><button type="button" class="chip" data-launch aria-pressed="' + pref.launch + '">浮き・コンボ始動の技だけ</button>' +
      (hasNet ? '<button type="button" class="chip" data-nocond aria-pressed="' + pref.nocond + '">条件付きの技を隠す</button>' : "") + "</div></div>" + LEGEND + (hasNet ? LEGEND3 : "") + LEGEND2;
    const rows = (hasNet ? netRows(c, stance) : punishers(c)).filter(r => (!pref.cap || r.f <= pref.cap) && (!pref.launch || r.tier >= 1) && (!pref.nocond || !r.cond));
    if (!rows.length) {
      html += '<div class="empty">' + (hasNet && !NET[c.id][stance].length ? "このキャラは、この状態の表がありません。" : "条件に合う技がありません。") + "</div>";
    } else if (hasNet) {
      const groups = new Map();
      for (const r of rows) { if (!groups.has(r.f)) groups.set(r.f, []); groups.get(r.f).push(r); }
      for (const f of [...groups.keys()].sort((a, b) => pref.sort === "desc" ? b - a : a - b)) {
        const list = groups.get(f).sort(cmpRow);
        html += '<section class="fr ' + (stance === "crouch" ? "sC" : "sS") + '"><h3><span class="n">' + f + 'F</span><small>-' + f + 'F以上の不利で確定</small><span class="cnt">' + list.length + "技</span></h3><div class=\"chips\">" + list.map(chipHtml).join("") + "</div></section>";
      }
    } else {
      // 自動生成の表：発生ごとの「その発生以内」の区画（上位6つ・展開で全部）
      for (const f of (pref.sort === "desc" ? FRAMES.slice().reverse() : FRAMES)) {
        if (pref.cap && f > pref.cap) continue;
        const all = pick(rows, f, false), open = !!openAll[f], shownList = open ? all : all.slice(0, 6);
        html += '<section class="fr"><h3><span class="n">-' + f + 'F</span><small>発生' + f + 'F以内</small><span class="cnt">' + all.length + "技</span></h3>" +
          (all.length ? '<div class="chips">' + shownList.map(chipHtml).join("") + "</div>" + (all.length > 6 ? '<button type="button" class="more" data-more="' + f + '">' + (open ? "上位だけに戻す" : "ほか" + (all.length - 6) + "技を表示") + "</button>" : "") : '<p class="none">条件に合う技がありません。</p>') + "</section>";
      }
    }
    body.innerHTML = html;
    equalize();
  }
  /* 自キャラの表のカード（10F・12F … の枠の中身）を、そのキャラの中でいちばん高いカードの高さにそろえる（枠の高さがバラバラにならないように）。
     幅が変わると折り返しが変わるので、画面の大きさを変えたときや、隠れていた表が表示されたときにも測り直す。 */
  function equalize() {
    const cards = body.querySelectorAll(".fr .pc");
    if (!cards.length || !body.getClientRects().length) return;   // 隠れている（ほかのページを表示中）ときは測れない
    body.style.removeProperty("--pch");
    let h = 0;
    cards.forEach(c => { h = Math.max(h, c.getBoundingClientRect().height); });
    if (h) body.style.setProperty("--pch", Math.ceil(h) + "px");
  }
  let eqRaf = 0;
  const eqLater = () => { cancelAnimationFrame(eqRaf); eqRaf = requestAnimationFrame(equalize); };
  window.addEventListener("resize", eqLater);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(eqLater);
  let openAll = {};

  /* ---------- 相手の技から調べる ---------- */
  function oppDefault() {
    if (pref.opp && charOf(pref.opp)) return pref.opp;
    const o = CHARACTERS.find(c => c.id !== current) || CHARACTERS[0];
    return o.id;
  }
  function renderOpp() {
    const me = charOf(current) || CHARACTERS[0], oid = oppDefault(), opp = charOf(oid);
    if (body.dataset.view !== "opp") {          // 入力欄は作り直さない（日本語入力の途中で消えないように）
      body.dataset.view = "opp";
      const opts = CHARACTERS.map(c => '<option value="' + esc(c.id) + '">' + esc(c.name) + "（" + esc(c.en) + "）</option>").join("");
      const mins = MINS.map(n => '<option value="' + n + '">-' + n + "F以上の技</option>").join("");
      body.innerHTML = '<h2 class="pt" id="pn-title"></h2>' +
        '<p class="sub">相手キャラを選ぶと、ガードして-10F～-' + MAXG + 'Fの不利になる技と、自キャラの反撃候補<span id="pn-top3">（上位3つ）</span>を表示します。「-14F以上」は-14F・-15F…とマイナスが大きいほうを指します。自キャラは上のボタンで切り替えられます。ガード硬直差に「s」が付く技（例：-11s）は、ガード後に相手が強制しゃがみ状態になって上段が当たらないため、しゃがみの表から選びます。</p>' +
        '<div class="filters"><div class="fgrp"><label class="lbl" for="pn-opp">相手キャラ</label><select id="pn-opp">' + opts + "</select></div>" +
        '<div class="fgrp"><label class="lbl" for="pn-min">不利フレーム</label><select id="pn-min">' + mins + "</select></div>" +
        sortSel(["（-10F→-" + MAXG + "F）", "（-" + MAXG + "F→-10F）"]) +
        '<div class="fgrp"><input class="search" id="pn-q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" aria-label="技名やコマンドで検索" placeholder="技名・コマンドで検索"></div></div>' + LEGEND + LEGEND3 + LEGEND2 +
        '<p class="stat" id="pn-stat" role="status" aria-live="polite"></p><div id="pn-list"></div>';
      root.getElementById("pn-q").value = qText;
    }
    root.getElementById("pn-opp").value = oid;
    root.getElementById("pn-min").value = String(pref.min);
    root.getElementById("pn-sort").value = pref.sort;
    root.getElementById("pn-title").innerHTML = "相手の技から調べる<small>自キャラ：" + esc(me.name) + "（" + esc(me.en) + "）</small>";
    const strict = !!(BEST[me.id] && BEST[me.id].strict === 1);       // 立ち・しゃがみの両方を指定しているキャラだけ「上位3つ」の文言を消す
    root.getElementById("pn-top3").hidden = strict;
    const toks = nrm(qText).split(/\s+/).filter(Boolean);
    const rows = [];
    for (const m of opp.moves) {
      const a = m.a || {};
      const g = guardN(a.guard);
      if (g == null || g < pref.min || g > MAXG) continue;
      const hay = nrm([m.name, a.command || ""].join(" "));
      if (toks.length && !toks.every(t => hay.includes(t))) continue;
      rows.push({ m, a, g });
    }
    rows.sort((x, y) => (pref.sort === "desc" ? y.g - x.g : x.g - y.g) || x.m.k - y.m.k);
    const total = rows.length, view = rows.slice(0, limit), cnts = {};
    for (const r of rows) cnts[r.g] = (cnts[r.g] || 0) + 1;
    root.getElementById("pn-stat").innerHTML = "<b>" + esc(opp.name) + "</b>の-" + pref.min + (pref.min === MAXG ? "F" : "F～-" + MAXG + "F") + "の技：<b>" + total + "</b>件";
    let html = "", lastG = null;
    for (const r of view) {
      if (r.g !== lastG) { lastG = r.g; html += '<h2 class="gh"><span class="n">-' + r.g + 'F</span><span class="cnt">該当' + cnts[r.g] + "技</span></h2>"; }
      const low = !!NET[me.id] && forcedCrouch(r.a), bs = bestFor(me, r.g, low), cs = bs ? [] : cands(me, r.g, low);
      const key = me.id + "|" + opp.id + "|" + r.m.k, done = !!pref.chk[key];
      html += '<article class="mv ' + (low ? "sC" : "sS") + (done ? " done" : "") + '"><div><h3>' + esc(r.m.name) + '</h3><div class="mm"><b class="cmd">' + esc(r.a.command || "") + '</b><span class="gd">ガード ' + esc(r.a.guard) + '</span><span class="hh">' + esc(r.a.attack || "") + (r.a.startup && r.a.startup !== "-" ? "・発生" + esc(r.a.startup) : "") + "</span>" +
        (low ? '<span class="bd c sC" title="ガード硬直差に「s」が付く技です。ガード後に相手が強制しゃがみ状態になり、上段は当たらないため、しゃがみの表から反撃を選んでいます">しゃがみの表</span>' : "") + "</div>" +
        '<label class="chk"><input type="checkbox" data-chk="' + esc(key) + '"' + (done ? " checked" : "") + "> 確認済み</label></div>" +
        (bs ? bestHtml(bs) : '<div class="chips">' + (cs.length ? cs.map(chipHtml).join("") : '<p class="none">自キャラの候補がありません。</p>') + "</div>") + "</article>";
    }
    if (total > view.length) html += '<p style="text-align:center"><button type="button" class="more" data-next>さらに表示（残り' + (total - view.length) + "件）</button></p>";
    if (!total) html += '<div class="empty">条件に合う技がありません。</div>';
    root.getElementById("pn-list").innerHTML = html;
  }

  function render() {
    dirty = false;
    jm = (window.CB && typeof CB.matcher === "function") ? CB.matcher(current) : null;
    for (const t of root.querySelectorAll(".tab")) t.setAttribute("aria-selected", String(t.dataset.mode === pref.mode));
    if (pref.mode === "opp") renderOpp(); else { body.dataset.view = "mine"; renderMine(); }
  }

  /* ---------- 操作 ---------- */
  root.addEventListener("click", e => {
    const t = e.target.closest ? e.target.closest("button") : null;
    if (!t) return;
    if (t.dataset.mode) { pref.mode = t.dataset.mode; save(); limit = PAGE_N; render(); }
    else if (t.dataset.stance) { pref.stance = t.dataset.stance; save(); render(); }
    else if (t.hasAttribute("data-launch")) { pref.launch = !pref.launch; save(); render(); }
    else if (t.hasAttribute("data-nocond")) { pref.nocond = !pref.nocond; save(); render(); }
    else if (t.dataset.more) { const f = +t.dataset.more; openAll[f] = !openAll[f]; render(); }
    else if (t.hasAttribute("data-next")) { limit += PAGE_N; render(); }
  });
  root.addEventListener("click", e => { const jp = e.target.closest ? e.target.closest(".pc.jp") : null; if (jp) jumpFrom(jp); });
  root.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("jp")) { e.preventDefault(); jumpFrom(e.target); } });
  root.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "pn-opp") { pref.opp = t.value; save(); limit = PAGE_N; render(); }
    else if (t.id === "pn-min") { pref.min = +t.value; save(); limit = PAGE_N; render(); }
    else if (t.id === "pn-cap") { pref.cap = +t.value; save(); render(); }
    else if (t.id === "pn-sort") { pref.sort = t.value === "desc" ? "desc" : "asc"; save(); limit = PAGE_N; render(); }
    else if (t.dataset && t.dataset.chk) { if (t.checked) pref.chk[t.dataset.chk] = 1; else delete pref.chk[t.dataset.chk]; save(); const card = t.closest(".mv"); if (card) card.classList.toggle("done", t.checked); }
  });
  root.addEventListener("input", e => { if (e.target.id === "pn-q") { qText = e.target.value; limit = PAGE_N; render(); } });

  window.PN = {
    show() { shown = true; if (dirty) render(); else equalize(); },
    hide() { shown = false; dirty = true; },        // コンボ集で増減したぶんを、戻ってきたときの「コンボN件」に反映する
    onChar() { openAll = {}; limit = PAGE_N; if (shown) render(); else dirty = true; },
    count: () => { const c = charOf(current) || CHARACTERS[0]; return NET[c.id] ? netRows(c, "stand").length + netRows(c, "crouch").length : punishers(c).length; }
  };
})();
/*PNJS-END*/
