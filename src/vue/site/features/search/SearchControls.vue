<script setup lang="ts">
import BaseTextField from '../../../shared/components/BaseTextField.vue';

defineProps<{ categories: string[]; activeCategory: string }>();
const query = defineModel<string>('query', { default: '' });
const emit = defineEmits<{ selectCategory: [category: string] }>();
</script>

<template>
  <div class="toolbar vue-search__toolbar">
    <BaseTextField
      v-model="query"
      class="vue-search__field"
      label="搜尋作品"
      type="search"
      placeholder="搜尋名稱、分類或關鍵字"
      autocomplete="off"
    />
    <div class="filters" role="group" aria-label="分類篩選">
      <button
        type="button"
        class="filter"
        :aria-pressed="activeCategory === 'all'"
        @click="emit('selectCategory', 'all')"
      >全部</button>
      <button
        v-for="category in categories"
        :key="category"
        type="button"
        class="filter"
        :aria-pressed="activeCategory === category"
        @click="emit('selectCategory', category)"
      >{{ category }}</button>
    </div>
  </div>
</template>

<style scoped>
.vue-search__field {
  flex: 1 1 225px;
  max-width: 355px;
  min-width: 0;
}

.vue-search__field :deep(.ll-text-field__label) {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.vue-search__field :deep(.ll-text-field__input) {
  min-width: 0;
}

@media (max-width: 720px) {
  .vue-search__field {
    flex-basis: 100%;
    max-width: none;
  }
}
</style>
