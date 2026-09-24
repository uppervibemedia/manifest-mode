import test from 'node:test';
import assert from 'node:assert/strict';
import { makePattern, focusScore, memoryScore, trainingXP, localDate } from '../src/lib/trainingEngine.js';

test('memory patterns grow without duplicate or out-of-grid tiles', () => {
  for (let size = 3; size <= 7; size++) for (let i = 0; i < 25; i++) {
    const pattern = makePattern(size);
    assert.equal(pattern.length, size);
    assert.equal(new Set(pattern).size, size);
    assert.ok(pattern.every(cell => Number.isInteger(cell) && cell >= 0 && cell < 9));
  }
});
test('scores and practice XP stay bounded', () => {
  assert.equal(focusScore(10, 2), 44);
  assert.equal(focusScore(0, 10), 0);
  assert.equal(focusScore(200, 0), 100);
  assert.equal(memoryScore(20, 25), 80);
  assert.equal(memoryScore(0, 0), 0);
  assert.equal(trainingXP(100), 50);
  assert.equal(trainingXP(0), 10);
});
test('daily completion uses the local calendar day', () => {
  assert.equal(localDate(new Date(2026, 0, 2, 1, 2)), '2026-01-02');
});
