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
      await page.evaluate(s => { window.setPage(s); }, slug);
      await page.waitForTimeout(400);
      assert.equal(await page.evaluate(() => window.pageNow()), slug);
    }
    // Character data must be fetched only when the matching character is needed.
    await page.waitForFunction(() => !!window.PT_CHAR_DATA && window.PT_CHAR_DATA.loaded().length > 0, null, { timeout: 30000 });
    const chars = await page.evaluate(async () => {
      const all = CHARACTERS;
      if (all.length < 30) throw Error('Character metadata missing');
      const initial = window.PT_CHAR_DATA.loaded();
      const next = all.find(c => !c.__ptLoaded && c.moves.length);
      if (!next) throw Error('No lazy character available');
      const before = next.moves.map((raw, index) => Number.isInteger(raw.k) ? raw.k : index);
      const beforeOff = next.moves.map(raw => JSON.stringify(raw.off || []));
      await window.PT_CHAR_DATA.load(next);
      const after = next.moves.map((raw, index) => Number.isInteger(raw.k) ? raw.k : index);
      const afterOff = next.moves.map(raw => JSON.stringify(raw.off || []));
      if (JSON.stringify(before) !== JSON.stringify(after) || JSON.stringify(beforeOff) !== JSON.stringify(afterOff))
        throw Error('Stable IDs or off-columns changed');
      if (!next.moves.some(raw => typeof raw === 'object' && typeof raw.name === 'string'))
        throw Error('Move names not loaded');
      return { characters: all.length, initiallyLoaded: initial, tested: next.id, moves: next.moves.length };
    });
    assert.equal(chars.characters > 30, true);
    assert.equal(chars.initiallyLoaded.length < chars.characters, true);
    console.log(device + ' on-demand character data OK', JSON.stringify(chars));
    // All feature modules must start after navigation, not during initial home load.
    assert.equal(await page.evaluate(() => !!window.PT_ROUTE_ASSETS), true);
    for (const [slug, code] of Object.entries({ combo:'06', glossary:'07', punish:'08', stage:'09', gallery:'12', login:'14', vs:'15', privacy:'16' })) {
      await page.evaluate(s => { window.setPage(s); }, slug);
      await page.waitForFunction(c => !!window.PT_ROUTE_ASSETS && window.PT_ROUTE_ASSETS.loaded().includes(c), code, {timeout:60000});
      console.log(device + ' module loaded on navigation: ' + slug + ' -> ' + code);
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
