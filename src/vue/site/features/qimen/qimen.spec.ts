import { Solar } from 'lunar-javascript';
import { describe, expect, it } from 'vitest';
import { arrangeDial, chartAt, QIMEN_METHOD_VERSION } from './qimen';

// The worked example in the qimen skill's reference (2002-04-07 08:00, 庚辰時). Its 局數 comes from another 拆補 reading,
// so the test feeds 陽遁6局 directly and checks the dial arrangement, which is the part the example specifies.
describe('arrangeDial (worked example: 陽遁6局, 庚辰時, 旬首甲戌己)', () => {
  const dial = arrangeDial('陽', 6, '庚辰');

  it('lays the 三奇六儀 forward from the 局 palace', () => {
    expect(dial.earth).toEqual({ 1: '壬', 2: '癸', 3: '丁', 4: '丙', 5: '乙', 6: '戊', 7: '己', 8: '庚', 9: '辛' });
  });

  it('puts 己 (the 旬首) at 兌七, so 值符 is 天柱 and 值使 is 驚門', () => {
    expect(dial.fuPalace).toBe(7);
    expect(dial.valueStar).toBe('天柱');
    expect(dial.valueDoor).toBe('驚');
  });

  it('moves 天柱 to 艮八 (庚, the 時干 palace) and 驚門 to 巽四 (辰, the 時支 palace)', () => {
    expect(dial.hourPalace).toBe(8);
    expect(dial.shiPalace).toBe(4);
    expect(dial.palaces.find(p => p.palace === 8)?.star).toBe('天柱');
    expect(dial.palaces.find(p => p.palace === 4)?.door).toBe('驚');
  });
});

describe('chartAt', () => {
  it('labels 2026-10-18 10:00 as 陰遁6局 上元 with 寒露 as the 節氣', () => {
    const chart = chartAt('2026-10-18', '10:00');
    expect(chart.method).toBe(QIMEN_METHOD_VERSION);
    expect(chart.term).toBe('寒露');
    expect(chart.polarity).toBe('陰');
    expect(chart.ju).toBe(6);
    expect(chart.yuan).toBe('上');
    expect(chart.hourGanzhi).toBe('辛巳');
    expect(chart.xunHead).toBe('甲戌旬');
    expect(chart.fuDate).toBe('2026年10月12日');
    expect(chart.fuGanzhi).toBe('己未');
  });

  it('derives 值符天任 and 值使生門 for 2026-10-18 10:00 by hand (己 at 中五, so 寄艮八)', () => {
    const chart = chartAt('2026-10-18', '10:00');
    expect(chart.fuPalace).toBe(5);
    expect(chart.hourPalace).toBe(3);
    expect(chart.shiPalace).toBe(4);
    expect(chart.valueStar).toBe('天任');
    expect(chart.valueDoor).toBe('生');
    expect(chart.starShift).toBe(1);
    expect(chart.doorShift).toBe(2);
  });

  it('switches to 陽遁 after 立春 and reports the exact 節氣 instant', () => {
    const chart = chartAt('2026-02-04', '10:00');
    expect(chart.term).toBe('立春');
    expect(chart.polarity).toBe('陽');
    expect(chart.termInstant).toBe('2026年2月4日 04:02');
  });

  it('rejects a civil date that does not exist', () => {
    expect(() => chartAt('2026-02-30', '10:00')).toThrow(RangeError);
    expect(() => chartAt('2026-10-18', '25:00')).toThrow(RangeError);
  });

  it('matches lunar-javascript for the 符頭 day stem and branch on a span of dates', () => {
    for (let offset = 0; offset < 120; offset += 1) {
      const date = new Date(Date.UTC(2026, 0, 1 + offset * 3));
      const y = date.getUTCFullYear();
      const m = date.getUTCMonth() + 1;
      const d = date.getUTCDate();
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const chart = chartAt(iso, '12:00');
      const lunarDay = Solar.fromYmd(Number(chart.fuDate.slice(0, 4)), Number(chart.fuDate.split('年')[1].split('月')[0]), Number(chart.fuDate.split('月')[1].replace('日', ''))).getLunar().getDayInGanZhiExact2();
      expect(chart.fuGanzhi).toBe(lunarDay);
      expect(['甲', '己']).toContain(chart.fuGanzhi[0]);
    }
  });

  it('keeps the dial invariant: nine 三奇六儀 symbols, eight distinct stars, doors and gods', () => {
    for (const [date, time] of [['2026-10-18', '10:00'], ['2026-02-04', '23:30'], ['2026-06-21', '06:15'], ['2026-12-22', '18:45']]) {
      const chart = chartAt(date, time, 'career');
      expect(new Set(Object.values(chart.earth)).size).toBe(9);
      expect(new Set(chart.palaces.map(p => p.star)).size).toBe(8);
      expect(new Set(chart.palaces.map(p => p.door)).size).toBe(8);
      expect(new Set(chart.palaces.map(p => p.god)).size).toBe(8);
      expect(chart.palaces).toHaveLength(8);
      expect(chart.best.score).toBeGreaterThanOrEqual(chart.worst.score);
    }
  });

  it('applies topic bonuses without changing the dial', () => {
    const general = chartAt('2026-10-18', '10:00', 'general');
    const travel = chartAt('2026-10-18', '10:00', 'travel');
    expect(travel.palaces.map(p => [p.star, p.door, p.god])).toEqual(general.palaces.map(p => [p.star, p.door, p.god]));
    const scoreDiff = travel.palaces.map((p, i) => p.score - general.palaces[i].score);
    expect(scoreDiff.every(diff => diff >= 0 && diff <= 1)).toBe(true);
  });
});
