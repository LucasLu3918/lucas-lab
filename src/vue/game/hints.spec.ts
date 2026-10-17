import { describe, expect, it } from 'vitest';
import { parseHintSnapshot } from './hints';

describe('parseHintSnapshot', () => {
  it('accepts a valid snapshot and copies its hint lines', () => {
    const list = ['先觀察線索。', '比較兩段記錄。', '答案是北方。'];
    const parsed = parseHintSnapshot({ stepName: '推理', list, count: 1 });

    expect(parsed).toEqual({ stepName: '推理', list, count: 1 });
    expect(parsed?.list).not.toBe(list);
  });

  it.each([
    null,
    [],
    { stepName: '', list: ['提示'], count: 0 },
    { stepName: '推理', list: ['提示', 3], count: 0 },
    { stepName: '推理', list: ['提示'], count: -1 },
    { stepName: '推理', list: ['提示'], count: 1.5 },
    { stepName: '推理', list: ['提示'], count: 2 },
  ])('rejects an invalid snapshot: %j', value => {
    expect(parseHintSnapshot(value)).toBeNull();
  });
});
