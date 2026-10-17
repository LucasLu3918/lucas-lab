<script setup lang="ts">
import { computed, ref } from 'vue';
import { chartAt, PALACE_NAMES, TOPIC_LABELS, type QimenPalace, type Topic } from './qimen';
import { interpret } from './interpretation';

const TOPICS: Array<{ value: Topic; label: string }> = (Object.keys(TOPIC_LABELS) as Topic[]).map(value => ({ value, label: TOPIC_LABELS[value] }));
// 洛書方位：上排巽四、離九、坤二；中排震三、中五、兌七；下排艮八、坎一、乾六。
const GRID_ROWS = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const VERDICT_CLASS = { 吉: 'verdict-good', 中: 'verdict-mid', 凶: 'verdict-caution' } as const;

const pad = (value: number): string => String(value).padStart(2, '0');
function localDateValue(now: Date): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
function localTimeValue(now: Date): string {
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

const dateInput = ref(localDateValue(new Date()));
const timeInput = ref(localTimeValue(new Date()));
const topic = ref<Topic>('general');
// 只有排盤成功後才記錄時間；切換問題方向只改變斷語與評分，不重新排盤。
const submitted = ref<{ date: string; time: string; castAt: string } | null>(null);
const error = ref('');

const chart = computed(() => (submitted.value ? chartAt(submitted.value.date, submitted.value.time, topic.value) : null));
const copy = computed(() => (chart.value ? interpret(chart.value) : null));

function palaceAt(palace: number): QimenPalace | undefined {
  return chart.value?.palaces.find(p => p.palace === palace);
}

function cast(): void {
  error.value = '';
  try {
    chartAt(dateInput.value, timeInput.value, topic.value);
    submitted.value = {
      date: dateInput.value,
      time: timeInput.value,
      castAt: new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()),
    };
  } catch (cause) {
    submitted.value = null;
    error.value = cause instanceof Error ? cause.message : '無法排盤，請檢查日期與時間後再試一次。';
  }
}
</script>

<template>
  <div class="qimen-app">
    <header class="page-head">
      <h1>奇門遁甲</h1>
      <p>以時家拆補法排出九宮盤，依節氣、旬首與時辰排定天盤九星、人盤八門、地盤三奇六儀與神盤八神，整理當下的時空格局。排盤在本機完成，不需要出生資料。</p>
    </header>

    <form class="cast-form" @submit.prevent="cast">
      <label>日期<input v-model="dateInput" type="date" required></label>
      <label>時間<input v-model="timeInput" type="time" required><small>以台北時間換算節氣與時辰，預設為目前時間。</small></label>
      <label>問題方向<select v-model="topic"><option v-for="item in TOPICS" :key="item.value" :value="item.value">{{ item.label }}</option></select><small>選擇後只更新評分與斷語，不會重新排盤。</small></label>
      <button class="primary-button" type="submit">排盤</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="chart && copy && submitted" class="results" aria-live="polite">
      <header class="result-head">
        <p class="meta">排盤時間：{{ chart.civil }}｜{{ chart.polarity }}遁 {{ chart.ju }} 局｜{{ chart.yuan }}元｜{{ chart.term }}</p>
        <p class="meta">起盤於 {{ submitted.castAt }}｜節氣交於 {{ chart.termInstant }}｜時辰 {{ chart.hourGanzhi }}（{{ chart.xunHead }}）</p>
        <p class="summary-line">值符 <strong>{{ chart.valueStar }}</strong> 臨 {{ PALACE_NAMES[chart.hourPalace].name }}，值使 <strong>{{ chart.valueDoor }}門</strong> 臨 {{ PALACE_NAMES[chart.shiPalace].name }}</p>
      </header>

      <div class="qimen-grid" aria-label="九宮排盤">
        <template v-for="row in GRID_ROWS" :key="row.join('-')">
          <div v-for="palace in row" :key="palace" class="palace-cell" :class="palace === 5 ? 'palace-center' : ''">
            <template v-if="palace === 5">
              <h3>{{ PALACE_NAMES[5].name }}</h3>
              <p class="palace-dir">{{ PALACE_NAMES[5].direction }}</p>
              <dl>
                <div><dt>天盤</dt><dd>{{ chart.center.note }}</dd></div>
                <div><dt>地盤</dt><dd>{{ chart.center.yi }}</dd></div>
              </dl>
            </template>
            <template v-else-if="palaceAt(palace)">
              <h3>{{ palaceAt(palace)!.name }} <span class="verdict" :class="VERDICT_CLASS[palaceAt(palace)!.verdict]">{{ palaceAt(palace)!.verdict }}</span></h3>
              <p class="palace-dir">{{ palaceAt(palace)!.direction }}</p>
              <dl>
                <div><dt>天盤</dt><dd>{{ palaceAt(palace)!.star }}</dd></div>
                <div><dt>人盤</dt><dd>{{ palaceAt(palace)!.door }}門</dd></div>
                <div><dt>地盤</dt><dd>{{ palaceAt(palace)!.yi }}</dd></div>
                <div><dt>神盤</dt><dd>{{ palaceAt(palace)!.god }}</dd></div>
              </dl>
            </template>
          </div>
        </template>
      </div>

      <section class="block" aria-labelledby="qimen-steps">
        <h2 id="qimen-steps">推導過程</h2>
        <ol class="steps">
          <li v-for="step in chart.steps" :key="step">{{ step }}</li>
        </ol>
      </section>

      <section class="block" aria-labelledby="qimen-patterns">
        <h2 id="qimen-patterns">格局</h2>
        <ul>
          <li v-for="line in copy.patternLines" :key="line">{{ line }}</li>
        </ul>
      </section>

      <section class="block" aria-labelledby="qimen-directions">
        <h2 id="qimen-directions">方位吉凶</h2>
        <div class="table-wrap">
          <table class="direction-table">
            <thead><tr><th scope="col">方位</th><th scope="col">宮位</th><th scope="col">奇儀組合</th><th scope="col">八神</th><th scope="col">判斷</th></tr></thead>
            <tbody>
              <tr v-for="palace in chart.palaces" :key="palace.palace">
                <td>{{ palace.direction }}</td>
                <td>{{ palace.name }}</td>
                <td>{{ palace.yi }}＋{{ palace.star }}＋{{ palace.door }}門</td>
                <td>{{ palace.god }}</td>
                <td><span class="verdict" :class="VERDICT_CLASS[palace.verdict]">{{ palace.verdict }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="block" aria-labelledby="qimen-reading">
        <h2 id="qimen-reading">綜合判斷</h2>
        <p>{{ copy.headline }}</p>
        <p>{{ copy.valueLine }}</p>
        <p><strong>最宜方位：</strong>{{ copy.bestLine }}</p>
        <p><strong>宜避方位：</strong>{{ copy.worstLine }}</p>
        <p><strong>時機判斷：</strong>{{ copy.timingLine }}</p>
        <p><strong>問事要點：</strong>{{ copy.fitLine }}</p>
        <p class="caution">{{ copy.caution }}</p>
      </section>
    </section>
  </div>
</template>

<style scoped>
.qimen-app { display: grid; gap: 24px; width: min(100% - 32px, 960px); margin: 0 auto 72px; color: #e4dfd3; }
.page-head { padding: 44px 10px 8px; text-align: center; }
.page-head h1 { margin: 0; color: #f1e5ca; font-size: clamp(2rem, 6vw, 3.3rem); font-weight: 500; }
.page-head > p { color: #bdb9ae; line-height: 1.8; }
.cast-form { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 15px; align-items: end; padding: 22px; border: 1px solid #a48e524b; border-radius: var(--ll-radius-panel, 14px); background: #0b1117; }
.cast-form label { display: grid; gap: 6px; color: #d4c69f; font-size: 0.9rem; }
.cast-form small { color: #aaa99f; font-size: 0.8125rem; line-height: 1.6; }
.cast-form input, .cast-form select { width: 100%; min-height: 46px; padding: 9px 12px; border: 1px solid #52606a; border-radius: 10px; background: #080e16; color: #f1e5ca; font: inherit; }
.cast-form input:focus-visible, .cast-form select:focus-visible { outline: 3px solid #d7bd79; outline-offset: 2px; }
.primary-button { min-height: 46px; padding: 0 18px; border: 1px solid #d7bd79; border-radius: 10px; background: #d7bd79; color: #111; font: inherit; font-weight: 600; cursor: pointer; }
.error { grid-column: 1 / -1; margin: 0; color: #f0a596; }
.results { display: grid; gap: 22px; }
.result-head { display: grid; gap: 6px; }
.meta { margin: 0; color: #aaa99f; font-size: 0.875rem; line-height: 1.6; }
.summary-line { margin: 6px 0 0; color: #f1e5ca; font-size: 1.05rem; }
.summary-line strong { color: #d7bd79; font-weight: 600; }
.qimen-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.palace-cell { min-height: 170px; padding: 12px; border: 1px solid #a48e5240; border-radius: 12px; background: #0b1117; }
.palace-center { background: #151b22; }
.palace-cell h3 { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin: 0; color: #f1e5ca; font-size: 1rem; font-weight: 600; }
.palace-dir { margin: 2px 0 8px; color: #aaa99f; font-size: 0.8125rem; }
.palace-cell dl { display: grid; gap: 6px; margin: 0; }
.palace-cell dl > div { display: grid; grid-template-columns: 3.2em 1fr; gap: 6px; font-size: 0.9rem; }
.palace-cell dt { color: #aaa99f; }
.palace-cell dd { margin: 0; color: #e4dfd3; }
.verdict { display: inline-block; min-width: 2em; padding: 1px 6px; border-radius: 999px; font-size: 0.8125rem; text-align: center; }
.verdict-good { background: #2f4a33; color: #bfe6c3; }
.verdict-mid { background: #3a3a2d; color: #e7dfb3; }
.verdict-caution { background: #4a2d2d; color: #f0c0b8; }
.block { display: grid; gap: 10px; padding: 20px; border: 1px solid #a48e524b; border-radius: var(--ll-radius-panel, 14px); background: #0b1117; }
.block h2 { margin: 0; color: #f1e5ca; font-size: 1.2rem; font-weight: 500; }
.block p, .block li { color: #d6d1c4; line-height: 1.8; margin: 0; }
.steps, .block ul { margin: 0; padding-left: 1.3em; }
.caution { color: #aaa99f; font-size: 0.875rem; }
.table-wrap { overflow-x: auto; }
.direction-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.direction-table th, .direction-table td { padding: 8px 10px; border-bottom: 1px solid #a48e5230; text-align: left; }
.direction-table th { color: #d4c69f; font-weight: 500; }
@media (max-width: 680px) {
  .cast-form { grid-template-columns: 1fr; }
  .qimen-grid { gap: 8px; }
  .palace-cell { min-height: 0; padding: 10px; }
}
</style>
