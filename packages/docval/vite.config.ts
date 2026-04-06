import { defineConfig } from "vite-plus";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Packages are installed in the import tests, so we need to increase the timeout
    testTimeout: 120000,
  },
  pack: {
    entry: {
      main: "./src/index.ts",
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
