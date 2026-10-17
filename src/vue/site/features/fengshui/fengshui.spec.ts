import { describe, expect, it } from 'vitest';
import {
  parseBirthDate, DIRECTIONS, FACINGS, FENGSHUI_METHOD_VERSION, GUA_INFO, STAR_ORDER, buildFengshuiReport, eightMansions, flyStars, flyingStarChart, natalKua,
} from './fengshui';
import { interpretFengshui } from './interpretation';
import { lunarYearOf } from './lunar';
import { lintCopy } from '../fortune-core/ethics';

// 本命卦：依技能檔的公式與示例。2000 年（含）以前與以後的公式不同；餘數 5 時男為坤、女為艮。
describe('natalKua', () => {
  it.each([
    [1985, 'male', 6, '乾'],
    [1985, 'female', 9, '離'],
    [2005, 'male', 4, '巽'],
    [2005, 'female', 2, '坤'],
    [2000, 'male', 1, '坎'],
    [2000, 'female', 8, '艮'],
    [1995, 'male', 2, '坤'],
    [1995, 'female', 1, '坎'],
  ] as const)('%i %s → %i（%s）', (year, gender, gua, name) => {
    const result = natalKua(year, gender);
    expect(result.gua).toBe(gua);
    expect(result.name).toBe(name);
    expect(result.steps.length).toBeGreaterThanOrEqual(3);
  });

  // 農曆新年前出生者歸入前一個農曆年：2005 年 2 月 9 日為春節，1985 年 2 月 20 日為春節。
  it('uses the lunar year when a lunar year is given', async () => {
    expect(natalKua(2005, 'male', await lunarYearOf('2005-01-20', 2005))).toMatchObject({ gua: 2 });
    expect(natalKua(2005, 'male', await lunarYearOf('2005-02-20', 2005))).toMatchObject({ gua: 4 });
    expect(natalKua(1985, 'male', await lunarYearOf('1985-02-10', 1985))).toMatchObject({ gua: 7 });
    expect(natalKua(1985, 'male', 1984).steps[0]).toContain('農曆 1984 年');
  });

  it('rejects malformed or mismatched birth dates', async () => {
    expect(() => parseBirthDate('2005-02-30')).toThrow('不存在');
    expect(() => parseBirthDate('2005/05/01')).toThrow('格式');
    await expect(lunarYearOf('2004-05-01', 2005)).rejects.toThrow('年份');
  });

  it('classifies 東四命 and 西四命 by gua', () => {
    expect(natalKua(1985, 'male').group).toBe('西四命');
    expect(natalKua(1985, 'female').group).toBe('東四命');
    expect(natalKua(2005, 'male').group).toBe('東四命');
  });

  it('rejects years outside the supported range', () => {
    expect(() => natalKua(1899, 'male')).toThrow('1900');
    expect(() => natalKua(2101, 'female')).toThrow('2100');
    expect(() => natalKua(1990.5, 'male')).toThrow();
  });

  it('never returns a gua number outside the eight 後天 guas', () => {
    for (let year = 1900; year <= 2100; year += 1) {
      for (const gender of ['male', 'female'] as const) {
        expect(Object.keys(GUA_INFO).map(Number)).toContain(natalKua(year, gender).gua);
      }
    }
  });
});

// 八宅表：每個命卦的八星必須是八顆星各出現一次，並且吉星落在該命卦所屬的四個吉方。
describe('eightMansions', () => {
  const EAST_GOOD: readonly string[] = ['北', '東', '東南', '南'];
  const WEST_GOOD: readonly string[] = ['西', '西北', '西南', '東北'];

  it.each(Object.keys(GUA_INFO).map(Number))('gua %i lists each star once and places the four good stars in its group', gua => {
    const rows = eightMansions(gua);
    expect(rows.map(row => row.direction)).toEqual([...DIRECTIONS]);
    expect(rows.map(row => row.star).slice().sort()).toEqual([...STAR_ORDER].sort());
    const goodDirections = rows.filter(row => row.fortune === '吉' || row.star === '伏位').map(row => row.direction);
    const expected = GUA_INFO[gua].group === '東四命' ? EAST_GOOD : WEST_GOOD;
    for (const direction of goodDirections) expect(expected).toContain(direction);
  });

  it('places 伏位 in the gua’s own direction except 乾 and 坤, which swap', () => {
    for (const gua of Object.keys(GUA_INFO).map(Number)) {
      const fuwei = eightMansions(gua).find(row => row.star === '伏位');
      const expected = gua === 6 ? '西南' : gua === 2 ? '西北' : GUA_INFO[gua].direction;
      expect(fuwei?.direction).toBe(expected);
    }
  });

  it('matches the 坎命 reference table', () => {
    const map = Object.fromEntries(eightMansions(1).map(row => [row.direction, row.star]));
    expect(map).toEqual({
      北: '伏位', 東北: '五鬼', 東: '天醫', 東南: '生氣', 南: '延年', 西南: '絕命', 西: '六煞', 西北: '禍害',
    });
  });

  it('throws for a number that is not a gua', () => {
    expect(() => eightMansions(5)).toThrow();
  });
});

// 玄空飛星：運盤九紫入中宮順飛；山星與向星依坐向表順逆飛布。
describe('flyStars', () => {
  it('flies 九 from the center forward along 中→乾→兌→艮→離→坎→坤→震→巽', () => {
    const stars = flyStars(9, true);
    expect(stars).toEqual({ 5: 9, 6: 1, 7: 2, 8: 3, 9: 4, 1: 5, 2: 6, 3: 7, 4: 8 });
  });

  it('flies backward along 中→巽→震→坤→坎→離→艮→兌→乾', () => {
    const stars = flyStars(1, false);
    expect(stars).toEqual({ 5: 1, 4: 9, 3: 8, 2: 7, 1: 6, 9: 5, 8: 4, 7: 3, 6: 2 });
  });

  it('keeps every palace occupied once', () => {
    for (const start of [1, 3, 7, 9]) {
      for (const forward of [true, false]) {
        const stars = flyStars(start, forward);
        expect(Object.keys(stars)).toHaveLength(9);
        expect(new Set(Object.values(stars)).size).toBe(9);
      }
    }
  });
});

describe('flyingStarChart', () => {
  it('builds a nine-palace chart for each cardinal facing in 九運', () => {
    for (const facing of FACINGS) {
      const chart = flyingStarChart(facing.id);
      expect(chart.palaces).toHaveLength(9);
      const center = chart.palaces.find(p => p.palace === 5);
      expect(center?.run).toBe(9);
      expect(chart.steps.join('\n')).toContain(facing.sitting.split('山')[0]);
    }
  });

  it('places 運星 九, 山星 一 and 向星 九 in the center for 坐北朝南', () => {
    const chart = flyingStarChart('south');
    const center = chart.palaces.find(p => p.palace === 5);
    expect(center).toMatchObject({ run: 9, mountain: 1, facing: 9 });
    expect(chart.facing.toward).toBe('南');
  });

  it('refuses periods other than 九運', () => {
    expect(() => flyingStarChart('south', 8)).toThrow('九運');
  });
});

describe('buildFengshuiReport', () => {
  it('wraps the result with the method version and omits the chart without a facing', () => {
    const report = buildFengshuiReport({ year: 1985, gender: 'male' });
    expect(report.methodVersion).toBe(FENGSHUI_METHOD_VERSION);
    expect(report.inputPrecision).toBe('approximate');
    expect(report.data.flying).toBeNull();
    expect(report.data.mansions).toHaveLength(8);
    const withFacing = buildFengshuiReport({ year: 1985, gender: 'male', facing: 'east' });
    expect(withFacing.data.flying?.facing.id).toBe('east');
  });
});

// Copy passes the ethics linter for every gua and facing; the wording stays in suggestion form.
describe('fengshui copy', () => {
  it('passes the ethics linter for every gua and facing', () => {
    const cases = new Map<number, { year: number; gender: 'male' | 'female' }>();
    for (let year = 1900; year <= 2100; year += 1) {
      for (const gender of ['male', 'female'] as const) {
        const gua = natalKua(year, gender).gua;
        if (!cases.has(gua)) cases.set(gua, { year, gender });
      }
    }
    expect(cases.size).toBe(8);
    for (const { year, gender } of cases.values()) {
      for (const facing of [undefined, ...FACINGS.map(f => f.id)] as const) {
        const copy = interpretFengshui(buildFengshuiReport({ year, gender, facing }));
        const text = [copy.headline, copy.natalLine, ...copy.bestLines, ...copy.cautionLines, ...copy.spaceLines.map(s => s.text), ...copy.flyingLines, copy.caution].join('\n');
        expect(lintCopy(text)).toEqual([]);
      }
    }
  });
});
