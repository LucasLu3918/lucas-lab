import { describe, expect, it } from 'vitest';
import { ReadingProgressRepository, type ReadingProgressStorage } from './ReadingProgressRepository';
import {
  isSameOriginUrl,
  normalizeReadingProgress,
  progressForPosition,
  recordChapterProgress,
  READING_PROGRESS_KEY,
} from './readingProgress';

class MemoryStorage implements ReadingProgressStorage {
  value: string | null = null;
  getItem(key: string): string | null {
    expect(key).toBe(READING_PROGRESS_KEY);
    return this.value;
  }
  setItem(key: string, value: string): void {
    expect(key).toBe(READING_PROGRESS_KEY);
    this.value = value;
  }
}

describe('reading progress contract', () => {
  it('keeps the existing stories map and tolerates malformed or blocked storage', () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({ stories: { book: { chapterId: '01', percent: 20, read: ['00'] } } });
    const repository = new ReadingProgressRepository(storage);
    expect(repository.load().stories.book.chapterId).toBe('01');
    repository.save({ stories: { book: { chapterId: '02', percent: 30, updated: 1, read: [] } } });
    expect(JSON.parse(storage.value!)).toEqual({ stories: { book: { chapterId: '02', percent: 30, updated: 1, read: [] } } });
    storage.value = '{';
    expect(repository.load()).toEqual({ stories: {} });
    const blocked: ReadingProgressStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(() => new ReadingProgressRepository(blocked).save({ stories: {} })).not.toThrow();
    expect(normalizeReadingProgress({ stories: [] })).toEqual({ stories: {} });
  });

  it('keeps the existing percent and short-chapter completion rules', () => {
    expect(progressForPosition({ top: -250, bottom: 950, height: 1200, viewportHeight: 800 })).toEqual({ percent: 63, finished: false });
    expect(progressForPosition({ top: 0, bottom: 500, height: 500, viewportHeight: 800 })).toEqual({ percent: 0, finished: true });
    expect(progressForPosition({ top: -900, bottom: 100, height: 1000, viewportHeight: 800 }).finished).toBe(true);
  });

  it('adds a finished chapter once and preserves other story data', () => {
    const current = { stories: { book: { title: 'Book', chapterId: '00', chapterTitle: 'Old', percent: 100, updated: 1, read: ['00'] } } };
    const entry = { storySlug: 'book', title: 'Book', url: '/stories/book/', chapterId: '01', chapterTitle: 'New', chapterUrl: '/stories/book/chapters/01/', percent: 100, updated: 2 };
    const { storySlug: _slug, ...stored } = entry;
    expect(recordChapterProgress(current, entry, true).stories.book).toEqual({ ...stored, read: ['00', '01'] });
    expect(recordChapterProgress(current, entry, false).stories.book.read).toEqual(['00']);
  });

  it('accepts only links on the current origin', () => {
    expect(isSameOriginUrl('/stories/book/', 'https://example.com')).toBe(true);
    expect(isSameOriginUrl('https://evil.example/steal', 'https://example.com')).toBe(false);
    expect(isSameOriginUrl(null, 'https://example.com')).toBe(false);
  });
});
