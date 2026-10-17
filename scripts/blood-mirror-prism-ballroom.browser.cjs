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
  puzzles: ['prism.prism-rays', 'prism.prism-blend'],
  inventory: [], seen: [], hints: {}, clues: [], glowRooms: [], misses: {}, memories: [], shards: [],
  achievements: [], endings: ['dawn'], ending: null, answers: null, elapsed: 1200, muted: true,
};

(async () => {
  let browser;
  const server = startPreviewServer(root);
  try {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try { if ((await fetch(origin)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    browser = await launchChromium();
    for (const width of [360, 1280]) {
      const context = await browser.newContext({
        viewport: { width, height: 850 },
        isMobile: width < 600,
        hasTouch: width < 600,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(value => localStorage.setItem('blood-mirror-v2', JSON.stringify(value)), save);
      await page.goto(`${origin}/games/blood-mirror/play/`);
      await page.locator('#abyss-open').click();
      await page.locator('[data-abyss="e2"]').click();
      await page.locator('#abyss-enter').click();
      const island = page.locator('[data-vue-prism-ballroom-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Prism Ballroom stage diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'));
        throw error;
      }

      assert.equal(await page.locator('.challenge[data-step="prism-ballroom"] [data-vue-prism-ballroom]').count(), 1);
      assert.equal(await page.locator('#bf-svg .prism-cell').count(), 63, 'Vue renders the 9x7 floor');
      assert.equal(await page.locator('#bf-svg [data-emitter]').count(), 3, 'Vue renders all three colored emitters');
      assert.equal(await page.locator('#bf-svg [data-mirror]').count(), 7, 'Vue renders the seven mirrors');
      assert.equal(await page.locator('#bf-svg [data-dancer]').count(), 2, 'Vue renders both movable dancers');
      assert.equal(await page.locator('#bf-svg [data-ghost]').count(), 2, 'Vue shows both alternate dancer positions');
      assert.equal(await page.locator('#bf-svg [data-filter]').count(), 1, 'Vue renders the red filter');
      assert.equal(await page.locator('#bf-svg [data-crystal="0"]').count(), 1, 'Vue renders the combiner crystal');
      assert.equal(await page.locator('#bf-svg [data-mask]').count(), 3, 'Vue renders all three color targets');
      assert.equal(await page.locator('[data-vue-prism-ballroom] [style]').count(), 0, 'the island adds no inline style attributes');
      assert.equal(await page.locator('#bf-status').getAttribute('role'), 'status');

      const solution = await page.evaluate(async () => {
        const { solutionOf } = await import('/games/blood-mirror/play/puzzles/prism.js');
        return solutionOf('prism-ballroom');
      });
      for (let index = 0; index < solution.m.length; index += 1) {
        const mirror = page.locator(`[data-mirror="${index}"]`);
        if ((await mirror.getAttribute('aria-pressed')) !== String(solution.m[index] === '\\')) {
          await mirror.focus();
          await page.keyboard.press('Enter');
        }
      }
      for (let index = 0; index < solution.k.length; index += 1) {
        const dancer = page.locator(`[data-dancer="${index}"]`);
        if ((await dancer.getAttribute('aria-pressed')) !== String(Boolean(solution.k[index]))) {
          await dancer.focus();
          await page.keyboard.press('Enter');
        }
      }
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('prism.prism-ballroom'),
        null,
        { timeout: 10000 },
      );
      assert.ok(await page.evaluate(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('prism.prism-ballroom')),
        'legacy puzzle progression owns and persists completion');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue mirror/dancer actions and legacy completion do not raise page errors');
      console.log(`✓ Prism Ballroom Vue lazy mount, mirrors, dancers and legacy progress @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountPrismBallroom, solutionOf } = await import('/games/blood-mirror/play/puzzles/prism.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountPrismBallroom({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const counts = {
          mirrors: host.querySelectorAll('#bf-svg [data-mirror]').length,
          dancers: host.querySelectorAll('#bf-svg [data-dancer]').length,
        };
        const solution = solutionOf('prism-ballroom');
        for (const [index, orientation] of solution.m.entries()) {
          if (host.querySelector(`[data-mirror="${index}"]`).getAttribute('aria-pressed') !== String(orientation === '\\')) {
            host.querySelector(`[data-mirror="${index}"]`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }
        for (const [index, position] of solution.k.entries()) {
          if (host.querySelector(`[data-dancer="${index}"]`).getAttribute('aria-pressed') !== String(Boolean(position))) {
            host.querySelector(`[data-dancer="${index}"]`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }
        await new Promise(resolve => setTimeout(resolve, 80));
        host.remove();
        return { ...counts, completed };
      });
      assert.equal(fallback.mirrors, 7, 'the legacy renderer still supplies all mirrors');
      assert.equal(fallback.dancers, 2, 'the legacy renderer still supplies both dancers');
      assert.equal(fallback.completed, 1, 'the legacy renderer still owns completion');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
