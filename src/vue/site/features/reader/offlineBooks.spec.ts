import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  OFFLINE_BOOKS_CACHE,
  OFFLINE_BOOKS_KEY,
  OfflineBooksRepository,
  type OfflineBookStorage,
} from './OfflineBooksRepository';

class MemoryStorage implements OfflineBookStorage {
  value: string | null = null;
  getItem(key: string): string | null {
    expect(key).toBe(OFFLINE_BOOKS_KEY);
    return this.value;
  }
  setItem(key: string, value: string): void {
    expect(key).toBe(OFFLINE_BOOKS_KEY);
    this.value = value;
  }
}

afterEach(() => vi.unstubAllGlobals());

describe('offline book persistence', () => {
  it('keeps the existing local index and cache identity', () => {
    expect(OFFLINE_BOOKS_KEY).toBe('lucaslab.offline.v1');
    expect(OFFLINE_BOOKS_CACHE).toBe('lucas-lab-books');
    const storage = new MemoryStorage();
    const repository = new OfflineBooksRepository(storage);
    repository.save({ book: { slug: 'book', title: 'Book', urls: ['/stories/book/'], count: 1, saved: 1 } });
    expect(repository.load().book.title).toBe('Book');
  });

  it('stores fetched same-origin pages after a complete save and retains partial cache entries on failure', async () => {
    const storage = new MemoryStorage();
    const cached = new Map<string, Response>();
    const cache = {
      put: async (key: string, response: Response) => { cached.set(key, response); },
      delete: async (key: string) => cached.delete(key),
    };
    vi.stubGlobal('caches', { open: async (name: string) => { expect(name).toBe(OFFLINE_BOOKS_CACHE); return cache; } });
    const manifest = { slug: 'book', title: 'Book', urls: ['/stories/book/', '/stories/book/chapters/01/'] };
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.endsWith('offline.json')) return new Response(JSON.stringify(manifest), { status: 200 });
      if (url.endsWith('/chapters/01/')) return new Response('failed', { status: 503 });
      return new Response('saved', { status: 200 });
    }));
    const repository = new OfflineBooksRepository(storage);
    await expect(repository.saveBook('/stories/book/offline.json', () => {})).rejects.toThrow();
    expect(cached.has(`${location.origin}/stories/book/`)).toBe(true);
    expect(repository.load()).toEqual({});

    vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('offline.json')
      ? new Response(JSON.stringify(manifest), { status: 200 })
      : new Response('saved', { status: 200 })));
    const saved = await repository.saveBook('/stories/book/offline.json', () => {});
    expect(saved.count).toBe(2);
    expect(repository.load().book.urls).toEqual(manifest.urls.map(url => new URL(url, location.origin).href));
  });

  it('rejects cross-origin manifests and avoids deleting cross-origin saved entries', async () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({ book: { slug: 'book', title: 'Book', urls: ['/stories/book/', 'https://evil.example/item'], count: 2, saved: 1 } });
    const deleted: string[] = [];
    vi.stubGlobal('caches', { open: async () => ({ delete: async (url: string) => { deleted.push(url); return true; } }) });
    const repository = new OfflineBooksRepository(storage);
    await expect(repository.saveBook('https://evil.example/offline.json', () => {})).rejects.toThrow();
    await repository.removeBook('book');
    expect(deleted).toEqual(['/stories/book/']);
    expect(repository.load()).toEqual({});
  });
});
