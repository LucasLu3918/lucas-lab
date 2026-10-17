import { describe, expect, it } from 'vitest';
import type { GameProgress } from '../application/ports/GameSavePort';
import type { GameStoragePort } from '../application/ports/GameStoragePort';
// @ts-expect-error The legacy save engine is JavaScript without declarations.
import { BACKUP_SAVE_KEY, SAVE_KEY } from '../../../../games/blood-mirror/engine/save.js';
import { BloodMirrorSaveAdapter } from './BloodMirrorSaveAdapter';

function createStorage(): GameStoragePort & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

function progress(): GameProgress<Record<string, unknown>> {
  return {
    state: {
      started: true,
      room: 0,
      unlocked: 0,
      solved: [],
      inventory: [],
      seen: [],
      hints: {},
      stepHints: {},
      clues: [],
      deduced: [],
      choices: {},
      skipped: [],
      glowRooms: [],
      misses: {},
      memories: [],
      shards: [],
      achievements: [],
      endings: [],
      ending: null,
      answers: null,
      elapsed: 42,
      muted: true,
    },
    puzzles: [],
  };
}

describe('BloodMirrorSaveAdapter', () => {
  it('uses the legacy engine to write, read and back up the v2 journey', () => {
    const storage = createStorage();
    const adapter = new BloodMirrorSaveAdapter<Record<string, unknown>>(storage);

    expect(adapter.save(progress())).toBe(true);
    expect(JSON.parse(storage.values.get(SAVE_KEY) ?? '{}').version).toBe(2);
    expect(adapter.backup()).toBe(true);
    expect(storage.values.get(BACKUP_SAVE_KEY)).toBe(storage.values.get(SAVE_KEY));

    const loaded = adapter.load();
    expect(loaded.state.started).toBe(true);
    expect(loaded.state.elapsed).toBe(42);
    expect(loaded.puzzles).toEqual([]);
    expect(loaded).toMatchObject({ migrated: false, recovered: false, newer: false });
  });

  it('reports a blocked storage write without changing save-engine behavior', () => {
    const storage: GameStoragePort = {
      getItem: () => null,
      setItem: () => { throw new Error('storage blocked'); },
    };
    const adapter = new BloodMirrorSaveAdapter<Record<string, unknown>>(storage);

    expect(adapter.save(progress())).toBe(false);
    expect(adapter.backup()).toBe(false);
    expect(adapter.load().state.started).toBe(false);
  });
});
