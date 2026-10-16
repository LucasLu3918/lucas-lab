import { computed, shallowRef } from 'vue';
import { ReaderPreferencesRepository } from './ReaderPreferencesRepository';
import { UpdateReaderPreferences, type ReaderPreferenceChange } from './readerPreferences';

export function useReaderPreferences(repository: ReaderPreferencesRepository) {
  const preferences = shallowRef(repository.load());
  const updatePreferences = new UpdateReaderPreferences();
  const canDecreaseFont = computed(() => preferences.value.font > 16);
  const canIncreaseFont = computed(() => preferences.value.font < 24);

  function applyPreferences(): void {
    const article = document.querySelector<HTMLElement>('[data-reader]');
    if (article) {
      article.classList.toggle('night', preferences.value.theme === 'night');
      article.style.setProperty('--reader-size', `${preferences.value.font}px`);
    }
    window.dispatchEvent(new Event('readerpreferenceschange'));
  }

  function update(change: ReaderPreferenceChange): void {
    preferences.value = updatePreferences.execute(preferences.value, change);
    repository.save(preferences.value);
    applyPreferences();
  }

  applyPreferences();

  return {
    preferences,
    canDecreaseFont,
    canIncreaseFont,
    update,
  };
}
