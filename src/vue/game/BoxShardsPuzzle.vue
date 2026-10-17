<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import type { BoxShardId, BoxShardsAction, BoxShardsSnapshot } from './box-shards';
import { parseBoxShardsSnapshot } from './box-shards';

const props = defineProps<{
  snapshot: BoxShardsSnapshot;
  onAction: (action: BoxShardsAction) => unknown;
}>();

const allSlots = [
  { id: 'shard-library', act: 1, title: '黑鐘書庫' },
  { id: 'shard-ballroom', act: 2, title: '血色舞會' },
  { id: 'shard-hunter', act: 3, title: '獵人的心臟' },
  { id: 'shard-mine', act: 4, title: '銀骨礦坑' },
  { id: 'shard-crypt', act: 5, title: '玻璃棺室' },
  { id: 'shard-queen', act: 6, title: '王后寢宮' },
  { id: 'shard-mirror', act: 7, title: '鏡中之國' },
] as const;
const numerals = ['零', '一', '二', '三', '四', '五', '六', '七'];
const state = shallowRef(props.snapshot);
const placedIds = computed(() => new Set(state.value.placed));
const trayShards = computed(() => state.value.shards.filter(shard => !placedIds.value.has(shard.id)));
const collectedIds = computed(() => new Set(state.value.shards.map(shard => shard.id)));

function dispatch(action: BoxShardsAction) {
  if (state.value.finished) return;
  const next = parseBoxShardsSnapshot(props.onAction(action));
  if (next) state.value = next;
}

function place(slotId: BoxShardId) {
  dispatch({ type: 'place-shard', slotId });
}

function slotLabel(slot: typeof allSlots[number]) {
  if (placedIds.value.has(slot.id)) return `第${numerals[slot.act]}幕的位置（已嵌入）`;
  if (collectedIds.value.has(slot.id)) return `第${numerals[slot.act]}幕的位置`;
  return `第${numerals[slot.act]}幕的位置（沒有收集到，來自${slot.title}）`;
}
</script>

<template>
  <div class="box-shards-island">
    <p v-if="state.shards.length < allSlots.length" class="box-line">
      妳收集了 <b>{{ state.shards.length }}</b> / {{ allSlots.length }} 片。沒收集到的位置會留空。
    </p>
    <div
      v-if="trayShards.length"
      class="box-row wrap"
      role="group"
      aria-label="碎片"
    >
      <button
        v-for="shard in trayShards"
        :key="shard.id"
        type="button"
        class="box-shard"
        :class="{ on: state.selected === shard.id }"
        :aria-pressed="state.selected === shard.id"
        :aria-label="`碎片：${shard.title}`"
        :disabled="state.finished"
        @click="dispatch({ type: 'select-shard', id: shard.id })"
      >
        <b aria-hidden="true">◆</b>{{ shard.title }}
      </button>
    </div>
    <div class="box-slots" role="group" aria-label="位置">
      <button
        v-for="slot in allSlots"
        :key="slot.id"
        type="button"
        class="box-slot"
        :class="{ on: placedIds.has(slot.id), gap: !collectedIds.has(slot.id) }"
        :aria-label="slotLabel(slot)"
        :disabled="state.finished || placedIds.has(slot.id)"
        @click="place(slot.id)"
      >
        <b v-if="placedIds.has(slot.id)" aria-hidden="true">◆</b>
        第{{ numerals[slot.act] }}幕
        <small v-if="!collectedIds.has(slot.id)">缺：{{ slot.title }}</small>
      </button>
    </div>
    <div v-if="state.shards.length === 0" class="box-row">
      <button
        type="button"
        class="primary-button"
        :disabled="state.finished"
        @click="dispatch({ type: 'skip-empty' })"
      >
        這一面先空著
      </button>
    </div>
  </div>
</template>
