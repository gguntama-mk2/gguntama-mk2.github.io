import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
try {
  await sleep(1400);
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const device of ['pc', 'sp']) {
    const page = await browser.newPage({ viewport: device === 'pc' ? {width: 1366, height: 768} : {width: 390, height: 844}, isMobile: device === 'sp' });
    const failures = [];
    page.on('pageerror', e => failures.push(e.message));
    const response = await page.goto('http://127.0.0.1:8765/test-litev1/' + device + '.html', { waitUntil: 'load', timeout: 120000 });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('[data-go="sheet"]').count() > 0, true);
    assert.equal(await page.locator('#viewSheet').count(), 1);
    for (const slug of ['home','sheet','vs']) {
      await page.evaluate(s => { location.hash = '#' + s; }, slug);
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => location.hash), '#' + slug);
    }
    // Verify new on-demand image store, including full-resolution gallery decoding.
    const media = await page.evaluate(async () => {
      if (!window.PXS || typeof window.PXS.gallery !== 'function') throw Error('PXS missing');
      await window.PXS.ready();
      const ids = window.PXS.ids();
      if (!ids.length || !window.PXS.has('_probe')) throw Error('PXS manifest empty');
      const first = ids.find(x => window.PXS.has('_g_' + x)) || ids[0];
      const bitmap = await window.PXS.gallery(first);
      return { keys: ids.length, imageWidth: bitmap.width || bitmap.naturalWidth, imageHeight: bitmap.height || bitmap.naturalHeight, url: window.PXS.url(first) };
    });
    assert.equal(media.keys > 0, true);
    assert.equal(media.imageWidth > 0 && media.imageHeight > 0, true);
    assert.equal(media.url.startsWith('assets/pxstore/'), true);
    console.log(device + ' PXStore media OK', JSON.stringify(media));
    if (failures.length) console.warn(device + ' page errors:', failures.slice(0, 10));
    console.log(device + ' smoke: basic DOM and navigation OK, pageerrors=' + failures.length);
    // A page error must be explicitly reviewed rather than silently treated as success.
    assert.equal(failures.length, 0, device + ': ' + failures.slice(0, 5).join(' | '));
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}
