import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
  root: path.resolve(repoRoot, "src/client"),
  publicDir: path.resolve(repoRoot, "public"),
  plugins: [react()],
  css: {
    postcss: path.resolve(repoRoot, "build/postcss.config.js"),
  },
  build: {
    outDir: path.resolve(repoRoot, "dist/client"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3016",
      "/health": "http://localhost:3016",
    },
  },
});
