import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// #8: split recharts + framer-motion into separate chunks
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-framer": ["framer-motion"],
          "vendor-charts": ["recharts"],
          "vendor-lucide": ["lucide-react"],
        },
      },
    },
  },
  // #9: prevent FOUT — handled via CSS font-display: swap in index.html
  css: {
    devSourcemap: true,
  },
});
