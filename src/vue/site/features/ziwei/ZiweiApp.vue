<script setup lang="ts">
import { computed, ref } from 'vue';
import { mutagenMeaning, palaceMeaning, starMeaning } from './meanings';
import {
  BRANCHES, calculateZiwei, decadalPalaceAt, sanFangSiZheng, type Gender, type PlacedStar, type ZiweiChart, type ZiweiPalace,
} from './ziwei';
import type { MethodResult } from '../fortune-core/result';

const pad = (value: number) => String(value).padStart(2, '0');
// Two-hour branches. 早子 (00:00–00:59) is index 0; 晚子 (23:00–23:59) is index 12, which ziwei.ts reads as the late 子 hour.
const HOURS = [
  { index: 0, label: '早子時', range: '00:00–00:59' },
  ...BRANCHES.slice(1).map((name, offset) => {
    const index = offset + 1;
    const start = index * 2 - 1;
    return { index, label: `${name}時`, range: `${pad(start)}:00–${pad(start + 1)}:59` };
  }),
  { index: 12, label: '晚子時', range: '23:00–23:59' },
];
// Grid positions follow the traditional 4×4 chart: 巳午未申 on top, 寅丑子亥 at the bottom, the center holds the summary.
const GRID_POSITION: Record<number, string> = {
  5: '1 / 1', 6: '1 / 2', 7: '1 / 3', 8: '1 / 4',
  9: '2 / 4', 10: '3 / 4', 11: '4 / 4',
  0: '4 / 3', 1: '4 / 2', 2: '4 / 1',
  3: '3 / 1', 4: '2 / 1',
};
const PALACE_CELLS = Object.keys(GRID_POSITION).map(Number);
const YANG_STEMS = ['甲', '丙', '戊', '庚', '壬'];
const GENDER_LABEL: Record<Gender, string> = { male: '男', female: '女' };
// The year is read when the page loads; 大限 and 虛歲 follow it.
const currentYear = new Date().getFullYear();

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
const selectedTriad = computed(() => {
  if (!selectedPalace.value) return null;
  const { opposite, trines } = sanFangSiZheng(selectedPalace.value.branch);
  return {
    opposite: palaceByBranch.value.get(opposite) ?? null,
    trines: trines.map(branch => palaceByBranch.value.get(branch) ?? null),
  };
});
const currentDecadal = computed(() => (chart.value ? decadalPalaceAt(chart.value, currentYear) : null));
const currentAge = computed(() => (chart.value ? currentYear - chart.value.lunar.year + 1 : 0));
// 大限依起運年齡排列，即大限運行的先後順序（第一限必為命宮起算的那一宮）。
const decadalTimeline = computed(() => [...(chart.value?.palaces ?? [])].sort((a, b) => a.decadal.startAge - b.decadal.startAge));
const yinYangLabel = computed(() => (chart.value && YANG_STEMS.includes(chart.value.yearStem) ? '陽' : '陰'));

// 排盤推導：每一步都帶入實際算出的數字，讓使用者可以逐步核對。
const derivationSteps = computed(() => {
  const data = chart.value;
  if (!data) return [];
  const d = data.derivation;
  const hourStep = d.hourIndex === 0 ? '子時不需逆數' : `再逆數 ${d.hourIndex} 步（${d.hourBranch}時）`;
  const leapNote = d.leapAdjusted ? '（閏月十六日以後，算作下一個月）' : '';
  const mutagenText = d.mutagens.map(item => `${item.star}化${item.mutagen}入${item.palace}`).join('、');
  return [
    `寅宮起正月，順數至農曆${d.palaceMonth}月（${d.monthBranch}）${leapNote}，${hourStep}，命宮在${data.soulBranch}。`,
    `命宮干支為${d.mingStem}${data.soulBranch}（五虎遁定天干），納音為${d.nayin}，定出${data.fiveElementsClass}。`,
    `紫微落宮：以${data.fiveElementsClass}配農曆${d.ziweiDay}日${d.lateZi ? '（晚子時，取次日的農曆日）' : ''}，依口訣定在${d.ziweiBranch}；天府與紫微以寅申為軸對稱，在${d.tianfuBranch}。`,
    `祿存在${d.lucunBranch}（依年干${data.yearStem}），擎羊與陀羅分別在其後一宮與其前一宮。`,
    `年干${data.yearStem}的四化：${mutagenText}。`,
    `${data.yearStem}年${yinYangLabel.value}${GENDER_LABEL[data.gender]}，大限${data.decadalForward ? '順行' : '逆行'}，${data.bureau}歲起運。`,
  ];
});

function starLabel(star: PlacedStar): string {
  return star.mutagen ? `${star.name}化${star.mutagen}` : star.name;
}

function palaceLabel(palace: ZiweiPalace | null): string {
  return palace ? `${palace.name}（${palace.branchName}宮）` : '—';
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
        <small>性別與年干陰陽共同決定大限的順逆方向。</small>
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
          :class="{ selected: branch === selectedBranch, body: palaceByBranch.get(branch)?.isBody, current: branch === currentDecadal?.branch }"
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
          <span v-if="branch === currentDecadal?.branch" class="current-tag">本限</span>
        </button>

        <div class="chart-center">
          <p class="chart-title">紫微斗數命盤</p>
          <p>農曆 {{ chart.lunar.ganzhiYear }}年 {{ chart.lunar.isLeapMonth ? '閏' : '' }}{{ chart.lunar.month }}月 {{ chart.lunar.day }}日 · {{ chart.derivation.lateZi ? '晚子' : chart.hourBranch }}時 · {{ GENDER_LABEL[chart.gender] }}</p>
          <p>{{ chart.fiveElementsClass }} · 命宮在{{ chart.soulBranch }} · 身宮在{{ chart.bodyBranch }}</p>
          <p>大限{{ chart.decadalForward ? '順行' : '逆行' }}，從 {{ chart.bureau }} 歲起運。</p>
          <p v-if="currentDecadal">{{ currentYear }} 年（虛歲 {{ currentAge }} 歲）落在{{ currentDecadal.name }}大限。</p>
          <p v-else>{{ currentYear }} 年（虛歲 {{ currentAge }} 歲）尚未進入第一個大限。</p>
        </div>
      </div>

      <article v-if="selectedPalace" class="palace-detail">
        <p class="card-title">{{ selectedPalace.name }}（{{ selectedPalace.branchName }}宮）<span v-if="selectedPalace.isBody"> · 身宮</span></p>
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
        <p v-if="selectedPalace.minorStars.length" class="minor-line"><strong>輔星</strong>：{{ selectedPalace.minorStars.map(starLabel).join('、') }}</p>
        <div v-if="selectedTriad" class="triad">
          <p><strong>對宮</strong>：{{ palaceLabel(selectedTriad.opposite) }}，主星 {{ selectedTriad.opposite?.majorStars.map(starLabel).join('、') || '無' }}</p>
          <p><strong>三合</strong>：{{ selectedTriad.trines.map(palaceLabel).join('、') }}</p>
        </div>
        <p class="decadal-line">大限 {{ selectedPalace.decadal.startAge }}–{{ selectedPalace.decadal.endAge }} 歲，約 {{ selectedPalace.decadal.startYear }}–{{ selectedPalace.decadal.endYear }} 年。</p>
      </article>

      <section class="decadal-section" aria-labelledby="decadal-title">
        <h2 id="decadal-title">大限走勢</h2>
        <p class="muted">虛歲計算：出生年為 1 歲，依農曆出生年推算各限起訖年份。</p>
        <ol class="decadal-list">
          <li v-for="(palace, index) in decadalTimeline" :key="palace.name" :class="{ current: palace.name === currentDecadal?.name }">
            <span class="decadal-order">第 {{ index + 1 }} 限</span>
            <strong>{{ palace.name }}（{{ palace.branchName }}宮）</strong>
            <span>{{ palace.decadal.startAge }}–{{ palace.decadal.endAge }} 歲</span>
            <span>{{ palace.decadal.startYear }}–{{ palace.decadal.endYear }} 年</span>
          </li>
        </ol>
      </section>

      <section class="mutagen-section" aria-labelledby="mutagen-title">
        <h2 id="mutagen-title">四化分布</h2>
        <p class="muted">依年干 {{ chart.yearStem }} 定出四化，化祿、化權、化科、化忌所落之宮位如下。</p>
        <ul class="mutagen-list">
          <li v-for="item in chart.derivation.mutagens" :key="item.mutagen">
            <strong>化{{ item.mutagen }}</strong>
            <span>{{ item.star }} 入 {{ item.palace }}（{{ item.branch }}宮）</span>
            <small>{{ mutagenMeaning(item.mutagen).keyword }}：{{ mutagenMeaning(item.mutagen).summary }}</small>
          </li>
        </ul>
      </section>

      <details class="steps" open>
        <summary>排盤推導</summary>
        <ol>
          <li v-for="step in derivationSteps" :key="step">{{ step }}</li>
        </ol>
      </details>

      <details class="method">
        <summary>計算方法與版本</summary>
        <p>方法版本：{{ result?.methodVersion }}；內容版本：{{ result?.contentVersion }}。</p>
        <p>排盤規則以標準安星法為準，並與公開的 iztro 2.6.3 對照測試。閏月十六日以後依 iztro 的預設算作下一個月；晚子時（23:00 以後）的命宮與身宮同子時，紫微落宮改取次日的農曆日，且不套用閏月換月規則。</p>
        <p>包含十四主星、文昌、文曲、左輔、右弼、天魁、天鉞、祿存、擎羊與陀羅；未包含其餘雜曜。</p>
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
.palace-cell.current { box-shadow: inset 0 0 0 1px #8fb3a0; }
.palace-cell.body .body-tag { position: absolute; top: 8px; right: 8px; color: #cfb878; font-size: 0.75rem; }
.palace-cell .current-tag { position: absolute; bottom: 8px; right: 8px; color: #8fb3a0; font-size: 0.75rem; }
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
.minor-line, .triad p, .decadal-line { color: #c5c0b6; font-size: 0.9rem; }
.triad { display: grid; gap: 4px; padding-top: 4px; border-top: 1px solid #a48e524b; }
.decadal-section, .mutagen-section { display: grid; gap: 10px; padding: 20px; border: 1px solid #a48e524b; border-radius: 14px; background: #0b1117; }
.decadal-section h2, .mutagen-section h2 { margin: 0; color: #f1e5ca; font-size: 1.125rem; font-weight: 500; }
.decadal-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
.decadal-list li { display: grid; gap: 3px; padding: 10px 12px; border: 1px solid #52606a88; border-radius: 10px; color: #c5c0b6; font-size: 0.875rem; }
.decadal-list li strong { color: #f1e5ca; font-weight: 500; }
.decadal-list li.current { border-color: #8fb3a0; background: #141c24; }
.decadal-order { color: #cfb878; font-size: 0.75rem; }
.mutagen-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
.mutagen-list li { display: grid; gap: 4px; padding: 12px; border-radius: 10px; background: #080e16; color: #c5c0b6; font-size: 0.875rem; line-height: 1.6; }
.mutagen-list strong { color: #cfb878; }
.mutagen-list small { color: #aaa99f; line-height: 1.6; }
.steps summary, .method summary { color: #cfb878; cursor: pointer; }
.steps ol { margin: 8px 0 0; padding-left: 20px; color: #c5c0b6; line-height: 1.8; font-size: 0.875rem; }
.method { color: #c5c0b6; line-height: 1.7; }
.muted { margin: 0; color: #aaa99f; font-size: 0.875rem; line-height: 1.6; }
.privacy-note { color: #aaa99f; font-size: 0.875rem; line-height: 1.7; }
@media (max-width: 680px) {
  .birth-form { grid-template-columns: 1fr; }
  .chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: none; }
  .palace-cell { grid-area: auto !important; }
  .chart-center { grid-column: 1 / -1; grid-row: auto; }
}
</style>
