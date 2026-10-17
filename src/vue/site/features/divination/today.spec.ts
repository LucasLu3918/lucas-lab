import { describe, expect, it } from 'vitest';
import type { TarotHistoryEntry } from '../tarot/TarotHistoryRepository';
import { parseHoroscopeSign, rememberSign, rememberedSign, todaysDailyDraw } from './today';

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: key => { values.delete(key); },
    clear: () => values.clear(),
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  } as Storage;
}

const daily: TarotHistoryEntry = {
  id: 'daily-1',
  createdAt: '2026-10-17T01:00:00.000Z',
  localDay: '2026-10-17',
  spread: 'daily',
  cards: [{ cardId: 'major-00-the-fool', orientation: 'upright' }],
};

describe('today overview helpers', () => {
  it('finds only a daily draw saved for the same local day', () => {
    const single: TarotHistoryEntry = { ...daily, id: 'single-1', spread: 'single' };
    expect(todaysDailyDraw([single, daily], '2026-10-17')).toBe(daily);
    expect(todaysDailyDraw([daily], '2026-10-18')).toBeUndefined();
    expect(todaysDailyDraw([single], '2026-10-17')).toBeUndefined();
  });

  it('accepts only the twelve known horoscope sign ids', () => {
    expect(parseHoroscopeSign('leo')).toBe('leo');
    expect(parseHoroscopeSign('Leo')).toBeNull();
    expect(parseHoroscopeSign('ophiuchus')).toBeNull();
    expect(parseHoroscopeSign(42)).toBeNull();
  });

  it('remembers the last chosen sign and ignores stored junk', () => {
    const storage = memoryStorage();
    expect(rememberedSign(storage)).toBeNull();
    rememberSign('virgo', storage);
    expect(rememberedSign(storage)).toBe('virgo');
    storage.setItem('lucas-lab:today-sign:v1', 'not-a-sign');
    expect(rememberedSign(storage)).toBeNull();
  });

  it('treats blocked storage as nothing remembered rather than an error', () => {
    const blocked = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    } as unknown as Storage;
    expect(rememberedSign(blocked)).toBeNull();
    expect(() => rememberSign('aries', blocked)).not.toThrow();
    expect(rememberedSign(null)).toBeNull();
  });
});
