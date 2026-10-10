import {analyzePipes,pipePorts,initialPipeRotations} from '../games/blood-mirror/pipes.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ledgerTile,ledgerMarkup,ledgerPieces} from '../games/blood-mirror/ledger.js';
import {puzzleIsSolved,pipeIsSolved,glassIsSolved,resetChallenges,isChallengeComplete} from '../games/blood-mirror/challenges.js';
test('ledger pieces are distinct crops of one typeset page',()=>{
 const boxes=ledgerPieces.map((_,i)=>ledgerTile(i).match(/viewBox="([^"]+)"/)[1]);
 assert.equal(new Set(boxes).size,9);assert.equal(boxes[0],'0 0 100 100');assert.equal(boxes[8],'200 200 100 100');
 for(const bad of [-1,9,1.5,'x',null])assert.equal(ledgerTile(bad),'');
 assert.match(ledgerMarkup(),/七十三/);assert.match(ledgerMarkup(),/aria-label/);
});
test('3x3 ledger puzzle requires every piece in the right place',()=>{
 assert.equal(puzzleIsSolved([0,1,2,3,4,5,6,7,8]),true);
 assert.equal(puzzleIsSolved([0,2,1,3,4,5,6,7,8]),false);
 assert.equal(puzzleIsSolved([0,1]),false);
});
test('only reciprocal pipes connect the spring to the city',()=>{
 const connected=[0,2,3,1,0];assert.equal(pipeIsSolved(connected),true);
 assert.deepEqual(analyzePipes(connected).flowing,[0,1,2,5,4,7,8]);
 assert.equal(analyzePipes(connected).leaks.length,0);assert.equal(analyzePipes(connected).connectedPipes,5);
 assert.equal(pipeIsSolved([0,0,0,0,0]),false);assert.equal(pipeIsSolved(initialPipeRotations),false);
});
test('straight half-turns and complete turns are equivalent, but corners are directional',()=>{
 assert.equal(pipeIsSolved([2,2,3,1,0]),true);
 assert.equal(pipeIsSolved([4,6,7,5,4]),true);
 assert.equal(pipeIsSolved([0,0,3,1,0]),false);
 assert.deepEqual(new Set(pipePorts('straight',0)),new Set(pipePorts('straight',2)));
 assert.notDeepEqual(new Set(pipePorts('elbow',0)),new Set(pipePorts('elbow',2)));
});
test('flow stops at the first unmatched port and never wraps across board edges',()=>{
 const start=analyzePipes(initialPipeRotations);assert.deepEqual(start.flowing,[0]);assert.equal(start.solved,false);
 const partial=analyzePipes([0,0,1,3,2]);assert.deepEqual(partial.flowing,[0,1]);assert.deepEqual(partial.leaks,[{at:1,direction:1,next:2}]);
 const edge=analyzePipes([0,3,3,1,0]);assert.equal(edge.solved,false);assert.ok(edge.leaks.some(leak=>leak.next===null));
 assert.equal(analyzePipes([0,2,3,1,1]).solved,false);
});
test('invalid pipe input fails safely',()=>{
 for(const value of [null,undefined,[],[0,0],[0,2,3,1,'0'],[0,2,3,1,NaN],[0,2,3,1,Infinity],[0,2,3,1,.5]]){
  assert.equal(pipeIsSolved(value),false);assert.equal(analyzePipes(value).valid,false);
 }
});
test('all 1024 quarter-turn configurations yield exactly the two physically valid routes',()=>{
 const solutions=[];
 for(let bits=0;bits<1024;bits++){let n=bits;const rotations=Array.from({length:5},()=>{const r=n%4;n=Math.floor(n/4);return r;});if(pipeIsSolved(rotations))solutions.push(rotations);}
 assert.deepEqual(solutions,[[0,2,3,1,0],[2,2,3,1,0]]);
});
test('four-row mirrored sigil obeys left/right reversal per row',()=>{
 const left=[true,false,false,true,true,true,false,true];
 const reflected=[false,true,true,false,true,true,true,false];
 assert.equal(glassIsSolved(left,reflected),true);
 assert.equal(glassIsSolved(left,[true,false,false,true,true,true,false,true]),false);
 assert.equal(glassIsSolved([],[]),false);
});
test('progress helpers safely tolerate browsers without localStorage',()=>{
 resetChallenges();
 assert.equal(isChallengeComplete('library'),false);
});
