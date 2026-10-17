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
  puzzles: [],
  inventory: [],
  seen: [],
  hints: {},
  clues: [],
  glowRooms: [],
  misses: {},
  memories: [],
  shards: [],
  achievements: [],
  endings: ['dawn'],
  ending: null,
  answers: null,
  elapsed: 1200,
  muted: true,
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
      await page.locator('[data-abyss="e1"]').click();
      await page.locator('#abyss-enter').click();
      await page.locator('[data-stage-pick="belfry-pendulum"]').click();
      const island = page.locator('[data-vue-pendulum-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('pendulum stage diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'));
        throw error;
      }

      assert.equal(await page.locator('.challenge[data-step="belfry-pendulum"] [data-vue-pendulum-puzzle]').count(), 1);
      assert.equal(await page.locator('#bf-svg .pend-rod, #bf-svg .pend-rod-hi').count(), 4, 'legacy still owns both animated rods and their highlights');
      assert.equal(await page.locator('#bf-weights button').count(), 3, 'the Vue island renders the three weights');
      assert.equal(await page.locator('#bf-status').getAttribute('role'), 'status');
      assert.equal(await page.locator('#bf-run').count(), 0, 'the reduced-motion run control waits until the legacy rule is solved');

      await page.locator('[data-weight="a"]').click();
      await page.locator('[data-weight="b"]').click();
      assert.equal(await page.locator('[data-weight="a"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('[data-weight="b"]').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('[data-weight="c"]').getAttribute('aria-pressed'), 'false');
      assert.match(await page.locator('#bf-status').innerText(), /剛好是舊擺兩趟/);
      const runButton = page.locator('#bf-run');
      try { await runButton.waitFor({ state: 'visible', timeout: 5000 }); }
      catch (error) {
        console.error('pendulum run-control diagnostic:', JSON.stringify({
          status: await page.locator('#bf-status').innerText().catch(() => '(missing)'),
          weights: await page.locator('#bf-weights button').evaluateAll(buttons => buttons.map(button => ({
            id: button.dataset.weight,
            pressed: button.getAttribute('aria-pressed'),
          }))).catch(() => []),
          island: await page.locator('[data-vue-pendulum-puzzle]').innerHTML().catch(() => '(missing)'),
        }));
        throw error;
      }
      await runButton.click();
      await page.waitForFunction(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('belfry.belfry-pendulum'));
      assert.ok(await page.evaluate(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('belfry.belfry-pendulum')),
        'legacy puzzle progression owns and persists completion');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`✓ pendulum Vue selection, reduced-motion solve and legacy progress @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountPendulum } = await import('/games/blood-mirror/play/puzzles/pendulum.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountPendulum({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const count = host.querySelectorAll('#bf-weights button').length;
        [...host.querySelectorAll('#bf-weights button')].find(button => button.getAttribute('aria-label').startsWith('輕配重')).click();
        [...host.querySelectorAll('#bf-weights button')].find(button => button.getAttribute('aria-label').startsWith('重配重')).click();
        const solvedStatus = host.querySelector('#bf-status').textContent;
        host.querySelector('#bf-run').click();
        await new Promise(resolve => setTimeout(resolve, 10));
        host.remove();
        return { count, solvedStatus, completed };
      });
      assert.equal(fallback.count, 3, 'the legacy renderer still supplies all weight controls');
      assert.match(fallback.solvedStatus, /剛好是舊擺兩趟/);
      assert.equal(fallback.completed, 1, 'legacy renderer still owns the completion callback');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
