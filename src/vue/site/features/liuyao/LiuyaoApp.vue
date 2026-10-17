<script setup lang="ts">
import { computed, ref } from 'vue';
import { analyzeYong, castByCoins, castByNumbers, TOPIC_YONG, type CastMethod, type LiuyaoLine, type LiuyaoReading, type Topic, type Trigram } from './liuyao';
import { interpret } from './interpretation';

const METHOD_LABELS: Record<CastMethod, string> = { coins: '銅錢起卦', numbers: '報數起卦' };
const METHOD_CHOICES: Array<{ value: CastMethod; hint: string }> = [
  { value: 'coins', hint: '模擬三枚銅錢擲六次，推薦' },
  { value: 'numbers', hint: '一至兩個數字' },
];
const TOPIC_OPTIONS = (Object.keys(TOPIC_YONG) as Topic[]).map(value => ({ value, label: TOPIC_YONG[value].label }));

const method = ref<CastMethod>('coins');
const numbersInput = ref('');
const topic = ref<Topic>('general');
const question = ref('');
const reading = ref<LiuyaoReading | null>(null);
const castQuestion = ref('');
const castAt = ref('');
const error = ref('');

// 斷卦文案隨問題方向即時切換，不需要重新起卦。
const analysis = computed(() => (reading.value ? analyzeYong(reading.value, topic.value) : null));
const copy = computed(() => (reading.value && analysis.value ? interpret(reading.value, analysis.value) : null));

function trigramLabel(trigram: Trigram): string {
  return `${trigram.symbol} ${trigram.name}`;
}

function branchLabel(line: LiuyaoLine): string {
  return `${line.stem}${line.branch}${line.element}`;
}

function parseNumbers(text: string): number[] {
  const tokens = text.trim().split(/[\s,，、]+/).filter(Boolean);
  if (tokens.length < 1 || tokens.length > 2) throw new RangeError('報數起卦請輸入一至兩個數字，以空白或逗號分隔。');
  if (tokens.some(token => !/^\d+$/.test(token))) throw new RangeError('數字請以空白或逗號分隔，且只能包含 0 至 9。');
  return tokens.map(Number);
}

// 三枚銅錢每次擲出的正面枚數，共六次；以密碼學亂數取值，避免可預測。
function throwCoins(): number[] {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const heads: number[] = [];
  for (let throwIndex = 0; throwIndex < 6; throwIndex++) {
    let count = 0;
    for (let coin = 0; coin < 3; coin++) count += bytes[throwIndex * 3 + coin] & 1;
    heads.push(count);
  }
  return heads;
}

function cast(): void {
  error.value = '';
  const now = new Date();
  try {
    const next = method.value === 'coins'
      ? castByCoins(throwCoins(), now)
      : castByNumbers(parseNumbers(numbersInput.value), now);
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
  <div class="liuyao-app">
    <header class="page-head">
      <h1>六爻易經</h1>
      <p>以京房納甲體系起卦，依世應、用神旺衰、原忌神與動爻整理當下的傳統易學視角。起卦與計算都在你的瀏覽器完成，不需要出生資料。</p>
    </header>

    <form class="cast-form" @submit.prevent="cast">
      <fieldset class="method-toggle">
        <legend>起卦方式</legend>
        <label v-for="choice in METHOD_CHOICES" :key="choice.value">
          <input v-model="method" type="radio" :value="choice.value" name="liuyao-method">
          {{ METHOD_LABELS[choice.value] }}
          <small>{{ choice.hint }}</small>
        </label>
      </fieldset>

      <label v-if="method === 'numbers'" class="wide">數字<input v-model="numbersInput" type="text" inputmode="numeric" placeholder="例如 7 3（上卦 7、下卦 3）" autocomplete="off" maxlength="20" required><small>一個數字時上下卦同取，兩個數字依序為上卦、下卦，兩數相加為動爻；餘數為 0 時取 8 或 6。</small></label>
      <p v-if="method === 'coins'" class="form-help">按下起卦後，會模擬三枚銅錢擲六次，由初爻擲到上爻。</p>

      <label>問題方向<select v-model="topic"><option v-for="item in TOPIC_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option></select><small>決定以哪一個六親為用神；選擇後會即時更新斷卦內容。</small></label>
      <label>想問的事（選填）<input v-model="question" type="text" maxlength="80" placeholder="例如：這次跳槽的時機" autocomplete="off"><small>只用於顯示在結果標題，不會儲存或上傳。</small></label>

      <button class="primary-button" type="submit">起卦</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="reading && copy && analysis" class="results" aria-live="polite">
      <header class="result-head">
        <p class="meta">起卦方式：{{ METHOD_LABELS[reading.method] }}｜{{ castAt }}｜月建 {{ reading.monthLabel }}・日辰 {{ reading.dayLabel }}</p>
        <p v-if="castQuestion" class="question">問題：{{ castQuestion }}</p>
      </header>

      <div class="table-wrap">
        <table class="hexagram-table">
          <caption>卦象與裝卦</caption>
          <thead><tr><th scope="col">爻位</th><th scope="col">六神</th><th scope="col">六親</th><th scope="col">本卦</th><th scope="col">世應</th><th scope="col">動變</th><th scope="col">變卦納支</th></tr></thead>
          <tbody>
            <tr v-for="line in [...reading.lines].reverse()" :key="line.position" :class="{ moving: line.moving, yong: analysis.yong.line === line }">
              <th scope="row">{{ line.label }}</th>
              <td>{{ line.god }}</td>
              <td>{{ line.kin }}</td>
              <td><span class="bar">{{ line.yang ? '—' : '- -' }}</span> {{ branchLabel(line) }}</td>
              <td>{{ line.shi ? '世' : line.ying ? '應' : '' }}</td>
              <td>{{ line.moving ? (line.yang ? '老陽 ○' : '老陰 ×') : '' }}</td>
              <td>{{ line.moving && line.changedBranch ? `${line.changedBranch}${line.changedElement}` : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="summary-line">本卦 <strong>{{ reading.primary.name }}</strong>（{{ trigramLabel(reading.primary.upper) }} 上 {{ trigramLabel(reading.primary.lower) }} 下，{{ reading.primary.palace.name }}宮）<template v-if="reading.changed"> → 變卦 <strong>{{ reading.changed.name }}</strong></template>｜用神：{{ analysis.target }}（{{ analysis.yong.line ? `第 ${analysis.yong.line.position} 爻` : '伏藏' }}）</p>

      <details class="steps">
        <summary>起卦與裝卦過程</summary>
        <ol><li v-for="step in reading.steps" :key="step">{{ step }}</li></ol>
        <p>納甲以所屬宮的五行為「我」，六親依此推出；六神依日干自初爻起排。旺相休囚死依月建地支的五行判斷。</p>
      </details>

      <article class="reading-card">
        <h2>卦象結構</h2>
        <p>{{ copy.structure }}</p>
      </article>
      <article class="reading-card">
        <h2>用神旺衰</h2>
        <p>{{ copy.yong }}</p>
        <p class="muted">{{ copy.topicNote }}</p>
      </article>
      <article class="reading-card">
        <h2>動爻分析</h2>
        <p>{{ copy.moving }}</p>
      </article>
      <article v-if="reading.changed" class="reading-card">
        <h2>變卦走向</h2>
        <p>{{ copy.changed }}</p>
      </article>
      <article class="reading-card reading-card-wide">
        <h2>綜合斷卦</h2>
        <p>{{ copy.overall }}</p>
        <h3>行動建議</h3>
        <ul class="suggestions"><li v-for="item in copy.suggestions" :key="item">{{ item }}</li></ul>
        <p class="timing">{{ copy.timing }}</p>
      </article>
    </section>

    <aside class="privacy-note">起卦只在本機進行，不會儲存或上傳。六爻易經基於京房納甲傳統玄學體系，內容供娛樂與自我反思，不保證事件，也不取代醫療、法律或財務等專業建議；最終決策權在你。</aside>
  </div>
</template>

<style scoped>
.liuyao-app { display: grid; gap: 24px; width: min(100% - 32px, 960px); margin: 0 auto 72px; color: #e4dfd3; }
.page-head { padding: 44px 10px 8px; text-align: center; }
.page-head h1 { margin: 0; color: #f1e5ca; font-size: clamp(2rem, 6vw, 3.3rem); font-weight: 500; }
.page-head > p { color: #bdb9ae; line-height: 1.8; }
.cast-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; padding: 22px; border: 1px solid #a48e524b; border-radius: var(--ll-radius-panel, 14px); background: #0b1117; }
.cast-form label { display: grid; gap: 6px; color: #d4c69f; font-size: 0.9rem; }
.cast-form small, .form-help { color: #aaa99f; font-size: 0.8125rem; line-height: 1.6; margin: 0; }
.cast-form input[type='text'], .cast-form select { width: 100%; min-height: 46px; padding: 9px 12px; border: 1px solid #52606a; border-radius: 10px; background: #080e16; color: #f1e5ca; font: inherit; }
.cast-form input:focus-visible, .cast-form select:focus-visible { outline: 3px solid #d7bd79; outline-offset: 2px; }
.cast-form .wide { grid-column: 1 / -1; }
.method-toggle { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 0; padding: 0; border: 0; }
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
.hexagram-table { width: 100%; border-collapse: collapse; color: #e4dfd3; font-size: 0.9rem; }
.hexagram-table caption { text-align: left; color: #cfb878; font-size: 0.8125rem; padding-bottom: 6px; }
.hexagram-table th, .hexagram-table td { padding: 9px 10px; border: 1px solid #64707a55; text-align: center; font-weight: 400; white-space: nowrap; }
.hexagram-table tbody th { color: #aaa99f; font-size: 0.8125rem; }
.hexagram-table td { color: #f1e5ca; }
.hexagram-table tr.moving td { color: #e8a59a; }
.hexagram-table tr.yong th { color: #d8c78e; }
.bar { font-family: ui-monospace, monospace; color: #d8c78e; }
.summary-line { margin: 0; color: #d4c69f; line-height: 1.7; }
.summary-line strong { color: #f1e5ca; }
.steps summary { color: #cfb878; cursor: pointer; }
.steps ol { margin: 8px 0 0; padding-left: 20px; color: #c5c0b6; line-height: 1.8; font-size: 0.875rem; }
.steps p { color: #aaa99f; font-size: 0.8125rem; line-height: 1.7; }
.reading-card { display: grid; gap: 8px; padding: 18px 20px; border: 1px solid #64707a55; border-radius: var(--ll-radius-panel, 14px); background: #121a21; }
.reading-card h2 { margin: 0; color: #e8d8b3; font-size: 1.05rem; font-weight: 500; }
.reading-card h3 { margin: 8px 0 0; color: #d8c78e; font-size: 0.95rem; font-weight: 500; }
.reading-card p { margin: 0; color: #c5c0b6; line-height: 1.8; }
.reading-card .muted { color: #aaa99f; font-size: 0.875rem; }
.reading-card-wide { grid-column: 1 / -1; }
.suggestions { margin: 0; padding-left: 20px; color: #c5c0b6; line-height: 1.8; }
.timing { color: #bdb9ae; font-size: 0.9rem; }
.privacy-note { color: #aaa99f; font-size: 0.875rem; line-height: 1.7; }
@media (max-width: 680px) {
  .cast-form { grid-template-columns: 1fr; }
  .method-toggle { grid-template-columns: 1fr; }
  .hexagram-table th, .hexagram-table td { padding: 7px 5px; font-size: 0.8125rem; }
}
</style>
