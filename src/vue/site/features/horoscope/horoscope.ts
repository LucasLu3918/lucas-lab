// Daily horoscope: every line comes from the reviewed content pack. Selection is seeded by local day, sign and slot, so the same
// reader sees the same reading all day, while different signs or days draw different combinations. No LLM is involved.
import { isContentPack, type ContentPack } from '../fortune-core/content';
import { dailySeed, pickSeeded, seededRandom } from '../fortune-core/rng';
import horoscopeJson from './content/horoscope-zh.json';
import { findHoroscopeSign, type HoroscopeSignId } from './signs';

export const HOROSCOPE_METHOD_VERSION = 'horoscope-daily-v1';

export const HOROSCOPE_DIMENSIONS = [
  { id: 'overall', title: '整體' },
  { id: 'love', title: '感情' },
  { id: 'career', title: '事業' },
  { id: 'finance', title: '財務' },
  { id: 'health', title: '健康' },
] as const;

export type HoroscopeDimensionId = typeof HOROSCOPE_DIMENSIONS[number]['id'];

export type HoroscopeEntries = {
  dimensions: Record<HoroscopeDimensionId, { situations: string[]; actions: string[]; tones: string[] }>;
  luckyGuide: { colors: string[]; times: string[] };
  dailyTips: string[];
};

export interface HoroscopeSection {
  id: HoroscopeDimensionId;
  title: string;
  text: string;
}

export interface HoroscopeReading {
  localDay: string;
  sign: HoroscopeSignId;
  signName: string;
  methodVersion: string;
  contentVersion: string;
  sections: HoroscopeSection[];
  lucky: { color: string; time: string; number: number };
  tip: string;
}

function loadContentPack(): ContentPack<HoroscopeEntries> {
  if (!isContentPack(horoscopeJson)) throw new Error('星座內容包格式錯誤。');
  return horoscopeJson as ContentPack<HoroscopeEntries>;
}

export const HOROSCOPE_PACK: ContentPack<HoroscopeEntries> = loadContentPack();

/** Local calendar day as YYYY-MM-DD, using the reader's own clock. */
export function localDayKey(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function createDailyHoroscope(
  localDay: string,
  sign: HoroscopeSignId,
  pack: ContentPack<HoroscopeEntries> = HOROSCOPE_PACK,
): HoroscopeReading {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDay)) throw new RangeError('日期格式必須是 YYYY-MM-DD。');
  const { name: signName } = findHoroscopeSign(sign);
  const period = 'day';
  const { dimensions, luckyGuide, dailyTips } = pack.entries;

  const sections = HOROSCOPE_DIMENSIONS.map(({ id, title }) => {
    const copy = dimensions[id];
    const pick = (items: readonly string[], slot: string) => pickSeeded(items, dailySeed(localDay, sign, period, id, slot));
    return {
      id,
      title,
      text: pick(copy.situations, 'situation') + pick(copy.actions, 'action') + pick(copy.tones, 'tone'),
    };
  });

  const lucky = {
    color: pickSeeded(luckyGuide.colors, dailySeed(localDay, sign, period, 'lucky-color')),
    time: pickSeeded(luckyGuide.times, dailySeed(localDay, sign, period, 'lucky-time')),
    number: Math.floor(seededRandom(dailySeed(localDay, sign, period, 'lucky-number'))() * 9) + 1,
  };

  return {
    localDay,
    sign,
    signName,
    methodVersion: HOROSCOPE_METHOD_VERSION,
    contentVersion: pack.contentVersion,
    sections,
    lucky,
    // The daily tip is shared by every sign on the same day.
    tip: pickSeeded(dailyTips, dailySeed(localDay, 'daily-tip')),
  };
}
