// E4 合一 (無限鏡廊): the thread order and its reverse are both correct, by design. The game says so where the player can read it:
// the hint's last tier, the order note on the stage, its caption and the note once the thread is straight.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as gal from '../games/blood-mirror/puzzles/gallery.js';

const src=fs.readFileSync(new URL('../games/blood-mirror/puzzles/gallery.js',import.meta.url),'utf8');

test('E4 accepts the thread order and its reverse, and nothing else',()=>{
 assert.equal(gal.isChain(['B','A','D','C']),true);
 assert.equal(gal.isChain(['C','D','A','B']),true);
});

test('E4 explains the reverse in the hint and on the stage',()=>{
 const tiers=gal.HINTS.order;
 assert.ok(tiers[1].includes('從另一端排也可以'),'tier 2 names the other end');
 assert.ok(tiers[2].includes('黑松林、舞廳、鏡廊、陽台'),'tier 3 writes the reverse out');
 assert.ok(src.includes('從哪一端開始都可以'),'order note');
 assert.ok(src.includes('從左到右或從右到左都算對'),'caption');
 assert.ok(src.includes('從另一端讀也是同一條紅線'),'done note');
});
