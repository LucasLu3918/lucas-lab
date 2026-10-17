import type { GameSavePort, LoadedGameProgress } from '../ports/GameSavePort';

export interface LoadGameProgressResult<State> {
  progress: LoadedGameProgress<State>;
  saveBlocked: boolean;
}

/** Restores a journey and completes the existing backup and one-time normalization lifecycle. */
export class LoadGameProgress<State> {
  constructor(private readonly gameSave: GameSavePort<State>) {}

  execute(): LoadGameProgressResult<State> {
    const progress = this.gameSave.load();

    if (progress.newer) {
      return { progress, saveBlocked: true };
    }

    if (!progress.recovered) this.gameSave.backup();
    if (progress.migrated || progress.recovered) this.gameSave.save(progress);

    return { progress, saveBlocked: false };
  }
}
