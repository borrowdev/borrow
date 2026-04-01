import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  pack: {
    entry: {
      host: "./src/host/index.ts",
      hostWorker: "./src/host/worker.ts",
    },
    dts: {
      tsgo: true,
    },
    target: false,
    minify: false,
    treeshake: true,
    unbundle: true,
    exports: false,
    publint: true,
    format: "esm",
  },
});
