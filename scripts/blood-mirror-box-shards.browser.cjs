const { spawn } = require('node:child_process');
const { launchChromium, portInUse } = require('./browser-harness.cjs');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..');
const port = Number(process.env.BLOOD_MIRROR_BOX_SHARDS_PORT || 4173);
const origin = `http://127.0.0.1:${port}`;
const allShardIds = [
  'shard-library', 'shard-ballroom', 'shard-hunter', 'shard-mine',
  'shard-crypt', 'shard-queen', 'shard-mirror',
];
const shardNames = {
  'shard-library': '黑鐘書庫', 'shard-ballroom': '血色舞會', 'shard-hunter': '獵人的心臟',
  'shard-mine': '銀骨礦坑', 'shard-crypt': '玻璃棺室', 'shard-queen': '王后寢宮', 'shard-mirror': '鏡中之國',
};
const actNames = ['第一幕', '第二幕', '第三幕', '第四幕', '第五幕', '第六幕', '第七幕'];

function makeSave(shards) {
  return {
    version: 2, started: true, chapter: 'mirror',
    unlocked: ['library', 'ballroom', 'hunter', 'mine', 'crypt', 'queen', 'mirror'],
    solved: ['library', 'ballroom', 'hunter', 'mine', 'crypt', 'queen', 'mirror'],
    puzzles: ['gallery', 'gallery.gallery-align', 'gallery.gallery-merge'],
    inventory: [], seen: [], hints: {}, clues: [], glowRooms: [], misses: {}, memories: [], shards,
    achievements: [], endings: ['dawn'], ending: null, answers: null, elapsed: 1200, muted: true,
  };
}

async function enterShardsStage(page, shards) {
  await page.addInitScript(value => localStorage.setItem('blood-mirror-v2', JSON.stringify(value)), makeSave(shards));
  await page.goto(`${origin}/games/blood-mirror/play/`);
  await page.locator('#abyss-open').click();
  await page.locator('[data-abyss="e5"]').click();
  await page.locator('#abyss-enter').click();
  await page.locator('[data-stage-pick="box-shards"]').click();
  const island = page.locator('[data-vue-box-shards-ready="true"]');
  try { await island.waitFor({ timeout: 5000 }); }
  catch (error) {
    console.error('Box Shards diagnostic:', await page.locator('#modal-title').innerText().catch(() => '(no modal)'),
      await page.locator('#modal-body').innerText().catch(() => '(no modal body)'));
    throw error;
  }
}

async function assertCompletion(page) {
  await page.waitForFunction(
    () => (JSON.parse(localStorage.getItem('blood-mirror-v2') || '{}').puzzles || []).includes('box.box-shards'),
    null,
    { timeout: 5000 },
  );
}

(async () => {
  let browser;
  if (portInUse(port)) throw new Error(`Port ${port} is already served; choose another BLOOD_MIRROR_BOX_SHARDS_PORT.`);
  const server = spawn(process.execPath, [require('node:path').join(root, 'scripts', 'serve.cjs')], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  });
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

      if (width === 360) {
        await enterShardsStage(page, allShardIds);
        assert.equal(await page.locator('.box-slot').count(), 7, 'all seven act slots render');
        assert.equal(await page.locator('.box-shard').count(), 7, 'all collected shards render in the tray');
        await page.locator('[aria-label="碎片：黑鐘書庫"]').click();
        await page.locator('[aria-label="第二幕的位置"]').click();
        assert.ok((await page.locator('#box-feedback').innerText()).includes('放不進'), 'legacy rejects a shard in the wrong act slot');
        await page.locator('[aria-label="第一幕的位置"]').click();
        for (let index = 1; index < allShardIds.length; index += 1) {
          const id = allShardIds[index];
          await page.locator(`[aria-label="碎片：${shardNames[id]}"]`).click();
          await page.locator(`[aria-label="${actNames[index]}的位置"]`).click();
        }
        await assertCompletion(page);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow with all shards');
        assert.deepEqual(errors, [], 'full-shard Vue actions and legacy completion do not raise page errors');
        console.log(`✓ Box Shards Vue lazy mount, wrong slot, seven placements and saved completion @ ${width}`);
      } else {
        const partial = ['shard-ballroom', 'shard-crypt'];
        await enterShardsStage(page, partial);
        assert.equal(await page.locator('.box-shard').count(), 2, 'only collected shards appear in the tray');
        assert.equal(await page.locator('.box-slot.gap').count(), 5, 'missing shards leave five labelled gaps');
        await page.locator('[aria-label="碎片：血色舞會"]').click();
        await page.locator('[aria-label="第一幕的位置（沒有收集到，來自黑鐘書庫）"]').click();
        assert.ok((await page.locator('#box-feedback').innerText()).includes('放不進'), 'partial board rejects the wrong act slot');
        await page.locator('[aria-label="第二幕的位置"]').click();
        for (const [index, id] of [[4, 'shard-crypt']]) {
          await page.locator(`[aria-label="碎片：${shardNames[id]}"]`).click();
          await page.locator(`[aria-label="${actNames[index]}的位置"]`).click();
        }
        await assertCompletion(page);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), 'no horizontal overflow with partial shards');

        const emptyPage = await context.newPage();
        const emptyErrors = [];
        emptyPage.on('pageerror', error => emptyErrors.push(error.message));
        await enterShardsStage(emptyPage, []);
        assert.equal(await emptyPage.locator('.box-slot.gap').count(), 7, 'all seven slots remain visibly empty');
        await emptyPage.getByRole('button', { name: '這一面先空著' }).click();
        await assertCompletion(emptyPage);
        assert.deepEqual(emptyErrors, [], 'empty-face completion does not raise page errors');
        await emptyPage.close();
        assert.deepEqual(errors, [], 'partial-shard Vue actions and legacy completion do not raise page errors');
        console.log(`✓ Box Shards partial and empty states, missing slots and saved completion @ ${width}`);
      }

      const fallbackPage = await context.newPage();
      await fallbackPage.goto(`${origin}/games/blood-mirror/play/`);
      const fallback = await fallbackPage.evaluate(async ids => {
        document.body.classList.add('reduce-motion');
        const { mountBoxShards } = await import('/games/blood-mirror/play/puzzles/box.js');
        const host = document.createElement('section');
        document.body.append(host);
        let completed = 0;
        const ctx = { render: html => { host.innerHTML = html; }, has: id => ids.includes(id), playCue: () => {}, done: () => { completed += 1; } };
        mountBoxShards(ctx);
        const firstTray = host.querySelectorAll('.box-shard').length;
        if (ids.length) {
          const shard = host.querySelector('[data-s]');
          shard.click();
          host.querySelector(`[data-p="${shard.dataset.s}"]`).click();
        }
        mountBoxShards(ctx);
        const replay = { tray: host.querySelectorAll('.box-shard').length, placed: host.querySelectorAll('.box-slot.on').length };
        if (!ids.length) host.querySelector('[data-k="empty"]').click();
        else {
          for (const id of ids) {
            host.querySelector(`[data-s="${id}"]`).click();
            host.querySelector(`[data-p="${id}"]`).click();
          }
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        const result = { firstTray, replay, completed, status: host.querySelector('#bf-status').textContent };
        host.remove();
        return result;
      }, ['shard-ballroom', 'shard-crypt']);
      assert.deepEqual(fallback.replay, { tray: 2, placed: 0 }, 'reopening resets placements and keeps collected shards');
      assert.equal(fallback.completed, 1, 'legacy fallback still owns completion');
      assert.ok(fallback.status.includes('碎片都嵌進去了'), 'legacy fallback announces success');
      await fallbackPage.close();
      await context.close();
    }

    const emptyFallbackPage = await browser.newPage();
    await emptyFallbackPage.goto(`${origin}/games/blood-mirror/play/`);
    const emptyFallback = await emptyFallbackPage.evaluate(async () => {
      document.body.classList.add('reduce-motion');
      const { mountBoxShards } = await import('/games/blood-mirror/play/puzzles/box.js');
      const host = document.createElement('section');
      document.body.append(host);
      let completed = 0;
      mountBoxShards({ render: html => { host.innerHTML = html; }, has: () => false, playCue: () => {}, done: () => { completed += 1; } });
      const slots = host.querySelectorAll('.box-slot').length;
      host.querySelector('[data-k="empty"]').click();
      await new Promise(resolve => setTimeout(resolve, 50));
      const result = { slots, completed, status: host.querySelector('#bf-status').textContent };
      host.remove();
      return result;
    });
    assert.deepEqual(emptyFallback, { slots: 7, completed: 1, status: '一片碎片也沒有。這一面空著，其餘的先鬆開了。' });
    await emptyFallbackPage.close();
  } finally {
    await browser?.close();
    server.kill();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
