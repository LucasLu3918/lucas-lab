<script setup lang="ts">
import { shallowRef } from 'vue';
import type { PipesAction, PipesSnapshot } from './pipes';

const props = defineProps<{
  snapshot: PipesSnapshot;
  onAction: (action: PipesAction) => PipesSnapshot;
}>();

const state = shallowRef(props.snapshot);
const pipeCells = new Map(state.value.tiles.map((tile, index) => [tile.at, index]));
const cells = Array.from({ length: 9 }, (_, at) => ({ at, pipeIndex: pipeCells.get(at) ?? -1 }));
const steps = { ArrowUp: -3, ArrowDown: 3, ArrowLeft: -1, ArrowRight: 1 } as const;

function dispatch(action: PipesAction): void {
  state.value = props.onAction(action);
}

function handleKeydown(event: KeyboardEvent): void {
  const step = steps[event.key as keyof typeof steps];
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-pipe]');
  if (!step || !button) return;

  event.preventDefault();
  const tileIndex = Number(button.dataset.pipe);
  const from = state.value.tiles[tileIndex]?.at;
  if (from === undefined) return;

  for (let at = from + step; at >= 0 && at < 9; at += step) {
    if (Math.abs(step) === 1 && Math.floor(at / 3) !== Math.floor(from / 3)) break;
    const next = pipeCells.get(at);
    if (next !== undefined) {
      button.closest('.pipes-board')?.querySelector<HTMLButtonElement>(`[data-pipe="${next}"]`)?.focus();
      break;
    }
  }
}
</script>

<template>
  <div class="pipes-puzzle">
    <div class="pipe-legend"><span>◆ 通汽管段</span><span>○ 尚未通汽</span></div>
    <div class="pipes-board" role="group" aria-label="三乘三蒸汽管網" @keydown="handleKeydown">
      <template v-for="cell in cells" :key="cell.at">
        <div
          v-if="cell.at === 0 || cell.at === 8"
          class="pipe-terminal"
          :class="[{ flowing: cell.at === 0 || state.solved }, cell.at === 0 ? 'pipe-source' : 'pipe-city']"
          :data-pipe-cell="cell.at"
          role="img"
          :aria-label="cell.at === 0 ? '泉源，出汽口向右' : `城市，進汽口向左，${state.solved ? '已接通' : '等待供暖'}`"
        >
          <span class="pipe-glyph" :class="cell.at === 0 ? 'pipe-source' : 'pipe-city'" aria-hidden="true" />
          <strong>{{ cell.at === 0 ? '泉源 →' : '→ 城市' }}</strong>
          <small class="pipe-terminal-status">
            {{ cell.at === 0 ? '持續供汽' : state.solved ? '已接通' : '等待供暖' }}
          </small>
        </div>
        <div v-else-if="cell.pipeIndex < 0" class="pipe-empty" aria-label="不可通行的岩壁">岩壁</div>
        <button
          v-else
          class="pipe-piece"
          :class="[{ flowing: state.tiles[cell.pipeIndex].flowing }, `rotation-${state.tiles[cell.pipeIndex].rotation % 4}`]"
          :data-pipe="cell.pipeIndex"
          :data-pipe-ports="state.tiles[cell.pipeIndex].directions.join(',')"
          :aria-label="`第${Math.floor(cell.at / 3) + 1}排第${cell.at % 3 + 1}格，${state.tiles[cell.pipeIndex].type === 'straight' ? '直管' : '彎管'}，管口向${state.tiles[cell.pipeIndex].directions.join('、')}，${state.tiles[cell.pipeIndex].flowing ? '蒸汽已通' : '尚未通汽'}`"
          aria-describedby="pipes-keyboard"
          @click="dispatch({ type: 'rotate', index: cell.pipeIndex })"
        >
          <span class="pipe-glyph" :class="`pipe-${state.tiles[cell.pipeIndex].type}`" aria-hidden="true" />
          <small class="pipe-coordinate">{{ Math.floor(cell.at / 3) + 1 }} · {{ cell.at % 3 + 1 }}</small>
          <span class="pipe-connected" :hidden="!state.tiles[cell.pipeIndex].flowing">◆ 通汽</span>
        </button>
      </template>
    </div>
    <div class="pipe-actions">
      <button id="pipes-undo" class="secondary-button" :disabled="!state.canUndo" @click="dispatch({ type: 'undo' })">↶ 上一步</button>
      <button id="pipes-reset" class="secondary-button" @click="dispatch({ type: 'reset' })">重新接管</button>
      <button id="pipes-hint" class="secondary-button" :disabled="state.hintCount === state.hintLimit" @click="dispatch({ type: 'hint' })">查看提示</button>
    </div>
    <p id="pipes-status" class="challenge-feedback" role="status">{{ state.status }}</p>
    <p id="pipes-break" class="pipe-explanation">{{ state.explanation }}</p>
    <p id="pipes-keyboard" class="pipe-keyboard">鍵盤：Tab 選取，Enter 旋轉；方向鍵換格。</p>
    <button id="pipes-confirm" class="primary-button" :disabled="!state.solved" @click="dispatch({ type: 'confirm' })">
      {{ state.solved ? '確認管網接通 ⟶' : '接通管線後才能確認' }}
    </button>
    <p id="pipes-hint-text" class="pipe-hint" role="status">{{ state.hintText }}</p>
  </div>
</template>
