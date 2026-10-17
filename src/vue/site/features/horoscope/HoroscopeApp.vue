<script setup lang="ts">
import { computed, ref } from 'vue';
import { createDailyHoroscope, localDayKey } from './horoscope';
import { HOROSCOPE_SIGNS, findHoroscopeSign, sunSignFromBirthDate, type HoroscopeSignId } from './signs';

const today = localDayKey();
const signId = ref<HoroscopeSignId | ''>('');
const birthDate = ref('');
const birthError = ref('');
const reading = computed(() => (signId.value ? createDailyHoroscope(today, signId.value) : null));
const todayLabel = computed(() => {
  const [year, month, day] = today.split('-').map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
});

function applyBirthDate() {
  birthError.value = '';
  if (!birthDate.value) return;
  try {
    signId.value = sunSignFromBirthDate(birthDate.value);
  } catch (error) {
    birthError.value = error instanceof Error ? error.message : '日期無法辨識。';
  }
}

function signSymbol(id: HoroscopeSignId) {
  return findHoroscopeSign(id).symbol;
}
</script>

<template>
  <div class="horoscope">
    <header class="horoscope-hero">
      <h1>星座運勢</h1>
      <p>選擇太陽星座，查看今天的整體、感情、事業、財務與健康五個面向。內容由固定的原創文案組合而成，供娛樂與自我反思。</p>
    </header>

    <section class="picker" aria-labelledby="sign-picker-title">
      <h2 id="sign-picker-title">選擇你的星座</h2>
      <div class="picker-row">
        <label class="field">
          <span>星座</span>
          <select v-model="signId" name="horoscope-sign">
            <option value="" disabled>請選擇</option>
            <option v-for="sign in HOROSCOPE_SIGNS" :key="sign.id" :value="sign.id">{{ sign.symbol }} {{ sign.name }}</option>
          </select>
        </label>
        <label class="field">
          <span>或輸入生日推算</span>
          <input v-model="birthDate" type="date" name="horoscope-birthdate" @change="applyBirthDate">
        </label>
      </div>
      <p class="hint">生日只用於判斷太陽星座，只在本機計算，不會儲存或上傳。</p>
      <p v-if="birthError" class="error" role="alert">{{ birthError }}</p>
    </section>

    <section v-if="reading" class="reading" aria-live="polite" aria-labelledby="reading-title">
      <header class="reading-head">
        <span class="reading-symbol" aria-hidden="true">{{ signSymbol(reading.sign) }}</span>
        <div>
          <h2 id="reading-title">{{ reading.signName }}｜今日運勢</h2>
          <p class="muted">{{ todayLabel }}</p>
        </div>
      </header>

      <div class="sections">
        <article v-for="section in reading.sections" :key="section.id" class="card">
          <h3>{{ section.title }}</h3>
          <p>{{ section.text }}</p>
        </article>
      </div>

      <div class="guide">
        <div class="guide-item">
          <span>幸運色</span>
          <strong>{{ reading.lucky.color }}</strong>
        </div>
        <div class="guide-item">
          <span>幸運時段</span>
          <strong>{{ reading.lucky.time }}</strong>
        </div>
        <div class="guide-item">
          <span>幸運數字</span>
          <strong>{{ reading.lucky.number }}</strong>
        </div>
      </div>

      <aside class="tip">
        <strong>每日提示</strong>
        <p>{{ reading.tip }}</p>
      </aside>

      <p class="footnote">內容依固定規則與原創文案組合，不保證事件發生，也不取代醫療、法律或財務專業建議。內容版本 {{ reading.contentVersion }}。</p>
    </section>

    <section v-else class="empty" aria-live="polite">
      <p>請先選擇星座，今日運勢會顯示在這裡。</p>
    </section>
  </div>
</template>

<style scoped>
.horoscope { display:grid; gap:clamp(24px,4vw,36px); width:min(100% - 32px,920px); margin:0 auto 72px; color:var(--ll-color-text); }
.horoscope-hero { display:grid; justify-items:center; gap:12px; padding:clamp(36px,7vw,64px) 0 clamp(4px,1vw,8px); text-align:center; }
.horoscope-hero h1 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:clamp(2.25rem,6vw,3.25rem); font-weight:500; line-height:1.2; letter-spacing:0.06em; }
.horoscope-hero p { max-width:36em; margin:0; color:var(--ll-color-text-muted); font-size:clamp(1rem,2.4vw,1.0625rem); line-height:1.8; }
.picker { display:grid; gap:12px; padding:22px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-panel); background:var(--ll-color-surface); }
.picker h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-xl); font-weight:500; }
.picker-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr)); gap:14px; }
.field { display:grid; gap:6px; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.field select, .field input { min-height:44px; padding:0 12px; border:1px solid var(--ll-color-control-border); border-radius:8px; color:var(--ll-color-text); background:var(--ll-color-bg, transparent); font:inherit; }
.field select:focus-visible, .field input:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.hint, .footnote, .muted { margin:0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.75; }
.error { margin:0; color:var(--ll-color-gold-bright); font-size:var(--ll-font-size-sm); }
.reading { display:grid; gap:20px; }
.reading-head { display:grid; grid-template-columns:auto minmax(0,1fr); gap:16px; align-items:center; }
.reading-symbol { display:grid; place-items:center; width:56px; height:56px; border:1px solid var(--ll-color-gold); border-radius:50%; color:var(--ll-color-gold); font-size:1.75rem; }
.reading-head h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:clamp(1.5rem,4vw,2rem); font-weight:500; }
.sections { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr)); gap:12px; }
.card { display:grid; gap:8px; padding:20px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-panel); background:var(--ll-color-surface); }
.card h3 { margin:0; color:var(--ll-color-gold); font-size:var(--ll-font-size-body); font-weight:600; }
.card p { margin:0; color:var(--ll-color-text); font-size:var(--ll-font-size-body); line-height:1.8; }
.guide { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr)); gap:12px; }
.guide-item { display:grid; gap:4px; padding:16px 18px; border-left:2px solid var(--ll-color-gold); }
.guide-item span { color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.guide-item strong { color:var(--ll-color-gold-bright); font-size:var(--ll-font-size-body); font-weight:600; }
.tip { display:grid; gap:6px; padding-left:16px; border-left:2px solid var(--ll-color-control-border); }
.tip strong { color:var(--ll-color-gold); font-weight:600; }
.tip p { margin:0; color:var(--ll-color-text); line-height:1.8; }
.empty { padding:32px 0; color:var(--ll-color-text-muted); text-align:center; }
.empty p { margin:0; }
</style>
