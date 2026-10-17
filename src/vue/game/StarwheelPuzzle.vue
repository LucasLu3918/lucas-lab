<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import {
  STARWHEEL_CENTER,
  STARWHEEL_RADIUS,
  starwheelPoint,
  type StarwheelAction,
  type StarwheelSnapshot,
} from './starwheel';

const props = defineProps<{
  snapshot: StarwheelSnapshot;
  onAction: (action: StarwheelAction) => StarwheelSnapshot | null;
}>();

const current = shallowRef(props.snapshot);
watch(() => props.snapshot, value => { current.value = value; });

const notches = computed(() => current.value.notches.map(notch => {
  const [x1, y1] = starwheelPoint(notch.index, STARWHEEL_RADIUS - 9);
  const [x2, y2] = starwheelPoint(notch.index, STARWHEEL_RADIUS + 9);
  const [textX, textY] = starwheelPoint(notch.index, STARWHEEL_RADIUS - 30);
  return { ...notch, x1, y1, x2, y2, textX, textY: textY + 5 };
}));

const hammerTransform = computed(() =>
  `rotate(${current.value.hammerAngle.toFixed(2)} ${STARWHEEL_CENTER} ${STARWHEEL_CENTER})`,
);

function act(action: StarwheelAction) {
  const next = props.onAction(action);
  if (next) current.value = next;
}
</script>

<template>
  <section class="belfry starwheel-puzzle">
    <p class="challenge-help">
      星輪有 13 個缺口，紅寶石在最上面。撥爪每響一聲，就順時針跨過固定的格數，敲在缺口上。
      <b>讓第一聲到第十二聲，依序敲在刻著「一」到「十二」的缺口上</b>，第十三聲就會落回紅寶石，暗格才會鬆開。
    </p>
    <ol class="belfry-rules">
      <li>邊緣的刻字要用燭光才看得見。</li>
      <li>用「−」「＋」設定撥爪每一聲跨幾格，再按「敲鐘」。敲錯不會有懲罰，只會停在出錯的那一聲。</li>
    </ol>
    <p id="bf-status" class="belfry-status" role="status" :data-tone="current.tone">{{ current.status }}</p>
    <div class="belfry-board wheel-board">
      <svg
        id="bf-svg"
        class="belfry-svg wheel-svg"
        :class="{ lit: current.lit }"
        viewBox="0 0 320 320"
        role="img"
        aria-label="十三格星輪"
      >
        <circle class="wheel-ring-shadow" :cx="STARWHEEL_CENTER + 1.5" :cy="STARWHEEL_CENTER + 3" :r="STARWHEEL_RADIUS" />
        <circle class="wheel-ring" :cx="STARWHEEL_CENTER" :cy="STARWHEEL_CENTER" :r="STARWHEEL_RADIUS" />
        <circle class="wheel-ring-lit" :cx="STARWHEEL_CENTER" :cy="STARWHEEL_CENTER" :r="STARWHEEL_RADIUS + 4.8" />
        <circle class="wheel-ring-dark" :cx="STARWHEEL_CENTER" :cy="STARWHEEL_CENTER" :r="STARWHEEL_RADIUS - 4.8" />
        <circle class="wheel-hub" :cx="STARWHEEL_CENTER" :cy="STARWHEEL_CENTER" r="26" />
        <circle class="wheel-hub-lit" :cx="STARWHEEL_CENTER" :cy="STARWHEEL_CENTER" r="21" />
        <g v-for="notch in notches" :key="notch.index">
          <line class="wheel-notch" :x1="notch.x1" :y1="notch.y1" :x2="notch.x2" :y2="notch.y2" />
          <image
            v-if="notch.ruby"
            class="wheel-ruby"
            :href="'assets/puzzles/wheel-ruby.webp'"
            :x="notch.x2 - 15"
            :y="notch.y2 + 4 - 18.5"
            width="30"
            height="37"
            pointer-events="none"
          />
          <text
            v-else
            class="wheel-glyph"
            :x="notch.textX"
            :y="notch.textY"
            :data-notch="notch.index"
          >{{ notch.numeral }}</text>
        </g>
        <g class="wheel-hammer-turn" :transform="hammerTransform">
          <line class="wheel-hammer" :x1="STARWHEEL_CENTER" :y1="STARWHEEL_CENTER" :x2="STARWHEEL_CENTER" :y2="STARWHEEL_CENTER - STARWHEEL_RADIUS + 4" />
          <line class="wheel-hammer-hi" :x1="STARWHEEL_CENTER" :y1="STARWHEEL_CENTER" :x2="STARWHEEL_CENTER" :y2="STARWHEEL_CENTER - STARWHEEL_RADIUS + 4" />
          <circle class="wheel-hammer-head" :cx="STARWHEEL_CENTER" :cy="STARWHEEL_CENTER - STARWHEEL_RADIUS + 4" r="7" />
        </g>
        <circle class="wheel-pin" :cx="STARWHEEL_CENTER" :cy="STARWHEEL_CENTER" r="7" />
        <text id="wheel-toll" class="wheel-toll" :x="STARWHEEL_CENTER" :y="STARWHEEL_CENTER + 9">{{ current.toll }}</text>
      </svg>
    </div>
    <p v-if="current.lit" id="wheel-engraving" class="wheel-engraving">
      刻在輪緣內側：「曲柄十三圈，輪走一圈。擺兩次，鐘響一次。響到第十三聲，暗格才開。」
    </p>
    <div class="belfry-row">
      <button
        id="wheel-candle"
        class="secondary-button"
        type="button"
        :aria-pressed="current.lit"
        @click="act({ type: 'toggle-candle' })"
      >{{ current.lit ? '熄燭' : '點燭' }}</button>
      <span class="wheel-step">
        <button
          id="wheel-less"
          class="secondary-button"
          type="button"
          aria-label="撥爪少跨一格"
          :disabled="current.running || current.step <= 1"
          @click="act({ type: 'adjust-step', delta: -1 })"
        >−</button>
        <output id="wheel-step" class="belfry-note" aria-live="polite">撥爪每聲跨 {{ current.step }} 格</output>
        <button
          id="wheel-more"
          class="secondary-button"
          type="button"
          aria-label="撥爪多跨一格"
          :disabled="current.running || current.step >= 12"
          @click="act({ type: 'adjust-step', delta: 1 })"
        >＋</button>
      </span>
    </div>
    <button id="bf-run" class="primary-button" type="button" :disabled="current.running" @click="act({ type: 'run' })">
      敲鐘 ⟶
    </button>
  </section>
</template>
