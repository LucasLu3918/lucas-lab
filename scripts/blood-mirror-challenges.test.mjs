import test from 'node:test';
import assert from 'node:assert/strict';
import {puzzleIsSolved,pipeIsSolved,glassIsSolved,resetChallenges,isChallengeComplete} from '../games/blood-mirror/challenges.js';
test('3x3 portrait puzzle requires every piece in the right place',()=>{
 assert.equal(puzzleIsSolved([0,1,2,3,4,5,6,7,8]),true);
 assert.equal(puzzleIsSolved([0,2,1,3,4,5,6,7,8]),false);
 assert.equal(puzzleIsSolved([0,1]),false);
});
test('pipe valves must all be oriented to the target position',()=>{
 assert.equal(pipeIsSolved([0,0,0,0,0]),true);
 assert.equal(pipeIsSolved([0,4,8,12,0]),true);
 assert.equal(pipeIsSolved([0,0,3,0,0]),false);
 assert.equal(pipeIsSolved([0,0]),false);
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
