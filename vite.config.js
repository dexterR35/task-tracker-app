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
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['@heroicons/react', 'react-icons'],
          'form-vendor': ['formik', 'yup'],
          'utils-vendor': ['date-fns', 'dompurify'],
          'table-vendor': ['react-paginate'],
          'chart-vendor': ['recharts'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          
          // Feature-based chunks for better code splitting
          'auth-feature': ['@features/auth'],
          'tasks-feature': ['@features/tasks'],
          'reporters-feature': ['@features/reporters'],
          'analytics-feature': ['@features/analytics'],
          'currentMonth-feature': ['@features/currentMonth'],
          
          // Component chunks
          'ui-components': ['@components/ui'],
          'form-components': ['@components/forms'],
          'layout-components': ['@components/layout'],
          
          // Utility chunks
          'utils': ['@utils', '@hooks'],
        },
      },
    },
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
  },
});

