<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { ledgerPieceLabel, ledgerPieceMarkup, type LedgerAction, type LedgerSnapshot } from './ledger';

const props = defineProps<{
  snapshot: LedgerSnapshot;
  onAction: (action: LedgerAction) => LedgerSnapshot;
}>();

const state = shallowRef(props.snapshot);
const selected = ref<number | null>(null);
const placed = computed(() => state.value.tiles.filter((piece, cell) => piece === cell).length);
const directions = { ArrowUp: -3, ArrowDown: 3, ArrowLeft: -1, ArrowRight: 1 } as const;

function activate(cell: number): void {
  if (selected.value === null) {
    selected.value = cell;
    return;
  }
  if (selected.value === cell) {
    selected.value = null;
    return;
  }

  state.value = props.onAction({ type: 'swap', first: selected.value, second: cell });
  selected.value = null;
}

function handleKeydown(event: KeyboardEvent): void {
  const step = directions[event.key as keyof typeof directions];
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-pos]');
  if (!step || !button) return;

  const cell = Number(button.dataset.pos);
  const next = cell + step;
  if (next < 0 || next > 8 || (Math.abs(step) === 1 && Math.floor(next / 3) !== Math.floor(cell / 3))) return;

  event.preventDefault();
  button.closest('.ledger-board')?.querySelector<HTMLButtonElement>(`[data-pos="${next}"]`)?.focus();
}

function reset(): void {
  state.value = props.onAction({ type: 'reset' });
  selected.value = null;
}
</script>

<template>
  <div class="ledger-puzzle">
    <p class="challenge-help">帳頁被撕成九片。點選兩片碎片交換位置，把出生紀錄拼回原狀。邊框與文字的斷口能告訴妳每片的位置。</p>
    <div class="tile-board ledger-board" role="group" aria-label="拼回出生紀錄的九片帳頁" @keydown="handleKeydown">
      <button
        v-for="(piece, cell) in state.tiles"
        :key="cell"
        class="picture-tile ledger-tile"
        :class="{ selected: selected === cell, placed: piece === cell }"
        :data-pos="cell"
        :aria-label="`第${cell + 1}格碎片：${ledgerPieceLabel(piece)}（圖塊 ${piece + 1}）${piece === cell ? '，已歸位' : ''}`"
        :aria-pressed="selected === cell"
        @click="activate(cell)"
      >
        <span class="ledger-tile-art" aria-hidden="true" v-html="ledgerPieceMarkup(piece)" />
      </button>
    </div>
    <p class="challenge-feedback" role="status">
      {{ placed }} / 9 片碎片已歸位。{{ selected === null ? '選取任意兩片進行交換。' : '再選一片與它交換。' }}
    </p>
    <button id="ledger-reset" class="secondary-button" @click="reset">重新打散碎片</button>
    <p id="ledger-keyboard" class="pipe-keyboard">鍵盤：Tab 選取，Enter 選擇碎片；方向鍵移動格子。</p>
  </div>
</template>
