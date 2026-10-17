<script setup lang="ts">
import { computed, ref } from 'vue';
import { BIRTH_YEAR_RANGE, CHART_SOURCES, FACINGS, PALACE_DIRECTION, buildFengshuiReport, sourcesFor, type ChartSourceId, type FacingId, type FengshuiReport, type Fortune, type Gender } from './fengshui';
import { interpretFengshui } from './interpretation';
import { lunarYearOf } from './lunar';

const FACING_OPTIONS: Array<{ value: FacingId | ''; label: string }> = [
  { value: '', label: '不填寫，只看八宅' },
  ...FACINGS.map(item => ({ value: item.id, label: `${item.label}（${item.sitting}）` })),
];
// 洛書方位：上排巽四、離九、坤二；中排震三、中五、兌七；下排艮八、坎一、乾六。
const GRID_ROWS = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
const VERDICT_CLASS: Record<Fortune, string> = { 吉: 'verdict-good', 中: 'verdict-mid', 凶: 'verdict-caution' };

const yearInput = ref<number | string>(1990);
const birthDateInput = ref('');
const genderInput = ref<Gender>('male');
const facingInput = ref<FacingId | ''>('');
// 艮山坤向有兩個數值來源；其他坐向只有技能檔，來源選單不顯示。
const chartSourceInput = ref<ChartSourceId>('skill');
const SOURCE_OPTIONS = sourcesFor('gen-kun').map(id => ({ value: id, label: CHART_SOURCES[id].label }));
// 只有成功計算後才保存結果；改動表單不會自動重算，避免結果與目前輸入不一致。
const result = ref<FengshuiReport | null>(null);
const calculatedFor = ref<{ year: number; gender: Gender; birthDate: string; facing: FacingId | ''; chartSource: ChartSourceId } | null>(null);
const error = ref('');

const copy = computed(() => (result.value ? interpretFengshui(result.value) : null));
const flying = computed(() => result.value?.data.flying ?? null);
const effectiveChartSource = computed<ChartSourceId>(() => (facingInput.value === 'gen-kun' ? chartSourceInput.value : 'skill'));
const stale = computed(() => {
  const last = calculatedFor.value;
  if (!last) return false;
  return last.year !== Number(yearInput.value) || last.gender !== genderInput.value || last.birthDate !== birthDateInput.value || last.facing !== facingInput.value || last.chartSource !== effectiveChartSource.value;
});

function palaceAt(palace: number) {
  return flying.value?.palaces.find(p => p.palace === palace);
}

// 後一次送出的計算才會寫入結果，避免較慢的農曆換算晚於新的計算完成。
let latestCalculation = 0;

async function calculate(): Promise<void> {
  error.value = '';
  const calculation = ++latestCalculation;
  try {
    // 年份範圍與格式由 natalKua 檢查，錯誤訊息會直接顯示在表單下方。
    const year = Number(yearInput.value);
    const facing = facingInput.value || undefined;
    const birthDate = birthDateInput.value || '';
    const lunarYear = birthDate ? await lunarYearOf(birthDate, year) : undefined;
    if (calculation !== latestCalculation) return;
    const chartSource = effectiveChartSource.value;
    result.value = buildFengshuiReport({ year, gender: genderInput.value, lunarYear, facing, chartSource });
    calculatedFor.value = { year, gender: genderInput.value, birthDate, facing: facingInput.value, chartSource };
  } catch (cause) {
    if (calculation !== latestCalculation) return;
    result.value = null;
    calculatedFor.value = null;
    error.value = cause instanceof Error ? cause.message : '無法計算，請檢查出生年份後再試一次。';
  }
}
</script>

<template>
  <div class="fengshui-app">
    <header class="page-head">
      <h1>風水命理</h1>
      <p>依出生年份與性別換算八宅本命卦，列出八方的生氣、天醫、延年、伏位與四凶位；若填入房屋坐向，另排玄空飛星盤。每一步都會列出，方便自行核對。資料只在這個瀏覽器計算，不會儲存或上傳。</p>
    </header>

    <form class="cast-form" @submit.prevent="calculate">
      <label>出生年份
        <input v-model.number="yearInput" type="number" inputmode="numeric" :min="BIRTH_YEAR_RANGE.min" :max="BIRTH_YEAR_RANGE.max" required>
        <small>以出生年份計算。若出生在農曆新年前，命卦會不同，請留意。</small>
      </label>
      <label>出生日期（選填）
        <input v-model="birthDateInput" type="date" autocomplete="bday">
        <small>填入後以農曆新年換算命年；只填年份時以國曆年計算。</small>
      </label>
      <label>性別
        <select v-model="genderInput">
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
        <small>男女的本命卦公式不同。</small>
      </label>
      <label>房屋坐向
        <select v-model="facingInput">
          <option v-for="item in FACING_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <small>坐向指房子背靠的方向。飛星盤收錄九運的四正向與艮山坤向。</small>
      </label>
      <label v-if="facingInput === 'gen-kun'">艮山坤向的數值來源
        <select v-model="chartSourceInput">
          <option v-for="item in SOURCE_OPTIONS" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
        <small>兩組數值不同，請依需要選擇；預設為技能檔。</small>
      </label>
      <button class="primary-button" type="submit">計算</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="result && copy && calculatedFor" class="results" aria-live="off">
      <header class="result-head">
        <p class="summary-line">
          出生年 <strong>{{ calculatedFor.year }}</strong>｜{{ calculatedFor.gender === 'male' ? '男' : '女' }}｜
          本命卦 <strong>{{ result.data.natal.name }}卦（{{ result.data.natal.gua }}）</strong>，{{ result.data.natal.group }}
        </p>
        <p class="meta">流派：八宅（命卦與八星）與玄空飛星（九運）。飛星盤僅在填入正向坐向時顯示。</p>
        <p v-if="stale" class="stale-notice" role="status">表單已更動，目前顯示的是上一次計算的結果；請按「計算」更新。</p>
      </header>

      <section class="block" aria-labelledby="fengshui-steps">
        <h2 id="fengshui-steps">推導過程</h2>
        <ol class="steps">
          <li v-for="step in result.data.natal.steps" :key="step">{{ step }}</li>
          <template v-if="flying">
            <li v-for="step in flying.steps" :key="step">{{ step }}</li>
          </template>
        </ol>
      </section>

      <section class="block" aria-labelledby="fengshui-mansions">
        <h2 id="fengshui-mansions">八方吉凶（八宅）</h2>
        <div class="table-wrap">
          <table class="direction-table">
            <thead><tr><th scope="col">方位</th><th scope="col">星</th><th scope="col">判斷</th></tr></thead>
            <tbody>
              <tr v-for="item in result.data.mansions" :key="item.direction">
                <td>{{ item.direction }}</td>
                <td>{{ item.star }}</td>
                <td><span class="verdict" :class="VERDICT_CLASS[item.fortune]">{{ item.fortune }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="block" aria-labelledby="fengshui-good">
        <h2 id="fengshui-good">吉方建議</h2>
        <p>{{ copy.headline }}</p>
        <p>{{ copy.natalLine }}</p>
        <ul>
          <li v-for="line in copy.bestLines" :key="line">{{ line }}</li>
        </ul>
      </section>

      <section class="block" aria-labelledby="fengshui-caution">
        <h2 id="fengshui-caution">需要留意的方位</h2>
        <ul>
          <li v-for="line in copy.cautionLines" :key="line">{{ line }}</li>
        </ul>
      </section>

      <section v-if="flying" class="block" aria-labelledby="fengshui-flying">
        <h2 id="fengshui-flying">玄空飛星（九運・{{ flying.facing.label }}，{{ flying.facing.sitting }}）</h2>
        <p v-if="flying.sourceNote" class="source-note" role="note">數值來源：{{ flying.source.label }}。{{ flying.sourceNote }}</p>
        <div class="flying-grid" aria-label="九宮飛星盤">
          <template v-for="row in GRID_ROWS" :key="row.join('-')">
            <div v-for="palace in row" :key="palace" class="palace-cell" :class="palace === 5 ? 'palace-center' : ''">
              <template v-if="palaceAt(palace)">
                <h3>
                  {{ PALACE_DIRECTION[palace] ?? '中央' }}
                  <span v-if="palace !== 5" class="verdict" :class="VERDICT_CLASS[palaceAt(palace)!.verdict]">{{ palaceAt(palace)!.verdict }}</span>
                </h3>
                <dl>
                  <div><dt>運星</dt><dd>{{ palaceAt(palace)!.run }}</dd></div>
                  <div><dt>山星</dt><dd>{{ palaceAt(palace)!.mountain }}</dd></div>
                  <div><dt>向星</dt><dd>{{ palaceAt(palace)!.facing }}</dd></div>
                </dl>
                <p v-if="palace !== 5 && palaceAt(palace)!.matches.length" class="palace-note">
                  {{ palaceAt(palace)!.matches.map(m => m.meaning).join('；') }}
                </p>
              </template>
            </div>
          </template>
        </div>
        <ul>
          <li v-for="line in copy.flyingLines" :key="line">{{ line }}</li>
        </ul>
      </section>

      <section class="block" aria-labelledby="fengshui-space">
        <h2 id="fengshui-space">空間布局建議</h2>
        <dl class="space-list">
          <div v-for="item in copy.spaceLines" :key="item.space">
            <dt>{{ item.space }}</dt>
            <dd>{{ item.text }}</dd>
          </div>
        </dl>
      </section>

      <section class="block" aria-labelledby="fengshui-note">
        <h2 id="fengshui-note">綜合說明</h2>
        <p class="caution">{{ copy.caution }}</p>
        <p class="caution">{{ result.disclaimer }}</p>
      </section>
    </section>
  </div>
</template>

<style scoped>
.fengshui-app { display: grid; gap: 24px; width: min(100% - 32px, 960px); margin: 0 auto 72px; color: #e4dfd3; }
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
.stale-notice { margin: 0; padding: 8px 12px; border: 1px solid #a48e524b; border-radius: 10px; color: #e7dfb3; font-size: 0.9rem; }
.block { display: grid; gap: 10px; padding: 20px; border: 1px solid #a48e524b; border-radius: var(--ll-radius-panel, 14px); background: #0b1117; }
.block h2 { margin: 0; color: #f1e5ca; font-size: 1.2rem; font-weight: 500; }
.block p, .block li { color: #d6d1c4; line-height: 1.8; margin: 0; }
.steps, .block ul { margin: 0; padding-left: 1.3em; }
.caution { color: #aaa99f; font-size: 0.875rem; }
.table-wrap { overflow-x: auto; }
.direction-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.direction-table th, .direction-table td { padding: 8px 10px; border-bottom: 1px solid #a48e5230; text-align: left; }
.direction-table th { color: #d4c69f; font-weight: 500; }
.verdict { display: inline-block; min-width: 2em; padding: 1px 6px; border-radius: 999px; font-size: 0.8125rem; text-align: center; }
.verdict-good { background: #2f4a33; color: #bfe6c3; }
.verdict-mid { background: #3a3a2d; color: #e7dfb3; }
.verdict-caution { background: #4a2d2d; color: #f0c0b8; }
.source-note { margin: 0; padding: 8px 12px; border: 1px solid #a48e524b; border-radius: 10px; color: #e7dfb3; font-size: 0.9rem; line-height: 1.6; }
.flying-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.palace-cell { min-height: 150px; padding: 12px; border: 1px solid #a48e5240; border-radius: 12px; background: #080e16; }
.palace-center { background: #151b22; }
.palace-cell h3 { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin: 0; color: #f1e5ca; font-size: 1rem; font-weight: 600; }
.palace-cell dl { display: grid; gap: 4px; margin: 8px 0 0; }
.palace-cell dl > div { display: grid; grid-template-columns: 3.2em 1fr; gap: 6px; font-size: 0.9rem; }
.palace-cell dt { color: #aaa99f; }
.palace-cell dd { margin: 0; color: #e4dfd3; }
.palace-note { margin: 8px 0 0; color: #aaa99f; font-size: 0.8125rem; line-height: 1.6; }
.space-list { display: grid; gap: 12px; margin: 0; }
.space-list div { display: grid; gap: 4px; }
.space-list dt { color: #d4c69f; font-weight: 500; }
.space-list dd { margin: 0; color: #d6d1c4; line-height: 1.8; }
@media (max-width: 680px) {
  .cast-form { grid-template-columns: 1fr; }
  .flying-grid { gap: 8px; }
  .palace-cell { min-height: 0; padding: 10px; }
}
</style>
