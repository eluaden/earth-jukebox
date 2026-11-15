import { defineConfig } from 'vite';

// Relative base so the same build works on GitHub Pages (/<repo>/) and Vercel (/).
export default defineConfig({
  base: './',
  // index.html = the designed site; classic.html = the earlier plain player (kept until its
  // real-data tracks are wired into the new design).
  build: { rollupOptions: { input: { main: 'index.html', classic: 'classic.html' } } },
});
