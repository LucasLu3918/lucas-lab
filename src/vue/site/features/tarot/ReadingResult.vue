<script setup lang="ts">
import { TAROT_FOCI, TAROT_POSITIONS, type TarotFocus, type TarotSpreadId } from './tarot';
import type { DrawnTarotCard } from './useTarotReading';

const props = defineProps<{ cards: DrawnTarotCard[]; spread: TarotSpreadId; revealedIndexes: number[]; focus: TarotFocus; question: string }>();
const focusPrompt = TAROT_FOCI.find(item => item.id === props.focus)?.prompt ?? TAROT_FOCI[0].prompt;
const synthesisText = ({
  'past-present-future': '將三張牌放在一起閱讀：過去提供背景，現在呈現你正在面對的狀態，最後一張是可供思考的方向。',
  'situation-challenge-advice': '將三張牌放在一起閱讀：辨認情境與挑戰，再從最後一張牌找出可嘗試的行動。',
  choice: '將三張牌放在一起閱讀：比較兩種方向，再參考最後一張牌提醒自己的選擇條件。',
  'deep-five': '先辨認核心主題與內外在影響，再看看有哪些資源可用，最後把第五張牌轉成一個由你決定是否採取的下一步。',
} as Partial<Record<TarotSpreadId, string>>)[props.spread] ?? '將牌面放在一起閱讀，留意彼此之間的呼應。';
</script>

<template>
  <section v-if="props.cards.length && props.revealedIndexes.length" class="reading-result" aria-labelledby="result-title">
    <div class="reading-result__heading"><h2 id="result-title">牌面訊息</h2></div>
    <aside class="reading-context"><p><strong>閱讀焦點：</strong>{{ TAROT_FOCI.find(item => item.id === props.focus)?.title ?? '整體' }}。{{ focusPrompt }}</p><p v-if="props.question"><strong>你的問題：</strong>{{ props.question }}</p></aside>
    <article v-for="(item, index) in props.cards" v-show="props.revealedIndexes.includes(index)" :key="item.card.id" class="meaning-card">
      <div class="meaning-card__topline">
        <span class="meaning-card__position">{{ TAROT_POSITIONS[props.spread][index] }}</span>
        <span class="meaning-card__orientation">{{ item.orientation === 'upright' ? '正位' : '逆位' }}</span>
      </div>
      <h3>{{ item.card.name }} <small>{{ item.card.englishName }}</small></h3>
      <ul class="meaning-card__keywords" :aria-label="`${item.orientation === 'upright' ? '正位' : '逆位'}關鍵字`">
        <li v-for="keyword in item.card.keywords[item.orientation]" :key="keyword">{{ keyword }}</li>
      </ul>
      <p>{{ item.card.meanings[item.orientation] }}</p>
    </article>
    <p v-if="props.cards.length > 1 && props.revealedIndexes.length === props.cards.length" class="reading-result__synthesis">{{ synthesisText }}</p>
  </section>
</template>

<style scoped>
.reading-result { display:grid; gap:18px; }
.reading-result__heading h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-2xl); font-weight:500; }
.reading-context { display:grid; gap:8px; padding-left:16px; border-left:2px solid var(--ll-color-control-border); color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.7; }
.reading-context p { margin:0; }
.reading-context strong { color:var(--ll-color-gold); font-weight:600; }
.meaning-card { display:grid; gap:8px; padding-top:20px; border-top:1px solid var(--ll-color-hairline); }
.meaning-card__topline { display:flex; justify-content:space-between; gap:12px; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); }
.meaning-card h3 { margin:4px 0 0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-2xl); font-weight:500; }
.meaning-card h3 small { margin-left:8px; color:var(--ll-color-text-muted); font-family:var(--ll-font-body); font-size:var(--ll-font-size-sm); font-weight:400; }
.meaning-card__keywords { display:flex; flex-wrap:wrap; gap:6px; margin:4px 0 0; padding:0; list-style:none; }
.meaning-card__keywords li { padding:3px 10px; border:1px solid var(--ll-color-control-border); border-radius:999px; color:var(--ll-color-gold); font-size:var(--ll-font-size-xs); }
.meaning-card p { max-width:70ch; margin:0; color:var(--ll-color-text); line-height:1.8; }
.reading-result__synthesis { margin:0; padding-left:16px; border-left:2px solid var(--ll-color-gold); color:var(--ll-color-text); line-height:1.8; }
</style>
