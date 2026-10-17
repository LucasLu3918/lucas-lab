import { createApp } from 'vue';
import '../shared/tokens.css';
import VedicApp from './features/vedic/VedicApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="vedic"]');
if (host) createApp(VedicApp).mount(host);
