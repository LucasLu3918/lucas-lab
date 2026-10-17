import { describe, expect, it } from 'vitest';
import {
  NUMEROLOGY_METHOD_VERSION,
  birthdayNumber,
  calculateNumerology,
  lifePathNumber,
  nameNumbers,
  personalDay,
  personalMonth,
  personalYear,
  reduceNumber,
} from './numerology';

describe('reduction with master numbers', () => {
  it('reduces to a digit and keeps 11, 22 and 33', () => {
    expect(reduceNumber(1990)).toBe(1);
    expect(reduceNumber(13)).toBe(4);
    expect(reduceNumber(29)).toBe(11);
    expect(reduceNumber(22)).toBe(22);
    expect(reduceNumber(33)).toBe(33);
    expect(reduceNumber(39)).toBe(3);
  });
});

describe('date-based numbers', () => {
  it('calculates Life Path from separately reduced year, month and day', () => {
    const reading = lifePathNumber('1990-06-15');
    expect(reading.value).toBe(4);
    expect(reading.steps).toContain('月 6 → 6');
    expect(reading.steps).toContain('日 15 → 6');
    expect(reading.steps).toContain('年 1990 → 19 → 10 → 1');
  });

  it('reads Birthday Number from the day and keeps a master day', () => {
    expect(birthdayNumber('1990-06-15').value).toBe(6);
    expect(birthdayNumber('1992-08-11').value).toBe(11);
  });

  it('matches the worked Personal Year example for June 15 in 2026', () => {
    expect(personalYear('1990-06-15', 2026).value).toBe(4);
  });

  it('builds Personal Month and Personal Day from the cycle above them', () => {
    const year = personalYear('1990-06-15', 2026).value;
    const month = personalMonth(year, 10);
    expect(month.value).toBe(5);
    expect(personalDay(month.value, 17).value).toBe(4);
  });

  it('rejects impossible birth dates through the shared civil-time parser', () => {
    expect(() => lifePathNumber('1990-02-30')).toThrow(RangeError);
  });
});

describe('name-based numbers', () => {
  it('matches the worked JOHN SMITH example and the verification check', () => {
    const name = nameNumbers('John Smith');
    expect(name.expression.value).toBe(8);
    expect(name.soulUrge?.value).toBe(6);
    expect(name.personality.value).toBe(11);
    expect(name.verified).toBe(true);
  });

  it('treats Y as a consonant by default and lets the caller opt in to vowel handling', () => {
    expect(nameNumbers('Lynn').soulUrge).toBeNull();
    expect(nameNumbers('Lynn', { yAsVowel: true }).soulUrge?.value).toBe(7);
  });

  it('removes diacritics and ignores spaces, hyphens and apostrophes', () => {
    expect(nameNumbers("José Núñez").expression.value).toBe(nameNumbers('JOSE NUNEZ').expression.value);
    expect(nameNumbers("O'Brien-Smith").verified).toBe(true);
  });

  it('refuses non-Latin names with guidance in Chinese', () => {
    expect(() => nameNumbers('陳怡君')).toThrow(/英文/);
    expect(() => nameNumbers('   ')).toThrow(/英文/);
  });
});

describe('full report', () => {
  it('returns a versioned envelope with precision based on whether a name was given', () => {
    const withName = calculateNumerology({ birthDate: '1990-06-15', asOfDate: '2026-10-17', fullName: 'John Smith' });
    expect(withName.methodVersion).toBe(NUMEROLOGY_METHOD_VERSION);
    expect(withName.inputPrecision).toBe('full');
    expect(withName.data.name?.expression.value).toBe(8);

    const dateOnly = calculateNumerology({ birthDate: '1990-06-15', asOfDate: '2026-10-17' });
    expect(dateOnly.inputPrecision).toBe('approximate');
    expect(dateOnly.data.name).toBeUndefined();
    expect(dateOnly.data.personalDay.value).toBe(4);
  });
});
