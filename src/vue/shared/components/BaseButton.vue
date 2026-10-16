<script setup lang="ts">
import { computed } from 'vue';

type ButtonVariant = 'primary' | 'secondary' | 'quiet';
type ButtonSize = 'default' | 'small';
type ButtonType = 'button' | 'submit' | 'reset';

const props = withDefaults(defineProps<{
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
}>(), {
  variant: 'secondary',
  size: 'default',
  type: 'button',
  disabled: false,
  loading: false,
});

const classes = computed(() => [
  'll-button',
  `ll-button--${props.variant}`,
  props.size === 'small' ? 'll-button--small' : null,
]);
</script>

<template>
  <button
    :class="classes"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : undefined"
  >
    <span v-if="loading" class="ll-button__spinner" aria-hidden="true"></span>
    <span><slot /></span>
  </button>
</template>
