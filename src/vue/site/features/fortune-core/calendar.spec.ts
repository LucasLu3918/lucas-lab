import { describe, expect, it } from 'vitest';
import { toLunarDate } from './calendar';

describe('lunar calendar wrapper', () => {
  it('converts the Lunar New Year day to 農曆正月初一 with the matching ganzhi year', () => {
    expect(toLunarDate({ year: 2024, month: 2, day: 10 })).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      isLeapMonth: false,
      ganzhiYear: '甲辰',
    });
  });

  it('rejects impossible civil dates before conversion', () => {
    expect(() => toLunarDate({ year: 2024, month: 2, day: 30 })).toThrow(RangeError);
  });
});
