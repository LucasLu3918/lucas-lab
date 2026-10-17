export const VESSEL_NAMES = ['A', 'B', 'C'] as const;
export const VESSEL_CAPACITIES = [8, 5, 3] as const;
export const VESSEL_TUBES = [
  { from: 0, to: 2 },
  { from: 2, to: 1 },
  { from: 1, to: 0 },
] as const;

export type VesselAmounts = [number, number, number];
export type ApothecaryVesselsSnapshot = {
  amounts: VesselAmounts;
  moveCount: number;
  enabledTubes: [boolean, boolean, boolean];
  canUndo: boolean;
  canRestart: boolean;
  finished: boolean;
  message: string;
  tone: '' | 'ok';
};

export type ApothecaryVesselsAction =
  | { type: 'pour'; tube: number }
  | { type: 'undo' }
  | { type: 'restart' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseApothecaryVesselsSnapshot(value: unknown): ApothecaryVesselsSnapshot | null {
  if (!isRecord(value)
    || !Array.isArray(value.amounts) || value.amounts.length !== VESSEL_CAPACITIES.length
    || !value.amounts.every((amount: unknown, index: number) =>
      typeof amount === 'number' && Number.isInteger(amount) && amount >= 0 && amount <= VESSEL_CAPACITIES[index])
    || value.amounts.reduce((sum: number, amount: number) => sum + amount, 0) !== VESSEL_CAPACITIES[0]
    || typeof value.moveCount !== 'number' || !Number.isInteger(value.moveCount) || value.moveCount < 0
    || !Array.isArray(value.enabledTubes) || value.enabledTubes.length !== VESSEL_TUBES.length
    || !value.enabledTubes.every((enabled: unknown) => typeof enabled === 'boolean')
    || typeof value.canUndo !== 'boolean'
    || typeof value.canRestart !== 'boolean'
    || typeof value.finished !== 'boolean'
    || typeof value.message !== 'string'
    || (value.tone !== '' && value.tone !== 'ok')) return null;

  return {
    amounts: [...value.amounts] as VesselAmounts,
    moveCount: value.moveCount,
    enabledTubes: [...value.enabledTubes] as [boolean, boolean, boolean],
    canUndo: value.canUndo,
    canRestart: value.canRestart,
    finished: value.finished,
    message: value.message,
    tone: value.tone,
  };
}
