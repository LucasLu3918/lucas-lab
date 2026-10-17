<script setup lang="ts">
import type { TarotHistoryEntry } from './TarotHistoryRepository';
import type { TarotCard } from './tarot';

defineProps<{ items: TarotHistoryEntry[]; cardById: Map<string, TarotCard> }>();
const emit = defineEmits<{ clear: [] }>();

const spreadTitles: Record<TarotHistoryEntry['spread'], string> = {
  single: '單張指引',
  daily: '每日一抽',
  'past-present-future': '過去・現在・方向',
  'situation-challenge-advice': '情境・挑戰・建議',
  choice: '選擇之路',
  'deep-five': '五張深入探索',
};

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '時間不明' : new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
</script>

<template>
  <section v-if="items.length" class="reading-history" aria-labelledby="history-title">
    <div class="reading-history__heading"><div><p class="eyebrow">ONLY ON THIS DEVICE</p><h2 id="history-title">最近的牌陣</h2></div><button class="clear-button" type="button" @click="emit('clear')">清除紀錄</button></div>
    <ol>
      <li v-for="item in items" :key="item.id">
        <time :datetime="item.createdAt">{{ formatDate(item.createdAt) }}</time>
        <span>{{ spreadTitles[item.spread] }}</span>
        <span class="history-cards">{{ item.cards.map(card => cardById.get(card.cardId)?.name ?? '牌卡').join(' ・ ') }}</span>
        <p v-if="item.note" class="history-note">{{ item.note }}</p>
      </li>
    </ol>
    <p class="reading-history__privacy">紀錄僅保存在此瀏覽器，不會同步到其他裝置；問題內容不會被記錄。</p>
  </section>
</template>

<style scoped>
.reading-history { padding:22px clamp(18px,4vw,28px); border:1px solid #82734a42; border-radius:16px; background:#0e151c; }
.reading-history__heading { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.reading-history__heading h2 { margin:.25em 0 0; font-family:var(--font-heading,Georgia,serif); font-size:1.3rem; }
.eyebrow { margin:0; color:#cdb578; font-size:.7rem; letter-spacing:.13em; }
.clear-button { min-height:44px; padding:0 13px; border:1px solid #7b6e50; border-radius:999px; color:#dfd5c0; background:transparent; cursor:pointer; }
.clear-button:hover { border-color:#c9aa69; }
.clear-button:focus-visible { outline:3px solid #f0d59a; outline-offset:3px; }
.reading-history ol { display:grid; gap:8px; margin:17px 0 0; padding:0; list-style:none; }
.reading-history li { display:grid; grid-template-columns:minmax(120px,auto) minmax(120px,auto) 1fr; gap:12px; padding:10px 0; border-top:1px solid #ffffff13; color:#d4cebf; font-size:.85rem; }
.reading-history time { color:#b7a77f; }
.history-cards { color:#ead9b5; }
.history-note { grid-column:1/-1; margin:0; color:#bdb7a8; white-space:pre-wrap; line-height:1.6; }
.reading-history__privacy { margin:13px 0 0; color:#a6a69f; font-size:.8rem; }
@media (max-width:620px) { .reading-history li { grid-template-columns:1fr; gap:4px; } }
</style>
