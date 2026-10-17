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
  puzzles: ['apothecary.apothecary-testimony', 'apothecary.apothecary-vessels'],
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
      await page.locator('[data-abyss="e3"]').click();
      await page.locator('#abyss-enter').click();
      const island = page.locator('[data-vue-apothecary-mixing-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Apothecary Mixing diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'), errors);
        throw error;
      }

      const reference = page.locator('#apo-ref');
      const mix = page.locator('#apo-mix');
      const mirror = page.locator('#apo-mirror');
      assert.equal(await reference.getAttribute('role'), 'img', 'recipe swatch has an accessible name');
      assert.equal(await reference.getAttribute('aria-label'), '配方色：偏紫的藍灰，偏暗');
      assert.ok((await reference.getAttribute('class')).includes('glass'), 'recipe starts distorted behind green glass');
      assert.ok(await page.locator('[aria-label="紅減一滴"]').isDisabled(), 'pigment controls cannot go below zero');
      assert.ok(!(await page.locator('[aria-label="紅加一滴"]').isDisabled()));

      await mirror.click();
      assert.equal(await mirror.getAttribute('aria-pressed'), 'true');
      assert.ok(!(await reference.getAttribute('class')).includes('glass'), 'the hand mirror reveals the undistorted recipe');
      await mirror.click();
      assert.equal(await mirror.getAttribute('aria-pressed'), 'false');

      for (let drop = 0; drop < 4; drop += 1) await page.locator('[aria-label="紅加一滴"]').click();
      assert.equal(await page.locator('.apo-count').nth(0).innerText(), '4 滴');
      assert.ok(await page.locator('[aria-label="紅加一滴"]').isDisabled(), 'pigment controls cannot exceed four');
      for (let drop = 0; drop < 4; drop += 1) await page.locator('[aria-label="紅減一滴"]').click();

      await page.locator('[aria-label="紅加一滴"]').click();
      await page.locator('[aria-label="黃加一滴"]').click();
      for (let drop = 0; drop < 4; drop += 1) await page.locator('[aria-label="藍加一滴"]').click();
      assert.ok((await mix.getAttribute('class')).includes('lit'), 'the matching recipe lights the bottle');
      assert.equal(await page.locator('#bf-status').getAttribute('data-tone'), 'ok');
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('apothecary.apothecary-mixing'),
        null,
        { timeout: 5000 },
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue actions and legacy completion do not raise page errors');
      console.log(`✓ Apothecary Mixing Vue lazy mount, mirror, bounded drops and completion @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountApothecaryMixing } = await import('/games/blood-mirror/play/puzzles/apothecary.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountApothecaryMixing({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        host.querySelector('#apo-mirror').click();
        for (const name of ['紅', '黃']) host.querySelector(`[aria-label="${name}加一滴"]`).click();
        for (let drop = 0; drop < 4; drop += 1) host.querySelector('[aria-label="藍加一滴"]').click();
        await new Promise(resolve => setTimeout(resolve, 80));
        const result = {
          completed,
          mirror: host.querySelector('#apo-ref').classList.contains('glass'),
          tone: host.querySelector('#bf-status').dataset.tone,
          count: [...host.querySelectorAll('.apo-count')].map(node => node.textContent),
        };
        host.remove();
        return result;
      });
      assert.equal(fallback.completed, 1, 'legacy fallback still owns completion');
      assert.equal(fallback.mirror, false, 'legacy fallback still toggles the hand mirror');
      assert.equal(fallback.tone, 'ok', 'legacy fallback still announces success');
      assert.deepEqual(fallback.count, ['1 滴', '1 滴', '4 滴']);
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
