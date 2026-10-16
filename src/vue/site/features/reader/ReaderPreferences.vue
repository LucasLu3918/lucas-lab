<script setup lang="ts">
import { createBrowserReaderPreferencesRepository, type ReaderPreferencesRepository } from './ReaderPreferencesRepository';
import { useReaderPreferences } from './useReaderPreferences';

const props = defineProps<{ repository?: ReaderPreferencesRepository }>();
const { preferences, canDecreaseFont, canIncreaseFont, update } = useReaderPreferences(
  props.repository ?? createBrowserReaderPreferencesRepository(),
);
</script>

<template>
  <div class="control-group" role="group" aria-label="閱讀主題">
    <button type="button" data-theme="paper" :aria-pressed="preferences.theme === 'paper'" @click="update({ type: 'set-theme', theme: 'paper' })">
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
      紙張
    </button>
    <button type="button" data-theme="night" :aria-pressed="preferences.theme === 'night'" @click="update({ type: 'set-theme', theme: 'night' })">
      <svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.9 12.5A9 9 0 0 1 11.5 3a9 9 0 1 0 9.4 9.5Z" /></svg>
      夜間
    </button>
  </div>
  <div class="control-group reader-buttons" role="group" aria-label="文字大小">
    <button type="button" data-font="-1" aria-label="縮小字體" :disabled="!canDecreaseFont" @click="update({ type: 'change-font', delta: -1 })">A−</button>
    <span data-size aria-live="polite">{{ preferences.font }}px</span>
    <button type="button" data-font="1" aria-label="放大字體" :disabled="!canIncreaseFont" @click="update({ type: 'change-font', delta: 1 })">A＋</button>
  </div>
</template>
