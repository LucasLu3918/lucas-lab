import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  plugins: [vue()],
  build: {
    outDir: '.vue-inventory-build',
    emptyOutDir: true,
    manifest: 'manifest.json',
    lib: {
      entry: 'src/vue/game/inventory-main.ts',
      formats: ['es'],
      fileName: 'inventory-main',
    },
    rollupOptions: {
      input: 'src/vue/game/inventory-main.ts',
      output: {
        codeSplitting: false,
      },
    },
  },
});
