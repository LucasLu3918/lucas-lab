<script setup lang="ts">
import { shallowRef } from 'vue';
import {
  VESSEL_CAPACITIES,
  VESSEL_NAMES,
  VESSEL_TUBES,
  type ApothecaryVesselsAction,
  type ApothecaryVesselsSnapshot,
} from './apothecary-vessels';

const props = defineProps<{
  snapshot: ApothecaryVesselsSnapshot;
  onAction: (action: ApothecaryVesselsAction) => ApothecaryVesselsSnapshot;
}>();

const state = shallowRef(props.snapshot);
const xPositions = [15, 215, 125] as const;
const tubePaths = [
  'M63 62L119 62',
  'M173 72L209 72',
  'M237 48C237 -26 37 -26 37 20',
] as const;

function vesselTop(index: number): number {
  return 96 - VESSEL_CAPACITIES[index] * (70 / 8);
}

function vesselLevel(index: number): number {
  return state.value.amounts[index] * (70 / 8);
}

function dispatch(action: ApothecaryVesselsAction): void {
  state.value = props.onAction(action);
}
</script>

<template>
  <div class="apothecary-vessels-puzzle">
    <svg
      class="belfry-svg"
      viewBox="0 -34 275 150"
      role="img"
      aria-labelledby="apo-vessels-title apo-vessels-description"
    >
      <title id="apo-vessels-title">三個量杯與單向管線</title>
      <desc id="apo-vessels-description">A 杯容量 8，B 杯容量 5，C 杯容量 3。管線方向為 A 到 C、C 到 B、B 到 A。</desc>
      <defs>
        <marker id="apo-vessels-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0 0L7 3.5L0 7z" fill="#e0b84f" />
        </marker>
      </defs>
      <g v-for="(name, index) in VESSEL_NAMES" :key="name" :data-vessel="name">
        <rect class="apo-shadow" :x="xPositions[index] + 2.5" :y="vesselTop(index) + 2.5" width="44" :height="VESSEL_CAPACITIES[index] * (70 / 8) + 2" rx="4" />
        <rect class="apo-glass-back" :x="xPositions[index]" :y="vesselTop(index)" width="44" :height="VESSEL_CAPACITIES[index] * (70 / 8)" rx="4" />
        <rect class="apo-liquid" :x="xPositions[index] + 1.6" :y="96 - vesselLevel(index)" width="40.8" :height="vesselLevel(index)" />
        <rect v-if="vesselLevel(index) > 0" class="apo-surface" :x="xPositions[index] + 1.6" :y="96 - vesselLevel(index)" width="40.8" height="1.6" />
        <rect class="apo-glass" :x="xPositions[index]" :y="vesselTop(index)" width="44" :height="VESSEL_CAPACITIES[index] * (70 / 8)" rx="4" />
        <rect class="apo-glint" :x="xPositions[index] + 5" :y="vesselTop(index) + 5" width="4" :height="Math.max(VESSEL_CAPACITIES[index] * (70 / 8) - 10, 4)" rx="2" />
        <rect class="apo-base" :x="xPositions[index] - 3" y="96" width="50" height="5" rx="2" />
        <text :x="xPositions[index] + 22" y="109" text-anchor="middle" font-size="9.5" fill="#e9dcc3">
          {{ name }} 杯（容量 {{ VESSEL_CAPACITIES[index] }}）
        </text>
        <text :x="xPositions[index] + 22" :y="Math.min(96 - vesselLevel(index) - 4, 90)" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">
          {{ state.amounts[index] }}
        </text>
      </g>
      <g v-for="(tube, index) in VESSEL_TUBES" :key="index" class="apo-vessel-tube">
        <path :d="tubePaths[index]" fill="none" stroke="#e0b84f" stroke-width="3" marker-end="url(#apo-vessels-arrow)" />
        <text
          :x="index === 0 ? 88 : index === 1 ? 191 : 137"
          :y="index === 0 ? 54 : index === 1 ? 64 : -23"
          text-anchor="middle"
          font-size="9.5"
          font-weight="700"
          fill="#e0b84f"
        >{{ VESSEL_NAMES[tube.from] }}→{{ VESSEL_NAMES[tube.to] }}</text>
      </g>
    </svg>

    <div class="belfry-row apo-vessel-controls" aria-label="量杯操作">
      <button
        v-for="(tube, index) in VESSEL_TUBES"
        :id="`apo-tube-${index}`"
        :key="index"
        class="secondary-button"
        :data-tube="index"
        :disabled="!state.enabledTubes[index] || state.finished"
        @click="dispatch({ type: 'pour', tube: index })"
      >倒 {{ VESSEL_NAMES[tube.from] }} 杯至 {{ VESSEL_NAMES[tube.to] }} 杯</button>
      <button id="apo-undo" class="secondary-button" :disabled="!state.canUndo" @click="dispatch({ type: 'undo' })">復原</button>
      <button id="apo-restart" class="secondary-button" :disabled="!state.canRestart" @click="dispatch({ type: 'restart' })">重來</button>
      <span id="apo-moves" class="apo-note" aria-live="polite">已倒 {{ state.moveCount }} 次</span>
    </div>
    <p id="bf-status" class="belfry-status" role="status" :data-tone="state.tone">{{ state.message }}</p>
  </div>
</template>
