import { createApp } from 'vue';
import GalleryLightbox from './features/gallery/GalleryLightbox.vue';

const fallback = document.querySelector<HTMLDialogElement>('#gallery-dialog');

if (fallback) {
  const host = document.createElement('div');
  host.dataset.vueGalleryHost = 'true';
  fallback.replaceWith(host);
  createApp(GalleryLightbox).mount(host);
}
