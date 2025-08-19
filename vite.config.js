import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: "/", // <-- FIX: use absolute paths for Vercel
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks - more granular splitting
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('react-router-dom')) {
              return 'router-vendor';
            }
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'redux-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('formik') || id.includes('yup')) {
              return 'form-vendor';
            }
            if (id.includes('react-toastify')) {
              return 'ui-vendor';
            }
            if (id.includes('tailwindcss') || id.includes('postcss')) {
              return 'css-vendor';
            }
            if (id.includes('recharts')) {
              return 'recharts-vendor';
            }
            // Split remaining vendor dependencies into smaller chunks
            if (id.includes('lodash') || id.includes('date-fns')) {
              return 'utils-vendor';
            }
            if (id.includes('@emotion') || id.includes('styled-components')) {
              return 'styling-vendor';
            }
            if (id.includes('moment') || id.includes('dayjs') || id.includes('luxon')) {
              return 'date-vendor';
            }
            if (id.includes('axios') || id.includes('fetch') || id.includes('http')) {
              return 'http-vendor';
            }
            if (id.includes('uuid') || id.includes('nanoid') || id.includes('crypto')) {
              return 'crypto-vendor';
            }
            if (id.includes('jspdf') || id.includes('pdf') || id.includes('file-saver')) {
              return 'pdf-vendor';
            }
            if (id.includes('buffer') || id.includes('stream') || id.includes('util')) {
              return 'node-vendor';
            }
            if (id.includes('@heroicons') || id.includes('heroicons')) {
              return 'icons-vendor';
            }
            // Default vendor chunk for other dependencies
            return 'other-vendor';
          }

          // Feature chunks
          if (id.includes('/features/auth/')) {
            return 'auth-features';
          }
          if (id.includes('/features/user/') || id.includes('/features/task/')) {
            return 'data-features';
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components';
          }
          if (id.includes('/pages/')) {
            return 'pages';
          }
        },
      },
    },
    chunkSizeWarningLimit: 800, // Reduce warning limit to 800KB
    minify: 'esbuild', // Use esbuild minifier (default)
    sourcemap: false, // Disable sourcemaps for production
  },
});

