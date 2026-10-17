export type ApothecaryTestimonySnapshot = {
  apprentices: string[];
  cardLines: string[];
  testimonies: string[];
  mirror: boolean;
  ruled: number[];
  finished: boolean;
  message: string;
  tone: '' | 'ok' | 'bad';
};

export type ApothecaryTestimonyAction =
  | { type: 'toggle-mirror' }
  | { type: 'toggle-strike'; index: number }
  | { type: 'accuse'; index: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseApothecaryTestimonySnapshot(value: unknown): ApothecaryTestimonySnapshot | null {
  if (!isRecord(value)
    || !Array.isArray(value.apprentices) || value.apprentices.length !== 7
    || !value.apprentices.every((item: unknown) => typeof item === 'string')
    || !Array.isArray(value.cardLines) || value.cardLines.length !== 7
    || !value.cardLines.every((item: unknown) => typeof item === 'string')
    || !Array.isArray(value.testimonies) || value.testimonies.length !== 7
    || !value.testimonies.every((item: unknown) => typeof item === 'string')
    || typeof value.mirror !== 'boolean'
    || !Array.isArray(value.ruled)
    || !value.ruled.every((item: unknown) => typeof item === 'number' && Number.isInteger(item) && item >= 0 && item < 7)
    || new Set(value.ruled).size !== value.ruled.length
    || typeof value.finished !== 'boolean'
    || typeof value.message !== 'string'
    || (value.tone !== '' && value.tone !== 'ok' && value.tone !== 'bad')) return null;

  return {
    apprentices: [...value.apprentices],
    cardLines: [...value.cardLines],
    testimonies: [...value.testimonies],
    mirror: value.mirror,
    ruled: [...value.ruled],
    finished: value.finished,
    message: value.message,
    tone: value.tone,
  };
}
