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

