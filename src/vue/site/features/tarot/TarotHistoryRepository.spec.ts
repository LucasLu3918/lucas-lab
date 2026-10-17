import { describe, expect, it } from 'vitest';
import {
  clearTarotHistory,
  exportTarotHistory,
  readTarotHistory,
  saveTarotHistory,
  updateTarotNote,
  type TarotHistoryEntry,
} from './TarotHistoryRepository';

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

function entry(index: number): TarotHistoryEntry {
  return {
    id: `reading-${index}`,
    createdAt: new Date(1_800_000_000_000 + index).toISOString(),
    spread: 'single',
    cards: [{ cardId: 'major-00-the-fool', orientation: 'upright' }],
  };
}

describe('local tarot history', () => {
  it('keeps at most 20 local readings and only stores card metadata', () => {
    const storage = memoryStorage();
    for (let index = 0; index < 22; index++) saveTarotHistory(entry(index), storage);

    const saved = readTarotHistory(storage);
    expect(saved).toHaveLength(20);
    expect(saved[0].id).toBe('reading-21');
    expect(JSON.stringify(saved)).not.toContain('question');
  });

  it('ignores malformed records and can clear the local store', () => {
    const storage = memoryStorage();
    storage.setItem('lucas-lab:tarot-history:v1', JSON.stringify([{ ...entry(1), cards: [{ cardId: 1, orientation: 'sideways' }] }]));
    expect(readTarotHistory(storage)).toEqual([]);

    saveTarotHistory(entry(2), storage);
    clearTarotHistory(storage);
    expect(readTarotHistory(storage)).toEqual([]);
  });

  it('still reads readings saved under the original storage key', () => {
    const storage = memoryStorage();
    storage.setItem('lucas-lab:tarot-history:v1', JSON.stringify([entry(4)]));
    expect(readTarotHistory(storage)).toEqual([entry(4)]);
  });

  it('updates a note without moving the reading, and exports exactly what is stored', () => {
    const storage = memoryStorage();
    saveTarotHistory(entry(1), storage);
    saveTarotHistory(entry(2), storage);
    updateTarotNote('reading-1', '  反思  ', storage);

    const saved = readTarotHistory(storage);
    expect(saved.map(item => item.id)).toEqual(['reading-2', 'reading-1']);
    expect(saved[1].note).toBe('反思');
    expect(JSON.parse(exportTarotHistory(storage))).toEqual(saved);
  });

  it('reads a five-card deep spread from local history without storing questions', () => {
    const storage = memoryStorage();
    const deep: TarotHistoryEntry = {
      ...entry(3),
      spread: 'deep-five',
      cards: Array.from({ length: 5 }, (_, index) => ({ cardId: `card-${index}`, orientation: 'upright' })),
    };
    saveTarotHistory(deep, storage);
    expect(readTarotHistory(storage)[0]).toEqual(deep);
    expect(JSON.stringify(readTarotHistory(storage))).not.toContain('question');
  });
});
