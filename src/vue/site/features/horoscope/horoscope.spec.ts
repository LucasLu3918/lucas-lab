import { describe, expect, it } from 'vitest';
import { createDailyHoroscope, HOROSCOPE_DIMENSIONS, HOROSCOPE_PACK, localDayKey } from './horoscope';

describe('daily horoscope selection', () => {
  it('returns the same reading for the same local day and sign', () => {
    const first = createDailyHoroscope('2026-10-17', 'leo');
    const second = createDailyHoroscope('2026-10-17', 'leo');
    expect(second).toEqual(first);
  });

  it('varies the reading across signs and across days', () => {
    const leo = JSON.stringify(createDailyHoroscope('2026-10-17', 'leo').sections);
    const virgo = JSON.stringify(createDailyHoroscope('2026-10-17', 'virgo').sections);
    const nextDay = JSON.stringify(createDailyHoroscope('2026-10-18', 'leo').sections);
    expect(virgo).not.toBe(leo);
    expect(nextDay).not.toBe(leo);
  });

  it('returns five dimensions in the agreed order with non-empty text', () => {
    const reading = createDailyHoroscope('2026-10-17', 'pisces');
    expect(reading.sections.map(section => section.id)).toEqual(HOROSCOPE_DIMENSIONS.map(dimension => dimension.id));
    expect(reading.sections.map(section => section.title)).toEqual(['整體', '感情', '事業', '財務', '健康']);
    for (const section of reading.sections) expect(section.text.length).toBeGreaterThan(20);
  });

  it('keeps lucky numbers in 1 through 9 and records method and content versions', () => {
    for (let day = 1; day <= 28; day++) {
      const reading = createDailyHoroscope(`2026-10-${String(day).padStart(2, '0')}`, 'scorpio');
      expect(reading.lucky.number).toBeGreaterThanOrEqual(1);
      expect(reading.lucky.number).toBeLessThanOrEqual(9);
      expect(Number.isInteger(reading.lucky.number)).toBe(true);
    }
    const reading = createDailyHoroscope('2026-10-17', 'aries');
    expect(reading.methodVersion).toBe('horoscope-daily-v1');
    expect(reading.contentVersion).toBe(HOROSCOPE_PACK.contentVersion);
  });

  it('rejects malformed local days', () => {
    expect(() => createDailyHoroscope('2026/10/17', 'aries')).toThrow(/YYYY-MM-DD/);
  });

  it('formats the local calendar day from the reader clock', () => {
    expect(localDayKey(new Date(2026, 9, 7, 23, 30))).toBe('2026-10-07');
  });
});
