const { startPreviewServer, launchChromium } = require('./browser-harness.cjs');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..');
const origin = 'http://127.0.0.1:4173';
const solution = [0, 1, 0, 1, 2, 1, 0, 1];
const save = {
  version: 2,
  started: true,
  chapter: 'mirror',
  unlocked: ['library', 'ballroom', 'hunter', 'mine', 'crypt', 'queen', 'mirror'],
  solved: ['library', 'ballroom', 'hunter', 'mine', 'crypt', 'queen', 'mirror'],
  puzzles: [],
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
      await page.locator('[data-stage-pick="apothecary-vessels"]').click();
      const island = page.locator('[data-vue-apothecary-vessels-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Apothecary Vessels diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'), errors);
        throw error;
      }

      assert.equal(await page.locator('[data-vue-apothecary-vessels] [data-vessel]').count(), 3, 'Vue renders all three vessels');
      assert.equal(await page.locator('[data-vue-apothecary-vessels] svg').getAttribute('role'), 'img', 'the board has an accessible description');
      assert.equal(await page.locator('#apo-tube-0').getAttribute('disabled'), null, 'A to C is initially available');
      assert.ok(await page.locator('#apo-tube-1').isDisabled(), 'C to B is unavailable while C is empty');

      await page.locator('#apo-tube-0').click();
      assert.deepEqual(await page.locator('[data-vessel] text:last-child').allTextContents(), ['5', '0', '3']);
      assert.equal(await page.locator('#apo-moves').innerText(), '已倒 1 次');
      await page.locator('#apo-undo').click();
      assert.deepEqual(await page.locator('[data-vessel] text:last-child').allTextContents(), ['8', '0', '0']);
      assert.equal(await page.locator('#apo-moves').innerText(), '已倒 0 次', 'undo restores the board and move count');

      await page.locator('#apo-tube-0').click();
      await page.locator('#apo-restart').click();
      assert.deepEqual(await page.locator('[data-vessel] text:last-child').allTextContents(), ['8', '0', '0']);
      assert.equal(await page.locator('#apo-moves').innerText(), '已倒 0 次', 'restart restores the initial board');

      for (const tube of solution) await page.locator(`#apo-tube-${tube}`).click();
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('apothecary.apothecary-vessels'),
        null,
        { timeout: 5000 },
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue actions and legacy completion do not raise page errors');
      console.log(`✓ Apothecary Vessels Vue lazy mount, pour, undo, restart and completion @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async path => {
        document.body.classList.add('reduce-motion');
        const { mountApothecaryVessels } = await import(path);
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountApothecaryVessels({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const readAmounts = () => [...host.querySelectorAll('#apo-svg text')].filter((_, index) => index === 1 || index === 3 || index === 5).map(node => node.textContent);
        const pour = tube => host.querySelector(`[data-tube="${tube}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true }));
        pour(0);
        const afterPour = readAmounts();
        host.querySelector('#apo-undo').click();
        const afterUndo = readAmounts();
        pour(0);
        host.querySelector('#apo-restart').click();
        const afterRestart = readAmounts();
        for (const tube of [0, 1, 0, 1, 2, 1, 0, 1]) pour(tube);
        await new Promise(resolve => setTimeout(resolve, 80));
        const result = { afterPour, afterUndo, afterRestart, completed, tone: host.querySelector('#bf-status').dataset.tone };
        host.remove();
        return result;
      }, '/games/blood-mirror/play/puzzles/apothecary.js');
      assert.deepEqual(fallback.afterPour, ['5', '0', '3'], 'legacy fallback applies the same directed pour');
      assert.deepEqual(fallback.afterUndo, ['8', '0', '0'], 'legacy fallback undo restores the previous amounts');
      assert.deepEqual(fallback.afterRestart, ['8', '0', '0'], 'legacy fallback restart restores the initial amounts');
      assert.equal(fallback.completed, 1, 'legacy fallback still owns completion');
      assert.equal(fallback.tone, 'ok', 'legacy fallback still announces success');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
