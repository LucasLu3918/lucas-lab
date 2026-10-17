<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import type { PrismBallroomAction, PrismBallroomSegment, PrismBallroomSnapshot } from './prism-ballroom';

const props = defineProps<{
  snapshot: PrismBallroomSnapshot;
  onAction: (action: PrismBallroomAction) => PrismBallroomSnapshot | null;
}>();

const BOARD_WIDTH = 9;
const BOARD_HEIGHT = 7;
const CELL = 10;
const puzzleAsset = (name: string) => `/games/blood-mirror/play/assets/puzzles/${name}`;
const snapshot = shallowRef(props.snapshot);
watch(() => props.snapshot, next => { snapshot.value = next; });
const cells = Array.from({ length: BOARD_WIDTH * BOARD_HEIGHT }, (_, index) => ({
  x: index % BOARD_WIDTH,
  y: Math.floor(index / BOARD_WIDTH),
}));
const segments = computed(() => snapshot.value.beamSegments.map((segment: PrismBallroomSegment, index) => ({
  key: index,
  color: colorOf(segment.mask),
  points: segment.points.map(point => `${px(point.x)},${px(point.y)}`).join(' '),
})));
const spriteIndex: Record<string, number> = { maskLit: 0, maskDark: 1, blade: 2, base: 3, dancer: 4, filter: 6, emitter: 7 };

function px(value: number): number {
  return (value + 0.5) * CELL;
}

function colorOf(mask: number): string {
  return `rgb(${mask & 1 ? 255 : 55},${mask & 2 ? 255 : 55},${mask & 4 ? 255 : 55})`;
}

function spriteViewBox(name: string): string {
  const index = spriteIndex[name];
  return `${(index % 4) * 256} ${Math.floor(index / 4) * 256} 256 256`;
}

function targetColor(mask: number): string {
  if (mask === 1) return '#ff5c67';
  if (mask === 4) return '#8295ff';
  return '#ffd45e';
}

function targetName(mask: number): string {
  return mask === 1 ? '紅光' : mask === 4 ? '藍光' : '黃光';
}

function flip(index: number) {
  if (snapshot.value.solved) return;
  const next = props.onAction({ type: 'flip', index });
  if (next) snapshot.value = next;
}

function moveDancer(index: number) {
  if (snapshot.value.solved) return;
  const next = props.onAction({ type: 'move-dancer', index });
  if (next) snapshot.value = next;
}

function handleBoardClick(event: MouseEvent): void {
  if (snapshot.value.solved) return;
  const svg = event.currentTarget as SVGSVGElement;
  const mirror = Array.from(svg.querySelectorAll<SVGGElement>('[data-mirror]')).find(element => {
    const bounds = element.getBoundingClientRect();
    return event.clientX >= bounds.left && event.clientX <= bounds.right
      && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
  });
  const index = Number(mirror?.dataset.mirror);
  if (mirror && Number.isInteger(index)) flip(index);
}

function mirrorLabel(index: number, orientation: '/' | '\\', x: number, y: number): string {
  return `鏡子 ${index + 1}，第 ${x + 1} 欄第 ${y + 1} 列，目前 ${orientation}，按 Enter 或空白鍵轉向`;
}

function dancerLabel(index: number, position: number): string {
  return `舞者 ${index + 1}，目前在${position === 0 ? '原位' : '移動位置'}，按 Enter 或空白鍵移動`;
}
</script>

<template>
  <div class="belfry-board prism-board">
    <svg
      id="bf-svg"
      class="belfry-svg prism-svg"
      viewBox="-4 -14 98 91"
      role="group"
      aria-label="稜鏡舞廳光路盤，九欄七列"
      @click="handleBoardClick"
    >
      <defs>
        <linearGradient id="prism-ballroom-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#fbe7a1" />
          <stop offset=".45" stop-color="#c79a3a" />
          <stop offset="1" stop-color="#6e4b17" />
        </linearGradient>
        <radialGradient id="prism-ballroom-pool" cx=".5" cy=".2" r=".85">
          <stop offset="0" stop-color="#ffe2a8" stop-opacity=".14" />
          <stop offset=".6" stop-color="#ffe2a8" stop-opacity=".02" />
          <stop offset="1" stop-color="#000" stop-opacity=".5" />
        </radialGradient>
      </defs>

      <g class="prism-art" pointer-events="none">
        <rect x="-1.8" y="-1.8" width="93.6" height="73.6" rx="1.4" fill="#0c0712" stroke="url(#prism-ballroom-brass)" stroke-width=".8" />
        <image :href="puzzleAsset('prism-floor.webp')" x="-1" y="-1" width="92" height="72" preserveAspectRatio="xMidYMid slice" />
        <rect x="-1" y="-1" width="92" height="72" fill="#0a0610" fill-opacity=".2" />
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
        <rect x="0" y="0" width="90" height="70" fill="url(#prism-ballroom-pool)" />
        <rect x="-.8" y="-.8" width="91.6" height="71.6" fill="none" stroke="#c79a3a" stroke-opacity=".55" stroke-width=".25" />

        <g v-for="(emitter, index) in snapshot.emitters" :key="`emitter-${index}`" :data-emitter="index">
          <svg :x="px(emitter.x) - 5.3" y="-11.8" width="10.6" height="10.6" :viewBox="spriteViewBox('emitter')" overflow="hidden">
            <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
          </svg>
          <circle :cx="px(emitter.x)" cy="-1.4" r="2.1" fill="#120a1a" stroke="#e0b84f" stroke-width=".3" />
          <text :x="px(emitter.x)" y="-10.8" font-size="2.3" text-anchor="middle" :fill="colorOf(emitter.color)">{{ emitter.color === 7 ? '白' : emitter.color === 2 ? '綠' : '藍' }}</text>
        </g>

        <g data-filter="0" :aria-label="`紅色濾鏡，第 ${snapshot.filter.x + 1} 欄第 ${snapshot.filter.y + 1} 列`">
          <svg :x="px(snapshot.filter.x) - 4.5" :y="px(snapshot.filter.y) - 4.5" width="9" height="9" :viewBox="spriteViewBox('filter')" overflow="hidden">
            <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
          </svg>
          <path :d="`M${px(snapshot.filter.x)} ${px(snapshot.filter.y) - 2.4}L${px(snapshot.filter.x) + 2.4} ${px(snapshot.filter.y)}L${px(snapshot.filter.x)} ${px(snapshot.filter.y) + 2.4}L${px(snapshot.filter.x) - 2.4} ${px(snapshot.filter.y)}Z`" fill="#ff5c67" stroke="#fff1d0" stroke-width=".35" />
        </g>

        <g data-crystal="0" :aria-label="`合光水晶，收到 ${snapshot.crystal.received} 色，發出 ${snapshot.crystal.emitted} 色`">
          <path :d="`M${px(snapshot.crystal.x) - 3.6} ${px(snapshot.crystal.y) - 2.8}L${px(snapshot.crystal.x) + 1.4} ${px(snapshot.crystal.y) - 2.8}L${px(snapshot.crystal.x) + 3.6} ${px(snapshot.crystal.y)}L${px(snapshot.crystal.x) + 1.4} ${px(snapshot.crystal.y) + 2.8}L${px(snapshot.crystal.x) - 3.6} ${px(snapshot.crystal.y) + 2.8}L${px(snapshot.crystal.x) - 5.8} ${px(snapshot.crystal.y)}Z`" fill="#25152d" stroke="#f1d7a0" stroke-width=".55" />
          <path :d="`M${px(snapshot.crystal.x) + 1.8} ${px(snapshot.crystal.y) - 1.4}L${px(snapshot.crystal.x) + 4.2} ${px(snapshot.crystal.y)}L${px(snapshot.crystal.x) + 1.8} ${px(snapshot.crystal.y) + 1.4}Z`" :fill="colorOf(snapshot.crystal.emitted || snapshot.crystal.received || 7)" />
          <text :x="px(snapshot.crystal.x)" :y="px(snapshot.crystal.y) + 5.1" font-size="2" text-anchor="middle" fill="#f7e5bd">水晶</text>
        </g>

        <g class="prism-beams">
          <template v-for="segment in segments" :key="`beam-${segment.key}`">
            <polyline :points="segment.points" fill="none" :stroke="segment.color" stroke-width="6.5" stroke-opacity=".14" stroke-linejoin="round" />
            <polyline :points="segment.points" fill="none" :stroke="segment.color" stroke-width="3.4" stroke-opacity=".28" stroke-linejoin="round" />
            <polyline :points="segment.points" fill="none" :stroke="segment.color" stroke-width="1.3" stroke-linejoin="round" />
            <polyline :points="segment.points" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width=".4" stroke-linejoin="round" />
          </template>
        </g>

        <g v-for="target in snapshot.targets" :key="`target-${target.index}`" :data-mask="target.index" :aria-label="`面具 ${target.index + 1}，需要${targetName(target.need)}，目前收到 ${target.got}`">
          <ellipse :cx="px(target.x)" :cy="px(target.y)" rx="6" ry="5" :fill="targetColor(target.need)" :fill-opacity="target.got === target.need ? .45 : 0" />
          <svg :x="px(target.x) - 5.7" :y="px(target.y) - 5.9" width="11.4" height="11.4" :viewBox="spriteViewBox(target.got === target.need ? 'maskLit' : 'maskDark')" overflow="hidden">
            <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
          </svg>
          <text :x="px(target.x)" :y="px(target.y) + 6.1" font-size="2.1" text-anchor="middle" :fill="targetColor(target.need)">{{ targetName(target.need) }}</text>
          <text v-if="target.got & ~target.need" :x="px(target.x)" :y="px(target.y) - 5.3" font-size="2" text-anchor="middle" fill="#ff8a8a">顏色太多</text>
        </g>
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
        @click.stop="flip(mirror.index)"
        @keydown.enter.prevent="flip(mirror.index)"
        @keydown.space.prevent="flip(mirror.index)"
        pointer-events="all"
      >
        <ellipse cx=".5" cy="1" rx="4" ry="3.6" fill="#000" fill-opacity=".45" />
        <svg x="-4.1" y="-4.1" width="8.2" height="8.2" :viewBox="spriteViewBox('base')" overflow="hidden" pointer-events="none">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
        <g class="prism-blade" :transform="`rotate(${mirror.orientation === '/' ? -45 : 45})`">
          <svg x="-5.7" y="-8.5" width="11.4" height="17" :viewBox="spriteViewBox('blade')" preserveAspectRatio="none" overflow="hidden" pointer-events="none">
            <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
          </svg>
        </g>
        <circle r="5" fill="transparent" />
      </g>

      <g
        v-for="dancer in snapshot.dancers"
        :key="`ghost-${dancer.index}`"
        :data-ghost="dancer.index"
        :transform="`translate(${px(dancer.position === 0 ? dancer.b.x : dancer.a.x)} ${px(dancer.position === 0 ? dancer.b.y : dancer.a.y)})`"
        pointer-events="none"
        aria-hidden="true"
      >
        <circle r="4.3" fill="#efc983" fill-opacity=".18" stroke="#efc983" stroke-opacity=".34" stroke-dasharray="1 1" />
        <svg x="-4.2" y="-4.2" width="8.4" height="8.4" :viewBox="spriteViewBox('dancer')" overflow="hidden" opacity=".22">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
      </g>

      <g
        v-for="dancer in snapshot.dancers"
        :key="dancer.index"
        class="prism-dancer-control"
        :data-dancer="dancer.index"
        :tabindex="snapshot.solved ? -1 : 0"
        role="button"
        :aria-label="dancerLabel(dancer.index, dancer.position)"
        :aria-pressed="dancer.position === 1"
        :aria-disabled="snapshot.solved"
        :transform="`translate(${px(dancer.position === 0 ? dancer.a.x : dancer.b.x)} ${px(dancer.position === 0 ? dancer.a.y : dancer.b.y)})`"
        @click.stop="moveDancer(dancer.index)"
        @keydown.enter.prevent="moveDancer(dancer.index)"
        @keydown.space.prevent="moveDancer(dancer.index)"
        pointer-events="all"
      >
        <circle r="5" fill="#efc983" fill-opacity=".22" stroke="#efc983" stroke-opacity=".35" stroke-dasharray="1 1" />
        <svg x="-4.5" y="-4.5" width="9" height="9" :viewBox="spriteViewBox('dancer')" overflow="hidden" pointer-events="none">
          <image :href="puzzleAsset('prism-parts.webp')" width="1024" height="512" preserveAspectRatio="none" />
        </svg>
        <circle r="5" fill="transparent" />
      </g>
    </svg>
  </div>
  <p id="bf-status" class="belfry-status" role="status">{{ snapshot.status }}</p>
</template>
