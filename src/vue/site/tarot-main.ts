import { createApp } from 'vue';
import '../shared/tokens.css';
import '../shared/base.css';
import TarotApp from './features/tarot/TarotApp.vue';

const target = document.querySelector<HTMLElement>('[data-vue-site-island="tarot"]');
if (target) createApp(TarotApp).mount(target);
