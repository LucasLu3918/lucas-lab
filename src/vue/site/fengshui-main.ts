import { createApp } from 'vue';
import '../shared/tokens.css';
import FengshuiApp from './features/fengshui/FengshuiApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="fengshui"]');
if (host) createApp(FengshuiApp).mount(host);
