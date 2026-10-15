import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * `mode === 'desktop'` is the installed app's build (`vite build --mode desktop`,
 * driven by the Tauri host in `Desktop/desktop-tauri`). It drops the marketing
 * entry point, which the desktop route table does not serve.
 */
export default defineConfig(({ mode }) => ({
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
        // The landing page is a web-only surface: the desktop build hides its
        // route, so it ships without the entry point that renders it.
        ...(mode === 'desktop'
          ? {}
          : { about: fileURLToPath(new URL('./about.html', import.meta.url)) }),
      },
      output: {
        manualChunks: (id) => {
          // The editor core every route needs, so one eager chunk. Grammars are
          // deliberately excluded: they are imported on demand, and sweeping
          // `@codemirror/lang-*` in here would ship every language to every
          // visitor — the reason a tool only highlights the language it handles.
          if (
            /@codemirror\/(?:autocomplete|commands|language|lint|search|state|view)\//.test(id) ||
            /@lezer\/(?:common|highlight|lr)\//.test(id)
          )
            return 'codemirror';
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
}));
