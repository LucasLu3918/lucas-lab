<script setup lang="ts">
import type { TarotCard, TarotOrientation } from './tarot';

defineProps<{
  card: TarotCard | null;
  orientation: TarotOrientation | null;
  position: string;
  index: number;
  revealed: boolean;
}>();

const emit = defineEmits<{ reveal: [index: number] }>();
</script>

<template>
  <div class="drawn-card">
    <p class="drawn-card__position">{{ position }}</p>
    <button
      v-if="!revealed"
      class="tarot-card tarot-card--back"
      type="button"
      :aria-label="`揭開${position}的牌`"
      @click="emit('reveal', index)"
    >
      <span class="tarot-card__frame" aria-hidden="true">
        <span class="tarot-card__moon">☾</span>
        <span class="tarot-card__ornament">✧</span>
        <span class="tarot-card__instruction">點選揭牌</span>
      </span>
    </button>
    <article v-else class="tarot-card tarot-card--front" :class="{ 'is-reversed': orientation === 'reversed' }">
      <span class="tarot-card__frame">
        <span class="tarot-card__number">{{ card?.number }}</span>
        <span class="tarot-card__symbol" aria-hidden="true">{{ card?.symbol }}</span>
        <span class="tarot-card__name">{{ card?.name }}</span>
        <span class="tarot-card__english">{{ card?.englishName }}</span>
      </span>
    </article>
  </div>
</template>

<style scoped>
.drawn-card { display:grid; justify-items:center; gap:10px; min-width:0; }
.drawn-card__position { min-height:1.5em; margin:0; color:#d4bd89; font-size:.9rem; text-align:center; }
.tarot-card { position:relative; display:grid; width:min(100%,220px); aspect-ratio:2 / 3; padding:10px; border:1px solid #bd9f61; border-radius:15px; color:#f4e8cf; background:linear-gradient(145deg,#182533,#080d13 72%); box-shadow:0 16px 36px #0008,inset 0 0 0 4px #111a22,inset 0 0 0 5px #bd9f614d; text-align:center; }
button.tarot-card { cursor:pointer; transition:transform .24s ease,border-color .24s,box-shadow .24s; }
button.tarot-card:hover { transform:translateY(-4px); border-color:#f2dca9; box-shadow:0 20px 40px #0009,0 0 24px #bd9f6133,inset 0 0 0 4px #111a22,inset 0 0 0 5px #bd9f6170; }
.tarot-card:focus-visible { outline:3px solid #f0d59a; outline-offset:4px; }
.tarot-card__frame { display:flex; flex-direction:column; align-items:center; justify-content:space-between; min-width:0; padding:14px 10px; border:1px solid #d2b87373; border-radius:8px; background:radial-gradient(ellipse at 50% 44%,#293741 0,#121a20 55%,#0b1118 100%); }
.tarot-card--back .tarot-card__frame { position:relative; overflow:hidden; justify-content:center; gap:18px; background:radial-gradient(circle at 50% 45%,#283843,#0c1319 72%); }
.tarot-card--back .tarot-card__frame::before,.tarot-card--back .tarot-card__frame::after { position:absolute; inset:12px; border:1px solid #bd9f614f; border-radius:50%; content:""; }
.tarot-card--back .tarot-card__frame::after { inset:28px; border-style:dashed; transform:rotate(22deg); }
.tarot-card__moon { color:#eddaac; font-size:3.2rem; line-height:1; text-shadow:0 0 24px #d8bb7959; }
.tarot-card__ornament { color:#bd9f61; font-size:1.8rem; }
.tarot-card__instruction { color:#d6c5a0; font-size:.82rem; }
.tarot-card__number { align-self:flex-start; color:#cfb578; font-size:.76rem; }
.tarot-card__symbol { display:grid; flex:1; place-items:center; color:#e7d29c; font-size:3.5rem; text-shadow:0 0 24px #bd9f6152; }
.tarot-card__name { font-family:var(--font-heading,Georgia,serif); font-size:1.1rem; }
.tarot-card__english { color:#b6a987; font-size:.68rem; letter-spacing:.04em; }
.tarot-card--front.is-reversed .tarot-card__frame { transform:rotate(180deg); }
@media (prefers-reduced-motion:reduce) { button.tarot-card { transition:none; } button.tarot-card:hover { transform:none; } }
</style>
