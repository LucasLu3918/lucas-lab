export interface HintSnapshot {
  stepName: string;
  list: string[];
  count: number;
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseHintSnapshot(value: unknown): HintSnapshot | null {
  if (!record(value) || typeof value.stepName !== 'string' || !value.stepName.trim()
    || !Array.isArray(value.list) || !value.list.every(item => typeof item === 'string')
    || !Number.isInteger(value.count)) return null;

  const count = value.count as number;
  if (count < 0 || count > value.list.length) return null;

  return { stepName: value.stepName, list: [...value.list], count };
}
