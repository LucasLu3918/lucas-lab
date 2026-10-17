import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import ReaderPreferences from './ReaderPreferences.vue';
import { ReaderPreferencesRepository, type ReaderPreferencesStorage } from './ReaderPreferencesRepository';
import {
  DEFAULT_READER_PREFERENCES,
  normalizeReaderPreferences,
  READER_PREFERENCES_KEY,
  UpdateReaderPreferences,
} from './readerPreferences';

class MemoryStorage implements ReaderPreferencesStorage {
  value: string | null = null;
  getItem(key: string): string | null {
    expect(key).toBe(READER_PREFERENCES_KEY);
    return this.value;
  }
  setItem(key: string, value: string): void {
    expect(key).toBe(READER_PREFERENCES_KEY);
    this.value = value;
  }
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('reader preference rules and persistence', () => {
  it('uses safe defaults and clamps persisted settings to the supported range', () => {
    expect(normalizeReaderPreferences(null)).toEqual(DEFAULT_READER_PREFERENCES);
    expect(normalizeReaderPreferences({ theme: 'other', font: 40 })).toEqual({ theme: 'paper', font: 24 });
    expect(normalizeReaderPreferences({ theme: 'night', font: 12 })).toEqual({ theme: 'night', font: 16 });
  });

  it('updates the theme and font without mutating the current settings', () => {
    const useCase = new UpdateReaderPreferences();
    const current = { theme: 'paper' as const, font: 18 };

    expect(useCase.execute(current, { type: 'set-theme', theme: 'night' })).toEqual({ theme: 'night', font: 18 });
    expect(useCase.execute(current, { type: 'change-font', delta: 1 })).toEqual({ theme: 'paper', font: 19 });
    expect(useCase.execute({ ...current, font: 24 }, { type: 'change-font', delta: 1 }).font).toBe(24);
    expect(current).toEqual({ theme: 'paper', font: 18 });
  });

  it('falls back to defaults when stored JSON is malformed and ignores unavailable storage', () => {
    const malformedStorage = new MemoryStorage();
    malformedStorage.value = '{';
    expect(new ReaderPreferencesRepository(malformedStorage).load()).toEqual(DEFAULT_READER_PREFERENCES);

    const unavailableStorage: ReaderPreferencesStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    };
    const repository = new ReaderPreferencesRepository(unavailableStorage);
    expect(repository.load()).toEqual(DEFAULT_READER_PREFERENCES);
    expect(() => repository.save({ theme: 'night', font: 18 })).not.toThrow();
  });

  it('restores saved preferences in the toolbar and applies user changes to the static article', async () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({ theme: 'night', font: 20 });
    const article = document.createElement('article');
    article.dataset.reader = '';
    const host = document.createElement('div');
    document.body.append(article, host);

    const wrapper = mount(ReaderPreferences, {
      attachTo: host,
      props: { repository: new ReaderPreferencesRepository(storage) },
    });

    expect(wrapper.get('[aria-label="閱讀主題"] [aria-pressed="true"]').text()).toContain('夜間');
    expect(article.classList.contains('night')).toBe(true);
    expect(article.style.getPropertyValue('--reader-size')).toBe('20px');

    await wrapper.get('[aria-label="放大字體 A＋"]').trigger('click');
    expect(wrapper.text()).toContain('21px');
    expect(article.style.getPropertyValue('--reader-size')).toBe('21px');
    expect(JSON.parse(storage.value!)).toEqual({ theme: 'night', font: 21 });

    await wrapper.get('[aria-label="閱讀主題"] button:first-child').trigger('click');
    expect(article.classList.contains('night')).toBe(false);
    expect(JSON.parse(storage.value!).theme).toBe('paper');
  });

  it('disables font controls at the 16px and 24px boundaries', async () => {
    const storage = new MemoryStorage();
    storage.value = JSON.stringify({ theme: 'paper', font: 16 });
    const wrapper = mount(ReaderPreferences, { props: { repository: new ReaderPreferencesRepository(storage) } });
    expect(wrapper.get('[aria-label="縮小字體 A−"]').attributes('disabled')).toBeDefined();
    await wrapper.get('[aria-label="放大字體 A＋"]').trigger('click');
    expect(wrapper.text()).toContain('17px');

    for (let font = 17; font < 24; font += 1) await wrapper.get('[aria-label="放大字體 A＋"]').trigger('click');
    expect(wrapper.text()).toContain('24px');
    expect(wrapper.get('[aria-label="放大字體 A＋"]').attributes('disabled')).toBeDefined();
  });
});
