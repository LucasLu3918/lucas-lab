import { describe, expect, it } from 'vitest';
import { analyzeYong, castByCoins, castByNumbers, hexagramByName, kinOf, movingLineOf, relationOf, selectYong, strengthOf, trigramOf, TOPIC_YONG, type Topic } from './liuyao';
import { interpret } from './interpretation';
import { lintCopy } from '../fortune-core/ethics';

// 2026-10-17 12:00 本機時間：月建戌，日辰甲子（節氣分月、子時 00:00 換日）。
const NOW = new Date(2026, 9, 17, 12, 0, 0);
const NATURE: Record<string, string> = { 天: '乾', 澤: '兌', 火: '離', 雷: '震', 風: '巽', 水: '坎', 山: '艮', 地: '坤' };

describe('八宮六十四卦', () => {
  it('builds all 64 hexagrams whose names match their trigrams', () => {
    const names = ['乾為天', '天風姤', '天山遯', '天地否', '風地觀', '山地剝', '火地晉', '火天大有', '兌為澤', '澤水困', '澤地萃', '澤山咸', '水山蹇', '地山謙', '雷山小過', '雷澤歸妹', '離為火', '火山旅', '火風鼎', '火水未濟', '山水蒙', '風水渙', '天水訟', '天火同人', '震為雷', '雷地豫', '雷水解', '雷風恆', '地風升', '水風井', '澤風大過', '澤雷隨', '巽為風', '風天小畜', '風火家人', '風雷益', '天雷無妄', '火雷噬嗑', '山雷頤', '山風蠱', '坎為水', '水澤節', '水雷屯', '水火既濟', '澤火革', '雷火豐', '地火明夷', '地水師', '艮為山', '山火賁', '山天大畜', '山澤損', '火澤睽', '天澤履', '風澤中孚', '風山漸', '坤為地', '地雷復', '地澤臨', '地天泰', '雷天大壯', '澤天夬', '水天需', '水地比'];
    expect(new Set(names).size).toBe(64);
    for (const name of names) {
      const hexagram = hexagramByName(name);
      expect(hexagram, name).toBeDefined();
      if (name.includes('為')) {
        expect(hexagram!.upper.name).toBe(hexagram!.lower.name);
      } else {
        expect(hexagram!.upper.name, name).toBe(NATURE[name[0]]);
        expect(hexagram!.lower.name, name).toBe(NATURE[name[1]]);
      }
    }
  });

  it('places 世應 by palace slot: 本宮 six, 一世 one, 歸魂 three, 游魂 four', () => {
    expect(hexagramByName('乾為天')).toMatchObject({ shi: 6, ying: 3 });
    expect(hexagramByName('天風姤')).toMatchObject({ shi: 1, ying: 4 });
    expect(hexagramByName('火天大有')).toMatchObject({ shi: 3, ying: 6 });
    expect(hexagramByName('火地晉')).toMatchObject({ shi: 4, ying: 1 });
  });
});

describe('起卦', () => {
  it('casts two numbers as upper then lower trigram, and the sum as the moving line', () => {
    const reading = castByNumbers([7, 3], NOW);
    expect(reading.primary.name).toBe('山火賁');
    expect(reading.movingPositions).toEqual([4]);
    expect(reading.changed?.name).toBe('離為火');
    expect(reading.steps[0]).toContain('上卦：7 ÷ 8 取餘 7 → 艮');
  });

  it('treats a remainder of zero as the largest value (坤 and the top line)', () => {
    expect(trigramOf(16).name).toBe('坤');
    expect(movingLineOf(12)).toBe(6);
    expect(movingLineOf(7)).toBe(1);
  });

  it('casts coins from heads counts, with 3 and 0 heads moving', () => {
    const reading = castByCoins([3, 2, 3, 1, 2, 0], NOW);
    expect(reading.primary.name).toBe('水天需');
    expect(reading.movingPositions).toEqual([1, 3, 6]);
    expect(reading.changed?.name).toBe('風水渙');
    expect(reading.lines.map(line => line.kind)).toEqual(['老陽', '少陽', '老陽', '少陰', '少陽', '老陰']);
  });

  it('rejects malformed input instead of guessing', () => {
    expect(() => castByNumbers([1, 2, 3], NOW)).toThrow(RangeError);
    expect(() => castByNumbers([1.5], NOW)).toThrow(RangeError);
    expect(() => castByCoins([1, 2, 3], NOW)).toThrow(RangeError);
    expect(() => castByCoins([1, 2, 3, 4, 0, 0], NOW)).toThrow(RangeError);
  });
});

describe('裝卦：納甲、納支、六親、六神', () => {
  it('reads 乾為天 as 子孫水、妻財寅、父母辰、官鬼午、兄弟申、父母戌 with the palace element as self', () => {
    const reading = castByCoins([2, 2, 2, 2, 2, 2], NOW);
    expect(reading.primary.name).toBe('乾為天');
    expect(reading.lines.map(line => `${line.branch}${line.kin}`)).toEqual(['子子孫', '寅妻財', '辰父母', '午官鬼', '申兄弟', '戌父母']);
    expect(reading.lines.map(line => line.stem)).toEqual(['甲', '甲', '甲', '壬', '壬', '壬']);
  });

  it('uses the corrected 艮 branches (辰午申 inside, 戌子寅 outside)', () => {
    const reading = castByCoins([1, 1, 2, 1, 1, 2], NOW);
    expect(reading.primary.name).toBe('艮為山');
    expect(reading.lines.map(line => line.branch)).toEqual(['辰', '午', '申', '戌', '子', '寅']);
  });

  it('starts 六神 at the day stem: 甲 begins at 青龍, 丙 begins at 朱雀', () => {
    const reading = castByCoins([2, 2, 2, 2, 2, 2], NOW);
    expect(reading.dayStem).toBe('甲');
    expect(reading.lines.map(line => line.god)).toEqual(['青龍', '朱雀', '勾陳', '螣蛇', '白虎', '玄武']);
  });

  it('marks 世 and 應 on the right lines', () => {
    const reading = castByCoins([2, 2, 2, 2, 2, 2], NOW);
    expect(reading.lines.find(line => line.shi)?.position).toBe(6);
    expect(reading.lines.find(line => line.ying)?.position).toBe(3);
  });

  it('uses the 節氣 month and the 子初-based day pillar', () => {
    const reading = castByNumbers([1], NOW);
    expect(reading.monthBranch).toBe('戌');
    expect(reading.dayLabel).toBe('甲子日');
  });
});

describe('旺相休囚死與六親', () => {
  it('ranks the five elements against a 寅 month', () => {
    expect(['木', '火', '水', '金', '土'].map(element => strengthOf(element as '木', '寅'))).toEqual(['旺', '相', '休', '囚', '死']);
  });

  it('ranks the five elements against a 辰 month (土旺)', () => {
    expect(['土', '金', '火', '木', '水'].map(element => strengthOf(element as '土', '辰'))).toEqual(['旺', '相', '休', '囚', '死']);
  });

  it('classifies the six relations by palace element', () => {
    expect(kinOf('金', '金')).toBe('兄弟');
    expect(kinOf('水', '金')).toBe('子孫');
    expect(kinOf('土', '金')).toBe('父母');
    expect(kinOf('木', '金')).toBe('妻財');
    expect(kinOf('火', '金')).toBe('官鬼');
    expect(relationOf('木', '火')).toBe('generates');
  });
});

describe('用神與斷卦', () => {
  it('selects the moving 妻財 line when several lines share the kin, and the 世 line for general', () => {
    // 水天需：妻財見於初爻與上爻，兩爻皆動，取位置在前者。
    const reading = castByCoins([3, 2, 3, 1, 2, 0], NOW);
    expect(selectYong(reading, '妻財')).toMatchObject({ candidates: 2 });
    expect(selectYong(reading, '妻財').line?.position).toBe(1);
    expect(selectYong(reading, '世').line?.position).toBe(reading.primary.shi);
  });

  it('reports 伏藏 when the 用神 kin does not appear on any line', () => {
    // 每個用神六親都對應一個問題方向；找出一個用神六親不上卦的卦。
    const topicByKin: Array<[Topic, '父母' | '子孫' | '妻財' | '官鬼']> = [['contract', '父母'], ['child', '子孫'], ['wealth', '妻財'], ['career', '官鬼']];
    let hidden: { reading: ReturnType<typeof castByNumbers>; topic: Topic } | null = null;
    for (let upper = 1; upper <= 8 && !hidden; upper++) {
      for (let lower = 1; lower <= 8 && !hidden; lower++) {
        const reading = castByNumbers([upper, lower], NOW);
        const match = topicByKin.find(([, kin]) => selectYong(reading, kin).line === null);
        if (match) hidden = { reading, topic: match[0] };
      }
    }
    expect(hidden).not.toBeNull();
    const analysis = analyzeYong(hidden!.reading, hidden!.topic);
    expect(analysis.yong.line).toBeNull();
    expect(analysis.direction).toBeNull();
    expect(interpret(hidden!.reading, analysis).yong).toContain('伏藏');
  });

  it('keeps every topic mapped to a defined 用神', () => {
    for (const topic of Object.keys(TOPIC_YONG) as Topic[]) {
      const reading = castByNumbers([5, 9], NOW);
      expect(analyzeYong(reading, topic).target).toBe(TOPIC_YONG[topic].yong);
    }
  });

  it('flags 六沖 for the pure hexagrams and not for 山火賁', () => {
    expect(castByCoins([2, 2, 2, 2, 2, 2], NOW).clash).toBe(true);
    expect(castByCoins([1, 1, 2, 1, 1, 2], NOW).clash).toBe(true);
    expect(castByNumbers([7, 3], NOW).clash).toBe(false);
  });

  it('shows a 應期 from the 用神 element months', () => {
    const copy = interpret(castByCoins([3, 2, 3, 1, 2, 0], NOW), analyzeYong(castByCoins([3, 2, 3, 1, 2, 0], NOW), 'wealth'));
    expect(copy.timing).toContain('水五行得令之月為子、亥');
  });
});

describe('斷卦文案', () => {
  it('passes the ethics linter for every hexagram, topic and direction it can produce', () => {
    const findings: string[] = [];
    for (let upper = 1; upper <= 8; upper++) {
      for (let lower = 1; lower <= 8; lower++) {
        const reading = castByNumbers([upper, lower], NOW);
        for (const topic of Object.keys(TOPIC_YONG) as Topic[]) {
          const copy = interpret(reading, analyzeYong(reading, topic));
          const text = [copy.structure, copy.yong, copy.moving, copy.changed, copy.overall, copy.timing, copy.topicNote, ...copy.suggestions].join('\n');
          findings.push(...lintCopy(text).map(item => item.match));
        }
      }
    }
    expect(findings).toEqual([]);
  });

  it('keeps the 用神 description consistent with the 旺衰 level', () => {
    const reading = castByCoins([3, 2, 3, 1, 2, 0], NOW);
    const analysis = analyzeYong(reading, 'wealth');
    expect(analysis.level).toBe('weak');
    expect(interpret(reading, analysis).yong).toContain('用神偏弱');
  });
});
