<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import type { GalleryMergeAction, GalleryMergePanel, GalleryMergePanelId, GalleryMergeSnapshot } from './gallery-merge';

const props = defineProps<{
  snapshot: GalleryMergeSnapshot;
  onAction: (action: GalleryMergeAction) => GalleryMergeSnapshot | null;
}>();

const state = shallowRef(props.snapshot);
const slots = [0, 1, 2, 3];
const threadNames = ['月亮', '提燈與吊燈', '門'];
const panelNames = computed(() => new Map(state.value.panels.map(panel => [panel.id, panel.name])));
const usedPanels = computed(() => new Set(state.value.order));
const threadSummary = computed(() => state.value.threads
  .map(thread => `${thread.ends[0]} 與 ${thread.ends[1]}（${threadNames[thread.kind]}）`)
  .join('；'));

watch(() => props.snapshot, next => { state.value = next; });

function dispatch(action: GalleryMergeAction): void {
  const next = props.onAction(action);
  if (next) state.value = next;
}

function notchStyle(panel: GalleryMergePanel): Record<string, string> | undefined {
  if (!panel.door) return undefined;
  return {
    left: `calc(${panel.door.x}% - 15px)`,
    top: `calc(${panel.door.y}% - 10px)`,
  };
}

function flip(panel: GalleryMergePanelId): void {
  dispatch({ type: 'flip', panel });
}
</script>

<template>
  <div class="gal-merge-puzzle">
    <template v-if="state.mode === 'play'">
      <p class="gal-caption">{{ '鏡廊的門和舞廳的大門要朝同一邊；翻面後試著接上兩扇門。' }}</p>
      <div class="gal-merge-panels" role="group" aria-label="四幅畫與門把方向">
        <figure v-for="panel in state.panels" :key="panel.id" class="gal-merge-panel" :data-gal-merge-panel="panel.id">
          <div class="gal-merge-art">
            <img :src="`assets/${panel.art}.webp`" alt="" width="1664" height="944" draggable="false" :class="{ flipped: panel.flipped }">
            <span
              v-if="panel.door"
              class="gal-notch gal-merge-notch"
              :data-side="panel.door.side"
              :style="notchStyle(panel)"
              aria-hidden="true"
            />
          </div>
          <figcaption>{{ panel.name }}<span v-if="panel.flipped">（翻面）</span></figcaption>
          <button
            v-if="panel.door"
            type="button"
            class="secondary-button gal-merge-flip"
            :aria-label="`翻面${panel.name}`"
            :aria-pressed="panel.flipped"
            @click="flip(panel.id)"
          >
            翻面{{ panel.name }}
          </button>
        </figure>
      </div>
      <p class="gal-threads">已接上的紅線：{{ threadSummary }}</p>
      <p id="bf-status" class="belfry-status" role="status" :data-tone="state.tone">{{ state.status }}</p>
      <button type="button" class="primary-button gal-merge-place" @click="dispatch({ type: 'place-doors' })">
        嘗試接上鏡廊與舞廳的門
      </button>
      <p id="gal-feedback" class="challenge-feedback" role="status" aria-live="polite">{{ state.feedback }}</p>
    </template>

    <template v-else-if="state.mode === 'order'">
      <p class="gal-threads">紅線：{{ threadSummary }}</p>
      <p id="bf-status" class="belfry-status" role="status" :data-tone="state.tone">{{ state.status }}</p>
      <div class="gal-slots" role="group" aria-label="紅線排序位置">
        <template v-for="index in slots" :key="index">
          <button
            v-if="state.order[index]"
            type="button"
            class="gal-slot"
            :data-order-slot="index"
            :aria-label="`第 ${index + 1} 格：${panelNames.get(state.order[index]!) || ''}（點選取消）`"
            @click="dispatch({ type: 'remove-from', index })"
          >
            <img :src="`assets/${state.panels.find(panel => panel.id === state.order[index])?.art}.webp`" alt="" width="1664" height="944">
            <span>{{ index + 1 }}｜{{ panelNames.get(state.order[index]!) }}</span>
          </button>
          <div v-else class="gal-slot empty" :data-order-slot="index"><span>第 {{ index + 1 }} 格</span></div>
        </template>
      </div>
      <div class="gal-cards" role="group" aria-label="選擇下一幅畫">
        <button
          v-for="panel in state.panels"
          :key="panel.id"
          type="button"
          class="gal-card"
          :class="{ used: usedPanels.has(panel.id) }"
          :aria-label="`${panel.name}${usedPanels.has(panel.id) ? '（已放入）' : ''}`"
          :aria-pressed="usedPanels.has(panel.id)"
          :disabled="usedPanels.has(panel.id)"
          @click="dispatch({ type: 'choose-panel', panel: panel.id })"
        >
          <img :src="`assets/${panel.art}.webp`" alt="" width="1664" height="944">
          <span>{{ panel.name }}</span>
        </button>
      </div>
      <p class="gal-order-note">依序點選四格；點已放的格子可以取消。從哪一端開始都可以，紅線從兩端讀都是同一條。</p>
      <p id="gal-feedback" class="challenge-feedback" role="status" aria-live="polite">{{ state.feedback }}</p>
    </template>

    <section v-else class="gal-merge-complete" aria-labelledby="gal-merge-complete-title">
      <h3 id="gal-merge-complete-title">紅線連成一條直線</h3>
      <svg class="gal-line" viewBox="0 0 540 90" role="img" aria-label="四段紅線連成一條直線，像注音符號ㄧ">
        <line x1="30" y1="45" x2="510" y2="45" stroke="#c8172f" stroke-width="5" stroke-linecap="round" />
        <g v-for="(id, index) in state.order" :key="id">
          <rect :x="[32, 172, 312, 452][index]" y="25" width="56" height="40" rx="4" fill="#150d1a" stroke="#8a6a2a" stroke-width="2" />
          <text :x="[60, 200, 340, 480][index]" y="50" text-anchor="middle" font-size="13" fill="#e9dcc3">{{ panelNames.get(id) }}</text>
        </g>
        <circle cx="510" cy="45" r="7" fill="#c8172f" stroke="#fff" stroke-width="1.5" />
      </svg>
      <p class="gal-order-note">四格依序排好，紅線連成一條直線。從另一端讀也是同一條紅線，所以兩種排法都算對。</p>
      <p id="bf-status" class="belfry-status" role="status" :data-tone="state.tone">{{ state.status }}</p>
    </section>
  </div>
</template>

<style scoped>
.gal-merge-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 0;
}

.gal-merge-panel {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid #8a6a2a;
  border-radius: 4px;
  background: #0b0a0f;
  text-align: center;
}

.gal-merge-art {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1664 / 944;
}

.gal-merge-art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gal-merge-art img.flipped {
  transform: scaleX(-1);
}

.gal-merge-notch {
  z-index: 1;
}

.gal-merge-panel figcaption {
  padding: 3px;
  color: #fff;
  font-size: 12px;
}

.gal-merge-flip {
  width: auto;
  min-height: 40px;
  margin: 0 4px 4px;
  padding: 0 8px;
}

.gal-merge-place {
  width: auto;
  min-height: 44px;
}

.gal-merge-complete h3 {
  color: #e8c46a;
  text-align: center;
}

@media (min-width: 720px) {
  .gal-merge-panels {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
