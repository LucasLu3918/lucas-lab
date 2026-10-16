<script setup lang="ts">
import type { SearchItem } from './search';

defineProps<{ item: SearchItem }>();
</script>

<template>
  <article v-if="item.kind === 'tool'" class="tool">
    <div class="symbol" aria-hidden="true">{{ item.symbol }}</div>
    <h3>{{ item.title }}</h3>
    <p>{{ item.description }}</p>
    <div class="bottom">
      <span class="status">{{ item.trait }}</span>
      <a class="action" :href="item.href" target="_blank" rel="noopener noreferrer" :aria-label="`開啟 ${item.title}（新分頁）`">開啟原工具 ↗</a>
    </div>
  </article>
  <article v-else class="card" :class="{ 'book-card': item.image?.type === 'cover' }">
    <div v-if="item.image?.type === 'cover'" class="visual cover-visual book-art">
      <img
        class="book-cover"
        :src="item.image.src"
        :srcset="item.image.small ? `${item.image.small} 360w, ${item.image.src} 900w` : undefined"
        sizes="(max-width:480px) 120px, (max-width:720px) 45vw, 360px"
        :alt="item.image.alt"
        loading="lazy"
        decoding="async"
        width="900"
        height="1350"
      >
      <div class="cover-edition" aria-hidden="true">LUCAS LAB <span>✦</span></div>
      <div class="cover-caption" aria-hidden="true">
        <span class="cover-series">{{ item.image.series }}</span>
        <strong>{{ item.image.title }}</strong>
        <span v-if="item.image.subtitle" class="cover-subtitle">{{ item.image.subtitle }}</span>
      </div>
    </div>
    <div v-else-if="item.image?.type === 'shot'" class="visual shot-visual">
      <img
        :src="item.image.src"
        :srcset="item.image.small ? `${item.image.small} 600w, ${item.image.src} 1200w` : undefined"
        sizes="(max-width:480px) 34vw, (max-width:1100px) 45vw, 400px"
        :alt="item.image.alt"
        loading="lazy"
        decoding="async"
        width="1200"
        height="750"
      >
    </div>
    <div v-else class="visual" :class="item.palette" aria-hidden="true">
      <span class="emblem"><span class="search-result__symbol">{{ item.symbol }}</span></span>
    </div>
    <div class="body">
      <span class="label">{{ item.category }}</span>
      <h3><a class="card-link" :href="item.href">{{ item.title }}</a></h3>
      <p>{{ item.description }}</p>
      <div class="bottom">
        <span class="status" :class="`status-${item.status}`">{{ item.statusLabel }}</span>
        <span class="action" aria-hidden="true">{{ item.kind === 'game' && item.status === 'playable' ? '探索遊戲 ↗' : '查看詳情 ↗' }}</span>
      </div>
    </div>
  </article>
</template>
