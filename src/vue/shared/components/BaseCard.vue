<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  as?: 'article' | 'section' | 'div';
  elevation?: 'default' | 'raised';
}>(), {
  as: 'article',
  elevation: 'default',
});

const classes = computed(() => [
  'll-card',
  props.elevation === 'raised' ? 'll-card--raised' : null,
]);
</script>

<template>
  <component :is="as" :class="classes"><slot /></component>
</template>
