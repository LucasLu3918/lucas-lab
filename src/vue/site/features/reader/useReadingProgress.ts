import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ReadingProgressRepository } from './ReadingProgressRepository';
import { progressForPosition, recordChapterProgress } from './readingProgress';

export interface ReaderMetadata {
  story: string;
  title: string;
  url: string;
  chapterId: string;
  chapterTitle: string;
  chapterUrl: string;
}

export function useReadingProgress(reader: HTMLElement | null, metadata: ReaderMetadata, repository: ReadingProgressRepository) {
  const percent = ref(0);
  const resumePercent = ref<number | null>(null);
  const savedProgress = repository.load();
  const saved = savedProgress.stories[metadata.story];
  if (saved?.chapterId === metadata.chapterId && saved.percent >= 3 && saved.percent < 90) {
    resumePercent.value = saved.percent;
  }

  let frame = 0;
  let trailing = 0;
  let lastSaved = -1;
  let lastWrite = 0;
  const resumeLabel = computed(() => Math.round(resumePercent.value ?? 0) + '%');

  function track(): void {
    if (!reader) return;
    const rect = reader.getBoundingClientRect();
    const result = progressForPosition({ top: rect.top, bottom: rect.bottom, height: rect.height, viewportHeight: window.innerHeight });
    percent.value = result.percent;
    if (result.percent === lastSaved && !result.finished) return;
    const now = Date.now();
    if (now - lastWrite < 800 && !result.finished) {
      window.clearTimeout(trailing);
      trailing = window.setTimeout(track, 820 - (now - lastWrite));
      return;
    }
    lastSaved = result.percent;
    lastWrite = now;
    const current = repository.load();
    const next = recordChapterProgress(current, {
      storySlug: metadata.story,
      title: metadata.title,
      url: metadata.url,
      chapterId: metadata.chapterId,
      chapterTitle: metadata.chapterTitle,
      chapterUrl: metadata.chapterUrl,
      percent: result.percent,
      updated: now,
    }, result.finished);
    repository.save(next);
  }

  function scheduleTrack(): void {
    if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; track(); });
  }

  function resume(): void {
    if (!reader || resumePercent.value === null) return;
    const rect = reader.getBoundingClientRect();
    const span = Math.max(0, rect.height - window.innerHeight);
    window.scrollTo({ top: rect.top + window.scrollY + span * resumePercent.value / 100 });
    resumePercent.value = null;
  }

  onMounted(() => {
    window.addEventListener('scroll', scheduleTrack, { passive: true });
    window.addEventListener('resize', scheduleTrack);
    window.addEventListener('readerpreferenceschange', scheduleTrack);
    if (resumePercent.value === null) track();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', scheduleTrack);
    window.removeEventListener('resize', scheduleTrack);
    window.removeEventListener('readerpreferenceschange', scheduleTrack);
    window.cancelAnimationFrame(frame);
    window.clearTimeout(trailing);
  });

  return { percent, resumePercent, resumeLabel, resume };
}
