import { defineConfig } from 'vite';

export default defineConfig({
  root: '.', // Assumes index.html is in the project root
  build: {
    outDir: 'dist', // Output directory
    emptyOutDir: true, // Clean before building
  },
  server: {
    port: 3000,
    open: true,
  },
});
