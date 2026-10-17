// Helpers for the zero-input "today" overview on the divination hub. Nothing here reads or stores birth data.
import { HOROSCOPE_SIGNS, type HoroscopeSignId } from '../horoscope/signs';
import type { TarotHistoryEntry } from '../tarot/TarotHistoryRepository';

const TODAY_SIGN_KEY = 'lucas-lab:today-sign:v1';

export function parseHoroscopeSign(value: unknown): HoroscopeSignId | null {
  return HOROSCOPE_SIGNS.find(sign => sign.id === value)?.id ?? null;
}

/** The daily draw saved for this local day, if the reader has already drawn one. */
export function todaysDailyDraw(entries: readonly TarotHistoryEntry[], localDay: string): TarotHistoryEntry | undefined {
  return entries.find(entry => entry.spread === 'daily' && entry.localDay === localDay);
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The sign the reader picked last on this device. A convenience only; it is not tied to any birth data. */
export function rememberedSign(storage = browserStorage()): HoroscopeSignId | null {
  try {
    return parseHoroscopeSign(storage?.getItem(TODAY_SIGN_KEY));
  } catch {
    return null;
  }
}

export function rememberSign(sign: HoroscopeSignId, storage = browserStorage()): void {
  try {
    storage?.setItem(TODAY_SIGN_KEY, sign);
  } catch {
    // Blocked storage only means the choice is not remembered between visits.
  }
}
