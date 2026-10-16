import { createApp, type ComponentPublicInstance } from 'vue';
import GameApp from './GameApp.vue';

export function mountGameApp(target: Element): ComponentPublicInstance {
  return createApp(GameApp).mount(target);
}

const gameRoot = document.querySelector('[data-vue-game-app]');
if (gameRoot) mountGameApp(gameRoot);
