<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { readGalleryGroup, useGalleryPreview } from './useGalleryPreview';

const preview = useGalleryPreview();
const dialog = ref<HTMLDialogElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
const imageLoaded = shallowRef(false);
const imageFailed = shallowRef(false);
let touchStartX: number | null = null;

const current = preview.current;
const wide = computed(() => Boolean(current.value && current.value.width > current.value.height));

watch(current, () => {
  imageLoaded.value = false;
  imageFailed.value = false;
});

function openFromTile(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const trigger = target.closest<HTMLButtonElement>('[data-preview]');
  if (!trigger || !dialog.value) return;
  const tiles = document.querySelectorAll('[data-preview]');
  const items = readGalleryGroup(trigger, tiles);
  const position = items.findIndex(item => item.trigger === trigger);
  if (position < 0) return;

  preview.open(items, position);
  if (!dialog.value.open) {
    if (typeof dialog.value.showModal !== 'function') return;
    dialog.value.showModal();
  }
  void nextTick(() => closeButton.value?.focus());
}

function closeDialog(): void {
  if (dialog.value?.open) dialog.value.close();
}

function handleClose(): void {
  const trigger = current.value?.trigger;
  preview.close();
  void nextTick(() => {
    requestAnimationFrame(() => {
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
  });
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowLeft' && !preview.isSingle.value) {
    event.preventDefault();
    preview.step(-1);
  } else if (event.key === 'ArrowRight' && !preview.isSingle.value) {
    event.preventDefault();
    preview.step(1);
  }
}

function handleTouchStart(event: TouchEvent): void {
  touchStartX = event.touches[0]?.clientX ?? null;
}

function handleTouchEnd(event: TouchEvent): void {
  if (touchStartX === null) return;
  const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
  touchStartX = null;
  if (Math.abs(delta) > 45 && !preview.isSingle.value) preview.step(delta < 0 ? 1 : -1);
}

onMounted(() => {
  dialog.value?.addEventListener('close', handleClose);
  if (dialog.value) dialog.value.dataset.vueGalleryReady = 'true';
  document.addEventListener('click', openFromTile);
});

onUnmounted(() => {
  dialog.value?.removeEventListener('close', handleClose);
  document.removeEventListener('click', openFromTile);
});
</script>

<template>
  <dialog
    id="gallery-dialog"
    ref="dialog"
    class="dialog gallery-dialog"
    :class="{ 'is-wide': wide, 'is-single': preview.isSingle.value }"
    aria-labelledby="gallery-dialog-title"
    @click.self="closeDialog"
    @keydown="handleKeydown"
  >
    <div class="dialog-bar">
      <span class="dialog-count" data-dialog-count aria-live="polite">{{ preview.count.value }}</span>
      <button ref="closeButton" type="button" class="close" data-dialog-close aria-label="關閉預覽" @click="closeDialog">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
      </button>
    </div>
    <div class="dialog-stage">
      <button type="button" class="dialog-nav prev" data-dialog-prev aria-label="上一張" :hidden="preview.isSingle.value" @click="preview.step(-1)">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </button>
      <div
        class="visual has-art"
        data-dialog-visual
        :class="{ 'is-loaded': imageLoaded, 'is-failed': imageFailed }"
        @touchstart.passive="handleTouchStart"
        @touchend.passive="handleTouchEnd"
      >
        <img v-if="current?.thumbnailSrc" class="gallery-preview-placeholder" :src="current.thumbnailSrc" alt="" aria-hidden="true" decoding="async">
        <img
          v-if="current"
          class="gallery-preview-image"
          :src="current.src"
          :alt="current.alt"
          :width="current.width"
          :height="current.height"
          decoding="async"
          @load="imageLoaded = true"
          @error="imageFailed = true"
        >
        <span v-if="imageFailed" class="gallery-image-status" role="status">完整圖片載入失敗，仍可查看縮圖。</span>
        <span v-else-if="current && !imageLoaded" class="gallery-image-status" role="status">正在載入完整圖片…</span>
      </div>
      <button type="button" class="dialog-nav next" data-dialog-next aria-label="下一張" :hidden="preview.isSingle.value" @click="preview.step(1)">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
      </button>
    </div>
    <h2 id="gallery-dialog-title" data-dialog-title>{{ current?.title }}</h2>
    <p class="muted" data-dialog-desc>{{ current?.description }}</p>
    <a v-if="current?.href" class="btn" data-dialog-link :href="current.href">{{ current.hrefLabel }} →</a>
    <p class="dialog-hint">← → 切換 · Esc 關閉</p>
  </dialog>
</template>
