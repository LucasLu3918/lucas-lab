<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import type { LightPuzzleAction, LightPuzzleSnapshot } from './light';

const props = defineProps<{
  snapshot: LightPuzzleSnapshot;
  onAction: (action: LightPuzzleAction) => LightPuzzleSnapshot | null;
}>();

const snapshot = shallowRef(props.snapshot);
const beam = computed(() => new Set(snapshot.value.beamCells.map(cell => `${cell.row},${cell.column}`)));
const mirrors = computed(() => new Map(snapshot.value.mirrors.map(mirror => [`${mirror.row},${mirror.column}`, mirror] as const)));
const cells = computed(() => Array.from({ length: 30 }, (_, index) => {
  const row = Math.floor(index / 6);
  const column = index % 6;
  const mirror = mirrors.value.get(`${row},${column}`);
  const door = row === 1 && column === 5;
  const lit = beam.value.has(`${row},${column}`);
  return { row, column, mirror, door, lit };
}));

function act(action: LightPuzzleAction) {
  const next = props.onAction(action);
  if (next) snapshot.value = next;
}

function flip(index: number) {
  act({ type: 'flip', index });
}
</script>

<template>
  <p class="challenge-help">
    伊萊指向鏡廳：「暗門只有月光能打開。月光從左邊第三列射入，要走到右邊第二列的暗門——翻轉四面鏡子，替它找一條路。」
  </p>
  <div
    class="light-board"
    role="group"
    aria-label="鏡廳光路，五列六行；月光從第三列左端射入，暗門在第二列右端"
  >
    <template v-for="cell in cells" :key="`${cell.row},${cell.column}`">
      <button
        v-if="cell.mirror"
        class="light-cell light-mirror"
        :class="[`o${cell.mirror.orientation}`, { beam: cell.lit }]"
        :data-mirror="cell.mirror.index"
        :aria-label="`第${cell.row + 1}列第${cell.column + 1}行的鏡子，目前是「${cell.mirror.orientation ? '＼' : '／'}」，按下翻轉${cell.lit ? '，月光照在這裡' : ''}`"
        :aria-pressed="cell.mirror.orientation === 1"
        type="button"
        @click="flip(cell.mirror.index)"
      >{{ cell.mirror.orientation ? '＼' : '／' }}</button>
      <span
        v-else-if="cell.door"
        class="light-cell light-door"
        :class="{ open: snapshot.doorOpen }"
        role="img"
        aria-label="暗門，在第二列的右端"
      />
      <span
        v-else
        class="light-cell"
        :class="{ beam: cell.lit }"
        aria-hidden="true"
      >{{ cell.lit ? '·' : '' }}</span>
    </template>
  </div>
  <p class="challenge-feedback" role="status">{{ snapshot.status }}</p>
  <button id="light-reset" class="secondary-button" type="button" @click="act({ type: 'reset' })">
    鏡子歸位
  </button>
</template>
