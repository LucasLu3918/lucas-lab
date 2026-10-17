<script setup lang="ts">
import { shallowRef } from 'vue';
import { parsePendulumSnapshot, type PendulumAction, type PendulumSnapshot } from './pendulum';

const props = defineProps<{
  snapshot: PendulumSnapshot;
  onAction: (action: PendulumAction) => PendulumSnapshot | null;
}>();

const state = shallowRef(props.snapshot);

function dispatch(action: PendulumAction): void {
  const next = parsePendulumSnapshot(props.onAction(action));
  if (next) state.value = next;
}
</script>

<template>
  <div class="pendulum-controls">
    <div id="bf-weights" class="belfry-tray" role="group" aria-label="配重">
      <button
        v-for="weight in state.weights"
        :key="weight.id"
        class="belfry-gear-button belfry-weight"
        :data-weight="weight.id"
        :aria-pressed="weight.attached"
        :aria-label="`${weight.name}配重，${weight.length} 格，${weight.attached ? '已掛上，按下取下' : '按下掛上'}`"
        type="button"
        @click="dispatch({ type: 'toggle-weight', id: weight.id })"
      >
        <span class="pend-disc-slot" aria-hidden="true">
          <img
            :src="'assets/puzzles/pend-disc.webp'"
            alt=""
            :width="Math.round(24 + weight.length * 9)"
            :height="Math.round(24 + weight.length * 9)"
            decoding="async"
            draggable="false"
          >
        </span>
        <b>{{ weight.name }} · {{ weight.length }} 格</b>
      </button>
    </div>
    <button
      v-if="state.canRun"
      id="bf-run"
      class="primary-button"
      type="button"
      @click="dispatch({ type: 'run' })"
    >
      放開擺錘 ⟶
    </button>
  </div>
</template>
