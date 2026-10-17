<script setup lang="ts">
import { precisionLabel, type InputPrecision } from '../result';

defineProps<{ precision: InputPrecision; reason?: string }>();
</script>

<template>
  <p class="precision-badge" :data-precision="precision">
    <strong>{{ precisionLabel(precision) }}</strong>
    <span v-if="reason">{{ reason }}</span>
  </p>
</template>

<style scoped>
.precision-badge { display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 10px; margin:0; color:var(--ll-color-text-muted, #aaa99f); font-size:var(--ll-font-size-sm, 0.875rem); line-height:1.6; }
.precision-badge strong { padding:2px 10px; border:1px solid var(--ll-color-control-border, #52606a); border-radius:999px; color:var(--ll-color-gold, #c7a859); font-weight:600; white-space:nowrap; }
</style>
