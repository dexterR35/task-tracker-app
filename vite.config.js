import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
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
            return 'vendor';
          }
          
          // Feature chunks
          if (id.includes('/features/auth/')) {
            return 'auth-features';
          }
          if (id.includes('/features/user/') || id.includes('/features/task/')) {
            return 'data-features';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
  },
});
