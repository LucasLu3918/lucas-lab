<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  tone?: 'info' | 'success' | 'warning' | 'error';
}>(), {
  tone: 'info',
});

const role = computed(() => props.tone === 'error' ? 'alert' : 'status');
const live = computed(() => props.tone === 'error' ? 'assertive' : 'polite');
const classes = computed(() => ['ll-notice', `ll-notice--${props.tone}`]);
</script>

<template>
  <div :class="classes" :role="role" :aria-live="live">
    <slot />
  </div>
</template>
