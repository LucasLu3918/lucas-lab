<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import type { PrismRaysAction, PrismRaysSegment, PrismRaysSnapshot } from './prism-rays';

const props = defineProps<{
  snapshot: PrismRaysSnapshot;
  onAction: (action: PrismRaysAction) => PrismRaysSnapshot | null;
}>();

const BOARD_WIDTH = 7;
const BOARD_HEIGHT = 5;
const CELL = 10;
const puzzleAsset = (name: string) => `/games/blood-mirror/play/assets/puzzles/${name}`;
const snapshot = shallowRef(props.snapshot);
watch(() => props.snapshot, next => { snapshot.value = next; });
const cells = Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, (_, index) => ({
  x: index % BOARD_WIDTH,
  y: Math.floor(index / BOARD_WIDTH),
}));

const segments = computed(() => snapshot.value.beamSegments.map((segment: PrismRaysSegment) => ({
  mask: segment.mask,
  color: colorOf(segment.mask),
  points: segment.points.map(point => `${px(point.x)},${px(point.y)}`).join(' '),
  marks: segment.points.flatMap((point, index) => index > 0 && index < segment.points.length - 1 && index % 3 === 1
    ? symbolsFor(segment.mask, px(point.x), px(point.y), 1, '#fff') : []),
})));
const targetLit = computed(() => snapshot.value.target.got === snapshot.value.target.need);
const targetOverlit = computed(() => !!(snapshot.value.target.got & ~snapshot.value.target.need));

function px(value: number): number {
  return (value + 0.5) * CELL;
}

function colorOf(mask: number): string {
  return `rgb(${mask & 1 ? 255 : 55},${mask & 2 ? 255 : 55},${mask & 4 ? 255 : 55})`;
}

function symbolsFor(mask: number, x: number, y: number, radius: number, fill: string) {
  if (mask === 7) return [{ kind: 'diamond', x, y, radius, fill, key: `${x}-${y}-white` }];
  const colors = [1, 2, 4].filter(color => mask & color);
  return colors.map((color, index) => ({
    kind: color === 1 ? 'triangle' : color === 2 ? 'circle' : 'square',
    x: x + (index - (colors.length - 1) / 2) * radius * 2.3,
    y,
    radius,
    fill,
    key: `${x}-${y}-${color}`,
  }));
}

const targetSymbols = computed(() => symbolsFor(
  snapshot.value.target.need,
  px(snapshot.value.target.x),
  px(snapshot.value.target.y) + 5.45,
  1.15,
  '#fff',
));
const emitterSymbol = computed(() => symbolsFor(
  snapshot.value.emitter.color,
  px(snapshot.value.emitter.x),
  -6.2,
  1.1,
  '#fff',
));
const filterColor = computed(() => colorOf(snapshot.value.filter.color));

const spriteIndex: Record<string, number> = { maskLit: 0, maskDark: 1, blade: 2, base: 3, filter: 6, emitter: 7 };
function spriteViewBox(name: string): string {
  const index = spriteIndex[name];
  return `${(index % 4) * 256} ${Math.floor(index / 4) * 256} 256 256`;
}

function flip(index: number) {
  if (snapshot.value.solved) return;
  const next = props.onAction({ type: 'flip', index });
  if (next) snapshot.value = next;
}

function mirrorLabel(index: number, orientation: '/' | '\\', x: number, y: number): string {
  return `鏡子 ${index + 1}，在第 ${x + 1} 欄、第 ${y + 1} 列，目前 ${orientation}（點一下轉向）`;
}
</script>

<template>
  <div class="belfry-board prism-board">
    <svg
      id="bf-svg"
      class="belfry-svg prism-svg"
      viewBox="-3 -14.2 76 68.2"
      pointer-events="none"
      role="group"
      aria-label="濾鏡階段光路盤，七欄五列"
    >
      <defs>
        <linearGradient id="prism-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fbe7a1" />
          <stop offset=".45" stop-color="#c79a3a" />
          <stop offset="1" stop-color="#6e4b17" />
        </linearGradient>
        <radialGradient id="prism-pool" cx=".5" cy=".2" r=".85">
          <stop offset="0" stop-color="#ffe2a8" stop-opacity=".14" />
          <stop offset=".6" stop-color="#ffe2a8" stop-opacity=".02" />
          <stop offset="1" stop-color="#000" stop-opacity=".5" />
        </radialGradient>
        <radialGradient v-for="mask in 7" :id="`prism-halo-${mask}`" :key="mask">
          <stop offset="0" :stop-color="colorOf(mask)" stop-opacity=".75" />
          <stop offset="1" :stop-color="colorOf(mask)" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect x="-1.8" y="-1.8" width="73.6" height="53.6" rx="1.4" fill="#0c0712" stroke="url(#prism-brass)" stroke-width=".8" />
      <image :href="puzzleAsset('prism-floor.webp')" x="-1" y="-1" width="72" height="52" preserveAspectRatio="xMidYMid slice" />
      <rect x="-1" y="-1" width="72" height="52" fill="#0a0610" fill-opacity=".2" />
      <rect
        v-for="cell in cells"
        :key="`floor-${cell.x}-${cell.y}`"
        class="prism-cell"
        :x="cell.x * CELL"
        :y="cell.y * CELL"
        width="10"
        height="10"
        :fill="(cell.x + cell.y) % 2 ? '#000' : '#1a0f26'"
        :fill-opacity="(cell.x + cell.y) % 2 ? .24 : .12"
        stroke="#f3dca0"
        stroke-opacity=".09"
        stroke-width=".18"
      />
      <rect x="0" y="0" width="70" height="50" fill="url(#prism-pool)" />
      <rect x="-.8" y="-.8" width="71.6" height="51.6" fill="none" stroke="#c79a3a" stroke-opacity=".55" stroke-width=".25" />

      <g>
        <svg :x="px(snapshot.emitter.x) - 5.3" y="-11.8" width="10.6" height="10.6" :viewBox="spriteViewBox('emitter')" overflow="hidden" pointer-events="none">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
        <ellipse :cx="px(snapshot.emitter.x)" cy="-1.6" rx="3.6" ry="1.5" :fill="colorOf(snapshot.emitter.color)" fill-opacity=".55" />
        <circle :cx="px(snapshot.emitter.x)" cy="-6.3" r="2" fill="#120a1a" fill-opacity=".85" stroke="#e0b84f" stroke-width=".3" />
        <template v-for="symbol in emitterSymbol" :key="symbol.key">
          <path v-if="symbol.kind === 'diamond'" :d="`M${symbol.x} ${symbol.y - symbol.radius}L${symbol.x + symbol.radius} ${symbol.y}L${symbol.x} ${symbol.y + symbol.radius}L${symbol.x - symbol.radius} ${symbol.y}Z`" :fill="symbol.fill" />
          <path v-else-if="symbol.kind === 'triangle'" :d="`M${symbol.x} ${symbol.y - symbol.radius}L${symbol.x + symbol.radius * .95} ${symbol.y + symbol.radius * .7}L${symbol.x - symbol.radius * .95} ${symbol.y + symbol.radius * .7}Z`" :fill="symbol.fill" />
          <circle v-else-if="symbol.kind === 'circle'" :cx="symbol.x" :cy="symbol.y" :r="symbol.radius * .85" :fill="symbol.fill" />
          <rect v-else :x="symbol.x - symbol.radius * .8" :y="symbol.y - symbol.radius * .8" :width="symbol.radius * 1.6" :height="symbol.radius * 1.6" :fill="symbol.fill" />
        </template>
        <text :x="px(snapshot.emitter.x)" y="-11.3" font-size="2.6" text-anchor="middle" :fill="colorOf(snapshot.emitter.color)">白</text>
      </g>

      <g data-mask="0">
        <ellipse class="prism-halo" :cx="px(snapshot.target.x)" :cy="px(snapshot.target.y)" rx="7" ry="5.4" fill="url(#prism-halo-7)" :opacity="targetLit ? .9 : 0" />
        <svg class="prism-mask-dark" :x="px(snapshot.target.x) - 5.7" :y="px(snapshot.target.y) - 5.9" width="11.4" height="11.4" :viewBox="spriteViewBox('maskDark')" overflow="hidden" pointer-events="none">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
        <svg class="prism-mask-lit" :x="px(snapshot.target.x) - 5.7" :y="px(snapshot.target.y) - 5.9" width="11.4" height="11.4" :viewBox="spriteViewBox('maskLit')" overflow="hidden" pointer-events="none" :opacity="targetLit ? 1 : 0">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
        <rect class="prism-plaque" :x="px(snapshot.target.x) - 2.85" :y="px(snapshot.target.y) + 3.9" width="5.7" height="3.1" rx="1.5" fill="#0b0710" fill-opacity=".78" :stroke="targetLit ? '#e0b84f' : targetOverlit ? '#ff6b6b' : '#8a6c3a'" stroke-width=".25" />
        <template v-for="symbol in targetSymbols" :key="symbol.key">
          <path v-if="symbol.kind === 'diamond'" :d="`M${symbol.x} ${symbol.y - symbol.radius}L${symbol.x + symbol.radius} ${symbol.y}L${symbol.x} ${symbol.y + symbol.radius}L${symbol.x - symbol.radius} ${symbol.y}Z`" :fill="symbol.fill" />
          <path v-else-if="symbol.kind === 'triangle'" :d="`M${symbol.x} ${symbol.y - symbol.radius}L${symbol.x + symbol.radius * .95} ${symbol.y + symbol.radius * .7}L${symbol.x - symbol.radius * .95} ${symbol.y + symbol.radius * .7}Z`" :fill="symbol.fill" />
          <circle v-else-if="symbol.kind === 'circle'" :cx="symbol.x" :cy="symbol.y" :r="symbol.radius * .85" :fill="symbol.fill" />
          <rect v-else :x="symbol.x - symbol.radius * .8" :y="symbol.y - symbol.radius * .8" :width="symbol.radius * 1.6" :height="symbol.radius * 1.6" :fill="symbol.fill" />
        </template>
        <text v-if="targetOverlit" class="prism-over" :x="px(snapshot.target.x)" :y="px(snapshot.target.y) - 5.4" font-size="2.4" text-anchor="middle" fill="#ff8a8a">顏色太多</text>
      </g>

      <g>
        <svg :x="px(snapshot.filter.x) - 5.4" :y="px(snapshot.filter.y) - 5.4" width="10.8" height="10.8" :viewBox="spriteViewBox('filter')" overflow="hidden" pointer-events="none">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
        <path class="prism-tint" :d="`M${px(snapshot.filter.x)} ${px(snapshot.filter.y) - 3.1}L${px(snapshot.filter.x) + 2.5} ${px(snapshot.filter.y)}L${px(snapshot.filter.x)} ${px(snapshot.filter.y) + 3.1}L${px(snapshot.filter.x) - 2.5} ${px(snapshot.filter.y)}Z`" :fill="filterColor" fill-opacity=".92" />
        <path :d="`M${px(snapshot.filter.x)} ${px(snapshot.filter.y) - 1.3}L${px(snapshot.filter.x) + 1.2} ${px(snapshot.filter.y)}L${px(snapshot.filter.x)} ${px(snapshot.filter.y) + 1.3}L${px(snapshot.filter.x) - 1.2} ${px(snapshot.filter.y)}Z`" fill="#fff" />
      </g>

      <g class="prism-beams">
        <template v-for="(segment, index) in segments" :key="`beam-${index}`">
          <polyline :points="segment.points" fill="none" :stroke="segment.color" stroke-width="6.5" stroke-opacity=".14" stroke-linejoin="round" />
          <polyline :points="segment.points" fill="none" :stroke="segment.color" stroke-width="3.4" stroke-opacity=".26" stroke-linejoin="round" />
          <polyline :points="segment.points" fill="none" :stroke="segment.color" stroke-width="1.3" stroke-linejoin="round" />
          <polyline :points="segment.points" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".4" stroke-linejoin="round" />
          <template v-for="symbol in segment.marks" :key="symbol.key">
            <path v-if="symbol.kind === 'diamond'" :d="`M${symbol.x} ${symbol.y - symbol.radius}L${symbol.x + symbol.radius} ${symbol.y}L${symbol.x} ${symbol.y + symbol.radius}L${symbol.x - symbol.radius} ${symbol.y}Z`" :fill="symbol.fill" />
            <path v-else-if="symbol.kind === 'triangle'" :d="`M${symbol.x} ${symbol.y - symbol.radius}L${symbol.x + symbol.radius * .95} ${symbol.y + symbol.radius * .7}L${symbol.x - symbol.radius * .95} ${symbol.y + symbol.radius * .7}Z`" :fill="symbol.fill" />
            <circle v-else-if="symbol.kind === 'circle'" :cx="symbol.x" :cy="symbol.y" :r="symbol.radius * .85" :fill="symbol.fill" />
            <rect v-else :x="symbol.x - symbol.radius * .8" :y="symbol.y - symbol.radius * .8" :width="symbol.radius * 1.6" :height="symbol.radius * 1.6" :fill="symbol.fill" />
          </template>
        </template>
      </g>

      <g
        v-for="mirror in snapshot.mirrors"
        :key="mirror.index"
        class="prism-hit"
        :data-mirror="mirror.index"
        :tabindex="snapshot.solved ? -1 : 0"
        role="button"
        :aria-label="mirrorLabel(mirror.index, mirror.orientation, mirror.x, mirror.y)"
        :aria-pressed="mirror.orientation === '\\'"
        :aria-disabled="snapshot.solved"
        :transform="`translate(${px(mirror.x)} ${px(mirror.y)})`"
        @click="flip(mirror.index)"
        @keydown.enter.prevent="flip(mirror.index)"
        @keydown.space.prevent="flip(mirror.index)"
        pointer-events="all"
      >
        <circle r="5" fill="none" stroke="transparent" stroke-width=".6" />
        <ellipse cx=".5" cy="1" rx="4" ry="3.6" fill="#000" fill-opacity=".4" />
        <svg x="-4.1" y="-4.1" width="8.2" height="8.2" :viewBox="spriteViewBox('base')" overflow="hidden" pointer-events="none">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
        <g class="prism-blade" :transform="`rotate(${mirror.orientation === '/' ? -45 : 45})`">
          <svg x="-5.7" y="-8.5" width="11.4" height="17" :viewBox="spriteViewBox('blade')" preserveAspectRatio="none" overflow="hidden" pointer-events="none">
            <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
          </svg>
        </g>
        <rect x="-5" y="-5" width="10" height="10" fill="transparent" pointer-events="all" />
      </g>
    </svg>
  </div>
  <p id="bf-status" class="belfry-status" role="status">{{ snapshot.status }}</p>
</template>
