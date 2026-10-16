import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: '.vue-build',
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        site: 'src/vue/site/main.ts',
        game: 'src/vue/game/main.ts',
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/vue/**/*.spec.ts'],
  },
});
