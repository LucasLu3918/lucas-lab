<script setup lang="ts">
import { computed, ref } from 'vue';
import { TAROT_CARD_BY_ID, TAROT_DECK, TAROT_CONTENT_VERSION, type TarotCard } from './tarot';

const expanded = ref(false);
const search = ref('');
const group = ref<'all' | 'major' | 'minor'>('all');
const selectedId = ref('');
const filters = [{ id: 'all', name: '全部' }, { id: 'major', name: '大阿爾克那' }, { id: 'minor', name: '小阿爾克那' }] as const;
const selected = computed<TarotCard | undefined>(() => TAROT_CARD_BY_ID.get(selectedId.value));
const matches = computed(() => {
  const term = search.value.trim().toLocaleLowerCase();
  return TAROT_DECK.filter(card => (group.value === 'all' || card.arcana === group.value)
    && (!term || `${card.name} ${card.englishName} ${card.suitLabel ?? ''} ${card.keywords.upright.join(' ')} ${card.keywords.reversed.join(' ')}`.toLocaleLowerCase().includes(term)));
});
</script>

<template>
  <section class="card-library" aria-labelledby="card-library-title">
    <div class="card-library__heading">
      <div><p class="eyebrow">THE 78 CARDS · {{ TAROT_CONTENT_VERSION }}</p><h2 id="card-library-title">牌義索引</h2></div>
      <button class="library-toggle" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? '收起牌義索引' : '瀏覽 78 張牌' }}</button>
    </div>
    <div v-if="expanded" class="card-library__body">
      <label class="card-library__search">搜尋牌名或關鍵字<input v-model="search" type="search" placeholder="例如：The Star、希望" autocomplete="off"></label>
      <div class="card-library__filters" role="group" aria-label="篩選牌組">
        <button v-for="option in filters" :key="option.id" type="button" :aria-pressed="group === option.id" @click="group = option.id">{{ option.name }}</button>
      </div>
      <p class="card-library__count" aria-live="polite">顯示 {{ matches.length }} 張牌</p>
      <ul class="card-library__cards">
        <li v-for="card in matches" :key="card.id"><button type="button" :aria-pressed="selectedId === card.id" @click="selectedId = selectedId === card.id ? '' : card.id">{{ card.name }}<small>{{ card.englishName }}</small></button></li>
      </ul>
      <article v-if="selected" class="card-library__detail" aria-live="polite">
        <h3>{{ selected.name }} <small>{{ selected.englishName }}</small></h3>
        <p><strong>正位：</strong>{{ selected.meanings.upright }}</p>
        <p><strong>逆位：</strong>{{ selected.meanings.reversed }}</p>
      </article>
      <p v-else class="card-library__hint">選擇一張牌即可查看固定正逆位牌義。</p>
    </div>
  </section>
</template>

<style scoped>
.card-library { padding:22px clamp(18px,4vw,28px); border:1px solid #82734a42; border-radius:16px; background:#0e151c; }
.card-library__heading { display:flex; justify-content:space-between; align-items:center; gap:14px; }
.eyebrow { margin:0; color:#cdb578; font-size:.7rem; letter-spacing:.12em; }
.card-library h2 { margin:.25em 0 0; color:#ead9b5; font:500 1.35rem var(--font-heading,Georgia,serif); }
.library-toggle,.card-library__filters button { min-height:44px; padding:0 14px; border:1px solid #82734a; border-radius:999px; color:#dfd5c0; background:transparent; cursor:pointer; }
.library-toggle:hover,.card-library__filters button[aria-pressed=true] { border-color:#d6bf89; color:#f2e5c6; background:#26313a; }
.library-toggle:focus-visible,.card-library button:focus-visible,.card-library input:focus-visible { outline:3px solid #f0d59a; outline-offset:3px; }
.card-library__body { display:grid; gap:14px; margin-top:18px; }
.card-library__search { display:grid; gap:7px; color:#b8b5aa; font-size:.88rem; }
.card-library__search input { min-height:44px; padding:8px 12px; border:1px solid #53606a; border-radius:9px; color:#eee5d1; background:#0a1016; font:inherit; }
.card-library__filters { display:flex; flex-wrap:wrap; gap:8px; }
.card-library__count,.card-library__hint { margin:0; color:#aaa99f; font-size:.85rem; }
.card-library__cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:7px; max-height:320px; overflow:auto; margin:0; padding:0; list-style:none; }
.card-library__cards button { display:grid; align-content:center; gap:3px; width:100%; min-height:48px; padding:7px 10px; border:1px solid #ffffff1b; border-radius:8px; color:#e8dfce; background:#141d24; text-align:left; cursor:pointer; }
.card-library__cards button[aria-pressed=true] { border-color:#c6a966; background:#202a31; }
.card-library__cards small,.card-library__detail small { color:#aaa99f; font-size:.74em; font-weight:400; }
.card-library__detail { padding:16px; border-left:2px solid #bd9f61; background:#151f27; }
.card-library__detail h3 { margin:0 0 10px; color:#f1e5c9; font-size:1.1rem; }
.card-library__detail p { margin:7px 0; color:#ded9ce; line-height:1.7; }
@media(max-width:520px) { .card-library__heading { align-items:flex-start; flex-direction:column; } }
</style>
