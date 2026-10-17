<script setup lang="ts">
import { computed, ref } from 'vue';
import { calculateAstrology, createAstrologyForecast, signDescription, type AstrologyChart, type AstrologyForecast, type AstrologyForecastPeriod } from './astrology';
import { BIRTH_PLACES } from './locations';

const birthDate = ref('');
const birthTime = ref('12:00');
const placeId = ref('taipei');
const unknownTime = ref(false);
const chart = ref<AstrologyChart | null>(null);
const forecasts = ref<AstrologyForecast[]>([]);
const error = ref('');
const place = computed(() => BIRTH_PLACES.find(item => item.id === placeId.value)!);

function calculate(): void {
  error.value = '';
  try {
    const result = calculateAstrology({ birthDate: birthDate.value, birthTime: birthTime.value, timeZone: place.value.timeZone, latitude: place.value.latitude, longitude: place.value.longitude, timeUnknown: unknownTime.value });
    chart.value = result;
    forecasts.value = (['day', 'month', 'year'] as AstrologyForecastPeriod[]).map(period => createAstrologyForecast(result, period));
  } catch (cause) {
    chart.value = null;
    forecasts.value = [];
    error.value = cause instanceof Error ? cause.message : '無法繪製星盤，請檢查日期與時間。';
  }
}
</script>

<template>
  <div class="divination-app">
    <header class="page-head"><p class="eyebrow">NATAL CHART / LOCAL CALCULATION</p><h1>西洋占星</h1><p>以熱帶黃道繪製本命行星位置，未知出生時間也能查看行星落座。</p></header>
    <form class="birth-form" @submit.prevent="calculate">
      <label>出生日期<input v-model="birthDate" type="date" required autocomplete="bday"></label>
      <label>出生地點<select v-model="placeId"><option v-for="item in BIRTH_PLACES" :key="item.id" :value="item.id">{{ item.label }}</option></select></label>
      <label class="time-input">出生時間<input v-model="birthTime" type="time" :disabled="unknownTime" required></label>
      <label class="check-row"><input v-model="unknownTime" type="checkbox"> 不確定出生時間（隱藏上升點、天頂與宮位）</label>
      <button class="primary-button" type="submit">繪製本命盤</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="chart" class="results" aria-live="polite">
      <div class="section-title"><div><p class="eyebrow">YOUR NATAL SKY</p><h2>行星落點</h2></div><span class="version">{{ chart.methodVersion }}</span></div>
      <div class="chart-points"><article v-if="chart.ascendant" class="point"><small>上升點</small><strong>{{ chart.ascendant.sign }}</strong><span>{{ chart.ascendant.degree.toFixed(1) }}°</span></article><article v-if="chart.midheaven" class="point"><small>天頂</small><strong>{{ chart.midheaven.sign }}</strong><span>{{ chart.midheaven.degree.toFixed(1) }}°</span></article><article v-if="!chart.ascendant" class="point unknown"><small>出生時間未知</small><strong>不計算宮位</strong><span>行星落座以中午估算</span></article></div>
      <div class="planet-grid"><article v-for="planet in chart.planets" :key="planet.id" class="planet"><div><strong>{{ planet.name }}</strong><small>{{ planet.id === 'sun' ? '核心動機' : planet.id === 'moon' ? '情緒需求' : '行星象徵' }}</small></div><span class="sign">{{ planet.sign }}</span><strong class="degree">{{ planet.degree.toFixed(1) }}°</strong><span class="house">{{ planet.house ? `${planet.house} 宮` : '宮位未知' }}</span><span v-if="planet.retrograde" class="retrograde">逆行</span></article></div>
      <div class="summary-grid"><article class="summary"><h3>太陽</h3><p>{{ signDescription(chart.planets.find(planet => planet.id === 'sun')!.sign, 'sun') }}</p></article><article class="summary"><h3>月亮</h3><p>{{ signDescription(chart.planets.find(planet => planet.id === 'moon')!.sign, 'moon') }}</p></article><article v-if="chart.ascendant" class="summary"><h3>上升</h3><p>{{ signDescription(chart.ascendant.sign, 'rising') }}</p></article></div>
      <section class="aspects"><h3>主要相位</h3><p v-if="chart.aspects.length === 0" class="muted">本命行星間未找到設定容許度內的主要相位。</p><ul v-else><li v-for="aspect in chart.aspects" :key="`${aspect.first}-${aspect.aspect}-${aspect.second}`"><strong>{{ aspect.first }} × {{ aspect.second }}</strong><span>{{ aspect.aspect }}，容許度 {{ aspect.orb.toFixed(1) }}°</span><small>{{ aspect.meaning }}</small></li></ul></section>
      <div class="forecast-grid"><article v-for="forecast in forecasts" :key="forecast.periodLabel" class="forecast"><p class="eyebrow">{{ forecast.periodLabel }}</p><p>{{ forecast.text }}</p><small v-if="forecast.evidence.length">依據：{{ forecast.evidence.join('；') }}</small></article></div>
      <details class="method"><summary>計算方法與限制</summary><p>{{ chart.methodSummary }}</p><p>採用位置：{{ place.label }}（{{ place.latitude }}°, {{ place.longitude }}°）。相位容許度：合相／對分 7°、四分／三分 6°、六合 5°；逆行以行星前後一日黃經變化估算。行運以固定間隔抽樣，僅列太陽與月亮的本命相位作提示，不是完整預測。</p><p>目前地點為精選城市清單，沒有地名搜尋。北緯 66 度以外不提供宮位計算。</p></details>
    </section>
    <aside class="privacy-note">出生資料僅在本機運算，不會儲存或上傳。占星內容供娛樂與自我反思，不保證事件。</aside>
  </div>
</template>

<style scoped>
.divination-app{display:grid;gap:24px;width:min(100% - 32px,960px);margin:0 auto 72px;color:#e4dfd3}.page-head{padding:44px 10px 8px;text-align:center}.eyebrow{margin:0 0 8px;color:#cfb878;font-size:.73rem;letter-spacing:.18em}.page-head h1{margin:0;color:#f1e5ca;font-size:clamp(2rem,6vw,3.3rem);font-weight:500}.page-head>p:last-child{color:#bdb9ae}.birth-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;padding:22px;border:1px solid #a48e524b;border-radius:16px;background:#121a21}.birth-form label{display:grid;gap:7px;color:#d4c69f;font-size:.88rem}.birth-form input,.birth-form select{width:100%;min-height:46px;padding:9px 12px;border:1px solid #52606a;border-radius:9px;color:#eee8dc;background:#0b1117;font:inherit}.birth-form input:focus-visible,.birth-form select:focus-visible{outline:3px solid #d7bd79;outline-offset:2px}.birth-form input:disabled{opacity:.5}.check-row{grid-column:1/-1;display:flex!important;grid-template-columns:none!important;align-items:center}.check-row input{width:20px;min-height:20px;accent-color:#c7a859}.primary-button{justify-self:start;min-height:46px;padding:0 20px;border:1px solid #d0b671;border-radius:999px;color:#f3e8ca;background:#322f28;font:inherit;cursor:pointer}.error{grid-column:1/-1;margin:0;color:#ffb7a9}.results{display:grid;gap:18px}.section-title{display:flex;justify-content:space-between;align-items:end}.section-title h2{margin:0;color:#f0e4c6;font-size:1.7rem}.version{color:#99978f;font-size:.75rem}.chart-points{display:flex;flex-wrap:wrap;gap:12px}.point{display:grid;gap:5px;min-width:145px;padding:15px 18px;border:1px solid #b29a5855;border-radius:12px;background:#1b252d}.point small,.point span{color:#bbb5a9}.point strong{color:#efdda9;font-size:1.2rem}.point.unknown{flex:1}.planet-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.planet{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:13px 16px;border:1px solid #68727a44;border-radius:10px;background:#11191f}.planet>div{display:grid;gap:3px}.planet>div strong{color:#eaddbd}.planet small,.house,.retrograde{color:#aaa99f;font-size:.78rem}.sign{color:#d8c78e}.degree{color:#eee4cf;font-variant-numeric:tabular-nums}.house{grid-column:2}.retrograde{grid-row:1;grid-column:2;justify-self:end;color:#d9a99b}.summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.summary,.forecast,.aspects,.method{padding:18px 20px;border:1px solid #64707a55;border-radius:12px;background:#121a21}.summary h3,.aspects h3{margin:0 0 8px;color:#e8d8b3}.summary p,.forecast p,.method p{margin:8px 0 0;color:#c5c0b6;line-height:1.75}.aspects ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:0;padding:0;list-style:none}.aspects li{display:grid;gap:5px;padding:12px;border-radius:9px;background:#0d141a}.aspects li strong{color:#e8d8b3}.aspects li span,.aspects li small,.forecast small{color:#bdb9ae;line-height:1.65}.forecast-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.method summary{color:#dec98f;cursor:pointer}.method p{margin-top:12px}.privacy-note{padding:16px 20px;border-left:2px solid #8c784a;color:#bcb8ae;background:#151c21;line-height:1.7}.muted{color:#aaa}@media(max-width:680px){.birth-form{grid-template-columns:1fr}.check-row,.error{grid-column:1}.planet-grid,.forecast-grid{grid-template-columns:1fr}.divination-app{width:min(100% - 22px,960px)}}
</style>
