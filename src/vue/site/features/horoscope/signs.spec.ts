import { describe, expect, it } from 'vitest';
import { HOROSCOPE_SIGNS, sunSignFromBirthDate, sunSignFromMonthDay } from './signs';

describe('tropical sun sign boundaries', () => {
  it.each([
    [1, 19, 'capricorn'],
    [1, 20, 'aquarius'],
    [2, 18, 'aquarius'],
    [2, 19, 'pisces'],
    [3, 20, 'pisces'],
    [3, 21, 'aries'],
    [4, 19, 'aries'],
    [4, 20, 'taurus'],
    [5, 20, 'taurus'],
    [5, 21, 'gemini'],
    [6, 20, 'gemini'],
    [6, 21, 'cancer'],
    [7, 22, 'cancer'],
    [7, 23, 'leo'],
    [8, 22, 'leo'],
    [8, 23, 'virgo'],
    [9, 22, 'virgo'],
    [9, 23, 'libra'],
    [10, 22, 'libra'],
    [10, 23, 'scorpio'],
    [11, 21, 'scorpio'],
    [11, 22, 'sagittarius'],
    [12, 21, 'sagittarius'],
    [12, 22, 'capricorn'],
    [12, 31, 'capricorn'],
    [1, 1, 'capricorn'],
  ] as const)('%i/%i is %s', (month, day, sign) => {
    expect(sunSignFromMonthDay(month, day)).toBe(sign);
  });

  it('accepts a birthday string and ignores the year', () => {
    expect(sunSignFromBirthDate('1990-01-19')).toBe('capricorn');
    expect(sunSignFromBirthDate('2000-01-20')).toBe('aquarius');
    expect(sunSignFromBirthDate('1972-02-29')).toBe('pisces');
  });

  it('rejects impossible dates and malformed strings', () => {
    expect(() => sunSignFromMonthDay(2, 30)).toThrow(/不存在/);
    expect(() => sunSignFromMonthDay(13, 1)).toThrow(/不存在/);
    expect(() => sunSignFromMonthDay(4.5, 1)).toThrow(RangeError);
    expect(() => sunSignFromBirthDate('1990/01/20')).toThrow(/YYYY-MM-DD/);
  });

  it('covers all twelve signs with one id each', () => {
    const ids = new Set(HOROSCOPE_SIGNS.map(sign => sign.id));
    expect(ids.size).toBe(12);
  });
});
