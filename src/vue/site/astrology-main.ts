import { createApp } from 'vue';
import '../shared/tokens.css';
import AstrologyApp from './features/divination/AstrologyApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="astrology"]');
if (host) createApp(AstrologyApp).mount(host);
