import { createApp } from 'vue';
import ReaderPreferences from './features/reader/ReaderPreferences.vue';

document.querySelectorAll('[data-vue-reader-preferences]').forEach(target => {
  createApp(ReaderPreferences).mount(target);
  (target as HTMLElement).dataset.vueReaderMounted = 'true';
  delete (target as HTMLElement).dataset.vueReaderLoading;
});
