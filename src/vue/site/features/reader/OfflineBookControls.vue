<script setup lang="ts">
import { createBrowserOfflineBooksRepository, type OfflineBooksRepository } from './OfflineBooksRepository';
import { useOfflineBooks } from './useOfflineBooks';

const props = defineProps<{ slug: string; manifestUrl: string; repository?: OfflineBooksRepository | null }>();
const { available, busy, saved, message, buttonText, toggle } = useOfflineBooks(
  props.slug,
  props.manifestUrl,
  props.repository === undefined ? createBrowserOfflineBooksRepository() : props.repository,
);
</script>

<template>
  <div v-if="available" aria-live="polite">
    <div>
      <div class="label">離線閱讀</div>
      <p class="muted" data-offline-status aria-live="polite">{{ message }}</p>
    </div>
    <div class="btnrow">
      <button type="button" class="btn" :disabled="busy" data-offline-action @click="toggle">{{ buttonText }}</button>
    </div>
  </div>
</template>
