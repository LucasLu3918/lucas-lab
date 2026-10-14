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
 // the dial crop starts a little inside the sheet, so its offset is small but not zero
 assert.match(conceptStyle('clock'),/background-position:4\.\d+% 50\.\d+%/);
});
// Measured object extents on the painted item sheet (sheet pixels: x0, y0, x1, y1). A crop that misses its object shows only
// the stone or the frame, which is how the silver key went unrecognised; a crop that is too loose makes it tiny.
const objectBounds={vial:[725,40,830,227],feather:[948,38,1078,221],apple:[437,41,580,207],key:[1241,37,1315,219],clock:[62,64,319,320]};
test('each memory object crop contains its object and is not loose around it',()=>{
 for(const [id,[x0,y0,x1,y1]] of Object.entries(objectBounds)){
  const [x,y,w,h]=conceptArt[id].rect;
  assert.ok(x<=x0&&y<=y0&&x+w>=x1&&y+h>=y1,`${id} crop ${[x,y,w,h]} must contain the object ${[x0,y0,x1,y1]}`);
  const fill=((x1-x0)*(y1-y0))/(w*h);
  assert.ok(fill>=0.3,`${id} object fills only ${(fill*100).toFixed(0)}% of its crop`);
 }
});
