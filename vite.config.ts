import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
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
 * Cloudflare Pages serves `/download` from `download.html` — the same mapping
 * that answers `/about` from `about.html` (verified against production
 * 2026-10-16: `/about` is 200 from the file, `/about.html` 308s to it). The dev
 * server and `vite preview` have no such mapping, so that page would be
 * reachable only after a deploy: `/download` falls through to the app shell and
 * its in-app 404. This mirrors the one mapping the download page depends on.
 * The other prerendered pages keep their SPA routes in dev; the SEO generator
 * writes them into `dist` for everything else.
 */
function serveDownloadPage(): Plugin {
  const map = (url: string | undefined) =>
    url && /^\/download(?:\?|$)/.test(url) ? url.replace('/download', '/download.html') : url;
  const rewrite = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use((req, _res, next) => {
      req.url = map(req.url);
      next();
    });
  };
  return {
    name: 'toolbit:download-page',
    configureServer: rewrite,
    configurePreviewServer: rewrite,
  };
}

/**
 * `mode === 'desktop'` is the installed app's build (`vite build --mode desktop`,
 * driven by the Tauri host in `Desktop/desktop-tauri`). It drops the marketing
 * entry points, which the desktop route table does not serve.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), dropUnusedOrtWasm(), serveDownloadPage()],
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
          : {
              about: fileURLToPath(new URL('./about.html', import.meta.url)),
              // The version-free download address: a standalone page whose
              // script hands over the build for this machine.
              download: fileURLToPath(new URL('./download.html', import.meta.url)),
            }),
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
