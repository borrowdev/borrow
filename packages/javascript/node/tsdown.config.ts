import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    main: "./src/index.ts",
    limiterHost: "./src/lib/limiter/host/index.ts",
  },
  dts: true,
  target: false,
  minify: false,
  treeshake: true,
  unbundle: true,
  exports: false,
  publint: true,
  format: "esm",
});
