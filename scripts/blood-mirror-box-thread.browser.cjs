const { startPreviewServer, launchChromium } = require('./browser-harness.cjs');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..');
const origin = 'http://127.0.0.1:4173';
const save = {
  version: 2,
  started: true,
  chapter: 'mirror',
  unlocked: ['library', 'ballroom', 'hunter', 'mine', 'crypt', 'queen', 'mirror'],
  solved: ['library', 'ballroom', 'hunter', 'mine', 'crypt', 'queen', 'mirror'],
  puzzles: ['gallery', 'gallery.gallery-align', 'gallery.gallery-merge'],
  inventory: [], seen: [], hints: {}, clues: [], glowRooms: [], misses: {}, memories: [], shards: [],
  achievements: [], endings: ['dawn'], ending: null, answers: null, elapsed: 1200, muted: true,
};
const names = { A: '鏡廊', B: '陽台', C: '黑松林', D: '舞廳' };

(async () => {
  let browser;
  const server = startPreviewServer(root);
  try {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try { if ((await fetch(origin)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await launchChromium();
    for (const [width, order] of [[360, ['B', 'A', 'D', 'C']], [1280, ['C', 'D', 'A', 'B']]]) {
      const context = await browser.newContext({
        viewport: { width, height: 850 }, isMobile: width < 600, hasTouch: width < 600, reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('response', response => { if (response.status() === 404) errors.push(`404 ${response.url()}`); });
      await page.addInitScript(value => localStorage.setItem('blood-mirror-v2', JSON.stringify(value)), save);
      await page.goto(`${origin}/games/blood-mirror/play/`);
      await page.locator('#abyss-open').click();
      await page.locator('[data-abyss="e5"]').click();
      await page.locator('#abyss-enter').click();
      await page.locator('[data-stage-pick="box-thread"]').click();
      const island = page.locator('[data-vue-box-thread-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Box Thread diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'), errors);
        throw error;
      }

      assert.equal(await page.locator('.box-hole').count(), 4, 'Vue renders all four mirror panels');
      assert.deepEqual(await page.locator('.box-hole span').allTextContents(), ['舞廳', '陽台', '黑松林', '鏡廊']);
      await page.locator(`button[aria-label="${names[order[0]]}"]`).click();
      await page.locator('.box-thread-island .text-button').click();
      assert.ok((await page.locator('.box-line').innerText()).includes('尚未穿過任何一格'), 'undo clears the full red thread');

      await page.locator('button[aria-label="鏡廊"]').click();
      assert.ok((await page.locator('#box-feedback').innerText()).includes('穿不過去'), 'legacy rejects an invalid prefix and explains why');
      assert.ok((await page.locator('.box-line').innerText()).includes('尚未穿過任何一格'), 'an invalid order resets the sequence');

      for (const panel of order) await page.locator(`button[aria-label="${names[panel]}"]`).click();
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('box.box-thread'),
        null,
        { timeout: 5000 },
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue actions and legacy completion do not raise page errors');
      console.log(`✓ Box Thread Vue lazy mount, undo, invalid prefix, ${order[0] === 'B' ? 'forward' : 'reverse'} order and completion @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountBoxThread } = await import('/games/blood-mirror/play/puzzles/box.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountBoxThread({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const panels = host.querySelectorAll('.box-hole').length;
        for (const panel of ['B', 'A', 'D', 'C']) host.querySelector(`[data-h="${panel}"]`).click();
        await new Promise(resolve => setTimeout(resolve, 80));
        const result = { panels, completed, status: host.querySelector('#bf-status').textContent };
        host.remove();
        return result;
      });
      assert.equal(fallback.panels, 4, 'legacy fallback still renders all four panels');
      assert.equal(fallback.completed, 1, 'legacy fallback still owns completion');
      assert.ok(fallback.status.includes('紅線穿過了四面鏡孔'), 'legacy fallback announces successful order');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
