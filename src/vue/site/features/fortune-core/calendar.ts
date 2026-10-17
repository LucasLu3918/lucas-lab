// Single entry point for lunar calendar facts. Modules call this instead of importing lunar-javascript directly.
import { Solar } from 'lunar-javascript';
import { parseCivilDateTime } from './civil-time';

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
  ganzhiYear: string;
}

export function toLunarDate(date: { year: number; month: number; day: number }): LunarDate {
  const iso = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  // Validates the civil date (rejects 2024-02-30 and the like) before conversion.
  parseCivilDateTime(iso, '00:00');
  const lunar = Solar.fromYmd(date.year, date.month, date.day).getLunar();
  return {
    year: lunar.getYear(),
    month: Math.abs(lunar.getMonth()),
    day: lunar.getDay(),
    isLeapMonth: lunar.getMonth() < 0,
    ganzhiYear: lunar.getYearInGanZhi(),
  };
}
