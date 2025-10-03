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
                    // Disable manual chunks for Electron to avoid issues
                    // For web, use automatic chunking
                    manualChunks: undefined,
                }
            },
            // Increase chunk size limit since we're bundling everything
            chunkSizeWarningLimit: 2000,
        },
        server: {
            port: 5173,
            strictPort: false,
        },
    };
});
