import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const manifestPath = path.join(dist, '_vue', 'manifest.json');

test('SSG copies Vue entry bundles and loads only the matching route islands', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const inventoryManifest = JSON.parse(fs.readFileSync(path.join(root, '.vue-inventory-build', 'manifest.json'), 'utf8'));
  const entries = ['src/vue/site/main.ts', 'src/vue/site/lazy.ts', 'src/vue/site/reader-main.ts', 'src/vue/site/gallery-main.ts', 'src/vue/site/music-main.ts', 'src/vue/game/main.ts'];

  for (const entry of entries) {
    assert.equal(manifest[entry]?.isEntry, true, `missing Vite entry: ${entry}`);
  }

  for (const value of Object.values(manifest)) {
    for (const file of [value.file, ...(value.css || []), ...(value.assets || [])]) {
      assert.ok(file, 'manifest entry has an output file');
      const output = path.join(dist, '_vue', file);
      assert.ok(fs.existsSync(output), `missing SSG-copied Vue asset: ${file}`);
      assert.ok(fs.statSync(output).size > 0, `empty SSG-copied Vue asset: ${file}`);
    }
  }

  const inventoryEntry = inventoryManifest['src/vue/game/inventory-main.ts'];
  assert.equal(inventoryEntry?.isEntry, true, 'standalone Vue inventory entry exists');
  assert.deepEqual(inventoryEntry.imports || [], [], 'the game route loads one bundled Vue JavaScript asset');
  const gameEntryPath = path.join(dist, '_vue', inventoryEntry.file);
  assert.ok(fs.existsSync(gameEntryPath), 'SSG copies the standalone inventory entry');
  const gameEntry = fs.readFileSync(gameEntryPath, 'utf8');
  assert.match(gameEntry, /\bmountJournalIsland\b/, 'the lazy game module preserves its Journal mount export');
  assert.match(gameEntry, /\bmountHintIsland\b/, 'the lazy game module exposes the Hints island mount');
  assert.match(gameEntry, /\bmountReflectionIsland\b/, 'the lazy game module exposes the Reflection island mount');
  assert.match(gameEntry, /\bmountMazePuzzleIsland\b/, 'the lazy game module exposes the Maze puzzle island mount');
  assert.match(gameEntry, /\bmountPipesPuzzleIsland\b/, 'the lazy game module exposes the Pipes puzzle island mount');
  assert.match(gameEntry, /\bmountLedgerPuzzleIsland\b/, 'the lazy game module exposes the Ledger puzzle island mount');
  assert.doesNotMatch(gameEntry, /process\.env\.NODE_ENV/, 'the browser bundle has no Node process dependency');

  const htmlFiles = [];
  const visit = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(file);
    }
  };
  visit(dist);
  assert.ok(htmlFiles.length > 0, 'SSG emitted HTML pages');
  const searchHtml = fs.readFileSync(path.join(dist, 'search', 'index.html'), 'utf8');
  const galleryHtml = fs.readFileSync(path.join(dist, 'gallery', 'index.html'), 'utf8');
  const gameHtml = fs.readFileSync(path.join(dist, 'games', 'blood-mirror', 'play', 'index.html'), 'utf8');
  assert.match(gameHtml, /data-vue-game-inventory/, 'play route contains its inventory island host');
  assert.ok(gameHtml.includes(`data-vue-game-inventory-entry="/_vue/${inventoryEntry.file}"`), 'play route exposes its manifest-bound Vue inventory bundle for lazy loading');
  assert.doesNotMatch(gameHtml, /<script type="module" src="\/_vue\//, 'the playable game loads Vue only when entering a scene');
  assert.match(galleryHtml, /id="gallery-dialog" data-vue-gallery-entry="\/_vue\/assets\/gallery-[^"]+\.js"/, 'Gallery page carries only its route-local lazy entry URL');
  assert.equal((searchHtml.match(/<script type="module" src="\/_vue\/[^\"]+"><\/script>/g) || []).length, 1, 'search page loads exactly one Vue module');
  assert.match(searchHtml, /data-vue-site-island="search"/, 'search page contains the site island host');
  assert.match(searchHtml, /data-vue-site-island="search"[\s\S]*class="search-group"/, 'search page keeps its static catalog and controls before Vue activation');
  assert.match(searchHtml, /<meta name="robots" content="noindex,follow">/, 'search stays excluded from indexing');
  const musicHtml = fs.readFileSync(path.join(dist, 'music', 'index.html'), 'utf8');
  const musicPages = htmlFiles.filter(file => fs.readFileSync(file, 'utf8').includes('data-music-player'));
  assert.equal((musicHtml.match(/<script type="module" src="\/_vue\/[^"]+"><\/script>/g) || []).length, 1, 'Music page loads exactly one Vue module');
  assert.match(musicHtml, /data-vue-music-controller/, 'Music page contains its controller island host');
  assert.match(musicHtml, /data-track="0"/, 'Music playlist remains server-rendered');
  assert.doesNotMatch(musicHtml, /<script src="[^"]*assets\/music\.js"/, 'Music page loads the Vue adapter entry instead of the legacy controller');
  const readerPages = htmlFiles.filter(file => fs.readFileSync(file, 'utf8').includes('data-vue-reader-preferences'));
  const readerFeaturePages = htmlFiles.filter(file => /data-vue-(?:reader-entry|story-progress|offline-controls)/.test(fs.readFileSync(file, 'utf8')));
  assert.ok(readerPages.length > 0, 'SSG chapter pages contain the reader preferences island');
  for (const file of readerPages) {
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/<script type="module" src="\/_vue\/[^\"]+"><\/script>/g) || []).length, 0, 'chapter page defers the reader bundle to the existing app script');
    assert.match(html, /data-vue-reader-preferences data-vue-reader-entry="\/_vue\/assets\/reader-[^"]+\.js"/, 'chapter page provides the lazy reader module path');
    assert.match(html, /data-vue-reading-progress data-vue-reader-entry="\/_vue\/assets\/reader-[^"]+\.js"/, 'chapter page provides its progress island entry');
    assert.match(html, /<article class="readerpage[^\"]*"[^>]*data-reader/, 'chapter body remains generated static HTML');
    assert.match(html, /data-chapter-select/, 'static chapter navigation remains available');
    assert.match(html, /data-reading-progress/, 'static reading progress remains available');
  }
  for (const file of htmlFiles.filter(file => fs.readFileSync(file, 'utf8').includes('data-vue-story-progress'))) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /data-vue-story-progress[^>]+data-vue-reader-entry="\/_vue\/assets\/reader-[^"]+\.js"/, 'story detail exposes the Reader island entry');
    assert.match(html, /data-vue-offline-controls/, 'story detail exposes the offline controls island');
    assert.match(html, /class="chapterlist"[^>]*data-story-readmarks/, 'chapter list keeps its static read-mark hook');
  }
  for (const file of htmlFiles) {
    if (file === path.join(dist, 'search', 'index.html') || file === path.join(dist, 'gallery', 'index.html') || file === path.join(dist, 'games', 'blood-mirror', 'play', 'index.html') || musicPages.includes(file) || readerPages.includes(file) || readerFeaturePages.includes(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /_vue\/(?:manifest\.json|assets\/)/, `Vue bundles are not loaded by ${path.relative(dist, file)}`);
  }

  const serviceWorker = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  assert.match(serviceWorker, /_vue\/assets\/reader-[^" ]+\.js/, 'Reader entry is included in the offline shell precache');
  assert.match(serviceWorker, /url\.pathname\.startsWith\(BASE\+'_vue\/'\)/, 'Reader chunks use the immutable cache-first route');

  const headers = fs.readFileSync(path.join(dist, '_headers'), 'utf8');
  assert.match(headers, /script-src 'self'/, 'CSP keeps scripts same-origin');
  assert.doesNotMatch(headers, /unsafe-inline/, 'CSP does not permit inline scripts or styles');
  assert.match(headers, /\/_vue\/assets\/\*/, 'hashed Vue assets have a dedicated cache rule');
  assert.match(headers, /\/_vue\/manifest\.json/, 'Vue manifest is revalidated separately');
});
