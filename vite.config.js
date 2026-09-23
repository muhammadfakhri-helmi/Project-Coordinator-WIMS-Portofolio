import { defineConfig } from 'vite';

// BASE_PATH lets the same build run from a domain root ("/"), a GitHub Pages
// project subpath ("/<repo>/"), or any folder ("./", the default). The site is
// a single page with no client-side routing, so a relative base is safe.
export default defineConfig({
  base: process.env.BASE_PATH || './',
  build: {
    assetsDir: 'static',
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 800,
  },
  server: { port: 5173 },
  preview: { port: 4173 },
});
