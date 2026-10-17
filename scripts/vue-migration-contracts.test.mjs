import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {SAVE_KEY,BACKUP_SAVE_KEY,LEGACY_SAVE_KEY,LEGACY_PUZZLE_KEY} from '../games/blood-mirror/engine/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
const manifest=JSON.parse(read('docs/architecture/vue-route-baseline.json'));

test('generated HTML route inventory and metadata match the pre-migration baseline',()=>{
 const output=path.join(root,'dist');
 assert.ok(fs.existsSync(output),'run npm run build before this contract test');
 const actual=[];
 const visit=(directory,relative='')=>{
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
   const absolute=path.join(directory,entry.name),child=path.join(relative,entry.name);
   if(entry.isDirectory())visit(absolute,child);
   else if(entry.isFile()&&entry.name==='index.html'){
    const html=fs.readFileSync(absolute,'utf8');
    const route='/'+child.slice(0,-'index.html'.length);
    const canonical=html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1]||null;
    const title=html.match(/<title>(.*?)<\/title>/i)?.[1]||null;
    const robots=html.match(/<meta name="robots" content="([^"]+)"/i)?.[1]||null;
    actual.push({route,canonical,title,robots});
   }
  }
 };
 visit(output);
 actual.sort((a,b)=>a.route.localeCompare(b.route));
 assert.deepEqual(actual,manifest.routes);
});

test('public storage keys remain stable for reader preferences and game saves',()=>{
 assert.equal(SAVE_KEY,'blood-mirror-v2');
 assert.equal(BACKUP_SAVE_KEY,'blood-mirror-v2-backup');
 assert.equal(LEGACY_SAVE_KEY,'blood-mirror-v1');
 assert.equal(LEGACY_PUZZLE_KEY,'blood-mirror-challenges-v2');
 assert.match(read('src/vue/site/features/reader/readerPreferences.ts'),/lucaslab\.reader\.preferences/);
 assert.match(read('assets/app.js'),/lucaslab\.reader\.preferences/,'static fallback keeps controls usable until the Vue island is requested');
 assert.match(read('assets/app.js'),/dataset\.vueReaderEntry/,'Vue preferences load after the first control interaction');
 assert.match(read('assets/app.js'),/lucaslab\.progress\.v1/);
});

test('playable Blood Mirror page mounts only the manifest-bound Vue inventory island',()=>{
 const output=path.join(root,'dist');
 const route=read('dist/games/blood-mirror/play/index.html');
 const vueManifest=JSON.parse(read('.vue-inventory-build/manifest.json'));
 const inventoryEntry=vueManifest['src/vue/game/inventory-main.ts'];
 assert.equal(inventoryEntry?.isEntry,true);
 assert.deepEqual(inventoryEntry.imports||[],[],'the page adds only one Vue JavaScript request');
 assert.match(route,/data-vue-game-inventory/);
 assert.ok(route.includes(`data-vue-game-inventory-entry="/_vue/${inventoryEntry.file}"`));
 assert.doesNotMatch(route,/\/_vue\/assets\/inventory-main-[^" ]+\.js"><\/script>/,'the Vue island is lazy and does not add a page-load request');
 assert.ok(fs.existsSync(path.join(output,'_vue',inventoryEntry.file)),'the referenced Vue inventory asset is copied into the static output');
 assert.equal((route.match(/data-vue-game-inventory(?=\s|>)/g)||[]).length,1,'Vue owns exactly one inventory subtree');
});

test('static hosting retains 404 pages and trailing slash handling',()=>{
 const config=JSON.parse(read('wrangler.jsonc'));
 assert.equal(config.assets.not_found_handling,'404-page');
 assert.equal(config.assets.html_handling,'auto-trailing-slash');
});

test('audio Worker preserves byte-range 206 and invalid-range 416 responses',async()=>{
 const module={exports:{}};
 const source=read('worker/index.js').replace(/export default\s+/,'module.exports = ');
 vm.runInNewContext(source,{module,Request,Response,Headers});
 const assetBytes=new TextEncoder().encode('0123456789');
 const env={ASSETS:{fetch:async request=>{
  assert.equal(request.headers.get('range'),null,'the full asset is fetched before slicing');
  return new Response(assetBytes,{status:200,headers:{'Content-Length':'10','ETag':'old'}});
 }}};

 const partial=await module.exports.fetch(new Request('https://example.test/music/audio/track.mp3',{headers:{range:'bytes=2-5'}}),env);
 assert.equal(partial.status,206);
 assert.equal(partial.headers.get('content-range'),'bytes 2-5/10');
 assert.equal(await partial.text(),'2345');

 const invalid=await module.exports.fetch(new Request('https://example.test/music/audio/track.mp3',{headers:{range:'bytes=10-'}}),env);
 assert.equal(invalid.status,416);
 assert.equal(invalid.headers.get('content-range'),'bytes */10');
});
