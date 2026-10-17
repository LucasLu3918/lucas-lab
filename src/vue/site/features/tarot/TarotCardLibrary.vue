<script setup lang="ts">
import { inject } from 'vue';
import { cardArtUrl, TAROT_ART_BASE_KEY } from './tarotArt';
import { TAROT_CARD_BY_ID, TAROT_CONTENT_VERSION, type TarotCard } from './tarot';

const artBase = inject(TAROT_ART_BASE_KEY, '');
// A few cards from across the deck: the Fool, the Star, the Ace of Cups, the Ten of Swords, the King of Pentacles.
const picks = [
  'major-00-the-fool',
  'major-17-the-star',
  'minor-cups-01-ace',
  'minor-swords-10-ten',
  'minor-pentacles-14-king',
  'major-20-judgement',
]
  .map(id => TAROT_CARD_BY_ID.get(id))
  .filter((card): card is TarotCard => Boolean(card));
</script>

<template>
  <section class="card-library" aria-labelledby="card-library-title">
    <div class="card-library__heading">
      <div>
        <h2 id="card-library-title">牌庫</h2>
        <p class="card-library__meta">78 張牌・牌義版本 {{ TAROT_CONTENT_VERSION }}</p>
      </div>
      <a class="library-link" href="deck/">開啟完整牌庫</a>
    </div>
    <p class="card-library__lead">每張牌都有童話場景的插畫，並附正逆位牌義。可依牌組篩選，也能搜尋關鍵字。</p>
    <ul class="card-library__picks">
      <li v-for="card in picks" :key="card.id">
        <a href="deck/" :aria-label="`在牌庫中查看${card.name}`">
          <img :src="cardArtUrl(artBase, card)" alt="" width="288" height="432" loading="lazy" decoding="async">
        </a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.card-library { display:grid; gap:16px; padding-top:24px; border-top:1px solid var(--ll-color-hairline); }
.card-library__heading { display:flex; justify-content:space-between; align-items:center; gap:14px; }
.card-library h2 { margin:0; color:var(--ll-color-gold-bright); font-family:var(--ll-font-display); font-size:var(--ll-font-size-xl); font-weight:500; }
.card-library__meta { margin:4px 0 0; color:var(--ll-color-text-muted); font-size:var(--ll-font-size-sm); }
.card-library__lead { margin:0; color:var(--ll-color-text); line-height:1.7; }
.library-link { display:inline-flex; align-items:center; min-height:44px; padding:0 16px; border:1px solid var(--ll-color-gold); border-radius:var(--ll-radius-control); color:var(--ll-color-gold-bright); text-decoration:none; }
.library-link:hover { background:var(--ll-color-surface-raised); }
.library-link:focus-visible,.card-library__picks a:focus-visible { outline:var(--ll-focus-width) solid var(--ll-color-focus); outline-offset:var(--ll-focus-offset); }
.card-library__picks { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:10px; margin:0; padding:0; list-style:none; }
.card-library__picks img { display:block; width:100%; aspect-ratio:2 / 3; object-fit:cover; border:1px solid var(--ll-color-control-border); border-radius:6px; }
.card-library__picks a { display:block; border-radius:6px; }
@media (max-width:620px) { .card-library__heading { align-items:flex-start; flex-direction:column; } .card-library__picks { grid-template-columns:repeat(3,minmax(0,1fr)); } }
</style>
