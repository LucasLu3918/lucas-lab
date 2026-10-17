import { computed, shallowRef, type ComputedRef } from 'vue';
import type { GameProgress, LoadedGameProgress, SaveGameProgressResult } from './application/ports/GameSavePort';
import { createGameComposition, type GameComposition } from './createGameComposition';

export type GameProgressStatus =
  | 'ready'
  | 'newer-version'
  | 'load-failed'
  | SaveGameProgressResult['status'];

export interface UseGameProgressResult<State> {
  progress: ComputedRef<LoadedGameProgress<State> | null>;
  status: ComputedRef<GameProgressStatus>;
  saveBlocked: ComputedRef<boolean>;
  saveProgress(progress: GameProgress<State>): SaveGameProgressResult;
}

/** Loads the saved journey and exposes read-only progress plus an explicit save action. */
export function useGameProgress<State = unknown>(
  composition: GameComposition<State> = createGameComposition<State>(),
): UseGameProgressResult<State> {
  const progress = shallowRef<LoadedGameProgress<State> | null>(null);
  const status = shallowRef<GameProgressStatus>('ready');
  const saveBlocked = shallowRef(false);

  try {
    const loaded = composition.loadGameProgress.execute();
    progress.value = loaded.progress;
    saveBlocked.value = loaded.saveBlocked;
    if (loaded.saveBlocked) status.value = 'newer-version';
  } catch {
    status.value = 'load-failed';
  }

  function saveProgress(nextProgress: GameProgress<State>): SaveGameProgressResult {
    const result = composition.saveGameProgress.execute(nextProgress, {
      saveBlocked: saveBlocked.value,
    });
    status.value = result.status;
    return result;
  }

  return {
    progress: computed(() => progress.value),
    status: computed(() => status.value),
    saveBlocked: computed(() => saveBlocked.value),
    saveProgress,
  };
}
