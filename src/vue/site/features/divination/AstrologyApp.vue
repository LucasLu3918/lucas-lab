<script setup lang="ts">
import { computed, ref } from 'vue';
import { calculateAstrology, createAstrologyForecast, signDescription, type AstrologyChart, type AstrologyForecast, type AstrologyForecastPeriod } from './astrology';
import { createAnnualAstrologyForecast, type AnnualAstrologyForecast } from './astrology-annual';
import { BIRTH_PLACES } from './locations';
import type { Disambiguation } from '../fortune-core/civil-time';
import PrecisionBadge from '../fortune-core/ui/PrecisionBadge.vue';

const birthDate = ref('');
const birthTime = ref('12:00');
const placeId = ref('taipei');
const customTimeZone = ref('');
const customLatitude = ref('');
const customLongitude = ref('');
const unknownTime = ref(true);
const returnPlaceId = ref('birth');
const disambiguation = ref<Disambiguation>('earlier');
const chart = ref<AstrologyChart | null>(null);
const forecasts = ref<AstrologyForecast[]>([]);
const annual = ref<AnnualAstrologyForecast | null>(null);
const error = ref('');
const place = computed(() => BIRTH_PLACES.find(item => item.id === placeId.value) ?? {
  id: 'custom', label: '自訂地點', timeZone: customTimeZone.value.trim(),
  latitude: Number(customLatitude.value), longitude: Number(customLongitude.value),
});
const returnPlace = computed(() => returnPlaceId.value === 'birth'
  ? place.value
  : BIRTH_PLACES.find(item => item.id === returnPlaceId.value) ?? place.value);

// 事件列表可達上千筆，依時區快取formatter，避免每一列重建 Intl.DateTimeFormat。
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
function formatAt(instant: string, timeZone: string): string {
  let formatter = dateFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short', timeZone });
    dateFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(instant));
}

function calculate(): void {
  error.value = '';
  try {
    const result = calculateAstrology({ birthDate: birthDate.value, birthTime: birthTime.value, timeZone: place.value.timeZone, latitude: place.value.latitude, longitude: place.value.longitude, timeUnknown: unknownTime.value, disambiguation: disambiguation.value });
    chart.value = result;
    forecasts.value = (['day', 'month', 'year'] as AstrologyForecastPeriod[]).map(period => createAstrologyForecast(result, period));
    annual.value = createAnnualAstrologyForecast(result, returnPlace.value);
  } catch (cause) {
    chart.value = null;
    forecasts.value = [];
    annual.value = null;
    error.value = cause instanceof Error ? cause.message : '無法繪製星盤，請檢查日期與時間。';
  }
}
</script>

<template>
  <div class="divination-app">
    <header class="page-head"><h1>西洋占星</h1><p>簡易模式先看行星落座；知道出生時間與地點時，可再補上上升點、天頂和宮位。</p></header>
    <form class="birth-form" @submit.prevent="calculate">
      <fieldset class="precision-toggle"><legend>選擇資料完整度</legend><label><input v-model="unknownTime" type="radio" :value="true" name="astrology-precision">簡易星盤 <small>出生時間不確定；不顯示上升點、天頂與宮位</small></label><label><input v-model="unknownTime" type="radio" :value="false" name="astrology-precision">深入星盤 <small>提供可靠時間，以計算時角資訊</small></label></fieldset>
      <label>出生日期<input v-model="birthDate" type="date" required autocomplete="bday"></label>
      <label>出生地點<select v-model="placeId"><option v-for="item in BIRTH_PLACES" :key="item.id" :value="item.id">{{ item.label }}</option><option value="custom">其他地點（自訂座標）</option></select><small>城市選項使用市中心座標近似；自訂位置可輸入更準確的座標。</small></label>
      <label>太陽回歸盤地點<select v-model="returnPlaceId"><option value="birth">出生地（{{ place.label }}，預設）</option><option v-for="item in BIRTH_PLACES" :key="item.id" :value="item.id">{{ item.label }}</option></select><small>回歸盤角度依此地計算；選擇你預計在生日附近停留的城市。</small></label>
      <template v-if="placeId === 'custom'">
        <label>出生地時區（IANA）<input v-model="customTimeZone" type="text" required placeholder="例如 America/Toronto" autocomplete="off"><small>用於正確轉換歷史民用時間與夏令時間。</small></label>
        <label>緯度<input v-model="customLatitude" type="number" min="-66" max="66" step="any" required placeholder="-66 至 66"><small>上升與宮位目前支援北緯、南緯 66 度以內。</small></label>
        <label>經度<input v-model="customLongitude" type="number" min="-180" max="180" step="any" required placeholder="-180 至 180"></label>
      </template>
      <label class="time-input">出生時間<input v-model="birthTime" type="time" :disabled="unknownTime" :required="!unknownTime"><small v-if="unknownTime">簡易模式用當地中午估算行星位置；月亮等快速移動天體可能跨星座。</small></label>
      <label v-if="!unknownTime">若出生地當時有夏令時間重複時刻<select v-model="disambiguation"><option value="earlier">採較早的一次</option><option value="later">採較晚的一次</option></select></label>
      <p v-if="!unknownTime" class="form-help">若所填時刻因夏令時間切換而不存在，系統會提示重新核對；它不會自動改成其他時間。</p>
      <button class="primary-button" type="submit">{{ unknownTime ? '查看簡易星盤' : '繪製深入星盤' }}</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="chart" class="results" aria-live="polite">
      <nav class="result-nav" aria-label="結果章節"><a href="#natal">本命星盤</a><a href="#transits">近期行運</a><a href="#annual">年度天象</a></nav>
      <section id="natal" class="result-block">
      <div class="section-title"><div><h2>行星落點</h2></div><span class="version">{{ chart.methodVersion }}</span></div>
      <PrecisionBadge :precision="chart.inputPrecision" :reason="chart.timeUnknown ? '出生時間未知，隱藏上升點與宮位' : '已提供出生時間，計算上升點與宮位'" />
      <div class="chart-points"><article v-if="chart.ascendant" class="point"><small>上升點</small><strong>{{ chart.ascendant.sign }}</strong><span>{{ chart.ascendant.degree.toFixed(1) }}°</span></article><article v-if="chart.midheaven" class="point"><small>天頂</small><strong>{{ chart.midheaven.sign }}</strong><span>{{ chart.midheaven.degree.toFixed(1) }}°</span></article><article v-if="!chart.ascendant" class="point unknown"><small>出生時間未知</small><strong>不計算時角與宮位</strong><span>行星位置以當地中午估算，月亮可能跨星座</span></article></div>
      <div class="planet-grid"><article v-for="planet in chart.planets" :key="planet.id" class="planet"><div><strong>{{ planet.name }}</strong><small>{{ planet.id === 'sun' ? '核心動機' : planet.id === 'moon' ? '情緒需求' : '行星象徵' }}</small></div><span class="sign">{{ planet.sign }}</span><strong class="degree">{{ planet.degree.toFixed(1) }}°</strong><span class="house">{{ planet.house ? `${planet.house} 宮` : '宮位未知' }}</span><span v-if="planet.retrograde" class="retrograde">逆行</span></article></div>
      <div class="summary-grid"><article class="summary"><h3>太陽</h3><p>{{ signDescription(chart.planets.find(planet => planet.id === 'sun')!.sign, 'sun') }}</p></article><article class="summary"><h3>月亮</h3><p>{{ signDescription(chart.planets.find(planet => planet.id === 'moon')!.sign, 'moon') }}</p></article><article v-if="chart.ascendant" class="summary"><h3>上升</h3><p>{{ signDescription(chart.ascendant.sign, 'rising') }}</p></article></div>
      <section class="aspects"><h3>主要相位</h3><p v-if="chart.aspects.length === 0" class="muted">本命行星間未找到設定容許度內的主要相位。</p><ul v-else><li v-for="aspect in chart.aspects" :key="`${aspect.first}-${aspect.aspect}-${aspect.second}`"><strong>{{ aspect.first }} × {{ aspect.second }}</strong><span>{{ aspect.aspect }}，容許度 {{ aspect.orb.toFixed(1) }}°</span><small>{{ aspect.meaning }}</small></li></ul></section>
      </section>
      <section id="transits" class="result-block">
      <div class="section-title"><div><h2>近期行運提示</h2></div></div>

      <div class="forecast-grid"><article v-for="forecast in forecasts" :key="forecast.periodLabel" class="forecast"><p class="forecast-label">{{ forecast.periodLabel }}</p><p>{{ forecast.text }}</p><details v-if="forecast.events.length" class="transit-details"><summary>查看 {{ forecast.events.length }} 個相位窗口</summary><ul class="transit-events"><li v-for="event in forecast.events" :key="`${event.transit}-${event.natal}-${event.aspect}-${event.exactAt}`"><strong>{{ event.transit }} × 本命{{ event.natal }}</strong><span>{{ event.aspect }}・{{ formatAt(event.exactAt, chart.timeZone) }}・{{ event.phase }}・{{ event.orb.toFixed(2) }}°</span><small>{{ event.meaning }}</small></li></ul></details></article></div>
      </section>
      <section v-if="annual" id="annual" class="annual-outlook">
        <div class="annual-heading"><div><h2>{{ annual.label }}</h2></div><span>{{ annual.events.length }} 項天象</span></div>
        <div class="annual-grid">
          <article class="annual-card annual-card-wide"><h3>年度天象日曆</h3><p>行運相位已列於上方；這裡補上月相、食相，以及水星至冥王星的停滯轉向。</p><details class="annual-details"><summary>查看 {{ annual.events.length }} 個事件</summary><ul class="annual-events"><li v-for="(event, index) in annual.events" :key="`${event.kind}-${event.exactAt}-${index}`"><strong>{{ event.title }}・{{ event.sign }}</strong><time>{{ formatAt(event.exactAt, place.timeZone) }}</time><small>{{ event.detail }}</small></li></ul></details></article>
          <article v-if="annual.solarReturn" class="annual-card"><h3>太陽回歸盤</h3><p>太陽回到本命黃經的時刻：{{ formatAt(annual.solarReturn.exactAt, returnPlace.timeZone) }}</p><p>計算地點：{{ annual.solarReturn.location }}；上升 {{ annual.solarReturn.ascendant?.sign ?? '出生時間未知' }}，天頂 {{ annual.solarReturn.midheaven?.sign ?? '未計算' }}。</p><ul class="placement-list"><li v-for="planet in annual.solarReturn.planets" :key="`return-${planet.id}`"><strong>{{ planet.name }}</strong><span>{{ planet.sign }}・{{ planet.degree.toFixed(1) }}°・{{ planet.house ? `${planet.house} 宮` : '宮位未知' }}</span></li></ul></article>
          <article class="annual-card"><h3>次限推運</h3><p>採「出生後一日對應一歲」；本命後推日期 {{ annual.progressedAt ? formatAt(annual.progressedAt, chart.timeZone) : '—' }}，推運年齡約 {{ annual.progressedAge?.toFixed(1) ?? '—' }} 歲。</p><ul class="placement-list"><li v-for="planet in annual.progressedPlanets" :key="`progressed-${planet.id}`"><strong>{{ planet.name }}</strong><span>{{ planet.sign }}・{{ planet.degree.toFixed(1) }}°</span></li></ul><h4>推運對本命主要相位</h4><p v-if="!annual.progressedAspects.length">目前設定容許度內沒有主要相位。</p><ul v-else class="aspect-list"><li v-for="aspect in annual.progressedAspects" :key="`${aspect.first}-${aspect.aspect}-${aspect.second}`"><strong>{{ aspect.first }} {{ aspect.aspect }} {{ aspect.second }}（{{ aspect.orb.toFixed(1) }}°）</strong><small>{{ aspect.meaning }}</small></li></ul></article>
          <article v-if="annual.profection" class="annual-card"><h3>年限主題（整宮制）</h3><p>約 {{ annual.profection.age }} 歲：第 {{ annual.profection.house }} 宮・{{ annual.profection.sign }}；年度主星為{{ annual.profection.ruler }}。</p><p>年度焦點：{{ annual.profection.theme }}</p><p>{{ formatAt(annual.profection.from, chart.timeZone) }} 至 {{ formatAt(annual.profection.through, chart.timeZone) }}</p><small>以出生上升星座為第一宮，每年推進一宮；屬年度主題提示。</small></article>
        </div>
        <details class="method annual-method"><summary>年度方法、來源與限制</summary><p v-for="limit in annual.limits" :key="limit">{{ limit }}</p><p>行運位置、月相和全球食相採用 Astronomy Engine；各項日期以事件瞬間換算顯示。城市座標是市中心近似值。行運只列主要五相位，年度相位清單完整列出容許度內項目。</p><p>涵蓋本命行運、月相／日月食、逆順行轉折、太陽回歸、次限推運與年限主題。仍不等於涵蓋所有占星派別或所有技法；占星內容是娛樂與自我反思，不是可驗證的確定預測。</p></details>
      </section>
      <details class="method"><summary>本命星盤計算方法與限制</summary><p>{{ chart.methodSummary }}</p><p>出生位置：{{ place.label }}（{{ place.latitude }}°, {{ place.longitude }}°）。相位容許度：合相／對分 7°、四分／三分 6°、六合 5°。行運對本命十顆行星及（有出生時間時）上升、天頂，以每日步進尋找相位窗口，再細化精確時刻並標示接近／分離狀態。</p><p>本命採熱帶黃道、地心視位置、Whole Sign 整宮制與五種主要相位。行星經度與宮位是占星慣例下的計算結果，解讀因派別而異。</p><p>城市清單使用市中心座標；自訂位置請自行核對座標與 IANA 時區。出生時間未知時以當地中午估算行星落點，隱藏依賴時間的角度與宮位；北緯 66 度以外不提供宮位計算。</p></details>
    </section>
    <aside class="privacy-note">出生資料僅在本機運算，不會儲存或上傳。占星內容供娛樂與自我反思，不保證事件。</aside>
  </div>
</template>

<style scoped>
.divination-app{display:grid;gap:24px;width:min(100% - 32px,960px);margin:0 auto 72px;color:#e4dfd3}.page-head{padding:44px 10px 8px;text-align:center}.forecast-label{margin:0 0 4px;color:#cfb878;font-size:.8125rem}.page-head h1{margin:0;color:#f1e5ca;font-size:clamp(2rem,6vw,3.3rem);font-weight:500}.page-head>p:last-child{color:#bdb9ae}.birth-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;padding:22px;border:1px solid #a48e524b;border-radius:var(--ll-radius-panel);background:#121a21}.birth-form label{display:grid;gap:7px;color:#d4c69f;font-size:.88rem}.birth-form input,.birth-form select{width:100%;min-height:46px;padding:9px 12px;border:1px solid #52606a;border-radius:var(--ll-radius-control);color:#eee8dc;background:#0b1117;font:inherit}.birth-form input:focus-visible,.birth-form select:focus-visible{outline:3px solid #d7bd79;outline-offset:2px}.birth-form input:disabled{opacity:.5}.primary-button{justify-self:start;min-height:48px;padding:0 20px;border:1px solid #b87b68;border-radius:var(--ll-radius-control);color:#fff7ed;background:var(--ll-color-wine);font:650 var(--ll-font-size-body)/1.4 var(--ll-font-body);cursor:pointer}.primary-button:hover{background:var(--ll-color-wine-light)}.primary-button:focus-visible{outline:var(--ll-focus-width) solid var(--ll-color-focus);outline-offset:var(--ll-focus-offset)}.error{grid-column:1/-1;margin:0;color:#ffb7a9}.results{display:grid;gap:18px}.section-title{display:flex;justify-content:space-between;align-items:end}.section-title h2{margin:0;color:#f0e4c6;font-size:1.7rem}.version{color:#99978f;font-size:.75rem}.chart-points{display:flex;flex-wrap:wrap;gap:12px}.point{display:grid;gap:5px;min-width:145px;padding:15px 18px;border:1px solid #b29a5855;border-radius:12px;background:#1b252d}.point small,.point span{color:#bbb5a9}.point strong{color:#efdda9;font-size:1.2rem}.point.unknown{flex:1}.planet-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}.planet{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:13px 16px;border:1px solid #68727a44;border-radius:10px;background:#11191f}.planet>div{display:grid;gap:3px}.planet>div strong{color:#eaddbd}.planet small,.house,.retrograde{color:#aaa99f;font-size:.78rem}.sign{color:#d8c78e}.degree{color:#eee4cf;font-variant-numeric:tabular-nums}.house{grid-column:2}.retrograde{grid-row:1;grid-column:2;justify-self:end;color:#d9a99b}.summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}.summary,.forecast,.aspects,.method{padding:18px 20px;border:1px solid #64707a55;border-radius:var(--ll-radius-panel);background:#121a21}.summary h3,.aspects h3{margin:0 0 8px;color:#e8d8b3}.summary p,.forecast p,.method p{margin:8px 0 0;color:#c5c0b6;line-height:1.75}.aspects ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin:0;padding:0;list-style:none}.aspects li{display:grid;gap:5px;padding:12px;border-radius:9px;background:#0d141a}.aspects li strong{color:#e8d8b3}.aspects li span,.aspects li small,.forecast small{color:#bdb9ae;line-height:1.65}.forecast-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.method summary{color:#dec98f;cursor:pointer}.method p{margin-top:12px}.privacy-note{padding:16px 20px;border-left:2px solid #8c784a;color:#bcb8ae;background:#151c21;line-height:1.7}.muted{color:#aaa}@media(max-width:680px){.birth-form{grid-template-columns:1fr}.error{grid-column:1}.planet-grid,.forecast-grid{grid-template-columns:1fr}.divination-app{width:min(100% - 22px,960px)}}
.precision-toggle{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;border:0}.precision-toggle legend{margin-bottom:8px;color:#d4c69f;font-size:.88rem}.precision-toggle label{display:grid;grid-template-columns:auto 1fr;gap:3px 9px;align-items:center;padding:13px;border:1px solid #52606a;border-radius:10px;background:#0b1117}.precision-toggle input{grid-row:span 2;width:18px;height:18px;accent-color:#c7a859}.precision-toggle small,.birth-form label small{color:#aaa99f;font-size:.78rem;line-height:1.5}.form-help{grid-column:1/-1;margin:0;color:#aaa99f;font-size:.82rem;line-height:1.6}
@media(max-width:680px){.precision-toggle{grid-template-columns:1fr}.form-help{grid-column:1}}
</style>

<style scoped>
.transit-details{margin-top:12px}.transit-details summary{color:#dec98f;cursor:pointer}.transit-events{display:grid;gap:8px;margin:12px 0 0;padding:0;list-style:none}.transit-events li{display:grid;gap:4px;padding:10px;border-radius:9px;background:#0d141a}.transit-events strong{color:#e8d8b3}.transit-events span,.transit-events small{color:#bdb9ae;line-height:1.6}
.annual-outlook{display:grid;gap:14px}.annual-heading{display:flex;align-items:end;justify-content:space-between;gap:16px}.annual-heading h2{margin:0;color:#f0e4c6;font-size:1.65rem}.annual-heading>span{color:#c7b477;font-size:.88rem}.annual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.annual-card{min-width:0;padding:18px 20px;border:1px solid #64707a55;border-radius:var(--ll-radius-panel);background:#121a21}.annual-card-wide{grid-column:1/-1}.annual-card h3{margin:0 0 8px;color:#e8d8b3}.annual-card h4{margin:16px 0 6px;color:#d8c78e}.annual-card p,.annual-card small{color:#bdb9ae;line-height:1.7}.annual-details summary{color:#dec98f;cursor:pointer}.annual-events,.placement-list,.aspect-list{display:grid;gap:8px;margin:12px 0 0;padding:0;list-style:none}.annual-events li{display:grid;grid-template-columns:1fr auto;gap:4px 12px;padding:11px;border-radius:9px;background:#0d141a}.annual-events li strong{color:#e8d8b3}.annual-events time,.annual-events small{color:#aaa99f;font-size:.82rem}.annual-events small{grid-column:1/-1;line-height:1.6}.placement-list{grid-template-columns:repeat(2,minmax(0,1fr))}.placement-list li{display:grid;gap:3px;padding:9px;border-radius:8px;background:#0d141a}.placement-list strong{color:#e8d8b3}.placement-list span,.aspect-list li{color:#bdb9ae;font-size:.83rem;line-height:1.5}.annual-method{margin-top:12px}
@media(max-width:680px){.annual-grid,.placement-list{grid-template-columns:1fr}.annual-card-wide{grid-column:auto}.annual-heading{align-items:start;flex-direction:column}.annual-events li{grid-template-columns:1fr}}
.result-nav{display:flex;flex-wrap:wrap;gap:8px}.result-nav a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid var(--ll-color-control-border);border-radius:999px;color:var(--ll-color-text);text-decoration:none;font-size:var(--ll-font-size-sm)}.result-nav a:hover{border-color:var(--ll-color-gold);color:var(--ll-color-gold-bright)}.result-nav a:focus-visible{outline:var(--ll-focus-width) solid var(--ll-color-focus);outline-offset:var(--ll-focus-offset)}.result-block{display:grid;gap:18px;scroll-margin-top:24px}
</style>
