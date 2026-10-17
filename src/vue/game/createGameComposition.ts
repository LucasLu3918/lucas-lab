import type { GameSavePort } from './application/ports/GameSavePort';
import { LoadGameProgress } from './application/usecases/LoadGameProgress';
import { SaveGameProgress } from './application/usecases/SaveGameProgress';
import { BloodMirrorSaveAdapter } from './infrastructure/BloodMirrorSaveAdapter';
import { createBrowserGameStorageAdapter } from './infrastructure/BrowserGameStorageAdapter';

export interface GameComposition<State> {
  loadGameProgress: LoadGameProgress<State>;
  saveGameProgress: SaveGameProgress<State>;
}

export interface CreateGameCompositionOptions<State> {
  gameSave?: GameSavePort<State>;
}

/** Wires the browser and legacy save adapters to application use cases. */
export function createGameComposition<State = unknown>(
  options: CreateGameCompositionOptions<State> = {},
): GameComposition<State> {
  const gameSave = options.gameSave
    ?? new BloodMirrorSaveAdapter<State>(createBrowserGameStorageAdapter());

  return {
    loadGameProgress: new LoadGameProgress(gameSave),
    saveGameProgress: new SaveGameProgress(gameSave),
  };
}
