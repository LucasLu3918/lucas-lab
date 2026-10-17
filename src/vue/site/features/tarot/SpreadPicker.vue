<script setup lang="ts">
import { TAROT_SPREADS, type TarotSpreadId } from './tarot';

const props = defineProps<{ spread: TarotSpreadId; allowReversed: boolean }>();
const emit = defineEmits<{
  selectSpread: [spread: TarotSpreadId];
  toggleReversed: [allowed: boolean];
  draw: [];
}>();

</script>

<template>
  <section class="spread-picker" aria-labelledby="spread-title">
    <div class="spread-picker__heading">
      <div><p class="eyebrow">CHOOSE YOUR SPREAD</p><h2 id="spread-title">選擇牌陣</h2></div>
      <p>牌面提供象徵性觀點，請以自身經驗與判斷為主。</p>
    </div>
    <div class="spread-picker__options" role="group" aria-label="塔羅牌陣">
      <button
        v-for="option in TAROT_SPREADS"
        :key="option.id"
        type="button"
        class="spread-option"
        :class="{ 'is-selected': props.spread === option.id }"
        :aria-pressed="props.spread === option.id"
        @click="emit('selectSpread', option.id)"
      >
        <span class="spread-option__title">{{ option.title }}</span>
        <span class="spread-option__description">{{ option.description }}</span>
      </button>
    </div>
    <label class="reversal-toggle">
      <input
        type="checkbox"
        :checked="props.allowReversed"
        @change="emit('toggleReversed', ($event.target as HTMLInputElement).checked)"
      >
      <span>包含逆位</span>
      <small>逆位代表牌義受阻、內化或需要重新調整，不等同於單純的壞結果。</small>
    </label>
    <button class="draw-button" type="button" @click="emit('draw')">洗牌並展開 <span aria-hidden="true">✦</span></button>
  </section>
</template>

<style scoped>
.spread-picker { display:grid; gap:18px; padding:clamp(20px,4vw,32px); border:1px solid #9a84553b; border-radius:20px; background:linear-gradient(135deg,#121c25e8,#0b1118f2); box-shadow:0 16px 42px #0004; }
.spread-picker__heading { display:flex; justify-content:space-between; align-items:end; gap:18px; }
.spread-picker__heading h2 { margin:.15em 0 0; font-size:1.5rem; }
.spread-picker__heading>p { max-width:380px; margin:0; color:#b5b2a8; font-size:.88rem; }
.eyebrow { margin:0; color:#cdb578; font-size:.72rem; letter-spacing:.13em; }
.spread-picker__options { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.spread-option { display:grid; gap:8px; min-height:100px; padding:17px; border:1px solid #64717b73; border-radius:13px; color:#eee5d1; background:#0e151c; text-align:left; cursor:pointer; }
.spread-option:hover,.spread-option.is-selected { border-color:#c3a96e; background:linear-gradient(135deg,#202c34,#131a20); }
.spread-option:focus-visible,.draw-button:focus-visible,.reversal-toggle input:focus-visible { outline:3px solid #f0d59a; outline-offset:3px; }
.spread-option__title { color:#ecd7a7; font-family:var(--font-heading,Georgia,serif); font-size:1.05rem; }
.spread-option__description { color:#b8b6af; font-size:.85rem; line-height:1.55; }
.reversal-toggle { display:grid; grid-template-columns:auto 1fr; gap:2px 10px; align-items:center; color:#e3dccb; }
.reversal-toggle input { width:18px; height:18px; accent-color:#bd9f61; }
.reversal-toggle small { grid-column:2; color:#a7a7a1; line-height:1.5; }
.draw-button { justify-self:start; min-height:48px; padding:0 22px; border:1px solid #d4bc83; border-radius:999px; color:#14130f; background:linear-gradient(135deg,#e0c989,#ad8d50); font-weight:700; cursor:pointer; }
.draw-button:hover { filter:brightness(1.07); }
.draw-button span { margin-left:8px; }
@media (max-width:620px) { .spread-picker__heading { display:grid; } .spread-picker__options { grid-template-columns:1fr; } }
@media (prefers-reduced-motion:reduce) { .spread-option,.draw-button { scroll-behavior:auto; } }
</style>
