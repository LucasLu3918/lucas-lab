<script setup lang="ts">
import type { Gears13Snapshot } from './gears13';
import { gearHoles, gearToothPath } from './gears13';

defineProps<{ snapshot: Gears13Snapshot }>();
const emit = defineEmits<{ select: [index: number | null] }>();
</script>

<template>
  <div id="bf-tray" class="belfry-tray" role="group" aria-label="齒輪托盤">
    <button
      v-for="gear in snapshot.tray"
      :key="gear.index"
      class="belfry-gear-button"
      type="button"
      :disabled="gear.used"
      :aria-pressed="gear.selected"
      :aria-label="`${gear.teeth} 齒齒輪${gear.used ? '（已放置）' : ''}`"
      @click="emit('select', gear.selected ? null : gear.index)"
    >
      <svg :viewBox="`${-(gear.teeth / 2 + 2)} ${-(gear.teeth / 2 + 2)} ${gear.teeth + 4} ${gear.teeth + 4}`" aria-hidden="true">
        <g :class="['belfry-gear', `layer${snapshot.selectedLayer}`]">
          <path class="gear-body" :d="gearToothPath(gear.teeth)" />
          <circle class="gear-web" :r="Math.max(gear.teeth / 2 - 2.9, 1)" />
          <circle class="gear-rimline" :r="Math.max(gear.teeth / 2 - 2.9, 1)" />
          <circle
            v-for="(hole, index) in gearHoles(gear.teeth)"
            :key="`${gear.index}-hole-${index}`"
            class="gear-hole"
            :cx="hole.cx"
            :cy="hole.cy"
            :r="hole.r"
          />
          <circle class="gear-hub" :r="Math.min(2.1, gear.teeth / 6)" />
          <circle class="gear-axle" :r="Math.min(2.1, gear.teeth / 6) * 0.42" />
        </g>
        <circle class="gear-roundness" :r="gear.teeth / 2 - 0.9" />
      </svg>
      <b>{{ gear.teeth }} 齒</b>
    </button>
  </div>
</template>
