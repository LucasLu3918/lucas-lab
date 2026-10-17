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
  puzzles: ['belfry.belfry-gears', 'belfry.belfry-pendulum', 'belfry.belfry-wheel'],
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
      await page.locator('[data-stage-pick="prism-blend"]').click();
      const island = page.locator('[data-vue-prism-blend-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Prism Blend stage diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'));
        throw error;
      }

      assert.equal(await page.locator('.challenge[data-step="prism-blend"] [data-vue-prism-blend]').count(), 1);
      assert.equal(await page.locator('#bf-svg .prism-cell').count(), 35, 'Vue renders the 7x5 floor');
      assert.equal(await page.locator('#bf-svg [data-emitter]').count(), 2, 'Vue renders the red and green emitters');
      assert.equal(await page.locator('#bf-svg [data-mirror]').count(), 4, 'Vue renders the four mirrors');
      assert.equal(await page.locator('#bf-svg [data-crystal="0"]').count(), 1, 'Vue renders the combiner crystal');
      assert.equal(await page.locator('#bf-svg [data-mask="0"]').count(), 1, 'Vue renders the yellow target');
      assert.equal(await page.locator('[data-vue-prism-blend] [style]').count(), 0, 'the island adds no inline style attributes');
      assert.equal(await page.locator('#bf-status').getAttribute('role'), 'status');

      const solution = await page.evaluate(async () => {
        const { solutionOf } = await import('/games/blood-mirror/play/puzzles/prism.js');
        return solutionOf('prism-blend').m;
      });
      for (let index = 0; index < solution.length; index += 1) {
        const mirror = page.locator(`[data-mirror="${index}"]`);
        if ((await mirror.getAttribute('aria-pressed')) !== String(solution[index] === '\\')) {
          await mirror.focus();
          await page.keyboard.press('Enter');
        }
      }
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('prism.prism-blend'),
        null,
        { timeout: 8000 },
      );
      assert.ok(await page.evaluate(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('prism.prism-blend')),
        'legacy puzzle progression owns and persists completion');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue mirror actions and legacy completion do not raise page errors');
      console.log(`✓ Prism Blend Vue lazy mount, crystal beam merge, mirror solve and legacy progress @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountPrismBlend, solutionOf } = await import('/games/blood-mirror/play/puzzles/prism.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountPrismBlend({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const count = host.querySelectorAll('#bf-svg [data-mirror]').length;
        for (const [index, orientation] of solutionOf('prism-blend').m.entries()) {
          if (host.querySelector(`[data-mirror="${index}"]`).getAttribute('aria-pressed') !== String(orientation === '\\')) {
            host.querySelector(`[data-mirror="${index}"]`).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }
        await new Promise(resolve => setTimeout(resolve, 80));
        host.remove();
        return { count, completed };
      });
      assert.equal(fallback.count, 4, 'the legacy renderer still supplies all mirrors');
      assert.equal(fallback.completed, 1, 'the legacy renderer still owns completion');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
