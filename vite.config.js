import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@services': path.resolve(__dirname, './src/services'),
      '@context': path.resolve(__dirname, './src/context'),
      '@constants': path.resolve(__dirname, './src/constants'),
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Temporarily disable manual chunking to isolate React error
        // manualChunks: undefined,
        
        // Optimize font loading
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.woff2')) {
            return 'assets/fonts/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Optimize CSS
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096, // 4KB
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      '@heroicons/react',
      'formik',
      'yup',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'date-fns',
    ],
    // Exclude fonts from dependency optimization
    exclude: ['@fontsource/roboto'],
  },
  // Server optimizations for development
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
  // Preview optimizations
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
});

