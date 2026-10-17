<script setup lang="ts">
import { computed } from 'vue';
import type { JournalChapter } from './journal';

const props = defineProps<{ chapters: JournalChapter[] }>();
const isEmpty = computed(() => props.chapters.every(chapter => chapter.entries.length === 0));
</script>

<template>
  <div>
    <section v-for="chapter in chapters" :key="chapter.index" class="journal-chapter">
      <template v-if="chapter.entries.length">
        <h3>{{ chapter.chapter }} · {{ chapter.title }}</h3>
        <article v-for="entry in chapter.entries" :key="entry.id" class="journal-entry">
          <h4>{{ entry.label }}</h4>
          <p>{{ entry.text }}</p>
        </article>
      </template>
    </section>
    <p v-if="isEmpty" class="modal-text">
      這裡還沒有線索。回到場景探索，發現的內容會自動記錄。
    </p>
  </div>
</template>
