import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

export default defineConfig(({ mode }) => {
    const isElectron = process.env.ELECTRON === 'true';
    const isDev = mode === 'development';
    const disablePwa = process.env.VITE_DISABLE_PWA === 'true';

    return {
        appType: 'spa',
        define: {
            global: "window",
        },
        css: {
            postcss: './postcss.config.js',
        },
        plugins: [
            react(),
            // Only enable PWA for web builds, not Electron
            !isElectron && !disablePwa && VitePWA({
                strategies: 'generateSW',
                filename: 'sw.js',
                registerType: 'autoUpdate',
                includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png'],
                manifest: {
                    name: 'Toolbit - Developer Utilities',
                    short_name: 'Toolbit',
                    description: 'A comprehensive collection of local-only developer utilities including JSON formatter, Base64 encoder, and 20+ essential tools',
                    theme_color: '#1e40af',
                    background_color: '#020817',
                    display: 'standalone',
                    scope: '/',
                    start_url: '/',
                    orientation: 'any',
                    categories: ['productivity', 'utilities', 'developer tools'],
                    icons: [
                        {
                            src: '/pwa-64x64.png',
                            sizes: '64x64',
                            type: 'image/png'
                        },
                        {
                            src: '/pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: '/pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'any'
                        },
                        {
                            src: '/maskable-icon-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable'
                        }
                    ]
                },
                workbox: {
                    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest,json}'],
                    // Cache all static assets
                    navigateFallback: null,
                    cleanupOutdatedCaches: true,
                    clientsClaim: true,
                    skipWaiting: true
                },
                devOptions: {
                    enabled: false, // Disable PWA in development for faster iteration
                    type: 'module'
                }
            })
        ].filter(Boolean),
        resolve: {
            alias: {
                "@": path.resolve(import.meta.dirname, "src"),
                "@shared": path.resolve(import.meta.dirname, "shared"),
                "@assets": path.resolve(import.meta.dirname, "attached_assets"),
            },
        },
        // Base path: use './' for Electron to work with file:// protocol
        base: isElectron ? './' : '/',
        build: {
            outDir: path.resolve(import.meta.dirname, "dist"),
            emptyOutDir: true,
            // Target modern browsers for better optimization
            target: isElectron ? 'esnext' : 'es2015',
            // Enable minification
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: !isDev,
                    drop_debugger: !isDev,
                    pure_funcs: isDev ? [] : ['console.log', 'console.info'],
                },
                format: {
                    comments: false,
                },
            },
            // Optimize chunk size (increased due to disabled code splitting)
            chunkSizeWarningLimit: 2000,
            // Source maps for debugging (only in dev)
            sourcemap: isDev,
            rollupOptions: {
                input: {
                    main: path.resolve(import.meta.dirname, "index.html"),
                    about: path.resolve(import.meta.dirname, "about.html"),
                },
                output: {
                    /**
                     * Only node_modules are chunked by hand, and only far enough
                     * to keep a tool's heavy dependency out of the first paint:
                     * pdf-lib, pkijs, protobufjs, terser and friends are each
                     * needed by exactly one lazily-loaded tool, so grouping them
                     * into one `vendor` blob made the homepage download megabytes
                     * of parser it would never run.
                     *
                     * Application modules are deliberately left to Rollup. Every
                     * tool is a dynamic import, so Rollup gives each one its own
                     * chunk and hoists genuinely shared code automatically —
                     * forcing tools into category chunks previously dragged
                     * CodeMirror and Prism into the entry graph.
                     */
                    manualChunks: isElectron ? undefined : (id) => {
                        if (!id.includes('node_modules')) return undefined;

                        const match = id.match(/node_modules\/(?:\.pnpm\/)?((?:@[^/]+\/)?[^/]+)/);
                        const pkg = match?.[1] ?? '';

                        // Framework: needed for the very first render.
                        if (['react', 'react-dom', 'scheduler', 'wouter', 'zustand'].includes(pkg)) {
                            return 'react-vendor';
                        }
                        if (pkg === 'lucide-react' || pkg.startsWith('@radix-ui') || pkg === 'cmdk') {
                            return 'ui-vendor';
                        }

                        // Editors and highlighters: only when a tool opens.
                        if (pkg === 'prismjs' || pkg === 'react-simple-code-editor') return 'prism';
                        if (pkg === 'codemirror' || pkg.startsWith('@codemirror') || pkg.startsWith('@lezer')) {
                            return 'codemirror';
                        }

                        // Single-tool heavyweights.
                        if (pkg === 'marked' || pkg === 'dompurify') return 'markdown';
                        if (['date-fns', 'cron-parser', 'cronstrue'].includes(pkg)) return 'date-tools';
                        if (pkg === 'pdf-lib') return 'pdf-lib';
                        if (['pkijs', 'asn1js', 'pvutils'].includes(pkg)) return 'pki';
                        if (pkg === 'protobufjs' || pkg.startsWith('@protobufjs')) return 'protobuf';
                        if (pkg === 'graphql') return 'graphql';
                        if (pkg === 'ajv' || pkg === 'ajv-formats' || pkg === 'fast-uri') return 'ajv';
                        if (pkg === 'terser' || pkg === 'source-map-support') return 'terser';
                        if (pkg === 'qrcode') return 'qrcode';
                        if (pkg === 'papaparse') return 'papaparse';
                        if (pkg === 'js-yaml') return 'yaml';
                        if (pkg === 'diff') return 'diff';
                        if (['csso', 'cssbeautify', 'css-tree', 'mdn-data'].includes(pkg)) return 'css-tools';
                        if (pkg === 'convert-units') return 'convert-units';
                        if (pkg.startsWith('@noble')) return 'noble-hashes';
                        if (pkg === 'react-window') return 'react-window';

                        return 'vendor';
                    },
                    // Optimize asset naming
                    assetFileNames: (assetInfo) => {
                        const info = assetInfo.name?.split('.');
                        const ext = info?.[info.length - 1];
                        if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext ?? '')) {
                            return `assets/images/[name]-[hash][extname]`;
                        } else if (/woff2?|ttf|eot/i.test(ext ?? '')) {
                            return `assets/fonts/[name]-[hash][extname]`;
                        }
                        return `assets/[name]-[hash][extname]`;
                    },
                    chunkFileNames: 'assets/js/[name]-[hash].js',
                    entryFileNames: 'assets/js/[name]-[hash].js',
                }
            },
            // Optimize dependencies
            commonjsOptions: {
                include: [/node_modules/],
                transformMixedEsModules: true,
            },
            // Increase performance
            reportCompressedSize: false,
        },
        server: {
            port: 5173,
            strictPort: false,
            // Enable CORS for development
            cors: true,
            // Hot module replacement
            hmr: {
                overlay: true,
            },
        },
        preview: {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
                "Surrogate-Control": "no-store",
            },
        },
        // Optimize dependencies
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'zustand',
                'wouter',
            ],
            exclude: ['electron'],
        },
        // Performance optimizations
        esbuild: {
            logOverride: { 'this-is-undefined-in-esm': 'silent' },
            legalComments: 'none',
        },
    };
});
