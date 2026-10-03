import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Node-isms referenced by bundled CJS helpers (e.g. core-js inside terser's
  // tree) resolve to the browser global instead of throwing at startup.
  define: { global: 'globalThis' },
  build: {
    target: 'baseline-widely-available',
    outDir: 'dist',
    emptyOutDir: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        about: fileURLToPath(new URL('./about.html', import.meta.url)),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('@codemirror') || id.includes('@lezer')) return 'codemirror';
          if (id.includes('pdf-lib')) return 'vendor_pdf';
          if (id.includes('/qrcode')) return 'vendor_qr';
          if (id.includes('/marked') || id.includes('/dompurify')) return 'vendor_markdown';
          if (id.includes('/diff/') || id === 'diff') return 'vendor_diff';
          return undefined;
        },
      },
    },
  },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { headers: { 'Cache-Control': 'no-store' } },
});
