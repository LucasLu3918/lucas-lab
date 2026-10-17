import { createApp } from 'vue';
import BaziApp from './features/divination/BaziApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="bazi"]');
if (host) createApp(BaziApp).mount(host);
