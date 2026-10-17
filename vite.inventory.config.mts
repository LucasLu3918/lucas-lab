import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  base: './',
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  plugins: [vue()],
  build: {
    outDir: '.vue-inventory-build',
    emptyOutDir: true,
    manifest: 'manifest.json',
    lib: {
      entry: 'src/vue/game/inventory-main.ts',
      formats: ['es'],
      fileName: () => 'assets/inventory-main-[hash].js',
    },
    rollupOptions: {
      input: 'src/vue/game/inventory-main.ts',
      output: {
        codeSplitting: false,
      },
    },
  },
});
