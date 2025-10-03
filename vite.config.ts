import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
    const isElectron = process.env.ELECTRON === 'true';

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
            rollupOptions: {
                output: {
                    // Manual chunk splitting for better caching and loading
                    manualChunks: isElectron ? undefined : (id) => {
                        // Vendor chunk for React and core libraries
                        if (id.includes('node_modules')) {
                            // React core libraries
                            if (id.includes('react') || id.includes('react-dom')) {
                                return 'vendor-react';
                            }
                            // UI libraries (Radix UI)
                            if (id.includes('@radix-ui')) {
                                return 'vendor-ui';
                            }
                            // Routing and state management
                            if (id.includes('wouter') || id.includes('zustand')) {
                                return 'vendor-routing-state';
                            }
                            // Data processing libraries
                            if (id.includes('papaparse') || id.includes('js-yaml') ||
                                id.includes('marked') || id.includes('dompurify')) {
                                return 'vendor-data';
                            }
                            // All other vendor code
                            return 'vendor-misc';
                        }
                    },
                }
            },
            // Optimize chunk size
            chunkSizeWarningLimit: 600,
        },
        server: {
            port: 5173,
            strictPort: false,
        },
    };
});
