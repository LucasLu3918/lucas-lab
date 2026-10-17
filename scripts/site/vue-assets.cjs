'use strict';

const path = require('node:path');

const ENTRY_POINTS = ['src/vue/site/main.ts', 'src/vue/site/lazy.ts', 'src/vue/site/reader-main.ts', 'src/vue/site/gallery-main.ts', 'src/vue/site/music-main.ts', 'src/vue/game/main.ts'];

function resolveBuildFile(fs, buildDir, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) {
    throw new Error(`Invalid Vite manifest path: ${relative}`);
  }
  const resolved = path.resolve(buildDir, relative);
  if (!resolved.startsWith(buildDir + path.sep)) {
    throw new Error(`Vite manifest path escapes build directory: ${relative}`);
  }
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    throw new Error(`Vite manifest file is missing: ${relative}`);
  }
  return resolved;
}

module.exports = function copyVueAssets(ctx) {
  const { fs, path: pathApi, root, out } = ctx;
  const buildDir = pathApi.resolve(root, '.vue-build');
  const manifestPath = pathApi.join(buildDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Vite manifest is missing; run `npm run build` instead of scripts/build.cjs directly.');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const entry of ENTRY_POINTS) {
    if (!manifest[entry]?.isEntry) {
      throw new Error(`Vite manifest entry is missing: ${entry}`);
    }
  }

  for (const value of Object.values(manifest)) {
    for (const file of [value.file, ...(value.css || []), ...(value.assets || [])]) {
      if (file) resolveBuildFile(fs, buildDir, file);
    }
  }

  const vueOut = pathApi.join(out, '_vue');
  fs.mkdirSync(vueOut, { recursive: true });
  fs.cpSync(buildDir, vueOut, { recursive: true });

  const inventoryBuildDir = pathApi.resolve(root, '.vue-inventory-build');
  const inventoryManifestPath = pathApi.join(inventoryBuildDir, 'manifest.json');
  if (!fs.existsSync(inventoryManifestPath)) {
    throw new Error('The standalone Vue inventory manifest is missing; run `npm run build` instead of scripts/build.cjs directly.');
  }
  const inventoryManifest = JSON.parse(fs.readFileSync(inventoryManifestPath, 'utf8'));
  const inventoryEntry = inventoryManifest['src/vue/game/inventory-main.ts'];
  if (!inventoryEntry?.isEntry) {
    throw new Error('Vite manifest entry is missing: src/vue/game/inventory-main.ts');
  }
  if (inventoryEntry.imports?.length) {
    throw new Error('The standalone Vue inventory entry must not add shared JavaScript requests to the game route.');
  }
  for (const file of [inventoryEntry.file, ...(inventoryEntry.css || []), ...(inventoryEntry.assets || [])]) {
    if (file) {
      const source = resolveBuildFile(fs, inventoryBuildDir, file);
      const target = pathApi.resolve(vueOut, file);
      if (!target.startsWith(vueOut + pathApi.sep)) {
        throw new Error(`Invalid standalone Vue inventory output path: ${file}`);
      }
      fs.mkdirSync(pathApi.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
  }
  return { manifest, inventoryManifest, output: vueOut };
};

module.exports.ENTRY_POINTS = ENTRY_POINTS;
