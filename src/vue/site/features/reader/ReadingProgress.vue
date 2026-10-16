<script setup lang="ts">
import { createBrowserReadingProgressRepository } from './ReadingProgressRepository';
import { useReadingProgress, type ReaderMetadata } from './useReadingProgress';

const props = defineProps<ReaderMetadata>();
const reader = document.querySelector<HTMLElement>('[data-reader]');
const { percent, resumePercent, resumeLabel, resume } = useReadingProgress(
  reader,
  props,
  createBrowserReadingProgressRepository(),
);
</script>

<template>
  <div class="reader-progress-island">
    <div class="reading-progress">
      <span>本章進度</span>
      <progress data-reading-progress :value="percent" max="100" aria-label="本章閱讀進度"></progress>
      <span data-reading-percent>{{ percent }}%</span>
    </div>
    <div v-show="resumePercent !== null" class="resume-prompt" data-resume>
      <p>上次讀到這一章的 <span data-resume-percent>{{ resumeLabel }}</span>。</p>
      <button type="button" class="btn primary" data-resume-action @click="resume">回到上次位置</button>
    </div>
  </div>
</template>
