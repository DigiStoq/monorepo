import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Prevent vite from obscuring rust errors
  clearScreen: false,

  // Tauri expects a fixed port, fail if that port is not available
  server: {
    host: "0.0.0.0",
    port: 3005,
    strictPort: true,
    watch: {
      // Tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },

  // Env variables starting with TAURI_ are exposed to tauri's rust code
  envPrefix: ["VITE_", "TAURI_"],

  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS/Linux
    // Safari 14+ is required for BigInt support used by @powersync/web
    target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari14",
    // Don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // Produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },

  // PowerSync web workers require ES module format
  worker: {
    format: "es",
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Optimize PowerSync dependencies
  optimizeDeps: {
    exclude: ["@journeyapps/wa-sqlite", "@powersync/web"],
  },
});
