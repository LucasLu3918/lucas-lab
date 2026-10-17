<script setup lang="ts">
import { shallowRef } from 'vue';
import type { MasksAction, MasksSnapshot } from './masks';

const props = defineProps<{
  snapshot: MasksSnapshot;
  onAction: (action: MasksAction) => MasksSnapshot;
}>();

const state = shallowRef(props.snapshot);

function dispatch(action: MasksAction): void {
  state.value = props.onAction(action);
}

function selectGuest(index: number, event: Event): void {
  const select = event.target as HTMLSelectElement;
  dispatch({ type: 'select', index, guest: Number(select.value) });
}
</script>

<template>
  <div class="masks-puzzle">
    <p class="challenge-help">六位賓客排成一列，每人臉上都戴著不同的面具。依他們的證詞，替每一張面具填上正確的人。證詞全是真話。</p>
    <ol class="mask-clues">
      <li v-for="(clue, index) in state.clues" :key="index">{{ clue }}</li>
    </ol>
    <div class="mask-board">
      <label v-for="(name, index) in state.maskNames" :key="index" class="mask-row">
        <span class="mask-slot">{{ index + 1 }}</span>
        <span class="mask-name">{{ name }}</span>
        <select
          :data-mask="index"
          :aria-label="`從左數第${index + 1}張面具「${name}」是誰`"
          :value="state.picks[index]"
          @change="selectGuest(index, $event)"
        >
          <option value="-1">未選擇</option>
          <option v-for="guest in state.guestOrder" :key="guest" :value="guest">
            {{ state.guests[guest] }}
          </option>
        </select>
      </label>
    </div>
    <p class="challenge-feedback" role="status">{{ state.message }}</p>
    <button id="masks-confirm" class="primary-button" @click="dispatch({ type: 'confirm' })">
      向賓客們確認 ⟶
    </button>
    <button id="masks-reset" class="secondary-button" @click="dispatch({ type: 'reset' })">
      全部重選
    </button>
  </div>
</template>
