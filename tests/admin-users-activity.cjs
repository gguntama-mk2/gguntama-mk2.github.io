/* Standalone browser test for the admin user list: last access, status chips, sort, search. Synthetic data only. */
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const now = Date.now(), iso = d => new Date(now - d * 86400000).toISOString().replace("Z", "");
const mk = (n, name, days, admin) => ({ project_t_id: "00000000-0000-4000-8000-00000000000" + n, tekken_id: null, tekken_id_enabled: false,
  display_name: name, providers: ["google"], created_at: iso(40 - n), is_admin: !!admin,
  last_access_at: days == null ? null : iso(days), last_site_at: days == null ? null : iso(days), last_recorder_at: null,
  activity: days == null ? "unknown" : days <= 7 ? "active" : days <= 30 ? "recent" : "dormant" });
const users = [mk(1, "Alpha", 1, true), mk(2, "Bravo", 15), mk(3, "Charlie", 90), mk(4, "Delta", null), mk(5, "Echo", null)];
users[3].unknown_detail = { past_use: "used", devices: 1, matches: 4, trace_at: iso(5) };
users[4].unknown_detail = { past_use: "never", devices: 0, matches: 0, trace_at: null }; users[1].providers = ["discord"]; users[1].has_note = true; users[1].contact_needed = true;
const puts = [];
const requests = [];

const server = http.createServer(async (req, res) => {
  const p = new URL(req.url, "http://localhost").pathname;
  if (p === "/admin.html" || p === "/admin.js") {
    res.writeHead(200, { "Content-Type": p.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript; charset=utf-8" });
    res.end(await fs.readFile(path.join(process.cwd(), p.slice(1))));
  } else if (p.endsWith(".js")) { res.writeHead(200, { "Content-Type": "text/javascript" }); res.end(""); }
  else { res.writeHead(404); res.end(); }
});

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 1366]) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      puts.length = 0; const errors = []; page.on("pageerror", e => errors.push(e.message));
      await page.addInitScript(() => {
        const stub = new Proxy({}, { get: () => () => {} });
        window.PTAdminMoveMedia = stub; window.PTAdminMoveIcons = stub; window.PTAdminCloudAnalysis = stub;
        window.PTAdminCommunityPublish = stub; window.PTAdminComboVideos = stub; window.PTAdminPxImages = stub; window.PTAdminCommunity = stub;
      });
      await page.route(/\/api\/v1\//, async route => {
        const u = new URL(route.request().url()); let data;
        if (u.pathname === "/api/v1/me") data = { is_admin: true, display_name: "Alpha", project_t_id: users[0].project_t_id, csrf_token: "t" };
        else if (u.pathname === "/api/v1/admin/users/stats") {
          data = { days: ["2026-11-01", "2026-11-02", "2026-11-03"], registered: [1, 0, 2], registered_total: [1, 1, 3], active: [0, 1, 2], active_since: "2026-11-02", users_total: 5 };
        } else if (/\/detail$/.test(u.pathname)) {
          data = Object.assign({}, users[1], { accounts: [{ provider: "discord", username: "bravo#1", linked_at: iso(30) }], devices: [], match_count: 7, last_match_at: iso(2), recording_count: 0, active_days: 3, note: "hello", contact_needed: true });
        } else if (/\/note$/.test(u.pathname)) {
          puts.push(route.request().postData()); data = { ok: true };
        } else if (u.pathname === "/api/v1/admin/users") {
          requests.push(u.search);
          const q = (u.searchParams.get("q") || "").toLowerCase(), st = u.searchParams.get("status");
          const prov = u.searchParams.get("provider");
          const base = users.filter(x => (!q || x.display_name.toLowerCase().includes(q)) && (!prov || x.providers.includes(prov)));
          const counts = { active: 0, recent: 0, dormant: 0, unknown: 0, unknown_used: 1, unknown_never: 1, contact: 1 }; base.forEach(x => counts[x.activity]++);
          let list = base.filter(x => !st || x.activity === st || (st === "unknown_used" && x.unknown_detail && x.unknown_detail.past_use === "used") || (st === "unknown_never" && x.unknown_detail && x.unknown_detail.past_use === "never"));
          list = list.slice(0, parseInt(u.searchParams.get("limit") || "50", 10));
          if (u.searchParams.get("sort") === "last_access") {
            const dir = u.searchParams.get("order") === "asc" ? 1 : -1;
            list = list.slice().sort((a, b) => ((a.last_access_at || "") < (b.last_access_at || "") ? -1 : 1) * dir);
          }
          data = { admins: 1, total: list.length, users: list, status_counts: counts };
        } else { await route.fulfill({ status: 404 }); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
      });
      await page.goto("http://127.0.0.1:" + server.address().port + "/admin.html");
      await page.locator("#tabs:not([hidden])").waitFor();
      await page.locator('button[data-tab="users"]').click();
      const sel = width < 800 ? ".pt-user-card" : ".pt-users-desktop tbody tr";
      await page.waitForFunction(s => document.querySelectorAll(s).length === 5, sel);
      const text = await page.locator("#secUsers").innerText();
      assert(/アクティブ/.test(text) && /休眠/.test(text) && /記録なし/.test(text) && /日前/.test(text), "badges and ago text: " + width);
      // chips with counts
      assert.match(await page.locator('.pt-chip[data-status="active"]').innerText(), /アクティブ 1/);
      assert.match(await page.locator('.pt-chip[data-status="all"]').innerText(), /全員 5/);
      await page.locator('.pt-chip[data-status="dormant"]').click();
      await page.waitForFunction(s => document.querySelectorAll(s).length === 1, sel);
      assert(requests.at(-1).includes("status=dormant"));
      assert.equal(await page.locator('.pt-chip[data-status="dormant"]').getAttribute("aria-pressed"), "true");
      await page.locator('.pt-chip[data-status="all"]').click();
      await page.waitForFunction(s => document.querySelectorAll(s).length === 5, sel);
      // 記録なしの内訳
      assert(/記録なし・利用歴あり/.test(await page.locator("#secUsers").innerText()) && /記録なし・未使用/.test(await page.locator("#secUsers").innerText()), "unknown split labels");
      await page.locator('.pt-chip[data-status="unknown_used"]').click();
      await page.waitForFunction(s => document.querySelectorAll(s).length === 1, sel);
      assert(requests.at(-1).includes("status=unknown_used"));
      await page.locator('.pt-chip[data-status="all"]').click();
      await page.waitForFunction(s => document.querySelectorAll(s).length === 5, sel);
      // ログイン方法・件数
      await page.selectOption("#ptUsersProv", "discord"); await page.waitForTimeout(200);
      assert(requests.at(-1).includes("provider=discord") && await page.locator(sel).count() === 1);
      await page.selectOption("#ptUsersProv", ""); await page.selectOption("#ptUsersLimit", "25"); await page.waitForTimeout(200);
      assert(requests.at(-1).includes("limit=25"), requests.at(-1));
      await page.selectOption("#ptUsersLimit", "50"); await page.waitForFunction(s => document.querySelectorAll(s).length === 5, sel);
      // グラフ
      await page.locator("details.pt-users-stats > summary").click();
      await page.locator("svg.pt-chart").first().waitFor(); assert.equal(await page.locator("svg.pt-chart").count(), 2);
      // 詳細とメモ
      await page.locator('[data-detail]:visible').first().click();
      await page.locator("#ptUserDetail textarea").waitFor();
      assert.equal(await page.locator("#ptUserDetail textarea").inputValue(), "hello");
      await page.locator("#ptUserDetail textarea").fill("new memo");
      await page.locator("#ptUserDetail button", { hasText: "メモを保存" }).click(); await page.waitForTimeout(300);
      assert(puts.length === 1 && JSON.parse(puts[0]).note === "new memo" && JSON.parse(puts[0]).contact_needed === true, puts.join());
      await page.locator("#ptUserDetail button", { hasText: "閉じる" }).click();
      // sort via select
      await page.selectOption("#ptUsersSort", "last_access|asc");
      await page.waitForFunction(() => /sort=last_access&order=asc/.test(""+location.href) || true);
      await page.waitForTimeout(150);
      assert(requests.at(-1).includes("sort=last_access") && requests.at(-1).includes("order=asc"), requests.at(-1));
      // header toggle (desktop)
      if (width >= 800) {
        await page.locator('.pt-sort-head[data-sort="last_access"]').click(); await page.waitForTimeout(150);
        assert(requests.at(-1).includes("order=desc"), "toggle to desc: " + requests.at(-1));
        assert.equal(await page.locator('.pt-sort-head[data-sort="last_access"]').locator("..").getAttribute("aria-sort"), "descending");
        assert.match(await page.locator('.pt-sort-head[data-sort="last_access"]').innerText(), /▼/);
      }
      // search + status combined
      await page.locator("#ptUsersSearch").fill("br"); await page.waitForTimeout(700);
      assert(requests.at(-1).includes("q=br"));
      assert.equal(await page.locator(sel).count(), 1);
      await page.locator("#ptUsersSearch").fill("");  await page.waitForTimeout(600);
      const doc = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      if (width < 800) assert(doc[0] <= doc[1], "no horizontal overflow " + doc);
      await page.screenshot({ path: process.env.SHOT_DIR ? process.env.SHOT_DIR + "/users-" + width + ".png" : "/dev/null", fullPage: true });
      assert.deepEqual(errors, [], errors.join("; "));
      console.log("PASS", width); await page.close();
    }
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
