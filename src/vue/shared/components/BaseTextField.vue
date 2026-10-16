<script setup lang="ts">
import { computed, useId } from 'vue';

const props = withDefaults(defineProps<{
  label: string;
  id?: string;
  type?: 'text' | 'search' | 'email' | 'url' | 'password';
  description?: string;
  error?: string;
  placeholder?: string;
  autocomplete?: string;
  disabled?: boolean;
  required?: boolean;
}>(), {
  type: 'text',
  disabled: false,
  required: false,
});

const model = defineModel<string>({ default: '' });
const generatedId = useId();
const inputId = computed(() => props.id ?? `ll-field-${generatedId}`);
const descriptionId = computed(() => props.description ? `${inputId.value}-hint` : undefined);
const errorId = computed(() => props.error ? `${inputId.value}-error` : undefined);
const describedBy = computed(() => [descriptionId.value, errorId.value].filter(Boolean).join(' ') || undefined);
</script>

<template>
  <div class="ll-text-field">
    <label class="ll-text-field__label" :for="inputId">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      class="ll-text-field__input"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
    >
    <p v-if="description" :id="descriptionId" class="ll-text-field__hint">{{ description }}</p>
    <p v-if="error" :id="errorId" class="ll-text-field__error" role="alert">{{ error }}</p>
  </div>
</template>
