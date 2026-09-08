import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base must match the repo name for GitHub Pages to resolve assets.
export default defineConfig({
  base: '/dsu-campus-nav/',
  plugins: [react()]
});
