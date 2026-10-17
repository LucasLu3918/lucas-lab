<script setup lang="ts">
import { shallowRef, watch } from 'vue';
import Gears13Board from './Gears13Board.vue';
import Gears13Controls from './Gears13Controls.vue';
import Gears13Tray from './Gears13Tray.vue';
import type { Gears13Action, Gears13Snapshot } from './gears13';

const props = defineProps<{
  snapshot: Gears13Snapshot;
  onAction: (action: Gears13Action) => Gears13Snapshot | null;
}>();
const current = shallowRef(props.snapshot);
watch(() => props.snapshot, value => { current.value = value; });

function act(action: Gears13Action) {
  const next = props.onAction(action);
  if (next) current.value = next;
}
</script>

<template>
  <section class="gears13-puzzle">
    <p id="bf-goal" class="challenge-help" v-html="current.goalHtml"></p>
    <ol id="bf-rules" class="belfry-rules">
      <li v-for="rule in current.rules" :key="rule">{{ rule }}</li>
    </ol>
    <Gears13Board :snapshot="current" @socket="id => act({ type: 'socket', id })" />
    <Gears13Controls
      :snapshot="current"
      @layer="layer => act({ type: 'select-layer', layer })"
      @ruler="act({ type: 'toggle-ruler' })"
      @reset="act({ type: 'reset' })"
      @run="act({ type: 'run' })"
    />
    <Gears13Tray :snapshot="current" @select="index => act({ type: 'select-gear', index })" />
  </section>
</template>
