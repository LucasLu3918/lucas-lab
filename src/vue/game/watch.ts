// @ts-expect-error Legacy game artwork is JavaScript without declarations.
import { watchGearSvgMarkup as legacyWatchGearSvgMarkup } from '../../../games/blood-mirror/puzzles/watch.js';

export interface WatchSnapshot {
  warm: boolean;
  gears: number[];
  turns: number;
  angles: number[];
  animate: boolean;
  note: string;
}

export type WatchAction =
  | { type: 'turn'; index: number }
  | { type: 'reset' };

const GEAR_COUNT = 3;
const TOOTH_COUNT = 6;

// Fixed SVG paths generated from the three validated gear indexes; no user or save text reaches v-html.
export function watchGearSvgMarkup(index: number): string {
  return Number.isInteger(index) && index >= 0 && index < GEAR_COUNT
    ? legacyWatchGearSvgMarkup(index)
    : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseWatchSnapshot(value: unknown): WatchSnapshot | null {
  if (!isRecord(value)
    || typeof value.warm !== 'boolean'
    || !Array.isArray(value.gears) || value.gears.length !== GEAR_COUNT
    || !value.gears.every((position: unknown) => Number.isInteger(position)
      && (position as number) >= 0 && (position as number) < TOOTH_COUNT)
    || typeof value.turns !== 'number' || !Number.isInteger(value.turns) || value.turns < 0
    || !Array.isArray(value.angles) || value.angles.length !== GEAR_COUNT
    || !value.angles.every((angle: unknown) => typeof angle === 'number' && Number.isFinite(angle))
    || typeof value.animate !== 'boolean'
    || typeof value.note !== 'string') return null;

  return {
    warm: value.warm,
    gears: [...value.gears] as number[],
    turns: value.turns,
    angles: [...value.angles] as number[],
    animate: value.animate,
    note: value.note,
  };
}
