import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ["@hermes-studio/bridge"]
      })
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "electron/main/index.ts")
        }
      }
    }
  },
  preload: {
    plugins: [
      externalizeDepsPlugin({
        exclude: ["@hermes-studio/bridge"]
      })
    ],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, "electron/preload/index.ts")
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname),
    plugins: [react()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, "index.html")
      }
    },
    resolve: {
      alias: {
        "@": resolve(__dirname, "src")
      }
    }
  }
});
