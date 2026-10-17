import { describe, expect, it } from 'vitest';
import { createLocalHistory } from './local-history';

interface Note { id: string; text: string }

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => { map.delete(key); },
    setItem: (key: string, value: string) => { map.set(key, value); },
  } as Storage;
}

const isNote = (value: unknown): value is Note => {
  const note = value as Partial<Note>;
  return typeof note?.id === 'string' && typeof note?.text === 'string';
};

function createHistory(storage: Storage | null, limit = 2) {
  return createLocalHistory<Note>({ key: 'test-notes', version: 1, limit, isEntry: isNote, storage: () => storage });
}

describe('local history', () => {
  it('saves newest first and trims to the limit', () => {
    const history = createHistory(memoryStorage());
    history.save({ id: 'a', text: '1' });
    history.save({ id: 'b', text: '2' });
    const saved = history.save({ id: 'c', text: '3' });
    expect(saved.map(entry => entry.id)).toEqual(['c', 'b']);
    expect(history.read().map(entry => entry.id)).toEqual(['c', 'b']);
  });

  it('drops corrupted or invalid entries when reading', () => {
    const storage = memoryStorage();
    storage.setItem('lucas-lab:test-notes:v1', JSON.stringify([{ id: 'ok', text: 'x' }, { nope: true }]));
    expect(createHistory(storage).read()).toEqual([{ id: 'ok', text: 'x' }]);
    storage.setItem('lucas-lab:test-notes:v1', '{not json');
    expect(createHistory(storage).read()).toEqual([]);
  });

  it('removes one entry and clears everything on request', () => {
    const history = createHistory(memoryStorage());
    history.save({ id: 'a', text: '1' });
    history.save({ id: 'b', text: '2' });
    expect(history.remove('a').map(entry => entry.id)).toEqual(['b']);
    history.clear();
    expect(history.read()).toEqual([]);
  });

  it('exports the current entries as JSON for the user', () => {
    const history = createHistory(memoryStorage());
    history.save({ id: 'a', text: '1' });
    expect(JSON.parse(history.exportJson())).toEqual([{ id: 'a', text: '1' }]);
  });

  it('degrades to empty behaviour when storage is unavailable or throws', () => {
    const throwing = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } } as unknown as Storage;
    const unavailable = createHistory(null);
    expect(unavailable.read()).toEqual([]);
    expect(unavailable.save({ id: 'a', text: '1' })).toEqual([]);
    expect(createHistory(throwing).read()).toEqual([]);
    expect(() => createHistory(throwing).clear()).not.toThrow();
  });
});
