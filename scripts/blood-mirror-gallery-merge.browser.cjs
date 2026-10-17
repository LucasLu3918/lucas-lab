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
  puzzles: ['gallery.gallery-align'],
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
    for (const [width, order] of [[360, ['C', 'D', 'A', 'B']], [1280, ['B', 'A', 'D', 'C']]]) {
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
      await page.locator('[data-abyss="e4"]').click();
      await page.locator('#abyss-enter').click();
      const mergePick = page.locator('[data-stage-pick="gallery-merge"]');
      if (await mergePick.count()) await mergePick.click();
      const island = page.locator('[data-vue-gallery-merge-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Gallery Merge diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'), errors);
        throw error;
      }

      assert.equal(await page.locator('[data-gal-merge-panel]').count(), 4, 'Vue renders all four panels');
      await page.locator('.gal-merge-place').click();
      assert.ok((await page.locator('#gal-feedback').innerText()).includes('方向相反'), 'unflipped doors are rejected by legacy rules');
      await page.locator('[aria-label="翻面鏡廊"]').click();
      assert.equal(await page.locator('[aria-label="翻面鏡廊"]').getAttribute('aria-pressed'), 'true');
      await page.locator('.gal-merge-place').click();
      await page.locator('.gal-cards').waitFor();

      for (const panel of ['A', 'B', 'C', 'D']) await page.locator(`[aria-label="${panel === 'A' ? '鏡廊' : panel === 'B' ? '陽台' : panel === 'C' ? '黑松林' : '舞廳'}"]`).click();
      assert.ok((await page.locator('#gal-feedback').innerText()).includes('沒有紅線'), 'legacy rejects a disconnected order');
      for (const panel of order) {
        const name = { A: '鏡廊', B: '陽台', C: '黑松林', D: '舞廳' }[panel];
        await page.locator(`.gal-cards [aria-label^="${name}"]`).click();
      }
      // Completion closes the modal after its legacy timer; persisted progress is the stable completion signal.
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('gallery.gallery-merge'),
        null,
        { timeout: 5000 },
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue actions and legacy completion do not raise page errors');
      console.log(`✓ Gallery Merge Vue lazy mount, door matching, ordering and completion @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountGalleryMerge } = await import('/games/blood-mirror/play/puzzles/gallery.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountGalleryMerge({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const panels = host.querySelectorAll('.gal-panel').length;
        host.querySelector('[data-flip="A"]').click();
        host.querySelector('#gal-from').value = 'A.door';
        host.querySelector('#gal-to').value = 'D.door';
        host.querySelector('#gal-put').click();
        for (const panel of ['B', 'A', 'D', 'C']) host.querySelector(`[data-card="${panel}"]`).click();
        await new Promise(resolve => setTimeout(resolve, 80));
        const result = { panels, completed, status: host.querySelector('#bf-status').textContent };
        host.remove();
        return result;
      });
      assert.equal(fallback.panels, 4, 'legacy fallback still renders all four panels');
      assert.equal(fallback.completed, 1, 'legacy fallback still owns completion');
      assert.ok(fallback.status.includes('紅線連成一條直線'), 'legacy fallback announces successful order');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
