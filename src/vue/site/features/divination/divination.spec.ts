import { describe, expect, it } from 'vitest';
import * as Astronomy from 'astronomy-engine';
import { angleDifference, brentMinimum, calculateAstrology, createAstrologyForecast, geoEclipticLongitude } from './astrology';
import { calculateBazi, createBaziAnnualTimeline, createBaziForecast } from './bazi';
import { TEN_GOD_TEXT } from './bazi-content';
import { BIRTH_PLACES } from './locations';
import { parseCivilDateTime, resolveCivilDateTime } from '../fortune-core/civil-time';

describe('local divination calculations', () => {
  it('keeps the curated location list usable with unique IANA zones', () => {
    expect(new Set(BIRTH_PLACES.map(place => place.id)).size).toBe(BIRTH_PLACES.length);
    expect(BIRTH_PLACES.length).toBeGreaterThanOrEqual(20);
    for (const place of BIRTH_PLACES) {
      expect(() => new Intl.DateTimeFormat('en', { timeZone: place.timeZone })).not.toThrow();
      expect(place.latitude).toBeGreaterThanOrEqual(-66);
      expect(place.latitude).toBeLessThanOrEqual(66);
      expect(place.longitude).toBeGreaterThanOrEqual(-180);
      expect(place.longitude).toBeLessThanOrEqual(180);
    }
  });

  it('rejects impossible and daylight-saving-gap civil times', () => {
    expect(() => parseCivilDateTime('2024-02-30', '12:00')).toThrow(/不存在/);
    const springGap = parseCivilDateTime('2024-03-31', '01:30');
    expect(() => resolveCivilDateTime(springGap, 'Europe/London')).toThrow(/不存在/);
  });

  it('resolves a repeated daylight-saving time using the requested occurrence', () => {
    const repeated = parseCivilDateTime('2024-10-27', '01:30');
    const earlier = resolveCivilDateTime(repeated, 'Europe/London', 'earlier');
    const later = resolveCivilDateTime(repeated, 'Europe/London', 'later');
    expect(later.getTime() - earlier.getTime()).toBe(60 * 60 * 1000);
  });

  it('builds a versioned four-pillar chart and fixed-rule forecasts', () => {
    const chart = calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei' });
    expect(chart.pillars).toHaveLength(4);
    expect(chart.pillars.map(pillar => pillar.label)).toEqual(['年柱', '月柱', '日柱', '時柱']);
    expect(chart.dayMaster).toBe(chart.pillars[2].value[0]);
    expect(chart.methodVersion).toBe('bazi-local-v3');
    expect(chart.inputPrecision).toBe('full');
    expect(createBaziForecast(chart, 'day', new Date('2026-10-17T04:00:00Z')).evidence.length).toBeGreaterThan(0);
    expect(chart.strengthSignals.evidence).toHaveLength(3);
  });

  it('calculates optional DaYun with an explicit traditional rule parameter and school', () => {
    const chart = calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', daYunGender: 1, daYunSchool: 2 });
    expect(chart.daYun?.gender).toBe(1);
    expect(chart.daYun?.school).toBe(2);
    expect(chart.daYun?.startAge.years).toBeGreaterThanOrEqual(0);
    expect(chart.daYun?.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chart.daYun?.cycles.length).toBeGreaterThan(0);
    expect(() => calculateBazi({ birthDate: '1990-06-15', birthTime: '', timeZone: 'Asia/Taipei', timeUnknown: true, daYunGender: 1 })).toThrow(/可靠的出生時間/);
  });

  it('corrects true solar time from longitude and equation of time only when explicitly enabled', () => {
    const civil = calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei' });
    const solar = calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', longitude: 121.5654, trueSolarTime: true });
    expect(civil.solarTime).toBe('civil');
    expect(solar.solarTime).toBe('true');
    expect(solar.solarTimeCorrectionMinutes).toBeGreaterThan(0);
    expect(solar.methodSummary).toContain('真太陽時');
    expect(() => calculateBazi({ birthDate: '1990-06-15', birthTime: '', timeZone: 'Asia/Taipei', timeUnknown: true, longitude: 121.5654, trueSolarTime: true })).toThrow(/可靠的出生時間/);
  });

  it('keeps unknown-time BaZi readings to three pillars and excludes estimated-hour elements', () => {
    const chart = calculateBazi({ birthDate: '1990-06-15', birthTime: '', timeZone: 'Asia/Taipei', timeUnknown: true });
    expect(chart.timeUnknown).toBe(true);
    expect(chart.pillars.map(pillar => pillar.label)).toEqual(['年柱', '月柱', '日柱']);
    expect(Object.values(chart.elementCounts).reduce((sum, count) => sum + count, 0)).toBe(6);
    expect(chart.methodSummary).toContain('僅排三柱');
    expect(chart.inputPrecision).toBe('approximate');
  });

  it('summarizes five elements as missing and leading, consistent with the counts', () => {
    const chart = calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei' });
    const counts = Object.entries(chart.elementCounts);
    const highest = Math.max(...counts.map(([, count]) => count));
    expect(chart.elementSummary.missing).toEqual(counts.filter(([, count]) => count === 0).map(([element]) => element));
    expect(chart.elementSummary.leading).toEqual(counts.filter(([, count]) => count === highest).map(([element]) => element));
    expect(chart.elementSummary.leading.length).toBeGreaterThan(0);
  });

  it('lists the 流年 timeline with year pillars, ten gods and the matching 大運 step', () => {
    const chart = calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', daYunGender: 1, daYunSchool: 1 });
    const timeline = createBaziAnnualTimeline(chart, 2026, 10);
    expect(timeline.map(item => item.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035]);
    // 2026 年為丙午年（立春後）；年中時刻取年柱，不受立春換年影響。
    expect(timeline[0].pillar).toBe('丙午');
    expect(timeline[0].element).toBe('火');
    expect(Object.keys(TEN_GOD_TEXT)).toContain(timeline[0].tenGod);
    for (const item of timeline) {
      expect(item.pillar).toHaveLength(2);
      const cycle = chart.daYun!.cycles.find(cycle => item.year >= cycle.startYear && item.year <= cycle.endYear);
      expect(item.daYunPillar).toBe(cycle?.pillar ?? null);
    }
    expect(createBaziAnnualTimeline(calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei' }), 2026, 1)[0].daYunPillar).toBeNull();
  });

  it('marks clashes and harmonies with a natal branch in either order', () => {
    const chart = calculateBazi({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei' });
    const withYearBranch = (branch: string) => ({ ...chart, pillars: chart.pillars.map((pillar, index) => index === 0 ? { ...pillar, value: `甲${branch}` } : pillar) });
    // 2026 年為午年，2008 年為子年；本命年支分別設為子、午，兩種順序都必須判為六沖。
    const clashNatalZi = createBaziForecast(withYearBranch('子'), 'year', new Date('2026-06-15T04:00:00Z'));
    const clashNatalWu = createBaziForecast(withYearBranch('午'), 'year', new Date('2008-06-15T04:00:00Z'));
    expect(clashNatalZi.evidence.some(item => item.includes('六沖'))).toBe(true);
    expect(clashNatalWu.evidence.some(item => item.includes('六沖'))).toBe(true);
    const timeline = createBaziAnnualTimeline(withYearBranch('子'), 2026, 1);
    expect(timeline[0].branchRelations).toContain('沖年支');
  });

  it('computes planetary placements and hides time-dependent chart points when time is unknown', () => {
    const chart = calculateAstrology({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654 });
    expect(chart.planets).toHaveLength(10);
    expect(chart.planets.every(planet => planet.longitude >= 0 && planet.longitude < 360)).toBe(true);
    expect(chart.ascendant).not.toBeNull();
    expect(chart.planets.every(planet => planet.house !== null)).toBe(true);
    const unknown = calculateAstrology({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654, timeUnknown: true });
    expect(unknown.ascendant).toBeNull();
    expect(unknown.midheaven).toBeNull();
    expect(unknown.planets.every(planet => planet.house === null)).toBe(true);
    expect(chart.inputPrecision).toBe('full');
    expect(unknown.inputPrecision).toBe('approximate');
    expect(createAstrologyForecast(chart, 'day', new Date('2026-10-17T04:00:00Z')).methodVersion).toBe(chart.methodVersion);
    expect(() => calculateAstrology({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'America/Chicago', latitude: 41.8781, longitude: -87.6298 })).not.toThrow();
    expect(() => calculateAstrology({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'America/Chicago', latitude: 67, longitude: -87.6298 })).toThrow(/66 度/);
  });

  it('reports a precisely aligned daily transit and its phase', () => {
    const chart = calculateAstrology({ birthDate: '2026-10-17', birthTime: '12:00', timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654 });
    chart.planets.find(planet => planet.id === 'sun')!.longitude = chart.planets.find(planet => planet.id === 'mercury')!.longitude;
    // 今日掃描未來 24 小時，所以起點設在對齊時刻之前 6 小時，讓精確時刻落在窗口之內。
    const birthMs = new Date(chart.birthInstant).getTime();
    const forecast = createAstrologyForecast(chart, 'day', new Date(birthMs - 6 * 3_600_000));
    const aligned = forecast.events.find(event => event.transit === '水星' && event.natal === '太陽' && event.aspect === '合相');
    expect(aligned?.phase).toBe('精確相位');
    expect(Math.abs(new Date(aligned!.exactAt).getTime() - birthMs)).toBeLessThan(5 * 60_000);
    expect(forecast.methodVersion).toBe(chart.methodVersion);
  });

  it('places daily transit times inside the next 24 hours instead of at the calculation moment', () => {
    const chart = calculateAstrology({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654 });
    const start = new Date('2026-10-17T04:00:00Z');
    const forecast = createAstrologyForecast(chart, 'day', start);
    expect(forecast.events.length).toBeGreaterThan(0);
    for (const event of forecast.events) {
      const exactMs = new Date(event.exactAt).getTime();
      expect(exactMs - start.getTime()).toBeGreaterThanOrEqual(60_000);
      expect(start.getTime() + 24 * 3_600_000 - exactMs).toBeGreaterThanOrEqual(60_000);
    }
    expect(forecast.text).toContain('未來 24 小時');
  });

  it('lists only transit windows whose exact moment falls inside the forecast period', () => {
    const chart = calculateAstrology({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654 });
    const start = new Date('2026-10-17T04:00:00Z');
    const startMs = start.getTime();
    const endMs = startMs + 365 * 24 * 60 * 60 * 1000;
    const forecast = createAstrologyForecast(chart, 'year', start);
    expect(forecast.events.length).toBeGreaterThan(0);
    for (const event of forecast.events) {
      const exactMs = new Date(event.exactAt).getTime();
      expect(exactMs - startMs).toBeGreaterThanOrEqual(60_000);
      expect(endMs - exactMs).toBeGreaterThanOrEqual(60_000);
    }
  });

  it('finds every Moon aspect window that an hourly scan finds', () => {
    // 月亮移動快，逐日取樣曾會跳過六合、四分等較窄的容許帶；以逐時掃描的局部極小值當作對照。
    const chart = calculateAstrology({ birthDate: '1990-06-15', birthTime: '08:30', timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654 });
    const start = new Date('2026-10-17T04:00:00Z');
    const hours = 365 * 24;
    const moonLongitudes = Array.from({ length: hours + 1 }, (_, hour) => geoEclipticLongitude(Astronomy.Body.Moon, new Date(start.getTime() + hour * 3_600_000)));
    const forecast = createAstrologyForecast(chart, 'year', start);
    const moonEvents = forecast.events.filter(event => event.transit === '月亮');
    const aspects = [{ name: '合相', angle: 0, orb: 7 }, { name: '六合', angle: 60, orb: 5 }, { name: '四分相', angle: 90, orb: 6 }, { name: '三分相', angle: 120, orb: 6 }, { name: '對分相', angle: 180, orb: 7 }];
    for (const natal of chart.planets) for (const aspect of aspects) {
      const orbs = moonLongitudes.map(longitude => Math.abs(angleDifference(longitude, natal.longitude) - aspect.angle));
      for (let hour = 1; hour < hours; hour++) {
        const isMinimum = orbs[hour] <= aspect.orb && orbs[hour] <= orbs[hour - 1] && orbs[hour] <= orbs[hour + 1];
        if (!isMinimum) continue;
        const exactMs = start.getTime() + hour * 3_600_000;
        const matched = moonEvents.some(event => event.natal === natal.name && event.aspect === aspect.name && Math.abs(new Date(event.exactAt).getTime() - exactMs) < 2 * 86_400_000);
        expect(matched, `${natal.name} ${aspect.name} at ${new Date(exactMs).toISOString()}`).toBe(true);
      }
    }
  });
});

describe('transit minimum search', () => {
  // 以 60 輪黃金分割作為基準；Brent 方法的收斂容許值為 5 秒，兩者差距應遠小於顯示的分鐘。
  const goldenReference = (valueAt: (ms: number) => number, left: number, right: number) => {
    const ratio = (Math.sqrt(5) - 1) / 2;
    let lower = right - ratio * (right - left);
    let upper = left + ratio * (right - left);
    let lowerValue = valueAt(lower);
    let upperValue = valueAt(upper);
    for (let pass = 0; pass < 60; pass++) {
      if (lowerValue <= upperValue) {
        right = upper; upper = lower; upperValue = lowerValue;
        lower = right - ratio * (right - left); lowerValue = valueAt(lower);
      } else {
        left = lower; lower = upper; lowerValue = upperValue;
        upper = left + ratio * (right - left); upperValue = valueAt(upper);
      }
    }
    return (left + right) / 2;
  };

  it('finds the minimum of a smooth bowl and of a V-shaped orb within the tolerance', () => {
    const origin = Date.UTC(2026, 9, 17);
    const bowl = (ms: number) => (ms - origin - 9.5 * 3_600_000) ** 2;
    const vee = (ms: number) => Math.abs(ms - origin - 17.25 * 3_600_000);
    expect(Math.abs(brentMinimum(bowl, origin, origin + 24 * 3_600_000) - (origin + 9.5 * 3_600_000))).toBeLessThan(5_000);
    expect(Math.abs(brentMinimum(vee, origin, origin + 24 * 3_600_000) - (origin + 17.25 * 3_600_000))).toBeLessThan(5_000);
  });

  it('agrees with a 60-pass golden-section search on real Moon and Mars orb curves', () => {
    const start = Date.UTC(2026, 9, 17, 4);
    const cases = [
      { body: Astronomy.Body.Moon, natal: 40, angle: 120 },
      { body: Astronomy.Body.Moon, natal: 201, angle: 90 },
      { body: Astronomy.Body.Mars, natal: 310, angle: 0 },
      { body: Astronomy.Body.Mars, natal: 95, angle: 180 },
    ];
    for (const item of cases) {
      const orbAt = (ms: number) => Math.abs(angleDifference(geoEclipticLongitude(item.body, new Date(ms)), item.natal) - item.angle);
      for (let index = 0; index < 60; index++) {
        const left = start + index * 12 * 3_600_000 * 2;
        const right = left + 24 * 3_600_000;
        const brent = brentMinimum(orbAt, left, right);
        const reference = goldenReference(orbAt, left, right);
        expect(Math.abs(brent - reference)).toBeLessThan(15_000);
      }
    }
  });
});
