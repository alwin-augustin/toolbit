import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

/**
 * onnxruntime-web carries a `new URL('ort-wasm-….wasm', import.meta.url)`
 * fallback that Vite resolves at build time, emitting the ~26 MB binary as an
 * asset. The fallback never runs: transformers.js assigns `wasmPaths` before
 * any session exists — the CDN in the web build, the staged `ort/` directory
 * in the desktop build — and the runtime is fetched from there. Cloudflare
 * Pages refuses files over 25 MiB, so the unreachable copy has to go.
 */
function dropUnusedOrtWasm(): Plugin {
  return {
    name: 'toolbit:drop-unused-ort-wasm',
    generateBundle(_options, bundle) {
      for (const fileName of Object.keys(bundle)) {
        if (/^assets\/ort-wasm-.*\.wasm$/.test(fileName)) delete bundle[fileName];
      }
    },
  };
}

/**
 * `mode === 'desktop'` is the installed app's build (`vite build --mode desktop`,
 * driven by the Tauri host in `Desktop/desktop-tauri`). It drops the marketing
 * entry point, which the desktop route table does not serve.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), dropUnusedOrtWasm()],
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
