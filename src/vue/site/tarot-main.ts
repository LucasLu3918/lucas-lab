import { createApp } from 'vue';
import '../shared/tokens.css';
import '../shared/base.css';
import TarotApp from './features/tarot/TarotApp.vue';
import { TAROT_ART_BASE_KEY } from './features/tarot/tarotArt';

const target = document.querySelector<HTMLElement>('[data-vue-site-island="tarot"]');
if (target) createApp(TarotApp).provide(TAROT_ART_BASE_KEY, target.dataset.artBase ?? '').mount(target);
