export interface LightCell {
  row: number;
  column: number;
}

export interface LightMirror {
  index: number;
  row: number;
  column: number;
  orientation: 0 | 1;
}

export interface LightPuzzleSnapshot {
  mirrors: LightMirror[];
  beamCells: LightCell[];
  status: string;
  doorOpen: boolean;
}

export type LightPuzzleAction =
  | { type: 'flip'; index: number }
  | { type: 'reset' };

const ROWS = 5;
const COLUMNS = 6;
const MIRROR_COUNT = 4;
const MAX_BEAM_CELLS = ROWS * COLUMNS * 4;

function hasCellCoordinates(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const cell = value as Partial<LightCell>;
  return Number.isInteger(cell.row) && Number.isInteger(cell.column)
    && (cell.row as number) >= 0 && (cell.row as number) < ROWS
    && (cell.column as number) >= 0 && (cell.column as number) < COLUMNS;
}

function isCell(value: unknown): value is LightCell {
  return hasCellCoordinates(value);
}

export function parseLightPuzzleSnapshot(value: unknown): LightPuzzleSnapshot | null {
  if (!value || typeof value !== 'object') return null;
  const snapshot = value as Partial<LightPuzzleSnapshot>;
  if (!Array.isArray(snapshot.mirrors) || snapshot.mirrors.length !== MIRROR_COUNT
    || !Array.isArray(snapshot.beamCells) || snapshot.beamCells.length > MAX_BEAM_CELLS
    || !snapshot.beamCells.every(isCell)
    || typeof snapshot.status !== 'string' || typeof snapshot.doorOpen !== 'boolean') return null;

  const indexes = new Set<number>();
  const positions = new Set<string>();
  const mirrors: LightMirror[] = [];
  for (const value of snapshot.mirrors) {
    if (!value || typeof value !== 'object') return null;
    const mirror = value as Partial<LightMirror>;
    if (!Number.isInteger(mirror.index) || (mirror.index as number) < 0
      || (mirror.index as number) >= MIRROR_COUNT || !hasCellCoordinates(mirror)
      || (mirror.orientation !== 0 && mirror.orientation !== 1)) return null;
    const position = `${mirror.row},${mirror.column}`;
    if (indexes.has(mirror.index as number) || positions.has(position)) return null;
    indexes.add(mirror.index as number);
    positions.add(position);
    mirrors.push({
      index: mirror.index as number,
      row: mirror.row as number,
      column: mirror.column as number,
      orientation: mirror.orientation,
    });
  }
  if (indexes.size !== MIRROR_COUNT) return null;

  return {
    mirrors: mirrors.sort((left, right) => left.index - right.index),
    beamCells: snapshot.beamCells.map(cell => ({ row: cell.row, column: cell.column })),
    status: snapshot.status,
    doorOpen: snapshot.doorOpen,
  };
}
