/* Standalone browser smoke test. All user IDs below are synthetic test fixtures. */
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const users = [
  { project_t_id: "11111111-2222-4333-8444-555555555555", tekken_id: "TEKKEN-TEST-001",
    tekken_id_enabled: true, display_name: "管理者テスト", providers: ["discord", "google"],
    created_at: "2026-11-01T00:00:00", is_admin: true },
  { project_t_id: "99999999-8888-4777-8666-555555555555", tekken_id: null,
    tekken_id_enabled: false, display_name: "一般ユーザー", providers: ["google"],
    created_at: "2026-11-02T00:00:00", is_admin: false }
];

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname === "/admin.html" || pathname === "/admin.js") {
    const file = path.join(process.cwd(), pathname.slice(1));
    const body = await fs.readFile(file);
    res.writeHead(200, { "Content-Type": pathname.endsWith(".html") ? "text/html; charset=utf-8" : "text/javascript; charset=utf-8" });
    res.end(body);
  } else if (pathname === "/pc.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<!doctype html><title>Preview stub</title>");
  } else if (pathname.endsWith(".js")) {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    res.end("");
  } else { res.writeHead(404); res.end(); }
});

async function check(page, width) {
  await page.setViewportSize({ width, height: 850 });
  await page.goto("http://127.0.0.1:" + server.address().port + "/admin.html");
  await page.locator("#tabs:not([hidden])").waitFor();
  await page.locator('button[data-tab="users"]').click();
  await page.locator(".pt-user-card").first().waitFor({ state: "attached" });
  await page.waitForFunction(() => document.querySelectorAll(".pt-user-card").length === 2);
  const measurements = await page.evaluate(() => {
    const first = document.querySelector(".pt-user-card");
    const badge = first.querySelector(".pt-user-id-row .badge");
    const tab = document.querySelector('nav.tabs button[data-tab="users"]');
    const b = badge.getBoundingClientRect(), c = first.getBoundingClientRect();
    return {
      docWidth: document.documentElement.scrollWidth, viewport: window.innerWidth,
      cardVisible: getComputedStyle(first).display !== "none" && getComputedStyle(document.querySelector(".pt-users-cards")).display !== "none",
      tableVisible: getComputedStyle(document.querySelector(".pt-users-desktop")).display !== "none",
      badgeText: badge.textContent, badgeWidth: b.width, badgeHeight: b.height,
      badgeInside: b.left >= c.left && b.right <= c.right && b.top >= c.top && b.bottom <= c.bottom,
      navHeight: tab.getBoundingClientRect().height
    };
  });
  if (width <= 800) {
    assert(measurements.cardVisible, "Card view should be visible on mobile");
    assert(!measurements.tableVisible, "Desktop table should be hidden on mobile");
    assert(measurements.docWidth <= width, "Body must not overflow viewport: " + JSON.stringify(measurements));
    assert(measurements.badgeInside, "Status badge must not be cropped");
    assert.equal(measurements.badgeText, "有効");
    assert(measurements.badgeWidth >= 30 && measurements.badgeHeight >= 23, "Status badge must remain readable");
    assert(measurements.navHeight <= 52, "Tabs must stay one-line and compact");
  } else {
    assert(!measurements.cardVisible && measurements.tableVisible, "Desktop must show the table");
  }
  await page.screenshot({ path: "admin-layout-" + width + ".png", fullPage: true });
  return measurements;
}

(async () => {
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 390, 1366]) {
      const page = await browser.newPage({ viewport: { width, height: 850 } });
      const errors = [];
      page.on("pageerror", e => errors.push(e.message));
      await page.addInitScript(() => {
        window.PTAdminMoveMedia = { mount() {}, updateCharacters() {} };
        window.PTAdminMoveIcons = { mount() {}, updateCharacters() {} };
        window.PTAdminCloudAnalysis = { mount() {}, refresh() {} };
      });
      await page.route(/\/api\/v1\//, async route => {
        const url = new URL(route.request().url());
        let data;
        if (url.pathname === "/api/v1/me")
          data = { is_admin: true, display_name: "管理者テスト", project_t_id: users[0].project_t_id, csrf_token: "test" };
        else if (url.pathname === "/api/v1/admin/users") {
          const q = (url.searchParams.get("q") || "").toLowerCase();
          const filtered = users.filter(u => !q || [u.project_t_id, u.tekken_id || "", u.display_name].some(t => t.toLowerCase().includes(q)));
          data = { admins: 1, total: filtered.length, users: filtered };
        } else if (url.pathname.startsWith("/api/v1/admin/users/")) {
          data = users[0];
        } else { await route.fulfill({ status: 404 }); return; }
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(data) });
      });
      const m = await check(page, width);
      if (width === 390) {
        const input = page.locator("#ptUsersSearch");
        await input.fill("TEKKEN-TEST-001");
        await page.waitForFunction(() => document.querySelectorAll(".pt-user-card").length === 1);
        assert(await input.evaluate(el => document.activeElement === el), "Search input should retain focus");
        assert.equal(await page.locator(".pt-user-card").count(), 1);
        await input.fill("");
        await page.waitForFunction(() => document.querySelectorAll(".pt-user-card").length === 2);
      }
      assert.deepEqual(errors, [], "Unexpected JavaScript error: " + errors.join("; "));
      console.log("PASS", width, JSON.stringify(m));
      await page.close();
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
