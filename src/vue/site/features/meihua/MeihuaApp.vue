<script setup lang="ts">
import { computed, ref } from 'vue';
import { castByCurrentTime, castByNumbers, castByText, type CastMethod, type MeihuaReading, type Topic, type Trigram } from './meihua';
import { interpret } from './interpretation';

const METHOD_LABELS: Record<CastMethod, string> = { time: '時間起卦', numbers: '數字起卦', text: '文字起卦' };
const METHOD_CHOICES: Array<{ value: CastMethod; hint: string }> = [
  { value: 'time', hint: '以目前時間換算農曆，推薦' },
  { value: 'numbers', hint: '一至三個數字' },
  { value: 'text', hint: '一至四字，以筆畫起卦' },
];
const TOPICS: Array<{ value: Topic; label: string }> = [
  { value: 'general', label: '一般' }, { value: 'love', label: '感情' }, { value: 'career', label: '事業' },
  { value: 'wealth', label: '財運' }, { value: 'health', label: '健康' },
];

const method = ref<CastMethod>('time');
const numbersInput = ref('');
const textInput = ref('');
const topic = ref<Topic>('general');
const question = ref('');
const reading = ref<MeihuaReading | null>(null);
const castQuestion = ref('');
const castAt = ref('');
const error = ref('');

// 斷卦文案隨問題方向即時切換，不需要重新起卦。
const copy = computed(() => (reading.value ? interpret(reading.value, topic.value) : null));

function trigramLabel(trigram: Trigram): string {
  return `${trigram.symbol} ${trigram.name}（${trigram.element}）`;
}

function parseNumbers(text: string): number[] {
  const tokens = text.trim().split(/[\s,，、]+/).filter(Boolean);
  if (tokens.some(token => !/^\d+$/.test(token))) throw new RangeError('數字請以空白或逗號分隔，且只能包含 0 至 9。');
  return tokens.map(Number);
}

function cast(): void {
  error.value = '';
  const now = new Date();
  try {
    const next = method.value === 'time'
      ? castByCurrentTime(now)
      : method.value === 'numbers'
        ? castByNumbers(parseNumbers(numbersInput.value), now)
        : castByText(textInput.value, now);
    reading.value = next;
    castQuestion.value = question.value.trim();
    castAt.value = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(now);
  } catch (cause) {
    reading.value = null;
    error.value = cause instanceof Error ? cause.message : '無法起卦，請檢查輸入後再試一次。';
  }
}
</script>

<template>
  <div class="meihua-app">
    <header class="page-head">
      <h1>梅花易數</h1>
      <p>依邵雍《梅花易數》的時間、數字或文字起卦，以體用五行生克與互卦、變卦整理當下的象徵提示。所有計算都在你的瀏覽器完成，不需要出生資料。</p>
    </header>

    <form class="cast-form" @submit.prevent="cast">
      <fieldset class="method-toggle">
        <legend>起卦方式</legend>
        <label v-for="choice in METHOD_CHOICES" :key="choice.value">
          <input v-model="method" type="radio" :value="choice.value" name="meihua-method">
          {{ METHOD_LABELS[choice.value] }}
          <small>{{ choice.hint }}</small>
        </label>
      </fieldset>

      <label v-if="method === 'numbers'" class="wide">數字<input v-model="numbersInput" type="text" inputmode="numeric" placeholder="例如 7 3，或 73" autocomplete="off" maxlength="40" required><small>兩數依序為上卦、下卦，兩數相加為動爻；一數則前半段為上卦、後半段為下卦。</small></label>
      <label v-if="method === 'text'" class="wide">文字<input v-model="textInput" type="text" placeholder="例如 财、合作" autocomplete="off" maxlength="8" required><small>只收錄常用字的筆畫，例如 财、事、合、情、天、地。未收錄的字請改用數字起卦。</small></label>
      <p v-if="method === 'time'" class="form-help">按下起卦時，會以本機目前的日期與時辰換算農曆。</p>

      <label>問題方向<select v-model="topic"><option v-for="item in TOPICS" :key="item.value" :value="item.value">{{ item.label }}</option></select><small>選擇後，會補上體用卦在該方向的類象。</small></label>
      <label>想問的事（選填）<input v-model="question" type="text" maxlength="80" placeholder="例如：這次合作的時機" autocomplete="off"><small>只用於顯示在結果標題，不會儲存或上傳。</small></label>

      <button class="primary-button" type="submit">起卦</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="reading && copy" class="results" aria-live="polite">
      <header class="result-head">
        <p class="meta">起卦方式：{{ METHOD_LABELS[reading.method] }}｜{{ reading.lunar ? `農曆 ${reading.lunar}` : castAt }}</p>
        <p v-if="castQuestion" class="question">問題：{{ castQuestion }}</p>
      </header>

      <div class="table-wrap">
        <table class="hexagram-table">
          <caption>卦象</caption>
          <thead><tr><th scope="col"></th><th scope="col">本卦</th><th scope="col">互卦</th><th scope="col">變卦</th></tr></thead>
          <tbody>
            <tr><th scope="row">卦名</th><td>{{ reading.primary.name }}</td><td>{{ reading.nuclear.hexagram.name }}</td><td>{{ reading.changed.hexagram.name }}</td></tr>
            <tr><th scope="row">上卦</th><td>{{ trigramLabel(reading.primary.upper) }}</td><td>{{ trigramLabel(reading.nuclear.hexagram.upper) }}</td><td>{{ trigramLabel(reading.changed.hexagram.upper) }}</td></tr>
            <tr><th scope="row">下卦</th><td>{{ trigramLabel(reading.primary.lower) }}</td><td>{{ trigramLabel(reading.nuclear.hexagram.lower) }}</td><td>{{ trigramLabel(reading.changed.hexagram.lower) }}</td></tr>
          </tbody>
        </table>
      </div>
      <p class="summary-line">體卦 <strong>{{ reading.ti.name }}</strong>（{{ reading.ti.element }}）｜用卦 <strong>{{ reading.yong.name }}</strong>（{{ reading.yong.element }}）｜動爻：第 {{ reading.moving }} 爻（由下往上數）</p>

      <details class="steps">
        <summary>起卦計算過程</summary>
        <ol><li v-for="step in reading.steps" :key="step">{{ step }}</li></ol>
        <p>本卦由上下卦組成；互卦取二、三、四爻為下卦，三、四、五爻為上卦；變卦將動爻陰陽互換。體卦為不含動爻的那一卦，用卦為含動爻的那一卦。</p>
      </details>

      <article class="reading-card">
        <h2>體用關係（吉凶大方向）</h2>
        <p>{{ copy.tiYong }}</p>
      </article>
      <article class="reading-card">
        <h2>事情發展（互卦）</h2>
        <p>{{ copy.nuclear }}</p>
      </article>
      <article class="reading-card">
        <h2>最終走向（變卦）</h2>
        <p>{{ copy.changed }}</p>
      </article>
      <article class="reading-card">
        <h2>旺衰分析</h2>
        <p>{{ copy.strength }}</p>
      </article>
      <article v-if="copy.topic" class="reading-card">
        <h2>{{ copy.topic.label }}</h2>
        <p>{{ copy.topic.body }}</p>
        <p>{{ copy.topic.yong }}</p>
      </article>
      <article class="reading-card reading-card-wide">
        <h2>綜合判斷</h2>
        <p>{{ copy.overall }}</p>
        <h3>行動建議</h3>
        <ul class="suggestions"><li v-for="item in copy.suggestions" :key="item">{{ item }}</li></ul>
        <p class="timing">{{ copy.timing }}</p>
      </article>
    </section>

    <aside class="privacy-note">起卦只在本機進行，不會儲存或上傳。梅花易數提供的是當下時機的參考，內容供娛樂與自我反思，不保證事件，也不取代專業建議；最終決策權在你。</aside>
  </div>
</template>

<style scoped>
.meihua-app { display: grid; gap: 24px; width: min(100% - 32px, 960px); margin: 0 auto 72px; color: #e4dfd3; }
.page-head { padding: 44px 10px 8px; text-align: center; }
.page-head h1 { margin: 0; color: #f1e5ca; font-size: clamp(2rem, 6vw, 3.3rem); font-weight: 500; }
.page-head > p { color: #bdb9ae; line-height: 1.8; }
.cast-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; padding: 22px; border: 1px solid #a48e524b; border-radius: var(--ll-radius-panel, 14px); background: #0b1117; }
.cast-form label { display: grid; gap: 6px; color: #d4c69f; font-size: 0.9rem; }
.cast-form small, .form-help { color: #aaa99f; font-size: 0.8125rem; line-height: 1.6; margin: 0; }
.cast-form input[type='text'], .cast-form select { width: 100%; min-height: 46px; padding: 9px 12px; border: 1px solid #52606a; border-radius: 10px; background: #080e16; color: #f1e5ca; font: inherit; }
.cast-form input:focus-visible, .cast-form select:focus-visible { outline: 3px solid #d7bd79; outline-offset: 2px; }
.cast-form .wide { grid-column: 1 / -1; }
.method-toggle { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin: 0; padding: 0; border: 0; }
.method-toggle legend { margin-bottom: 8px; color: #d4c69f; font-size: 0.9rem; }
.method-toggle label { display: grid; grid-template-columns: auto 1fr; gap: 3px 9px; align-items: center; padding: 13px; border: 1px solid #52606a; border-radius: 10px; background: #0b1117; }
.method-toggle input { grid-row: span 2; width: 18px; height: 18px; accent-color: #c7a859; }
.primary-button { grid-column: 1 / -1; justify-self: start; min-height: 46px; padding: 0 22px; border: 1px solid #c7a859; border-radius: 999px; background: transparent; color: #f1e5ca; font: inherit; cursor: pointer; }
.primary-button:hover { background: #c7a85922; }
.primary-button:focus-visible { outline: 2px solid #c7a859; outline-offset: 3px; }
.error { grid-column: 1 / -1; margin: 0; color: #e8a59a; }
.results { display: grid; gap: 14px; }
.result-head { display: grid; gap: 4px; }
.meta, .question { margin: 0; color: #aaa99f; font-size: 0.875rem; }
.question { color: #d4c69f; }
.table-wrap { overflow-x: auto; }
.hexagram-table { width: 100%; border-collapse: collapse; color: #e4dfd3; }
.hexagram-table caption { text-align: left; color: #cfb878; font-size: 0.8125rem; padding-bottom: 6px; }
.hexagram-table th, .hexagram-table td { padding: 10px 12px; border: 1px solid #64707a55; text-align: center; font-weight: 400; }
.hexagram-table tbody th { color: #aaa99f; font-size: 0.8125rem; width: 4.5rem; }
.hexagram-table td { color: #f1e5ca; }
.summary-line { margin: 0; color: #d4c69f; line-height: 1.7; }
.summary-line strong { color: #f1e5ca; }
.steps summary { color: #cfb878; cursor: pointer; }
.steps ol { margin: 8px 0 0; padding-left: 20px; color: #c5c0b6; line-height: 1.8; font-size: 0.875rem; }
.steps p { color: #aaa99f; font-size: 0.8125rem; line-height: 1.7; }
.reading-card { display: grid; gap: 8px; padding: 18px 20px; border: 1px solid #64707a55; border-radius: var(--ll-radius-panel, 14px); background: #121a21; }
.reading-card h2 { margin: 0; color: #e8d8b3; font-size: 1.05rem; font-weight: 500; }
.reading-card h3 { margin: 8px 0 0; color: #d8c78e; font-size: 0.95rem; font-weight: 500; }
.reading-card p { margin: 0; color: #c5c0b6; line-height: 1.8; }
.reading-card-wide { grid-column: 1 / -1; }
.suggestions { margin: 0; padding-left: 20px; color: #c5c0b6; line-height: 1.8; }
.timing { color: #bdb9ae; font-size: 0.9rem; }
.privacy-note { color: #aaa99f; font-size: 0.875rem; line-height: 1.7; }
@media (max-width: 680px) {
  .cast-form { grid-template-columns: 1fr; }
  .method-toggle { grid-template-columns: 1fr; }
  .hexagram-table th, .hexagram-table td { padding: 8px 6px; font-size: 0.875rem; }
}
</style>
