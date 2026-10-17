import { describe, expect, it } from 'vitest';
import { dailySeed, hashSeed, pickSeeded, seededRandom, secureRandomInt } from './rng';

describe('seeded randomness', () => {
  it('hashes the same parts to the same 32-bit seed and separates different parts', () => {
    expect(hashSeed('2026-10-17', 'aries')).toBe(hashSeed('2026-10-17', 'aries'));
    expect(hashSeed('2026-10-17', 'aries')).not.toBe(hashSeed('2026-10-18', 'aries'));
    // Parts are joined with '|', so the split point matters only when the separator is absent from the text.
    expect(hashSeed('ab', 'c')).not.toBe(hashSeed('a', 'bc'));
    expect(hashSeed('x')).toBeGreaterThanOrEqual(0);
    expect(hashSeed('x')).toBeLessThan(2 ** 32);
  });

  it('produces a reproducible sequence in [0, 1) from a seed', () => {
    const first = seededRandom(42);
    const second = seededRandom(42);
    const a = Array.from({ length: 5 }, () => first());
    const b = Array.from({ length: 5 }, () => second());
    expect(a).toEqual(b);
    expect(a.every(value => value >= 0 && value < 1)).toBe(true);
  });

  it('keeps the daily seed stable within a day and changes across days', () => {
    expect(dailySeed('2026-10-17', 'horoscope', 'aries', 'day')).toBe(dailySeed('2026-10-17', 'horoscope', 'aries', 'day'));
    expect(dailySeed('2026-10-17', 'horoscope', 'aries', 'day')).not.toBe(dailySeed('2026-10-18', 'horoscope', 'aries', 'day'));
  });

  it('picks the same item for the same seed and rejects empty lists', () => {
    const items = ['a', 'b', 'c', 'd'] as const;
    expect(pickSeeded(items, 7)).toBe(pickSeeded(items, 7));
    expect(items).toContain(pickSeeded(items, 99));
    expect(() => pickSeeded([] as string[], 1)).toThrow(RangeError);
  });
});

describe('secure randomness', () => {
  it('returns integers within [0, limit) using the provided crypto source', () => {
    const fakeCrypto = { getRandomValues: (array: Uint32Array) => { array[0] = 4_000_000_000; return array; } };
    const value = secureRandomInt(10, fakeCrypto as Crypto);
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThan(10);
  });

  it('rejects biased samples and draws again', () => {
    const samples = [4_294_967_295, 3];
    const fakeCrypto = { getRandomValues: (array: Uint32Array) => { array[0] = samples.shift()!; return array; } };
    expect(secureRandomInt(5, fakeCrypto as Crypto)).toBe(3);
  });

  it('refuses to fall back to weak randomness when no crypto source exists', () => {
    expect(() => secureRandomInt(5, null)).toThrow(/安全亂數/);
  });
});
