import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {conceptArt,conceptStyle,conceptMarkup} from '../games/blood-mirror/concept-art.js';
test('every concept region fits its original PNG dimensions',()=>{
 for(const art of Object.values(conceptArt)){
  const bytes=readFileSync(new URL('../games/blood-mirror/'+art.src,import.meta.url));
  assert.equal(bytes.readUInt32BE(16),art.width);assert.equal(bytes.readUInt32BE(20),art.height);
  const [x,y,w,h]=art.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=art.width&&y+h<=art.height);
 }
});
test('portrait tile edges represent only the selected portrait, and unknown assets are omitted',()=>{
 assert.equal(conceptStyle('unknown'),'');assert.equal(conceptMarkup('unknown'),'');
 assert.equal(conceptStyle('portrait',9),'');
 for(let i=0;i<9;i++)assert.match(conceptStyle('portrait',i),/background-image:url\(assets\/concepts\/design-board-1.png\)/);
 assert.match(conceptMarkup('frost'),/role="img" aria-label="雪夜中的公主"/);
 assert.match(conceptMarkup('clock',{decorative:true}),/aria-hidden="true"/);
});
