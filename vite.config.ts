import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the build works from a GitHub Pages sub-path
  // (/115-/) and inside the Android (Capacitor) WebView.
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
