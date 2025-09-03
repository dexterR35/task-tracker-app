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
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('@reduxjs') || id.includes('react-redux')) {
              return 'redux-vendor';
            }
            if (id.includes('@heroicons') || id.includes('react-icons')) {
              return 'ui-vendor';
            }
            if (id.includes('formik') || id.includes('yup')) {
              return 'form-vendor';
            }
            if (id.includes('date-fns') || id.includes('dompurify')) {
              return 'utils-vendor';
            }
            if (id.includes('react-paginate')) {
              return 'table-vendor';
            }
            if (id.includes('recharts')) {
              return 'chart-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            // Group other node_modules into a common vendor chunk
            return 'vendor-common';
          }
          
          // Font chunks - group font-related modules
          if (id.includes('@fontsource/roboto')) {
            if (id.includes('400.css') || id.includes('500.css')) {
              return 'fonts-critical';
            }
            return 'fonts-non-critical';
          }
          
          // Feature-based chunks
          if (id.includes('/src/features/')) {
            if (id.includes('/auth/')) return 'auth-feature';
            if (id.includes('/tasks/')) return 'tasks-feature';
            if (id.includes('/reporters/')) return 'reporters-feature';
            if (id.includes('/analytics/')) return 'analytics-feature';
            if (id.includes('/currentMonth/')) return 'currentMonth-feature';
          }
          
          // Component chunks
          if (id.includes('/src/components/')) {
            if (id.includes('/ui/')) return 'ui-components';
            if (id.includes('/forms/')) return 'form-components';
            if (id.includes('/layout/')) return 'layout-components';
          }
          
          // Utility chunks
          if (id.includes('/src/utils/') || id.includes('/src/hooks/')) {
            return 'utils';
          }
        },
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

