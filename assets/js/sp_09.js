
/*SGJS-START*/
/* ============================================================
   ステージギミック一覧（技チェックシート・コンボ集・用語集・確定反撃表と同じページの中で切り替える画面）
   ------------------------------------------------------------
   データはこのファイルの STAGES / GIMS に直接書いてある（ステージが増えたら足す）。
   ステージ画像はゲーム画面のスクリーンショット（SGIMG：一覧用の切り抜きと詳細用の2種類を埋め込み済み）。ギミックの仕組みの説明画像だけは外部の画像へ直接リンクしている。
   各ステージの名前は、画像の左上に出ている英語名に合わせてある。
   STAGES の1件 = { id, en, ja(読みの目安), size, shape, dlc, floors:[{n, size, g:[[ギミックID, 説明]], t}], notes:[], chara, bgm, img, soon }
   ============================================================ */
(function () {
  const host = document.getElementById("sgHost");
  if (!host) return;
  if (!host.attachShadow) { host.textContent = "このブラウザではステージ一覧を表示できません。新しいバージョンのブラウザでお試しください。"; return; }
  const root = host.attachShadow({ mode: "open" });
  const U = "https://tettk.com/wp-content/uploads/";
  /*SGIMG-START*/
  const SGIMG = {"arena":["assets/media/e1029b7a048fc67407f7.webp","assets/media/3205b62363f315442593.webp"],"arena-ug":["assets/media/66b8d66259668b0b3de1.webp","assets/media/43a43cb24457ac408527.webp"],"urban":["assets/media/694fff82a474d546547f.webp","assets/media/a542d061ebf4cf1180ca.webp"],"yakushima":["assets/media/47c1dc0c4ef78470d1c9.webp","assets/media/f095adaf8ba7e6e5e525.webp"],"coliseum":["assets/media/79d8347f159c69405e53.webp","assets/media/d7e2338d1fb6af749178.webp"],"hangar":["assets/media/bef094f877b484b32534.webp","assets/media/83680f0b964da6ca175f.webp"],"fallen":["assets/media/7b027bea1e890d95ce6d.webp","assets/media/d7e5143ce5f42ce07cfd.webp"],"descent":["assets/media/49a8e7e79f0aec159d4b.webp","assets/media/8c6fd6f70084eb2c195e.webp"],"genmaji":["assets/media/7f4c16c422f4425f0062.webp","assets/media/1b1d223e1eefc38a9c0f.webp"],"seaside":["assets/media/4a9638ecbe9cc18a80a0.webp","assets/media/9d2c02ee4d13d9526482.webp"],"midnight":["assets/media/554588437ea857059831.webp","assets/media/c2ef60dfa10e3417d07c.webp"],"baobab":["assets/media/6128ad0e608b5348befd.webp","assets/media/0c1b33eba851d10071b9.webp"],"elegant":["assets/media/fdb2bf2408058a3e857c.webp","assets/media/2b287066ae9727ff0c7d.webp"],"secluded":["assets/media/b62890ea5d469efd4ea7.webp","assets/media/269b0a2c7a4758bc3e22.webp"],"seine":["assets/media/5d7e0ca9aa946cd05ab4.webp","assets/media/24338b985c6ba1427d32.webp"],"ortiz":["assets/media/56cc06ee65c1a2e57a31.webp","assets/media/debbba0e7485db1ec7b2.webp"],"strato":["assets/media/a1299671a4208b14ce86.webp","assets/media/2fc25bd53d65c22b7f1c.webp"],"sanctum":["assets/media/668c4cb46487ff8a5561.webp","assets/media/0d510958b1dbdf51082d.webp"],"phoenix":["assets/media/052890e46dd93dcb4565.webp","assets/media/0f24a74d8c5415738bb4.webp"],"pac":["assets/media/830dd4acb6a96ab82dcd.webp","assets/media/9c7af45bffc2b2b27858.webp"]};
  /*SGIMG-END*/

  /* ギミックの種類：k = wall（壁）／floor（床） */
  const GIMS = {
    wb:  { n: "ウォールブレイク", k: "wall", s: "壁", img: U + "2024/04/IMG_6178-1024x576.jpeg",
           d: "壁に叩きつける技を当てると壁が壊れ、そこから追撃を続けられる。発動すると回復可能体力（白ゲージ）が15減る。壊れた壁は消えてステージが広くなる。" },
    hwb: { n: "ハードウォールブレイク", k: "wall", s: "硬壁", img: U + "2024/04/IMG_6176-1024x576.jpeg",
           d: "壁に2回叩きつけると壊れるタイプ。1回目でヒビが入り2回目で割れる。ヒートスマッシュなら1回で割れる。割れたあとはヒートダッシュに近い動きで追撃できる。回復可能体力が15減る。" },
    wbl: { n: "ウォールブラスト", k: "wall", s: "壁ブラスト", img: U + "2023/11/IMG_6180-1024x576.jpg",
           d: "壁に叩きつけると相手が真上に打ち上がる。発動すると5ダメージ。壊れた壁の奥にもう1枚壁があるため、ステージの広さはほとんど変わらない。" },
    wbo: { n: "ウォールバウンド", k: "wall", s: "バウンド", img: U + "2024/04/IMG_6174-1024x576.jpeg",
           d: "壁に叩きつけると相手が反対側へ跳ね返り、位置が入れ替わる。発動すると5ダメージ。一度発動した壁は通常の壁に変わる。" },
    bal: { n: "バルコニーブレイク", k: "wall", s: "バルコニー", img: U + "2024/04/IMG_6177-1024x576.jpeg",
           d: "壁を壊して下のフロアへ移動する。着地すると回復可能体力が15減る。階層が変わるため、地形も広さも変わる。" },
    fb:  { n: "フロアブレイク", k: "floor", s: "床破壊", img: U + "2024/04/IMG_6172-1024x576.jpeg",
           d: "床に叩きつける技を当てると床が壊れ、下のフロアへ移動する。そこから追撃を続けられる。着地すると回復可能体力が15減る。" },
    hfb: { n: "ハードフロアブレイク", k: "floor", s: "硬床", img: U + "2024/04/IMG_6170-1024x576.jpeg",
           d: "床に2回叩きつけると壊れるタイプ。ヒートスマッシュなら1回で壊れる。着地すると回復可能体力が15減る。マッチポイントまで一度も床を叩かなかった場合は、次のラウンドが床を1回叩かれた状態で始まる。" },
    fbl: { n: "フロアブラスト", k: "floor", s: "床ブラスト", img: U + "2024/04/IMG_6171-1024x576.jpeg",
           d: "床に叩きつけると相手が真上に打ち上がる。発動すると5ダメージ。一度発動した床は通常の床に変わる。" }
  };

  const STAGES = [
    { id: "arena", en: "ARENA", ja: "アリーナ", size: "24×24", shape: "八角形",
      floors: [{ n: "1F", size: "24×24", g: [] }], notes: ["ギミックはなし。シリーズおなじみの八角形のステージ。"], bgm: "The Decisive Blow" },
    { id: "arena-ug", en: "ARENA (UNDERGROUND)", ja: "アリーナ（地下）", size: "24×24", shape: "八角形",
      floors: [{ n: "1F", size: "24×24", g: [["wbo", "赤く光っている壁（4面）"]] }], notes: ["アリーナと同じ形で観客のいない地下版。八角形のうち4面だけがウォールバウンド。"], bgm: "The Decisive Blow" },
    { id: "urban", en: "URBAN SQUARE (EVENING)", ja: "アーバンスクエア（夕方）", size: "24×24", shape: "正方形",
      floors: [{ n: "1F", size: "24×24", g: [] }], notes: ["ギミックはなし。ラウンド開始時は画面手前が壁に近い。", "画像は夕方版（EVENING）。ステージ選択でXボタンを押すと別のバージョンに切り替えられる。"], chara: "Leroy Smith", bgm: "Neo City" },
    { id: "yakushima", en: "YAKUSHIMA", ja: "ヤクシマ（屋久島）", size: "80×120", shape: "長方形",
      floors: [{ n: "1F", size: "80×120", g: [] }], notes: ["ギミックはなし。森の中にある非常に広いステージで、壁はほとんど意識しなくてよい。"], chara: "Jun Kazama", bgm: "TAMASHII" },
    { id: "coliseum", en: "COLISEUM OF FATE", ja: "コロシアム・オブ・フェイト", size: "58×70", shape: "円形",
      floors: [{ n: "1F", size: "58×70", g: [] }], notes: ["ギミックはなし。壁が近く、壁コンボを狙いやすい。"], bgm: "Colosseum" },
    { id: "hangar", en: "REBEL HANGAR", ja: "レベルハンガー", size: "22×22 → 22×30", shape: "2フロア",
      floors: [{ n: "2F", size: "22×22", g: [["bal", "2Fの奥（片面）→ 1Fへ"]] }, { n: "1F", size: "22×30", g: [["wbl", "横の2方向（2面）"]] }], notes: ["2Fから始まる。"], chara: "Yggdrasil", bgm: "Hangar Rules" },
    { id: "fallen", en: "FALLEN DESTINY", ja: "フォールンデスティニー", size: "16×28", shape: "長方形",
      floors: [{ n: "1F", size: "16×28", g: [] }], notes: ["ギミックはなし。幅の狭い長方形。"], bgm: "STORM RISING" },
    { id: "descent", en: "DESCENT INTO SUBCONSCIOUS", ja: "ディセント・イントゥ・サブコンシャス", size: "20×20 → 36×36 → 72×72", shape: "3フロア",
      floors: [{ n: "2F", size: "20×20", g: [["hfb", "床 → 1Fへ"]] }, { n: "1F", size: "36×36", g: [["fb", "床 → B1へ"]] }, { n: "B1", size: "72×72", g: [], t: "ギミックなし。広い四角形。" }], notes: ["2Fから始まる。"], chara: "Jin Kazama", bgm: "Deep Space" },
    { id: "sanctum", en: "SANCTUM", ja: "サンクタム", size: "20×28 → 28×16", shape: "2フロア",
      floors: [{ n: "2F", size: "20×28", g: [["hwb", "横の2方向（2面）"]] }, { n: "1F", size: "28×16", g: [["wb", "縦の2方向（2面）"]] }],
      notes: ["2Fから始まる。", "2Fのハードウォールブレイクを発動した次のラウンドで1Fへ移動する。", "ギミックを発動しなくても最終ラウンドで1Fへ移動する。"], bgm: "Kakuri-yo Kagura" },
    { id: "strato", en: "INTO THE STRATOSPHERE", ja: "イントゥ・ザ・ストラトスフィア", size: "28×28 → 24×18", shape: "2フロア",
      floors: [{ n: "2F", size: "28×28", g: [], t: "ギミックなし。" }, { n: "1F", size: "24×18", g: [["fbl", "床（場所を選ばず発動）"]] }], notes: ["2Fから始まる。", "マッチポイントを迎えると1Fへ移動する。"], bgm: "Volcanic Bomb" },
    { id: "ortiz", en: "ORTIZ FARM", ja: "オルティスファーム", size: "16×28 → 20×28 → 20×20", shape: "3フロア",
      floors: [{ n: "2F", size: "16×28", g: [["bal", "2Fの奥 → 1Fへ"]] }, { n: "1F", size: "20×28", g: [["fb", "床 → B1へ"]] }, { n: "B1", size: "20×20", g: [["wbo", "八方向（8面）"]] }], notes: ["2Fから始まる。"], chara: "Azucena", bgm: "Golden Meadow" },
    { id: "seine", en: "CELEBRATION ON THE SEINE", ja: "セレブレーション・オン・ザ・セーヌ", size: "20×24", shape: "長方形",
      floors: [{ n: "1F", size: "20×24", g: [] }], notes: ["ギミックはなし。"], chara: "Victor Chevalier", bgm: "Twilight Party Cruise" },
    { id: "secluded", en: "SECLUDED TRAINING GROUND", ja: "シクルーデッド・トレーニング・グラウンド", size: "20×108", shape: "細長い長方形",
      floors: [{ n: "1F", size: "20×108", g: [["wb", "横の2方向に3回ずつ（計6回）"]] }], notes: ["左右の壁が3回ずつ壊れる。"], chara: "Reina", bgm: "Silenty Boisterous" },
    { id: "elegant", en: "ELEGANT PALACE", ja: "エレガントパレス", size: "20×24 → 18×24", shape: "2フロア",
      floors: [{ n: "2F", size: "20×24", g: [["hwb", "画面手前"], ["bal", "ハードウォールブレイクのあと → 1Fへ"]] }, { n: "1F", size: "18×24", g: [["wbo", "横の2方向（2面）"]] }], notes: ["2Fから始まる。"], chara: "Lee Chaolan", bgm: "Baroque Attack" },
    { id: "midnight", en: "MIDNIGHT SIEGE", ja: "ミッドナイトシージ", size: "16×24", shape: "長方形",
      floors: [{ n: "1F", size: "16×24", g: [["wbl", "画面奥（1面）"]] }], notes: ["画面の奥の壁だけがウォールブラスト。"], chara: "G Corporation", bgm: "Delusional Reality" },
    { id: "seaside", en: "SEASIDE RESORT", ja: "シーサイドリゾート", size: "24×36", shape: "長方形", dlc: true,
      floors: [{ n: "1F", size: "24×36", g: [] }], notes: ["ギミックはなし。ラウンド3で夕方になり最終ラウンドで夜になる。"], chara: "Lidia Sobieska", bgm: "Streak of Blue" },
    { id: "genmaji", en: "GENMAJI TEMPLE", ja: "ゲンマジ・テンプル", size: "24×24", shape: "八角形", dlc: true,
      floors: [{ n: "1F", size: "24×24", g: [] }], notes: ["ギミックはなし。アリーナと同じ八角形。ラウンド3で夜になる。", "昼版（DAYTIME）もある。"], chara: "Heihachi Mishima", bgm: "Ordeal" },
    { id: "phoenix", en: "PHOENIX GATE", ja: "フェニックスゲート", size: "26×24 → 50×60", shape: "2フロア", dlc: true,
      floors: [{ n: "2F", size: "26×24", g: [["wbo", "画面奥"]] }, { n: "1F", size: "50×60", g: [["fbl", "床（場所を選ばず発動）"]] }], notes: ["2Fから始まる。", "マッチポイントを迎えると1Fへ移動する。"], chara: "Clive Rosfield", bgm: "Away & Find the Flame" },
    { id: "pac", en: "PAC-PIXELS", ja: "パックピクセルズ", size: "24×28 → 24×28", shape: "2フロア", dlc: true,
      floors: [{ n: "2F", size: "24×28", g: [["fb", "床の黄色い部分（中央）→ 1Fへ"]] }, { n: "1F", size: "24×28", g: [["fbl", "床の赤い部分（中央と四隅の5か所）"]] }], notes: ["2Fから始まる。"], bgm: "PAC-SPARK" },
    { id: "baobab", en: "BAOBAB HORIZON", ja: "バオバブ・ホライゾン", size: "50×120", shape: "長方形", dlc: true,
      floors: [{ n: "1F", size: "50×120", g: [] }], notes: ["ギミックはなし。非常に広い長方形。"] },
    { id: "subsea", en: "SUBSEA LOCKDOWN", ja: "サブシー・ロックダウン", size: "未公開", shape: "未公開", soon: true,
      floors: [], notes: ["シーズン3の追加ステージ。2027年初頭に配信予定。", "凶悪な犯罪者が収監される海底監獄がモチーフ。広さやギミックはまだ公開されていない。"] }
  ];

  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nrm = s => String(s).normalize("NFKC").toLowerCase().replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60)).replace(/[\s・･\-_]/g, "");
  /* ギミックのアイコン（icons/） */
  const GI = { wb: "wallbreak", hwb: "hardwallbreak", wbl: "wallblast", wbo: "wallbound", bal: "balconybreak", fb: "floorbreak", hfb: "hardfloorbreak", fbl: "floorblast" };
  const gi = id => GI[id] ? '<img class="gi" src="icons/' + GI[id] + '.webp" alt="" width="20" height="20" draggable="false">' : "";
  for (const s of STAGES) {
    const im = SGIMG[s.id]; if (im) { s.th = im[0]; s.img = im[1]; }   // th：一覧用の切り抜き／img：詳細用の画像
    s.g = []; for (const f of s.floors) for (const [id] of f.g) if (!s.g.includes(id)) s.g.push(id);
    s.n = nrm([s.en, s.ja, s.chara || "", s.shape].concat(s.g.map(i => GIMS[i].n)).join(" "));
    s.wall = s.g.some(i => GIMS[i].k === "wall");
    s.floor = s.g.some(i => GIMS[i].k === "floor");
    s.balc = s.g.includes("bal");
    s.multi = s.floors.length > 1;
    s.none = !s.soon && s.g.length === 0;
  }

  const CSS = `
  :host { display: block; }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  input { -webkit-user-select: text; user-select: text; }
  button { font: inherit; color: inherit; }
  button:focus-visible, input:focus-visible, a:focus-visible, summary:focus-visible, .card:focus-visible { outline: 2px solid var(--ok); outline-offset: 2px; }
  .wrapsg { max-width: 1100px; margin: 0 auto; }
  .sbox { margin: 0 0 10px; }
  .search { width: 100%; background: var(--panel); color: var(--text); border: 1px solid var(--line); border-radius: 8px; padding: 9px 14px; font: inherit; font-size: .875rem; }
  .search::placeholder { color: var(--ph, var(--sub)); }
  .filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; margin: 0 0 8px; }
  .fgrp { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
  .lbl { font-size: .8125rem; color: var(--sub); margin-right: 2px; }
  .chip { background: transparent; color: var(--sub); border: 1px solid var(--line); border-radius: 99px; padding: 4px 13px; font-size: .8125rem; cursor: pointer; white-space: nowrap; }
  .chip:hover { border-color: var(--sub); color: var(--text); }
  .chip[aria-pressed="true"] { color: var(--text); border-color: var(--accent); background: var(--accent-soft); font-weight: 700; }
  .chip .n { color: var(--sub); font-weight: 400; margin-left: 4px; font-variant-numeric: tabular-nums; }
  .stat { margin: 4px 0 10px; color: var(--sub); font-size: .8125rem; min-height: 1.4em; }
  .stat b { color: var(--text); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 16.5rem), 1fr)); gap: 12px; align-items: start; }
  .card { display: block; width: 100%; padding: 0; text-align: left; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; overflow: hidden; cursor: pointer; }
  .card:hover { border-color: var(--accent); }
  .pic { display: block; position: relative; aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--panel2, var(--bg)), var(--accent-soft)); overflow: hidden; }
  .pic .ph { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; padding: 10px; text-align: center; color: var(--sub); font-size: .8125rem; font-weight: 800; letter-spacing: .04em; line-height: 1.4; }
  .pic .ph small { display: block; margin-top: 4px; font-weight: 500; font-size: .6875rem; }
  .pic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
  .pic .zoom { position: absolute; right: 8px; bottom: 8px; padding: 1px 9px; border-radius: 99px; background: rgba(0, 0, 0, .62); color: #fff; font-size: .6875rem; font-weight: 700; }
  .pic .soon { position: absolute; left: 8px; top: 8px; padding: 1px 9px; border-radius: 99px; background: var(--accent); color: var(--on, #000); font-size: .6875rem; font-weight: 800; }
  .info { display: block; padding: 9px 12px 11px; }
  .nm { display: block; margin: 0; font-size: .9375rem; line-height: 1.35; font-weight: 800; overflow-wrap: anywhere; }
  .ja { display: block; margin-top: 1px; color: var(--sub); font-size: .6875rem; font-weight: 500; }
  .tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 7px 0 0; }
  .tg { font-size: .6875rem; line-height: 1.6; padding: 0 8px; border-radius: 99px; border: 1px solid var(--line); color: var(--sub); white-space: nowrap; }
  .tg.wall { color: #fff; background: #c2410c; border-color: #c2410c; font-weight: 700; }   /* 壁のギミック＝オレンジ（技チェックシートのギミック列と同じ色） */
  .tg.floor { color: #fff; background: #0b7285; border-color: #0b7285; font-weight: 700; }   /* 床のギミック＝青緑 */
  .tg.dlc { font-weight: 700; }
  .empty { margin: 24px 0; padding: 22px 16px; text-align: center; border: 1px dashed var(--line); border-radius: 12px; color: var(--sub); }
  .empty button { margin-top: 10px; padding: 7px 18px; border: 1px solid var(--accent); border-radius: 99px; background: var(--accent-soft); color: var(--text); font-weight: 700; cursor: pointer; }
  .legend { margin: 18px 0 0; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); }
  .legend > summary { cursor: pointer; padding: 11px 14px; font-weight: 700; font-size: .875rem; list-style-position: inside; }
  .legend .body { padding: 0 14px 14px; font-size: .8125rem; line-height: 1.75; }
  .legend dl { margin: 6px 0 0; }
  .legend dt { margin: 10px 0 0; font-weight: 800; color: var(--text); }
  .legend dd { margin: 2px 0 0; color: var(--sub); }
  .notes { margin: 14px 0 0; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); }
  .notes > summary { cursor: pointer; padding: 11px 14px; font-weight: 700; font-size: .875rem; list-style-position: inside; }
  .notes .body { padding: 0 14px 14px; font-size: .8125rem; line-height: 1.75; color: var(--sub); }
  .notes ul { margin: 6px 0 4px; padding-left: 1.2em; }
  .notes li { margin: 3px 0; }
  .notes a, .src a { color: var(--accent); text-underline-offset: 2px; overflow-wrap: anywhere; }

  /* ---- 詳細（画像を押したときに開く） ---- */
  .ov { position: fixed; inset: 0; z-index: 200; display: flex; align-items: flex-start; justify-content: center; padding: 18px 12px 28px; background: rgba(0, 0, 0, .78); overflow-y: auto; scrollbar-gutter: stable both-edges; overscroll-behavior: contain; }   /* 中身が長くて縦スクロールが出るステージでも、詳細の位置・幅がずれないように、スクロールバーの場所をいつも空けておく */
  .dlg { position: relative; width: min(100%, 62rem); background: var(--panel); color: var(--text); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; box-shadow: 0 18px 60px rgba(0, 0, 0, .6); }
  .dlg .bigpic { position: relative; aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--panel2, var(--bg)), var(--accent-soft)); }
  .dlg .bigpic .full { position: absolute; inset: 0; display: block; width: 100%; height: 100%; padding: 0; border: 0; background: none; cursor: zoom-in; }
  .dlg .bigpic img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .dlg .bigpic .ph { position: absolute; inset: 0; display: grid; place-items: center; align-content: center; text-align: center; padding: 16px; color: var(--sub); font-size: 1rem; font-weight: 800; }
  .dlg .bigpic .hint { position: absolute; left: 10px; bottom: 10px; padding: 1px 10px; border-radius: 99px; background: rgba(0, 0, 0, .62); color: #fff; font-size: .6875rem; font-weight: 700; }
  .bar { position: absolute; top: 8px; right: 8px; left: 8px; z-index: 2; display: flex; justify-content: space-between; gap: 8px; pointer-events: none; }
  .bar .nav { display: flex; gap: 6px; }
  .bb { pointer-events: auto; min-width: 40px; height: 40px; padding: 0 12px; border: 0; border-radius: 99px; background: rgba(0, 0, 0, .68); color: #fff; font-size: .875rem; font-weight: 800; cursor: pointer; }
  .bb:hover { background: rgba(0, 0, 0, .85); }
  .det { padding: 14px 16px 18px; }
  .det h2 { margin: 0; font-size: 1.25rem; line-height: 1.35; }
  .det .ja2 { margin: 2px 0 0; color: var(--sub); font-size: .8125rem; }
  .det .tags { margin-top: 9px; }
  .facts { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin: 12px 0 0; }
  .fact { padding: 7px 10px; border: 1px solid var(--line); border-radius: 10px; background: var(--panel2, var(--bg)); min-width: 0; }
  .fact .k { display: block; color: var(--sub); font-size: .6875rem; font-weight: 700; }
  .fact .v { display: block; margin-top: 1px; font-size: .875rem; font-weight: 700; overflow-wrap: anywhere; }
  .det h3 { margin: 16px 0 6px; padding-bottom: 3px; border-bottom: 1px solid var(--line); font-size: .9375rem; }
  .fl { margin: 0 0 8px; padding: 8px 12px; border: 1px solid var(--line); border-radius: 10px; }
  .fl .fh { display: flex; align-items: baseline; gap: 8px; font-weight: 800; }
  .fl .fh .sz { color: var(--sub); font-size: .75rem; font-weight: 500; }
  .fl ul { margin: 4px 0 0; padding-left: 1.2em; font-size: .875rem; line-height: 1.7; }
  .fl .t { margin: 3px 0 0; color: var(--sub); font-size: .8125rem; }
  .det .nl { margin: 0; padding-left: 1.2em; font-size: .875rem; line-height: 1.8; }
  .gx { display: grid; grid-template-columns: minmax(0, 11rem) minmax(0, 1fr); gap: 4px 12px; align-items: start; margin: 0 0 10px; }
  .gx .gpic { aspect-ratio: 16 / 9; background: var(--panel2, var(--bg)); border-radius: 8px; overflow: hidden; }
  .gx .gpic img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .gx .gn { margin: 0; font-size: .875rem; font-weight: 800; }
  .gx .gd { margin: 2px 0 0; color: var(--sub); font-size: .8125rem; line-height: 1.7; }
  .src { margin: 14px 0 0; color: var(--sub); font-size: .75rem; line-height: 1.7; }
  /* ギミックのアイコン */
  .gi { display: inline-block; width: 1.3em; height: 1.3em; flex: none; vertical-align: -.3em; margin-right: .3em; border-radius: 3px; -webkit-user-drag: none; user-select: none; }
  .tg .gi { margin-left: -4px; margin-right: 4px; }
  .fl li .gi { width: 1.5em; height: 1.5em; vertical-align: -.4em; }
  .gx .gn .gi, .legend dt .gi { width: 1.6em; height: 1.6em; vertical-align: -.45em; }
  @media (max-width: 819px) {
    .search { min-height: 44px; font-size: 16px; border-radius: 12px; }
    .chip { min-height: 36px; }
    .ov { padding: 0; }
    .dlg { width: 100%; min-height: 100%; border-radius: 0; border: 0; }
    .gx { grid-template-columns: 1fr; }
    .facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .gx .gpic { max-width: 16rem; }
  }
  @media (prefers-reduced-motion: no-preference) { .card { transition: border-color .15s; } }






















































































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
.card { border-radius: 22px; box-shadow: 0 5px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); transition: transform .24s var(--pop-ease, ease), box-shadow .24s var(--pop-ease, ease), border-color .15s; }
.card:hover { transform: translateY(-4px) rotate(-.4deg); box-shadow: 0 9px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
.card:active { transform: translateY(1px); box-shadow: 0 2px 0 var(--pop-shadow, rgba(0, 0, 0, .5)); }
/*POP-END*/
`;

  const FILTERS = [["all", "すべて"], ["wall", "ウォール系"], ["floor", "フロア系"], ["balc", "バルコニー"], ["multi", "階層変化"], ["none", "ギミックなし"]];
  const match = (s, f) => f === "all" || (f === "wall" && s.wall) || (f === "floor" && s.floor) || (f === "balc" && s.balc) || (f === "multi" && s.multi) || (f === "none" && s.none);
  const st = { q: "", f: "all" };
  let shown = false, openIdx = -1, lastFocus = null, htmlOverflow = "";

  root.innerHTML = "<style>" + CSS + `</style>
<div class="wrapsg">
  <div class="sbox"><input class="search" id="sg-q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" aria-label="ステージを検索" placeholder="ステージ名・ギミック・キャラで検索"></div>
  <div class="filters"><div class="fgrp" role="group" aria-label="ギミックで絞り込み"><span class="lbl">ギミック</span>` +
    FILTERS.map(([id, nm]) => '<button type="button" class="chip" data-f="' + id + '" aria-pressed="' + (id === "all") + '">' + nm + '<span class="n"></span></button>').join("") + `</div></div>
  <p class="stat" id="sg-stat" role="status" aria-live="polite"></p>
  <div class="grid" id="sg-grid"></div>
  <details class="legend"><summary>ギミックの種類と仕組み</summary><div class="body"><dl>` +
    Object.keys(GIMS).map(id => "<dt>" + gi(id) + esc(GIMS[id].n) + "</dt><dd>" + esc(GIMS[id].d) + "</dd>").join("") + `</dl></div></details>
</div>
<div class="ov" id="sg-ov" hidden role="dialog" aria-modal="true" aria-label="ステージの詳細"><div class="dlg" id="sg-dlg"></div></div>`;
  const $ = id => root.getElementById("sg-" + id);

  function tagsHtml(s) {
    const t = s.g.map(i => '<span class="tg ' + GIMS[i].k + '">' + gi(i) + esc(GIMS[i].n) + "</span>");
    if (s.soon) t.push('<span class="tg dlc">配信予定</span>');
    else if (!s.g.length) t.push('<span class="tg">ギミックなし</span>');
    if (s.multi) t.push('<span class="tg">' + s.floors.length + "フロア</span>");
    if (s.dlc) t.push('<span class="tg dlc">DLC</span>');
    return t.join("");
  }
  const picHtml = (s, big) => '<span class="ph">' + esc(s.en) + "<small>" + esc(s.ja) + "</small></span>" +
    (s.img ? '<img src="' + esc(big ? s.img : (s.th || s.img)) + '" alt="" decoding="async">' : "");

  function visible() {
    const toks = nrm(st.q).split(/\s+/).filter(Boolean);
    return STAGES.filter(s => match(s, st.f) && toks.every(t => s.n.includes(t)));
  }
  function render() {
    const list = visible();
    for (const b of root.querySelectorAll("[data-f]")) {
      b.setAttribute("aria-pressed", String(b.dataset.f === st.f));
      b.querySelector(".n").textContent = STAGES.filter(s => match(s, b.dataset.f)).length;
    }
    $("stat").innerHTML = "<b>" + list.length + "</b>ステージを表示" + (list.length === STAGES.length ? "" : "（全" + STAGES.length + "ステージ）") + "　<span style=\"display:inline-block\">画像を押すと詳しい説明が開きます。</span>";
    $("grid").innerHTML = list.length ? list.map(s => {
      const idx = STAGES.indexOf(s);
      return '<button type="button" class="card" data-i="' + idx + '" aria-label="' + esc(s.en) + 'の詳細を開く"><span class="pic">' + picHtml(s) + (s.soon ? '<span class="soon">配信予定</span>' : '<span class="zoom">詳細 ▸</span>') + '</span><span class="info"><span class="nm">' + esc(s.en) + '<span class="ja">' + esc(s.ja) + '</span></span><span class="tags">' + tagsHtml(s) + "</span></span></button>";
    }).join("") : '<div class="empty" style="grid-column:1/-1"><div>該当するステージがありません。</div><button type="button" data-reset>条件をクリア</button></div>';
  }

  /* ---------- 詳細 ---------- */
  function detail(i) {
    const s = STAGES[i];
    const facts = [["広さ", s.size], ["形・構成", s.shape], ["関連キャラ（参考）", s.chara || "―"], ["BGM", s.bgm || "―"]];   // 5つの枠はいつも同じ並び・同じ幅（関連キャラやBGMが無いステージも、枠は残して「―」）
    facts.push(["配信", s.soon ? "2027年初頭の予定" : s.dlc ? "追加ステージ（DLC）" : "初期ステージ"]);
    const fl = s.floors.map(f => '<div class="fl"><div class="fh"><span>' + esc(f.n) + '</span><span class="sz">広さ ' + esc(f.size) + "</span></div>" +
      (f.g.length ? "<ul>" + f.g.map(([id, tx]) => "<li><b>" + gi(id) + esc(GIMS[id].n) + "</b>：" + esc(tx) + "</li>").join("") + "</ul>" : '<p class="t">' + esc(f.t || "ギミックなし。") + "</p>") +
      (f.g.length && f.t ? '<p class="t">' + esc(f.t) + "</p>" : "") + "</div>").join("");
    const gx = s.g.map(id => { const g = GIMS[id]; return '<div class="gx"><div class="gpic"><img src="' + esc(g.img) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div><div><p class="gn">' + gi(id) + esc(g.n) + '</p><p class="gd">' + esc(g.d) + "</p></div></div>"; }).join("");
    $("dlg").innerHTML = '<div class="bar"><div class="nav"><button type="button" class="bb" data-nav="-1" aria-label="前のステージ">◀</button><button type="button" class="bb" data-nav="1" aria-label="次のステージ">▶</button></div><button type="button" class="bb" data-close id="sg-close" aria-label="閉じる">✕ 閉じる</button></div>' +
      '<div class="bigpic">' + (s.img ? '<button type="button" class="full" data-full aria-label="大きな画像を別のタブで開く">' + picHtml(s, true) + '<span class="hint">画像を押すと大きな画像が別のタブで開きます</span></button>' : picHtml(s, true)) + "</div>" +
      '<div class="det"><h2>' + esc(s.en) + '</h2><p class="ja2">' + esc(s.ja) + '</p><div class="tags">' + tagsHtml(s) + "</div>" +
      '<div class="facts">' + facts.map(([k, v]) => '<div class="fact"><span class="k">' + k + '</span><span class="v">' + esc(v) + "</span></div>").join("") + "</div>" +
      (s.floors.length ? "<h3>フロアごとのギミック</h3>" + fl : "") +
      (s.notes.length ? "<h3>ポイント</h3><ul class=\"nl\">" + s.notes.map(n => "<li>" + esc(n) + "</li>").join("") + "</ul>" : "") +
      (gx ? "<h3>このステージのギミック解説</h3>" + gx : "") +
      '</div>';
  }
  function openDetail(i, from) {
    if (i < 0 || i >= STAGES.length) return;
    if (openIdx < 0) { lastFocus = from || null; htmlOverflow = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden"; }
    openIdx = i; detail(i);
    $("ov").hidden = false; $("ov").scrollTop = 0;
    const c = $("close"); if (c) c.focus({ preventScroll: true });
  }
  function closeDetail() {
    if (openIdx < 0) return;
    openIdx = -1; $("ov").hidden = true; $("dlg").innerHTML = "";
    document.documentElement.style.overflow = htmlOverflow;
    if (lastFocus && lastFocus.isConnected) { try { lastFocus.focus({ preventScroll: true }); } catch (_) {} }
  }
  /* 大きな画像を別タブで開く：埋め込み画像（data:）はリンクのままでは開けないので、その場でBlobのURLにする */
  const blobUrls = {};
  function openFull(i) {
    const s = STAGES[i];
    if (!s || !s.img) return;
    try {
      if (!blobUrls[s.id]) {
        const m = /^data:([^;]+);base64,(.*)$/.exec(s.img);
        if (!m) { window.open(s.img, "_blank", "noopener"); return; }
        const bin = atob(m[2]), u8 = new Uint8Array(bin.length);
        for (let k = 0; k < bin.length; k++) u8[k] = bin.charCodeAt(k);
        blobUrls[s.id] = URL.createObjectURL(new Blob([u8], { type: m[1] }));
      }
      window.open(blobUrls[s.id], "_blank", "noopener");
    } catch (_) {}
  }
  const step = d => { const n = STAGES.length; openDetail((openIdx + d + n) % n); };

  /* ---------- 操作 ---------- */
  $("q").addEventListener("input", e => { st.q = e.target.value; render(); });
  root.addEventListener("click", e => {
    const t = e.target.closest ? e.target.closest("button, .ov") : null;
    if (!t) return;
    if (t.dataset && t.dataset.f) { st.f = t.dataset.f; render(); }
    else if (t.classList.contains("card")) openDetail(+t.dataset.i, t);
    else if (t.hasAttribute("data-full")) openFull(openIdx);
    else if (t.hasAttribute("data-close")) closeDetail();
    else if (t.dataset && t.dataset.nav) step(+t.dataset.nav);
    else if (t.hasAttribute("data-reset")) { st.q = ""; st.f = "all"; $("q").value = ""; render(); }
    else if (t.id === "sg-ov" && e.target === t) closeDetail();            // 暗い背景を押したら閉じる
  });
  root.addEventListener("error", e => { const im = e.target; if (im && im.tagName === "IMG") { im.style.display = "none"; const a = im.closest ? im.closest("a, .full") : null; if (a) { a.removeAttribute("href"); a.removeAttribute("data-full"); const h = a.querySelector(".hint"); if (h) h.style.display = "none"; } } }, true);   // 画像が読み込めないときは、下の名前入りの枠を見せる
  document.addEventListener("keydown", e => {
    if (openIdx < 0) return;
    if (e.key === "Escape") { e.preventDefault(); closeDetail(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });

  window.SG = {
    show() { shown = true; render(); },
    hide() { shown = false; closeDetail(); },
    count: () => STAGES.length,
    stages: () => STAGES
  };
  render();
})();

/*SGJS-END*/
