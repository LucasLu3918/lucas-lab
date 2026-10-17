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
    <div class="card-table__heading"><p class="eyebrow">THE READING</p><h2 id="table-title">在燭光下揭開牌面</h2></div>
    <div class="card-table__cards" :class="{ 'card-table__cards--three': props.cards.length === 3 }">
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
.card-table { display:grid; justify-items:center; gap:20px; padding:clamp(20px,4vw,34px); border:1px solid #89784b40; border-radius:20px; background:radial-gradient(ellipse at 50% 0,#26323b80,#0b1016e8 68%); }
.card-table__heading { text-align:center; }
.card-table__heading h2 { margin:.3em 0 0; font-family:var(--font-heading,Georgia,serif); font-size:clamp(1.35rem,3vw,1.8rem); }
.eyebrow { margin:0; color:#cdb578; font-size:.72rem; letter-spacing:.14em; }
.card-table__cards { display:flex; justify-content:center; gap:clamp(14px,4vw,36px); width:100%; }
.card-table__cards--three { display:grid; grid-template-columns:repeat(3,minmax(0,220px)); }
.card-table__hint { margin:0; color:#c3b99f; font-size:.9rem; }
@media (max-width:620px) { .card-table__cards--three { grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; } }
</style>
