// Per-browser history only. Nothing here is uploaded, and callers must not store birth data through it.

export interface LocalHistoryOptions<T extends { id: string }> {
  key: string;
  version: number;
  limit: number;
  isEntry: (value: unknown) => value is T;
  storage?: () => Storage | null;
}

export interface LocalHistory<T extends { id: string }> {
  read(): T[];
  save(entry: T): T[];
  update(id: string, change: (entry: T) => T): T[];
  remove(id: string): T[];
  clear(): void;
  exportJson(): string;
}

function browserStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function createLocalHistory<T extends { id: string }>(options: LocalHistoryOptions<T>): LocalHistory<T> {
  const storageKey = `lucas-lab:${options.key}:v${options.version}`;
  const resolveStorage = options.storage ?? browserStorage;

  // Write failures propagate so the caller can tell the reader that nothing was saved.
  const write = (entries: T[], storage: Storage | null): T[] => {
    storage?.setItem(storageKey, JSON.stringify(entries));
    return entries;
  };

  const read = (): T[] => {
    const storage = resolveStorage();
    if (!storage) return [];
    try {
      const parsed: unknown = JSON.parse(storage.getItem(storageKey) ?? '[]');
      return Array.isArray(parsed) ? parsed.filter(options.isEntry).slice(0, options.limit) : [];
    } catch {
      return [];
    }
  };

  return {
    read,
    save(entry) {
      const storage = resolveStorage();
      if (!storage) return [];
      return write([entry, ...read().filter(item => item.id !== entry.id)].slice(0, options.limit), storage);
    },
    update(id, change) {
      const storage = resolveStorage();
      if (!storage) return [];
      return write(read().map(item => (item.id === id ? change(item) : item)), storage);
    },
    remove(id) {
      const storage = resolveStorage();
      if (!storage) return [];
      return write(read().filter(item => item.id !== id), storage);
    },
    clear() {
      try {
        resolveStorage()?.removeItem(storageKey);
      } catch {
        // Blocked storage has nothing to clear.
      }
    },
    exportJson() {
      return JSON.stringify(read(), null, 2);
    },
  };
}
