import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "leaflet",
      "react-leaflet",
      "@react-leaflet/core",
      "recharts",
      "@tanstack/react-query",
      "lucide-react",
    ],
  },
  build: {
    outDir: "dist/public",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react/jsx-runtime"],
          "router-vendor": ["react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "map-vendor": ["leaflet", "react-leaflet", "@react-leaflet/core"],
          "charts-vendor": ["recharts"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-select",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-progress",
            "@radix-ui/react-accordion",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false,
  },
});
