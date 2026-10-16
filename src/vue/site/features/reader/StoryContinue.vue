<script setup lang="ts">
import { computed } from 'vue';
import { createBrowserReadingProgressRepository } from './ReadingProgressRepository';
import { isSameOriginUrl } from './readingProgress';

const props = defineProps<{ story: string; firstChapterUrl: string; chapterCount: number; gameUrl: string }>();
const saved = createBrowserReadingProgressRepository().load().stories[props.story];
const canContinue = Boolean(saved?.chapterTitle && isSameOriginUrl(saved.chapterUrl, location.origin));
const readCount = computed(() => Array.isArray(saved?.read) ? saved.read.length : 0);
</script>

<template>
  <div class="btnrow story-actions">
    <a v-if="canContinue" class="btn primary" :href="saved?.chapterUrl" data-story-continue>繼續閱讀：{{ saved?.chapterTitle }}</a>
    <a class="btn" :class="{ primary: !canContinue }" :href="firstChapterUrl" data-story-start>{{ canContinue ? '從頭開始閱讀' : '開始閱讀 →' }}</a>
    <a v-if="gameUrl" class="btn" :href="gameUrl">探索同名遊戲 →</a>
  </div>
  <p v-show="canContinue" class="label" data-story-progress>
    讀到：{{ saved?.chapterTitle }} · 已讀 {{ readCount }} / {{ chapterCount }} 章
  </p>
</template>
