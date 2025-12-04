import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // generic base path allows it to run in subdirectories (like https://user.github.io/repo/)
  base: './', 
  define: {
    // This allows the API_KEY to be injected during the build process from GitHub Secrets
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY || '')
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});