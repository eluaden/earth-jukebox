import { defineConfig } from 'vite';

// Relative base so the same build works on GitHub Pages (/<repo>/) and Vercel (/).
export default defineConfig({
  base: './',
});
