import { createApp } from 'vue';
import '../shared/tokens.css';
import QimenApp from './features/qimen/QimenApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="qimen"]');
if (host) createApp(QimenApp).mount(host);
