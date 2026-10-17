import { createApp, type ComponentPublicInstance } from 'vue';
import '../shared/tokens.css';
import '../shared/base.css';
import GameApp from './GameApp.vue';
import { createGameComposition } from './createGameComposition';

export function mountGameApp(target: Element): ComponentPublicInstance {
  return createApp(GameApp, { composition: createGameComposition() }).mount(target);
}

const gameRoot = document.querySelector('[data-vue-game-app]');
if (gameRoot) mountGameApp(gameRoot);
