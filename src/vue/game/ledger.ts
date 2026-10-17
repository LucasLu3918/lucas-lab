// @ts-expect-error Legacy game artwork is JavaScript without declarations.
import { ledgerPieces, ledgerTile } from '../../../games/blood-mirror/puzzles/ledger-art.js';

export type LedgerSnapshot = { tiles: number[] };

export type LedgerAction =
  | { type: 'swap'; first: number; second: number }
  | { type: 'reset' };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export function parseLedgerSnapshot(value: unknown): LedgerSnapshot | null {
  if (!isRecord(value) || !Array.isArray(value.tiles) || value.tiles.length !== 9
    || !value.tiles.every((tile: unknown) => typeof tile === 'number' && Number.isInteger(tile) && tile >= 0 && tile < 9)
    || new Set(value.tiles).size !== 9) return null;

  return { tiles: [...value.tiles] as number[] };
}

export function ledgerPieceLabel(piece: number): string {
  return Number.isInteger(piece) && piece >= 0 && piece < ledgerPieces.length
    ? ledgerPieces[piece]
    : '';
}

// Only validated, authored piece indices reach this static SVG generator; it never receives user/save text.
export function ledgerPieceMarkup(piece: number): string {
  return Number.isInteger(piece) && piece >= 0 && piece < ledgerPieces.length
    ? ledgerTile(piece)
    : '';
}
