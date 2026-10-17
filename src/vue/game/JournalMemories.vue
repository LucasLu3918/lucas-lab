<script setup lang="ts">
import type { JournalMemory } from './journal';

defineProps<{ memories: JournalMemory[] }>();
</script>

<template>
  <div>
    <article
      v-for="memory in memories"
      :key="memory.id"
      class="journal-entry memory-entry"
      :class="{ locked: !memory.found }"
    >
      <template v-if="memory.found">
        <h4>{{ memory.chapter }} · {{ memory.label }}</h4>
        <p>{{ memory.text }}</p>
      </template>
      <template v-else>
        <h4>{{ memory.chapter }} · {{ memory.title }}</h4>
        <p>尚未發現。這段記憶藏在{{ memory.title }}。</p>
      </template>
    </article>
  </div>
</template>
