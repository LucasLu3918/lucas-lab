import { createLocalHistory, type LocalHistory } from '../fortune-core/local-history';
import { tarotSpreadCount, type TarotOrientation, type TarotSpreadId } from './tarot';

export interface TarotHistoryCard {
  cardId: string;
  orientation: TarotOrientation;
}

export interface TarotHistoryEntry {
  id: string;
  createdAt: string;
  spread: TarotSpreadId;
  cards: TarotHistoryCard[];
  localDay?: string;
  note?: string;
}

// Same storage key as before the shared layer (`lucas-lab:tarot-history:v1`), so existing local readings still load.
const HISTORY_KEY = 'tarot-history';
const HISTORY_VERSION = 1;
const HISTORY_LIMIT = 20;

function isEntry(value: unknown): value is TarotHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<TarotHistoryEntry>;
  if (typeof entry.id !== 'string' || typeof entry.createdAt !== 'string') return false;
  if (!['single', 'daily', 'past-present-future', 'situation-challenge-advice', 'choice', 'deep-five'].includes(String(entry.spread))) return false;
  if (!Array.isArray(entry.cards)) return false;
  return entry.cards.length === tarotSpreadCount(entry.spread as TarotSpreadId)
    && entry.cards.every(card => card && typeof card.cardId === 'string'
      && (card.orientation === 'upright' || card.orientation === 'reversed'))
    && (entry.localDay === undefined || /^\d{4}-\d{2}-\d{2}$/.test(entry.localDay))
    && (entry.note === undefined || (typeof entry.note === 'string' && entry.note.length <= 500));
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function historyIn(storage: Storage | null): LocalHistory<TarotHistoryEntry> {
  return createLocalHistory<TarotHistoryEntry>({
    key: HISTORY_KEY,
    version: HISTORY_VERSION,
    limit: HISTORY_LIMIT,
    isEntry,
    storage: () => storage,
  });
}

export function readTarotHistory(storage = browserStorage()): TarotHistoryEntry[] {
  return historyIn(storage).read();
}

export function saveTarotHistory(entry: TarotHistoryEntry, storage = browserStorage()): TarotHistoryEntry[] {
  return historyIn(storage).save(entry);
}

export function clearTarotHistory(storage = browserStorage()): void {
  historyIn(storage).clear();
}

export function exportTarotHistory(storage = browserStorage()): string {
  return historyIn(storage).exportJson();
}

export function updateTarotNote(id: string, note: string, storage = browserStorage()): TarotHistoryEntry[] {
  const normalized = note.trim().slice(0, 500);
  return historyIn(storage).update(id, entry => ({ ...entry, note: normalized || undefined }));
}
