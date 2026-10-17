export type MasksSnapshot = {
  maskNames: string[];
  guests: string[];
  guestOrder: number[];
  clues: string[];
  picks: number[];
  message: string;
};

export type MasksAction =
  | { type: 'select'; index: number; guest: number }
  | { type: 'reset' }
  | { type: 'confirm' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isIndexOrder(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.length === 6
    && value.every((item: unknown): item is number =>
      typeof item === 'number' && Number.isInteger(item) && item >= 0 && item < 6)
    && new Set(value).size === 6;
}

export function parseMasksSnapshot(value: unknown): MasksSnapshot | null {
  if (!isRecord(value)
    || !Array.isArray(value.maskNames) || value.maskNames.length !== 6
    || !value.maskNames.every((item: unknown) => typeof item === 'string')
    || !Array.isArray(value.guests) || value.guests.length !== 6
    || !value.guests.every((item: unknown) => typeof item === 'string')
    || !isIndexOrder(value.guestOrder)
    || !Array.isArray(value.clues) || value.clues.length !== 5
    || !value.clues.every((item: unknown) => typeof item === 'string')
    || !Array.isArray(value.picks) || value.picks.length !== 6
    || !value.picks.every((item: unknown) =>
      typeof item === 'number' && Number.isInteger(item) && item >= -1 && item < 6)
    || typeof value.message !== 'string') return null;

  return {
    maskNames: [...value.maskNames],
    guests: [...value.guests],
    guestOrder: [...value.guestOrder],
    clues: [...value.clues],
    picks: [...value.picks],
    message: value.message,
  };
}
