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
                "@": path.resolve(import.meta.dirname, "client", "src"),
                "@shared": path.resolve(import.meta.dirname, "shared"),
                "@assets": path.resolve(import.meta.dirname, "attached_assets"),
            },
        },
        root: path.resolve(import.meta.dirname, "client"),
        // Base path: use './' for Electron to work with file:// protocol
        base: isElectron ? './' : '/',
        build: {
            outDir: path.resolve(import.meta.dirname, "dist"),
            emptyOutDir: true,
            // Ensure compatibility with Electron
            rollupOptions: {
                output: {
                    // Prevent code splitting issues in Electron
                    manualChunks: undefined,
                }
            }
        },
        server: {
            port: 5173,
            strictPort: false,
        },
    };
});
