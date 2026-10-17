<script setup lang="ts">
import { computed, inject } from 'vue';
import { TAROT_ART_BASE_KEY } from './tarotArt';
import type { TarotCard, TarotOrientation } from './tarot';

const props = defineProps<{
  card: TarotCard | null;
  orientation: TarotOrientation | null;
  position: string;
  index: number;
  revealed: boolean;
}>();

const emit = defineEmits<{ reveal: [index: number] }>();
const artBase = inject(TAROT_ART_BASE_KEY, '');
const backSrc = computed(() => `${artBase}card-back.webp`);
const frontSrc = computed(() => (props.card ? `${artBase}${props.card.id}.webp` : ''));
</script>

<template>
  <div class="drawn-card">
    <p class="drawn-card__position">{{ position }}</p>
    <button
      v-if="!revealed"
      class="tarot-card tarot-card--back"
      type="button"
      :aria-label="`揭開${position}的牌`"
      @click="emit('reveal', index)"
    >
      <span class="tarot-card__frame" aria-hidden="true">
        <img class="tarot-card__art" :src="backSrc" alt="" width="576" height="864" loading="eager" decoding="async">
        <span class="tarot-card__instruction">點選揭牌</span>
      </span>
    </button>
    <article v-else class="tarot-card tarot-card--front" :class="{ 'is-reversed': orientation === 'reversed' }">
      <span class="tarot-card__frame">
        <img class="tarot-card__art" :src="frontSrc" :alt="card ? `${card.name}的插畫` : ''" width="576" height="864" decoding="async">
        <span class="tarot-card__number">{{ card?.number }}</span>
        <span class="tarot-card__label">
          <span class="tarot-card__name">{{ card?.name }}</span>
          <span class="tarot-card__english">{{ card?.englishName }}</span>
        </span>
      </span>
    </article>
  </div>
</template>

<style scoped>
.drawn-card { display:grid; grid-template-columns:minmax(0,1fr); justify-items:center; gap:10px; min-width:0; }
.drawn-card__position { min-height:1.5em; margin:0; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); text-align:center; }
.tarot-card { position:relative; display:grid; width:min(100%,200px); aspect-ratio:2 / 3; padding:6px; border:1px solid var(--ll-color-gold); border-radius:12px; color:var(--ll-color-text); background:#0a1119; box-shadow:0 14px 30px rgb(0 0 0 / 0.45); text-align:center; overflow:hidden; }
.tarot-card__frame { position:relative; display:block; width:100%; height:100%; overflow:hidden; border-radius:7px; }
.tarot-card__art { display:block; width:100%; height:100%; object-fit:cover; transition:transform var(--ll-motion-standard) ease; }
button.tarot-card { cursor:pointer; transition:border-color var(--ll-motion-standard), box-shadow var(--ll-motion-standard); }
button.tarot-card:hover { border-color:var(--ll-color-gold-bright); box-shadow:0 14px 30px rgb(0 0 0 / 0.5), 0 0 26px rgb(217 191 138 / 0.22); }
.tarot-card:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:4px; }
.tarot-card__instruction { position:absolute; right:0; bottom:0; left:0; padding:22px 8px 12px; color:var(--ll-color-gold-bright); font-size:var(--ll-font-size-sm); letter-spacing:0.06em; background:linear-gradient(0deg,rgb(4 8 13 / 0.92),transparent); }
.tarot-card__label { position:absolute; right:0; bottom:0; left:0; display:grid; justify-items:center; gap:2px; padding:28px 8px 12px; background:linear-gradient(0deg,rgb(4 8 13 / 0.94) 35%,transparent); }
.tarot-card__number { position:absolute; top:8px; left:10px; padding:2px 7px; border-radius:999px; color:var(--ll-color-gold-bright); font-size:var(--ll-font-size-xs); background:rgb(4 8 13 / 0.7); }
.tarot-card__name { color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-lg); line-height:1.25; }
.tarot-card__english { color:var(--ll-color-text-muted); font-size:var(--ll-font-size-xs); letter-spacing:0.02em; }
/* One-shot turn when a card is revealed; the front face is mounted in its place. */
.tarot-card--front { animation:card-turn 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; transform-origin:center; }
.tarot-card--front.is-reversed .tarot-card__art { transform:rotate(180deg); }
@keyframes card-turn {
  from { opacity:0.2; transform:perspective(900px) rotateY(82deg); }
  to { opacity:1; transform:none; }
}
@media (prefers-reduced-motion:reduce) {
  button.tarot-card,.tarot-card__art { transition:none; }
  .tarot-card--front { animation:none; }
}
</style>
