<template>
  <div class="inventory">
    <button
      v-for="item in items"
      :key="item.id"
      type="button"
      :data-item="item.id"
      :title="item.name"
      :aria-label="`檢視${item.name}`"
      @click="emit('select', item.id)"
    >
      <span aria-hidden="true" v-html="item.iconMarkup" />
      <span>{{ item.name }}</span>
    </button>
    <p v-if="items.length === 0" class="inventory-empty">
      空蕩蕩的口袋，等待第一條線索。
    </p>
  </div>
</template>

<script setup lang="ts">
import type { InventoryItemView } from './inventory';

defineProps<{ items: InventoryItemView[] }>();
const emit = defineEmits<{ select: [id: string] }>();
</script>
