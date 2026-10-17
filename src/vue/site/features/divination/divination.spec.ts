import { describe, expect, it } from 'vitest';
import { calculateAstrology, createAstrologyForecast } from './astrology';
import { calculateBazi, createBaziForecast } from './bazi';
import { parseCivilDateTime, resolveCivilDateTime } from './timezone';

describe('local divination calculations', () => {
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
    expect(chart.methodVersion).toBe('bazi-local-v1');
    expect(createBaziForecast(chart, 'day', new Date('2026-10-17T04:00:00Z')).evidence.length).toBeGreaterThan(0);
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
    expect(createAstrologyForecast(chart, 'day', new Date('2026-10-17T04:00:00Z')).methodVersion).toBe(chart.methodVersion);
  });
});
