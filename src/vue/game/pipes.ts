export type PipeKind = 'straight' | 'elbow';

export type PipeTileSnapshot = {
  at: number;
  type: PipeKind;
  rotation: number;
  directions: string[];
  flowing: boolean;
};

export type PipesSnapshot = {
  tiles: PipeTileSnapshot[];
  flowingCells: number[];
  connectedPipes: number;
  solved: boolean;
  leak: { at: number; direction: string } | null;
  status: string;
  explanation: string;
  hintText: string;
  hintCount: number;
  hintLimit: number;
  canUndo: boolean;
};

export type PipesAction =
  | { type: 'rotate'; index: number }
  | { type: 'undo' }
  | { type: 'reset' }
  | { type: 'hint' }
  | { type: 'confirm' };

const record = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function parsePipesSnapshot(value: unknown): PipesSnapshot | null {
  if (!record(value)) return null;
  const snapshot = value as Partial<PipesSnapshot>;
  const validLeak = snapshot.leak === null || (record(snapshot.leak)
    && typeof snapshot.leak.at === 'number' && Number.isInteger(snapshot.leak.at)
    && snapshot.leak.at >= 0 && snapshot.leak.at < 9
    && typeof snapshot.leak.direction === 'string');
  const validTiles = Array.isArray(snapshot.tiles) && snapshot.tiles.length === 5
    && snapshot.tiles.every((tile: unknown) => record(tile)
      && typeof tile.at === 'number' && Number.isInteger(tile.at) && tile.at >= 0 && tile.at < 9
      && (tile.type === 'straight' || tile.type === 'elbow')
      && typeof tile.rotation === 'number' && Number.isSafeInteger(tile.rotation) && tile.rotation >= 0
      && Array.isArray(tile.directions) && tile.directions.length === 2
      && tile.directions.every((direction: unknown) => typeof direction === 'string')
      && typeof tile.flowing === 'boolean');

  if (!validTiles || !Array.isArray(snapshot.tiles)
    || new Set(snapshot.tiles.map(tile => tile.at)).size !== 5
    || !Array.isArray(snapshot.flowingCells)
    || !snapshot.flowingCells.every(cell => Number.isInteger(cell) && cell >= 0 && cell < 9)
    || typeof snapshot.connectedPipes !== 'number' || !Number.isInteger(snapshot.connectedPipes)
    || snapshot.connectedPipes < 0 || snapshot.connectedPipes > 5
    || typeof snapshot.solved !== 'boolean'
    || !validLeak
    || typeof snapshot.status !== 'string'
    || typeof snapshot.explanation !== 'string'
    || typeof snapshot.hintText !== 'string'
    || typeof snapshot.hintCount !== 'number' || !Number.isInteger(snapshot.hintCount) || snapshot.hintCount < 0
    || typeof snapshot.hintLimit !== 'number' || !Number.isInteger(snapshot.hintLimit) || snapshot.hintLimit < 0
    || snapshot.hintCount > snapshot.hintLimit
    || typeof snapshot.canUndo !== 'boolean') return null;

  return snapshot as PipesSnapshot;
}
