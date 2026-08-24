import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    // Strips all console outputs (logs, warnings, errors) and debugger statements in production
    drop: ['console', 'debugger'],
  },
  build: {
    // Disable source maps in production to prevent exposing source code & variable names in DevTools Sources tab
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Obfuscate chunk file names for security
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
