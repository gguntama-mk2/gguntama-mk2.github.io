
/*CLKJS-START*/
/* ===== デジタル時計（全ページ共通） =====
   世界時計（時刻を配信しているWeb API）から正確な時刻を取り、端末の時計とのずれを補正して1秒ごとに進める。
   ・表示：年・月・日・曜日・時刻（時:分:秒）。時間帯は、見ている人の端末の設定に合わせる。
   ・PC版は右上（「デザイン」の上）、スマホ版はヘッダーの右（メニューボタンの左）に出す。
   ・取得できないとき（オフライン・接続の制限など）は、端末の時計のまま止まらずに動く（右の点が灰色になる）。
   ・同期は、開いたときと、その後15分ごと、タブに戻ってきたとき。失敗したときは30秒後から数回だけやり直す。
   ・ほかの部品（トップページの画面など）には、毎秒「tclk」イベントで時刻の部品（detail）を渡す。 */
(function () {
  if (window.TCLK) return;
  const SRC = [
    { url: "https://worldtimeapi.org/api/timezone/Etc/UTC", pick: j => j && (j.utc_datetime || j.datetime) },
    { url: "https://timeapi.io/api/time/current/zone?timeZone=UTC", pick: j => j && j.dateTime }
  ];
  const S = { off: 0, ok: false, at: 0, fails: 0, busy: false };
  const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined; } catch (e) { return undefined; } })();
  const WD = ["日", "月", "火", "水", "木", "金", "土"], WDE = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  /* ISO形式（UTC）の文字列 → ミリ秒。小数が7桁あっても読める */
  function isoUtc(s) {
    const m = /^(\d{4})-(\d\d)-(\d\d)[T ](\d\d):(\d\d):(\d\d)(?:\.(\d+))?/.exec(String(s || ""));
    if (!m) return NaN;
    const ms = m[7] ? Math.round(parseFloat("0." + m[7]) * 1000) : 0;
    return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) + ms;
  }
  async function ask(src) {
    const ac = typeof AbortController === "function" ? new AbortController() : null;
    const to = ac ? setTimeout(() => ac.abort(), 5000) : 0;
    try {
      const t0 = Date.now();
      const r = await fetch(src.url, { cache: "no-store", mode: "cors", credentials: "omit", referrerPolicy: "no-referrer", signal: ac ? ac.signal : undefined });
      if (!r.ok) throw new Error("http " + r.status);
      const j = await r.json(), t1 = Date.now();
      const srv = isoUtc(src.pick(j));
      if (!isFinite(srv)) throw new Error("bad time");
      return srv + (t1 - t0) / 2 - t1;    // 往復にかかった時間の半分を足して、端末の時計とのずれにする
    } finally { if (to) clearTimeout(to); }
  }
  async function sync() {
    if (S.busy || window.__NO_WORLD_CLOCK) return;     // __NO_WORLD_CLOCK は、通信できない環境でのテスト用の目印（通常は付かない）
    S.busy = true;
    let off = null;
    for (const src of SRC) { try { off = await ask(src); break; } catch (e) { /* 次の取得先へ */ } }
    S.busy = false;
    if (off === null) {
      S.ok = false; S.fails++;
      if (S.fails <= 3) setTimeout(sync, 30000);
    } else { S.off = off; S.ok = true; S.at = Date.now(); S.fails = 0; }
    paintState();
  }

  const now = () => Date.now() + S.off;
  let fmt = null, fmtEn = null;
  function formatters() {
    if (fmt || fmt === false) return;
    const mk = (loc, o) => { try { return new Intl.DateTimeFormat(loc, Object.assign({ timeZone: TZ }, o)); } catch (e) { try { return new Intl.DateTimeFormat(loc, o); } catch (e2) { return false; } } };
    fmt = mk("ja-JP", { year: "numeric", month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
    fmtEn = mk("en-US", { weekday: "short" });
  }
  const p2 = n => (n < 10 ? "0" : "") + n;
  function parts(t) {
    t = t == null ? now() : t;
    formatters();
    const d = new Date(t);
    let o;
    if (fmt) {
      const g = {}; fmt.formatToParts(d).forEach(x => { g[x.type] = x.value; });
      const wdi = Math.max(0, WD.indexOf(String(g.weekday || "").charAt(0)));
      o = { y: +g.year, mo: +g.month, d: +g.day, h: (+g.hour) % 24, mi: +g.minute, s: +g.second, wdi };
    } else {
      o = { y: d.getFullYear(), mo: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes(), s: d.getSeconds(), wdi: d.getDay() };
    }
    o.wd = WD[o.wdi]; o.wdEn = WDE[o.wdi];
    o.hh = p2(o.h); o.mm = p2(o.mi); o.ss = p2(o.s);
    return o;
  }
  function zoneLabel(t) {
    if (TZ === "Asia/Tokyo") return "JST";
    const m = -new Date(t == null ? now() : t).getTimezoneOffset(), a = Math.abs(m);
    return "UTC" + (m < 0 ? "-" : "+") + Math.floor(a / 60) + (a % 60 ? ":" + p2(a % 60) : "");
  }

  /* ---- 表示 ---- */
  const CSS = `
.titleright { position: fixed; z-index: 39; top: calc(env(safe-area-inset-top, 0px) + 5px); right: calc(env(safe-area-inset-right, 0px) + var(--mn-tab, 56px) + 10px); display: block; width: auto; margin: 0 !important; pointer-events: none; }
.titleright .tclk { pointer-events: auto; }
.tclk { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; line-height: 1.15; color: var(--text); font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; user-select: none; -webkit-user-select: none; }
.tclk .tc-sep { animation: tclkBlink 1s steps(1, end) infinite; }
@keyframes tclkBlink { 50% { opacity: .28; } }
@media (prefers-reduced-motion: reduce) { .tclk .tc-sep { animation: none; } }
.tclk.pc { position: relative; padding: 6px 14px 7px 16px; border: 1px solid var(--line); border-left: 3px solid var(--accent); border-radius: 3px; background: color-mix(in srgb, var(--panel) 78%, transparent); }
.tclk.pc .tc-date { font-size: .8125rem; color: var(--sub); letter-spacing: .05em; white-space: nowrap; }
.tclk.pc .tc-time { display: flex; align-items: baseline; gap: 0; font-family: var(--font-ui); font-size: 1.875rem; font-weight: 700; letter-spacing: .04em; white-space: nowrap; }
.tclk.pc .tc-sep { color: var(--accent); padding: 0 1px; }
.tclk.pc .tc-s { margin-left: 8px; font-size: 1.125rem; color: var(--sub); }
.tclk.pc .tc-zone { margin-left: 8px; font-size: .6875rem; color: var(--sub); letter-spacing: .08em; }
.tclk .tc-dot { display: inline-block; width: 7px; height: 7px; margin-left: 9px; border-radius: 50%; background: var(--sub); opacity: .6; align-self: center; }
.tclk[data-sync="1"] .tc-dot { background: var(--ok); opacity: 1; box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 22%, transparent); }
.tclk.sp { flex: none; align-items: flex-end; gap: 0; margin: 0 2px 0 auto; padding: 0 2px; }
.tclk.sp .tc-date { font-size: .625rem; line-height: 1.2; color: var(--sub); letter-spacing: .02em; white-space: nowrap; }
.tclk.sp .tc-time { display: flex; align-items: baseline; font-family: var(--font-ui); font-size: .9375rem; font-weight: 700; line-height: 1.15; letter-spacing: .02em; white-space: nowrap; }
.tclk.sp .tc-sep { color: var(--accent); }
.tclk.sp .tc-s { margin-left: 2px; font-size: .625rem; font-weight: 600; color: var(--sub); }
.tclk.sp .tc-dot { display: none; }
@media (max-width: 760px) {
  .titleright { top: calc(env(safe-area-inset-top, 0px) + 4px); right: calc(env(safe-area-inset-right, 0px) + var(--mn-tab, 52px) + 7px); }
  .tclk.pc { padding: 4px 10px 5px 11px; }
  .tclk.pc .tc-date { font-size: .6875rem; }
  .tclk.pc .tc-time { font-size: 1.32rem; }
  .tclk.pc .tc-s { margin-left: 5px; font-size: .875rem; }
  .tclk.pc .tc-zone { margin-left: 5px; font-size: .5625rem; }
  .tclk.pc .tc-dot { width: 6px; height: 6px; margin-left: 6px; }
}
@media (max-width: 520px) {
  .titleright { right: calc(env(safe-area-inset-right, 0px) + var(--mn-tab, 52px) + 5px); }
  .tclk.pc { padding: 4px 8px 4px 9px; }
  .tclk.pc .tc-date { display: none; }
  .tclk.pc .tc-time { font-size: 1.08rem; }
  .tclk.pc .tc-s { font-size: .7rem; margin-left: 3px; }
  .tclk.pc .tc-zone, .tclk.pc .tc-dot { display: none; }
}
@media (max-width: 340px) { .tclk.pc .tc-s, .tclk.sp .tc-s { display: none; } }
`;
  let el = null, sp = false, refs = null;
  function mount() {
    if (el) return;
    const st = document.createElement("style"); st.id = "tclkCss"; st.textContent = CSS; document.head.appendChild(st);
    const tb = document.querySelector(".titlebar");
    const row = tb ? null : document.querySelector("header.top .top-row");
    if (!tb && !row) return;
    sp = !tb;
    el = document.createElement("div");
    el.id = "tclk"; el.className = "tclk " + (sp ? "sp" : "pc");
    el.setAttribute("role", "timer"); el.setAttribute("aria-label", "現在の日時");
    el.innerHTML = '<span class="tc-date"></span>' +
      '<span class="tc-time"><span class="tc-hm"><span class="tc-h"></span><span class="tc-sep">:</span><span class="tc-m"></span></span>' +
      (sp ? "" : '<span class="tc-sep" style="padding:0 1px">:</span>') + '<span class="tc-s"></span>' +
      (sp ? "" : '<span class="tc-zone"></span><span class="tc-dot" aria-hidden="true"></span>') + '</span>';
    if (tb) {
      const th = tb.querySelector(".themebox");
      const w = document.createElement("div"); w.className = "titleright";
      tb.insertBefore(w, th || null); w.appendChild(el); if (th) w.appendChild(th);
    } else {
      const menu = row.querySelector("#menuBtn");
      row.insertBefore(el, menu || null);
    }
    refs = { date: el.querySelector(".tc-date"), h: el.querySelector(".tc-h"), m: el.querySelector(".tc-m"), s: el.querySelector(".tc-s"), zone: el.querySelector(".tc-zone") };
    paintState();
  }
  function paintState() {
    if (!el) return;
    el.dataset.sync = S.ok ? "1" : "0";
    const t = S.ok ? "世界時計と同期しています" : "端末の時計を表示しています（世界時計に接続できませんでした）";
    el.title = t; el.setAttribute("aria-label", "現在の日時（" + (S.ok ? "世界時計と同期" : "端末の時計") + "）");
  }
  let last = "";
  function paint() {
    const o = parts();
    if (el && refs) {
      const key = o.y + "/" + o.mo + "/" + o.d;
      if (key !== last) {
        last = key;
        refs.date.textContent = sp ? o.mo + "/" + o.d + "（" + o.wd + "）" : o.y + "年" + o.mo + "月" + o.d + "日 " + o.wd + "曜日";
        if (refs.zone) refs.zone.textContent = zoneLabel();
      }
      refs.h.textContent = o.hh; refs.m.textContent = o.mm; refs.s.textContent = (sp ? ":" : "") + o.ss;
    }
    try { document.dispatchEvent(new CustomEvent("tclk", { detail: o })); } catch (e) { /* 何もしない */ }
  }
  function loop() { paint(); setTimeout(loop, 1000 - (now() % 1000) + 8); }

  window.TCLK = { now, parts, sync, zone: zoneLabel, state: () => ({ ok: S.ok, off: S.off, at: S.at, tz: TZ || "" }) };
  const start = () => { mount(); loop(); sync(); setInterval(sync, 15 * 60 * 1000); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { paint(); if (Date.now() - S.at > 5 * 60 * 1000) sync(); } });
})();

/*CLKJS-END*/
