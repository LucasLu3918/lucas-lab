<script setup lang="ts">
import SearchApp from './features/search/SearchApp.vue';
import type { SearchItem } from './features/search/search';

withDefaults(defineProps<{
  island?: string | null;
  searchItems?: SearchItem[];
  searchIndexSrc?: string;
  initialSearchQuery?: string;
  initialSearchCategory?: string;
}>(), {
  island: null,
  searchItems: () => [],
  searchIndexSrc: '',
  initialSearchCategory: 'all',
});
</script>

<template>
  <SearchApp
    v-if="island === 'search'"
    :items="searchItems"
    :index-src="searchIndexSrc"
    :initial-query="initialSearchQuery"
    :initial-category="initialSearchCategory"
  />
  <div v-else data-vue-scaffold="site">LUCAS LAB Vue island scaffold</div>
</template>
