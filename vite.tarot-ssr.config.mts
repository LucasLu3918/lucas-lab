import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Server-side build of the tarot island, used only to prerender its first markup (src/vue/site/tarot-ssr.ts).
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    ssr: 'src/vue/site/tarot-ssr.ts',
    outDir: '.vue-ssr',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'tarot-ssr.mjs',
      },
    },
  },
});
