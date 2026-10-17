import { createApp } from 'vue';
import '../shared/tokens.css';
import LiuyaoApp from './features/liuyao/LiuyaoApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="liuyao"]');
if (host) createApp(LiuyaoApp).mount(host);
