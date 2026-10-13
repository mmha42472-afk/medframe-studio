import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // GitHub Pages serves this project under /medframe-studio/; Vercel/local use the domain root.
    base: process.env.GITHUB_PAGES === 'true' ? '/medframe-studio/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'firebase-firestore', test: /node_modules\/@firebase\/firestore\//, priority: 30 },
              { name: 'firebase-auth', test: /node_modules\/@firebase\/auth\//, priority: 25 },
              { name: 'firebase-vendor', test: /node_modules\/(?:firebase|@firebase)\//, priority: 20 },
              { name: 'react-vendor', test: /node_modules\/(?:react|react-dom|scheduler)\//, priority: 10 },
            ],
          },
        },
      },
    },
  };
});
