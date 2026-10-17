<script setup lang="ts">
import { computed, shallowRef } from 'vue';

type Direction = 'L' | 'R' | 'U' | 'D';
type CellKind = 'wall' | 'floor' | 'gate' | 'exit';
type MazeAction =
  | { type: 'move'; direction: Direction }
  | { type: 'watch' }
  | { type: 'reset' };
type MazeSnapshot = {
  rows: number;
  columns: number;
  cells: CellKind[];
  position: [number, number];
  steps: number;
  message: string;
  gateOpen: boolean;
};

const props = defineProps<{
  snapshot: MazeSnapshot;
  onAction: (action: MazeAction) => MazeSnapshot;
}>();

const state = shallowRef(props.snapshot);
const directions: Direction[] = ['U', 'L', 'D', 'R'];
const labels: Record<Direction, string> = { L: '向左', R: '向右', U: '向前', D: '向後' };
const keys: Record<string, Direction> = {
  ArrowLeft: 'L',
  ArrowRight: 'R',
  ArrowUp: 'U',
  ArrowDown: 'D',
};
const cells = computed(() => state.value.cells.map((kind, index) => {
  const row = Math.floor(index / state.value.columns);
  const column = index % state.value.columns;
  const here = row === state.value.position[0] && column === state.value.position[1];
  const closedGate = kind === 'gate' && !state.value.gateOpen;
  const label = here
    ? '倒影在這裡'
    : kind === 'wall'
      ? '鏡牆'
      : closedGate
        ? '關上的鏡門'
        : kind === 'exit'
          ? '出口'
          : '走道';

  return { index, row, column, kind, here, closedGate, label };
}));

function dispatch(action: MazeAction): void {
  state.value = props.onAction(action);
}

function handleKeydown(event: KeyboardEvent): void {
  const direction = keys[event.key];
  if (!direction) return;
  event.preventDefault();
  dispatch({ type: 'move', direction });
}
</script>

<template>
  <div class="maze-puzzle" @keydown="handleKeydown">
    <div
      class="maze-board"
      role="group"
      :aria-label="`鏡中迷廊，${state.rows}列${state.columns}行；倒影從左上角出發，出口在最下一列`"
    >
      <span
        v-for="cell in cells"
        :key="cell.index"
        class="maze-cell"
        :class="{ wall: cell.kind === 'wall', gate: cell.closedGate, exit: cell.kind === 'exit', here: cell.here }"
        role="img"
        :aria-label="`第${cell.row + 1}列第${cell.column + 1}行：${cell.label}`"
      />
      <span
        class="maze-token"
        :class="[`r${state.position[0]}`, `c${state.position[1]}`]"
        aria-hidden="true"
      />
    </div>
    <div class="maze-pad" role="group" aria-label="操作方向（左右與倒影相反）">
      <button
        v-for="direction in directions"
        :key="direction"
        class="maze-key"
        :class="`maze-${direction}`"
        :data-walk="direction"
        :aria-label="`妳${labels[direction]}${direction === 'L' || direction === 'R' ? `（倒影向${direction === 'L' ? '右' : '左'}）` : ''}`"
        @click="dispatch({ type: 'move', direction })"
      >
        <span class="maze-arrow" aria-hidden="true" />
      </button>
    </div>
    <p id="maze-status" class="challenge-feedback" role="status">
      {{ state.message || `已走 ${state.steps} 步` }}
    </p>
    <button
      id="maze-watch"
      class="secondary-button"
      :disabled="state.gateOpen"
      @click="dispatch({ type: 'watch' })"
    >
      {{ state.gateOpen ? '鏡門已回到還沒關上的時刻' : '轉動黃金懷錶' }}
    </button>
    <button id="maze-reset" class="secondary-button" @click="dispatch({ type: 'reset' })">
      倒影回到起點
    </button>
  </div>
</template>
