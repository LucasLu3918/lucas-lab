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
  puzzles: ['belfry.belfry-gears', 'belfry.belfry-pendulum'],
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
      await page.locator('[data-abyss="e1"]').click();
      await page.locator('#abyss-enter').click();
      const island = page.locator('[data-vue-starwheel-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Starwheel stage diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'));
        throw error;
      }

      assert.equal(await page.locator('.challenge[data-step="belfry-wheel"] [data-vue-starwheel]').count(), 1);
      assert.equal(await page.locator('#bf-svg .wheel-notch').count(), 13, 'Vue renders all thirteen notches');
      assert.equal(await page.locator('#bf-svg .wheel-glyph').count(), 12, 'Vue renders twelve numeral labels');
      assert.equal(await page.locator('#bf-svg .wheel-ruby').count(), 1, 'Vue renders the ruby at the top notch');
      assert.equal(await page.locator('[data-vue-starwheel] [style]').count(), 0, 'the island does not add inline style attributes');
      assert.equal(await page.locator('#wheel-step').innerText(), '撥爪每聲跨 1 格');
      assert.equal(await page.locator('#bf-status').getAttribute('role'), 'status');

      await page.locator('#wheel-candle').click();
      assert.equal(await page.locator('#wheel-candle').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#wheel-engraving').isVisible(), true, 'the engraving appears in candle light');
      for (let step = 1; step < 3; step += 1) await page.locator('#wheel-more').click();
      await page.locator('#wheel-more').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#wheel-step').innerText(), '撥爪每聲跨 4 格', 'keyboard controls update the chosen step');
      await page.locator('#bf-run').click();
      await page.waitForFunction(() => /第 1 聲敲在/.test(document.querySelector('#bf-status')?.textContent || ''));
      assert.match(await page.locator('#bf-status').innerText(), /應該敲在「一」上/);
      assert.equal(await page.locator('#wheel-step').innerText(), '撥爪每聲跨 4 格', 'a wrong toll leaves the player setting intact');

      await page.locator('#wheel-more').click();
      assert.equal(await page.locator('#wheel-step').innerText(), '撥爪每聲跨 5 格');
      await page.locator('#bf-run').click();
      await page.waitForFunction(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('belfry.belfry-wheel'), { timeout: 8000 });
      assert.ok(await page.evaluate(() => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('belfry.belfry-wheel')),
        'legacy puzzle progression owns and persists completion');
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, []);
      console.log(`✓ Starwheel Vue candles, controls, wrong toll, solve and legacy progress @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountStarWheel } = await import('/games/blood-mirror/play/puzzles/starwheel.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountStarWheel({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const count = host.querySelectorAll('#bf-svg .wheel-notch').length;
        for (let step = 1; step < 5; step += 1) host.querySelector('#wheel-more').click();
        host.querySelector('#bf-run').click();
        await new Promise(resolve => setTimeout(resolve, 2800));
        host.remove();
        return { count, completed };
      });
      assert.equal(fallback.count, 13, 'the legacy renderer still supplies the complete wheel');
      assert.equal(fallback.completed, 1, 'the legacy renderer still owns completion');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
