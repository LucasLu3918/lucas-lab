<script setup lang="ts">
import TarotCard from './TarotCard.vue';
import { TAROT_POSITIONS, type TarotSpreadId } from './tarot';
import type { DrawnTarotCard } from './useTarotReading';

const props = defineProps<{
  cards: DrawnTarotCard[];
  spread: TarotSpreadId;
  revealedIndexes: number[];
}>();
const emit = defineEmits<{ reveal: [index: number] }>();
</script>

<template>
  <section v-if="props.cards.length" class="card-table" aria-labelledby="table-title">
    <div class="card-table__heading"><h2 id="table-title">在燭光下揭開牌面</h2></div>
    <div class="card-table__cards" :class="{ 'card-table__cards--three': props.cards.length === 3, 'card-table__cards--five': props.cards.length === 5 }">
      <TarotCard
        v-for="(item, index) in props.cards"
        :key="`${item.card.id}-${index}`"
        :card="item.card"
        :orientation="item.orientation"
        :position="TAROT_POSITIONS[props.spread][index]"
        :index="index"
        :revealed="props.revealedIndexes.includes(index)"
        @reveal="emit('reveal', $event)"
      />
    </div>
    <p class="card-table__hint" aria-live="polite">
      {{ props.revealedIndexes.length === props.cards.length ? '牌面已全部揭開。' : `已揭開 ${props.revealedIndexes.length} / ${props.cards.length} 張牌。` }}
    </p>
  </section>
</template>

<style scoped>
/* The table is a stage, not a box: a soft pool of light under the cards. */
.card-table { display:grid; justify-items:center; gap:22px; padding:clamp(12px,3vw,24px) 0 clamp(8px,2vw,12px); background:radial-gradient(ellipse at 50% 42%,rgb(56 80 98 / 0.28) 0,transparent 66%); }
.card-table__heading { text-align:center; }
.card-table__heading h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-2xl); font-weight:500; }
.card-table__cards { display:flex; justify-content:center; gap:clamp(14px,4vw,36px); width:100%; }
.card-table__cards--three { display:grid; grid-template-columns:repeat(3,minmax(0,200px)); }
.card-table__cards--five { display:grid; grid-template-columns:repeat(3,minmax(0,170px)); }
.card-table__hint { margin:0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
@media (max-width:620px) { .card-table__cards--three { grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; } .card-table__cards--five { grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; } }
</style>
