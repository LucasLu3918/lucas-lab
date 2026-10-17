<script setup lang="ts">
import type { Gears13Snapshot } from './gears13';

defineProps<{ snapshot: Gears13Snapshot }>();
const emit = defineEmits<{
  layer: [layer: number];
  ruler: [];
  reset: [];
  run: [];
}>();
</script>

<template>
  <p id="bf-status" class="belfry-status" :data-tone="snapshot.tone" role="status" aria-live="polite">
    {{ snapshot.status }}
  </p>
  <div class="belfry-row">
    <span id="bf-layers">
      <button
        v-for="layer in snapshot.layers"
        :key="layer"
        class="secondary-button belfry-layer"
        type="button"
        :aria-pressed="snapshot.selectedLayer === layer - 1"
        @click="emit('layer', layer - 1)"
      >
        {{ layer === 1 ? '下層（金）' : '上層（銅）' }}
      </button>
    </span>
    <button id="bf-ruler" class="secondary-button" type="button" :aria-pressed="snapshot.ruler" @click="emit('ruler')">
      {{ snapshot.ruler ? '隱藏軸座距離' : '顯示軸座距離' }}
    </button>
    <button id="bf-reset" class="secondary-button" type="button" :disabled="snapshot.running" @click="emit('reset')">重來</button>
    <span id="bf-counter" class="belfry-note">{{ snapshot.counter }}</span>
  </div>
  <button v-if="snapshot.canRun" id="bf-run" class="primary-button" type="button" :disabled="snapshot.running" @click="emit('run')">
    {{ snapshot.runLabel }}
  </button>
</template>
