import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const manifestPath = path.join(dist, '_vue', 'manifest.json');

test('SSG copies both Vue entry bundles from the Vite manifest without mounting them', () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const entries = ['src/vue/site/main.ts', 'src/vue/game/main.ts'];

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
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /_vue\/(?:manifest\.json|assets\/)/, `scaffold bundles are not loaded by ${path.relative(dist, file)}`);
  }

  const headers = fs.readFileSync(path.join(dist, '_headers'), 'utf8');
  assert.match(headers, /script-src 'self'/, 'CSP keeps scripts same-origin');
  assert.doesNotMatch(headers, /unsafe-inline/, 'CSP does not permit inline scripts or styles');
  assert.match(headers, /\/_vue\/assets\/\*/, 'hashed Vue assets have a dedicated cache rule');
  assert.match(headers, /\/_vue\/manifest\.json/, 'Vue manifest is revalidated separately');
});
