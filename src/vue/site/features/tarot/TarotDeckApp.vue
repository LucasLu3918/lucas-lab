<script setup lang="ts">
import { computed, inject, ref, shallowRef } from 'vue';
import { cardArtUrl, cardSource, TAROT_ART_BASE_KEY } from './tarotArt';
import { TAROT_CONTENT_VERSION, TAROT_DECK, type TarotCard, type TarotSuitId } from './tarot';

type DeckFilter = 'all' | 'major' | TarotSuitId;
const artBase = inject(TAROT_ART_BASE_KEY, '');
const filters: Array<{ id: DeckFilter; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'major', label: '大阿爾克那' },
  { id: 'wands', label: '權杖' },
  { id: 'cups', label: '聖杯' },
  { id: 'swords', label: '寶劍' },
  { id: 'pentacles', label: '錢幣' },
];

const filter = shallowRef<DeckFilter>('all');
const search = shallowRef('');
const selectedId = shallowRef('');
const dialog = ref<HTMLDialogElement | null>(null);
let opener: HTMLElement | null = null;

const filtered = computed<TarotCard[]>(() => {
  const term = search.value.trim().toLocaleLowerCase();
  return TAROT_DECK.filter(card => {
    if (filter.value === 'major' && card.arcana !== 'major') return false;
    if (filter.value !== 'all' && filter.value !== 'major' && card.suit !== filter.value) return false;
    if (!term) return true;
    const haystack = [card.name, card.englishName, card.suitLabel ?? '', cardSource(card), ...card.keywords.upright, ...card.keywords.reversed]
      .join(' ')
      .toLocaleLowerCase();
    return haystack.includes(term);
  });
});

const selectedIndex = computed(() => filtered.value.findIndex(card => card.id === selectedId.value));
const selected = computed<TarotCard | undefined>(() => (selectedIndex.value >= 0 ? filtered.value[selectedIndex.value] : undefined));

function arcanaLabel(card: TarotCard): string {
  return card.arcana === 'major' ? '大阿爾克那' : `小阿爾克那・${card.suitLabel}`;
}

function openCard(card: TarotCard, event: MouseEvent): void {
  opener = event.currentTarget as HTMLElement;
  selectedId.value = card.id;
  dialog.value?.showModal();
}

function step(delta: number): void {
  const next = filtered.value[selectedIndex.value + delta];
  if (next) selectedId.value = next.id;
}

function onDialogKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft') step(-1);
  if (event.key === 'ArrowRight') step(1);
}

function onDialogClose(): void {
  opener?.focus();
  opener = null;
}
</script>

<template>
  <div class="deck-app">
    <a class="deck-back" href="../">回到星夜塔羅</a>

    <header class="deck-hero">
      <h1>牌庫</h1>
      <p class="deck-hero__lead">一套 78 張牌，每張都以童話的場景畫成，並附上正逆位牌義。點選任一張可放大檢視。</p>
      <p class="deck-hero__note">牌義版本 {{ TAROT_CONTENT_VERSION }}。插畫由本機模型生成，風格統一，僅供閱讀與自我反思。</p>
    </header>

    <section class="deck-tools" aria-label="篩選與搜尋">
      <label class="deck-search">搜尋牌名、關鍵字或童話<input v-model="search" type="search" placeholder="例如：星星、希望、紅帽" autocomplete="off"></label>
      <div class="deck-filters" role="group" aria-label="篩選牌組">
        <button v-for="item in filters" :key="item.id" type="button" :aria-pressed="filter === item.id" @click="filter = item.id">{{ item.label }}</button>
      </div>
      <p class="deck-count" aria-live="polite">顯示 {{ filtered.length }} 張牌</p>
    </section>

    <ul class="deck-grid">
      <li v-for="card in filtered" :key="card.id">
        <button class="deck-card" type="button" :aria-label="`${card.name}（${card.englishName}）`" @click="openCard(card, $event)">
          <span class="deck-card__frame">
            <img :src="cardArtUrl(artBase, card)" alt="" width="288" height="432" loading="lazy" decoding="async">
          </span>
          <span class="deck-card__name">{{ card.name }}</span>
          <span class="deck-card__english">{{ card.englishName }}</span>
        </button>
      </li>
    </ul>
    <p v-if="!filtered.length" class="deck-empty">沒有符合條件的牌。試試其他關鍵字，或切換牌組。</p>

    <dialog ref="dialog" class="deck-dialog" aria-labelledby="deck-dialog-title" @keydown="onDialogKeydown" @close="onDialogClose">
      <div v-if="selected" class="deck-dialog__inner">
        <figure class="deck-dialog__art"><img :src="cardArtUrl(artBase, selected)" :alt="`${selected.name}的插畫`" width="576" height="864" decoding="async"></figure>
        <div class="deck-dialog__body">
          <p class="deck-dialog__meta">{{ selected.number }}・{{ arcanaLabel(selected) }}</p>
          <h2 id="deck-dialog-title">{{ selected.name }} <small>{{ selected.englishName }}</small></h2>
          <p class="deck-dialog__source">童話藍本：{{ cardSource(selected) }}</p>
          <h3>正位</h3>
          <ul class="deck-dialog__keywords" aria-label="正位關鍵字"><li v-for="keyword in selected.keywords.upright" :key="keyword">{{ keyword }}</li></ul>
          <p>{{ selected.meanings.upright }}</p>
          <h3>逆位</h3>
          <ul class="deck-dialog__keywords" aria-label="逆位關鍵字"><li v-for="keyword in selected.keywords.reversed" :key="keyword">{{ keyword }}</li></ul>
          <p>{{ selected.meanings.reversed }}</p>
          <nav class="deck-dialog__nav" aria-label="前後切換">
            <button type="button" :disabled="selectedIndex <= 0" @click="step(-1)">上一張</button>
            <span>{{ selectedIndex + 1 }} / {{ filtered.length }}</span>
            <button type="button" :disabled="selectedIndex >= filtered.length - 1" @click="step(1)">下一張</button>
          </nav>
        </div>
      </div>
      <form method="dialog" class="deck-dialog__close-form"><button type="submit" class="deck-dialog__close">關閉</button></form>
    </dialog>
  </div>
</template>

<style scoped>
.deck-app { display:grid; gap:clamp(28px,4vw,40px); width:min(100% - 32px,1100px); margin:0 auto 72px; color:var(--ll-color-text); }
.deck-back { justify-self:start; margin-top:8px; padding:6px 0; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); text-underline-offset:4px; }
.deck-back:hover { color:var(--ll-color-gold-bright); }
.deck-back:focus-visible,.deck-search input:focus-visible,.deck-filters button:focus-visible,.deck-card:focus-visible,.deck-dialog button:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.deck-hero { display:grid; justify-items:center; gap:12px; padding:clamp(8px,3vw,20px) 0 clamp(20px,4vw,32px); border-bottom:1px solid var(--ll-color-hairline); text-align:center; background:radial-gradient(ellipse closest-side at 50% 40%,rgb(44 64 82 / 0.4) 0,transparent 100%); }
.deck-hero h1 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:clamp(2.25rem,6vw,3.25rem); font-weight:500; line-height:1.2; letter-spacing:0.06em; }
.deck-hero__lead { max-width:38em; margin:0; color:var(--ll-color-text); font-size:clamp(1rem,2.2vw,1.0625rem); line-height:1.8; }
.deck-hero__note { max-width:40em; margin:0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); line-height:1.7; }
.deck-tools { display:grid; gap:14px; }
.deck-search { display:grid; gap:8px; color:var(--ll-color-text); font-size:var(--ll-font-size-sm); }
.deck-search input { min-height:48px; padding:10px 14px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-control); color:var(--ll-color-text); background:var(--ll-color-background); font:inherit; }
.deck-filters { display:flex; flex-wrap:wrap; gap:8px; }
.deck-filters button { min-height:44px; padding:0 16px; border:1px solid var(--ll-color-control-border); border-radius:999px; color:var(--ll-color-text); background:transparent; cursor:pointer; }
.deck-filters button:hover { border-color:var(--ll-color-gold); }
.deck-filters button[aria-pressed=true] { border-color:var(--ll-color-gold-bright); color:var(--ll-color-gold-bright); background:var(--ll-color-surface-raised); box-shadow:inset 0 -2px 0 var(--ll-color-gold-bright); }
.deck-count,.deck-empty { margin:0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.deck-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:clamp(12px,2vw,20px); margin:0; padding:0; list-style:none; }
.deck-card { display:grid; gap:6px; width:100%; padding:0; border:0; color:var(--ll-color-text); background:transparent; text-align:left; cursor:pointer; }
.deck-card__frame { display:block; aspect-ratio:2 / 3; overflow:hidden; border:1px solid var(--ll-color-control-border); border-radius:8px; background:#0a1119; transition:border-color var(--ll-motion-standard), transform var(--ll-motion-standard); }
.deck-card:hover .deck-card__frame { border-color:var(--ll-color-gold-bright); }
.deck-card img { display:block; width:100%; height:100%; object-fit:cover; }
.deck-card__name { color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-body); line-height:1.3; }
.deck-card__english { color:var(--ll-color-text-muted); font-size:var(--ll-font-size-xs); line-height:1.3; }
.deck-dialog { width:min(100% - 24px,960px); max-height:calc(100dvh - 32px); padding:0; border:1px solid var(--ll-color-gold); border-radius:var(--ll-radius-panel); color:var(--ll-color-text); background:var(--ll-color-surface); }
.deck-dialog::backdrop { background:rgb(4 8 13 / 0.82); }
.deck-dialog__inner { display:grid; grid-template-columns:minmax(0,5fr) minmax(0,6fr); gap:clamp(18px,3vw,32px); padding:clamp(18px,3vw,28px); }
.deck-dialog__art { margin:0; overflow:hidden; border:1px solid var(--ll-color-control-border); border-radius:8px; background:#0a1119; }
.deck-dialog__art img { display:block; width:100%; height:auto; }
.deck-dialog__body { display:grid; align-content:start; gap:10px; min-width:0; }
.deck-dialog__meta { margin:0; color:var(--ll-color-gold); font-size:var(--ll-font-size-sm); }
.deck-dialog h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-2xl); font-weight:500; }
.deck-dialog h2 small { color:var(--ll-color-text-muted); font-family:var(--ll-font-body); font-size:var(--ll-font-size-sm); font-weight:400; }
.deck-dialog__source { margin:0; padding-left:12px; border-left:2px solid var(--ll-color-control-border); color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.deck-dialog h3 { margin:8px 0 0; color:var(--ll-color-gold); font-size:var(--ll-font-size-body); font-weight:600; }
.deck-dialog p { margin:0; line-height:1.75; }
.deck-dialog__keywords { display:flex; flex-wrap:wrap; gap:6px; margin:0; padding:0; list-style:none; }
.deck-dialog__keywords li { padding:3px 10px; border:1px solid var(--ll-color-control-border); border-radius:999px; color:var(--ll-color-gold); font-size:var(--ll-font-size-xs); }
.deck-dialog__nav { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:12px; padding-top:14px; border-top:1px solid var(--ll-color-hairline); color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.deck-dialog__nav button,.deck-dialog__close { min-height:44px; padding:0 16px; border:1px solid var(--ll-color-control-border); border-radius:var(--ll-radius-control); color:var(--ll-color-text); background:transparent; cursor:pointer; }
.deck-dialog__nav button:hover:not(:disabled),.deck-dialog__close:hover { border-color:var(--ll-color-gold); background:var(--ll-color-surface-raised); }
.deck-dialog__nav button:disabled { opacity:0.45; cursor:not-allowed; }
.deck-dialog__close-form { position:absolute; top:10px; right:10px; margin:0; }
@media (max-width:700px) { .deck-dialog__inner { grid-template-columns:1fr; } .deck-dialog__art { max-width:280px; justify-self:center; width:100%; } }
@media (prefers-reduced-motion:reduce) { .deck-card__frame { transition:none; } }
</style>
