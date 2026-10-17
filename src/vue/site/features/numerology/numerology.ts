// Pythagorean numerology (Life Path, Birthday, name numbers and personal cycles).
// Rules follow docs/plan/FORTUNE_HUB_PLAN.md §3.6: year, month and day are reduced separately before they are combined.
import { parseCivilDateTime } from '../fortune-core/civil-time';
import { createMethodResult, type InputPrecision, type MethodResult } from '../fortune-core/result';

export const NUMEROLOGY_METHOD_VERSION = 'numerology-pythagorean-v1';

const MASTER_NUMBERS = new Set([11, 22, 33]);
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export interface NumberReading {
  value: number;
  steps: string[];
}

export interface NameNumbers {
  expression: NumberReading;
  soulUrge: NumberReading | null;
  personality: NumberReading;
  /** Soul Urge raw total + Personality raw total must equal the raw total of every letter. */
  verified: boolean;
}

export interface NumerologyReport {
  lifePath: NumberReading;
  birthday: NumberReading;
  personalYear: NumberReading;
  personalMonth: NumberReading;
  personalDay: NumberReading;
  name?: NameNumbers;
}

export interface NumerologyInput {
  birthDate: string;
  asOfDate: string;
  fullName?: string;
  yAsVowel?: boolean;
}

function digitSum(value: number): number {
  return String(value).split('').reduce((total, digit) => total + Number(digit), 0);
}

/** Repeatedly sums digits until a single digit remains, stopping early at 11, 22 and 33. */
export function reduceNumber(value: number): number {
  let current = value;
  while (current > 9 && !MASTER_NUMBERS.has(current)) current = digitSum(current);
  return current;
}

/** The reduction path, e.g. 1990 → 19 → 10 → 1. Always has at least two entries so single digits read "6 → 6". */
function reduceChain(value: number): string {
  const path = [value];
  let current = value;
  while (current > 9 && !MASTER_NUMBERS.has(current)) {
    current = digitSum(current);
    path.push(current);
  }
  if (path.length === 1) path.push(current);
  return path.join(' → ');
}

function letterValue(letter: string): number {
  return ((letter.charCodeAt(0) - 65) % 9) + 1;
}

function parseDate(date: string) {
  return parseCivilDateTime(date, '00:00');
}

function reading(value: number, steps: string[]): NumberReading {
  return { value, steps };
}

export function lifePathNumber(birthDate: string): NumberReading {
  const { year, month, day } = parseDate(birthDate);
  const y = reduceNumber(year);
  const m = reduceNumber(month);
  const d = reduceNumber(day);
  const total = y + m + d;
  return reading(reduceNumber(total), [
    `年 ${reduceChain(year)}`,
    `月 ${reduceChain(month)}`,
    `日 ${reduceChain(day)}`,
    `${y} + ${m} + ${d} = ${total} → ${reduceNumber(total)}`,
  ]);
}

export function birthdayNumber(birthDate: string): NumberReading {
  const { day } = parseDate(birthDate);
  return reading(reduceNumber(day), [`日 ${reduceChain(day)}`]);
}

export function personalYear(birthDate: string, year: number): NumberReading {
  const { month, day } = parseDate(birthDate);
  const yearDigits = digitSum(year);
  const m = reduceNumber(month);
  const d = reduceNumber(day);
  const y = reduceNumber(yearDigits);
  const total = m + d + y;
  return reading(reduceNumber(total), [
    `月 ${m}，日 ${d}`,
    `年 ${year}：${yearDigits} → ${y}`,
    `${m} + ${d} + ${y} = ${total} → ${reduceNumber(total)}`,
  ]);
}

export function personalMonth(personalYearNumber: number, month: number): NumberReading {
  const m = reduceNumber(month);
  const total = personalYearNumber + m;
  return reading(reduceNumber(total), [`${personalYearNumber} + ${m} = ${total} → ${reduceNumber(total)}`]);
}

export function personalDay(personalMonthNumber: number, day: number): NumberReading {
  const d = reduceNumber(day);
  const total = personalMonthNumber + d;
  return reading(reduceNumber(total), [`${personalMonthNumber} + ${d} = ${total} → ${reduceNumber(total)}`]);
}

function normalizeName(fullName: string): string[] {
  const latin = fullName.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const segments = latin.split(/[\s-]+/).map(segment => segment.replace(/'/g, '')).filter(Boolean);
  if (segments.length === 0 || segments.some(segment => !/^[A-Z]+$/.test(segment))) {
    throw new RangeError('數字學以英文字母計算，請輸入英文或拼音全名（例如 Chen Yi-Chun）。');
  }
  return segments;
}

export function nameNumbers(fullName: string, options: { yAsVowel?: boolean } = {}): NameNumbers {
  const segments = normalizeName(fullName);
  const isVowel = (letter: string) => VOWELS.has(letter) || (options.yAsVowel === true && letter === 'Y');

  const segmentReadings = segments.map(segment => {
    const raw = [...segment].reduce((total, letter) => total + letterValue(letter), 0);
    return { segment, raw, value: reduceNumber(raw) };
  });
  const expressionRaw = segmentReadings.reduce((total, item) => total + item.value, 0);
  const expression = reading(reduceNumber(expressionRaw), [
    ...segmentReadings.map(item => `${item.segment} ${item.raw} → ${item.value}`),
    `${segmentReadings.map(item => item.value).join(' + ')} = ${expressionRaw} → ${reduceNumber(expressionRaw)}`,
  ]);

  const letters = segments.join('').split('');
  const vowelRaw = letters.filter(isVowel).reduce((total, letter) => total + letterValue(letter), 0);
  const consonantRaw = letters.filter(letter => !isVowel(letter)).reduce((total, letter) => total + letterValue(letter), 0);
  const allRaw = letters.reduce((total, letter) => total + letterValue(letter), 0);

  const soulUrge = letters.some(isVowel)
    ? reading(reduceNumber(vowelRaw), [`母音合計 ${vowelRaw} → ${reduceNumber(vowelRaw)}`])
    : null;
  const personality = reading(reduceNumber(consonantRaw), [`子音合計 ${consonantRaw} → ${reduceNumber(consonantRaw)}`]);

  return {
    expression,
    soulUrge,
    personality,
    verified: vowelRaw + consonantRaw === allRaw,
  };
}

export function calculateNumerology(input: NumerologyInput): MethodResult<NumerologyReport> {
  const asOf = parseDate(input.asOfDate);
  const lifePath = lifePathNumber(input.birthDate);
  const birthday = birthdayNumber(input.birthDate);
  const year = personalYear(input.birthDate, asOf.year);
  const month = personalMonth(year.value, asOf.month);
  const day = personalDay(month.value, asOf.day);
  const name = input.fullName?.trim() ? nameNumbers(input.fullName, { yAsVowel: input.yAsVowel }) : undefined;
  const precision: InputPrecision = name ? 'full' : 'approximate';

  return createMethodResult({
    module: 'numerology',
    methodVersion: NUMEROLOGY_METHOD_VERSION,
    contentVersion: '2026.10.17-1',
    inputPrecision: precision,
    data: { lifePath, birthday, personalYear: year, personalMonth: month, personalDay: day, name },
  });
}
