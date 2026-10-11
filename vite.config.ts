import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { build } from 'esbuild';

export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'lessonroutes-runtime',
    async buildStart() {
      await build({ entryPoints: ['src/player/entry.ts'], bundle: true, format: 'iife',
        target: ['chrome110', 'firefox115', 'safari17'], minify: true,
        outfile: 'src/player/runtime.generated.txt', legalComments: 'none' });
    },
  }],
  build: { target: 'es2022', sourcemap: false },
});
