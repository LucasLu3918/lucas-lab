<script setup lang="ts">
import type { HintSnapshot } from './hints';

defineProps<{ snapshot: HintSnapshot; count: number }>();
const emit = defineEmits<{ revealNext: [] }>();

function hintButtonText(count: number, total: number): string {
  if (count === 0) return '點亮第一道提示';
  if (count >= total) return '所有提示已展開';
  return '展開更明確的提示';
}
</script>

<template>
  <div data-vue-game-hint-panel>
    <p class="modal-note">提示只針對妳目前卡住的這一步：{{ snapshot.stepName }}。提示不會扣分，也不會改變結局。</p>
    <div v-for="(hint, index) in snapshot.list.slice(0, count)" :key="index" class="hint-step">
      <span>{{ String(index + 1).padStart(2, '0') }}</span>
      <p>{{ hint }}</p>
    </div>
    <button
      id="more-hint"
      class="primary-button"
      type="button"
      :disabled="count >= snapshot.list.length"
      @click="emit('revealNext')"
    >
      {{ hintButtonText(count, snapshot.list.length) }} ✧
    </button>
  </div>
</template>
