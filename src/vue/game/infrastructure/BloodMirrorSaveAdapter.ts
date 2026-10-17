import type {
  GameProgress,
  GameSavePort,
  LoadedGameProgress,
} from '../application/ports/GameSavePort';
import type { GameStoragePort } from '../application/ports/GameStoragePort';

// @ts-expect-error The legacy engine is JavaScript without declarations; this adapter contains its untyped boundary.
import { backupSave, loadSave, writeSave } from '../../../../games/blood-mirror/engine/save.js';

type LegacySaveFunctions = {
  load(storage: GameStoragePort): LoadedGameProgress<unknown>;
  backup(storage: GameStoragePort): boolean;
  write(state: unknown, puzzles: string[], storage: GameStoragePort): boolean;
};

const legacySave: LegacySaveFunctions = {
  load: loadSave,
  backup: backupSave,
  write: writeSave,
};

/** Adapts the established Blood Mirror save engine to the Vue application's save port. */
export class BloodMirrorSaveAdapter<State> implements GameSavePort<State> {
  constructor(private readonly storage: GameStoragePort) {}

  load(): LoadedGameProgress<State> {
    return legacySave.load(this.storage) as LoadedGameProgress<State>;
  }

  backup(): boolean {
    return legacySave.backup(this.storage);
  }

  save(progress: GameProgress<State>): boolean {
    return legacySave.write(progress.state, progress.puzzles, this.storage);
  }
}
