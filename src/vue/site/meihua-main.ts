import { createApp } from 'vue';
import '../shared/tokens.css';
import MeihuaApp from './features/meihua/MeihuaApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="meihua"]');
if (host) createApp(MeihuaApp).mount(host);
