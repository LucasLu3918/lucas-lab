<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { watchGearSvgMarkup, type WatchAction, type WatchSnapshot } from './watch';

const props = defineProps<{
  snapshot: WatchSnapshot;
  onAction: (action: WatchAction) => WatchSnapshot | null;
}>();

const state = shallowRef(props.snapshot);
const aligned = computed(() => state.value.gears.filter(position => position === 0).length);
const status = computed(() => state.value.note
  || `${state.value.warm ? '暖身 · ' : ''}${aligned.value} / 3 道刻痕已對準 · 已轉動 ${state.value.turns} 次`);

function act(action: WatchAction): void {
  const next = props.onAction(action);
  if (next) state.value = next;
}
</script>

<template>
  <div class="watch-puzzle">
    <p class="challenge-help">
      {{ state.warm
        ? '錶蓋裡藏著咬合的齒輪，指針正在倒著走。先試一次：轉動「時輪」，看看它的下一枚齒輪怎麼被拉回來。'
        : '三枚齒輪咬合在一起。每轉動一枚，它的下一枚就會被拉回一格（秒輪會拉回時輪）——讓三道刻痕同時對準，指針才會重新往前走。' }}
    </p>
    <div class="watch-board" role="group" aria-label="懷錶的三枚齒輪">
      <button
        v-for="(position, index) in state.gears"
        :key="index"
        class="watch-gear"
        :class="[`rot${position}`, { aligned: position === 0 }]"
        :data-gear="index"
        :aria-label="`${['時輪', '分輪', '秒輪'][index]}，刻痕在第 ${position + 1} 格（共 6 格），${position === 0 ? '已對準' : '尚未對準'}，按下轉動一格`"
        type="button"
        @click="act({ type: 'turn', index })"
      >
        <span class="gear-frame" aria-hidden="true">
          <span
            class="gear-spin"
            :style="{ transform: `rotate(${state.angles[index]}deg)`, transition: state.animate ? undefined : 'none' }"
          >
            <span aria-hidden="true" v-html="watchGearSvgMarkup(index)" />
            <span class="gear-ruby" />
          </span>
          <span class="gear-shade" />
        </span>
        <span class="watch-name">{{ ['時輪', '分輪', '秒輪'][index] }}</span>
      </button>
    </div>
    <p id="watch-status" class="challenge-feedback" role="status">{{ status }}</p>
    <button id="watch-reset" class="secondary-button" type="button" @click="act({ type: 'reset' })">
      齒輪歸位
    </button>
  </div>
</template>
