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
      await page.locator('[data-stage-pick="prism-rays"]').click();
      const island = page.locator('[data-vue-prism-rays-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Prism Rays stage diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'));
        throw error;
      }

      assert.equal(await page.locator('.challenge[data-step="prism-rays"] [data-vue-prism-rays]').count(), 1);
      assert.equal(await page.locator('#bf-svg .prism-cell').count(), 35, 'Vue renders the 7x5 floor');
      assert.equal(await page.locator('#bf-svg [data-mirror]').count(), 3, 'Vue renders the three mirrors');
      assert.equal(await page.locator('#bf-svg .prism-tint').count(), 1, 'Vue renders the red filter');
      assert.equal(await page.locator('#bf-svg [data-mask="0"]').count(), 1, 'Vue renders the target mask');
      assert.equal(await page.locator('[data-vue-prism-rays] [style]').count(), 0, 'the island adds no inline style attributes');
      assert.equal(await page.locator('#bf-status').getAttribute('role'), 'status');

      await page.locator('[data-mirror="0"]').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('[data-mirror="0"]').getAttribute('aria-pressed'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-mirror')), '0', 'keyboard flipping preserves mirror focus');
      const secondMirror = await page.locator('[data-mirror="1"]').boundingBox();
      assert.ok(secondMirror, 'the second mirror has a visible pointer target');
      await page.mouse.click(secondMirror.x + secondMirror.width / 2, secondMirror.y + secondMirror.height / 2);
      assert.equal(await page.locator('[data-mirror="1"]').getAttribute('aria-pressed'), 'false', 'the pointer click flips the second mirror');
      assert.deepEqual(errors, [], 'mirror pointer handling does not raise page errors');
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('prism.prism-rays'),
        null,
        { timeout: 8000 },
      );
      assert.ok(await page.evaluate(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('prism.prism-rays')),
        'legacy puzzle progression owns and persists completion');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`✓ Prism Rays Vue lazy mount, accessible mirror flips, solve and legacy progress @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountPrismRays } = await import('/games/blood-mirror/play/puzzles/prism.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountPrismRays({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const count = host.querySelectorAll('#bf-svg [data-mirror]').length;
        host.querySelector('[data-mirror="0"]').click();
        host.querySelector('[data-mirror="1"]').click();
        await new Promise(resolve => setTimeout(resolve, 80));
        host.remove();
        return { count, completed };
      });
      assert.equal(fallback.count, 3, 'the legacy renderer still supplies all mirrors');
      assert.equal(fallback.completed, 1, 'the legacy renderer still owns completion');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
