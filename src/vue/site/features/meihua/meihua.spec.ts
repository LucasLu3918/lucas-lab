import { describe, expect, it } from 'vitest';
import { lintCopy } from '../fortune-core/ethics';
import {
  MEIHUA_METHOD_VERSION, TRIGRAMS, castByCurrentTime, castByNumbers, castByText, castByTimeIndices, movingLineOf, relationOf, seasonOf, strengthOf, topicView, trigramOf,
} from './meihua';
import { interpret } from './interpretation';

describe('trigram and line rules', () => {
  it('maps the eight numbers to the pre-heaven trigrams, with 0 read as 8', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(n => trigramOf(n).name)).toEqual(['乾', '兌', '離', '震', '巽', '坎', '艮', '坤']);
    expect(trigramOf(0).name).toBe('坤');
    expect(trigramOf(9).name).toBe('乾');
  });

  it('reads the moving line from a remainder of 6, with 0 read as 6', () => {
    expect(movingLineOf(0)).toBe(6);
    expect(movingLineOf(6)).toBe(6);
    expect(movingLineOf(13)).toBe(1);
  });

  it('keeps the trigram symbols and elements consistent with the pre-heaven table', () => {
    expect(TRIGRAMS.map(item => item.element)).toEqual(['金', '金', '火', '木', '木', '水', '土', '土']);
    expect(TRIGRAMS.map(item => item.lines)).toEqual(['111', '011', '101', '001', '110', '010', '100', '000']);
  });
});

describe('hexagram naming', () => {
  it('names the sixty-four hexagrams without duplicates and matches known pairs', () => {
    const names = new Set<string>();
    for (const lower of TRIGRAMS) for (const upper of TRIGRAMS) {
      names.add(castFixed(upper.number, lower.number).primary.name);
    }
    expect(names.size).toBe(64);
    expect(castFixed(8, 6).primary.name).toBe('地水師');
    expect(castFixed(7, 6).primary.name).toBe('山水蒙');
    expect(castFixed(6, 7).primary.name).toBe('水山蹇');
    expect(castFixed(1, 1).primary.name).toBe('乾為天');
  });
});

// Builds a reading whose upper and lower seeds are the given trigram numbers and whose moving line is the given value.
function castFixed(upper: number, lower: number, moving = 1) {
  return castByNumbers([upper, lower, moving]);
}

describe('casting methods', () => {
  it('casts two numbers as upper, lower and moving (7 and 3 give 山火賁, moving line 4)', () => {
    const reading = castByNumbers([7, 3]);
    expect(reading.method).toBe('numbers');
    expect(reading.primary.name).toBe('山火賁');
    expect(reading.moving).toBe(4);
    expect(reading.yongPosition).toBe('upper');
    expect(reading.yong.name).toBe('艮');
    expect(reading.ti.name).toBe('離');
  });

  it('splits one multi-digit number into upper and lower parts (73 gives 山火賁, moving line 1)', () => {
    const reading = castByNumbers([73]);
    expect(reading.primary.name).toBe('山火賁');
    expect(reading.moving).toBe(1);
    expect(reading.yongPosition).toBe('lower');
  });

  it('casts characters by stroke count (財 is 7 strokes, giving 艮為山 with moving line 1)', () => {
    const reading = castByText('财');
    expect(reading.method).toBe('text');
    expect(reading.primary.name).toBe('艮為山');
    expect(reading.moving).toBe(1);
  });

  it('adds the stroke counts of every character to find the moving line', () => {
    // 合 6 → upper 坎; 事 8 → lower 坤; total 14 % 6 = 2
    const reading = castByText('合事');
    expect(reading.primary.name).toBe('水地比');
    expect(reading.moving).toBe(2);
  });

  it('casts the 合作 example from the rules (6 + 7 strokes gives 水山蹇, moving line 1)', () => {
    const reading = castByText('合作');
    expect(reading.primary.name).toBe('水山蹇');
    expect(reading.moving).toBe(1);
  });

  it('rejects characters without a stroke count instead of guessing', () => {
    expect(() => castByText('龘')).toThrow(/尚未收錄筆畫/);
    expect(() => castByText('')).toThrow(/一到四個字/);
  });

  it('rejects malformed number input', () => {
    expect(() => castByNumbers([])).toThrow(/一到三個/);
    expect(() => castByNumbers([1, 2, 3, 4])).toThrow(/一到三個/);
    expect(() => castByNumbers([-1])).toThrow(/非負整數/);
    expect(() => castByNumbers([1.5, 2])).toThrow(/非負整數/);
  });
});

describe('time casting', () => {
  it('matches the worked example: year 申, lunar 4/11, hour 巳 gives 地水師 with moving line 6', () => {
    const reading = castByTimeIndices({ yearBranch: 9, lunarMonth: 4, lunarDay: 11, hourBranch: 6 });
    expect(reading.method).toBe('time');
    expect(reading.primary.name).toBe('地水師');
    expect(reading.moving).toBe(6);
    expect(reading.nuclear.hexagram.name).toBe('地雷復');
    expect(reading.changed.hexagram.name).toBe('山水蒙');
    expect(reading.relation).toBe('yong-controls-ti');
  });

  it('converts the current clock through the lunar calendar (2024-02-10 is 甲辰 lunar 1/1; 09:30 is 巳)', () => {
    const now = new Date(2024, 1, 10, 9, 30);
    const reading = castByCurrentTime(now);
    const expected = castByTimeIndices({ yearBranch: 5, lunarMonth: 1, lunarDay: 1, hourBranch: 6 });
    expect(reading.primary.name).toBe(expected.primary.name);
    expect(reading.moving).toBe(expected.moving);
    expect(reading.lunar).toContain('甲辰年');
    expect(reading.primary.name).toBe('山風蠱');
  });

  it('reads the late-night hour 子 from 23:00 and 00:00 as branch 1', () => {
    const late = castByCurrentTime(new Date(2024, 1, 10, 23, 15));
    const midnight = castByCurrentTime(new Date(2024, 1, 10, 0, 5));
    expect(late.lunar).toContain('子時');
    expect(midnight.lunar).toContain('子時');
  });
});

describe('body and use relations', () => {
  it('uses the half that holds the moving line as 用 (upper when the line is 4 to 6)', () => {
    expect(castByNumbers([7, 3]).yong.name).toBe('艮');
    expect(castByNumbers([7, 3, 2]).yongPosition).toBe('lower');
  });

  it('classifies the five relations with the generating and controlling cycles', () => {
    expect(relationOf('木', '火')).toBe('yong-generates-ti');
    expect(relationOf('火', '木')).toBe('ti-generates-yong');
    expect(relationOf('土', '水')).toBe('yong-controls-ti');
    expect(relationOf('水', '土')).toBe('ti-controls-yong');
    expect(relationOf('金', '金')).toBe('same');
  });

  it('derives the nuclear and changed hexagrams from the stated line positions', () => {
    const reading = castByNumbers([8, 6, 6]);
    expect(reading.primary.name).toBe('地水師');
    expect(reading.nuclear.hexagram.name).toBe('地雷復');
    expect(reading.changed.hexagram.name).toBe('山水蒙');
  });
});

describe('season and strength', () => {
  it('maps lunar months to the governing branch and element', () => {
    expect(seasonOf(1)).toMatchObject({ branch: '寅', element: '木' });
    expect(seasonOf(4)).toMatchObject({ branch: '巳', element: '火' });
    expect(seasonOf(12)).toMatchObject({ branch: '丑', element: '土' });
  });

  it('gives 旺 相 休 囚 死 for the five elements in a season of wood', () => {
    expect(['木', '火', '水', '金', '土'].map(body => strengthOf(body as '木', '木'))).toEqual(['旺', '相', '休', '囚', '死']);
  });
});

describe('interpretation copy', () => {
  it('passes the copy ethics linter for every relation and strength', () => {
    const samples = [castByNumbers([7, 3]), castByTimeIndices({ yearBranch: 9, lunarMonth: 4, lunarDay: 11, hourBranch: 6 }), castByNumbers([8, 8, 2]), castByNumbers([1, 1, 1])];
    for (const reading of samples) {
      const copy = interpret(reading, 'love');
      const texts = [copy.tiYong, copy.nuclear, copy.changed, copy.strength, copy.overall, copy.timing, ...copy.suggestions, copy.topic?.body ?? '', copy.topic?.yong ?? ''];
      for (const text of texts) expect(lintCopy(text)).toEqual([]);
    }
  });

  it('gives topic-specific notes only when a topic is chosen', () => {
    const reading = castByNumbers([7, 3]);
    expect(interpret(reading, 'general').topic).toBeNull();
    expect(topicView(reading, 'career')?.label).toContain('事業');
    expect(interpret(reading, 'health').topic?.body).toContain('體卦');
  });

  it('keeps the method version in the result', () => {
    expect(castByNumbers([1, 2]).methodVersion).toBe(MEIHUA_METHOD_VERSION);
  });
});
