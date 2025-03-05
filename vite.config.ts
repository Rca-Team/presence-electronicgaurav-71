
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['face-api.js']  // Exclude face-api.js from optimization to prevent issues
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'face-api': ['face-api.js'],
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@supabase/supabase-js',
            'firebase',
            'uuid'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1600, // Increase chunk size warning limit
  },
  // Ensure environment variables are correctly loaded
  envPrefix: 'VITE_'
}));
