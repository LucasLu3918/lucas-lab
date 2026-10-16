<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { BrowserAudioPlayerAdapter } from './BrowserAudioPlayerAdapter';
import { mountMusicPlayer } from './mountMusicPlayer.js';

const props = defineProps<{ root: HTMLElement }>();
let dispose = () => {};

onMounted(() => {
  const element = props.root.querySelector<HTMLAudioElement>('[data-audio]');
  if (!element) return;
  const audio = new BrowserAudioPlayerAdapter(element);
  dispose = mountMusicPlayer(props.root, audio);
  props.root.dataset.vueMusicReady = 'true';
});

onBeforeUnmount(() => {
  delete props.root.dataset.vueMusicReady;
  dispose();
});
</script>

<template>
  <span class="music-player-controller" aria-hidden="true"></span>
</template>
