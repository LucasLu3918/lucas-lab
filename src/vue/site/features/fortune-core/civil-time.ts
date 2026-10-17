export interface CivilDateTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export type Disambiguation = 'earlier' | 'later';

function partsAt(instant: number, timeZone: string): CivilDateTime {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-CA-u-ca-gregory-nu-latn', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
  } catch {
    throw new RangeError('請輸入有效的 IANA 時區，例如 Asia/Taipei。');
  }
  const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(part => [part.type, part.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
  };
}

function sameCivil(left: CivilDateTime, right: CivilDateTime): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day
    && left.hour === right.hour && left.minute === right.minute && left.second === right.second;
}

function offsetAt(instant: number, timeZone: string): number {
  const local = partsAt(instant, timeZone);
  const rounded = Math.floor(instant / 1000) * 1000;
  return Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second) - rounded;
}

export function parseCivilDateTime(date: string, time: string): CivilDateTime {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) throw new RangeError('請填寫有效的出生日期與時間。');
  const [, y, m, d] = dateMatch;
  const [, h, min] = timeMatch;
  const value = { year: Number(y), month: Number(m), day: Number(d), hour: Number(h), minute: Number(min), second: 0 };
  const check = new Date(Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute));
  if (check.getUTCFullYear() !== value.year || check.getUTCMonth() + 1 !== value.month || check.getUTCDate() !== value.day
    || value.hour > 23 || value.minute > 59) throw new RangeError('出生日期或時間不存在。');
  return value;
}

export function resolveCivilDateTime(value: CivilDateTime, timeZone: string, disambiguation: Disambiguation = 'earlier'): Date {
  const naive = Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second);
  const offsets = new Set<number>();
  for (const hours of [-36, -24, -12, 0, 12, 24, 36]) offsets.add(offsetAt(naive + hours * 3_600_000, timeZone));
  const candidates = [...offsets]
    .map(offset => naive - offset)
    .filter(instant => sameCivil(partsAt(instant, timeZone), value))
    .sort((a, b) => a - b);
  if (candidates.length === 0) throw new RangeError('這個當地時間因夏令時間切換而不存在，請核對出生時間。');
  if (candidates.length > 1) return new Date(disambiguation === 'later' ? candidates.at(-1)! : candidates[0]);
  return new Date(candidates[0]);
}

export function civilPartsAt(instant: Date, timeZone: string): CivilDateTime {
  if (!Number.isFinite(instant.getTime())) throw new RangeError('無效的日期時間。');
  return partsAt(instant.getTime(), timeZone);
}

export function dateStringInZone(instant: Date, timeZone: string): string {
  const p = partsAt(instant.getTime(), timeZone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Local calendar day as YYYY-MM-DD, using the reader's own clock. Daily features share this so they agree at midnight. */
export function localDayKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
