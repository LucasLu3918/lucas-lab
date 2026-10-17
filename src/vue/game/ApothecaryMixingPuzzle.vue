<script setup lang="ts">
import { shallowRef } from 'vue';
import type { ApothecaryMixingAction, ApothecaryMixingSnapshot } from './apothecary-mixing';

const props = defineProps<{
  snapshot: ApothecaryMixingSnapshot;
  onAction: (action: ApothecaryMixingAction) => ApothecaryMixingSnapshot;
}>();

const state = shallowRef(props.snapshot);
const pigments = [
  { name: '紅', mark: '▲', className: 'apo-pigment-R' },
  { name: '黃', mark: '◆', className: 'apo-pigment-Y' },
  { name: '藍', mark: '■', className: 'apo-pigment-B' },
] as const;

function swatchColor(color: [number, number, number]): string {
  return `rgb(${color.map(Math.round).join(', ')})`;
}

function dispatch(action: ApothecaryMixingAction): void {
  state.value = props.onAction(action);
}
</script>

<template>
  <div class="apothecary-mixing-puzzle">
    <div class="apo-mixer" aria-label="配方色與混色結果">
      <div
        id="apo-ref"
        class="apo-swatch"
        :class="{ glass: !state.mirror }"
        :style="{ backgroundColor: swatchColor(state.recipeColor) }"
        role="img"
        :aria-label="state.recipeAriaLabel"
      >
        <span>{{ state.recipeLabel }}</span>
      </div>
      <div
        id="apo-mix"
        class="apo-swatch"
        :class="{ lit: state.finished }"
        :style="{ backgroundColor: swatchColor(state.mixedColor) }"
        role="img"
        :aria-label="`${state.mixLabel}，${state.drops.join('、')} 滴`"
      >
        <span>{{ state.mixLabel }}</span>
      </div>
    </div>

    <div class="belfry-row apo-mixing-mirror-row">
      <button
        id="apo-mirror"
        class="secondary-button"
        type="button"
        :aria-pressed="state.mirror"
        @click="dispatch({ type: 'toggle-mirror' })"
      >舉起手持鏡</button>
      <span class="apo-note">看配方真正的顏色</span>
    </div>

    <div class="apo-drops" role="group" aria-label="調整色精滴數">
      <div v-for="(pigment, index) in pigments" :key="pigment.name" class="apo-drop">
        <b :class="pigment.className">{{ pigment.mark }}{{ pigment.name }}色精</b>
        <button
          class="secondary-button"
          type="button"
          :aria-label="`${pigment.name}減一滴`"
          :disabled="state.finished || state.drops[index] === 0"
          @click="dispatch({ type: 'change-drops', pigment: index, step: -1 })"
        >−</button>
        <span class="apo-count" role="status">{{ state.drops[index] }} 滴</span>
        <button
          class="secondary-button"
          type="button"
          :aria-label="`${pigment.name}加一滴`"
          :disabled="state.finished || state.drops[index] === 4"
          @click="dispatch({ type: 'change-drops', pigment: index, step: 1 })"
        >＋</button>
      </div>
    </div>

    <p id="apo-close" class="apo-note" aria-live="polite">{{ state.closeMessage }}</p>
    <p id="apo-dir" class="apo-note" aria-live="polite">{{ state.directionMessage }}</p>
    <p id="bf-status" class="belfry-status" role="status" :data-tone="state.tone">{{ state.message }}</p>
  </div>
</template>
