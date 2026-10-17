import type { GameProgress, GameSavePort, SaveGameProgressResult } from '../ports/GameSavePort';

export interface SaveGameProgressOptions {
  /** Set when loading detected a save written by a newer application version. */
  saveBlocked: boolean;
}

/** Persists a journey only when the loaded save is safe to update. */
export class SaveGameProgress<State> {
  constructor(private readonly gameSave: GameSavePort<State>) {}

  execute(progress: GameProgress<State>, options: SaveGameProgressOptions): SaveGameProgressResult {
    if (options.saveBlocked) return { status: 'blocked-newer-version' };

    return this.gameSave.save(progress)
      ? { status: 'saved' }
      : { status: 'storage-unavailable' };
  }
}
