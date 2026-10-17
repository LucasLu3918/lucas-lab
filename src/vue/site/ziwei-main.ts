import { createApp } from 'vue';
import '../shared/tokens.css';
import ZiweiApp from './features/ziwei/ZiweiApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="ziwei"]');
if (host) createApp(ZiweiApp).mount(host);
