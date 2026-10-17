import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: '.vue-build',
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        site: 'src/vue/site/main.ts',
        'site-lazy': 'src/vue/site/lazy.ts',
        tarot: 'src/vue/site/tarot-main.ts',
        divination: 'src/vue/site/divination-main.ts',
        bazi: 'src/vue/site/bazi-main.ts',
        astrology: 'src/vue/site/astrology-main.ts',
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
