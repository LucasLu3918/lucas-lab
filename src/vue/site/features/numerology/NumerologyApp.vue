<script setup lang="ts">
import { computed, ref } from 'vue';
import { meaningFor } from './meanings';
import { calculateNumerology, type NumberReading, type NumerologyReport } from './numerology';
import type { MethodResult } from '../fortune-core/result';

const todayIso = () => new Date().toLocaleDateString('en-CA');
const birthDate = ref('');
const asOfDate = ref(todayIso());
const fullName = ref('');
const yAsVowel = ref(false);
const result = ref<MethodResult<NumerologyReport> | null>(null);
const error = ref('');

interface Card { id: string; title: string; reading: NumberReading }

const cards = computed<Card[]>(() => {
  const data = result.value?.data;
  if (!data) return [];
  const nameCards: Card[] = data.name
    ? [
      { id: 'expression', title: '表達數', reading: data.name.expression },
      ...(data.name.soulUrge ? [{ id: 'soul', title: '靈魂數', reading: data.name.soulUrge }] : []),
      { id: 'personality', title: '人格數', reading: data.name.personality },
    ]
    : [];
  const core: Card[] = [
    { id: 'life', title: '生命靈數（生命路徑）', reading: data.lifePath },
    ...nameCards,
    { id: 'birthday', title: '生日數', reading: data.birthday },
  ];
  const cycles: Card[] = [
    { id: 'year', title: `${asOfDate.value.slice(0, 4)} 年度循環`, reading: data.personalYear },
    { id: 'month', title: '本月循環', reading: data.personalMonth },
    { id: 'day', title: '當日循環', reading: data.personalDay },
  ];
  return [...core, ...cycles];
});

function calculate(): void {
  error.value = '';
  try {
    result.value = calculateNumerology({
      birthDate: birthDate.value,
      asOfDate: asOfDate.value,
      fullName: fullName.value,
      yAsVowel: yAsVowel.value,
    });
  } catch (cause) {
    result.value = null;
    error.value = cause instanceof Error ? cause.message : '無法計算，請檢查日期與姓名。';
  }
}
</script>

<template>
  <div class="numerology-app">
    <header class="page-head">
      <h1>生命靈數</h1>
      <p>依畢達哥拉斯系統，從出生日期與英文全名整理生命路徑與目前的循環節奏。每一步計算都會列出，方便你自行核對。</p>
    </header>

    <form class="birth-form" @submit.prevent="calculate">
      <label>出生日期<input v-model="birthDate" type="date" required autocomplete="bday"></label>
      <label>查詢日期<input v-model="asOfDate" type="date" required><small>用來計算年度、月與當日循環，預設為今天。</small></label>
      <label class="wide">英文全名（選填）<input v-model="fullName" type="text" autocomplete="name" placeholder="例如 Chen Yi-Chun" maxlength="80"><small>用於表達數、靈魂數與人格數；需使用英文或拼音字母。不填寫時仍可看生命路徑與循環數。</small></label>
      <label class="check-row"><input v-model="yAsVowel" type="checkbox">將 Y 視為母音<small>Y 依發音可能是母音（例如 Yvonne 的 Y）；預設視為子音。</small></label>
      <button class="primary-button" type="submit">計算生命靈數</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="result" class="results" aria-live="polite">
      <article v-for="card in cards" :key="card.id" class="number-card">
        <p class="card-title">{{ card.title }}</p>
        <strong class="number">{{ card.reading.value }}</strong>
        <h2>{{ meaningFor(card.reading.value).keyword }}</h2>
        <p>{{ meaningFor(card.reading.value).summary }}</p>
        <p class="guidance">{{ meaningFor(card.reading.value).guidance }}</p>
        <details class="steps">
          <summary>計算步驟</summary>
          <ol><li v-for="step in card.reading.steps" :key="step">{{ step }}</li></ol>
        </details>
      </article>
    </section>

    <details v-if="result" class="method">
      <summary>計算方法與版本</summary>
      <p>方法版本：{{ result.methodVersion }}；內容版本：{{ result.contentVersion }}。</p>
      <p>年、月、日各自先化約，再相加並化約；11、22、33 為主數，不再化約。月與日循環以各自化約後的數字計算。</p>
    </details>

    <aside class="privacy-note">{{ result?.disclaimer ?? '資料僅在本機運算，不會儲存或上傳。數字學內容供娛樂與自我反思，不保證事件，也不取代專業建議。' }}</aside>
  </div>
</template>

<style scoped>
.numerology-app { display: grid; gap: 24px; width: min(100% - 32px, 960px); margin: 0 auto 72px; color: #e4dfd3; }
.page-head { padding: 44px 10px 8px; text-align: center; }
.page-head h1 { margin: 0; color: #f1e5ca; font-size: clamp(2rem, 6vw, 3.3rem); font-weight: 500; }
.page-head > p { color: #bdb9ae; line-height: 1.8; }
.birth-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; padding: 22px; border: 1px solid #a48e524b; border-radius: var(--ll-radius-panel, 14px); background: #0b1117; }
.birth-form label { display: grid; gap: 6px; color: #d4c69f; font-size: 0.9rem; }
.birth-form small { color: #aaa99f; font-size: 0.8125rem; line-height: 1.6; }
.birth-form input[type='date'], .birth-form input[type='text'] { padding: 10px 12px; border: 1px solid #52606a; border-radius: 10px; background: #080e16; color: #f1e5ca; font: inherit; }
.birth-form .wide { grid-column: 1 / -1; }
.check-row { grid-template-columns: auto 1fr; align-items: center; }
.check-row input { width: 18px; height: 18px; accent-color: #c7a859; }
.check-row small { grid-column: 2; }
.primary-button { grid-column: 1 / -1; justify-self: start; padding: 11px 22px; border: 1px solid #c7a859; border-radius: 999px; background: transparent; color: #f1e5ca; font: inherit; cursor: pointer; }
.primary-button:focus-visible { outline: 2px solid #c7a859; outline-offset: 3px; }
.error { grid-column: 1 / -1; margin: 0; color: #e8a59a; }
.results { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 14px; }
.number-card { display: grid; gap: 8px; align-content: start; padding: 20px; border: 1px solid #a48e524b; border-radius: 14px; background: #0b1117; }
.card-title { margin: 0; color: #cfb878; font-size: 0.8125rem; }
.number { color: #f1e5ca; font-size: 2.6rem; font-weight: 500; line-height: 1; }
.number-card h2 { margin: 0; color: #f1e5ca; font-size: 1.125rem; font-weight: 500; }
.number-card p { margin: 0; line-height: 1.7; }
.guidance { color: #d4c69f; }
.steps summary, .method summary { color: #cfb878; cursor: pointer; }
.steps ol { margin: 8px 0 0; padding-left: 20px; color: #c5c0b6; line-height: 1.8; font-size: 0.875rem; }
.method { color: #c5c0b6; line-height: 1.7; }
.privacy-note { color: #aaa99f; font-size: 0.875rem; line-height: 1.7; }
@media (max-width: 680px) { .birth-form { grid-template-columns: 1fr; } }
</style>
