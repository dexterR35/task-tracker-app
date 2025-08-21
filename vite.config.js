import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Safe chunk splitting that won't corrupt React
          if (id.includes('node_modules')) {
            // Keep React core together (this is critical)
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // Router can be separate
            if (id.includes('react-router-dom')) {
              return 'router';
            }
            // Redux can be separate
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'redux';
            }
            // Firebase can be separate
            if (id.includes('firebase')) {
              return 'firebase';
            }
            // UI libraries
            if (id.includes('recharts') || id.includes('@heroicons')) {
              return 'ui-libs';
            }
            // Form libraries
            if (id.includes('formik') || id.includes('yup')) {
              return 'form-libs';
            }
            // PDF and file handling
            if (id.includes('jspdf') || id.includes('file-saver')) {
              return 'pdf-libs';
            }
            // Everything else
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500, // Increased limit
    minify: 'esbuild',
    sourcemap: false,
    // Additional optimizations
    target: 'es2015',
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    force: true,
  },
  define: {
    // Ensure React is properly defined
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});

