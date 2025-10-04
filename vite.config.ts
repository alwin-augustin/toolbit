import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
    const isElectron = process.env.ELECTRON === 'true';
    const isDev = mode === 'development';

    return {
        define: {
            global: "window",
        },
        css: {
            postcss: './postcss.config.js',
        },
        plugins: [
            react(),
        ],
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
            // Optimize chunk size
            chunkSizeWarningLimit: 1000,
            // Source maps for debugging (only in dev)
            sourcemap: isDev,
            rollupOptions: {
                output: isElectron ? {
                    // For Electron, keep everything in one file to avoid loading issues
                    manualChunks: undefined,
                    inlineDynamicImports: true,
                } : {
                    // For web, split chunks for better caching
                    manualChunks: (id) => {
                        // Vendor chunks
                        if (id.includes('node_modules')) {
                            // React ecosystem
                            if (id.includes('react') || id.includes('react-dom')) {
                                return 'react-vendor';
                            }
                            // Radix UI components
                            if (id.includes('@radix-ui')) {
                                return 'radix-vendor';
                            }
                            // Other vendor code
                            return 'vendor';
                        }
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
