import { describe, expect, it } from 'vitest';
import { createGameComposition } from './createGameComposition';
import type { GameProgress, GameSavePort, LoadedGameProgress } from './application/ports/GameSavePort';

function createSavePort(): GameSavePort<{ started: boolean }> {
  const loaded: LoadedGameProgress<{ started: boolean }> = {
    state: { started: true },
    puzzles: ['prologue'],
    migrated: false,
    recovered: false,
    newer: false,
  };

  return {
    load: () => loaded,
    backup: () => true,
    save: (_progress: GameProgress<{ started: boolean }>) => true,
  };
}

describe('createGameComposition', () => {
  it('connects the supplied save port to load and save use cases', () => {
    const game = createGameComposition({ gameSave: createSavePort() });

    expect(game.loadGameProgress.execute().progress).toMatchObject({
      state: { started: true },
      puzzles: ['prologue'],
    });
    expect(game.saveGameProgress.execute({
      state: { started: true },
      puzzles: ['prologue'],
    }, { saveBlocked: false })).toEqual({ status: 'saved' });
  });

  it('creates the browser-backed save composition by default', () => {
    const game = createGameComposition();

    expect(game.loadGameProgress.execute().progress).toMatchObject({
      state: expect.any(Object),
      puzzles: [],
      newer: false,
    });
  });
});
