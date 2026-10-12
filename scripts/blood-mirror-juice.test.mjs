// Game feel checks (game-feel skill): every feedback bundle answers a real sound cue, feedback scales with
// how much the event matters, and the trauma shake is smooth, proportional and comes to rest.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {FEEDBACK,shakeOffset,createJuice} from '../games/blood-mirror/juice.js';

const sfx=fs.readFileSync(new URL('../games/blood-mirror/audio/sfx.js',import.meta.url),'utf8');

test('every feedback bundle belongs to a sound cue', () => {
 for(const kind of Object.keys(FEEDBACK))assert.match(sfx,new RegExp('\\n '+kind+':\\{'),kind+' is not a cue in audio/sfx.js');
});

test('feedback is proportional: routine clicks stay light, solving a seal is the biggest event', () => {
 const weight=b=>(b.burst?.n||0)+(b.shake?.trauma||0)*40+(b.impact?10:0)+(b.flash?5:0)+(b.fly?8:0);
 assert.deepEqual(Object.keys(FEEDBACK.click),['press'],'a click only presses its button');
 assert.equal(FEEDBACK.click.haptic,undefined,'routine clicks never vibrate');
 for(const [kind,bundle] of Object.entries(FEEDBACK))if(kind!=='solve')assert.ok(weight(bundle)<weight(FEEDBACK.solve),kind+' outweighs solve');
 assert.ok(FEEDBACK.wrong.shake.y===0&&FEEDBACK.wrong.shake.roll===0,'a wrong answer shakes its head (side to side only)');
});

test('shake grows with trauma squared, is smooth, and is zero at rest', () => {
 for(const value of Object.values(shakeOffset(0,3)))assert.equal(Math.abs(value),0);
 const peak=t=>Math.max(...Array.from({length:200},(_,i)=>Math.abs(shakeOffset(t,i*0.05).x)));
 assert.ok(Math.abs(peak(.5)/peak(1)-.25)<.02,'half trauma moves a quarter as far');
 // Continuous, not a fresh random offset: a tiny step in time moves the offset a tiny amount.
 for(let i=0;i<500;i++){const a=shakeOffset(1,i*0.02),b=shakeOffset(1,i*0.02+0.02);assert.ok(Math.abs(a.x-b.x)<.5&&Math.abs(a.y-b.y)<.5&&Math.abs(a.roll-b.roll)<.05);}
 assert.equal(Math.abs(shakeOffset(1,1,{x:1,y:0,roll:0}).y),0);
});

test('the module loads without a DOM and ignores unknown cues', () => {
 const originalAdd=globalThis.addEventListener;globalThis.addEventListener=()=>{};
 try{const juice=createJuice({motion:()=>false,haptics:()=>false});assert.doesNotThrow(()=>{juice.cue('nope');juice.cue('solve');});}
 finally{globalThis.addEventListener=originalAdd;}
});
