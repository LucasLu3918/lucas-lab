<script setup lang="ts">
import { computed, ref } from 'vue';
import { calculateBazi, createBaziForecast, type BaziChart, type BaziForecast, type ForecastPeriod } from './bazi';
import { BIRTH_PLACES } from './locations';

const birthDate = ref('');
const birthTime = ref('12:00');
const placeId = ref('taipei');
const unknownTime = ref(false);
const chart = ref<BaziChart | null>(null);
const forecasts = ref<BaziForecast[]>([]);
const error = ref('');
const place = computed(() => BIRTH_PLACES.find(item => item.id === placeId.value)!);

function calculate(): void {
  error.value = '';
  try {
    const result = calculateBazi({ birthDate: birthDate.value, birthTime: unknownTime.value ? '12:00' : birthTime.value, timeZone: place.value.timeZone });
    chart.value = result;
    forecasts.value = (['day', 'month', 'year'] as ForecastPeriod[]).map(period => createBaziForecast(result, period, new Date(), place.value.timeZone));
  } catch (cause) {
    chart.value = null;
    forecasts.value = [];
    error.value = cause instanceof Error ? cause.message : '無法排盤，請檢查日期與時間。';
  }
}
</script>

<template>
  <div class="divination-app">
    <header class="page-head"><p class="eyebrow">FOUR PILLARS / LOCAL CALCULATION</p><h1>生辰八字</h1><p>輸入出生日期與地點，以節氣和民用時間排出四柱。</p></header>
    <form class="birth-form" @submit.prevent="calculate">
      <label>出生日期<input v-model="birthDate" type="date" required autocomplete="bday"></label>
      <label>出生地點<select v-model="placeId"><option v-for="item in BIRTH_PLACES" :key="item.id" :value="item.id">{{ item.label }}</option></select></label>
      <label class="time-input">出生時間<input v-model="birthTime" type="time" :disabled="unknownTime" required></label>
      <label class="check-row"><input v-model="unknownTime" type="checkbox"> 不確定出生時間（以中午排盤，時柱只作參考）</label>
      <button class="primary-button" type="submit">排出四柱</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="chart" class="results" aria-live="polite">
      <div class="section-title"><div><p class="eyebrow">YOUR FOUR PILLARS</p><h2>命盤與象徵</h2></div><span class="version">{{ chart.methodVersion }}</span></div>
      <div class="pillars"><article v-for="pillar in chart.pillars" :key="pillar.label" class="pillar"><p>{{ pillar.label }}</p><strong>{{ pillar.value }}</strong><span>{{ pillar.element }}</span><small>{{ pillar.tenGod }}</small><small>藏干：{{ pillar.hiddenStems.join('、') || '—' }}</small></article></div>
      <div class="summary"><h3>日主與五行分布</h3><p>日主為 <strong>{{ chart.dayMaster }}</strong>。五行以天干、地支各計一項作簡要統計：{{ Object.entries(chart.elementCounts).map(([element,count]) => `${element}${count}`).join('・') }}。</p></div>
      <div class="forecast-grid"><article v-for="forecast in forecasts" :key="forecast.periodLabel" class="forecast"><p class="eyebrow">{{ forecast.periodLabel }} / {{ forecast.periodPillar }}</p><h3>{{ forecast.tenGod }}的整理方向</h3><p>{{ forecast.text }}</p><small>依據：{{ forecast.evidence.join('；') }}</small></article></div>
      <details class="method"><summary>計算方法與限制</summary><p>{{ chart.methodSummary }}</p><p>使用地點：{{ place.label }}（{{ place.timeZone }}）。方法版本：{{ chart.methodVersion }}。此 MVP 不計算大運、起運歲數、真太陽時、合沖刑害全表或格局旺衰；五行數量只是可查核的簡化統計，不等於喜用神判斷。</p></details>
    </section>
    <aside class="privacy-note">資料僅在本機運算，不會儲存或上傳。八字內容為傳統象徵的整理方式，供娛樂與自我反思。</aside>
  </div>
</template>

<style scoped>
.divination-app{display:grid;gap:24px;width:min(100% - 32px,960px);margin:0 auto 72px;color:#e4dfd3}.page-head{padding:44px 10px 8px;text-align:center}.eyebrow{margin:0 0 8px;color:#cfb878;font-size:.73rem;letter-spacing:.18em}.page-head h1{margin:0;color:#f1e5ca;font-size:clamp(2rem,6vw,3.3rem);font-weight:500}.page-head>p:last-child{color:#bdb9ae}.birth-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;padding:22px;border:1px solid #a48e524b;border-radius:16px;background:#121a21}.birth-form label{display:grid;gap:7px;color:#d4c69f;font-size:.88rem}.birth-form input,.birth-form select{width:100%;min-height:46px;padding:9px 12px;border:1px solid #52606a;border-radius:9px;color:#eee8dc;background:#0b1117;font:inherit}.birth-form input:focus-visible,.birth-form select:focus-visible{outline:3px solid #d7bd79;outline-offset:2px}.birth-form input:disabled{opacity:.5}.check-row{grid-column:1/-1;display:flex!important;grid-template-columns:none!important;align-items:center}.check-row input{width:20px;min-height:20px;accent-color:#c7a859}.primary-button{justify-self:start;min-height:46px;padding:0 20px;border:1px solid #d0b671;border-radius:999px;color:#f3e8ca;background:#322f28;font:inherit;cursor:pointer}.error{grid-column:1/-1;margin:0;color:#ffb7a9}.results{display:grid;gap:18px}.section-title{display:flex;justify-content:space-between;align-items:end}.section-title h2{margin:0;color:#f0e4c6;font-size:1.7rem}.version{color:#99978f;font-size:.75rem}.pillars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pillar{display:grid;justify-items:center;gap:7px;padding:18px 10px;border:1px solid #9b86494a;border-radius:12px;background:linear-gradient(155deg,#1e2931,#11171e)}.pillar p,.pillar small{margin:0;color:#bdb8ac;text-align:center}.pillar strong{color:#f0dda9;font-size:2rem;letter-spacing:.12em}.pillar>span{color:#d9c994}.summary,.forecast,.method{padding:18px 20px;border:1px solid #64707a55;border-radius:12px;background:#121a21}.summary h3,.forecast h3{margin:0 0 8px;color:#e8d8b3}.summary p,.forecast p,.forecast small,.method p{color:#c5c0b6;line-height:1.75}.summary p,.forecast p,.method p{margin:8px 0 0}.forecast-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.forecast small{display:block;margin-top:10px}.method summary{color:#dec98f;cursor:pointer}.method p{margin-top:12px}.privacy-note{padding:16px 20px;border-left:2px solid #8c784a;color:#bcb8ae;background:#151c21;line-height:1.7}@media(max-width:680px){.birth-form{grid-template-columns:1fr}.check-row,.error{grid-column:1}.pillars{grid-template-columns:repeat(2,minmax(0,1fr))}.forecast-grid{grid-template-columns:1fr}.divination-app{width:min(100% - 22px,960px)}}
</style>
