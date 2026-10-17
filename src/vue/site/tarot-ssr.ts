import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import TarotApp from './features/tarot/TarotApp.vue';
import { TAROT_ART_BASE_KEY } from './features/tarot/tarotArt';

// Build-time prerender of the tarot island's first render. scripts/render-tarot-static.mjs writes this markup into the static
// /tarot/ page, so the layout exists before the island mounts. Mounting then replaces it with the same DOM and scoped styles.
export function renderTarotStatic(artBase: string): Promise<string> {
  return renderToString(createSSRApp(TarotApp).provide(TAROT_ART_BASE_KEY, artBase));
}
