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
      await page.locator('[data-stage-pick="belfry-gears"]').click();
      const island = page.locator('[data-vue-gears13-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('gears13 stage diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'));
        throw error;
      }

      assert.equal(await page.locator('.challenge[data-step="belfry-gears"] [data-vue-gears13]').count(), 1);
      assert.equal(await page.locator('#bf-svg .belfry-hit').count(), 2, 'warm-up socket controls are rendered');
      assert.equal(await page.locator('#bf-tray .belfry-gear-button').count(), 3, 'the warm-up tray is rendered');
      assert.match(await page.locator('#bf-goal').innerText(), /惰輪/);
      assert.match(await page.locator('#bf-status').innerText(), /輸出軸還沒有被帶動/);

      const warmGear = teeth => page.locator('#bf-tray .belfry-gear-button').filter({ hasText: `${teeth} 齒` });
      await warmGear(8).click();
      await page.locator('.belfry-hit[aria-label^="軸座 1"]').click();
      await warmGear(12).click();
      await page.locator('.belfry-hit[aria-label^="輸出軸"]').click();
      await page.locator('#bf-run').click();
      await page.waitForFunction(() => document.querySelector('#bf-goal')?.textContent.includes('13 圈'));
      assert.equal(await page.locator('#bf-tray .belfry-gear-button').count(), 8, 'warm-up transitions into the 13:1 board');
      assert.equal(await page.locator('#bf-svg .belfry-hit').count(), 4, 'main socket controls replace the warm-up controls');
      assert.equal(await page.locator('.belfry-layer').count(), 2, 'upper and lower gear layers appear');

      const mainGear = teeth => page.getByRole('button', { name: `${teeth} 齒齒輪`, exact: true });
      const socket = id => page.locator(`.belfry-hit[data-socket="${id}"]`);
      await mainGear(39).click();
      await socket('S1').click();
      await page.getByRole('button', { name: '上層（銅）' }).click();
      await mainGear(6).click();
      await socket('S1').click();
      await mainGear(24).click();
      await socket('S2').click();
      assert.equal(await page.locator('#bf-run').isVisible(), true, 'legacy evaluator exposes run only for a solved board');
      await page.locator('#bf-run').click();
      await page.waitForFunction(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('belfry.belfry-gears'));
      assert.ok(await page.evaluate(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('belfry.belfry-gears')),
        'the legacy puzzle stage owns and persists completion');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`✓ gears13 Vue warm-up, layer controls, 13:1 solve and progress @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        const { mountGears13 } = await import('/games/blood-mirror/play/puzzles/gears13.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountGears13({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const select = teeth => [...host.querySelectorAll('.belfry-gear-button')].find(button => button.textContent.includes(`${teeth} 齒`)).click();
        const place = id => host.querySelector(`.belfry-hit[data-socket="${id}"]`)
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
        select(8); place('S1'); select(12); place('S2'); host.querySelector('#bf-run').click();
        host.querySelector('[data-layer="0"]')?.click();
        select(39); place('S1'); host.querySelector('[data-layer="1"]').click();
        select(6); place('S1'); select(24); place('S2'); host.querySelector('#bf-run').click();
        const gearCount = host.querySelectorAll('.belfry-gear-button').length;
        host.remove();
        return { completed, gearCount };
      });
      assert.equal(fallback.gearCount, 8, 'legacy renderer remains available without the optional island callback');
      assert.equal(fallback.completed, 1, 'legacy renderer retains ownership of the completion callback');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
