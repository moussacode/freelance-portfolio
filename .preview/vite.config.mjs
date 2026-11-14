import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

const r = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: r('.'),
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  resolve: {
    alias: [
      { find: 'next/link', replacement: r('./shims/link.tsx') },
      { find: 'next/image', replacement: r('./shims/image.tsx') },
      { find: 'next/navigation', replacement: r('./shims/navigation.ts') },
      { find: /^@\//, replacement: r('../src/') + '/' },
    ],
  },
  build: { outDir: r('./dist'), emptyOutDir: true, assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 },
});
