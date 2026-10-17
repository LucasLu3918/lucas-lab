<script setup lang="ts">
import { onMounted, shallowRef } from 'vue';
import { localDayKey } from '../fortune-core/civil-time';
import type { HoroscopeReading } from '../horoscope/horoscope';
import { HOROSCOPE_SIGNS, type HoroscopeSignId } from '../horoscope/signs';
import { parseHoroscopeSign, rememberSign, rememberedSign, todaysDailyDraw } from './today';
import { DIVINATION_HUB } from './modules';

interface DailyDrawView {
  name: string;
  orientation: string;
}

// Computed once per visit; the same local day key is used for the tarot draw and the horoscope so both agree.
const localDay = localDayKey();
const todayLabel = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'full' }).format(new Date());
// undefined while the saved history loads; null when nothing has been drawn today.
const draw = shallowRef<DailyDrawView | null | undefined>(undefined);
const drawFailed = shallowRef(false);
const sign = shallowRef<HoroscopeSignId | null>(null);
const reading = shallowRef<HoroscopeReading | null>(null);
// Only the newest selection may write the reading, so a slow earlier request cannot overwrite a later choice.
let horoscopeRequest = 0;

async function loadDailyDraw(): Promise<void> {
  const [{ readTarotHistory }, { findTarotCard }] = await Promise.all([
    import('../tarot/TarotHistoryRepository'),
    import('../tarot/tarot'),
  ]);
  const entry = todaysDailyDraw(readTarotHistory(), localDay);
  const saved = entry?.cards[0];
  const card = saved ? findTarotCard(saved.cardId) : undefined;
  draw.value = saved && card
    ? { name: card.name, orientation: saved.orientation === 'upright' ? '正位' : '逆位' }
    : null;
}

async function chooseSign(id: HoroscopeSignId | null): Promise<void> {
  const request = ++horoscopeRequest;
  sign.value = id;
  if (!id) {
    reading.value = null;
    return;
  }
  rememberSign(id);
  const { createDailyHoroscope } = await import('../horoscope/horoscope');
  if (request === horoscopeRequest) reading.value = createDailyHoroscope(localDay, id);
}

function onSignChange(event: Event): void {
  void chooseSign(parseHoroscopeSign((event.target as HTMLSelectElement).value));
}

onMounted(() => {
  loadDailyDraw().catch(() => {
    drawFailed.value = true;
  });
  const remembered = rememberedSign();
  if (remembered) void chooseSign(remembered);
});
</script>

<template>
  <section class="today" aria-labelledby="today-title">
    <header class="today__heading">
      <p class="today__date">{{ todayLabel }}</p>
      <h2 id="today-title">{{ DIVINATION_HUB.overview.title }}</h2>
      <p class="today__note">{{ DIVINATION_HUB.overview.note }}</p>
    </header>
    <div class="today__cards">
      <article class="today-card" aria-labelledby="today-draw-title">
        <h3 id="today-draw-title">今日一抽</h3>
        <p v-if="drawFailed">暫時無法讀取今日紀錄，請重新整理後再試。</p>
        <p v-else-if="draw === undefined">讀取中…</p>
        <p v-else-if="draw">{{ draw.name }}（{{ draw.orientation }}）</p>
        <p v-else>今天還沒有抽牌。</p>
        <a class="today-card__link" href="../tarot/">{{ draw ? '查看今日牌卡' : '前往每日一抽' }}</a>
      </article>
      <article class="today-card" aria-labelledby="today-sign-title">
        <h3 id="today-sign-title">今日星座</h3>
        <label class="today-card__sign">選擇太陽星座
          <select :value="sign ?? ''" @change="onSignChange">
            <option value="">請選擇</option>
            <option v-for="item in HOROSCOPE_SIGNS" :key="item.id" :value="item.id">{{ item.symbol }} {{ item.name }}</option>
          </select>
        </label>
        <template v-if="reading">
          <p><strong>{{ reading.sections[0].title }}</strong>：{{ reading.sections[0].text }}</p>
          <p class="today-card__meta">幸運色 {{ reading.lucky.color }}・幸運數字 {{ reading.lucky.number }}</p>
          <p class="today-card__tip">{{ reading.tip }}</p>
        </template>
        <a class="today-card__link" href="../horoscope/">查看五個面向</a>
      </article>
    </div>
  </section>
</template>

