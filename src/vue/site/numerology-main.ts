import { createApp } from 'vue';
import '../shared/tokens.css';
import NumerologyApp from './features/numerology/NumerologyApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="numerology"]');
if (host) createApp(NumerologyApp).mount(host);
