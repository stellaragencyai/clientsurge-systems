import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const productSignupFallbackPaths = new Set([
  "/product-signup",
  "/product_signup",
  "/product-sign-up",
]);

function productSignupPreviewFallback() {
  return {
    name: "clientsurge-product-signup-preview-fallback",
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestPath = new URL(req.url || "/", "http://localhost").pathname;
        if (!productSignupFallbackPaths.has(requestPath)) {
          next();
          return;
        }

        const fallbackPath = path.resolve(
          __dirname,
          "dist",
          requestPath.replace(/^\//, ""),
          "index.html",
        );

        if (!fs.existsSync(fallbackPath)) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(fs.readFileSync(fallbackPath, "utf8"));
      });
    },
  };
}

// #8: split recharts + framer-motion into separate chunks
export default defineConfig({
  plugins: [react(), productSignupPreviewFallback()],
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    modulePreload: {
      resolveDependencies(_filename, deps) {
        return deps.filter(
          (dep) => !dep.includes("vendor-framer") && !dep.includes("vendor-charts")
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-framer": ["framer-motion"],
          "vendor-charts": ["recharts"],
          "vendor-lucide": ["lucide-react"],
          // Fix #44: Split heavy libraries into separate chunks so they're not
          // loaded eagerly on pages that don't use them.
          "vendor-dnd": ["@hello-pangea/dnd"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-stripe": ["@stripe/react-stripe-js", "@stripe/stripe-js"],
        },
      },
    },
  },
  // #9: prevent FOUT — handled via CSS font-display: swap in index.html
  css: {
    devSourcemap: true,
  },
});
