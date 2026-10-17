import { createApp } from 'vue';
import '../shared/tokens.css';
import DivinationHub from './features/divination/DivinationHub.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="divination"]');
if (host) createApp(DivinationHub).mount(host);
