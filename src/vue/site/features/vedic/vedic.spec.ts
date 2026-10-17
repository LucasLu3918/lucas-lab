import { describe, expect, it } from 'vitest';
import { lintCopy } from '../fortune-core/ethics';
import {
  antardashasOf, calculateVedicReport, lahiriAyanamsa, mahadashaSequence, nakshatraAt, NAKSHATRA_SPAN, VEDIC_METHOD_VERSION, type DashaPeriod,
} from './vedic';
import { chartParagraphs } from './interpretation';
import { DASHA_ORDER, DASHA_TOTAL_YEARS, GRAHAS, NAKSHATRAS } from './vedic-data';

const TAIPEI = { timeZone: 'Asia/Taipei', latitude: 25.033, longitude: 121.5654 };
const AS_OF = new Date('2026-10-18T04:00:00Z');

describe('Lahiri ayanamsa', () => {
  it('matches the published Lahiri value at J2000.0 and extrapolates the precession rate', () => {
    expect(lahiriAyanamsa(new Date('2000-01-01T12:00:00Z'))).toBeCloseTo(23.8531, 3);
    expect(lahiriAyanamsa(new Date('2026-10-18T00:00:00Z'))).toBeCloseTo(24.227, 2);
  });

  it('puts the Sun into sidereal Mesha on the Mesha Sankranti day of 2026 (14 April, Taipei)', () => {
    const before = calculateVedicReport({ birthDate: '2026-04-13', birthTime: '06:00', ...TAIPEI }, AS_OF).data;
    const after = calculateVedicReport({ birthDate: '2026-04-15', birthTime: '06:00', ...TAIPEI }, AS_OF).data;
    expect(before.grahas[0].sign).toContain('Meena');
    expect(after.grahas[0].sign).toContain('Mesha');
  });
});

describe('nakshatra segmentation', () => {
  it('splits the zodiac into 27 spans of 13°20′ and four padas of 3°20′ each', () => {
    expect(NAKSHATRA_SPAN).toBeCloseTo(13 + 1 / 3, 10);
    expect(nakshatraAt(0)).toMatchObject({ index: 0, pada: 1 });
    expect(nakshatraAt(NAKSHATRA_SPAN + 0.01)).toMatchObject({ index: 1, pada: 1 });
    expect(nakshatraAt(359.999)).toMatchObject({ index: 26, pada: 4 });
    expect(nakshatraAt(0.5).nearBoundary).toBe(true);
    expect(nakshatraAt(6).nearBoundary).toBe(false);
  });

  it('assigns the traditional ruling planets in the nine-planet cycle', () => {
    const lord = (name: string) => NAKSHATRAS.find(item => item.name === name)?.lord;
    expect(lord('Ashvini')).toBe('ketu');
    expect(lord('Rohini')).toBe('moon');
    expect(lord('Ardra')).toBe('rahu');
    expect(lord('Pushya')).toBe('saturn');
    expect(lord('Ashlesha')).toBe('mercury');
    expect(lord('Revati')).toBe('mercury');
    NAKSHATRAS.forEach((item, index) => expect(item.lord).toBe(DASHA_ORDER[index % DASHA_ORDER.length]));
  });
});

describe('Vimshottari dasha', () => {
  it('sums to 120 years over the nine planets in traditional order', () => {
    const total = DASHA_ORDER.reduce((sum, id) => sum + GRAHAS[id].years, 0);
    expect(total).toBe(DASHA_TOTAL_YEARS);
    expect(DASHA_ORDER).toHaveLength(9);
  });

  it('starts a full Ketu period at birth when the Moon is at the start of Ashvini', () => {
    const birth = new Date('2000-01-01T00:00:00Z');
    const { periods, birthLord, remainingYears } = mahadashaSequence(birth, 0, new Date('2000-06-01T00:00:00Z'));
    expect(birthLord).toBe('ketu');
    expect(remainingYears).toBeCloseTo(7, 10);
    expect(periods[0].planet).toBe('ketu');
    expect(periods[0].startAt).toBe(birth.toISOString());
  });

  it('keeps only the elapsed-fraction balance at birth (half way through a nakshatra = half the lord period)', () => {
    const birth = new Date('1990-06-15T00:00:00Z');
    const moon = (NAKSHATRA_SPAN / 2) + NAKSHATRA_SPAN * 3; // mid-Rohini, lord moon (10 years)
    const { birthLord, remainingYears, periods } = mahadashaSequence(birth, moon, new Date('1990-07-01T00:00:00Z'));
    expect(birthLord).toBe('moon');
    expect(remainingYears).toBeCloseTo(5, 10);
    const first = periods[0];
    // The virtual start sits half a moon period before birth, so the period ends 5 years after birth.
    expect(Date.parse(first.endAt) - birth.getTime()).toBeCloseTo(5 * 365.25 * 86_400_000, -3);
  });

  it('subdivides each mahadasha in the same cycle, starting with its own planet, in proportion to 120 years', () => {
    const startAt = '2013-03-14T00:00:00Z';
    const mahadasha: DashaPeriod = { planet: 'saturn', startAt, endAt: new Date(Date.parse(startAt) + 19 * 365.25 * 86_400_000).toISOString(), years: 19 };
    const sub = antardashasOf(mahadasha);
    expect(sub[0].planet).toBe('saturn');
    expect(sub.map(item => item.planet)).toEqual([...DASHA_ORDER.slice(DASHA_ORDER.indexOf('saturn')), ...DASHA_ORDER.slice(0, DASHA_ORDER.indexOf('saturn'))]);
    const total = sub.reduce((sum, item) => sum + item.years, 0);
    expect(total).toBeCloseTo(19, 8);
    expect(sub[0].years).toBeCloseTo(19 * 19 / 120, 8);
    expect(Math.abs(Date.parse(sub.at(-1)!.endAt) - Date.parse(mahadasha.endAt))).toBeLessThan(1000);
  });
});

describe('calculateVedicReport', () => {
  it('pins the sample chart: Moon in Shatabhisha with a Rahu birth lord and a current Saturn mahadasha', () => {
    const result = calculateVedicReport({ birthDate: '1990-06-15', birthTime: '08:00', ...TAIPEI }, AS_OF);
    const chart = result.data;
    expect(result.methodVersion).toBe(VEDIC_METHOD_VERSION);
    expect(result.inputPrecision).toBe('full');
    expect(chart.moon.nakshatra.name).toBe('Shatabhisha');
    expect(chart.moon.pada).toBe(3);
    expect(chart.dasha.birthLord).toBe('rahu');
    expect(chart.dasha.remainingYears).toBeCloseTo(6.75, 1);
    expect(chart.dasha.current.planet).toBe('saturn');
    expect(chart.dasha.current.startAt.startsWith('2013-03')).toBe(true);
    expect(chart.dasha.upcoming.map(item => item.planet)).toEqual(['mercury', 'ketu', 'venus', 'sun']);
    expect(chart.lagna).not.toBeNull();
  });

  it('places Rahu and Ketu exactly opposite and keeps every graha within the twelve houses', () => {
    const chart = calculateVedicReport({ birthDate: '1990-06-15', birthTime: '08:00', ...TAIPEI }, AS_OF).data;
    const rahu = chart.grahas.find(item => item.id === 'rahu')!;
    const ketu = chart.grahas.find(item => item.id === 'ketu')!;
    expect(Math.abs(rahu.longitude - ketu.longitude)).toBeCloseTo(180, 6);
    for (const graha of chart.grahas) {
      expect(graha.house).toBeGreaterThanOrEqual(1);
      expect(graha.house).toBeLessThanOrEqual(12);
    }
    expect((rahu.house! - ketu.house! + 12) % 12).toBe(6);
  });

  it('marks the Sun and Moon as direct and the nodes as not retrograde', () => {
    const chart = calculateVedicReport({ birthDate: '1990-06-15', birthTime: '08:00', ...TAIPEI }, AS_OF).data;
    expect(chart.grahas.find(item => item.id === 'sun')!.retrograde).toBe(false);
    expect(chart.grahas.find(item => item.id === 'moon')!.retrograde).toBe(false);
    expect(chart.grahas.find(item => item.id === 'rahu')!.retrograde).toBe(false);
  });

  it('hides the ascendant and the houses when the birth time is unknown, and marks the result approximate', () => {
    const result = calculateVedicReport({ birthDate: '1990-06-15', birthTime: '08:00', ...TAIPEI, timeUnknown: true }, AS_OF);
    expect(result.inputPrecision).toBe('approximate');
    expect(result.data.lagna).toBeNull();
    expect(result.data.grahas.every(item => item.house === null)).toBe(true);
  });

  it('rejects latitudes beyond 66° only when the ascendant is calculated', () => {
    expect(() => calculateVedicReport({ birthDate: '1990-06-15', birthTime: '08:00', timeZone: 'Asia/Taipei', latitude: 70, longitude: 0 }, AS_OF))
      .toThrow(RangeError);
    expect(() => calculateVedicReport({ birthDate: '1990-06-15', birthTime: '08:00', timeZone: 'Asia/Taipei', latitude: 70, longitude: 0, timeUnknown: true }, AS_OF))
      .not.toThrow();
  });

  it('rejects impossible dates and times', () => {
    expect(() => calculateVedicReport({ birthDate: '1990-02-30', birthTime: '08:00', ...TAIPEI }, AS_OF)).toThrow(RangeError);
    expect(() => calculateVedicReport({ birthDate: '1990-06-15', birthTime: '25:00', ...TAIPEI }, AS_OF)).toThrow(RangeError);
  });
});

describe('interpretation copy', () => {
  it('passes the shared ethics linter for a range of charts', () => {
    const samples = [
      { birthDate: '1990-06-15', birthTime: '08:00' },
      { birthDate: '1975-12-01', birthTime: '23:30' },
      { birthDate: '2004-03-21', birthTime: '04:10' },
    ];
    for (const sample of samples) {
      const chart = calculateVedicReport({ ...sample, ...TAIPEI }, AS_OF).data;
      for (const paragraph of chartParagraphs(chart)) expect(lintCopy(paragraph)).toEqual([]);
    }
  });
});
