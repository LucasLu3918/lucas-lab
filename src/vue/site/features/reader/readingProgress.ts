export const READING_PROGRESS_KEY = 'lucaslab.progress.v1';

export interface ChapterProgress {
  title?: string;
  url?: string;
  chapterId: string;
  chapterTitle?: string;
  chapterUrl?: string;
  percent: number;
  updated: number;
  read: string[];
}

export interface ReadingProgressData {
  stories: Record<string, ChapterProgress>;
  [key: string]: unknown;
}

export interface ReaderPosition {
  top: number;
  bottom: number;
  height: number;
  viewportHeight: number;
}

export function normalizeReadingProgress(value: unknown): ReadingProgressData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { stories: {} };
  const candidate = value as { stories?: unknown; [key: string]: unknown };
  if (!candidate.stories || typeof candidate.stories !== 'object' || Array.isArray(candidate.stories)) {
    return { stories: {} };
  }
  return { ...candidate, stories: candidate.stories as Record<string, ChapterProgress> };
}

export function progressForPosition(position: ReaderPosition): { percent: number; finished: boolean } {
  const length = Math.max(1, position.height - position.viewportHeight);
  const percent = Math.round(Math.min(100, Math.max(0, -position.top / length * 100)));
  return {
    percent,
    finished: percent >= 90 || position.bottom <= position.viewportHeight + 8,
  };
}

export function recordChapterProgress(
  current: ReadingProgressData,
  input: Omit<ChapterProgress, 'read'> & { storySlug: string },
  finished: boolean,
): ReadingProgressData {
  const existing = current.stories[input.storySlug];
  const read = Array.isArray(existing?.read) ? [...existing.read] : [];
  if (finished && !read.includes(input.chapterId)) read.push(input.chapterId);
  return {
    ...current,
    stories: {
      ...current.stories,
      [input.storySlug]: {
        ...existing,
        title: input.title,
        url: input.url,
        chapterId: input.chapterId,
        chapterTitle: input.chapterTitle,
        chapterUrl: input.chapterUrl,
        percent: input.percent,
        updated: input.updated,
        read,
      },
    },
  };
}

export function isSameOriginUrl(value: unknown, origin: string): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new URL(value, origin).origin === origin;
  } catch {
    return false;
  }
}
