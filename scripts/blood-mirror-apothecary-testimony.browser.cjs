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
      await page.locator('[data-stage-pick="apothecary-testimony"]').click();
      const island = page.locator('[data-vue-apothecary-testimony-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Apothecary Testimony diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'), errors);
        throw error;
      }

      assert.equal(await page.locator('.challenge[data-step="apothecary-testimony"] [data-vue-apothecary-testimony]').count(), 1);
      assert.equal(await page.locator('[data-vue-apothecary-testimony] [data-card]').count(), 7, 'Vue renders seven testimony cards');
      assert.equal(await page.locator('[data-vue-apothecary-testimony] #bf-status').getAttribute('role'), 'status');
      await page.locator('#apo-mirror').click();
      assert.equal(await page.locator('#apo-mirror').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#apo-cards').evaluate(el => el.classList.contains('apo-mirrored')), false);
      await page.locator('[data-strike="3"]').click();
      assert.equal(await page.locator('[data-strike="3"]').getAttribute('aria-pressed'), 'true');
      await page.locator('[data-accuse="0"]').click();
      assert.equal(await page.locator('#bf-status').getAttribute('data-tone'), 'bad', 'a wrong accusation shows its contradiction');
      assert.match(await page.locator('#bf-status').innerText(), /不是白芷/);
      await page.locator('[data-accuse="6"]').click();
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('apothecary.apothecary-testimony'),
        null,
        { timeout: 5000 },
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue actions and legacy completion do not raise page errors');
      console.log(`✓ Apothecary Testimony Vue lazy mount, mirror, strikes, contradiction and completion @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountApothecaryTestimony } = await import('/games/blood-mirror/play/puzzles/apothecary.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountApothecaryTestimony({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const cards = host.querySelectorAll('[data-card]').length;
        host.querySelector('[data-strike="2"]').click();
        host.querySelector('[data-accuse="0"]').click();
        const wrongTone = host.querySelector('#bf-status').dataset.tone;
        host.querySelector('[data-accuse="6"]').click();
        await new Promise(resolve => setTimeout(resolve, 80));
        host.remove();
        return { cards, wrongTone, completed };
      });
      assert.equal(fallback.cards, 7, 'legacy fallback still renders all seven cards');
      assert.equal(fallback.wrongTone, 'bad', 'legacy fallback still reports contradictions');
      assert.equal(fallback.completed, 1, 'legacy fallback still owns completion');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
