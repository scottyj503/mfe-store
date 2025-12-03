import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        validation: resolve(__dirname, 'validation.html'),
        react: resolve(__dirname, 'react.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
});
