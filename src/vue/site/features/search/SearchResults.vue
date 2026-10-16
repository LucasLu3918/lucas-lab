<script setup lang="ts">
import SearchResultCard from './SearchResultCard.vue';
import type { SearchGroup } from './useSiteSearch';

defineProps<{ groups: SearchGroup[]; count: number }>();
</script>

<template>
  <div>
    <p class="count" aria-live="polite">找到 {{ count }} 個項目</p>
    <section
      v-for="group in groups"
      :key="group.kind"
      class="search-group"
      :aria-label="group.label"
    >
      <h2 class="group-title">{{ group.label }}</h2>
      <div :class="group.gridClass">
        <SearchResultCard v-for="item in group.items" :key="item.id" :item="item" />
      </div>
    </section>
    <div v-if="count === 0" class="empty" role="status">
      找不到符合條件的作品，請更換搜尋詞。
    </div>
  </div>
</template>
