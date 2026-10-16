export const OFFLINE_BOOKS_KEY = 'lucaslab.offline.v1';
export const OFFLINE_BOOKS_CACHE = 'lucas-lab-books';

export interface OfflineBookManifest {
  slug: string;
  title: string;
  urls: string[];
}

export interface OfflineBookRecord extends OfflineBookManifest {
  count: number;
  saved: number;
}

export interface OfflineBookStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class OfflineBooksRepository {
  constructor(private readonly storage: OfflineBookStorage | null) {}

  load(): Record<string, OfflineBookRecord> {
    if (!this.storage) return {};
    try {
      const saved = JSON.parse(this.storage.getItem(OFFLINE_BOOKS_KEY) || 'null') as unknown;
      return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved as Record<string, OfflineBookRecord> : {};
    } catch {
      return {};
    }
  }

  save(records: Record<string, OfflineBookRecord>): void {
    try { this.storage?.setItem(OFFLINE_BOOKS_KEY, JSON.stringify(records)); } catch { /* storage is optional */ }
  }

  async saveBook(manifestUrl: string, onProgress: (index: number, total: number) => void): Promise<OfflineBookRecord> {
    const origin = location.origin;
    if (new URL(manifestUrl, origin).origin !== origin) throw new Error('offline manifest must be same-origin');
    const response = await fetch(manifestUrl, { cache: 'no-cache' });
    if (!response.ok) throw new Error('offline manifest unavailable');
    const value = await response.json() as Partial<OfflineBookManifest>;
    if (!value.slug || typeof value.title !== 'string' || !Array.isArray(value.urls) || value.urls.length === 0) {
      throw new Error('invalid offline manifest');
    }
    const urls = value.urls.map(item => {
      if (typeof item !== 'string' || new URL(item, origin).origin !== origin) throw new Error('offline URL must be same-origin');
      return new URL(item, origin).href;
    });
    const cache = await caches.open(OFFLINE_BOOKS_CACHE);
    for (const [index, target] of urls.entries()) {
      onProgress(index, urls.length);
      const page = await fetch(target, { cache: 'no-cache' });
      if (!page.ok) throw new Error('offline page unavailable');
      await cache.put(target, page);
    }
    const record: OfflineBookRecord = { slug: value.slug, title: value.title, urls, count: urls.length, saved: Date.now() };
    const records = this.load();
    this.save({ ...records, [record.slug]: record });
    try { await navigator.storage?.persist?.(); } catch { /* persistent storage is best-effort */ }
    return record;
  }

  async removeBook(slug: string): Promise<void> {
    const records = this.load();
    const record = records[slug];
    if (record) {
      const cache = await caches.open(OFFLINE_BOOKS_CACHE);
      const origin = location.origin;
      const sameOriginUrls = record.urls.filter(url => {
        try { return new URL(url, origin).origin === origin; } catch { return false; }
      });
      await Promise.all(sameOriginUrls.map(url => cache.delete(url)));
    }
    const { [slug]: _removed, ...remaining } = records;
    this.save(remaining);
  }
}

export function createBrowserOfflineBooksRepository(): OfflineBooksRepository | null {
  if (!window.isSecureContext || typeof caches === 'undefined') return null;
  try { return new OfflineBooksRepository(window.localStorage); } catch { return new OfflineBooksRepository(null); }
}
