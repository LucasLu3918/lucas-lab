<script setup lang="ts">
withDefaults(defineProps<{
  tone?: 'neutral' | 'success' | 'info' | 'warning' | 'error';
}>(), {
  tone: 'neutral',
});
</script>

<template>
  <span class="ll-badge" :class="tone === 'neutral' ? null : `ll-badge--${tone}`">
    <slot />
  </span>
</template>
