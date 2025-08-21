import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 5000,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Force single chunk (not recommended for performance)
        // manualChunks: () => 'index.js'
      },
    },
  },
});

