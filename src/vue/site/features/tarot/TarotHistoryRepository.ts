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

const STORAGE_KEY = 'lucas-lab:tarot-history:v1';
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

export function readTarotHistory(storage = browserStorage()): TarotHistoryEntry[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isEntry).slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function saveTarotHistory(entry: TarotHistoryEntry, storage = browserStorage()): TarotHistoryEntry[] {
  if (!storage) return [];
  const history = [entry, ...readTarotHistory(storage)].slice(0, HISTORY_LIMIT);
  storage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function clearTarotHistory(storage = browserStorage()): void {
  storage?.removeItem(STORAGE_KEY);
}

export function updateTarotNote(id: string, note: string, storage = browserStorage()): TarotHistoryEntry[] {
  if (!storage) return [];
  const normalized = note.trim().slice(0, 500);
  const history = readTarotHistory(storage).map(entry => entry.id === id
    ? { ...entry, note: normalized || undefined }
    : entry);
  storage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}
