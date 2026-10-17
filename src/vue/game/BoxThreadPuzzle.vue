<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import type { BoxThreadAction, BoxThreadPanelId, BoxThreadSnapshot } from './box-thread';
import { parseBoxThreadSnapshot } from './box-thread';

const props = defineProps<{
  snapshot: BoxThreadSnapshot;
  onAction: (action: BoxThreadAction) => unknown;
}>();

const panels: { id: BoxThreadPanelId; name: string; art: string }[] = [
  { id: 'D', name: '舞廳', art: 'ballroom' },
  { id: 'B', name: '陽台', art: 'balcony' },
  { id: 'C', name: '黑松林', art: 'black-pine-path' },
  { id: 'A', name: '鏡廊', art: 'mirror-hall' },
];
const state = shallowRef(props.snapshot);
const selected = computed(() => new Set(state.value.order));
const orderedPanels = computed(() => state.value.order.map(id => panels.find(panel => panel.id === id)!));

function dispatch(action: BoxThreadAction) {
  if (state.value.finished) return;
  const next = parseBoxThreadSnapshot(props.onAction(action));
  if (next) state.value = next;
}
</script>

<template>
  <div class="box-thread-island">
    <p class="box-line" aria-live="polite">
      紅線已穿過：
      <template v-if="orderedPanels.length">
        <span v-for="(panel, index) in orderedPanels" :key="panel.id">
          <span v-if="index" aria-hidden="true">→</span>
          <span class="box-chip">{{ panel.name }}</span>
        </span>
      </template>
      <span v-else class="box-dim">尚未穿過任何一格</span>
    </p>
    <div class="box-holes" role="group" aria-label="四面鏡孔">
      <button
        v-for="panel in panels"
        :key="panel.id"
        type="button"
        class="box-hole"
        :class="{ used: selected.has(panel.id) }"
        :aria-label="`${panel.name}${selected.has(panel.id) ? '（紅線已穿過）' : ''}`"
        :disabled="state.finished || selected.has(panel.id)"
        @click="dispatch({ type: 'choose-panel', panel: panel.id })"
      >
        <img :src="`assets/${panel.art}.webp`" alt="" width="1664" height="944" decoding="async" draggable="false">
        <span>{{ panel.name }}</span>
      </button>
    </div>
    <div v-if="state.order.length && !state.finished" class="box-row">
      <button type="button" class="text-button" @click="dispatch({ type: 'undo' })">收回紅線</button>
    </div>
  </div>
</template>
