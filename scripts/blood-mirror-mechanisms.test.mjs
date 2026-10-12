// Solver and exhaustive checks for the second-stage mechanisms (plan §5.4) and the puzzle roadmap (r3, r4, r7, r9, r10).
import test from 'node:test';
import assert from 'node:assert/strict';
import {startGears,warmGears,turnGear,watchSolved,minTurns} from '../games/blood-mirror/puzzles/watch.js';
import {miners,bedAnswer,bedSolutions,namesSolved,bedsSatisfy,brokenBedClue,minerOrder} from '../games/blood-mirror/puzzles/names.js';
import {guests,maskAnswer,maskClues,brokenClue,guestOrder} from '../games/blood-mirror/puzzles/masks.js';
import {SEALS,lid,missingSeal,rubbingSolved} from '../games/blood-mirror/puzzles/rubbing.js';
import {backSeam,frontSeam,SIZE,stitchSolved,stitchPrefix,demoStitches} from '../games/blood-mirror/puzzles/stitch.js';
import {memoryCards,cardsMatch} from '../games/blood-mirror/puzzles/memory.js';
import {layout,startCell,exitCell,gateCell,step,mazeSolved,shortestWalk} from '../games/blood-mirror/puzzles/maze.js';

test('watch gears: scrambled start is not solved and has a short solution', () => {
 assert.equal(watchSolved(startGears), false);
 const turns = minTurns();
 assert.ok(turns > 0 && turns <= 8, 'solvable in few turns, got ' + turns);
 assert.equal(watchSolved(turnGear(turnGear(turnGear([0, 0, 0], 0), 1), 2)), true, 'one turn of each gear cancels out');
});

test('watch gears: the warm-up is a single turn that shows the coupling (r9)', () => {
 assert.equal(minTurns(warmGears), 1);
 assert.deepEqual(turnGear(warmGears, 0), [0, 0, 0], 'turning the hour gear pulls the minute gear home');
 assert.ok(minTurns(startGears) > minTurns(warmGears));
});

test('masks and names: options never list the answer in order, and a wrong answer names a broken testimony (r3)', () => {
 assert.notDeepEqual(guestOrder, maskAnswer);
 assert.deepEqual([...guestOrder].sort(), guests.map((_, i) => i));
 assert.notDeepEqual(minerOrder, bedAnswer);
 assert.deepEqual([...minerOrder].sort(), miners.map((_, i) => i));
 assert.equal(brokenClue(maskAnswer), -1);
 assert.equal(brokenBedClue(bedAnswer), -1);
 // Every wrong full arrangement breaks at least one testimony (uniqueness), so the feedback always has one to name.
 const swap = (list, a, b) => { const next = [...list]; [next[a], next[b]] = [next[b], next[a]]; return next; };
 for (let a = 0; a < maskAnswer.length; a++) for (let b = a + 1; b < maskAnswer.length; b++) assert.ok(brokenClue(swap(maskAnswer, a, b)) >= 0);
 for (let a = 0; a < bedAnswer.length; a++) for (let b = a + 1; b < bedAnswer.length; b++) assert.ok(brokenBedClue(swap(bedAnswer, a, b)) >= 0);
 assert.ok(maskClues.length > 0);
});

test('queen memories: each memory pairs only with the object it describes (r7)', () => {
 assert.equal(memoryCards.length, 8);
 for (const pair of new Set(memoryCards.map(card => card.pair))) {
  const cards = memoryCards.map((card, i) => [card, i]).filter(([card]) => card.pair === pair);
  assert.deepEqual(cards.map(([card]) => card.kind).sort(), ['memory', 'object'], pair);
  assert.equal(cardsMatch(cards[0][1], cards[1][1]), true);
 }
 const memories = memoryCards.map((card, i) => [card, i]).filter(([card]) => card.kind === 'memory').map(([, i]) => i);
 assert.equal(cardsMatch(memories[0], memories[1]), false, 'two memories never match');
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
 assert.equal(demoStitches, 1, 'one worked example, the rest is the player\'s (r4)');
});

test('mirror corridor: left and right are swapped, and the gate needs the pocket watch (r7, r10)', () => {
 assert.deepEqual(step([0, 0], 'L'), [0, 1], 'pressing left moves the reflection right');
 assert.deepEqual(step([0, 1], 'R'), [0, 0], 'pressing right moves the reflection left');
 assert.deepEqual(step([0, 0], 'R'), [0, 0], 'the reflection cannot leave the grid');
 assert.deepEqual(step([0, 2], 'D'), [1, 2], 'vertical moves are not swapped');
 assert.deepEqual(step([0, 0], 'D'), [0, 0], 'walls block');
 assert.deepEqual(step([2, 2], 'L'), [2, 2], 'the closed gate blocks');
 assert.deepEqual(step([2, 2], 'L', true), gateCell, 'the reopened gate lets the reflection through');
 assert.equal(shortestWalk(false), -1, 'without the watch the exit cannot be reached');
 assert.equal(shortestWalk(true), 9);
 let at = startCell;
 for (const input of ['L', 'L', 'D', 'D', 'L', 'L', 'D', 'L', 'D']) at = step(at, input, true);
 assert.equal(mazeSolved(at), true);
 assert.deepEqual(at, exitCell);
 assert.ok(layout.length * layout[0].length > 15, 'larger than the first corridor');
});
