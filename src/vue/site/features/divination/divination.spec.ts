import { describe, expect, it } from 'vitest';
import { calculateAstrology, createAstrologyForecast } from './astrology';
import { calculateBazi, createBaziForecast } from './bazi';
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
    expect(chart.methodVersion).toBe('bazi-local-v2');
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
    const forecast = createAstrologyForecast(chart, 'day', new Date(chart.birthInstant));
    expect(forecast.events.some(event => event.transit === '水星' && event.natal === '太陽' && event.aspect === '合相' && event.phase === '精確相位')).toBe(true);
    expect(forecast.methodVersion).toBe(chart.methodVersion);
  });
});
