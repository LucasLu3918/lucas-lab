<script setup lang="ts">
import { computed, ref } from 'vue';
import { BIRTH_PLACES } from '../divination/locations';
import type { Disambiguation } from '../fortune-core/civil-time';
import PrecisionBadge from '../fortune-core/ui/PrecisionBadge.vue';
import { calculateVedicReport, VEDIC_METHOD_VERSION, type VedicReport } from './vedic';
import { GRAHAS, RASHIS } from './vedic-data';
import { ascendantParagraph, dashaParagraph, dashaRange, integrationParagraph, nakshatraParagraph, upcomingLine } from './interpretation';

const birthDate = ref('');
const birthTime = ref('12:00');
const placeId = ref('taipei');
const unknownTime = ref(false);
const disambiguation = ref<Disambiguation>('earlier');
const report = ref<VedicReport | null>(null);
const calculatedKey = ref('');
const error = ref('');

const formKey = computed(() => JSON.stringify([birthDate.value, birthTime.value, unknownTime.value, placeId.value, disambiguation.value]));
const stale = computed(() => report.value !== null && calculatedKey.value !== formKey.value);
const place = computed(() => BIRTH_PLACES.find(item => item.id === placeId.value) ?? BIRTH_PLACES[0]);
const chart = computed(() => report.value?.data ?? null);

// 吠陀星盤的計算很快（數毫秒），直接在主執行緒完成，不需要 Worker。
function calculate(): void {
  error.value = '';
  try {
    const selected = place.value;
    const next = calculateVedicReport({
      birthDate: birthDate.value,
      birthTime: birthTime.value,
      timeZone: selected.timeZone,
      latitude: selected.latitude,
      longitude: selected.longitude,
      timeUnknown: unknownTime.value,
      disambiguation: disambiguation.value,
    });
    report.value = next;
    calculatedKey.value = formKey.value;
  } catch (cause) {
    report.value = null;
    calculatedKey.value = '';
    error.value = cause instanceof Error ? cause.message : '無法排出星盤，請檢查出生日期與時間。';
  }
}

function formatYears(years: number): string {
  const whole = Math.floor(years);
  const months = Math.round((years - whole) * 12);
  return months === 0 ? `${whole} 年` : `${whole} 年 ${months} 個月`;
}

const asOfText = computed(() => chart.value
  ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeZone: chart.value.timeZone }).format(new Date(chart.value.asOf))
  : '');

const rashiText = RASHIS.map(item => `${item.name}（${item.chinese}）`).join('、');
</script>

<template>
  <div class="vedic-app">
    <header class="page-head">
      <h1>印度占星</h1>
      <p>吠陀占星（Jyotish）以恆星黃道為基礎，重點是月宿（Nakshatra）、維姆歐塔里大運（Vimshottari Dasha）與九曜（Navagraha）。時間越準確，月宿與大運越可靠。</p>
    </header>

    <form class="birth-form" @submit.prevent="calculate">
      <fieldset class="precision-toggle">
        <legend>選擇資料完整度</legend>
        <label><input v-model="unknownTime" type="radio" :value="false" name="vedic-precision">知道出生時間 <small>可計算上升星座與整宮制宮位</small></label>
        <label><input v-model="unknownTime" type="radio" :value="true" name="vedic-precision">時間不確定 <small>月宿與大運以當地中午估算，不顯示上升</small></label>
      </fieldset>
      <label>出生日期<input v-model="birthDate" type="date" required autocomplete="bday"></label>
      <label>出生地點
        <select v-model="placeId"><option v-for="item in BIRTH_PLACES" :key="item.id" :value="item.id">{{ item.label }}</option></select>
        <small>城市使用市中心座標近似；需要精確座標時，請使用占星室的自訂位置。</small>
      </label>
      <label class="time-input">出生時間<input v-model="birthTime" type="time" :disabled="unknownTime" :required="!unknownTime"></label>
      <label v-if="!unknownTime">若出生地當時有夏令時間重複時刻
        <select v-model="disambiguation"><option value="earlier">採較早的一次</option><option value="later">採較晚的一次</option></select>
      </label>
      <button class="primary-button" type="submit">排出吠陀星盤</button>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form>

    <section v-if="chart && report" class="results">
      <p v-if="stale" class="stale-note">表單已修改，下方仍是上次排盤的結果；請重新排盤以更新。</p>
      <nav class="result-nav" aria-label="結果章節"><a href="#nakshatra">月宿</a><a href="#dasha">大運</a><a href="#grahas">九曜</a></nav>

      <section id="nakshatra" class="result-block">
        <div class="section-title"><div><h2>月宿與主星</h2><p class="time-note">以 {{ place.label }} 的當地時間計算，目前大運以 {{ asOfText }} 為準。</p></div><span class="version">{{ report.methodVersion }}</span></div>
        <PrecisionBadge :precision="report.inputPrecision" :reason="chart.timeUnknown ? '出生時間未知，月亮位置以當地中午估算，不計算上升' : '已提供出生時間，計算上升與整宮制宮位'" />
        <div class="chart-points">
          <article class="point"><small>月宿（Nakshatra）</small><strong>{{ chart.moon.nakshatra.name }}</strong><span>{{ chart.moon.nakshatra.meaning }}・第 {{ chart.moon.pada }} 段</span></article>
          <article class="point"><small>月亮</small><strong>{{ chart.moon.sign }}</strong><span>{{ chart.moon.degree.toFixed(1) }}°</span></article>
          <article class="point"><small>宿主星</small><strong>{{ GRAHAS[chart.moon.nakshatra.lord].name }}</strong><span>{{ GRAHAS[chart.moon.nakshatra.lord].keywords }}</span></article>
          <article v-if="chart.lagna" class="point"><small>上升（Lagna）</small><strong>{{ chart.lagna.sign }}</strong><span>{{ chart.lagna.degree.toFixed(1) }}°</span></article>
        </div>
        <p class="copy">{{ nakshatraParagraph(chart) }}</p>
        <p class="copy">{{ ascendantParagraph(chart) }}</p>
      </section>

      <section id="dasha" class="result-block">
        <div class="section-title"><div><h2>維姆歐塔里大運</h2><p class="time-note">出生時的大運為{{ GRAHAS[chart.dasha.birthLord].name }}，剩餘約 {{ formatYears(chart.dasha.remainingYears) }}。</p></div></div>
        <div class="dasha-grid">
          <article class="dasha-card"><h3>目前大運</h3><strong>{{ GRAHAS[chart.dasha.current.planet].name }}</strong><span>{{ dashaRange(chart.dasha.current) }}・共 {{ formatYears(chart.dasha.current.years) }}</span></article>
          <article class="dasha-card"><h3>目前次限</h3><strong>{{ GRAHAS[chart.dasha.antardasha.planet].name }}</strong><span>{{ dashaRange(chart.dasha.antardasha) }}</span></article>
        </div>
        <p class="copy">{{ dashaParagraph(chart) }}</p>
        <p class="copy">{{ integrationParagraph(chart) }}</p>
        <p class="copy">{{ upcomingLine(chart) }}</p>
        <details class="method">
          <summary>這段大運的次限順序</summary>
          <ul class="sub-list">
            <li v-for="item in chart.dasha.antardashas" :key="item.startAt" :class="{ current: item === chart.dasha.antardasha }"><strong>{{ GRAHAS[item.planet].name }}</strong><span>{{ dashaRange(item) }}・約 {{ formatYears(item.years) }}</span></li>
          </ul>
        </details>
      </section>

      <section id="grahas" class="result-block">
        <div class="section-title"><div><h2>九曜落座</h2><p class="time-note">恆星黃道（Lahiri）；{{ chart.timeUnknown ? '宮位未知' : '整宮制宮位，以上升星座為第一宮' }}。</p></div></div>
        <div class="planet-grid">
          <article v-for="graha in chart.grahas" :key="graha.id" class="planet">
            <div><strong>{{ graha.name }}</strong><small>{{ GRAHAS[graha.id].keywords }}</small></div>
            <span class="sign">{{ graha.sign }}</span>
            <strong class="degree">{{ graha.degree.toFixed(1) }}°</strong>
            <span class="house">{{ graha.house ? `${graha.house} 宮` : '宮位未知' }}</span>
            <span v-if="graha.retrograde" class="retrograde">逆行</span>
          </article>
        </div>
        <p class="copy">十二星座（Rashi）依序為{{ rashiText }}。</p>
      </section>

      <details class="method">
        <summary>排盤方法、來源與限制</summary>
        <p>版本 {{ VEDIC_METHOD_VERSION }}。恆星黃道採 Lahiri 歲差，以 J2000.0 的 23°51′11″ 為基準，依 50.29″／年外推（{{ chart.ayanamsa.toFixed(3) }}°）；天體位置為地心視黃道經度，取自 Astronomy Engine。</p>
        <p>月宿以恆星黃道的月亮經度除以 13°20′；大運以月宿內已走過的比例，決定出生時的剩餘年數。大運年數為 9 星合計 120 年，次限依大運年數 × 次限年數 ÷ 120 計算。</p>
        <p>羅睺為北交點、計都為南交點，兩者取平均月交點（Meeus 公式）。整宮制以上升星座為第一宮，只在知道出生時間時計算。城市座標為市中心近似值；月亮約每兩天半換一宮，時間誤差會影響月宿。</p>
        <p>不同傳統與流派在歲差、宮位與大運的細節上有所不同；此處採用最常見的一套規則，內容供娛樂與自我反思，不保證事件，也不取代醫療、法律或財務建議。</p>
      </details>
    </section>
    <aside class="privacy-note">出生資料只在本機運算，不會儲存或上傳。吠陀占星的內容供娛樂與自我反思，不是可驗證的確定預測。</aside>
  </div>
</template>

<style scoped>
.vedic-app{display:grid;gap:24px;width:min(100% - 32px,960px);margin:0 auto 72px;color:#e4dfd3}.page-head{padding:44px 10px 8px;text-align:center}.page-head h1{margin:0;color:#f1e5ca;font-size:clamp(2rem,6vw,3.3rem);font-weight:500}.page-head>p:last-child{color:#bdb9ae}
.birth-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;padding:22px;border:1px solid #a48e524b;border-radius:var(--ll-radius-panel);background:#121a21}.birth-form label{display:grid;gap:7px;color:#d4c69f;font-size:.88rem}.birth-form input,.birth-form select{width:100%;min-height:46px;padding:9px 12px;border:1px solid #52606a;border-radius:var(--ll-radius-control);color:#eee8dc;background:#0b1117;font:inherit}.birth-form input:focus-visible,.birth-form select:focus-visible{outline:3px solid #d7bd79;outline-offset:2px}.birth-form input:disabled{opacity:.5}.birth-form small{color:#aaa99f;font-size:.78rem;line-height:1.5}
.precision-toggle{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:0;padding:0;border:0}.precision-toggle legend{margin-bottom:8px;color:#d4c69f;font-size:.88rem}.precision-toggle label{display:grid;grid-template-columns:auto 1fr;gap:3px 9px;align-items:center;padding:13px;border:1px solid #52606a;border-radius:10px;background:#0b1117}.precision-toggle input{grid-row:span 2;width:18px;height:18px;accent-color:#c7a859}
.primary-button{justify-self:start;min-height:48px;padding:0 20px;border:1px solid #b87b68;border-radius:var(--ll-radius-control);color:#fff7ed;background:var(--ll-color-wine);font:650 var(--ll-font-size-body)/1.4 var(--ll-font-body);cursor:pointer}.primary-button:hover{background:var(--ll-color-wine-light)}.primary-button:focus-visible{outline:var(--ll-focus-width) solid var(--ll-color-focus);outline-offset:var(--ll-focus-offset)}
.error{grid-column:1/-1;margin:0;color:#ffb7a9}.results{display:grid;gap:18px}.result-block{display:grid;gap:14px;scroll-margin-top:24px}.section-title{display:flex;justify-content:space-between;align-items:end;gap:12px}.section-title h2{margin:0;color:#f0e4c6;font-size:1.7rem}.time-note{margin:4px 0 0;color:#aaa99f;font-size:.8125rem}.version{color:#99978f;font-size:.75rem}
.stale-note{margin:0;padding:12px 16px;border-left:2px solid #d9a99b;color:#ecd3c9;background:#2a1f1f;line-height:1.6}
.result-nav{display:flex;flex-wrap:wrap;gap:8px}.result-nav a{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid var(--ll-color-control-border);border-radius:999px;color:var(--ll-color-text);text-decoration:none;font-size:var(--ll-font-size-sm)}.result-nav a:focus-visible{outline:var(--ll-focus-width) solid var(--ll-color-focus);outline-offset:var(--ll-focus-offset)}
.chart-points{display:flex;flex-wrap:wrap;gap:12px}.point,.dasha-card{display:grid;gap:5px;min-width:160px;padding:15px 18px;border:1px solid #b29a5855;border-radius:12px;background:#1b252d}.point small,.point span,.dasha-card span{color:#bbb5a9;font-size:.85rem}.point strong,.dasha-card strong{color:#efdda9;font-size:1.2rem}.dasha-card h3{margin:0;color:#c9b98a;font-size:.85rem;font-weight:500}
.copy{margin:0;color:#c5c0b6;line-height:1.8}
.dasha-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.planet-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px}.planet{display:grid;grid-template-columns:1fr auto;gap:4px 12px;align-items:center;padding:13px 16px;border:1px solid #68727a44;border-radius:10px;background:#11191f}.planet>div{display:grid;gap:3px}.planet>div strong{color:#eaddbd}.planet small,.house,.retrograde{color:#aaa99f;font-size:.78rem}.sign{color:#d8c78e}.degree{color:#eee4cf;font-variant-numeric:tabular-nums}.house{grid-column:2}.retrograde{grid-row:1;grid-column:2;justify-self:end;color:#d9a99b}
.method{padding:18px 20px;border:1px solid #64707a55;border-radius:var(--ll-radius-panel);background:#121a21}.method summary{color:#dec98f;cursor:pointer}.method p{margin:12px 0 0;color:#c5c0b6;line-height:1.75}
.sub-list{display:grid;gap:8px;margin:12px 0 0;padding:0;list-style:none}.sub-list li{display:grid;grid-template-columns:auto 1fr;gap:12px;padding:10px 12px;border-radius:9px;background:#0d141a}.sub-list li.current{outline:1px solid #c7a859}.sub-list strong{color:#e8d8b3}.sub-list span{color:#bdb9ae;font-size:.85rem}
.privacy-note{padding:16px 20px;border-left:2px solid #8c784a;color:#bcb8ae;background:#151c21;line-height:1.7}
@media(max-width:680px){.birth-form,.precision-toggle,.dasha-grid{grid-template-columns:1fr}.planet-grid{grid-template-columns:1fr}.vedic-app{width:min(100% - 22px,960px)}.section-title{flex-direction:column;align-items:start}}
</style>
