import { describe, expect, it } from 'vitest';
import {
  BRANCHES,
  PALACE_NAMES,
  ZIWEI_METHOD_VERSION,
  calculateZiwei,
  fiveElementBureau,
  mingBranch,
  palaceStem,
  shenBranch,
  ziweiBranch,
} from './ziwei';

// Golden table generated from iztro 2.6.3: branch of 紫微 for lunar day 1–30 under each five-element bureau (二, 三, 四, 五, 六).
const ZIWEI_GOLDEN: Record<number, string> = {
  2: '丑寅寅卯卯辰辰巳巳午午未未申申酉酉戌戌亥亥子子丑丑寅寅卯卯辰',
  3: '辰丑寅巳寅卯午卯辰未辰巳申巳午酉午未戌未申亥申酉子酉戌丑戌亥',
  4: '亥辰丑寅子巳寅卯丑午卯辰寅未辰巳卯申巳午辰酉午未巳戌未申午亥',
  5: '午亥辰丑寅未子巳寅卯申丑午卯辰酉寅未辰巳戌卯申巳午亥辰酉午未',
  6: '酉午亥辰丑寅戌未子巳寅卯亥申丑午卯辰子酉寅未辰巳丑戌卯申巳午',
};

const MAJOR_STARS = [
  '紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍',
];

describe('ziwei placement by bureau and lunar day', () => {
  it.each(Object.entries(ZIWEI_GOLDEN))('matches the iztro table for bureau %s', (bureau, row) => {
    const branches = [...row];
    expect(branches).toHaveLength(30);
    branches.forEach((name, index) => {
      expect(BRANCHES[ziweiBranch(Number(bureau), index + 1)], `bureau ${bureau} day ${index + 1}`).toBe(name);
    });
  });
});

describe('命宮, 身宮 and 五行局 formulas', () => {
  it('places 命宮 and 身宮 for 農曆五月 亥時 (1990 五月初八)', () => {
    expect(BRANCHES[mingBranch(5, 11)]).toBe('未');
    expect(BRANCHES[shenBranch(5, 11)]).toBe('巳');
  });

  it('takes the 命宮 stem from its palace branch under 五虎遁, not from the lunar month', () => {
    // 庚午 year: 寅 month starts at 戊, so 未 (the sixth branch from 寅) is 癸未, which is 楊柳木 (木三局).
    expect(palaceStem(6, 7)).toBe(9);
    const bureau = fiveElementBureau(palaceStem(6, 7), 7);
    expect(bureau).toEqual({ bureau: 3, className: '木三局' });
  });

  it('reads the five-element bureau from 納音 for every 命宮 pair', () => {
    const counts = new Map<number, number>();
    for (let stem = 0; stem < 10; stem += 1) {
      for (let branch = 0; branch < 12; branch += 1) {
        if (stem % 2 !== branch % 2) continue;
        const { bureau } = fiveElementBureau(stem, branch);
        counts.set(bureau, (counts.get(bureau) ?? 0) + 1);
      }
    }
    expect([...counts.keys()].sort()).toEqual([2, 3, 4, 5, 6]);
  });
});

describe('calculateZiwei chart structure', () => {
  const result = calculateZiwei({ birthDate: '1990-06-15', birthBranch: 5, gender: 'male' });

  it('returns a versioned result with full input precision', () => {
    expect(result.module).toBe('ziwei');
    expect(result.methodVersion).toBe(ZIWEI_METHOD_VERSION);
    expect(result.inputPrecision).toBe('full');
    expect(result.disclaimer.length).toBeGreaterThan(0);
  });

  it('lists twelve palaces in order from 命宮 and marks exactly one 身宮', () => {
    const { palaces } = result.data;
    expect(palaces.map(palace => palace.name)).toEqual([...PALACE_NAMES]);
    expect(palaces.filter(palace => palace.isBody)).toHaveLength(1);
    expect(new Set(palaces.map(palace => palace.branch)).size).toBe(12);
  });

  it('places all fourteen major stars exactly once', () => {
    const placed = result.data.palaces.flatMap(palace => palace.majorStars.map(star => star.name));
    expect(placed.sort()).toEqual([...MAJOR_STARS].sort());
  });

  it('keeps the four transformations to exactly four stars', () => {
    const marks = result.data.palaces.flatMap(palace => [...palace.majorStars, ...palace.minorStars])
      .filter(star => star.mutagen !== null);
    expect(marks.map(star => star.mutagen).sort()).toEqual(['忌', '權', '祿', '科']);
  });

  it('keeps 紫微 and 天府 on the 寅申 axis', () => {
    const star = (name: string) => result.data.palaces.find(palace => palace.majorStars.some(item => item.name === name))?.branch;
    const ziwei = star('紫微');
    const tianfu = star('天府');
    expect(ziwei !== undefined && tianfu !== undefined && (ziwei + tianfu) % 12).toBe(4);
  });

  it('starts the decadal cycle at the bureau number and runs forward for 陽男', () => {
    const { palaces, bureau } = result.data;
    const soul = palaces[0];
    expect(soul.decadal.startAge).toBe(bureau);
    expect(result.data.decadalForward).toBe(true);
    expect(palaces[1].decadal.startAge).toBe(bureau + 10 * 11);
  });

  it('reverses the decadal direction for 陰女 and 陽女', () => {
    const femaleYang = calculateZiwei({ birthDate: '1990-06-15', birthBranch: 5, gender: 'female' });
    expect(femaleYang.data.decadalForward).toBe(false);
    const maleYin = calculateZiwei({ birthDate: '1991-06-15', birthBranch: 5, gender: 'male' });
    expect(maleYin.data.decadalForward).toBe(false);
  });

  it('computes the same chart for the same input (no randomness)', () => {
    expect(calculateZiwei({ birthDate: '1990-06-15', birthBranch: 5, gender: 'male' })).toEqual(result);
  });
});

describe('input validation', () => {
  it('rejects a birth hour outside 0–11', () => {
    expect(() => calculateZiwei({ birthDate: '1990-06-15', birthBranch: 12, gender: 'male' })).toThrow(RangeError);
    expect(() => calculateZiwei({ birthDate: '1990-06-15', birthBranch: -1, gender: 'male' })).toThrow(RangeError);
    expect(() => calculateZiwei({ birthDate: '1990-06-15', birthBranch: 1.5, gender: 'male' })).toThrow(RangeError);
  });

  it('rejects a civil date that does not exist', () => {
    expect(() => calculateZiwei({ birthDate: '1990-02-30', birthBranch: 0, gender: 'female' })).toThrow();
  });
});
