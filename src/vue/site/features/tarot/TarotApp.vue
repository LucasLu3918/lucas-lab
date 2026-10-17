<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import CardTable from './CardTable.vue';
import ReadingHistory from './ReadingHistory.vue';
import ReadingResult from './ReadingResult.vue';
import SpreadPicker from './SpreadPicker.vue';
import TarotCardLibrary from './TarotCardLibrary.vue';
import { useTarotReading } from './useTarotReading';
import { TAROT_CARD_BY_ID, TAROT_FOCI, TAROT_POSITIONS, type TarotFocus } from './tarot';

const {
  spread, readingSpread, allowReversed, drawnCards, revealedIndexes, history, status,
  readingComplete, journalNote, startReading, revealCard, saveJournalNote, clearHistory,
} = useTarotReading();
const shareText = computed(() => {
  const cards = drawnCards.value.map(({ card, orientation }, index) => {
    const position = TAROT_POSITIONS[readingSpread.value][index];
    return `${position}｜${card.name}（${orientation === 'upright' ? '正位' : '逆位'}）\n${card.meanings[orientation]}`;
  });
  return `LUCAS LAB 星夜塔羅\n${cards.join('\n\n')}\n\n牌卡提供象徵性的自我反思，不代表必然結果。`;
});
const shareStatus = shallowRef('');
const focus = shallowRef<TarotFocus>('general');
const question = shallowRef('');
const readingFocus = shallowRef<TarotFocus>('general');
const readingQuestion = shallowRef('');

function beginReading(): void {
  readingFocus.value = focus.value;
  readingQuestion.value = question.value.trim();
  startReading();
}

async function shareReading(): Promise<void> {
  shareStatus.value = '';
  try {
    if (navigator.share) {
      await navigator.share({ title: 'LUCAS LAB 星夜塔羅', text: shareText.value });
      shareStatus.value = '已開啟分享選單。';
      return;
    }
    await navigator.clipboard.writeText(shareText.value);
    shareStatus.value = '已複製牌面摘要；內容不包含問題或個人資料。';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    shareStatus.value = '無法自動分享，仍可複製下方摘要文字。';
  }
}
</script>

<template>
  <div class="tarot-app">
    <a class="tarot-back" href="../divination/">返回月夜占卜室</a>

    <header class="tarot-hero">
      <h1>星夜塔羅</h1>
      <p class="tarot-hero__lead">走進月夜占卜室，在破碎魔鏡與燭光之間，讓古老牌意成為整理思緒的一種方式。</p>
      <p class="tarot-hero__note">牌義以 Rider–Waite–Smith 傳統架構撰寫為繁體中文，供娛樂與自我反思，不預測或保證事件。</p>
    </header>

    <section class="tarot-workbench" aria-label="塔羅抽牌工具">
      <section class="question-panel" aria-labelledby="question-title">
        <div class="question-panel__intro"><h2 id="question-title">設定本次閱讀焦點</h2><p>可以只選主題，也可以寫下問題；不需要提供姓名或他人資料。</p></div>
        <label>閱讀主題<select v-model="focus"><option v-for="item in TAROT_FOCI" :key="item.id" :value="item.id">{{ item.title }}</option></select></label>
        <label>想整理的問題（選填，最多 160 字）<textarea v-model="question" maxlength="160" rows="3" placeholder="例如：我可以怎麼為這個計畫踏出下一步？"></textarea></label>
        <small>問題只暫存在目前頁面，不會保存到閱讀紀錄或分享文字。避免輸入醫療、法律、財務等需要專業判斷的敏感資料。</small>
      </section>
      <SpreadPicker :spread="spread" :allow-reversed="allowReversed" @select-spread="spread = $event" @toggle-reversed="allowReversed = $event" @draw="beginReading" />
      <p class="tarot-status" role="status" aria-live="polite">{{ status }}</p>
      <CardTable :cards="drawnCards" :spread="readingSpread" :revealed-indexes="revealedIndexes" @reveal="revealCard" />
      <ReadingResult :cards="drawnCards" :spread="readingSpread" :revealed-indexes="revealedIndexes" :focus="readingFocus" :question="readingQuestion" />

      <section v-if="readingComplete" class="journal-panel" aria-labelledby="journal-title">
        <h2 id="journal-title">留下自己的觀察</h2>
        <label for="journal-note">反思筆記（最多 500 字，只存於這個瀏覽器）</label>
        <textarea id="journal-note" v-model="journalNote" maxlength="500" rows="4" placeholder="哪些牌意和你此刻的經驗有所呼應？"></textarea>
        <button type="button" class="journal-save" @click="saveJournalNote">儲存筆記</button>
      </section>

      <section v-if="readingComplete" class="share-panel" aria-label="分享牌陣">
        <button class="share-button" type="button" @click="shareReading">分享或複製牌面摘要</button>
        <p v-if="shareStatus" class="share-status" role="status">{{ shareStatus }}</p>
        <label class="share-copy"><span>可複製的牌面摘要（不含問題）</span><textarea :value="shareText" readonly rows="5" aria-label="可複製的牌面摘要"></textarea></label>
      </section>

      <ReadingHistory :items="history" :card-by-id="TAROT_CARD_BY_ID" @clear="clearHistory" />
    </section>

    <TarotCardLibrary />

    <aside class="tarot-footnote">
      <h2>如何閱讀逆位</h2>
      <p>逆位不必直接視為凶兆。這裡以牌義受阻、過度或轉向內在等常見讀法呈現；實際理解仍要放回問題脈絡與個人經驗。</p>
      <p>抽牌使用瀏覽器安全亂數；每日一抽依裝置當地日期固定一次。閱讀紀錄最多保存最近 20 次，含牌陣、牌卡、方向、時間及你主動寫下的反思筆記。內容只留在本機；問題內容不會被要求或放進分享文字。</p>
    </aside>
  </div>
</template>

<style scoped>
.tarot-app { display:grid; gap:clamp(36px,6vw,56px); width:min(100% - 32px,1020px); margin:0 auto 72px; color:var(--ll-color-text); }
.tarot-back { justify-self:start; margin-top:8px; padding:6px 0; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); text-underline-offset:4px; }
.tarot-back:hover { color:var(--ll-color-gold-bright); }
.tarot-back:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.tarot-hero { display:grid; justify-items:center; gap:14px; padding:clamp(8px,3vw,24px) 0 clamp(28px,5vw,40px); border-bottom:1px solid var(--ll-color-hairline); text-align:center; background:radial-gradient(ellipse closest-side at 50% 40%,rgb(44 64 82 / 0.4) 0,transparent 100%); }
.tarot-hero h1 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:clamp(2.25rem,6vw,3.25rem); font-weight:500; line-height:1.2; letter-spacing:0.06em; }
.tarot-hero__lead { max-width:36em; margin:0; color:var(--ll-color-text); font-size:clamp(1rem,2.4vw,1.1875rem); line-height:1.8; }
.tarot-hero__note { max-width:40em; margin:0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.75; }
.tarot-workbench { display:grid; gap:clamp(28px,4vw,36px); }
.tarot-status { min-height:1.5em; margin:-12px 0 0; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); text-align:center; }
.question-panel { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.6fr); gap:16px 24px; align-items:start; }
.question-panel__intro { grid-column:1 / -1; }
.question-panel h2,.journal-panel h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-2xl); font-weight:500; }
.question-panel__intro p { margin:6px 0 0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.6; }
.question-panel label { display:grid; gap:8px; color:var(--ll-color-text); font-size:var(--ll-font-size-sm); }
.question-panel select,.question-panel textarea,.journal-panel textarea,.share-copy textarea { width:100%; padding:10px 12px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-control); color:var(--ll-color-text); background:var(--ll-color-background); font:inherit; }
.question-panel select { min-height:48px; }
.question-panel textarea,.journal-panel textarea,.share-copy textarea { resize:vertical; line-height:1.65; }
.question-panel>small { grid-column:1 / -1; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.6; }
.question-panel select:focus-visible,.question-panel textarea:focus-visible,.journal-panel textarea:focus-visible,.share-copy textarea:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.share-panel,.journal-panel { display:grid; gap:12px; padding-top:24px; border-top:1px solid var(--ll-color-hairline); }
.journal-panel label { color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.journal-save,.share-button { justify-self:start; min-height:48px; padding:0 18px; border:1px solid var(--ll-color-gold); border-radius:var(--ll-radius-control); color:var(--ll-color-gold-bright); background:transparent; font:650 var(--ll-font-size-body)/1.4 var(--ll-font-body); cursor:pointer; transition:background-color var(--ll-motion-standard); }
.journal-save:hover,.share-button:hover { background:var(--ll-color-surface-raised); }
.journal-save:focus-visible,.share-button:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.share-status { margin:0; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); }
.share-copy { display:grid; gap:8px; width:100%; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.tarot-footnote { display:grid; gap:8px; padding-top:20px; border-top:1px solid var(--ll-color-hairline); color:var(--ll-color-text-muted); line-height:1.75; }
.tarot-footnote h2 { margin:0; color:var(--ll-color-gold); font-family:var(--ll-font-display); font-size:var(--ll-font-size-lg); font-weight:500; }
.tarot-footnote p { margin:0; }
@media (max-width:480px) { .tarot-app { width:min(100% - 32px,1020px); } }
@media (max-width:620px) { .question-panel { grid-template-columns:1fr; } }
@media (prefers-reduced-motion:reduce) { .journal-save,.share-button { transition:none; } }
</style>
