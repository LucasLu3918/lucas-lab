import { createApp } from 'vue';
import '../shared/tokens.css';
import HoroscopeApp from './features/horoscope/HoroscopeApp.vue';

const host = document.querySelector<HTMLElement>('[data-vue-site-island="horoscope"]');
if (host) createApp(HoroscopeApp).mount(host);
