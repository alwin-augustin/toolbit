import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from 'vite-plugin-pwa';
import path from "path";

export default defineConfig(({ mode }) => {
    const isElectron = process.env.ELECTRON === 'true';
    const isDev = mode === 'development';

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
            !isElectron && VitePWA({
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
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                    runtimeCaching: [
                        {
                            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'google-fonts-cache',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        },
                        {
                            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                            handler: 'CacheFirst',
                            options: {
                                cacheName: 'gstatic-fonts-cache',
                                expiration: {
                                    maxEntries: 10,
                                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                                },
                                cacheableResponse: {
                                    statuses: [0, 200]
                                }
                            }
                        }
                    ],
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
                output: {
                    // Disable code splitting for both Electron and Web to avoid React hooks issues
                    manualChunks: () => 'everything',
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
        // Optimize dependencies
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react-hook-form',
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
