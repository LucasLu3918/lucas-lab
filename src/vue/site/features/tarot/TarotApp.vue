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
  return `LUCAS LAB 暗黑童話塔羅\n${cards.join('\n\n')}\n\n牌卡提供象徵性的自我反思，不代表必然結果。`;
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
      await navigator.share({ title: 'LUCAS LAB 暗黑童話塔羅', text: shareText.value });
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
    <header class="tarot-hero">
      <p class="tarot-hero__eyebrow">A DARK FAIRYTALE READING ROOM</p>
      <h1>走進月夜占卜室</h1>
      <p class="tarot-hero__lead">在破碎魔鏡與燭光之間，讓古老牌意成為整理思緒的一種方式。</p>
      <p class="tarot-hero__note">本牌組以 Rider–Waite–Smith 傳統牌義架構撰寫繁體中文解讀，提供娛樂與自我反思，不預測或保證事件。</p>
      <div class="tarot-hero__stars" aria-hidden="true">✧　☾　✦</div>
    </header>

    <section class="tarot-workbench" aria-label="塔羅抽牌工具">
      <section class="question-panel" aria-labelledby="question-title">
        <div><p class="eyebrow">OPTIONAL CONTEXT</p><h2 id="question-title">設定本次閱讀焦點</h2><p>可以只選主題，也可以寫下問題；不需要提供姓名或他人資料。</p></div>
        <label>閱讀主題<select v-model="focus"><option v-for="item in TAROT_FOCI" :key="item.id" :value="item.id">{{ item.title }}</option></select></label>
        <label>想整理的問題（選填，最多 160 字）<textarea v-model="question" maxlength="160" rows="3" placeholder="例如：我可以怎麼為這個計畫踏出下一步？"></textarea></label>
        <small>問題只暫存在目前頁面，不會保存到閱讀紀錄或分享文字。避免輸入醫療、法律、財務等需要專業判斷的敏感資料。</small>
      </section>
      <SpreadPicker :spread="spread" :allow-reversed="allowReversed" @select-spread="spread = $event" @toggle-reversed="allowReversed = $event" @draw="beginReading" />
      <p class="tarot-status" role="status" aria-live="polite">{{ status }}</p>
      <CardTable :cards="drawnCards" :spread="readingSpread" :revealed-indexes="revealedIndexes" @reveal="revealCard" />
      <ReadingResult :cards="drawnCards" :spread="readingSpread" :revealed-indexes="revealedIndexes" :focus="readingFocus" :question="readingQuestion" />

      <section v-if="readingComplete" class="journal-panel" aria-labelledby="journal-title">
        <div><p class="eyebrow">PRIVATE REFLECTION</p><h2 id="journal-title">留下自己的觀察</h2></div>
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
.tarot-app { display:grid; gap:clamp(24px,5vw,46px); width:min(100% - 32px,1020px); margin:0 auto 72px; }
.tarot-hero { position:relative; display:grid; justify-items:center; min-height:330px; padding:clamp(52px,10vw,96px) 18px 42px; overflow:hidden; border-bottom:1px solid #b79b5b3d; text-align:center; background:radial-gradient(ellipse at 50% 36%,#293c4c 0,#111b25 35%,#090f16 77%); }
.tarot-hero::before,.tarot-hero::after { position:absolute; top:-170px; left:50%; width:min(75vw,700px); aspect-ratio:1; border:1px solid #d3b67125; border-radius:50%; box-shadow:0 0 0 24px #bd9f6109,0 0 0 54px #bd9f6107; content:""; transform:translateX(-50%); pointer-events:none; }
.tarot-hero::after { top:-130px; width:min(58vw,540px); border-style:dashed; transform:translateX(-50%) rotate(16deg); }
.tarot-hero__eyebrow,.tarot-hero h1,.tarot-hero__lead,.tarot-hero__note,.tarot-hero__stars { position:relative; z-index:1; }
.tarot-hero__eyebrow { margin:0 0 10px; color:#d1b878; font-size:.74rem; letter-spacing:.2em; }
.tarot-hero h1 { margin:0; color:#f2e5c6; font-family:var(--font-heading,Georgia,serif); font-size:clamp(2.2rem,7vw,4.2rem); font-weight:500; letter-spacing:.08em; text-shadow:0 6px 32px #0009; }
.tarot-hero__lead { max-width:620px; margin:15px 0 0; color:#ddd5c4; font-size:clamp(1rem,2.5vw,1.2rem); line-height:1.8; }
.tarot-hero__note { max-width:700px; margin:14px 0 0; color:#aaa99f; font-size:.86rem; line-height:1.7; }
.tarot-hero__stars { margin-top:21px; color:#cfb271; letter-spacing:.6em; }
.tarot-workbench { display:grid; gap:20px; }
.tarot-status { min-height:1.5em; margin:0; color:#c7b98f; text-align:center; }
.question-panel { display:grid; grid-template-columns:minmax(180px,.7fr) minmax(0,1.3fr); gap:14px 20px; padding:21px; border:1px solid #64707a55; border-radius:16px; background:#111922; }
.question-panel>div { grid-row:span 2; }
.question-panel h2 { margin:.25em 0 6px; color:#ead9b5; font-size:1.25rem; }
.question-panel p:not(.eyebrow) { margin:0; color:#b8b5aa; font-size:.86rem; line-height:1.6; }
.question-panel label { display:grid; gap:7px; color:#d4c69f; font-size:.86rem; }
.question-panel select,.question-panel textarea { width:100%; padding:10px 12px; border:1px solid #53606a; border-radius:10px; color:#e2ddcf; background:#0a1016; font:inherit; }
.question-panel select { min-height:44px; }
.question-panel textarea { resize:vertical; line-height:1.6; }
.question-panel select:focus-visible,.question-panel textarea:focus-visible { outline:3px solid #f0d59a; outline-offset:2px; }
.question-panel>small { grid-column:2; color:#a6a69f; line-height:1.6; }
.share-panel { display:grid; justify-items:start; gap:12px; padding:21px; border:1px solid #8b794c42; border-radius:16px; background:#111922; }
.share-button { min-height:46px; padding:0 18px; border:1px solid #bda66e; border-radius:999px; color:#f0e5cd; background:#2a302d; cursor:pointer; }
.share-button:hover { border-color:#f0d69b; background:#343a35; }
.share-button:focus-visible { outline:3px solid #f0d59a; outline-offset:3px; }
.share-status { margin:0; color:#ddd0ad; }
.share-copy { display:grid; gap:8px; width:100%; color:#b8b5aa; font-size:.82rem; }
.share-copy textarea { width:100%; resize:vertical; padding:12px; border:1px solid #53606a; border-radius:10px; color:#e2ddcf; background:#0a1016; font:inherit; line-height:1.65; }
.share-copy textarea:focus-visible { outline:3px solid #f0d59a; outline-offset:2px; }
.journal-panel { display:grid; gap:12px; padding:22px; border:1px solid #82734a42; border-radius:16px; background:#0e151c; }
.journal-panel h2 { margin:.25em 0 0; color:#ead9b5; font-size:1.3rem; }
.journal-panel label { color:#b8b5aa; font-size:.88rem; }
.journal-panel textarea { width:100%; resize:vertical; padding:12px; border:1px solid #53606a; border-radius:10px; color:#e2ddcf; background:#0a1016; font:inherit; line-height:1.65; }
.journal-panel textarea:focus-visible { outline:3px solid #f0d59a; outline-offset:2px; }
.journal-save { justify-self:start; min-height:44px; padding:0 16px; border:1px solid #bda66e; border-radius:999px; color:#f0e5cd; background:#2a302d; cursor:pointer; }
.journal-save:focus-visible { outline:3px solid #f0d59a; outline-offset:3px; }
.tarot-footnote { padding:20px 23px; border-left:2px solid #8e7847; color:#b9b6ac; background:linear-gradient(90deg,#171e22,#11171c); }
.tarot-footnote h2 { margin:0 0 8px; color:#d9c491; font-size:1rem; }
.tarot-footnote p { margin:8px 0 0; line-height:1.75; }
@media (max-width:480px) { .tarot-app { width:min(100% - 22px,1020px); } .tarot-hero { min-height:285px; } }
@media (max-width:620px) { .question-panel { grid-template-columns:1fr; } .question-panel>div { grid-row:auto; } .question-panel>small { grid-column:1; } }
</style>
