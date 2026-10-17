<script setup lang="ts">
import { computed, ref } from 'vue';
import { mutagenMeaning, palaceMeaning, starMeaning } from './meanings';
import { BRANCHES, calculateZiwei, type Gender, type PlacedStar, type ZiweiChart, type ZiweiPalace } from './ziwei';
import type { MethodResult } from '../fortune-core/result';

const pad = (value: number) => String(value).padStart(2, '0');
// Two-hour branches: 子時 starts at 23:00. Each branch index matches ziwei.ts (0 = 子 … 11 = 亥).
const HOURS = BRANCHES.map((name, index) => {
  const start = (index * 2 - 1 + 24) % 24;
  return { index, label: `${name}時`, range: `${pad(start)}:00–${pad((start + 1) % 24)}:59` };
});
// Grid positions follow the traditional 4×4 chart: 巳午未申 on top, 寅丑子亥 at the bottom, the center holds the summary.
const GRID_POSITION: Record<number, string> = {
  5: '1 / 1', 6: '1 / 2', 7: '1 / 3', 8: '1 / 4',
  9: '2 / 4', 10: '3 / 4', 11: '4 / 4',
  0: '4 / 3', 1: '4 / 2', 2: '4 / 1',
  3: '3 / 1', 4: '2 / 1',
};
const PALACE_CELLS = Object.keys(GRID_POSITION).map(Number);

const birthDate = ref('');
const birthBranch = ref<number | ''>('');
const gender = ref<Gender>('male');
const result = ref<MethodResult<ZiweiChart> | null>(null);
const selectedBranch = ref<number>(0);
const error = ref('');

const chart = computed(() => result.value?.data ?? null);
const palaceByBranch = computed(() => {
  const map = new Map<number, ZiweiPalace>();
  for (const palace of chart.value?.palaces ?? []) map.set(palace.branch, palace);
  return map;
});
const selectedPalace = computed(() => palaceByBranch.value.get(selectedBranch.value) ?? null);

function starLabel(star: PlacedStar): string {
  return star.mutagen ? `${star.name}化${star.mutagen}` : star.name;
}

function calculate(): void {
  error.value = '';
  if (birthBranch.value === '') {
    result.value = null;
    error.value = '請選擇出生時辰。';
    return;
  }
  try {
    result.value = calculateZiwei({ birthDate: birthDate.value, birthBranch: birthBranch.value, gender: gender.value });
    selectedBranch.value = result.value.data.palaces[0].branch;
  } catch (cause) {
    result.value = null;
    error.value = cause instanceof Error ? cause.message : '無法排盤，請檢查日期與時辰。';
  }
}

function selectPalace(branch: number): void {
  selectedBranch.value = branch;
}
</script>

<template>
  <div class="ziwei-app">
    <header class="page-head">
      <h1>紫微斗數</h1>
      <p>依農曆換算的出生資料排出十二宮、十四主星、四化與大限。每一步推導都會列出，方便你自行核對。</p>
    </header>

    <form class="birth-form" @submit.prevent="calculate">
      <label>出生日期（陽曆）<input v-model="birthDate" type="date" required autocomplete="bday"><small>會自動換算為農曆後排盤。</small></label>
      <label>出生時辰
        <select v-model="birthBranch" required>
          <option value="" disabled>請選擇時辰</option>
          <option v-for="hour in HOURS" :key="hour.index" :value="hour.index">{{ hour.label }}（{{ hour.range }}）</option>
        </select>
        <small>紫微斗數的命宮與身宮需要時辰，請選擇最接近的時辰。</small>
      </label>
      <fieldset class="gender-row">
        <legend>性別</legend>
        <label><input v-model="gender" type="radio" value="male"> 男</label>
        <label><input v-model="gender" type="radio" value="female"> 女</label>
        <small>性別決定大限的順逆方向。</small>
      </fieldset>
      <button class="primary-button" type="submit">排出命盤</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="chart" class="chart-wrap" aria-live="polite">
      <div class="chart-grid">
        <button
          v-for="branch in PALACE_CELLS"
          :key="branch"
          type="button"
          class="palace-cell"
          :class="{ selected: branch === selectedBranch, body: palaceByBranch.get(branch)?.isBody }"
          :style="{ gridArea: GRID_POSITION[branch] }"
          :aria-pressed="branch === selectedBranch"
          @click="selectPalace(branch)"
        >
          <span class="palace-name">{{ palaceByBranch.get(branch)?.name }}</span>
          <span class="palace-meta">{{ BRANCHES[branch] }}{{ palaceByBranch.get(branch)?.stem }} · {{ palaceByBranch.get(branch)?.decadal.startAge }}–{{ palaceByBranch.get(branch)?.decadal.endAge }}歲</span>
          <span class="palace-stars">
            <span v-for="star in palaceByBranch.get(branch)?.majorStars ?? []" :key="star.name" class="major">{{ starLabel(star) }}</span>
          </span>
          <span class="palace-minor">{{ (palaceByBranch.get(branch)?.minorStars ?? []).map(starLabel).join('、') }}</span>
          <span v-if="palaceByBranch.get(branch)?.isBody" class="body-tag">身宮</span>
        </button>

        <div class="chart-center">
          <p class="chart-title">紫微斗數命盤</p>
          <p>農曆 {{ chart.lunar.ganzhiYear }}年 {{ chart.lunar.isLeapMonth ? '閏' : '' }}{{ chart.lunar.month }}月 {{ chart.lunar.day }}日 · {{ chart.hourBranch }}時 · {{ chart.gender === 'male' ? '男' : '女' }}</p>
          <p>{{ chart.fiveElementsClass }} · 命宮在{{ chart.soulBranch }} · 身宮在{{ chart.bodyBranch }}</p>
          <p>大限{{ chart.decadalForward ? '順行' : '逆行' }}，從 {{ chart.bureau }} 歲起運。</p>
        </div>
      </div>

      <article v-if="selectedPalace" class="palace-detail">
        <p class="card-title">{{ selectedPalace.name }}（{{ selectedPalace.branchName }}宮）</p>
        <h2>{{ palaceMeaning(selectedPalace.name).keyword }}</h2>
        <p>{{ palaceMeaning(selectedPalace.name).summary }}</p>
        <p class="guidance">{{ palaceMeaning(selectedPalace.name).guidance }}</p>
        <ul class="star-list">
          <li v-for="star in selectedPalace.majorStars" :key="star.name">
            <strong>{{ starLabel(star) }}</strong>：{{ starMeaning(star.name).keyword }}。{{ starMeaning(star.name).summary }}
            <span v-if="star.mutagen" class="mutagen-note">{{ mutagenMeaning(star.mutagen).summary }}</span>
          </li>
          <li v-if="selectedPalace.majorStars.length === 0" class="empty">本宮沒有主星，需參考對宮與三方四正的星曜。</li>
        </ul>
      </article>

      <details class="steps">
        <summary>排盤推導</summary>
        <ol>
          <li>農曆 {{ chart.lunar.month }} 月、{{ chart.hourBranch }}時，命宮在 {{ chart.soulBranch }}（寅宮起正月，順數至生月，再逆數時辰）。</li>
          <li>年干 {{ chart.yearStem }}，命宮干支定出五行局：{{ chart.fiveElementsClass }}。</li>
          <li>紫微落宮：以 {{ chart.bureau }} 局與農曆 {{ chart.lunar.day }} 日定位，其餘紫府星系依規則排列。</li>
          <li>四化依年干 {{ chart.yearStem }} 定位，標示於星曜之後。</li>
        </ol>
      </details>

      <details class="method">
        <summary>計算方法與版本</summary>
        <p>方法版本：{{ result?.methodVersion }}；內容版本：{{ result?.contentVersion }}。</p>
        <p>排盤規則以標準安星法為準，並與公開的 iztro 2.6.3 對照測試；未包含禄存、擎羊、陀羅等煞星與雜曜。</p>
      </details>
    </section>

    <aside class="privacy-note">{{ result?.disclaimer ?? '資料僅在本機運算，不會儲存或上傳。紫微斗數內容供娛樂與自我反思，不保證事件，也不取代專業建議。' }}</aside>
  </div>
</template>

<style scoped>
.ziwei-app { display: grid; gap: 24px; width: min(100% - 32px, 960px); margin: 0 auto 72px; color: #e4dfd3; }
.page-head { padding: 44px 10px 8px; text-align: center; }
.page-head h1 { margin: 0; color: #f1e5ca; font-size: clamp(2rem, 6vw, 3.3rem); font-weight: 500; }
.page-head > p { color: #bdb9ae; line-height: 1.8; }
.birth-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; padding: 22px; border: 1px solid #a48e524b; border-radius: var(--ll-radius-panel, 14px); background: #0b1117; }
.birth-form label, .gender-row { display: grid; gap: 6px; color: #d4c69f; font-size: 0.9rem; }
.birth-form small { color: #aaa99f; font-size: 0.8125rem; line-height: 1.6; }
.birth-form input[type='date'], .birth-form select { padding: 10px 12px; border: 1px solid #52606a; border-radius: 10px; background: #080e16; color: #f1e5ca; font: inherit; }
.gender-row { border: 0; margin: 0; padding: 0; }
.gender-row label { display: inline-flex; align-items: center; gap: 6px; }
.gender-row input { accent-color: #c7a859; }
.primary-button { grid-column: 1 / -1; justify-self: start; padding: 11px 22px; border: 1px solid #c7a859; border-radius: 999px; background: transparent; color: #f1e5ca; font: inherit; cursor: pointer; }
.primary-button:focus-visible, .palace-cell:focus-visible { outline: 2px solid #c7a859; outline-offset: 3px; }
.error { grid-column: 1 / -1; margin: 0; color: #e8a59a; }
.chart-wrap { display: grid; gap: 18px; }
.chart-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(120px, auto)); gap: 8px; }
.palace-cell { position: relative; display: grid; align-content: start; gap: 4px; padding: 10px; border: 1px solid #a48e524b; border-radius: 12px; background: #0b1117; color: #e4dfd3; font: inherit; text-align: left; cursor: pointer; }
.palace-cell.selected { border-color: #c7a859; background: #141c24; }
.palace-cell.body .body-tag { position: absolute; top: 8px; right: 8px; color: #cfb878; font-size: 0.75rem; }
.palace-name { color: #f1e5ca; font-size: 0.95rem; font-weight: 500; }
.palace-meta { color: #aaa99f; font-size: 0.75rem; }
.palace-stars { display: grid; gap: 2px; }
.major { color: #f1e5ca; font-size: 0.9rem; }
.palace-minor { color: #bdb9ae; font-size: 0.75rem; line-height: 1.5; }
.chart-center { grid-column: 2 / 4; grid-row: 2 / 4; display: grid; align-content: center; gap: 8px; padding: 18px; border: 1px dashed #a48e524b; border-radius: 14px; color: #d4c69f; line-height: 1.7; text-align: center; }
.chart-title { margin: 0; color: #f1e5ca; font-size: 1.25rem; }
.chart-center p { margin: 0; }
.palace-detail { display: grid; gap: 8px; padding: 20px; border: 1px solid #a48e524b; border-radius: 14px; background: #0b1117; }
.palace-detail p, .palace-detail h2 { margin: 0; line-height: 1.7; }
.palace-detail h2 { color: #f1e5ca; font-size: 1.125rem; font-weight: 500; }
.card-title { color: #cfb878; font-size: 0.8125rem; }
.guidance { color: #d4c69f; }
.star-list { margin: 8px 0 0; padding-left: 20px; line-height: 1.8; }
.mutagen-note { display: block; color: #bdb9ae; font-size: 0.875rem; }
.empty { color: #aaa99f; }
.steps summary, .method summary { color: #cfb878; cursor: pointer; }
.steps ol { margin: 8px 0 0; padding-left: 20px; color: #c5c0b6; line-height: 1.8; font-size: 0.875rem; }
.method { color: #c5c0b6; line-height: 1.7; }
.privacy-note { color: #aaa99f; font-size: 0.875rem; line-height: 1.7; }
@media (max-width: 680px) {
  .birth-form { grid-template-columns: 1fr; }
  .chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: none; }
  .palace-cell { grid-area: auto !important; }
  .chart-center { grid-column: 1 / -1; grid-row: auto; }
}
</style>
