
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/MergeIt/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});
