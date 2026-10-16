<script setup lang="ts">
import type { ChapterSearchItem } from './search';

defineProps<{ visible: boolean; items: ChapterSearchItem[]; status: string }>();
</script>

<template>
  <section v-if="visible" class="section chapter-search" aria-labelledby="chapter-search-title">
    <div class="sectionhead">
      <div>
        <div class="eyebrow">CHAPTERS</div>
        <h2 id="chapter-search-title">章節搜尋</h2>
        <p aria-live="polite">{{ status }}</p>
      </div>
    </div>
    <ol class="chapter-results">
      <li v-for="item in items" :key="item.u">
        <a :href="item.u">
          <strong>{{ item.t }}</strong>
          <span>{{ item.s }}</span>
          <p>{{ item.x }}</p>
        </a>
      </li>
    </ol>
  </section>
</template>
