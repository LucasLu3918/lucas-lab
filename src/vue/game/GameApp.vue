<template>
  <section data-vue-scaffold="game" aria-labelledby="game-app-title">
    <h1 id="game-app-title">LUCAS LAB game app</h1>
    <p v-if="progress" data-game-progress>
      {{ journeyLabel(progress.state) }}
      <span>已完成謎題 {{ progress.puzzles.length }} 項</span>
    </p>
    <p v-else-if="status === 'load-failed'" role="alert">
      無法讀取這個裝置上的旅程進度。
    </p>
    <p v-else data-game-progress>目前沒有可用的旅程進度。</p>

    <button
      type="button"
      data-save-progress
      :disabled="!progress || saveBlocked"
      @click="saveCurrentProgress"
    >
      儲存進度
    </button>
    <p role="status" aria-live="polite">{{ statusMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { GameComposition } from './createGameComposition';
import { useGameProgress } from './useGameProgress';

const props = defineProps<{ composition?: GameComposition<unknown> }>();
const { progress, status, saveBlocked, saveProgress } = useGameProgress(props.composition);

const statusMessage = computed(() => {
  switch (status.value) {
    case 'newer-version': return '此存檔由較新版本建立，請重新整理頁面；目前不會覆寫。';
    case 'load-failed': return '旅程進度讀取失敗。';
    case 'saved': return '旅程進度已儲存。';
    case 'storage-unavailable': return '無法儲存旅程進度，請檢查瀏覽器儲存空間。';
    default: return '';
  }
});

function saveCurrentProgress(): void {
  if (!progress.value) return;
  saveProgress({ state: progress.value.state, puzzles: progress.value.puzzles });
}

function journeyLabel(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('started' in state)) {
    return '旅程進度已載入';
  }
  return state.started ? '已有旅程進度' : '尚未開始旅程';
}
</script>
