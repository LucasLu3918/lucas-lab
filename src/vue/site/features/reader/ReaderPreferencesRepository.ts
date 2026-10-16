import {
  DEFAULT_READER_PREFERENCES,
  normalizeReaderPreferences,
  READER_PREFERENCES_KEY,
  type ReaderPreferences,
} from './readerPreferences';

export interface ReaderPreferencesStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class ReaderPreferencesRepository {
  constructor(private readonly storage: ReaderPreferencesStorage | null) {}

  load(): ReaderPreferences {
    if (!this.storage) return { ...DEFAULT_READER_PREFERENCES };

    try {
      const saved = this.storage.getItem(READER_PREFERENCES_KEY);
      return saved ? normalizeReaderPreferences(JSON.parse(saved) as unknown) : { ...DEFAULT_READER_PREFERENCES };
    } catch {
      return { ...DEFAULT_READER_PREFERENCES };
    }
  }

  save(preferences: ReaderPreferences): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(READER_PREFERENCES_KEY, JSON.stringify(normalizeReaderPreferences(preferences)));
    } catch {
      // Reader controls continue to work when browser storage is blocked or full.
    }
  }
}

export function createBrowserReaderPreferencesRepository(): ReaderPreferencesRepository {
  try {
    return new ReaderPreferencesRepository(window.localStorage);
  } catch {
    return new ReaderPreferencesRepository(null);
  }
}
