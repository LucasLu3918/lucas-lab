<script setup lang="ts">
import type { TarotHistoryEntry } from './TarotHistoryRepository';
import type { TarotCard } from './tarot';

defineProps<{ items: TarotHistoryEntry[]; cardById: Map<string, TarotCard> }>();
const emit = defineEmits<{ clear: []; export: [] }>();

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
    <div class="reading-history__heading"><h2 id="history-title">最近的牌陣</h2><div class="reading-history__actions"><button class="history-button" type="button" @click="emit('export')">匯出 JSON</button><button class="history-button" type="button" @click="emit('clear')">清除紀錄</button></div></div>
    <ol>
      <li v-for="item in items" :key="item.id">
        <time :datetime="item.createdAt">{{ formatDate(item.createdAt) }}</time>
        <span>{{ spreadTitles[item.spread] }}</span>
        <span class="history-cards">{{ item.cards.map(card => cardById.get(card.cardId)?.name ?? '牌卡').join(' ・ ') }}</span>
        <p v-if="item.note" class="history-note">{{ item.note }}</p>
      </li>
    </ol>
    <p class="reading-history__privacy">紀錄僅保存在此瀏覽器，不會同步到其他裝置；問題內容不會被記錄。匯出檔只包含牌卡、時間與筆記。</p>
  </section>
</template>

<style scoped>
.reading-history { display:grid; gap:14px; padding-top:24px; border-top:1px solid var(--ll-color-hairline); }
.reading-history__heading { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.reading-history__heading h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-xl); font-weight:500; }
.reading-history__actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }
.history-button { min-height:44px; padding:0 14px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-control); color:var(--ll-color-text); background:transparent; cursor:pointer; }
.history-button:hover { border-color:var(--ll-color-gold); background:var(--ll-color-surface-raised); }
.history-button:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.reading-history ol { display:grid; margin:0; padding:0; list-style:none; }
.reading-history li { display:grid; grid-template-columns:minmax(120px,auto) minmax(120px,auto) 1fr; gap:12px; padding:12px 0; border-top:1px solid var(--ll-color-hairline); color:var(--ll-color-text); font-size:var(--ll-font-size-sm); }
.reading-history time { color:var(--ll-color-text-muted); }
.history-cards { color:var(--ll-color-gold-bright); }
.history-note { grid-column:1/-1; margin:0; color:var(--ll-color-text-muted); white-space:pre-wrap; line-height:1.6; }
.reading-history__privacy { margin:0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
@media (max-width:620px) { .reading-history li { grid-template-columns:1fr; gap:4px; } }
</style>
