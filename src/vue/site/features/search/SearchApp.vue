<script setup lang="ts">
import ChapterSearchResults from './ChapterSearchResults.vue';
import SearchControls from './SearchControls.vue';
import SearchResults from './SearchResults.vue';
import { useSiteSearch } from './useSiteSearch';
import type { SearchItem } from './search';

const props = defineProps<{ items: SearchItem[]; indexSrc: string; initialQuery?: string; initialCategory?: string }>();
const {
  query,
  activeCategory,
  categories,
  groups,
  resultCount,
  chapterResults,
  chapterStatus,
  chapterSearchVisible,
} = useSiteSearch(props.items, props.indexSrc, props.initialQuery, props.initialCategory);
</script>

<template>
  <section class="wrap section vue-search" aria-label="全站作品搜尋">
    <SearchControls
      v-model:query="query"
      :categories="categories"
      :active-category="activeCategory"
      @select-category="activeCategory = $event"
    />
    <SearchResults :groups="groups" :count="resultCount" />
    <ChapterSearchResults
      :visible="chapterSearchVisible"
      :items="chapterResults"
      :status="chapterStatus"
    />
  </section>
</template>
