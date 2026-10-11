// Solver and exhaustive checks for the five second-stage mechanisms (plan §5.4).
import test from 'node:test';
import assert from 'node:assert/strict';
import {startGears,turnGear,watchSolved,minTurns} from '../games/blood-mirror/puzzles/watch.js';
import {miners,bedAnswer,bedSolutions,namesSolved,bedsSatisfy} from '../games/blood-mirror/puzzles/names.js';
import {SEALS,lid,missingSeal,rubbingSolved} from '../games/blood-mirror/puzzles/rubbing.js';
import {backSeam,frontSeam,SIZE,stitchSolved,stitchPrefix} from '../games/blood-mirror/puzzles/stitch.js';
import {layout,startCell,exitCell,step,mazeSolved,shortestWalk} from '../games/blood-mirror/puzzles/maze.js';

test('watch gears: scrambled start is not solved and has a short solution', () => {
 assert.equal(watchSolved(startGears), false);
 const turns = minTurns();
 assert.ok(turns > 0 && turns <= 8, 'solvable in few turns, got ' + turns);
 assert.equal(watchSolved(turnGear(turnGear(turnGear([0, 0, 0], 0), 1), 2)), true, 'one turn of each gear cancels out');
});

test('seven names: exactly one bed order satisfies every testimony', () => {
 const found = bedSolutions();
 assert.equal(found.length, 1);
 assert.deepEqual(found[0], bedAnswer);
 assert.equal(namesSolved(bedAnswer), true);
 assert.equal(bedsSatisfy([...bedAnswer].reverse()), false);
 assert.equal(new Set(bedAnswer).size, miners.length);
});

test('rubbing: exactly one seal is missing from the lid', () => {
 assert.equal(SEALS.filter(seal => !lid.includes(seal)).length, 1);
 assert.equal(missingSeal(), '名');
 assert.equal(rubbingSolved('名'), true);
 assert.equal(rubbingSolved('日'), false);
});

test('stitch: the front is the mirror of the back and checking is exact', () => {
 assert.equal(stitchSolved(frontSeam), true);
 assert.equal(stitchSolved(backSeam), false, 'copying the back unmirrored must fail');
 assert.equal(stitchSolved([...frontSeam].reverse()), false, 'order matters');
 assert.equal(stitchPrefix([...frontSeam.slice(0, 3), [3, 3]]), 3);
 assert.ok(frontSeam.every(([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE));
});

test('mirror corridor: left and right are swapped and the exit is five steps away', () => {
 assert.deepEqual(step([0, 0], 'L'), [0, 1], 'pressing left moves the reflection right');
 assert.deepEqual(step([0, 1], 'R'), [0, 0], 'pressing right moves the reflection left');
 assert.deepEqual(step([0, 0], 'R'), [0, 0], 'the reflection cannot leave the grid');
 assert.deepEqual(step([0, 1], 'D'), [1, 1], 'vertical moves are not swapped');
 assert.deepEqual(step([0, 1], 'L'), [0, 1], 'walls block');
 assert.equal(shortestWalk(), 5);
 // Known route: right, down, right, right, down in the corridor = L, D, L, L, D as inputs.
 let at = startCell;
 for (const input of ['L', 'D', 'L', 'L', 'D']) at = step(at, input);
 assert.equal(mazeSolved(at), true);
 assert.deepEqual(at, exitCell);
 assert.equal(layout.length, 3);
});
