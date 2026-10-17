/** Data returned by the existing game save engine after validation and migration. */
export interface LoadedGameProgress<State> {
  state: State;
  puzzles: string[];
  migrated: boolean;
  recovered: boolean;
  newer: boolean;
}

/** The state snapshot and puzzle completion IDs persisted together by Blood Mirror. */
export interface GameProgress<State> {
  state: State;
  puzzles: string[];
}

export interface GameSavePort<State> {
  load(): LoadedGameProgress<State>;
  backup(): boolean;
  save(progress: GameProgress<State>): boolean;
}

export type SaveGameProgressResult =
  | { status: 'saved' }
  | { status: 'storage-unavailable' }
  | { status: 'blocked-newer-version' };
