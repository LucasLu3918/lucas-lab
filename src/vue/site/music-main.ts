import { createApp } from 'vue';
import MusicPlayerController from './features/music/MusicPlayerController.vue';

document.querySelectorAll<HTMLElement>('[data-music-player]').forEach(root => {
  const host = root.querySelector<HTMLElement>('[data-vue-music-controller]');
  if (!host) return;
  createApp(MusicPlayerController, { root }).mount(host);
});
