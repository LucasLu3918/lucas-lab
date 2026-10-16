import { createApp } from 'vue';
import OfflineBookControls from './features/reader/OfflineBookControls.vue';
import ReadingProgress from './features/reader/ReadingProgress.vue';
import ReaderPreferences from './features/reader/ReaderPreferences.vue';
import StoryContinue from './features/reader/StoryContinue.vue';

document.querySelectorAll('[data-vue-reader-preferences]').forEach(target => {
  createApp(ReaderPreferences).mount(target);
  (target as HTMLElement).dataset.vueReaderMounted = 'true';
  delete (target as HTMLElement).dataset.vueReaderLoading;
});

document.querySelectorAll<HTMLElement>('[data-vue-reading-progress]').forEach(target => {
  const props = { story: target.dataset.story || '', title: target.dataset.storyTitle || '', url: target.dataset.storyUrl || '', chapterId: target.dataset.chapterId || '', chapterTitle: target.dataset.chapterTitle || '', chapterUrl: target.dataset.chapterUrl || '' };
  createApp(ReadingProgress, props).mount(target);
  target.dataset.vueReaderMounted = 'true';
});

document.querySelectorAll<HTMLElement>('[data-vue-story-progress]').forEach(target => {
  const props = { story: target.dataset.story || '', firstChapterUrl: target.dataset.firstChapterUrl || '', chapterCount: Number(target.dataset.chapterCount) || 0, gameUrl: target.dataset.gameUrl || '' };
  createApp(StoryContinue, props).mount(target);
  target.dataset.vueReaderMounted = 'true';
});

document.querySelectorAll<HTMLElement>('[data-vue-offline-controls]').forEach(target => {
  const props = { slug: target.dataset.offlineSave || '', manifestUrl: target.dataset.offlineSrc || '' };
  if (!window.isSecureContext || typeof caches === 'undefined') return;
  target.hidden = false;
  createApp(OfflineBookControls, props).mount(target);
  target.dataset.vueReaderMounted = 'true';
});
