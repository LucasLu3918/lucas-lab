<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  left: boolean[];
  right: boolean[];
  onChange: (right: boolean[]) => void;
}>();

const right = ref([...props.right]);
const cells = computed(() => Array.from({ length: 16 }, (_, index) => {
  const row = Math.floor(index / 4);
  const column = index % 4;
  const cell = row * 2 + (column < 2 ? column : column - 2);
  const fixed = column < 2;
  return {
    index: fixed ? -1 : cell,
    fixed,
    lit: fixed ? props.left[cell] : right.value[cell],
    label: fixed
      ? `手稿第${row + 1}列第${column + 1}格，${props.left[cell] ? '亮' : '暗'}`
      : `鏡中第${row + 1}列第${column - 1}格，${right.value[cell] ? '亮' : '暗'}`,
  };
}));
const mirroredRows = computed(() => Array.from({ length: 4 }, (_, row) =>
  props.left[row * 2] === right.value[row * 2 + 1]
  && props.left[row * 2 + 1] === right.value[row * 2],
).filter(Boolean).length);

function toggle(index: number) {
  if (index < 0) return;
  right.value[index] = !right.value[index];
  props.onChange([...right.value]);
}
</script>

<template>
  <div class="reflection-board" role="group" aria-label="反寫手稿光紋">
    <button
      v-for="(cell, index) in cells"
      :key="index"
      class="reflection-cell"
      :class="{ glow: cell.lit, fixed: cell.fixed }"
      :data-reflection="cell.index"
      :disabled="cell.fixed"
      :aria-label="cell.label"
      :aria-pressed="cell.fixed ? undefined : cell.lit"
      @click="toggle(cell.index)"
    >
      {{ cell.lit ? '✦' : '·' }}
    </button>
  </div>
  <p class="challenge-feedback" role="status">
    已映照 {{ mirroredRows }} / 4 列。右側必須是左側的左右翻轉。
  </p>
</template>
