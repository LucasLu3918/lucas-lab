import pack from './content/number-meanings.json';

export interface NumberMeaning {
  keyword: string;
  summary: string;
  guidance: string;
}

/** Numbers that reduction can produce: 1–9 plus the master numbers 11, 22 and 33. */
export const REACHABLE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33] as const;

const entries = pack.entries as Record<string, NumberMeaning>;

export function meaningFor(value: number): NumberMeaning {
  const meaning = entries[String(value)];
  if (!meaning) throw new RangeError(`找不到數字 ${value} 的內容。`);
  return meaning;
}
