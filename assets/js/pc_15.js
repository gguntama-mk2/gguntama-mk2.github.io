
/*PTVSJS-START*/
/* 段位の画像と数字（破壊神は 100、破壊神壱〜∞ は 101〜108） */
window.PT_RANKS=[["入門生", 1, 1, "assets/media/d62f0cc50bc423ecdfa5.webp"], ["初段", 2, 2, "assets/media/cb57a21ec6822661f29a.webp"], ["二段", 3, 3, "assets/media/521671acd4959f6f6d3d.webp"], ["勇士", 4, 4, "assets/media/9db9f5595f7e2a905eb9.webp"], ["策士", 5, 5, "assets/media/7f187c3bab78b5f0c1df.webp"], ["闘士", 6, 6, "assets/media/0b10c3870e5ac2e7bb25.webp"], ["餓狼", 7, 7, "assets/media/edcaf751a54b5d5c6ce4.webp"], ["荒鷲", 8, 8, "assets/media/f56e109eda30c1197954.webp"], ["猛象", 9, 9, "assets/media/abcdacdc05f9d41bdc15.webp"], ["剛拳", 10, 10, "assets/media/c38e87848d3770406fa4.webp"], ["邪拳", 11, 11, "assets/media/979829bc6cced398bac6.webp"], ["戒拳", 12, 12, "assets/media/73dbfee45f128ab6ae6d.webp"], ["修羅", 13, 13, "assets/media/b655415b34a650704797.webp"], ["羅刹", 14, 14, "assets/media/9c110ffd329bc24c61b4.webp"], ["羅傑", 15, 15, "assets/media/bf4729e0f26425a45d23.webp"], ["臥龍", 16, 16, "assets/media/2b30add88877f90c4f96.webp"], ["真龍", 17, 17, "assets/media/49ccb8fb00a4a9a83626.webp"], ["天龍", 18, 18, "assets/media/811271b599f8c200b014.webp"], ["拳帝", 19, 19, "assets/media/5fbe0b2b9d3ec19084bd.webp"], ["炎帝", 20, 20, "assets/media/8dd15ef38b4ed25ba0a0.webp"], ["戦帝", 21, 21, "assets/media/a1f2362289eed6cabbd1.webp"], ["風神", 22, 22, "assets/media/6732ecab542d86e1fe80.webp"], ["雷神", 23, 23, "assets/media/0ada68d9343c639972f8.webp"], ["鬼神", 24, 24, "assets/media/eb1d90f01189829437b1.webp"], ["武神", 25, 25, "assets/media/085c85f6d27e9d0283a9.webp"], ["鉄拳王", 26, 26, "assets/media/ba4c368ae541cab85500.webp"], ["鉄拳覇王", 27, 27, "assets/media/2fa99fd50b03fd87691e.webp"], ["鉄拳神", 28, 28, "assets/media/c7394540b651442a8ed0.webp"], ["鉄拳神極", 29, 29, "assets/media/c9a43725970fd1b09eff.webp"], ["破壊神", 30, 100, "assets/media/d81d56849b085c6d3ea0.webp"], ["破壊神壱", 31, 101, "assets/media/10adc1958360602c4f68.webp"], ["破壊神弐", 32, 102, "assets/media/722a69e857ec577ce9c7.webp"], ["破壊神参", 33, 103, "assets/media/420fc10481babdbd6816.webp"], ["破壊神肆", 34, 104, "assets/media/b998a17a46418a070253.webp"], ["破壊神伍", 35, 105, "assets/media/60a019ae273f857ab289.webp"], ["破壊神陸", 36, 106, "assets/media/2ab1b32b04902d800327.webp"], ["破壊神漆", 37, 107, "assets/media/b94ceee00a7e30f42406.webp"], ["破壊神∞", 38, 108, "assets/media/0025d9609bfaaa198ea7.webp"]];
/* VS ページのキャラクター目元画像（42体）。チャッピー版で調整した画像・位置・拡大率を、表示される範囲だけ（480×120）に切り出した WebP。
   元の画像（約25MB）の代わりに、これを使う。作り直すときは tools/vs_eyes（bake.js）を使う */
window.PT_EYES={"ALISA":"assets/media/fa585d3fa50d8e7096cf.webp","ANNA":"assets/media/1c96d2b2479a2f73ea08.webp","ARMOR KING":"assets/media/3751a26386cf273fdc99.webp","ASUKA":"assets/media/c89018f677ebf08914aa.webp","AZUCENA":"assets/media/f9d989b741dce8b8c690.webp","BOB":"assets/media/c5eb6fcc5edc7b880066.webp","BRYAN":"assets/media/d6b4533996c78a491bfa.webp","CLAUDIO":"assets/media/199ffec82437edb3276b.webp","CLIVE":"assets/media/2e930ba573ac56e77859.webp","DEVIL JIN":"assets/media/4facd952ad88b3373007.webp","DRAGUNOV":"assets/media/d9006fb8c854ba11cf9b.webp","EDDY":"assets/media/a38c915949becf5a957d.webp","FAHKUMRAM":"assets/media/b31e54caef81848e0774.webp","FENG":"assets/media/d7efce6c3921d6827f19.webp","HEIHACHI":"assets/media/8d38699b03e93340d31f.webp","HWOARANG":"assets/media/1dc4deefd78ee1ad35fc.webp","JACK-8":"assets/media/c83c6e3d2565e278b577.webp","JIN":"assets/media/5baf3e7f4c4cb7864619.webp","JUN":"assets/media/e2004cf673d07272127f.webp","KAZUYA":"assets/media/e419f679d403531041cc.webp","KING":"assets/media/1a248e17ad8d95057103.webp","KUMA":"assets/media/cea17efea35fa23d8c46.webp","KUNIMITSU":"assets/media/a83cb977ba3e2731b818.webp","LARS":"assets/media/38b6ce43b6ce6b29d5df.webp","LAW":"assets/media/f02f111a10623ef8911e.webp","LEE":"assets/media/c536f62b4892602c65fb.webp","LEO":"assets/media/ef988feb1defb1f4bd73.webp","LEROY":"assets/media/31d65e97c9b026cd81cb.webp","LIDIA":"assets/media/2b3caa3254f15a4e5899.webp","LILI":"assets/media/db8e0d6f51c314886c16.webp","MIARY":"assets/media/8885cc25f55de5b9cf5d.webp","NINA":"assets/media/a4b232ca29596815e0e2.webp","PANDA":"assets/media/6fbeb2dcf7d4de438eb1.webp","PAUL":"assets/media/1d3d52019775e463e98c.webp","RAVEN":"assets/media/6d528822ee10898b7914.webp","REINA":"assets/media/663fbe0b51195c898082.webp","ROGER JR.":"assets/media/ad0b7070f3715e6bcfc4.webp","SHAHEEN":"assets/media/f1ddd3db792ae68c36d8.webp","STEVE":"assets/media/b7bf8d6d48c79867aa72.webp","VICTOR":"assets/media/74bd9ae9d4f16e71db9a.webp","XIAOYU":"assets/media/9bfa54d5295c4ae81e1c.webp","YOSHIMITSU":"assets/media/342daccf5eed7e1996b0.webp","YUJIRO HANMA":"assets/media/c6326ad42ea38a061965.webp","ZAFINA":"assets/media/77942ceef1076e290f5a.webp"};
(function () {
  const host = document.getElementById("vsHost");
  if (!host) return;
  if (!host.attachShadow) { host.textContent = "このブラウザではVSページを表示できません。"; return; }
  const root = host.attachShadow({ mode: "open" });
  const CSS = `
:host { display:block; color:var(--text); font-family:inherit; }
* { box-sizing:border-box; }
[hidden] { display:none !important; }
button,input,select { font:inherit; color:inherit; }
button:focus-visible,input:focus-visible,select:focus-visible { outline:2px solid var(--ok); outline-offset:2px; }
.wrapsg { max-width:1100px; margin:0 auto; }
.sbox { margin:0 0 10px; }
.search { width:100%; background:var(--panel); color:var(--text); border:1px solid var(--line); border-radius:8px; padding:9px 14px; font:inherit; font-size:.875rem; }
.search::placeholder { color:var(--ph,var(--sub)); }
.filters { display:flex; align-items:center; flex-wrap:wrap; gap:8px 16px; margin:0 0 8px; }
.fgrp { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
.lbl { font-size:.8125rem; color:var(--sub); margin-right:2px; }
.chip { background:transparent; color:var(--sub); border:1px solid var(--line); border-radius:99px; padding:4px 13px; font-size:.8125rem; cursor:pointer; white-space:nowrap; }
.chip:hover { border-color:var(--sub); color:var(--text); }
.chip[aria-pressed="true"] { color:var(--text); border-color:var(--accent); background:var(--accent-soft); font-weight:700; }
.stat { margin:4px 0 10px; color:var(--sub); font-size:.8125rem; min-height:1.4em; }
.stat b { color:var(--text); }
.summary { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin:0 0 12px; }
.metric { padding:9px 11px; border:1px solid var(--line); border-radius:10px; background:var(--panel); min-width:0; }
.metric .k { display:block; color:var(--sub); font-size:.6875rem; font-weight:700; }
.metric .v { display:block; margin-top:1px; font-size:1.1rem; font-weight:800; font-variant-numeric:tabular-nums; overflow-wrap:anywhere; }
.box { margin:0 0 12px; border:1px solid var(--line); border-radius:12px; background:var(--panel); overflow:hidden; }
.boxhd { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:11px 14px; border-bottom:1px solid var(--line); }
.boxhd h2 { margin:0; font-size:.9375rem; font-weight:800; }
.boxhd .sub { color:var(--sub); font-size:.75rem; }
.boxbody { padding:12px 14px 14px; }
.scroll { border:1px solid var(--line); border-radius:8px; background:var(--panel); overflow:auto; }
table { border-collapse:collapse; width:100%; min-width:880px; table-layout:auto; }
thead th { position:sticky; top:0; z-index:2; background:var(--head); color:var(--sub); font-size:.75rem; font-weight:700; padding:9px 10px; border-bottom:1px solid var(--line); white-space:nowrap; }
td { padding:9px 10px; text-align:center; border-bottom:1px solid var(--line); font-size:.8125rem; white-space:nowrap; }
tbody tr:last-child td { border-bottom:0; }
tbody tr:hover td { background:color-mix(in srgb,var(--accent) 6%,var(--panel)); }
.result { display:inline-block; min-width:48px; padding:1px 9px; border:1px solid var(--line); border-radius:99px; color:var(--sub); font-size:.6875rem; font-weight:800; }
.result.win { color:var(--ok); border-color:var(--ok); }
.result.loss { color:var(--danger); border-color:var(--danger); }
.result.draw { color:#2fae64; border-color:#2fae64; }
.btn { background:transparent; color:var(--sub); border:1px solid var(--line); border-radius:99px; padding:5px 12px; font-size:.75rem; font-weight:700; cursor:pointer; white-space:nowrap; }
.btn:hover:not(:disabled) { border-color:var(--accent); color:var(--text); background:var(--accent-soft); }
.btn.primary { color:var(--on); border-color:var(--accent); background:var(--accent); }
.btn:disabled { opacity:.42; cursor:not-allowed; }
/* 再生ボタン：「再生」と「一時停止」で幅が変わらないように、見えない「一時停止」を下に重ねて、幅をいつも「一時停止」に合わせる（スマホ幅は、もともと列の幅で固定） */
#vs-play::after { content:'一時停止'; display:block; height:0; overflow:hidden; visibility:hidden; }
@media(max-width:819px){ #vs-play::after { display:none; } }
/* 細いスマホ幅：「一時停止」の文字がボタンからはみ出していたので、再生ボタンの列だけ少し広くする（ほかのボタンは同じ並び） */
@media(max-width:440px){ #vs-side .controls { grid-template-columns:repeat(3,minmax(0,1fr)) minmax(0,1.5fr) repeat(3,minmax(0,1fr)); } }
.empty { margin:18px 0; padding:22px 16px; text-align:center; border:1px dashed var(--line); border-radius:12px; color:var(--sub); }
.empty b { color:var(--text); }
.detail { display:grid; grid-template-columns:minmax(0,1.45fr) minmax(17rem,.7fr); gap:12px; }
.player { position:relative; aspect-ratio:16/9; overflow:hidden; background:#000; border:1px solid var(--line); border-radius:12px; }
.vhd { display:flex; align-items:center; gap:8px; }
.ytmark { display:inline-block; width:25px; height:18px; vertical-align:middle; background:var(--text); -webkit-mask:url(assets/media/74b8a7347731a61e88fd.png) center/contain no-repeat; mask:url(assets/media/74b8a7347731a61e88fd.png) center/contain no-repeat; }
.selbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:0 0 8px; }
.selbar .stat { margin:0; }
.btn.danger { color:var(--danger); border-color:var(--danger); }
.btn.danger:hover:not(:disabled) { color:var(--on); background:var(--danger); border-color:var(--danger); }
td.ck, th.ck { width:44px; padding-left:6px; padding-right:6px; }
.ck input { width:18px; height:18px; margin:0; accent-color:var(--accent); cursor:pointer; vertical-align:middle; }
.ck label { display:inline-flex; align-items:center; justify-content:center; min-width:32px; min-height:32px; cursor:pointer; }
.rank { display:inline-flex; align-items:center; gap:6px; flex-wrap:wrap; }
.rank img { height:30px; width:auto; display:block; }
.rank .rn { font-variant-numeric:tabular-nums; }
.lbback { position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,.8); }
.vbox.lb { position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); z-index:2001; width:min(96vw,calc((100vh - 170px)*16/9)); max-height:98vh; margin:0; overflow:auto; box-shadow:0 24px 80px rgba(0,0,0,.6); }
.player iframe,#vs-player { width:100% !important; height:100% !important; border:0; display:block; }
.ph { position:absolute; inset:0; display:grid; place-items:center; align-content:center; gap:4px; padding:16px; text-align:center; color:var(--sub); background:linear-gradient(135deg,var(--panel2,var(--bg)),var(--accent-soft)); }
.ph b { color:var(--text); font-size:.9375rem; }
.ph small { font-size:.6875rem; }
.controls { display:flex; align-items:center; flex-wrap:wrap; gap:6px; margin-top:8px; }
.controls .time { margin-left:auto; color:var(--sub); font-size:.75rem; font-variant-numeric:tabular-nums; }
.controls select { min-height:31px; padding:4px 8px; border:1px solid var(--line); border-radius:99px; background:var(--panel); color:var(--text); font-size:.75rem; }
.rounds { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:10px; }
.rounds .lbl { margin-right:3px; }
.rounds .stat { margin:0; }
.rounds .rbox { display:inline-flex; align-items:stretch; max-width:100%; border:2px solid var(--pop-edge,var(--line)); border-radius:14px; background:var(--panel); overflow:hidden; box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.rounds .rbox.set { border-color:color-mix(in srgb,var(--accent) 65%,var(--line)); background:color-mix(in srgb,var(--accent) 11%,var(--panel)); }
.rounds .rbox button { margin:0; padding:5px 7px; border:0; border-radius:0; background:transparent; color:var(--text); font:inherit; font-size:.76rem; line-height:1.2; cursor:pointer; box-shadow:none; transform:none; min-height:0; }
.rounds .rjump { display:inline-flex; align-items:baseline; gap:5px; }
.rounds .rjump b { font-size:.84rem; font-weight:900; letter-spacing:.02em; }
.rounds .rjump span { color:var(--sub); font-variant-numeric:tabular-nums; }
.rounds .rbox.set .rjump span { color:var(--text); font-weight:700; }
.rounds .rbox .rset, .rounds .rbox .rclr { border-left:1px solid var(--line); color:var(--sub); font-size:.7rem; }
.rounds .rbox .rclr { padding:5px 6px; font-size:.85rem; }
.rounds .rbox button:not(:disabled):hover { background:var(--accent); color:var(--on); }
.rounds .rbox button:not(:disabled):hover b, .rounds .rbox button:not(:disabled):hover span { color:inherit; }
.rounds .rbox button:focus-visible { outline:3px solid var(--accent); outline-offset:-3px; }
.rounds .rbox button:disabled { opacity:.45; cursor:not-allowed; }
.facts { display:grid; grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr)); gap:8px; }
.fact { padding:7px 10px; border:1px solid var(--line); border-radius:10px; background:var(--panel2,var(--bg)); min-width:0; }
.fact .k { display:block; color:var(--sub); font-size:.6875rem; font-weight:700; }
.fact .v { display:block; margin-top:1px; font-size:.8125rem; font-weight:700; overflow-wrap:anywhere; white-space:normal; }
.notes { margin:12px 0 0; border:1px solid var(--line); border-radius:12px; background:var(--panel); }
.notes > summary { cursor:pointer; padding:11px 14px; font-weight:700; font-size:.875rem; list-style-position:inside; }
.notes .body { padding:0 14px 14px; font-size:.8125rem; line-height:1.75; color:var(--sub); white-space:pre-wrap; }
@media(max-width:819px){.search{min-height:44px;font-size:16px;border-radius:12px}.chip{min-height:36px}.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.detail{grid-template-columns:1fr}.boxbody{padding:10px}.controls{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.controls .btn{min-width:0;padding:0 2px;min-height:42px;font-size:.72rem;white-space:nowrap}.controls select{grid-column:1/4;min-width:0}.controls .time{grid-column:4/8;width:auto;margin-left:0;text-align:right}}

/* 2026-10-30：スマホの幅では、表をやめて 1 試合ずつのカードにする（横に動かさなくても全部見える・押せる） */
@media(max-width:819px){
.scroll{overflow:visible;border:0;background:transparent;box-shadow:none}
.scroll table{min-width:0;display:block}
.scroll thead{display:block}
.scroll thead tr{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--line);border-radius:12px;background:var(--head);margin-bottom:8px}
.scroll thead th{display:none;position:static;padding:0;border:0;background:transparent}
.scroll thead th.ck{display:block;width:auto}
.scroll thead tr::after{content:"表示中の履歴をすべて選択";color:var(--sub);font-size:.75rem;font-weight:700}
.scroll tbody{display:grid;gap:8px}
.scroll tbody tr{display:block}
.scroll tbody tr.mrow{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(0,1fr) auto;align-items:center;gap:6px 8px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--panel)}
.scroll tbody td{display:block;padding:0;border:0;text-align:left;white-space:normal}
.scroll tbody tr:hover td{background:transparent}
.mrow .c-ck{grid-column:1;width:auto;padding:0}
.mrow .c-date{grid-column:2/4;font-weight:700;font-variant-numeric:tabular-nums}
.mrow .c-res{grid-column:4;text-align:right}
.mrow .c-chr{grid-column:1/-1;font-size:.9375rem;font-weight:800}
.mrow .c-kv{font-size:.75rem;color:var(--text)}
.mrow .c-kv::before{content:attr(data-l);display:block;color:var(--sub);font-size:.6875rem;font-weight:700}
.mrow .c-kv{grid-column:span 2;min-width:0;overflow-wrap:anywhere}
.mrow .c-play,.mrow .c-del{display:inline-flex}
.mrow .c-play{grid-column:1/3;justify-self:start}
.mrow .c-del{grid-column:3/-1;justify-self:end}
.mrow .c-play .btn,.mrow .c-del .btn{min-height:40px;padding:8px 18px}
.scroll tbody td[colspan]{grid-column:1/-1}
}

/* ===== 2026-11-01：チャッピー版の VS 画面（絞り込み・ポップアップ・ページ送り・お気に入り・メモ・右から出る詳細）を、本番の文字・色・動画プレイヤーのまま取り込んだ分 ===== */
.wrapsg { max-width:1320px; }
.historybox { overflow:visible; }
.boxhd .sub { white-space:nowrap; }

/* --- 絞り込み --- */
.advanced { margin:0 0 10px; padding:10px 0 12px; border-bottom:1px solid var(--line); }
.filtergrid { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,1.2fr) minmax(250px,.9fr); gap:12px; align-items:end; }
.row2 { display:grid; grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr); gap:12px; margin-top:10px; align-items:end; }
.field { position:relative; min-width:0; }
.field > label, .smalllabel { display:flex; align-items:center; gap:9px; margin:0 0 5px; color:var(--sub); font-size:.75rem; font-weight:700; }
.clearmini { color:var(--sub); font-weight:400; text-decoration:underline; cursor:pointer; background:none; border:0; padding:0; font-size:inherit; }
.clearmini:hover { color:var(--text); }
.selectlike, .sortselect, .dateinput, .calbtn { min-height:38px; border:2px solid var(--pop-edge,var(--line)); background:var(--panel); color:var(--text); box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.selectlike { width:100%; display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 13px; border-radius:999px; cursor:pointer; text-align:left; font-size:.875rem; }
.selectlike:hover, .selectlike.active { border-color:var(--accent); background:var(--accent-soft); }
.caret { font-size:.7rem; color:var(--sub); }
.sortselect { width:100%; border-radius:999px; padding:5px 12px; cursor:pointer; font-size:.875rem; }
.periodrow { display:flex; align-items:center; gap:7px; }
.dateinput { min-width:0; width:100%; border-radius:999px; padding:5px 12px; font-size:.875rem; cursor:pointer; }
.dateinput::placeholder { color:var(--ph,var(--sub)); }
.dateinput:focus { outline:none; border-color:var(--accent); }
.dash { color:var(--sub); }
.calbtn { flex:none; width:42px; border-radius:999px; cursor:pointer; padding:0; }
.quick { display:flex; gap:6px; flex-wrap:wrap; margin-top:7px; }
.quick button { background:transparent; color:var(--sub); border:1px solid var(--line); border-radius:999px; padding:4px 12px; font-size:.75rem; cursor:pointer; box-shadow:0 2px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.quick button:hover { border-color:var(--accent); color:var(--text); background:var(--accent-soft); }
.extra-line { display:flex; align-items:center; flex-wrap:wrap; gap:8px 16px; margin:8px 0; }
.favcheck { display:inline-flex; align-items:center; gap:6px; color:var(--sub); font-size:.8125rem; cursor:pointer; }
.favcheck input { width:17px; height:17px; margin:0; accent-color:var(--accent); }
.condition { color:var(--sub); font-size:.75rem; margin-left:auto; }
.condition b { color:var(--text); }
.clearall { box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5)); }

/* --- ポップアップ（キャラクター・段位・カレンダー） --- */
.popover { position:absolute; z-index:29; top:calc(100% + 7px); left:0; width:min(470px,92vw); display:none; padding:10px; border:2px solid var(--pop-edge,var(--line)); border-radius:22px; background:var(--panel); box-shadow:0 8px 0 var(--pop-shadow,rgba(0,0,0,.5)),0 28px 60px rgba(0,0,0,.5); }
.popover.open { display:block; }
.pophead { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:1px 4px 9px; color:var(--sub); font-size:.75rem; }
.pophead b { color:var(--text); }
.pophead button { border:0; background:transparent; color:var(--sub); cursor:pointer; }
.pophead button:hover { color:var(--text); }
.charpop { width:min(560px,calc(100vw - 48px)); }
.chargrid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; max-height:340px; overflow:auto; padding-right:4px; }
.rankpop { width:min(540px,92vw); }
#vs-pop-pr { left:0; right:auto; }
#vs-pop-or { left:calc(-100% - 12px); right:auto; }
.rankgrid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; max-height:390px; overflow:auto; padding-right:4px; }
.rankopt { display:grid; grid-template-columns:70px minmax(0,1fr) auto; align-items:center; gap:7px; min-height:52px; padding:5px 8px; border:1px solid var(--line); border-radius:12px; background:var(--panel2,var(--bg)); color:var(--text); cursor:pointer; text-align:left; }
.rankopt:hover { border-color:var(--accent); }
.rankopt[aria-pressed="true"] { border-color:var(--accent); background:var(--accent-soft); }
.rankopt img { max-width:66px; max-height:38px; object-fit:contain; }
.rankopt .rn { font-size:.75rem; font-weight:800; }
.rankopt .num { font-size:.6875rem; color:var(--sub); }
.calendar-pop { width:min(420px,92vw); }
.cal-title { padding:0 3px 8px; border-bottom:1px solid var(--line); font-size:.75rem; font-weight:800; }
.cal-nav { display:grid; grid-template-columns:36px 1fr 36px; align-items:center; gap:8px; margin:10px 0 8px; }
.cal-nav strong { text-align:center; font-size:.95rem; letter-spacing:.04em; color:var(--text); }
.cal-nav button { height:32px; border:1px solid var(--line); border-radius:9px; background:var(--panel2,var(--bg)); color:var(--text); font-size:1.15rem; line-height:1; cursor:pointer; }
.cal-nav button:hover { border-color:var(--accent); background:var(--accent-soft); }
.cal-week, .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:4px; }
.cal-week { padding:0 2px 4px; color:var(--sub); font-size:.65rem; text-align:center; }
.cal-day { height:34px; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--text); font-size:.72rem; cursor:pointer; }
.cal-day:hover { border-color:var(--accent); background:var(--accent-soft); }
.cal-day.out { opacity:.35; }
.cal-day.inrange { background:color-mix(in srgb,var(--accent) 12%,transparent); }
.cal-day.start, .cal-day.end { border-color:var(--accent); background:var(--accent); color:var(--on); font-weight:900; }
.cal-day.today { box-shadow:inset 0 0 0 1px var(--accent); }
.cal-wheel-note { text-align:center; margin:7px 0 2px; color:var(--sub); font-size:.62rem; }
.cal-two { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; }
.cal-two input { width:100%; height:38px; padding:5px 10px; border:1px solid var(--line); border-radius:10px; background:var(--panel2,var(--bg)); color:var(--text); cursor:pointer; }
.cal-two input:focus { outline:none; border-color:var(--accent); }
.cal-actions { display:flex; justify-content:flex-end; gap:7px; margin-top:12px; }
.cal-actions button { padding:5px 12px; border:1px solid var(--line); border-radius:999px; background:transparent; color:var(--sub); cursor:pointer; }
.cal-actions .apply { border-color:var(--accent); background:var(--accent); color:var(--on); font-weight:800; }

/* --- キャラクターの目元画像つきの札（軽くした画像を、表示する大きさで切り出して使う） --- */
.charpill, .charopt { position:relative; isolation:isolate; overflow:hidden; background-color:#12131b; }
.charpill::before, .charopt::before { content:""; position:absolute; inset:0; z-index:0; background:var(--eye,none) center/cover no-repeat; pointer-events:none; }
.charpill::after, .charopt::after { content:""; position:absolute; inset:0; z-index:1; border-radius:inherit; background:linear-gradient(90deg,rgba(10,11,16,.18) 0%,rgba(10,11,16,.38) 42%,rgba(10,11,16,.88) 76%,rgba(10,11,16,.97) 100%); box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),inset 0 -12px 18px rgba(0,0,0,.30); pointer-events:none; }
.charpill { display:inline-flex; align-items:center; justify-content:flex-end; min-width:126px; min-height:31px; padding:5px 12px; border-radius:999px; border:1px solid rgba(206,166,84,.30); }
.charopt { display:flex; align-items:center; justify-content:flex-end; text-align:right; padding:7px 12px; min-height:42px; border:1px solid var(--line); border-radius:999px; cursor:pointer; transition:border-color .14s ease,box-shadow .14s ease,filter .14s ease,transform .1s ease; }
.charopt:hover { border-color:color-mix(in srgb,var(--accent) 72%,white); filter:brightness(1.08); }
.charopt:active { transform:scale(.97); }
.charopt[aria-pressed="true"] { border:2px solid var(--accent); box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 24%,transparent),inset 0 0 0 1px color-mix(in srgb,var(--accent) 62%,transparent),0 3px 8px rgba(0,0,0,.42); background-color:color-mix(in srgb,var(--accent) 12%,#12131b); filter:brightness(1.12) saturate(1.08); }
.charopt[aria-pressed="true"]::after { background:linear-gradient(90deg,rgba(10,11,16,.08) 0%,rgba(10,11,16,.24) 42%,rgba(10,11,16,.74) 76%,rgba(10,11,16,.89) 100%); box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--accent) 42%,transparent),inset 0 -10px 18px rgba(0,0,0,.22); }
.chartxt { position:relative; z-index:2; display:inline-block; white-space:nowrap; color:#fff; font-family:"Dela Gothic One","Dela Gothic One Kanji",var(--font-ui,sans-serif); font-weight:800; font-synthesis:none; font-size:.82rem; line-height:1.12; letter-spacing:.005em; -webkit-text-stroke:.35px rgba(0,0,0,.88); paint-order:stroke fill; text-shadow:0 2px 0 rgba(0,0,0,.95),0 0 5px #000,0 1px 7px #000; }
.charopt .chartxt { font-size:.84rem; }
.charpill[title="範馬勇次郎"] .chartxt, .charopt[title="範馬勇次郎"] .chartxt { letter-spacing:.16em; }
.charopt[aria-pressed="true"] .chartxt { text-shadow:0 2px 0 rgba(0,0,0,.95),0 0 5px #000,0 0 10px color-mix(in srgb,var(--accent) 50%,transparent); }
.field[data-field="playerChar"]:has(.charopt[aria-pressed="true"]) > .selectlike, .field[data-field="opponentChar"]:has(.charopt[aria-pressed="true"]) > .selectlike { border-color:var(--accent); background:color-mix(in srgb,var(--accent) 9%,var(--panel)); }
.charvs { display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
.charvs .vs, .detail-charvs .vs { font-size:.7rem; font-weight:900; letter-spacing:.08em; color:var(--text); }
.rankmini { display:inline-flex; align-items:center; justify-content:center; gap:6px; flex-wrap:wrap; max-width:100%; }
.rankmini img { height:30px; width:auto; max-width:92px; object-fit:contain; }
.rankmini span { font-size:.72rem; }

/* --- 表（PC）。スマホは上の 819px 以下のカード表示を使う --- */
.mrow { cursor:pointer; }
.mrow.selected td { background:color-mix(in srgb,var(--accent) 11%,var(--panel)); }
.mrow.selected td:first-child { box-shadow:inset 3px 0 0 var(--accent); }
.sourceTag { display:inline-flex; align-items:center; border:1px solid var(--line); border-radius:99px; padding:2px 7px; font-size:.68rem; color:var(--sub); white-space:nowrap; margin-top:4px; }
.sourceTag.verified { border-color:var(--accent); color:var(--accent); background:color-mix(in srgb,var(--accent) 10%,transparent); }
.favbtn { width:36px; height:32px; display:inline-grid; place-items:center; border:1px solid var(--line); border-radius:999px; background:transparent; color:var(--sub); font-size:1.35rem; line-height:1; cursor:pointer; box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5)); transition:border-color .15s ease,background .15s ease,color .15s ease,transform .15s ease; }
.favbtn:hover { border-color:var(--accent); color:var(--accent); background:var(--accent-soft); }
.favbtn.on { border-color:var(--accent); background:var(--accent-soft); color:var(--accent); font-weight:900; transform:scale(1.05); }
.c-play .btn { padding:5px 12px; }
.c-play > div { margin-top:4px; }
.c-play .sourceTag { margin-top:0; }
@media(min-width:820px){
  .scroll { overflow-x:auto; }
  .scroll table { width:100%; min-width:1190px; table-layout:auto; }
  .scroll thead th, .scroll tbody td { padding-left:5px; padding-right:5px; }
  .scroll thead th:nth-child(7) { white-space:normal; line-height:1.3; }
  .scroll tbody td:nth-child(6) { white-space:normal; overflow-wrap:anywhere; max-width:150px; }
  .scroll th:nth-child(2), .scroll td.c-date { width:118px; }
  .scroll th:nth-child(3), .scroll td.c-res { width:66px; }
  .scroll th:nth-child(4), .scroll td.c-chr { width:270px; }
  .scroll th:nth-child(5) { width:64px; }
  .scroll th:nth-child(6) { width:96px; }
  .scroll th:nth-child(7) { width:140px; }
  .scroll th:nth-child(8) { width:100px; }
  .scroll th:nth-child(9) { width:76px; }
  .scroll th:nth-child(10) { width:104px; }
  .scroll th:nth-child(11) { width:82px; }
  .scroll th:nth-child(12) { width:62px; }
  .c-chr .charvs { min-width:0; flex-wrap:nowrap; gap:5px; justify-content:center; }
  .c-chr .charpill { min-width:112px; padding:4px 9px; min-height:30px; }
  .c-chr .charpill .chartxt { font-size:.79rem; }
  .c-chr .charvs .vs { flex:0 0 auto; }
}
@media(max-width:819px){
  .mrow .c-chr .charvs { justify-content:flex-start; flex-wrap:nowrap; }
  .mrow .c-chr .charpill { min-width:0; flex:1 1 0; max-width:170px; }
  .mrow .c-play, .mrow .c-fav, .mrow .c-del { display:inline-flex; align-items:center; }
  .mrow .c-play { grid-column:1/3; justify-self:start; flex-wrap:wrap; gap:6px; }
  .mrow .c-play > div { margin-top:0; }
  .mrow .c-fav { grid-column:3; justify-self:center; }
  .mrow .c-del { grid-column:4; justify-self:end; }
  .mrow .c-fav .favbtn { width:42px; height:40px; font-size:1.5rem; }
  .mrow.selected { border-color:var(--accent); background:color-mix(in srgb,var(--accent) 9%,var(--panel)); }
  .mrow.selected td, .mrow.selected td:first-child { background:transparent; box-shadow:none; }
}

/* --- ページ送り（100 件ずつ） --- */
.history-pagination { display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:6px; min-height:40px; padding:7px 4px; scroll-margin-top:90px; }
.history-pagination-top { margin:2px 0 8px; border-top:1px solid color-mix(in srgb,var(--line) 72%,transparent); border-bottom:1px solid color-mix(in srgb,var(--line) 72%,transparent); }
.history-pagination-bottom { margin:8px 0 0; border-top:1px solid color-mix(in srgb,var(--line) 72%,transparent); }
.history-pagination .page-btn { min-width:34px; height:34px; padding:0 10px; display:inline-grid; place-items:center; border:1px solid var(--line); border-radius:999px; background:var(--panel2,var(--bg)); color:var(--text); font-size:.76rem; font-weight:800; line-height:1; cursor:pointer; box-shadow:0 2px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.history-pagination .page-btn:hover:not(:disabled) { border-color:var(--accent); background:var(--accent-soft); }
.history-pagination .page-btn[aria-current="page"] { border-color:var(--accent); background:var(--accent); color:var(--on); cursor:default; }
.history-pagination .page-btn:disabled { opacity:.38; cursor:not-allowed; }
.history-pagination .page-ellipsis { min-width:22px; text-align:center; color:var(--sub); font-weight:800; user-select:none; }
.history-pagination .page-info { margin-left:5px; color:var(--sub); font-size:.68rem; white-space:nowrap; }

/* --- 右から出る「対戦内容」（動画・詳細・メモ）。時計と MENU（画面の上に固定）の下から画面いっぱいに出す --- */
#vs-side { position:fixed; z-index:30; top:calc(var(--pt-top-h,78px) + 6px); right:12px; bottom:12px; left:12px; display:grid; grid-template-columns:minmax(0,2fr) minmax(340px,1fr); grid-template-rows:auto minmax(0,1fr); gap:10px; overflow:hidden; padding:0; transform:translateX(calc(100% + 28px)); opacity:0; visibility:hidden; pointer-events:none; transition:transform .28s cubic-bezier(.22,.72,.28,1),opacity .2s ease,visibility .28s; background:rgba(0,0,0,.45); box-shadow:-16px 18px 56px rgba(0,0,0,.52); }
#vs-side.vs-side-open { transform:none; opacity:1; visibility:visible; pointer-events:auto; }
#vs-side.lbopen { z-index:2000; background:none; box-shadow:none; overflow:visible; }
.vs-side-head { grid-column:1/-1; grid-row:1; position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; gap:12px; min-width:0; min-height:64px; margin:0; padding:6px 10px 6px 12px; border:1px solid color-mix(in srgb,var(--accent) 40%,var(--line)); border-radius:12px; background:color-mix(in srgb,var(--panel) 94%,black); box-shadow:0 6px 18px rgba(0,0,0,.28); }
.vs-side-head-left { display:flex; align-items:center; gap:9px; min-width:0; }
.vs-side-mark { flex:none; width:8px; height:24px; border-radius:99px; background:var(--accent); box-shadow:0 0 16px color-mix(in srgb,var(--accent) 35%,transparent); }
.vs-side-head strong { font-size:.9rem; letter-spacing:.02em; white-space:nowrap; }
.vs-side-head small { display:block; max-width:100%; color:var(--sub); font-size:.68rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.vs-side-close { width:50px; height:50px; flex:0 0 50px; display:grid; place-items:center; padding:0; border:2px solid color-mix(in srgb,var(--accent) 30%,var(--line)); border-radius:50%; background:color-mix(in srgb,var(--panel2,var(--bg)) 96%,black); color:var(--text); font-size:28px; font-weight:500; line-height:1; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,.30); transition:background .15s ease,color .15s ease,border-color .15s ease,transform .12s ease,box-shadow .15s ease; }
.vs-side-close:hover { border-color:var(--accent); background:var(--accent); color:var(--on); box-shadow:0 5px 16px rgba(0,0,0,.42); }
.vs-side-close:active { transform:scale(.92); }
.vs-side-close:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
.vs-side-edge-tab { position:fixed; right:0; top:50%; z-index:28; transform:translateY(-50%); writing-mode:vertical-rl; letter-spacing:.08em; padding:13px 7px; border:1px solid color-mix(in srgb,var(--accent) 50%,var(--line)); border-right:0; border-radius:10px 0 0 10px; background:var(--panel); color:var(--sub); font-size:.67rem; font-weight:800; opacity:.78; pointer-events:none; transition:opacity .2s; }
#vs-side.vs-side-open ~ .vs-side-edge-tab { opacity:0; }

/* 動画の箱（左） */
#vs-side > .vbox { grid-column:1; grid-row:2; margin:0; min-width:0; min-height:0; display:flex; flex-direction:column; overflow:hidden; }
#vs-side > .vbox > .boxhd, #vs-side > .vs-detail-info > .boxhd { box-sizing:border-box; min-height:48px; height:48px; padding:11px 14px; }
#vs-side > .vbox .boxhd h2 { font-size:1rem; }
#vs-side > .vbox .boxbody { display:flex; flex-direction:column; min-height:0; flex:1; overflow:hidden; }
#vs-side > .vbox .player { flex:1; min-height:260px; aspect-ratio:auto; height:auto; }
#vs-side > .vbox .controls, #vs-side > .vbox .rounds { flex:0 0 auto; }
#vs-side .vhd { gap:10px; }
.vs-yt { display:inline-flex; align-items:center; }
@media(min-width:821px){
  #vs-side > .vbox .controls { position:relative; justify-content:center; padding-left:96px; padding-right:96px; }
  #vs-side > .vbox .controls .time { position:absolute; right:0; top:50%; transform:translateY(-50%); margin-left:0; white-space:nowrap; }
}
/* 拡大（ライトボックス）：時計・MENU より手前に出す */
#vs-side .lbback { position:fixed; inset:0; z-index:2000; background:rgba(0,0,0,.8); cursor:zoom-out; }
#vs-side.lbopen .vbox.lb { position:fixed; left:50%; top:6px; bottom:auto; transform:translateX(-50%); z-index:2001; width:min(94vw,calc((100vh - 158px)*16/9),1320px); max-width:1320px; max-height:calc(100vh - 12px); margin:0; overflow:hidden; box-shadow:0 28px 90px rgba(0,0,0,.72); display:flex; flex-direction:column; }
#vs-side.lbopen .vbox.lb .boxbody { max-height:calc(100vh - 60px); }
#vs-side.lbopen .vbox.lb .player { aspect-ratio:16/9; flex:1 1 auto; min-height:0; }
#vs-side.lbopen .vbox.lb #vs-zoom { border-color:var(--accent); color:var(--accent); }

/* 詳細の箱（右）。上下の矢印で前後の試合へ */
#vs-side > .vs-detail-info { grid-column:2; grid-row:2; margin:0; min-width:0; min-height:0; display:flex; flex-direction:column; position:relative; overflow:visible; }
#vs-side > .vs-detail-info .boxbody { flex:1 1 auto; display:flex; flex-direction:column; min-height:0; overflow-y:auto; overscroll-behavior:contain; padding:7px 20px 9px; }
#vs-side > .vs-detail-info .facts { grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px 7px; flex:1 0 auto; align-content:stretch; }
#vs-side > .vs-detail-info .fact { display:grid; grid-template-rows:auto minmax(0,1fr); align-items:stretch; text-align:left; min-height:45px; padding:5px 9px; border-radius:16px; }
#vs-side > .vs-detail-info .fact.fact-character { grid-column:1/-1; min-height:60px; }
#vs-side > .vs-detail-info .fact > .k { width:100%; align-self:start; font-size:.66rem; line-height:1.2; }
#vs-side > .vs-detail-info .fact > .v { width:100%; min-width:0; min-height:0; margin-top:0; display:flex; align-items:center; justify-content:center; text-align:center; font-size:.80rem; line-height:1.22; }
#vs-side > .vs-detail-info .fact > .v * { text-align:center; }
.detail-charvs { display:grid; grid-template-columns:minmax(0,1fr) auto minmax(0,1fr); align-items:center; gap:12px; width:100%; margin:1px 0; }
.detail-charvs .charpill { width:100%; min-width:0; max-width:none; min-height:47px; padding:5px 13px; border-radius:999px; }
.detail-charvs .charpill .chartxt { font-size:.9rem; }
.detail-charvs .vs { justify-self:center; font-size:.9rem; font-weight:900; letter-spacing:.12em; line-height:1; white-space:nowrap; }
#vs-side .rankmini img { max-height:26px; }
#vs-side .notes { margin:6px 0 0; border-radius:17px; flex:0 0 auto; }
#vs-side .notes > summary { padding:7px 10px; font-size:.76rem; line-height:1.2; }
.memo-editor { padding:0 10px 8px; }
#vs-memo { display:block; width:100%; height:64px; min-height:54px; max-height:150px; resize:vertical; border:1px solid var(--line); border-radius:10px; background:var(--panel2,var(--bg)); color:var(--text); padding:8px 10px; font:inherit; font-size:.76rem; line-height:1.45; outline:none; }
#vs-memo:focus { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-soft); }
#vs-memo::placeholder { color:var(--ph,var(--sub)); }
#vs-memo:disabled { opacity:.5; }
.memo-toolbar { display:flex; align-items:center; gap:6px; margin-top:6px; min-height:28px; }
.memo-status { color:var(--sub); font-size:.69rem; margin-right:auto; }
.memo-status.saving { color:var(--accent); }
.memo-status.error { color:var(--danger); }
.memo-count { color:var(--sub); font-size:.68rem; font-variant-numeric:tabular-nums; }
.memo-toolbar .btn { padding:4px 10px; font-size:.69rem; }
.vs-cycle-btn { position:absolute; top:50%; z-index:35; transform:translateY(-50%); width:42px; height:72px; display:grid; place-items:center; padding:0; border:1px solid color-mix(in srgb,var(--accent) 55%,var(--line)); background:color-mix(in srgb,var(--panel) 96%,black); color:var(--accent); box-shadow:0 7px 22px rgba(0,0,0,.42); cursor:pointer; font-size:30px; font-weight:900; line-height:1; transition:background .18s ease,color .18s ease,transform .18s ease,border-color .18s ease; }
.vs-cycle-btn:hover { background:var(--accent); color:var(--on); border-color:var(--accent); }
.vs-cycle-btn:active { transform:translateY(-50%) scale(.94); }
.vs-cycle-btn.prev { left:-22px; border-radius:0 13px 13px 0; }
.vs-cycle-btn.next { right:-1px; border-radius:13px 0 0 13px; }
.vs-cycle-btn span { transform:translateY(-1px); }
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
/* 詳細の文字は、メモ以外は選択・コピー・ドラッグできない（チャッピー版の仕様） */
#vs-side, #vs-side * { -webkit-user-select:none; user-select:none; -webkit-user-drag:none; }
#vs-side #vs-memo { -webkit-user-select:text; user-select:text; -webkit-user-drag:auto; }
#vs-side #vs-memo::selection { background:var(--accent); color:var(--on); }

@media(max-width:1180px){
  #vs-side { grid-template-columns:minmax(0,1.8fr) minmax(320px,1fr); }
  #vs-side > .vs-detail-info .facts { grid-template-columns:1fr; }
  #vs-side > .vs-detail-info .fact.fact-character { grid-column:auto; }
  .detail-charvs { grid-template-columns:1fr; gap:6px; }
  .detail-charvs .vs { padding:2px 0; }
}
@media(max-width:900px){
  .filtergrid { grid-template-columns:1fr 1fr; }
  .row2 { grid-template-columns:1fr; }
  .charpop { width:min(520px,calc(100vw - 36px)); }
  #vs-pop-or { left:0; right:auto; }
}
@media(max-width:819px){
  #vs-side { top:76px; right:7px; bottom:7px; left:7px; grid-template-columns:1fr; grid-template-rows:auto max-content max-content; align-content:start; overflow-y:auto; }
  #vs-side > .vbox { grid-column:1; grid-row:2; min-height:0; }
  #vs-side > .vbox { display:block; overflow:hidden; }
  #vs-side > .vbox .boxbody { display:block; overflow:visible; }
  #vs-side > .vbox .player { flex:none; width:100%; min-height:0; aspect-ratio:16/9; }
  #vs-side > .vs-detail-info { grid-column:1; grid-row:3; min-height:360px; }
  #vs-side > .vs-detail-info > .boxhd .sub { display:none; }
  #vs-side > .vs-detail-info > .boxhd { padding-left:66px; padding-right:66px; justify-content:center; }
  #vs-side > .vs-detail-info .boxbody { overflow:visible; padding-left:14px; padding-right:14px; }
  .vs-cycle-btn { top:42px; width:46px; height:46px; border-radius:50% !important; }
  .vs-cycle-btn.prev { left:10px; }
  .vs-cycle-btn.next { right:10px; }
  .history-pagination { scroll-margin-top:80px; }
  .vs-side-edge-tab { display:none; }
}
@media(max-width:560px){
  .filtergrid { grid-template-columns:1fr; }
  .charpop { width:calc(100vw - 28px); }
  .chargrid { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .charopt .chartxt { font-size:.76rem; }
  #vs-side { top:72px; right:0; bottom:0; left:0; padding:0 7px 8px; background-clip:content-box; box-shadow:inset 7px 0 0 rgba(0,0,0,.33), inset -7px 0 0 rgba(0,0,0,.13), inset 0 -8px 0 rgba(0,0,0,.40); }
  .vs-side-close { width:52px; height:52px; flex-basis:52px; font-size:30px; }
  .history-pagination { gap:4px; padding:6px 2px; }
  .history-pagination .page-btn { min-width:31px; height:31px; padding:0 8px; font-size:.72rem; }
  .history-pagination .page-info { flex-basis:100%; margin:2px 0 0; text-align:center; }
}
@media(hover:none){ .cal-wheel-note { display:none; } }
@media(prefers-reduced-motion:reduce){ #vs-side, .vs-side-edge-tab, .vs-cycle-btn, .charopt { transition:none !important; } }
/*POP-START*/
.chip,.btn { border-radius:999px; box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5)); transition:transform .22s var(--pop-ease,ease),box-shadow .22s var(--pop-ease,ease); }
.chip:hover:not(:disabled),.btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5));}
.chip:active:not(:disabled),.btn:active:not(:disabled){transform:translateY(2px);box-shadow:0 1px 0 var(--pop-shadow,rgba(0,0,0,.5));}
.search,.controls select { border:2px solid var(--pop-edge,var(--line)); border-radius:999px; box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.metric,.fact { border:2px solid var(--pop-edge,var(--line)); border-radius:20px; box-shadow:0 4px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.box,.notes,.player { border:2px solid var(--pop-edge,var(--line)); border-radius:22px; box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.scroll { border:2px solid var(--pop-edge,var(--line)); border-radius:22px; box-shadow:0 5px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.empty { border-width:2px; border-radius:22px; }
@media(prefers-reduced-motion:reduce){.chip,.btn{transition:none!important;transform:none!important}}
.selectlike,.sortselect,.dateinput { border:2px solid var(--pop-edge,var(--line)); border-radius:999px; box-shadow:0 3px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.popover { border:2px solid var(--pop-edge,var(--line)); border-radius:20px; box-shadow:0 6px 0 var(--pop-shadow,rgba(0,0,0,.5)); }
.history-pagination .page-btn { border-radius:999px; }
/*POP-END*/
`;
  const EYES = window.PT_EYES || {};
  // キャラクター：[コード（Recorder / 公開データの綴り）, 表示名]。目元画像は pt_eyes.js（コードごとに 1 枚）
  const CHARACTERS = [["ALISA","アリサ"],["ANNA","アンナ"],["ARMOR KING","アーマーキング"],["ASUKA","飛鳥"],["AZUCENA","アズセナ"],["BOB","ボブ"],["BRYAN","ブライアン"],["CLAUDIO","クラウディオ"],["CLIVE","クライヴ"],["DEVIL JIN","デビル仁"],["DRAGUNOV","ドラグノフ"],["EDDY","エディ"],["FAHKUMRAM","ファーカムラム"],["FENG","フェン"],["HEIHACHI","平八"],["HWOARANG","ファラン"],["JACK-8","ジャック8"],["JIN","仁"],["JUN","準"],["KAZUYA","一八"],["KING","キング"],["KUMA","クマ"],["KUNIMITSU","州光"],["LARS","ラース"],["LAW","ロウ"],["LEE","リー"],["LEO","レオ"],["LEROY","リロイ"],["LIDIA","リディア"],["LILI","リリ"],["MIARY","ミアリズ"],["NINA","ニーナ"],["PANDA","パンダ"],["PAUL","ポール"],["RAVEN","レイヴン"],["REINA","麗奈"],["ROGER JR.","ロジャーjr"],["SHAHEEN","シャヒーン"],["STEVE","スティーブ"],["VICTOR","ヴィクター"],["XIAOYU","シャオユウ"],["YOSHIMITSU","吉光"],["YUJIRO HANMA","範馬勇次郎"],["ZAFINA","ザフィーナ"]];
  const CHAR_LABEL = new Map(CHARACTERS);
  const CHAR_IDX = new Map(CHARACTERS.map((c, i) => [c[0], i]));
  const CHAR_ALIAS = { "MIARY ZO": "MIARY", "MIARY ZŌ": "MIARY", "JACK8": "JACK-8", "JACK 8": "JACK-8" };
  // サーバー（Recorder・公開データ）の綴りを、画面のコードにそろえる。知らない名前は '' （文字だけの札にする）
  const charCode = v => { const s = String(v == null ? '' : v).trim().toUpperCase(); const c = CHAR_ALIAS[s] || s; return CHAR_LABEL.has(c) ? c : '' };
  const charName = v => { const c = charCode(v); return c ? CHAR_LABEL.get(c) : (clean(v, 64) || '—') };
  const pill = (v, extra) => { const c = charCode(v); const name = charName(v); const eye = c && EYES[c] ? ' eye' + CHAR_IDX.get(c) : ''; return '<span class="charpill ' + (extra || '') + eye + '" title="' + esc(name) + '"><span class="chartxt">' + esc(name) + '</span></span>' };
  const charVs = (a, b) => '<span class="charvs">' + pill(a) + '<span class="vs">VS</span>' + pill(b) + '</span>';
  const detailCharVs = (a, b) => '<span class="detail-charvs">' + pill(a) + '<span class="vs">VS</span>' + pill(b) + '</span>';

  // ---- 文字・番号の安全な整え方（サーバーから来る値は、そのまま信用しない） ----
  const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max || 512);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MEMO_MAX = 2000;
  const modeName = v => ({ ranked: 'ランクマッチ', quick: 'クイックマッチ', player_match: 'プレイヤーマッチ', group_match: 'グループマッチ', lounge: 'ラウンジ', offline: 'オフライン', other: 'その他', unknown: '不明' }[v] || v || '—');
  const num = v => v == null || v === '' ? '—' : Number(v).toLocaleString('ja-JP');
  const toDate = v => { if (!v) return null; const d = new Date(typeof v === 'string' && /T\d\d:\d\d(:\d\d(\.\d+)?)?$/.test(v) ? v + 'Z' : v); return Number.isNaN(d.getTime()) ? null : d };
  const date = v => { const d = toDate(v); return d ? new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d) : (v ? String(v) : '—') };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dayOf = m => { const d = toDate(m.startedAt || m.date); return d ? ymd(d) : '' };
  const time = s => { s = Math.max(0, Number(s) || 0); const m = Math.floor(s / 60), x = Math.floor(s % 60), ms = Math.floor((s - Math.floor(s)) * 1000); return String(m).padStart(2, '0') + ':' + String(x).padStart(2, '0') + '.' + String(ms).padStart(3, '0') };
  const duration = v => { if (v == null || v === '') return '—'; const sec = Number(v) > 100000 ? Number(v) / 1000 : Number(v); if (!Number.isFinite(sec)) return String(v); return time(sec) };
  const resultKey = m => { const r = String(m && m.result || '').toLowerCase(); return r === 'win' ? 'win' : r === 'loss' || r === 'lose' ? 'loss' : r === 'draw' ? 'draw' : '' };
  const resultLabel = m => ({ win: 'WIN', loss: 'LOSE', draw: 'DRAW' }[resultKey(m)] || '—');
  const roundsText = m => (m.playerRoundsWon == null && m.opponentRoundsWon == null) ? '—' : (m.playerRoundsWon ?? '—') + ' - ' + (m.opponentRoundsWon ?? '—');
  // 段位：名前 → [番号, 表示する数字, 画像]（破壊神壱〜∞ は 101〜108 段）
  const RANKS = {}; const RANK_LIST = window.PT_RANKS || [];
  RANK_LIST.forEach(r => { RANKS[r[0]] = { no: r[1], number: r[2], img: r[3] } });
  const rankNo = v => { const r = RANKS[v]; return r ? r.no : 0 };
  const rankNum = v => { const r = RANKS[v]; return r ? r.number + '段' : '' };
  const rankHtml = v => { if (!v) return '—'; const r = RANKS[v]; return r ? '<span class="rankmini"><img src="' + r.img + '" alt="' + esc(v) + '"><span>' + esc(v) + '（' + r.number + '段）</span></span>' : esc(clean(v, 32)) };

  // ---- 画面の骨組み ----
  const FIELDS = [['pc', 'playerChar', '使用キャラクター'], ['oc', 'opponentChar', '相手キャラクター']];
  const charField = ([k, key, label]) => '<div class="field" data-field="' + key + '"><label>' + label + ' <button type="button" class="clearmini" data-clear="' + key + '">この項目をクリア</button></label><button type="button" class="selectlike" data-popup="vs-pop-' + k + '" aria-expanded="false"><span id="vs-lbl-' + key + '">' + label + '（複数可）</span><span class="caret">▼</span></button><div class="popover charpop" id="vs-pop-' + k + '"><div class="pophead"><b>' + label + '</b><button type="button" data-close>閉じる</button></div><div class="chargrid" id="vs-grid-' + key + '"></div></div></div>';
  const rankField = ([k, key, label]) => '<div class="field" data-field="' + key + '"><label>' + label + ' <button type="button" class="clearmini" data-clear="' + key + '">この項目をクリア</button></label><button type="button" class="selectlike" data-popup="vs-pop-' + k + '" aria-expanded="false"><span id="vs-lbl-' + key + '">段位を選択（複数可）</span><span class="caret">▼</span></button><div class="popover rankpop" id="vs-pop-' + k + '"><div class="pophead"><b>' + label + '</b><button type="button" data-close>閉じる</button></div><div class="rankgrid" id="vs-grid-' + key + '"></div></div></div>';
  const chip = (attr, val, text, on) => '<button type="button" class="chip" data-' + attr + '="' + val + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + text + '</button>';
  // 目元の画像（pt_eyes.js）を、キャラごとのクラス eye0〜 の --eye に入れる（見た目は CSS の .charpill / .charopt）
  const EYE_CSS = CHARACTERS.map((c, i) => EYES[c[0]] ? '.eye' + i + '{--eye:url(' + EYES[c[0]] + ')}' : '').join('');
  root.innerHTML = '<style>' + CSS + EYE_CSS + '</style><div class="wrapsg">' +
    '<div class="summary">' +
      '<div class="metric"><span class="k">Matches</span><span class="v" id="vs-matches">0</span></div>' +
      '<div class="metric"><span class="k">Wins</span><span class="v" id="vs-wins">0</span></div>' +
      '<div class="metric"><span class="k">Losses</span><span class="v" id="vs-losses">0</span></div>' +
      '<div class="metric"><span class="k">Win Rate</span><span class="v" id="vs-rate">—</span></div>' +
    '</div>' +
    '<div class="box historybox"><div class="boxhd"><h2>VSデータ</h2><span class="sub" id="vs-count">0 matches</span></div><div class="boxbody">' +
      '<div class="advanced">' +
        '<div class="filtergrid">' + charField(FIELDS[0]) + charField(FIELDS[1]) +
          '<div class="field"><label for="vs-sort">並び替え</label><select class="sortselect" id="vs-sort">' +
            '<option value="dateDesc">日時：新しい順</option><option value="dateAsc">日時：古い順</option>' +
            '<option value="powerDesc">自分のTEKKEN POWER：高い順</option><option value="powerAsc">自分のTEKKEN POWER：低い順</option>' +
            '<option value="oppPowerDesc">相手のTEKKEN POWER：高い順</option><option value="oppPowerAsc">相手のTEKKEN POWER：低い順</option>' +
            '<option value="rankDesc">自分の段位：高い順</option><option value="rankAsc">自分の段位：低い順</option>' +
            '<option value="oppRankDesc">相手の段位：高い順</option><option value="oppRankAsc">相手の段位：低い順</option>' +
            '<option value="durationDesc">動画時間：長い順</option><option value="durationAsc">動画時間：短い順</option>' +
          '</select></div>' +
        '</div>' +
        '<div class="row2">' +
          '<div class="field"><label>期間 <button type="button" class="clearmini" data-clear="period">この項目をクリア</button></label>' +
            '<div class="periodrow"><input class="dateinput" id="vs-date-start" type="text" inputmode="none" placeholder="年/月/日" aria-label="開始日" data-popup="vs-pop-cal" data-cal-target="start" readonly><span class="dash">〜</span><input class="dateinput" id="vs-date-end" type="text" inputmode="none" placeholder="年/月/日" aria-label="終了日" data-popup="vs-pop-cal" data-cal-target="end" readonly><button type="button" class="calbtn" data-popup="vs-pop-cal" title="カレンダー" aria-label="カレンダーを開く">📅</button></div>' +
            '<div class="quick"><button type="button" data-days="7">直近7日</button><button type="button" data-days="30">直近30日</button><button type="button" data-days="90">直近90日</button></div>' +
            '<div class="popover calendar-pop" id="vs-pop-cal"><div class="cal-title">期間を選択</div><div class="cal-nav"><button type="button" id="vs-cal-prev" aria-label="前の月">‹</button><strong id="vs-cal-label">—</strong><button type="button" id="vs-cal-next" aria-label="次の月">›</button></div><div class="cal-week"><span>日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span>土</span></div><div class="cal-grid" id="vs-cal-grid" aria-label="カレンダー"></div><div class="cal-wheel-note">マウスホイールで前後の月へ移動できます</div><div class="cal-two"><div><div class="smalllabel">開始日</div><input type="text" inputmode="none" placeholder="年/月/日" id="vs-cal-start" readonly data-cal-pick="start" aria-label="開始日"></div><div><div class="smalllabel">終了日</div><input type="text" inputmode="none" placeholder="年/月/日" id="vs-cal-end" readonly data-cal-pick="end" aria-label="終了日"></div></div><div class="quick"><button type="button" data-cal-days="7">直近7日</button><button type="button" data-cal-days="30">直近30日</button><button type="button" data-cal-days="90">直近90日</button></div><div class="cal-actions"><button type="button" id="vs-cal-clear">クリア</button><button type="button" class="apply" id="vs-cal-apply">適用</button></div></div>' +
          '</div>' + rankField(['pr', 'playerRank', '自分の段位']) + rankField(['or', 'opponentRank', '相手の段位']) +
        '</div>' +
      '</div>' +
      '<div class="sbox"><input class="search" id="vs-q" type="search" inputmode="search" autocomplete="off" aria-label="対戦履歴を検索" placeholder="対戦相手・キャラクター・段位・TEKKEN POWER・モード・日付などで検索（スペースで区切ると全部を含むものだけ）"></div>' +
      '<div class="filters">' +
        '<div class="fgrp" id="vs-result-filter"><span class="lbl">勝敗</span>' + chip('result', '', 'すべて', true) + chip('result', 'win', '勝利') + chip('result', 'loss', '敗北') + chip('result', 'draw', '引き分け') + '</div>' +
        '<div class="fgrp" id="vs-video-filter"><span class="lbl">動画</span>' + chip('video', '', 'すべて', true) + chip('video', 'yes', 'あり') + chip('video', 'no', 'なし') + '</div>' +
        '<div class="fgrp" id="vs-source-filter"><span class="lbl">データ状態</span>' + chip('source', '', 'すべて', true) + chip('source', 'verified', 'VSデータ確認済み') + chip('source', 'recorder', 'Recorder記録') + '</div>' +
      '</div>' +
      '<div class="extra-line"><label class="favcheck"><input type="checkbox" id="vs-fav-only"> ♥ お気に入りのみ</label><span class="condition">現在の検索条件：<b id="vs-cond">条件なし</b></span></div>' +
      '<div class="selbar"><p class="stat" id="vs-stat" role="status" aria-live="polite"></p><button type="button" class="btn clearall" id="vs-clearall">すべてクリア</button><button type="button" class="btn danger" id="vs-delsel" disabled>選択した履歴を削除</button></div>' +
      '<nav class="history-pagination history-pagination-top" id="vs-pg-top" aria-label="対戦履歴 ページ選択" hidden></nav>' +
      '<div class="scroll"><table><thead><tr><th class="ck"><label><input type="checkbox" id="vs-ckall" aria-label="表示中の履歴をすべて選択"></label></th><th>日時</th><th>勝敗</th><th>キャラクター</th><th>ラウンド</th><th>対戦相手</th><th>TEKKEN POWER<br>（自分 / 相手）</th><th>モード</th><th>動画時間</th><th>動画</th><th>お気に入り</th><th>削除</th></tr></thead><tbody id="vs-body"></tbody></table></div>' +
      '<nav class="history-pagination history-pagination-bottom" id="vs-pg-bottom" aria-label="対戦履歴 ページ選択" hidden></nav>' +
    '</div></div>' +
    '<section class="detail" id="vs-side" aria-hidden="true" aria-label="対戦内容">' +
      '<div class="vs-side-head"><div class="vs-side-head-left"><span class="vs-side-mark"></span><div><strong>対戦内容</strong><small id="vs-side-sub">対戦履歴から試合を選択してください</small></div></div><button type="button" class="vs-side-close" id="vs-side-close" aria-label="対戦内容を閉じる" title="閉じる">×</button></div>' +
      '<div class="lbback" id="vs-lbback" hidden></div>' +
      '<div class="box vbox" id="vs-vbox"><div class="boxhd"><h2>対戦動画</h2><span class="vhd"><span class="sub" id="vs-video-state">NO VIDEO</span><button type="button" class="btn" id="vs-zoom" aria-pressed="false" title="動画を大きく表示（Esc で戻る）">拡大</button></span></div><div class="boxbody">' +
        '<div class="player"><div id="vs-player"></div><div class="ph" id="vs-ph"><b>試合を選択してください</b><small>録画動画がある対戦を選ぶと、ここで再生できます。</small></div></div>' +
        '<div class="controls"><button class="btn" id="vs-b5" disabled>−5秒</button><button class="btn" id="vs-b1" disabled>−1秒</button><button class="btn" id="vs-bf" disabled>−1F</button><button class="btn primary" id="vs-play" disabled>再生</button><button class="btn" id="vs-ff" disabled>+1F</button><button class="btn" id="vs-f1" disabled>+1秒</button><button class="btn" id="vs-f5" disabled>+5秒</button><select id="vs-fps" aria-label="FPS"><option value="60">60 FPS</option><option value="59.94">59.94 FPS</option><option value="30">30 FPS</option></select><span class="time" id="vs-time">00:00.000</span></div>' +
        '<div class="rounds" id="vs-rounds" role="group" aria-label="ラウンド別ジャンプ"><span class="lbl">ラウンド</span><span class="stat">試合を選択すると表示されます。</span></div>' +
      '</div></div>' +
      '<div class="box vs-detail-info"><div class="boxhd"><h2>対戦・動画内容</h2><span class="sub">MATCH DETAIL</span></div>' +
        '<button type="button" class="vs-cycle-btn prev" id="vs-prev" aria-label="前の対戦履歴へ" title="前の対戦履歴へ"><span aria-hidden="true">◀</span></button>' +
        '<button type="button" class="vs-cycle-btn next" id="vs-next" aria-label="次の対戦履歴へ" title="次の対戦履歴へ"><span aria-hidden="true">▶</span></button>' +
        '<div class="boxbody"><div class="facts" id="vs-facts"></div>' +
          '<details class="notes" open><summary>動画内容・メモ</summary><div class="memo-editor"><textarea id="vs-memo" maxlength="' + MEMO_MAX + '" placeholder="この対戦のメモを入力してください" aria-label="この対戦のメモ" disabled></textarea><div class="memo-toolbar"><span class="memo-status" id="vs-memo-status" role="status">—</span><span class="memo-count"><span id="vs-memo-count">0</span>/' + MEMO_MAX + '</span><button type="button" class="btn" id="vs-memo-clear">クリア</button><button type="button" class="btn primary" id="vs-memo-save">保存</button></div></div></details>' +
        '</div></div>' +
    '</section>' +
    '<div class="vs-side-edge-tab" aria-hidden="true">履歴をクリックして詳細表示</div>' +
  '</div>';

  const $ = id => root.getElementById('vs-' + id);
  const $$ = sel => [...root.querySelectorAll(sel)];
  const side = $('side');

  // ---- 状態 ----
  let matches = [], filteredList = [], selectedId = null, player = null, clock = 0, emptyMsg = '', loadedAt = 0, loading = false, totalOnServer = 0, loadingMore = false;
  const checked = new Set();
  const F = { playerChar: new Set(), opponentChar: new Set(), playerRank: new Set(), opponentRank: new Set(), result: '', video: '', source: '' };
  const PAGE_SIZE = 100; let page = 1, sig = '';
  let durations = {}; try { durations = JSON.parse(localStorage.getItem('project-t-vs-durations') || '{}') || {} } catch (_) {}
  const durSec = m => { const s = m && m.youtubeVideoId ? durations[m.youtubeVideoId] : null; return s || 0 };
  const durText = m => { const s = durSec(m); return s ? time(s).replace(/\.\d+$/, '') : '—' };
  const byId = id => matches.find(m => m.id === id) || null;
  let statTimer = 0;
  const flash = html => { $('stat').innerHTML = html; clearTimeout(statTimer); statTimer = setTimeout(() => render(), 4500) };

  // ---- サーバーとの通信（なりすまし防止の合言葉 CSRF つき。ログインページを開いていなくても、ここで受け取る） ----
  function apiBase() {
    const explicit = typeof window.PROJECT_T_AUTH_API_BASE === 'string' ? window.PROJECT_T_AUTH_API_BASE.trim() : '';
    if (explicit) return explicit.replace(/\/$/, '');
    try { const saved = localStorage.getItem('project-t-auth-api-base'); if (saved) return saved.replace(/\/$/, '') } catch (_) {}
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') return 'http://localhost:8000';
    return '';
  }
  async function csrf(base, fresh) {
    const me = window.__PROJECT_T_ME; if (!fresh && me && me.csrf_token) return me.csrf_token;
    const r = await fetch(base + '/api/v1/me', { credentials: 'include', headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(r.status === 401 ? 'ログインしていません' : 'HTTP ' + r.status);
    const j = await r.json(); window.__PROJECT_T_ME = j; return j.csrf_token || '';
  }
  async function apiPost(path, body, keepalive) {
    const base = apiBase();
    const send = tok => fetch(base + path, { method: 'POST', credentials: 'include', keepalive: !!keepalive, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': tok }, body: JSON.stringify(body) });
    let res = await send(await csrf(base, false));
    if (res.status === 403) res = await send(await csrf(base, true));   // 合言葉の期限切れ（2時間）なら、取り直してもう一度
    if (!res.ok) throw new Error(res.status === 401 ? 'ログインしていません' : 'HTTP ' + res.status);
    return res.json().catch(() => ({}));
  }
  const apiMatch = m => ({
    id: String(m.id), opponentName: clean(m.opponent_name, 128), result: m.result, playerCharacter: m.player_character, opponentCharacter: m.opponent_character,
    playerRoundsWon: m.player_rounds_won, opponentRoundsWon: m.opponent_rounds_won, playerTekkenPower: m.player_tekken_power, opponentTekkenPower: m.opponent_tekken_power,
    playerRank: m.player_rank, opponentRank: m.opponent_rank, mode: m.mode, startedAt: m.started_at, youtubeVideoId: m.youtube_video_id, youtubeUrl: m.youtube_url, videoTitle: clean(m.video_title, 200),
    favorite: !!m.favorite, memo: clean(m.memo, MEMO_MAX), onServer: Object.prototype.hasOwnProperty.call(m, 'favorite'),
    wavu: m.wavu && typeof m.wavu === 'object' ? m.wavu : null,
    roundMarks: srvMarks(m.round_marks)   // ラウンドの開始位置（サーバーが対応していれば {auto, user}）
  });
  const isVerified = m => !!(m.wavu && m.wavu.status === 'matched');
  const isOnly = m => !!(m.wavu && m.wavu.only === true);   // 動画のない、VSデータだけの履歴（id は wv-<番号>）
  const wv = (m, k) => m.wavu && m.wavu[k] != null ? m.wavu[k] : null;
  // ゲームバージョン：Wavu の数字（例 30202）を「Ver.3.02.02」に。1桁目＝メジャー、次の2桁＝マイナー、最後の2桁＝パッチ。読み取れない値は、そのまま見せる
  const verText = v => { if (v == null || v === '') return '—'; const s = String(v).trim(); if (/^\d{5,6}$/.test(s)) { const n = Number(s); return 'Ver.' + Math.floor(n / 10000) + '.' + String(Math.floor(n / 100) % 100).padStart(2, '0') + '.' + String(n % 100).padStart(2, '0') } if (/^\d+(\.\d+){1,2}$/.test(s)) return 'Ver.' + s; return s };
  // サーバーが古くて「お気に入り・メモ」を持っていないときの予備：このブラウザの中だけに残す
  const LS_KEY = 'project-t-vs-state';
  const lsRead = () => { try { const v = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); return v && typeof v === 'object' ? v : {} } catch (_) { return {} } };
  const lsWrite = o => { try { localStorage.setItem(LS_KEY, JSON.stringify(o)) } catch (_) {} };
  function applyLocalState(list) { const s = lsRead(); list.forEach(m => { if (!m.onServer && s[m.id]) { m.favorite = !!s[m.id].f; m.memo = clean(s[m.id].m, MEMO_MAX) } }); return list }
  function saveState(m, patch, keepalive) {
    if (!m.onServer) { const s = lsRead(); const cur = s[m.id] || {}; if ('favorite' in patch) cur.f = patch.favorite; if ('memo' in patch) cur.m = patch.memo; s[m.id] = cur; lsWrite(s); return Promise.resolve() }
    return apiPost('/api/v1/matches/' + encodeURIComponent(m.id) + '/user-state', patch, keepalive);
  }

  // ---- 絞り込み・並べ替え ----
  const val = id => $(id).value;
  function hay(m) {
    const r = resultKey(m);
    return [m.opponentName, m.playerCharacter, m.opponentCharacter, charName(m.playerCharacter), charName(m.opponentCharacter), m.playerRank, m.opponentRank, rankNum(m.playerRank), rankNum(m.opponentRank),
      m.playerTekkenPower, m.opponentTekkenPower, num(m.playerTekkenPower), num(m.opponentTekkenPower), m.mode, modeName(m.mode), r, resultLabel(m), r === 'win' ? '勝ち 勝利' : r === 'loss' ? 'LOSE 負け 敗北' : r === 'draw' ? '引き分け' : '',
      (m.playerRoundsWon ?? '') + '-' + (m.opponentRoundsWon ?? ''), date(m.startedAt || m.date), m.videoTitle, wv(m, 'stage_name'), wv(m, 'game_version'), verText(wv(m, 'game_version')), wv(m, 'rating_before'), wv(m, 'battle_id'), m.memo,
      isOnly(m) ? 'VSデータのみ VSデータ確認済み' : isVerified(m) ? 'VSデータ確認済み' : 'Recorder記録'].filter(v => v != null && v !== '').join(' ').toLowerCase();
  }
  const ratingAfter = m => { const b = wv(m, 'rating_before'), c = wv(m, 'rating_change'); return b == null ? null : b + (c || 0) };
  function compute() {
    const words = val('q').trim().toLowerCase().split(/\s+/).filter(Boolean);
    const s0 = val('date-start'), e0 = val('date-end'), favOnly = $('fav-only').checked;
    const xs = matches.filter(m => {
      if (F.playerChar.size && !F.playerChar.has(charCode(m.playerCharacter))) return false;
      if (F.opponentChar.size && !F.opponentChar.has(charCode(m.opponentCharacter))) return false;
      if (F.playerRank.size && !F.playerRank.has(rankNo(m.playerRank))) return false;
      if (F.opponentRank.size && !F.opponentRank.has(rankNo(m.opponentRank))) return false;
      if (F.result && resultKey(m) !== F.result) return false;
      if (F.video === 'yes' && !m.youtubeVideoId) return false;
      if (F.video === 'no' && m.youtubeVideoId) return false;
      if (F.source === 'verified' && !isVerified(m)) return false;
      if (F.source === 'recorder' && isVerified(m)) return false;
      if (favOnly && !m.favorite) return false;
      const day = dayOf(m); if (s0 && day < s0) return false; if (e0 && day > e0) return false;
      if (words.length) { const h = hay(m); if (!words.every(w => h.includes(w))) return false }
      return true;
    });
    const t = m => { const d = toDate(m.startedAt || m.date); return d ? d.getTime() : 0 };
    const k = {
      dateDesc: (a, b) => t(b) - t(a), dateAsc: (a, b) => t(a) - t(b),
      powerDesc: (a, b) => (b.playerTekkenPower || 0) - (a.playerTekkenPower || 0), powerAsc: (a, b) => (a.playerTekkenPower || 0) - (b.playerTekkenPower || 0),
      oppPowerDesc: (a, b) => (b.opponentTekkenPower || 0) - (a.opponentTekkenPower || 0), oppPowerAsc: (a, b) => (a.opponentTekkenPower || 0) - (b.opponentTekkenPower || 0),
      rankDesc: (a, b) => rankNo(b.playerRank) - rankNo(a.playerRank), rankAsc: (a, b) => rankNo(a.playerRank) - rankNo(b.playerRank),
      oppRankDesc: (a, b) => rankNo(b.opponentRank) - rankNo(a.opponentRank), oppRankAsc: (a, b) => rankNo(a.opponentRank) - rankNo(b.opponentRank),
      durationDesc: (a, b) => (b.youtubeVideoId ? durSec(b) : -1) - (a.youtubeVideoId ? durSec(a) : -1), durationAsc: (a, b) => (a.youtubeVideoId ? durSec(a) : Infinity) - (b.youtubeVideoId ? durSec(b) : Infinity)
    }[val('sort')] || ((a, b) => t(b) - t(a));
    return xs.sort(k);
  }
  const filterSig = () => JSON.stringify([[...F.playerChar].sort(), [...F.opponentChar].sort(), [...F.playerRank].sort((a, b) => a - b), [...F.opponentRank].sort((a, b) => a - b), F.result, F.video, F.source, $('fav-only').checked, val('date-start'), val('date-end'), val('q').trim().toLowerCase(), val('sort')]);

  // ---- 表示 ----
  function pagTokens(cur, total) {
    if (total <= 9) return Array.from({ length: total }, (_, i) => i + 1);
    const keep = new Set([1, total, cur, cur - 1, cur + 1, cur - 2, cur + 2]);
    if (cur <= 4) [2, 3, 4, 5, 6].forEach(n => keep.add(n));
    if (cur >= total - 3) for (let n = Math.max(1, total - 5); n <= total; n++) keep.add(n);
    const nums = [...keep].filter(n => n >= 1 && n <= total).sort((a, b) => a - b), out = []; let prev = 0;
    for (const n of nums) { if (prev && n - prev > 1) out.push('…'); out.push(n); prev = n }
    return out;
  }
  function renderPager(total, pages) {
    const from = total ? (page - 1) * PAGE_SIZE + 1 : 0, to = Math.min(page * PAGE_SIZE, total);
    ['pg-top', 'pg-bottom'].forEach(id => {
      const el = $(id); el.hidden = !total; if (!total) { el.innerHTML = ''; return }
      const p = [];
      p.push('<button type="button" class="page-btn" data-page="' + (page - 1) + '" aria-label="前のページ"' + (page <= 1 ? ' disabled' : '') + '>‹</button>');
      pagTokens(page, pages).forEach(t => p.push(t === '…' ? '<span class="page-ellipsis" aria-hidden="true">…</span>' : '<button type="button" class="page-btn" data-page="' + t + '"' + (t === page ? ' aria-current="page"' : '') + '>' + t + '</button>'));
      p.push('<button type="button" class="page-btn" data-page="' + (page + 1) + '" aria-label="次のページ"' + (page >= pages ? ' disabled' : '') + '>›</button>');
      p.push('<span class="page-info">' + from.toLocaleString('ja-JP') + '–' + to.toLocaleString('ja-JP') + ' / ' + total.toLocaleString('ja-JP') + '件</span>');
      el.innerHTML = p.join('');
    });
  }
  function condText() {
    const c = [];
    if (F.playerChar.size) c.push('使用キャラクター ' + F.playerChar.size); if (F.opponentChar.size) c.push('相手キャラクター ' + F.opponentChar.size);
    if (F.playerRank.size) c.push('自分段位 ' + F.playerRank.size); if (F.opponentRank.size) c.push('相手段位 ' + F.opponentRank.size);
    if (F.result) c.push({ win: '勝利', loss: '敗北', draw: '引き分け' }[F.result]); if (F.video) c.push(F.video === 'yes' ? '動画あり' : '動画なし');
    if (F.source) c.push(F.source === 'verified' ? 'VSデータ確認済み' : 'Recorder記録'); if (val('date-start') || val('date-end')) c.push('期間');
    if ($('fav-only').checked) c.push('お気に入り'); if (val('q').trim()) c.push('検索');
    return c.length ? c.join(' / ') : '条件なし';
  }
  function syncChecks(pageIds) {
    const ids = pageIds || [];
    const all = $('ckall'), every = ids.length > 0 && ids.every(id => checked.has(id)), some = ids.some(id => checked.has(id));
    all.checked = every; all.indeterminate = !every && some; all.disabled = !ids.length;
    const b = $('delsel'); b.disabled = !checked.size; b.textContent = checked.size ? '選択した ' + checked.size + ' 件を削除' : '選択した履歴を削除';
  }
  let pageIds = [];
  function render() {
    const s = filterSig(); if (s !== sig) { sig = s; page = 1 }
    filteredList = compute();
    { const inList = new Set(filteredList.map(m => m.id)); [...checked].forEach(id => { if (!inList.has(id)) checked.delete(id) }) }   // 絞り込みで見えなくなった履歴のチェックは外す（見えないものを消してしまわないように）
    const total = filteredList.length, pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(pages, Math.max(1, page));
    const start = (page - 1) * PAGE_SIZE, rows = filteredList.slice(start, start + PAGE_SIZE); pageIds = rows.map(m => m.id);
    const w = filteredList.filter(m => resultKey(m) === 'win').length, l = filteredList.filter(m => resultKey(m) === 'loss').length;
    $('matches').textContent = total; $('wins').textContent = w; $('losses').textContent = l; $('rate').textContent = total ? Math.round(w / total * 100) + '%' : '—';
    $('count').textContent = total + ' matches'; $('cond').textContent = condText();
    const more = totalOnServer > matches.length ? '（読み込み中：' + matches.length + ' / ' + totalOnServer + '）' : '';
    $('stat').innerHTML = total ? '<b>' + total + '</b>試合中 <b>' + (start + 1) + '〜' + (start + rows.length) + '</b>件を表示' + (total === matches.length ? '' : '（全' + matches.length + '試合）') + more : '<b>0</b>試合を表示' + (matches.length ? '（全' + matches.length + '試合）' : '') + more;
    renderPager(total, pages);
    const body = $('body');
    if (!rows.length) {
      const msg = !matches.length ? (emptyMsg === 'login' ? '<b>ログインすると、自分の対戦と動画が表示されます</b><br><a href="#login" style="color:inherit">ログインページへ</a>' : emptyMsg === 'error' ? '<b>対戦履歴を読み込めませんでした</b><br>時間をおいて、もう一度開いてください。' : '<b>対戦履歴はまだありません</b><br>PROJECT T Recorder で録画して YouTube に投稿した試合が、ここに表示されます。') : '<b>条件に一致する試合がありません</b><br>絞り込みを変えるか、「すべてクリア」を押してください。';
      body.innerHTML = '<tr><td colspan="12"><div class="empty">' + msg + '</div></td></tr>';
    } else {
      body.innerHTML = rows.map(m => {
        const id = esc(m.id), r = resultKey(m), fav = m.favorite;
        return '<tr class="mrow' + (m.id === selectedId ? ' selected' : '') + '" data-id="' + id + '"><td class="ck c-ck"><label><input type="checkbox" data-ck="' + id + '"' + (checked.has(m.id) ? ' checked' : '') + ' aria-label="この履歴を選択"></label></td>' +
          '<td class="c-date">' + esc(date(m.startedAt || m.date)) + '</td><td class="c-res"><span class="result ' + r + '">' + resultLabel(m) + '</span></td>' +
          '<td class="c-chr">' + charVs(m.playerCharacter, m.opponentCharacter) + '</td>' +
          '<td class="c-kv" data-l="ラウンド">' + esc(roundsText(m)) + '</td><td class="c-kv" data-l="対戦相手">' + esc(m.opponentName || '—') + '</td>' +
          '<td class="c-kv" data-l="TEKKEN POWER（自分 / 相手）"><b>' + esc(num(m.playerTekkenPower)) + '</b> / ' + esc(num(m.opponentTekkenPower)) + '</td>' +
          '<td class="c-kv" data-l="モード">' + esc(modeName(m.mode)) + '</td><td class="c-kv" data-l="動画時間">' + esc(durText(m)) + '</td>' +
          '<td class="c-play"><button type="button" class="btn" data-open="' + id + '">' + (m.youtubeVideoId ? '再生' : '詳細') + '</button><div>' + (isOnly(m) ? '<span class="sourceTag verified">VSデータのみ</span>' : isVerified(m) ? '<span class="sourceTag verified">VSデータ確認済み</span>' : '<span class="sourceTag">Recorder記録</span>') + '</div></td>' +
          '<td class="c-fav"><button type="button" class="favbtn' + (fav ? ' on' : '') + '" data-fav="' + id + '" aria-pressed="' + fav + '" aria-label="' + (fav ? 'お気に入りを解除' : 'お気に入りに追加') + '" title="' + (fav ? 'お気に入りを解除' : 'お気に入りに追加') + '">' + (fav ? '♥' : '♡') + '</button></td>' +
          '<td class="c-del"><button type="button" class="btn danger" data-del="' + id + '" aria-label="この履歴を削除">削除</button></td></tr>';
      }).join('');
    }
    syncChecks(pageIds);
  }
  const goPage = n => { const pages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE)); const next = Math.min(pages, Math.max(1, Number(n) || 1)); if (next === page) return; page = next; render(); $('pg-top').scrollIntoView({ block: 'start' }) };

  // ---- 絞り込み欄（ポップアップ・カレンダー・期間） ----
  const grids = () => { const mk = (id, key) => { $(id).innerHTML = CHARACTERS.map(([c, label]) => '<button type="button" class="charopt eye' + CHAR_IDX.get(c) + '" data-key="' + key + '" data-value="' + esc(c) + '" aria-pressed="false" title="' + esc(label) + '"><span class="chartxt">' + esc(label) + '</span></button>').join('') }; mk('grid-playerChar', 'playerChar'); mk('grid-opponentChar', 'opponentChar');
    const mr = (id, key) => { $(id).innerHTML = RANK_LIST.map(r => '<button type="button" class="rankopt" data-key="' + key + '" data-value="' + Number(r[1]) + '" aria-pressed="false"><img src="' + r[3] + '" alt=""><span class="rn">' + esc(r[0]) + '</span><span class="num">' + Number(r[2]) + '段</span></button>').join('') }; mr('grid-playerRank', 'playerRank'); mr('grid-opponentRank', 'opponentRank') };
  grids();
  const closePops = except => {
    $$('.popover.open').forEach(p => { if (p !== except) p.classList.remove('open') });
    $$('[data-popup]').forEach(b => { const l = root.getElementById(b.dataset.popup); if (!except || l !== except) { b.classList.remove('active'); b.setAttribute('aria-expanded', 'false') } });
  };
  const LABELS = [['playerChar', '使用キャラクター（複数可）'], ['opponentChar', '相手キャラクター（複数可）'], ['playerRank', '段位を選択（複数可）'], ['opponentRank', '段位を選択（複数可）']];
  const updateLabels = () => LABELS.forEach(([k, ph]) => { const n = F[k].size; root.getElementById('vs-lbl-' + k).textContent = n ? n + '件選択中' : ph });
  let calView = new Date(), calEnd = false;
  const calYmd = ymd, calParse = s => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return null; const [y, m, d] = s.split('-').map(Number); const v = new Date(y, m - 1, d); return Number.isNaN(v.getTime()) ? null : v };
  const setCalView = v => { const d = calParse(v); if (d) calView = new Date(d.getFullYear(), d.getMonth(), 1) };
  function drawCal() {
    const y = calView.getFullYear(), m = calView.getMonth(); $('cal-label').textContent = y + '年' + (m + 1) + '月';
    const first = new Date(y, m, 1), start = new Date(y, m, 1 - first.getDay()), sv = val('cal-start'), ev = val('cal-end'), today = calYmd(new Date()); let h = '';
    for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const v = calYmd(d); h += '<button type="button" class="cal-day' + (d.getMonth() !== m ? ' out' : '') + (v === today ? ' today' : '') + (sv && v === sv ? ' start' : '') + (ev && v === ev ? ' end' : '') + (sv && ev && v > sv && v < ev ? ' inrange' : '') + '" data-date="' + v + '">' + d.getDate() + '</button>' }
    $('cal-grid').innerHTML = h;
  }
  const shiftCal = n => { calView = new Date(calView.getFullYear(), calView.getMonth() + n, 1); drawCal() };
  function pickDate(v) {
    const a = $('cal-start'), b = $('cal-end');
    if (!a.value || (calEnd === false && b.value)) { a.value = v; b.value = ''; calEnd = true }
    else if (calEnd || !b.value) { if (v < a.value) { b.value = a.value; a.value = v } else b.value = v; calEnd = false }
    else { a.value = v; b.value = ''; calEnd = true }
    setCalView(v); drawCal();
  }
  function recent(days, main) {
    const end = new Date(); end.setHours(0, 0, 0, 0); const start = new Date(end); start.setDate(start.getDate() - (days - 1));
    if (main) { $('date-start').value = calYmd(start); $('date-end').value = calYmd(end); render() }
    else { $('cal-start').value = calYmd(start); $('cal-end').value = calYmd(end); calEnd = false; setCalView($('cal-end').value); drawCal() }
  }
  function toggleOpt(opt) {
    const key = opt.dataset.key; if (!key || !F[key]) return; let v = opt.dataset.value; if (key.includes('Rank')) v = Number(v);
    F[key].has(v) ? F[key].delete(v) : F[key].add(v); opt.setAttribute('aria-pressed', String(F[key].has(v))); updateLabels(); render();
  }
  const setChips = (attr, v) => { $$('[data-' + attr + ']').forEach(b => { if (b.closest('.fgrp')) b.setAttribute('aria-pressed', String((b.dataset[attr] || '') === v)) }) };
  function clearAll() {
    ['playerChar', 'opponentChar', 'playerRank', 'opponentRank'].forEach(k => F[k].clear()); F.result = F.video = F.source = '';
    $$('.charopt,.rankopt').forEach(o => o.setAttribute('aria-pressed', 'false')); ['result', 'video', 'source'].forEach(a => setChips(a, ''));
    $('date-start').value = $('date-end').value = ''; $('fav-only').checked = false; $('q').value = ''; $('sort').value = 'dateDesc'; updateLabels(); render();
  }

  // ---- 動画プレイヤー（YouTube） ----
  const controlIds = ['b5', 'b1', 'bf', 'play', 'ff', 'f1', 'f5'];
  const enableControls = on => controlIds.forEach(id => { const e = $(id); if (e) e.disabled = !on });
  function noteDuration() {
    const m = byId(selectedId); if (!player || !player.getDuration || !m || !m.youtubeVideoId) return;
    const d = player.getDuration(); if (!(d > 0) || durations[m.youtubeVideoId] === Math.round(d)) return;
    durations[m.youtubeVideoId] = Math.round(d); try { localStorage.setItem('project-t-vs-durations', JSON.stringify(durations)) } catch (_) {}
    const e = root.querySelector('[data-meta="duration"]'); if (e) e.textContent = durText(m); render();
  }
  function loadYT(id) {
    if (!id) { $('video-state').textContent = 'NO VIDEO'; $('ph').hidden = false; $('ph').innerHTML = '<b>この対戦には動画がありません</b><small>Recorder で録画して YouTube に投稿した対戦は、ここで再生できます。</small>'; enableControls(false); try { player && player.pauseVideo && player.pauseVideo() } catch (_) {} return }
    $('video-state').innerHTML = '<span class="ytmark" role="img" aria-label="YouTube"></span>'; $('ph').hidden = true;
    const create = () => {
      if (player && player.loadVideoById) { player.loadVideoById(id); enableControls(true); return }
      player = new YT.Player(root.getElementById('vs-player'), { videoId: id, playerVars: { rel: 0, modestbranding: 1, playsinline: 1 }, events: { onReady: () => { enableControls(true); startClock() }, onStateChange: e => { $('play').textContent = e.data === YT.PlayerState.PLAYING ? '一時停止' : '再生' } } });
    };
    if (window.YT && YT.Player) { create(); return }
    window.__ptVSYTReady = (window.__ptVSYTReady || []); window.__ptVSYTReady.push(create);
    if (!window.__ptVSYTInstalled) {
      window.__ptVSYTInstalled = true; const old = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () { if (typeof old === 'function') try { old() } catch (_e) {} const q = window.__ptVSYTReady || []; window.__ptVSYTReady = []; q.forEach(fn => { try { fn() } catch (_e) {} }) };
      const sc = document.createElement('script'); sc.src = 'https://www.youtube.com/iframe_api'; sc.async = true; document.head.appendChild(sc);
    }
  }
  function startClock() { clearInterval(clock); clock = setInterval(() => { if (player && player.getCurrentTime) { $('time').textContent = time(player.getCurrentTime()); noteDuration() } }, 120) }
  const seek = d => { if (player && player.getCurrentTime && player.seekTo) player.seekTo(Math.max(0, player.getCurrentTime() + d), true) };
  const playPause = () => { if (!player || !window.YT) return; player.getPlayerState() === YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo() };
  function zoom(on) {
    const box = $('vbox'), bk = $('lbback'); on = on == null ? !box.classList.contains('lb') : on;
    box.classList.toggle('lb', on); side.classList.toggle('lbopen', on); bk.hidden = !on; $('zoom').textContent = on ? '縮小' : '拡大'; $('zoom').setAttribute('aria-pressed', String(on));
    $('zoom').setAttribute('aria-label', on ? '対戦動画を元のサイズに戻す' : '対戦動画を拡大'); document.documentElement.style.overflow = on ? 'hidden' : '';
  }

  // ---- 詳細（右から出る画面） ----
  // ラウンド別ジャンプ位置（R1〜R5）。ラウンド数＝取得ラウンドの合計（最低3・最高5。3-0 なら R1〜R3、3-2 なら R1〜R5）。
  // 位置は、動画を再生して「設定」を押した瞬間の再生位置。サーバーが対応していれば、サーバーに保存する（どの端末でも同じ）。
  // Recorder が自動で記録した位置（サーバーの round_marks.auto）は初期値。自分で設定した位置（user）が優先で、消すと自動の位置に戻る。
  // サーバーが対応していない（round_marks が無い）ときは、今までどおり、この端末のブラウザに保存する。
  const RM_KEY = 'project-t-vs-round-marks';
  const rmRead = () => { try { const v = JSON.parse(localStorage.getItem(RM_KEY) || '{}'); return v && typeof v === 'object' && !Array.isArray(v) ? v : {} } catch (_) { return {} } };
  const rmWrite = o => { try { const ks = Object.keys(o); if (ks.length > 2000) ks.slice(0, ks.length - 2000).forEach(k => { delete o[k] }); localStorage.setItem(RM_KEY, JSON.stringify(o)) } catch (_) {} };
  const cleanMarks = o => { const out = {}; if (o && typeof o === 'object' && !Array.isArray(o)) Object.keys(o).forEach(k => { const sec = o[k]; if (/^[1-5]$/.test(k) && typeof sec === 'number' && Number.isFinite(sec) && sec >= 0) out[Number(k)] = sec }); return out };
  const srvMarks = o => o && typeof o === 'object' && !Array.isArray(o) ? { auto: cleanMarks(o.auto), user: cleanMarks(o.user) } : null;   // サーバーが返した round_marks（対応していない古いサーバーなら null）
  const rmOwn = m => { if (m && m.roundMarks) return m.roundMarks.user; const v = rmRead()['m:' + m.id]; return v && typeof v === 'object' ? v : {} };
  const mmss = s => { s = Math.max(0, Math.floor(Number(s) || 0)); const h = Math.floor(s / 3600), mi = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' : '') + String(mi).padStart(2, '0') + ':' + String(x).padStart(2, '0') };
  function roundMarks(m) {
    const out = {};
    (Array.isArray(m && m.rounds) ? m.rounds : []).forEach((r, i) => { const n = Number((r && r.roundNumber) || i + 1), sec = Number(r && (r.startSeconds ?? ((r.startedVideoMs ?? 0) / 1000))); if (n >= 1 && n <= 5 && Number.isFinite(sec) && sec >= 0) out[n] = sec });
    if (m && m.roundMarks) Object.keys(m.roundMarks.auto).forEach(k => { out[Number(k)] = m.roundMarks.auto[k] });   // Recorder が自動で記録した位置
    const own = rmOwn(m); Object.keys(own).forEach(k => { const n = Number(k), sec = Number(own[k]); if (n >= 1 && n <= 5 && Number.isFinite(sec) && sec >= 0) out[n] = sec });
    return out;
  }
  function roundCount(m, marks) {
    const pw = m.playerRoundsWon, ow = m.opponentRoundsWon; let n = 3;
    if (pw != null && ow != null && pw !== '' && ow !== '' && Number.isFinite(+pw) && Number.isFinite(+ow)) n = Math.round(+pw + +ow);
    const hi = Math.max(0, ...Object.keys(marks).map(Number));
    return Math.min(5, Math.max(3, n, hi));
  }
  function rounds(m) {
    const el = $('rounds');
    if (!m) { el.innerHTML = '<span class="lbl">ラウンド</span><span class="stat">試合を選択すると表示されます。</span>'; return }
    const hasVideo = !!m.youtubeVideoId, marks = roundMarks(m), own = rmOwn(m), n = roundCount(m, marks);
    let h = '<span class="lbl">ラウンド</span>', any = false;
    for (let i = 1; i <= n; i++) {
      const has = marks[i] != null, t = has ? mmss(marks[i]) : ''; if (has) any = true;
      const auto = has && own[i] == null && !!(m.roundMarks && m.roundMarks.auto[i] != null);
      h += '<span class="rbox' + (has ? ' set' : '') + '">' +
        '<button type="button" class="rjump"' + (auto ? ' title="Recorder が自動で記録した位置です。「更新」で自分の位置に変えられます"' : '') + (has && hasVideo ? ' data-seek="' + marks[i] + '"' : ' disabled') + ' aria-label="ラウンド' + i + (has ? 'の位置（' + t + '）へジャンプ' : 'のジャンプ位置は未設定') + '"><b>R' + i + '</b><span>' + (has ? t : '未設定') + '</span></button>' +
        '<button type="button" class="rset" data-rset="' + i + '"' + (hasVideo ? '' : ' disabled') + ' title="いまの再生位置を、ラウンド' + i + 'のジャンプ位置にします" aria-label="いまの再生位置をラウンド' + i + 'のジャンプ位置に設定">' + (has ? '更新' : '設定') + '</button>' +
        (own[i] != null ? '<button type="button" class="rclr" data-rclr="' + i + '" title="ラウンド' + i + 'のジャンプ位置を消す" aria-label="ラウンド' + i + 'のジャンプ位置を消す">×</button>' : '') + '</span>';
    }
    h += !hasVideo ? '<span class="stat">動画のある対戦で、ジャンプ位置を設定できます。</span>' : any ? '' : '<span class="stat">ラウンドの始まりで「設定」を押すと、そこへジャンプできます。</span>';
    el.innerHTML = h;
  }
  function refocusSet(n) { const b = root.querySelector('[data-rset="' + n + '"]'); if (b && !b.disabled) b.focus() }
  // サーバーの返事で行を描き直すとき、キーボードの位置（設定・更新・×のどれか）を同じボタンに戻す
  function rerounds(m) {
    const a = root.activeElement, at = a && a.getAttribute ? (a.hasAttribute('data-rset') ? 'data-rset' : a.hasAttribute('data-rclr') ? 'data-rclr' : '') : '';
    const sel = at ? '[' + at + '="' + a.getAttribute(at) + '"]' : '';
    rounds(m); if (sel) { const b = root.querySelector(sel); if (b && !b.disabled) b.focus() }
  }
  // サーバーに保存する（先に画面を変え、保存に失敗したらその 1 つだけ元に戻す。続けて押したときは、最後の返事だけを反映する）
  function setServerMark(m, n, sec) {
    const before = m.roundMarks, prev = before.user[n], user = Object.assign({}, before.user);
    if (sec == null) delete user[n]; else user[n] = sec;
    m.roundMarks = { auto: before.auto, user }; m.roundBusy = (m.roundBusy || 0) + 1;
    rounds(m); refocusSet(n);
    apiPost('/api/v1/matches/' + encodeURIComponent(m.id) + '/user-state', { round_marks: { [n]: sec } }).then(r => {
      m.roundBusy--; const got = srvMarks(r && r.round_marks);
      if (got && !m.roundBusy) m.roundMarks = got;
      if (byId(selectedId) === m) rerounds(m);
    }).catch(e => {
      m.roundBusy--; const u = Object.assign({}, m.roundMarks.user); if (prev == null) delete u[n]; else u[n] = prev;
      m.roundMarks = { auto: m.roundMarks.auto, user: u };
      if (byId(selectedId) === m) { rerounds(m); flash('ジャンプ位置を保存できませんでした：' + esc(e && e.message ? e.message : '通信エラー')) }
    });
  }
  function setRoundMark(n, clear) {
    const m = byId(selectedId); if (!m || !(n >= 1 && n <= 5)) return;
    let sec = null;
    if (!clear) { if (!m.youtubeVideoId || !player || !player.getCurrentTime) return; const t = Number(player.getCurrentTime()); if (!Number.isFinite(t) || t < 0) return; sec = Math.round(t * 100) / 100 }
    if (m.roundMarks) { setServerMark(m, n, sec); return }
    const all = rmRead(), key = 'm:' + m.id, cur = all[key] && typeof all[key] === 'object' ? all[key] : {};
    if (clear) delete cur[n]; else cur[n] = sec;
    delete all[key]; if (Object.keys(cur).length) all[key] = cur;      // いったん消して入れ直す＝新しい順に並ぶ（古いものから捨てる）
    rmWrite(all); rounds(m); refocusSet(n);
  }
  function renderFacts(m) {
    const rt = ratingAfter(m), ch = wv(m, 'rating_change');
    const rating = rt == null ? '—' : num(rt) + (ch == null ? '' : ' (' + (ch >= 0 ? '+' : '') + ch + ')');
    const f = [
      ['対戦相手', 'opponent', esc(m.opponentName || '—'), ''], ['勝敗', 'result', esc(resultLabel(m)), ''],
      ['キャラクター', 'chars', detailCharVs(m.playerCharacter, m.opponentCharacter), 'fact-character'],
      ['自分のTEKKEN POWER', 'ppower', esc(num(m.playerTekkenPower)), ''], ['相手のTEKKEN POWER', 'opower', esc(num(m.opponentTekkenPower)), ''],
      ['自分の段位', 'prank', rankHtml(m.playerRank), ''], ['相手の段位', 'orank', rankHtml(m.opponentRank), ''],
      ['取得ラウンド', 'rounds', esc(roundsText(m)), ''], ['対戦モード', 'mode', esc(modeName(m.mode)), ''],
      ['対戦日時', 'date', esc(date(m.startedAt || m.date)), ''], ['動画タイトル', 'title', esc(m.videoTitle || '—'), ''],
      ['動画時間', 'duration', esc(durText(m)), ''], ['ステージ', 'stage', esc(clean(wv(m, 'stage_name') || '—', 64)), ''],
      ['ゲームバージョン', 'version', esc(clean(verText(wv(m, 'game_version')), 32)), ''], ['レーティング', 'rating', esc(rating), '']
    ];
    $('facts').innerHTML = f.map(([k, key, v, c]) => '<div class="fact ' + c + '"><span class="k">' + esc(k) + '</span><span class="v" data-meta="' + key + '">' + v + '</span></div>').join('');
  }
  function memoUi(m) {
    const ed = $('memo'), st = $('memo-status'), ct = $('memo-count');
    if (!m) { ed.value = ''; ed.dataset.id = ''; ed.disabled = true; ct.textContent = '0'; st.textContent = '—'; st.className = 'memo-status'; return }
    ed.disabled = false; ed.dataset.id = m.id; ed.value = clean(m.memo, MEMO_MAX); ct.textContent = String(ed.value.length); st.textContent = '保存済み'; st.className = 'memo-status';
  }
  let memoTimer = 0, memoBusy = Promise.resolve();
  function saveMemo(keepalive) {
    clearTimeout(memoTimer); const ed = $('memo'); if (!ed.dataset.id) return Promise.resolve();
    const m = byId(ed.dataset.id); if (!m) return Promise.resolve();
    const text = clean(ed.value, MEMO_MAX); if (text === m.memo && $('memo-status').className === 'memo-status') return Promise.resolve();
    const st = $('memo-status'); st.textContent = '保存中…'; st.className = 'memo-status saving';
    const id = m.id, prev = m.memo; m.memo = text;
    memoBusy = memoBusy.then(() => saveState(m, { memo: text }, keepalive)).then(() => { if (ed.dataset.id === id) { st.textContent = '保存済み'; st.className = 'memo-status' } }).catch(() => { m.memo = prev; if (ed.dataset.id === id) { st.textContent = '保存できませんでした。もう一度「保存」を押してください'; st.className = 'memo-status error' } });
    return memoBusy;
  }
  function openSide(m, fromList) {
    if (!m) return; const wasOpen = side.classList.contains('vs-side-open');
    if (wasOpen) saveMemo(); selectedId = m.id; renderFacts(m); rounds(m); memoUi(m); loadYT(m.youtubeVideoId);
    $('side-sub').textContent = date(m.startedAt || m.date) + ' / ' + resultLabel(m) + ' / ' + charName(m.playerCharacter) + ' VS ' + charName(m.opponentCharacter);
    side.classList.add('vs-side-open'); side.setAttribute('aria-hidden', 'false'); render();
    const body = root.querySelector('#vs-side > .vs-detail-info .boxbody'); if (body) body.scrollTop = 0;
    if (!wasOpen && fromList) { try { $('side-close').focus({ preventScroll: true }) } catch (_) {} }
  }
  function closeSide() {
    if (!side.classList.contains('vs-side-open')) return;
    saveMemo(); zoom(false); try { player && player.pauseVideo && player.pauseVideo() } catch (_) {}
    side.classList.remove('vs-side-open'); side.setAttribute('aria-hidden', 'true');
  }
  function cycle(step) {
    if (!filteredList.length) return; saveMemo();
    let i = filteredList.findIndex(m => m.id === selectedId); if (i < 0) i = 0;
    const n = (i + step + filteredList.length) % filteredList.length, m = filteredList[n]; page = Math.floor(n / PAGE_SIZE) + 1; openSide(m, false);
  }

  // ---- 削除・お気に入り ----
  async function removeMatches(ids) {
    ids = ids.filter(Boolean); if (!ids.length) return;
    const msg = ids.length === 1 ? 'この対戦履歴を削除しますか？' : '選択した ' + ids.length + ' 件の対戦履歴を削除しますか？';
    if (!confirm(msg + '\n\nPROJECT T に残っている記録だけを消します。YouTube の動画は消えません。\n公開対戦データ（VSデータ）にある対戦も、削除すると再表示されません。')) return;
    try {
      await apiPost('/api/v1/matches/delete', { ids });
      const gone = new Set(ids); ids.forEach(id => checked.delete(id));
      if (gone.has(selectedId)) { closeSide(); selectedId = null }
      const s = lsRead(); ids.forEach(id => { delete s[id] }); lsWrite(s);
      setMatches(matches.filter(m => !gone.has(m.id))); flash('<b>' + ids.length + '</b>件の履歴を削除しました');
    } catch (e) { alert('削除できませんでした（' + e.message + '）。時間をおいて、もう一度お試しください。') }
  }
  async function toggleFav(id) {
    const m = byId(id); if (!m) return; const next = !m.favorite; m.favorite = next; render();
    try { await saveState(m, { favorite: next }) } catch (e) { m.favorite = !next; render(); flash('お気に入りを保存できませんでした。時間をおいて、もう一度お試しください。') }
  }

  // ---- 操作 ----
  root.addEventListener('click', e => {
    const t = e.target;
    const pop = t.closest('[data-popup]');
    if (pop) {
      e.stopPropagation(); const p = root.getElementById(pop.dataset.popup), will = !p.classList.contains('open'); closePops(p);
      if (!will) { p.classList.remove('open'); pop.classList.remove('active'); pop.setAttribute('aria-expanded', 'false'); return }
      if (pop.dataset.popup === 'vs-pop-cal') {
        $('cal-start').value = val('date-start'); $('cal-end').value = val('date-end'); const target = pop.dataset.calTarget || '';
        if (target === 'start') { calEnd = false; setCalView(val('cal-start') || val('cal-end') || calYmd(new Date())) } else if (target === 'end') { calEnd = true; setCalView(val('cal-end') || val('cal-start') || calYmd(new Date())) } else { calEnd = !!val('cal-start') && !val('cal-end'); setCalView(val('cal-end') || val('cal-start') || calYmd(new Date())) }
        drawCal();
      }
      p.classList.add('open'); pop.classList.add('active'); pop.setAttribute('aria-expanded', 'true'); return;
    }
    if (t.closest('[data-close]')) { closePops(); return }
    const opt = t.closest('.charopt,.rankopt'); if (opt) { toggleOpt(opt); return }
    const cd = t.closest('[data-cal-days]'); if (cd) { recent(Number(cd.dataset.calDays), false); return }
    if (t.closest('.popover')) { const day = t.closest('.cal-day'); if (day) pickDate(day.dataset.date); return }
    const cl = t.closest('[data-clear]'); if (cl) { const k = cl.dataset.clear; if (k === 'period') { $('date-start').value = $('date-end').value = '' } else { F[k].clear(); $$('[data-key="' + k + '"]').forEach(o => o.setAttribute('aria-pressed', 'false')) } updateLabels(); render(); return }
    const r = t.closest('[data-result]'); if (r) { F.result = r.dataset.result; setChips('result', F.result); render(); return }
    const v = t.closest('[data-video]'); if (v) { F.video = v.dataset.video; setChips('video', F.video); render(); return }
    const sc = t.closest('[data-source]'); if (sc) { F.source = sc.dataset.source; setChips('source', F.source); render(); return }
    const dd = t.closest('[data-days]'); if (dd) { recent(Number(dd.dataset.days), true); return }
    const pg = t.closest('[data-page]'); if (pg) { if (!pg.disabled) goPage(Number(pg.dataset.page)); return }
    const fv = t.closest('[data-fav]'); if (fv) { toggleFav(fv.dataset.fav); return }
    const dl = t.closest('[data-del]'); if (dl) { removeMatches([dl.dataset.del]); return }
    const op = t.closest('[data-open]'); if (op) { openSide(byId(op.dataset.open), true); return }
    const rs = t.closest('[data-rset]'); if (rs) { setRoundMark(Number(rs.dataset.rset)); return }
    const rc = t.closest('[data-rclr]'); if (rc) { setRoundMark(Number(rc.dataset.rclr), true); return }
    const sk = t.closest('[data-seek]'); if (sk) { if (player && player.seekTo) player.seekTo(+sk.dataset.seek || 0, true); return }
    const row = t.closest('tr.mrow'); if (row && !t.closest('button,input,label,a')) { openSide(byId(row.dataset.id), true); return }
  });
  root.addEventListener('click', e => { if (!e.target.closest('.field')) closePops() });
  document.addEventListener('click', e => { if (!e.composedPath().includes(host)) closePops() });
  root.addEventListener('change', e => {
    const c = e.target.closest('[data-ck]'); if (c) { c.checked ? checked.add(c.dataset.ck) : checked.delete(c.dataset.ck); syncChecks(pageIds); return }
    if (e.target.id === 'vs-ckall') { pageIds.forEach(id => e.target.checked ? checked.add(id) : checked.delete(id)); render(); return }
    if (e.target.id === 'vs-sort' || e.target.id === 'vs-fav-only' || e.target.id === 'vs-date-start' || e.target.id === 'vs-date-end') render();
  });
  $('q').addEventListener('input', render);
  $('delsel').addEventListener('click', () => removeMatches([...checked]));
  $('clearall').addEventListener('click', clearAll);
  $('cal-prev').addEventListener('click', () => shiftCal(-1)); $('cal-next').addEventListener('click', () => shiftCal(1));
  $('pop-cal').addEventListener('wheel', e => { e.preventDefault(); shiftCal(e.deltaY > 0 ? 1 : -1) }, { passive: false });
  $$('[data-cal-pick]').forEach(i => i.addEventListener('click', e => { e.stopPropagation(); calEnd = i.dataset.calPick === 'end'; setCalView(i.value || val('cal-end') || val('cal-start') || calYmd(new Date())); drawCal() }));
  $('cal-apply').addEventListener('click', () => { $('date-start').value = val('cal-start'); $('date-end').value = val('cal-end'); closePops(); render() });
  $('cal-clear').addEventListener('click', () => { $('cal-start').value = $('cal-end').value = $('date-start').value = $('date-end').value = ''; calEnd = false; drawCal(); closePops(); render() });
  $('side-close').addEventListener('click', closeSide);
  $('prev').addEventListener('click', () => cycle(-1)); $('next').addEventListener('click', () => cycle(1));
  $('zoom').addEventListener('click', e => { e.stopPropagation(); zoom() }); $('lbback').addEventListener('click', () => zoom(false));
  $('b5').addEventListener('click', () => seek(-5)); $('b1').addEventListener('click', () => seek(-1)); $('f1').addEventListener('click', () => seek(1)); $('f5').addEventListener('click', () => seek(5));
  $('bf').addEventListener('click', () => seek(-1 / +$('fps').value)); $('ff').addEventListener('click', () => seek(1 / +$('fps').value)); $('play').addEventListener('click', playPause);
  const memo = $('memo');
  memo.addEventListener('input', () => { $('memo-count').textContent = String(memo.value.length); const st = $('memo-status'); st.textContent = '入力中…'; st.className = 'memo-status saving'; clearTimeout(memoTimer); memoTimer = setTimeout(() => saveMemo(), 700) });
  memo.addEventListener('blur', () => saveMemo());
  memo.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveMemo() } });
  $('memo-save').addEventListener('click', () => saveMemo());
  $('memo-clear').addEventListener('click', () => { if (!memo.dataset.id) return; memo.value = ''; $('memo-count').textContent = '0'; saveMemo(); memo.focus() });
  window.addEventListener('beforeunload', () => saveMemo(true));
  // 詳細の中は、メモ以外は選択・コピー・切り取り・右クリック・ドラッグをさせない（チャッピー版の仕様）
  ['selectstart', 'copy', 'cut', 'contextmenu', 'dragstart'].forEach(ev => side.addEventListener(ev, e => { if (!(e.target === memo || (e.target.nodeType === 1 && memo.contains(e.target)))) e.preventDefault() }, true));
  const vsOpen = () => document.documentElement.getAttribute('data-page') === 'vs';
  document.addEventListener('keydown', e => {
    if (!vsOpen()) return;
    if (e.key === 'Escape') { if ($('vbox').classList.contains('lb')) zoom(false); else if (side.classList.contains('vs-side-open')) closeSide(); else closePops(); return }
    if (!side.classList.contains('vs-side-open')) return;
    const tag = (e.composedPath()[0] && e.composedPath()[0].tagName || '').toLowerCase(); if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); cycle(-1) } else if (e.key === 'ArrowRight') { e.preventDefault(); cycle(1) }
  });

  // ---- 読み込み ----
  function setMatches(data) {
    matches = Array.isArray(data) ? data.slice() : []; const ids = new Set(matches.map(m => m.id)); [...checked].forEach(id => { if (!ids.has(id)) checked.delete(id) });
    if (selectedId && !ids.has(selectedId)) { closeSide(); selectedId = null }
    render(); if (!matches.length) { totalOnServer = 0 }
  }
  // ログイン中の人の対戦履歴を、PROJECT T のサーバーから読み込む（Recorder で録画・投稿した試合）。500 件ずつ、全部そろうまで
  async function loadMine(force) {
    const base = apiBase(); if (!base || loading) return;
    if (!force && Date.now() - loadedAt < 30000) return;
    loading = true;
    try {
      const get = async off => fetch(base + '/api/v1/me/matches?limit=500&offset=' + off, { credentials: 'include', headers: { 'Accept': 'application/json' } });
      let res = await get(0);
      if (res.status === 401) { emptyMsg = 'login'; totalOnServer = 0; setMatches([]); return }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      let data = await res.json(); emptyMsg = ''; loadedAt = Date.now();
      let list = (data.matches || []).map(apiMatch); totalOnServer = Number(data.total) || list.length;
      setMatches(applyLocalState(list));
      let guard = 0;
      while (list.length < totalOnServer && list.length < 20000 && guard++ < 50) {
        res = await get(list.length); if (!res.ok) break; data = await res.json(); const next = (data.matches || []).map(apiMatch); if (!next.length) break;
        const seen = new Set(list.map(m => m.id)); list = list.concat(next.filter(m => !seen.has(m.id))); setMatches(applyLocalState(list));
      }
      totalOnServer = 0; render();
    } catch (e) { emptyMsg = 'error'; totalOnServer = 0; setMatches([]) }
    finally { loading = false }
  }
  window.addEventListener('projectt:auth-changed', () => { loadedAt = 0; if (document.documentElement.getAttribute('data-page') === 'vs') loadMine(true) });
  window.addEventListener('resize', () => { if (side.classList.contains('lbopen') && !$('vbox').classList.contains('lb')) side.classList.remove('lbopen') });
  window.VS = { show() { render(); loadMine(false) }, hide() { closePops(); closeSide() }, reload() { return loadMine(true) }, setMatches, loadMatch(m) { if (m) openSide(typeof m === 'object' ? m : byId(m), true) }, getMatches: () => matches.slice() };
  window.ProjectTVS = window.VS;
  // 検索欄の説明文は、狭い画面では短くする（長いと途中で切れる）
  const PH_LONG = $('q').placeholder, PH_SHORT = '相手・キャラ・段位・日付などで検索';
  const mq = window.matchMedia ? window.matchMedia('(max-width:819px)') : null;
  const setPh = () => { $('q').placeholder = mq && mq.matches ? PH_SHORT : PH_LONG };
  setPh(); if (mq && mq.addEventListener) mq.addEventListener('change', setPh);
  updateLabels(); setMatches([]);
})();
/*PTVSJS-END*/
