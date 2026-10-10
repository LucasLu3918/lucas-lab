import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readdirSync} from 'node:fs';
import {galleryAssets,canViewArtwork,filterArtwork} from '../games/blood-mirror/gallery.js';
test('every game image is catalogued with a valid local file and unique id',()=>{
 assert.equal(new Set(galleryAssets.map(a=>a.id)).size,galleryAssets.length);
 for(const asset of galleryAssets){assert.ok(existsSync(new URL('../games/blood-mirror/'+asset.src,import.meta.url)),asset.src);assert.ok(asset.alt&&asset.description);}
 for(const file of readdirSync(new URL('../games/blood-mirror/assets/',import.meta.url)).filter(f=>f.endsWith('.webp')))assert.ok(galleryAssets.some(a=>a.src==='assets/'+file),file);
});
test('only discovered endings are visible and categories retain the archive',()=>{
 const cg=filterArtwork('ending');assert.equal(cg.length,3);
 for(const asset of cg){assert.equal(canViewArtwork(asset),false);assert.equal(canViewArtwork(asset,[asset.ending]),true);assert.equal(canViewArtwork(asset,['other']),false);}
 assert.equal(filterArtwork('scene').length,5);assert.equal(filterArtwork('all').length,12);
 assert.equal(filterArtwork('concept').length,3);assert.ok(filterArtwork('character').every(a=>canViewArtwork(a)));
});

test('concept boards remain hidden until all ending spoilers are discovered',()=>{for(const asset of filterArtwork('concept')){assert.equal(canViewArtwork(asset,['dawn']),false);assert.equal(canViewArtwork(asset,['dawn','frost','crown']),true);}});
