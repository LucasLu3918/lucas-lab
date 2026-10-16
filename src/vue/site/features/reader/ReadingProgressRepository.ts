import { normalizeReadingProgress, READING_PROGRESS_KEY, type ReadingProgressData } from './readingProgress';

export interface ReadingProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class ReadingProgressRepository {
  constructor(private readonly storage: ReadingProgressStorage | null) {}

  load(): ReadingProgressData {
    if (!this.storage) return { stories: {} };
    try {
      return normalizeReadingProgress(JSON.parse(this.storage.getItem(READING_PROGRESS_KEY) || 'null') as unknown);
    } catch {
      return { stories: {} };
    }
  }

  save(progress: ReadingProgressData): void {
    if (!this.storage) return;
    try {
      this.storage.setItem(READING_PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Reading still works when browser storage is blocked or full.
    }
  }
}

export function createBrowserReadingProgressRepository(): ReadingProgressRepository {
  try {
    return new ReadingProgressRepository(window.localStorage);
  } catch {
    return new ReadingProgressRepository(null);
  }
}
