<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import type { GalleryAlignAction, GalleryAlignPanel, GalleryAlignSnapshot, GalleryPanelId } from './gallery-align';

const props = defineProps<{
  snapshot: GalleryAlignSnapshot;
  onAction: (action: GalleryAlignAction) => GalleryAlignSnapshot | null;
}>();

const BOARD_WIDTH = 744;
const BOARD_HEIGHT = 548;
const PANEL_WIDTH = 352;
const PANEL_HEIGHT = 200;
const BORDER = 6;
const TRAY_SCALE = 0.55;
const state = shallowRef(props.snapshot);
const board = shallowRef<HTMLElement | null>(null);
const stage = shallowRef<HTMLElement | null>(null);
const from = shallowRef('B.moon');
const to = shallowRef('A.moonL');
type Drag = { panel: GalleryPanelId; pointerId: number; startX: number; startY: number; offsetX: number; offsetY: number; moved: boolean };
const drag = shallowRef<Drag | null>(null);
const panelById = computed(() => new Map(state.value.panels.map(panel => [panel.id, panel])));
const anchorOptions = computed(() => state.value.panels.flatMap(panel => panel.anchors.map(anchor => ({
  value: `${panel.id}.${anchor.id}`,
  label: `${panel.name}：${anchor.label}`,
}))));

watch(() => props.snapshot, next => { state.value = next; });

function dispatch(action: GalleryAlignAction): void {
  const next = props.onAction(action);
  if (next) state.value = next;
}

function boardPoint(event: PointerEvent): [number, number] {
  const rect = board.value?.getBoundingClientRect();
  if (!rect || state.value.scale <= 0) return [0, 0];
  return [(event.clientX - rect.left) / state.value.scale, (event.clientY - rect.top) / state.value.scale];
}

function beginDrag(event: PointerEvent, panel: GalleryAlignPanel): void {
  if (event.button !== 0 || state.value.finished || panel.zoomed) return;
  const target = event.currentTarget;
  if (target instanceof HTMLElement) target.setPointerCapture(event.pointerId);
  const [x, y] = boardPoint(event);
  drag.value = {
    panel: panel.id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    offsetX: (x - panel.left) / (panel.tray ? TRAY_SCALE : 1),
    offsetY: (y - panel.top) / (panel.tray ? TRAY_SCALE : 1),
    moved: false,
  };
}

function moveDrag(event: PointerEvent): void {
  const active = drag.value;
  if (!active || active.pointerId !== event.pointerId || state.value.zoomPanel === active.panel) return;
  if (!active.moved && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) < 6) return;
  const [x, y] = boardPoint(event);
  if (!active.moved && panelById.value.get(active.panel)?.tray) {
    active.moved = true;
    active.offsetX = PANEL_WIDTH / 2;
    active.offsetY = PANEL_HEIGHT / 2;
    dispatch({ type: 'begin-drag', panel: active.panel, x: x - active.offsetX, y: y - active.offsetY });
  } else {
    active.moved = true;
    dispatch({ type: 'move-panel', panel: active.panel, x: x - active.offsetX, y: y - active.offsetY });
  }
}

function endDrag(event: PointerEvent): void {
  const active = drag.value;
  if (!active || active.pointerId !== event.pointerId) return;
  drag.value = null;
  if (active.moved) dispatch({ type: 'drop-panel', panel: active.panel });
  else dispatch({ type: 'toggle-zoom', panel: active.panel });
}

function cancelDrag(event: PointerEvent): void {
  if (drag.value?.pointerId === event.pointerId) endDrag(event);
}

function keyPanel(event: KeyboardEvent, panel: GalleryAlignPanel): void {
  if (state.value.finished) return;
  if (event.key === 'f' || event.key === 'F') {
    event.preventDefault();
    dispatch({ type: 'flip', panel: panel.id });
    return;
  }
  if (event.key === 'Enter' || event.key === '+' || event.key === '-') {
    event.preventDefault();
    dispatch({ type: 'toggle-zoom', panel: panel.id });
    return;
  }
  const step = event.shiftKey ? 3 : 10;
  const delta: Record<string, [number, number]> = {
    ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
  };
  const move = delta[event.key];
  if (move && !panel.zoomed) {
    event.preventDefault();
    dispatch({ type: 'keyboard-move', panel: panel.id, dx: move[0], dy: move[1] });
  }
}

function panelMask(panel: GalleryAlignPanel): Record<string, string> | undefined {
  if (!panel.maskAnchor) return undefined;
  const { x, y } = panel.maskAnchor;
  const mask = `radial-gradient(circle at ${x}px ${y}px,#000 0,#000 34px,transparent 76px)`;
  return { maskImage: mask, WebkitMaskImage: mask };
}

function place(): void {
  dispatch({ type: 'place', from: from.value, to: to.value });
}

let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  if (typeof ResizeObserver !== 'function' || !stage.value) return;
  resizeObserver = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width ?? stage.value?.clientWidth ?? BOARD_WIDTH;
    if (Math.abs(Math.min(1, width / BOARD_WIDTH) - state.value.scale) > 0.001) {
      dispatch({ type: 'resize', width });
    }
  });
  resizeObserver.observe(stage.value);
});
onBeforeUnmount(() => resizeObserver?.disconnect());
</script>

<template>
  <div class="gallery-align-puzzle">
    <p class="gal-caption" aria-live="polite">{{ state.caption }}</p>
    <div ref="stage" id="gal-stage" class="gal-stage" :style="{ height: `${Math.round(BOARD_HEIGHT * state.scale)}px` }">
      <div ref="board" id="gal-board" class="gal-board" :style="{ transform: `scale(${state.scale})` }">
        <svg id="gal-guide" class="gal-guide" :viewBox="`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`" aria-hidden="true">
          <template v-for="thread in state.threads" :key="`thread-${thread.kind}`">
            <line
              :x1="thread.x1" :y1="thread.y1" :x2="thread.x2" :y2="thread.y2"
              stroke="#c8172f" stroke-width="3" stroke-linecap="round"
              :stroke-dasharray="thread.kind === 0 ? undefined : '9 5'"
            />
            <circle v-if="thread.kind === 0" :cx="thread.x1" :cy="thread.y1" r="5" fill="#c8172f" stroke="#fff" />
            <template v-else>
              <rect :x="thread.x1 - 5" :y="thread.y1 - 5" width="10" height="10" fill="#c8172f" stroke="#fff" />
              <rect :x="thread.x2 - 5" :y="thread.y2 - 5" width="10" height="10" fill="#c8172f" stroke="#fff" />
            </template>
            <circle v-if="thread.kind === 0" :cx="thread.x2" :cy="thread.y2" r="5" fill="#c8172f" stroke="#fff" />
          </template>
          <line
            v-if="state.live" :x1="state.live.x1" :y1="state.live.y1" :x2="state.live.x2" :y2="state.live.y2"
            stroke="#fff" :stroke-width="state.live.ok ? 3 : 1.5" :stroke-dasharray="state.live.ok ? undefined : '5 4'"
          />
        </svg>

        <div
          v-for="panel in state.panels"
          :key="panel.id"
          class="gal-panel"
          :class="{ drag: panel.dragging }"
          :style="{
            left: `${panel.left}px`, top: `${panel.top}px`, width: `${panel.width}px`, height: `${panel.height}px`,
            borderWidth: `${panel.borderWidth}px`, zIndex: panel.zIndex,
            transform: panel.tray ? `scale(${TRAY_SCALE})` : 'none', ...panelMask(panel),
          }"
          :aria-label="panel.ariaLabel"
          :aria-disabled="state.finished"
          :tabindex="state.finished ? -1 : 0"
          role="button"
          :data-gal-panel="panel.id"
          @pointerdown="beginDrag($event, panel)"
          @pointermove.prevent="moveDrag"
          @pointerup="endDrag"
          @pointercancel="cancelDrag"
          @keydown="keyPanel($event, panel)"
        >
          <div class="gal-layer" :style="{ width: `${panel.layerWidth}px`, height: `${panel.layerHeight}px` }">
            <img
              :src="`/games/blood-mirror/play/assets/${panel.art}.webp`"
              alt="" width="1664" height="944" decoding="async" draggable="false"
              :style="{ transform: panel.flipped ? 'scaleX(-1)' : 'none' }"
            >
            <template v-for="anchor in panel.anchors" :key="anchor.id">
              <span
                class="gal-ring" :class="{ on: anchor.linked }"
                :style="{
                  left: `${anchor.left}px`, top: `${anchor.top}px`, width: `${anchor.diameter}px`, height: `${anchor.diameter}px`,
                  display: state.markers ? 'block' : 'none',
                }"
              />
              <span
                v-if="anchor.notchSide && anchor.notchLeft !== null && anchor.notchTop !== null && anchor.notchWidth !== null && anchor.notchHeight !== null"
                class="gal-notch" :data-side="anchor.notchSide"
                :style="{
                  left: `${anchor.notchLeft}px`, top: `${anchor.notchTop}px`,
                  width: `${anchor.notchWidth}px`, height: `${anchor.notchHeight}px`,
                }"
              />
            </template>
          </div>
          <span class="gal-tag">{{ panel.name }}{{ panel.flipped ? '（翻面）' : '' }}{{ panel.zoomed ? '（放大）' : '' }}</span>
        </div>
      </div>
    </div>

    <div class="gal-tools" role="group" aria-label="放大與翻面">
      <span class="gal-tools-row"><b>放大</b>
        <button v-for="panel in state.panels" :key="`zoom-${panel.id}`" class="secondary-button" type="button"
          :aria-pressed="panel.zoomed" :aria-label="`放大${panel.name}`" @click="dispatch({ type: 'toggle-zoom', panel: panel.id })">{{ panel.name }}</button>
      </span>
      <span class="gal-tools-row"><b>翻面</b>
        <button v-for="panel in state.panels" :key="`flip-${panel.id}`" class="secondary-button" type="button"
          :aria-pressed="panel.flipped" :aria-label="`翻面${panel.name}`" @click="dispatch({ type: 'flip', panel: panel.id })">{{ panel.name }}</button>
      </span>
      <span class="gal-tools-row">
        <button class="secondary-button" type="button" :aria-pressed="state.markers" @click="dispatch({ type: 'toggle-markers' })">物件標記</button>
        <button class="secondary-button" type="button" @click="dispatch({ type: 'home' })">畫格歸位</button>
      </span>
    </div>

    <details class="gal-place">
      <summary>不用拖曳：用清單放置</summary>
      <div class="gal-place-body">
        <label>拿起<select v-model="from"><option v-for="option in anchorOptions" :key="`from-${option.value}`" :value="option.value">{{ option.label }}</option></select></label>
        <label>放到<select v-model="to"><option v-for="option in anchorOptions" :key="`to-${option.value}`" :value="option.value">{{ option.label }}</option></select></label>
        <button class="secondary-button" type="button" @click="place">放置</button>
      </div>
    </details>
    <p id="gal-feedback" class="challenge-feedback" role="status" aria-live="polite">{{ state.feedback }}</p>
    <p id="bf-status" class="belfry-status" role="status" :data-tone="state.tone">{{ state.status }}</p>
  </div>
</template>
