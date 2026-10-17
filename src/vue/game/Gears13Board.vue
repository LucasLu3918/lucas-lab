<script setup lang="ts">
import { computed } from 'vue';
import type { Gears13Snapshot } from './gears13';
import { gearHoles, gearToothPath } from './gears13';

const props = defineProps<{ snapshot: Gears13Snapshot }>();
const emit = defineEmits<{ socket: [id: string] }>();
const gearsByLayer = computed(() => Array.from({ length: props.snapshot.layers }, (_, layer) =>
  props.snapshot.gears.filter(gear => gear.layer === layer)));
const crank = computed(() => ({
  x: Math.cos(props.snapshot.crankAngle) * 5,
  y: Math.sin(props.snapshot.crankAngle) * 5,
}));
const gearRotation = (phase: number, speed: number) =>
  ((phase + props.snapshot.turns * speed * Math.PI * 2) * 180 / Math.PI).toFixed(2);
</script>

<template>
  <div class="belfry-board">
    <svg id="bf-svg" class="belfry-svg" :viewBox="snapshot.viewBox" role="group" aria-label="齒輪盤">
      <g v-if="snapshot.ruler" aria-hidden="true">
        <g v-for="line in snapshot.rulerLines" :key="line.id">
          <line class="belfry-ruler" :x1="line.x1" :y1="line.y1" :x2="line.x2" :y2="line.y2" />
          <text class="belfry-dist" :x="line.labelX" :y="line.labelY">{{ line.distance }}</text>
        </g>
      </g>

      <circle
        v-for="socket in snapshot.sockets"
        :key="`well-${socket.id}`"
        :class="['belfry-socket', { out: socket.output }]"
        :r="socket.crank ? 2.6 : 3.4"
        :cx="socket.x"
        :cy="socket.y"
        aria-hidden="true"
      />

      <circle
        v-for="gear in snapshot.gears"
        :key="`shadow-${gear.id}`"
        class="gear-shadow"
        :cx="gear.x + 0.6"
        :cy="gear.y + 1"
        :r="gear.teeth / 2 + 0.3"
        aria-hidden="true"
      />

      <template v-for="layer in snapshot.layers" :key="`layer-${layer}`">
        <g
          v-for="gear in gearsByLayer[layer - 1]"
          :key="gear.id"
          :class="['belfry-gear', `layer${gear.layer}`, { bad: gear.bad }]"
          :transform="`translate(${gear.x} ${gear.y}) rotate(${gearRotation(gear.phase, gear.speed)})`"
          aria-hidden="true"
        >
          <path class="gear-body" :d="gearToothPath(gear.teeth)" />
          <circle class="gear-web" :r="Math.max(gear.teeth / 2 - 2.9, 1)" />
          <circle class="gear-rimline" :r="Math.max(gear.teeth / 2 - 2.9, 1)" />
          <circle
            v-for="(hole, index) in gearHoles(gear.teeth)"
            :key="`${gear.id}-hole-${index}`"
            class="gear-hole"
            :cx="hole.cx"
            :cy="hole.cy"
            :r="hole.r"
          />
          <circle class="gear-hub" :r="Math.min(2.1, gear.teeth / 6)" />
          <circle class="gear-axle" :r="Math.min(2.1, gear.teeth / 6) * 0.42" />
        </g>
      </template>

      <template v-for="socket in snapshot.sockets" :key="`target-${socket.id}`">
        <circle
          v-if="!socket.crank"
          class="belfry-hit"
          :cx="socket.x"
          :cy="socket.y"
          :r="snapshot.reach"
          :data-socket="socket.id"
          role="button"
          tabindex="0"
          :aria-label="socket.ariaLabel"
          @click="emit('socket', socket.id)"
          @keydown.enter.prevent="emit('socket', socket.id)"
          @keydown.space.prevent="emit('socket', socket.id)"
        />
        <g v-if="socket.output" aria-hidden="true">
          <circle class="belfry-out-ring" :cx="socket.x" :cy="socket.y" r="4" />
          <text class="belfry-label out" :x="socket.x" :y="socket.y + 7.4">輸出軸</text>
        </g>
        <text v-else-if="!socket.crank && socket.empty" class="belfry-label dim" :x="socket.x" :y="socket.y - 3.2" aria-hidden="true">軸座</text>
      </template>

      <g aria-hidden="true">
        <line class="belfry-crank" x1="0" y1="0" :x2="crank.x" :y2="crank.y" />
        <line class="belfry-crank-hi" x1="0" y1="0" :x2="crank.x" :y2="crank.y" />
        <circle class="belfry-knob" r="1.35" :cx="crank.x" :cy="crank.y" />
        <text class="belfry-label" x="0" y="-8.6">曲柄 12 齒</text>
        <circle
          class="belfry-out-mark"
          r=".9"
          :visibility="snapshot.outputMarker.visible ? 'visible' : 'hidden'"
          :cx="snapshot.outputMarker.x"
          :cy="snapshot.outputMarker.y"
        />
      </g>
    </svg>
  </div>
</template>
