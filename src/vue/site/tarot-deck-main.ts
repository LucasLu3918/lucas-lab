import { createApp } from 'vue';
import '../shared/tokens.css';
import '../shared/base.css';
import TarotDeckApp from './features/tarot/TarotDeckApp.vue';
import { TAROT_ART_BASE_KEY } from './features/tarot/tarotArt';

const target = document.querySelector<HTMLElement>('[data-vue-site-island="tarot-deck"]');
if (target) createApp(TarotDeckApp).provide(TAROT_ART_BASE_KEY, target.dataset.artBase ?? '').mount(target);
