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
      await page.locator('[data-abyss="e4"]').click();
      await page.locator('#abyss-enter').click();
      await page.locator('[data-stage-pick="gallery-align"]').click();
      const island = page.locator('[data-vue-gallery-align-ready="true"]');
      try { await island.waitFor({ timeout: 5000 }); }
      catch (error) {
        console.error('Gallery Align diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
          await page.locator('#modal-body').innerText().catch(() => '(no modal body)'), errors);
        throw error;
      }

      assert.equal(await page.locator('[data-gal-panel]').count(), 4, 'Vue renders all four picture panels');
      assert.equal(await page.locator('[data-gal-panel="A"]').getAttribute('role'), 'button');
      const originalZoom = await page.locator('[aria-label="放大黑松林"]').getAttribute('aria-pressed');
      await page.locator('[aria-label="放大黑松林"]').click();
      assert.equal(await page.locator('[aria-label="放大黑松林"]').getAttribute('aria-pressed'), 'true');
      assert.equal(originalZoom, 'false');
      await page.locator('[data-gal-panel="A"]').focus();
      await page.keyboard.press('f');
      assert.ok((await page.locator('[data-gal-panel="A"]').getAttribute('aria-label')).includes('已翻面'), 'keyboard F flips the focused panel');
      await page.locator('[aria-label="放大黑松林"]').click();

      const panel = page.locator('[data-gal-panel="A"]');
      const box = await panel.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2 + 18, { steps: 3 });
      await page.mouse.up();
      assert.ok((await page.locator('#gal-feedback').innerText()).length > 0, 'a pointer drag receives placement feedback');

      await page.locator('.gal-place summary').click();
      await page.locator('.gal-place select').nth(0).selectOption('B.moon');
      await page.locator('.gal-place select').nth(1).selectOption('A.moonL');
      await page.locator('.gal-place button').click();
      assert.equal(await page.locator('.gal-guide line[stroke="#c8172f"]').count(), 1, 'placing the matching moons creates the first thread');
      await page.locator('[aria-label="放大黑松林"]').click();
      await page.locator('.gal-place select').nth(0).selectOption('C.lantern');
      await page.locator('.gal-place select').nth(1).selectOption('D.chandelier');
      await page.locator('.gal-place button').click();
      await page.waitForFunction(
        () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('gallery.gallery-align'),
        null,
        { timeout: 5000 },
      );
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow');
      assert.deepEqual(errors, [], 'Vue actions and legacy completion do not raise page errors');
      console.log(`✓ Gallery Align Vue lazy mount, pointer, keyboard, list placement and completion @ ${width}`);

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async () => {
        document.body.classList.add('reduce-motion');
        const { mountGalleryAlign } = await import('/games/blood-mirror/play/puzzles/gallery.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        mountGalleryAlign({ render: html => { host.innerHTML = html; }, playCue: () => {}, done: () => { completed += 1; } });
        const panels = host.querySelectorAll('.gal-panel').length;
        host.querySelector('#gal-from').value = 'B.moon';
        host.querySelector('#gal-to').value = 'A.moonL';
        host.querySelector('#gal-put').click();
        host.querySelector('[data-zoom="C"]').click();
        host.querySelector('#gal-from').value = 'C.lantern';
        host.querySelector('#gal-to').value = 'D.chandelier';
        host.querySelector('#gal-put').click();
        await new Promise(resolve => setTimeout(resolve, 80));
        const result = { panels, completed, status: host.querySelector('#bf-status').textContent };
        host.remove();
        return result;
      });
      assert.equal(fallback.panels, 4, 'legacy fallback still renders the board');
      assert.equal(fallback.completed, 1, 'legacy fallback still owns completion');
      assert.ok(fallback.status.includes('兩條紅線'), 'legacy fallback announces completion');
      await fallbackPage.close();
      await context.close();
    }
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
