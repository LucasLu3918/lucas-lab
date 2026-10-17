import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  // Module workers (astrology forecasts) are emitted as ES modules so they can be loaded with { type: 'module' }.
  worker: { format: 'es' },
  build: {
    outDir: '.vue-build',
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      output: {
        // Keep the CommonJS calendar library in its own chunk. Otherwise the bundler places shared runtime helpers inside it,
        // so every chunk that uses a helper (tarot, the divination hub) downloads the 300 KB library too.
        manualChunks(id) {
          return id.includes('lunar-javascript') ? 'lunar-javascript' : undefined;
        },
      },
      input: {
        site: 'src/vue/site/main.ts',
        'site-lazy': 'src/vue/site/lazy.ts',
        tarot: 'src/vue/site/tarot-main.ts',
        'tarot-deck': 'src/vue/site/tarot-deck-main.ts',
        divination: 'src/vue/site/divination-main.ts',
        bazi: 'src/vue/site/bazi-main.ts',
        astrology: 'src/vue/site/astrology-main.ts',
        horoscope: 'src/vue/site/horoscope-main.ts',
        numerology: 'src/vue/site/numerology-main.ts',
        meihua: 'src/vue/site/meihua-main.ts',
        ziwei: 'src/vue/site/ziwei-main.ts',
        reader: 'src/vue/site/reader-main.ts',
        gallery: 'src/vue/site/gallery-main.ts',
        music: 'src/vue/site/music-main.ts',
        game: 'src/vue/game/main.ts',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/vue/**/*.spec.ts'],
  },
});
