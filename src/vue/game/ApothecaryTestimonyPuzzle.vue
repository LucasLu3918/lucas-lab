<script setup lang="ts">
import { shallowRef } from 'vue';
import type { ApothecaryTestimonyAction, ApothecaryTestimonySnapshot } from './apothecary-testimony';

const props = defineProps<{
  snapshot: ApothecaryTestimonySnapshot;
  onAction: (action: ApothecaryTestimonyAction) => ApothecaryTestimonySnapshot;
}>();

const state = shallowRef(props.snapshot);

function dispatch(action: ApothecaryTestimonyAction): void {
  state.value = props.onAction(action);
}
</script>

<template>
  <div class="apothecary-testimony-puzzle">
    <div class="belfry-row">
      <button
        id="apo-mirror"
        class="secondary-button"
        :aria-pressed="state.mirror"
        @click="dispatch({ type: 'toggle-mirror' })"
      >{{ state.mirror ? '放下手持鏡' : '舉起手持鏡' }}</button>
      <span class="apo-note">證詞原本是反寫的鏡中字</span>
    </div>
    <div id="apo-cards" class="apo-cards" :class="{ 'apo-mirrored': !state.mirror }">
      <article
        v-for="(name, index) in state.apprentices"
        :key="name"
        class="apo-card"
        :class="{ struck: state.ruled.includes(index) }"
        :data-card="index"
      >
        <svg viewBox="0 0 128 128" aria-hidden="true">
          <image :href="'assets/puzzles/scale-icons.webp'" width="640" height="128" />
        </svg>
        <b>{{ index + 1 }}　{{ name }}</b>
        <span class="apo-card-line">{{ state.cardLines[index] }}</span>
        <span class="apo-say" role="text" :aria-label="`${name}的證詞：${state.testimonies[index]}`">
          「{{ state.testimonies[index] }}」
        </span>
        <span class="apo-acts">
          <button
            class="secondary-button"
            :data-accuse="index"
            :aria-label="`指認${name}拿著毒蘋果`"
            :disabled="state.finished"
            @click="dispatch({ type: 'accuse', index })"
          >指認</button>
          <button
            class="secondary-button"
            :data-strike="index"
            :aria-pressed="state.ruled.includes(index)"
            :aria-label="`劃掉${name}（記下他不是）`"
            :disabled="state.finished"
            @click="dispatch({ type: 'toggle-strike', index })"
          >劃掉</button>
        </span>
      </article>
    </div>
    <p id="bf-status" class="belfry-status" role="status" :data-tone="state.tone">{{ state.message }}</p>
  </div>
</template>
