<script setup lang="ts">
import { computed, ref } from 'vue';
import { calculateBazi, createBaziForecast, type BaziChart, type BaziForecast, type ForecastPeriod } from './bazi';
import { BIRTH_PLACES } from './locations';

const birthDate = ref('');
const birthTime = ref('12:00');
const placeId = ref('taipei');
const customTimeZone = ref('');
const customLongitude = ref('');
const unknownTime = ref(true);
const trueSolarTime = ref(false);
const daYunGender = ref('');
const daYunSchool = ref<1 | 2>(1);
const chart = ref<BaziChart | null>(null);
const forecasts = ref<BaziForecast[]>([]);
const error = ref('');
const place = computed(() => BIRTH_PLACES.find(item => item.id === placeId.value) ?? { id: 'custom', label: '自訂地點', timeZone: customTimeZone.value.trim(), latitude: 0, longitude: Number(customLongitude.value) });

function calculate(): void {
  error.value = '';
  try {
    const result = calculateBazi({
      birthDate: birthDate.value, birthTime: birthTime.value, timeZone: place.value.timeZone,
      timeUnknown: unknownTime.value, longitude: place.value.longitude, trueSolarTime: !unknownTime.value && trueSolarTime.value,
      ...(!unknownTime.value && daYunGender.value ? { daYunGender: Number(daYunGender.value) as 0 | 1, daYunSchool: daYunSchool.value } : {}),
    });
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
    <header class="page-head"><h1>生辰八字</h1><p>先用簡易三柱開始；知道精確出生時間時，再補上時柱查看完整四柱。</p></header>
    <form class="birth-form" @submit.prevent="calculate">
      <fieldset class="precision-toggle"><legend>選擇資料完整度</legend><label><input v-model="unknownTime" type="radio" :value="true" name="bazi-precision">簡易三柱 <small>出生時間不確定或不方便提供</small></label><label><input v-model="unknownTime" type="radio" :value="false" name="bazi-precision">完整四柱 <small>有出生證明或可靠的出生時間</small></label></fieldset>
      <label>出生日期<input v-model="birthDate" type="date" required autocomplete="bday"></label>
      <label>出生地點／時區<select v-model="placeId"><option v-for="item in BIRTH_PLACES" :key="item.id" :value="item.id">{{ item.label }}</option><option value="custom">其他地點（自訂時區）</option></select><small>用於套用出生地當時的民用日期與時區；城市中心座標僅供占星近似使用。</small></label>
      <label v-if="placeId === 'custom'">出生地時區（IANA）<input v-model="customTimeZone" type="text" required placeholder="例如 America/Toronto" autocomplete="off"><small>可在時區資料庫找到 IANA 名稱；本機會依該地歷史時區規則換算。</small></label>
      <label v-if="placeId === 'custom' && trueSolarTime">出生地經度<input v-model="customLongitude" type="number" min="-180" max="180" step="any" required placeholder="東經為正、西經為負"><small>真太陽時需要出生地經度；緯度不參與此換算。</small></label>
      <label class="time-input">出生時間<input v-model="birthTime" type="time" :disabled="unknownTime" :required="!unknownTime"><small v-if="unknownTime">簡易模式不排時柱，不會用中午估值代替你的出生時間。</small></label>
      <label v-if="!unknownTime" class="check-row"><input v-model="trueSolarTime" type="checkbox">以真太陽時排日柱、時柱<small>使用經度修正與均時差；年、月柱仍依實際出生瞬間對節氣。</small></label>
      <label v-if="!unknownTime">大運順逆參數（傳統命例）<select v-model="daYunGender"><option value="">不排大運</option><option value="1">男命取法</option><option value="0">女命取法</option></select><small>這是所選排盤法的計算參數，不代表或推定你的性別認同；僅在本機使用。</small></label>
      <label v-if="!unknownTime && daYunGender">起運算法<select v-model.number="daYunSchool"><option :value="1">lunar-javascript 流派 1</option><option :value="2">lunar-javascript 流派 2</option></select><small>不同流派與軟體算法會有差異；起運歲數以年月日顯示。</small></label>
      <button class="primary-button" type="submit">{{ unknownTime ? '排出簡易三柱' : '排出完整四柱' }}</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="chart" class="results" aria-live="polite">
      <div class="section-title"><div><h2>{{ chart.timeUnknown ? '簡易三柱命盤' : '完整四柱命盤' }}</h2></div><span class="version">{{ chart.methodVersion }}</span></div>
      <div class="pillars"><article v-for="pillar in chart.pillars" :key="pillar.label" class="pillar"><p>{{ pillar.label }}</p><strong>{{ pillar.value }}</strong><span>{{ pillar.element }}</span><small>{{ pillar.tenGod }}</small><small>藏干：{{ pillar.hiddenStems.join('、') || '—' }}</small></article></div>
      <div class="result-grid"><div class="result-col"><div class="summary"><h3>日主與五行分布</h3><p>日主為 <strong>{{ chart.dayMaster }}</strong>。五行以天干、地支各計一項作簡要統計：{{ Object.entries(chart.elementCounts).map(([element,count]) => `${element}${count}`).join('・') }}。</p></div>
      <article class="summary strength"><h3>日主支援線索：{{ chart.strengthSignals.label }}</h3><ul><li v-for="item in chart.strengthSignals.evidence" :key="item">{{ item }}</li></ul><p>這是可查核的簡化觀察，不等同傳統格局、完整旺衰或喜用神判斷。</p></article></div>
      <div class="result-col"><section v-if="chart.daYun" class="summary dayun"><h3>大運與起運</h3><p>採 {{ chart.daYun.gender === 1 ? '男命' : '女命' }}順逆參數、流派 {{ chart.daYun.school }}；起運約在出生後 {{ chart.daYun.startAge.years }} 年 {{ chart.daYun.startAge.months }} 月 {{ chart.daYun.startAge.days }} 日<span v-if="chart.daYun.startAge.hours"> {{ chart.daYun.startAge.hours }} 小時</span>，約 {{ chart.daYun.startDate }}。</p><ol><li v-for="cycle in chart.daYun.cycles" :key="`${cycle.startYear}-${cycle.pillar}`">{{ cycle.startYear }} 年起・約 {{ cycle.startAge }} 歲・{{ cycle.pillar }} 運</li></ol><small>大運以所選方法推算的年代區間作參考；流派、節氣時刻與出生時間精度會影響起運結果。</small></section></div></div>
      <div class="forecast-grid"><article v-for="forecast in forecasts" :key="forecast.periodLabel" class="forecast"><p class="forecast-label">{{ forecast.periodLabel }} / {{ forecast.periodPillar }}</p><h3>{{ forecast.tenGod }}的整理方向</h3><p>{{ forecast.text }}</p><small>依據：{{ forecast.evidence.join('；') }}</small></article></div>
      <details class="method"><summary>計算方法與限制</summary><p>{{ chart.methodSummary }}</p><p>使用地點：{{ place.label }}（{{ place.timeZone }}<template v-if="chart.solarTime === 'true'">，{{ place.longitude }}°</template>）。方法版本：{{ chart.methodVersion }}。五行統計與日主支援線索皆為簡化觀察，不排傳統格局、合沖刑害全表或喜用神；沒有提供時辰時不計大運與起運。大運順逆採明確選定的傳統命例參數，不推定性別。流年提示仍是固定文案，不構成完整命理判斷。</p></details>
    </section>
    <aside class="privacy-note">資料僅在本機運算，不會儲存或上傳。八字內容為傳統象徵的整理方式，供娛樂與自我反思。</aside>
  </div>
</template>

<style scoped>
.divination-app{display:grid;gap:24px;width:min(100% - 32px,960px);margin:0 auto 72px;color:#e4dfd3}.page-head{padding:44px 10px 8px;text-align:center}.forecast-label{margin:0 0 4px;color:#cfb878;font-size:.8125rem}.page-head h1{margin:0;color:#f1e5ca;font-size:clamp(2rem,6vw,3.3rem);font-weight:500}.page-head>p:last-child{color:#bdb9ae}.birth-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;padding:22px;border:1px solid #a48e524b;border-radius:var(--ll-radius-panel);background:#121a21}.birth-form label{display:grid;gap:7px;color:#d4c69f;font-size:.88rem}.birth-form input,.birth-form select{width:100%;min-height:46px;padding:9px 12px;border:1px solid #52606a;border-radius:var(--ll-radius-control);color:#eee8dc;background:#0b1117;font:inherit}.birth-form input:focus-visible,.birth-form select:focus-visible{outline:3px solid #d7bd79;outline-offset:2px}.birth-form input:disabled{opacity:.5}.check-row{grid-column:1/-1;display:flex!important;grid-template-columns:none!important;align-items:center}.check-row input{width:20px;min-height:20px;accent-color:#c7a859}.primary-button{justify-self:start;min-height:48px;padding:0 20px;border:1px solid #b87b68;border-radius:var(--ll-radius-control);color:#fff7ed;background:var(--ll-color-wine);font:650 var(--ll-font-size-body)/1.4 var(--ll-font-body);cursor:pointer}.primary-button:hover{background:var(--ll-color-wine-light)}.primary-button:focus-visible{outline:var(--ll-focus-width) solid var(--ll-color-focus);outline-offset:var(--ll-focus-offset)}.error{grid-column:1/-1;margin:0;color:#ffb7a9}.results{display:grid;gap:18px}.section-title{display:flex;justify-content:space-between;align-items:end}.section-title h2{margin:0;color:#f0e4c6;font-size:1.7rem}.version{color:#99978f;font-size:.75rem}.pillars{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.pillar{display:grid;justify-items:center;gap:7px;padding:18px 10px;border:1px solid #9b86494a;border-radius:var(--ll-radius-panel);background:linear-gradient(155deg,#1e2931,#11171e)}.pillar p,.pillar small{margin:0;color:#bdb8ac;text-align:center}.pillar strong{color:#f0dda9;font-size:2rem;letter-spacing:.12em}.pillar>span{color:#d9c994}.summary,.forecast,.method{padding:18px 20px;border:1px solid #64707a55;border-radius:var(--ll-radius-panel);background:#121a21}.summary h3,.forecast h3{margin:0 0 8px;color:#e8d8b3}.summary p,.forecast p,.forecast small,.method p{color:#c5c0b6;line-height:1.75}.summary p,.forecast p,.method p{margin:8px 0 0}.forecast-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.forecast small{display:block;margin-top:10px}.method summary{color:#dec98f;cursor:pointer}.method p{margin-top:12px}.privacy-note{padding:16px 20px;border-left:2px solid #8c784a;color:#bcb8ae;background:#151c21;line-height:1.7}@media(max-width:680px){.birth-form{grid-template-columns:1fr}.check-row,.error{grid-column:1}.pillars{grid-template-columns:repeat(2,minmax(0,1fr))}.forecast-grid{grid-template-columns:1fr}.divination-app{width:min(100% - 22px,960px)}}
.precision-toggle{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;border:0}.precision-toggle legend{margin-bottom:8px;color:#d4c69f;font-size:.88rem}.precision-toggle label{display:grid;grid-template-columns:auto 1fr;gap:3px 9px;align-items:center;padding:13px;border:1px solid #52606a;border-radius:10px;background:#0b1117}.precision-toggle input{grid-row:span 2;width:18px;height:18px;accent-color:#c7a859}.precision-toggle small{color:#aaa99f;font-size:.78rem}.birth-form label small{color:#aaa99f;font-size:.78rem;line-height:1.5}.pillars{grid-template-columns:repeat(auto-fit,minmax(125px,1fr))}
.strength ul,.dayun ol{margin:10px 0 0;padding-left:22px;color:#c5c0b6;line-height:1.8}.dayun small{display:block;margin-top:10px;color:#b8b4aa;line-height:1.7}
@media(max-width:680px){.precision-toggle{grid-template-columns:1fr}}
.result-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}.result-col{display:grid;gap:12px;align-content:start;min-width:0}@media(max-width:680px){.result-grid{grid-template-columns:1fr}}
</style>
