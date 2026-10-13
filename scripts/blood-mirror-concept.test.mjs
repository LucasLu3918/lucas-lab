import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {conceptArt,conceptStyle,conceptMarkup} from '../games/blood-mirror/concept-art.js';
function webpSize(bytes){
 const chunk=bytes.toString('ascii',12,16);
 if(chunk==='VP8X')return [1+bytes.readUIntLE(24,3),1+bytes.readUIntLE(27,3)];
 if(chunk==='VP8 ')return [bytes.readUInt16LE(26)&0x3fff,bytes.readUInt16LE(28)&0x3fff];
 if(chunk==='VP8L'){const b=bytes.readUInt32LE(21);return [(b&0x3fff)+1,((b>>14)&0x3fff)+1];}
 return [0,0];
}
// The PNG masters are not in the repository (see draft/lucas-lab/MASTERS-MANIFEST.md). BLOOD_MIRROR_MASTERS overrides the
// default sibling draft folder; when neither exists the size check is skipped with that reason, never silently passed.
const masters=process.env.BLOOD_MIRROR_MASTERS||fileURLToPath(new URL('../../draft/lucas-lab/blood-mirror/source-art/',import.meta.url));
const mastersFound=existsSync(masters);
test('every concept region fits its WebP sprite, which matches the original PNG size',{skip:mastersFound?false:'PNG masters not found at '+masters},()=>{
 for(const art of Object.values(conceptArt)){
  assert.match(art.src,/\.webp$/);
  const webp=readFileSync(new URL('../games/blood-mirror/'+art.src,import.meta.url));
  const png=readFileSync(new URL(art.src.replace(/^assets\//,'').replace(/\.webp$/,'.png'),'file://'+masters.replace(/\/?$/,'/')));
  assert.equal(webp.toString('ascii',0,4),'RIFF');assert.deepEqual(webpSize(webp),[art.width,art.height]);
  assert.equal(png.readUInt32BE(16),art.width);assert.equal(png.readUInt32BE(20),art.height);
  assert.ok(webp.length<png.length/4,'sprite source should be much lighter than the PNG');
  const [x,y,w,h]=art.rect;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=art.width&&y+h<=art.height);
 }
});
test('portrait tile edges represent only the selected portrait, and unknown assets are omitted',()=>{
 assert.equal(conceptStyle('unknown'),'');assert.equal(conceptMarkup('unknown'),'');
 assert.equal(conceptStyle('portrait',9),'');
 for(let i=0;i<9;i++)assert.match(conceptStyle('portrait',i),/background-image:url\(assets\/concepts\/design-board-1.webp\)/);
 assert.match(conceptMarkup('frost'),/role="img" aria-label="雪夜中的公主"/);
 assert.match(conceptMarkup('clock',{decorative:true}),/aria-hidden="true"/);
});
test('small clue objects come from the light item sheet and every region positions to a finite offset',()=>{
 for(const id of ['clock','vial','feather','apple','key'])assert.equal(conceptArt[id].src,'assets/concepts/item-sheet.webp');
 for(const id of Object.keys(conceptArt))assert.doesNotMatch(conceptStyle(id),/NaN|Infinity/,id);
 assert.match(conceptStyle('clock'),/background-position:0% 0%/);
});
