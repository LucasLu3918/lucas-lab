<script setup lang="ts">
import TodayOverview from './TodayOverview.vue';
import { DIVINATION_HUB, DIVINATION_MODULES } from './modules';
import './divination-hub.css';
</script>

<template>
  <div class="divination-hub">
    <header class="divination-hero">
      <svg class="divination-hero__moon" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M30 7a17 17 0 1 0 11 29.5A13 13 0 0 1 30 7z" /></svg>
      <h1>{{ DIVINATION_HUB.hero.title }}</h1>
      <p>{{ DIVINATION_HUB.hero.lead }}</p>
    </header>
    <TodayOverview />
    <section class="doors" aria-label="選擇占卜方式">
      <a v-for="door in DIVINATION_MODULES" :key="door.id" class="door" :href="door.href">
        <span class="door__icon" aria-hidden="true"><svg viewBox="0 0 32 32" v-html="door.iconSvg" /></span>
        <span class="door__body">
          <h2>{{ door.title }}</h2>
          <span>{{ door.description }}</span>
          <span class="door__meta">{{ door.meta }}</span>
        </span>
      </a>
    </section>
    <aside class="divination-note"><strong>{{ DIVINATION_HUB.note.title }}</strong><p>{{ DIVINATION_HUB.note.body }}</p></aside>
  </div>
</template>
