<script setup lang="ts">
import { computed } from 'vue';
import { TAROT_SPREADS, type TarotSpreadId } from './tarot';

const props = defineProps<{ spread: TarotSpreadId; allowReversed: boolean }>();
const emit = defineEmits<{
  selectSpread: [spread: TarotSpreadId];
  toggleReversed: [allowed: boolean];
  draw: [];
}>();

type ReadingMode = 'quick' | 'daily' | 'deep';
const modeSpreads: Record<ReadingMode, TarotSpreadId[]> = {
  quick: ['single'],
  daily: ['daily'],
  deep: ['past-present-future', 'situation-challenge-advice', 'choice', 'deep-five'],
};
const defaultSpread: Record<ReadingMode, TarotSpreadId> = { quick: 'single', daily: 'daily', deep: 'past-present-future' };
const mode = computed<ReadingMode>(() => props.spread === 'daily' ? 'daily' : props.spread === 'single' ? 'quick' : 'deep');
const options = computed(() => TAROT_SPREADS.filter(option => modeSpreads[mode.value].includes(option.id)));
const modes: Array<{ id: ReadingMode; title: string; description: string }> = [
  { id: 'quick', title: '隨機快抽', description: '一張牌，快速整理當下。' },
  { id: 'daily', title: '今日一抽', description: '今日固定一張，重新開啟仍可查看。' },
  { id: 'deep', title: '深入占卜', description: '用多張牌整理情境、選擇與下一步。' },
];

function selectMode(nextMode: ReadingMode): void {
  emit('selectSpread', defaultSpread[nextMode]);
}
</script>

<template>
  <section class="spread-picker" aria-labelledby="spread-title">
    <div class="spread-picker__heading">
      <h2 id="spread-title">選擇占卜方式</h2>
      <p>先決定閱讀深度。牌面提供象徵性觀點，判斷仍以你的經驗為主。</p>
    </div>
    <div class="mode-options" role="group" aria-label="占卜方式">
      <button v-for="item in modes" :key="item.id" type="button" class="mode-option" :class="{ 'is-selected': mode === item.id }" :aria-pressed="mode === item.id" @click="selectMode(item.id)">
        <strong>{{ item.title }}</strong><span>{{ item.description }}</span>
      </button>
    </div>
    <h3 v-if="mode === 'deep'" class="spread-picker__subhead">選擇深入牌陣</h3>
    <div class="spread-picker__options" role="group" aria-label="塔羅牌陣">
      <button v-for="option in options" :key="option.id" type="button" class="spread-option" :class="{ 'is-selected': props.spread === option.id }" :aria-pressed="props.spread === option.id" @click="emit('selectSpread', option.id)">
        <span class="spread-option__title">{{ option.title }}</span>
        <span class="spread-option__description">{{ option.description }}</span>
      </button>
    </div>
    <label class="reversal-toggle">
      <input type="checkbox" :checked="props.allowReversed" @change="emit('toggleReversed', ($event.target as HTMLInputElement).checked)">
      <span>包含逆位</span>
      <small>逆位代表牌義受阻、內化或需要重新調整，不等同於單純的壞結果。</small>
    </label>
    <button class="draw-button ll-button ll-button--primary" type="button" @click="emit('draw')">洗牌並展開</button>
  </section>
</template>

<style scoped>
.spread-picker { display:grid; gap:20px; padding:clamp(20px,4vw,30px); border:1px solid var(--ll-color-hairline); border-radius:var(--ll-radius-panel); background:var(--ll-color-surface); }
.spread-picker__heading { display:grid; gap:6px; }
.spread-picker__heading h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-2xl); font-weight:500; }
.spread-picker__heading p { margin:0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.6; }
.spread-picker__subhead { margin:0; color:var(--ll-color-text); font-size:var(--ll-font-size-body); font-weight:600; }
.mode-options { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
.mode-option { display:grid; align-content:start; gap:6px; min-height:96px; padding:14px 16px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-control); color:var(--ll-color-text); background:var(--ll-color-background); text-align:left; cursor:pointer; transition:border-color var(--ll-motion-standard), background-color var(--ll-motion-standard); }
.mode-option strong { color:var(--ll-color-gold-bright); font-size:var(--ll-font-size-body); font-weight:650; }
.mode-option span { color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.5; }
.mode-option:hover,.mode-option.is-selected { border-color:var(--ll-color-gold); background:var(--ll-color-surface-raised); }
.mode-option.is-selected { border-color:var(--ll-color-gold-bright); box-shadow:inset 3px 0 0 var(--ll-color-gold-bright); }
.spread-picker__options { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr)); gap:10px; }
.spread-option { display:grid; align-content:start; gap:6px; min-height:96px; padding:14px 16px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-control); color:var(--ll-color-text); background:var(--ll-color-background); text-align:left; cursor:pointer; transition:border-color var(--ll-motion-standard), background-color var(--ll-motion-standard); }
.spread-option:hover,.spread-option.is-selected { border-color:var(--ll-color-gold); background:var(--ll-color-surface-raised); }
.spread-option.is-selected { border-color:var(--ll-color-gold-bright); box-shadow:inset 3px 0 0 var(--ll-color-gold-bright); }
.spread-option__title { color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-lg); }
.spread-option__description { color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.55; }
.mode-option:focus-visible,.spread-option:focus-visible,.draw-button:focus-visible,.reversal-toggle input:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.reversal-toggle { display:grid; grid-template-columns:auto 1fr; gap:2px 10px; align-items:center; color:var(--ll-color-text); }
.reversal-toggle input { width:18px; height:18px; accent-color:var(--ll-color-gold); }
.reversal-toggle small { grid-column:2; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.5; }
.draw-button { justify-self:start; min-width:10em; }
@media (max-width:700px) { .mode-options { grid-template-columns:1fr; } .mode-option { min-height:auto; } }
@media (prefers-reduced-motion:reduce) { .mode-option,.spread-option { transition:none; } }
</style>
