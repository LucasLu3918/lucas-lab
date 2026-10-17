import { describe, expect, it } from 'vitest';
import { isReadonly } from 'vue';
import { useGameProgress } from './useGameProgress';
import type {
  GameProgress,
  GameSavePort,
  LoadedGameProgress,
} from './application/ports/GameSavePort';
import { createGameComposition } from './createGameComposition';

function createSavePort(options: {
  loaded?: Partial<LoadedGameProgress<{ started: boolean }> | null>;
  saveResult?: boolean;
  loadError?: Error;
} = {}): GameSavePort<{ started: boolean }> {
  const loaded: LoadedGameProgress<{ started: boolean }> = {
    state: { started: true },
    puzzles: ['prologue'],
    migrated: false,
    recovered: false,
    newer: false,
    ...options.loaded,
  };

  return {
    load: () => {
      if (options.loadError) throw options.loadError;
      return loaded;
    },
    backup: () => true,
    save: (_progress: GameProgress<{ started: boolean }>) => options.saveResult ?? true,
  };
}

describe('useGameProgress', () => {
  it('loads progress and exposes read-only refs with an explicit save action', () => {
    const game = useGameProgress(createGameComposition({ gameSave: createSavePort() }));

    expect(game.progress.value?.state).toEqual({ started: true });
    expect(game.progress.value?.puzzles).toEqual(['prologue']);
    expect(game.status.value).toBe('ready');
    expect(game.saveProgress({ state: { started: true }, puzzles: ['prologue'] }))
      .toEqual({ status: 'saved' });
    expect(game.status.value).toBe('saved');
    expect(isReadonly(game.progress)).toBe(true);
  });

  it('keeps writes blocked for a save from a newer version', () => {
    const game = useGameProgress(createGameComposition({
      gameSave: createSavePort({ loaded: { newer: true } }),
    }));

    expect(game.status.value).toBe('newer-version');
    expect(game.saveBlocked.value).toBe(true);
    expect(game.saveProgress({ state: { started: true }, puzzles: [] }))
      .toEqual({ status: 'blocked-newer-version' });
  });

  it('reports storage failure without throwing', () => {
    const game = useGameProgress(createGameComposition({
      gameSave: createSavePort({ saveResult: false }),
    }));

    expect(game.saveProgress({ state: { started: true }, puzzles: [] }))
      .toEqual({ status: 'storage-unavailable' });
    expect(game.status.value).toBe('storage-unavailable');
  });

  it('reports a load failure while leaving progress unavailable', () => {
    const game = useGameProgress(createGameComposition({
      gameSave: createSavePort({ loadError: new Error('storage read failed') }),
    }));

    expect(game.progress.value).toBeNull();
    expect(game.status.value).toBe('load-failed');
  });
});
