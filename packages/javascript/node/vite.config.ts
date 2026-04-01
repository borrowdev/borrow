import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      main: "./src/index.ts",
      limiterHost: "./src/lib/limiter/host/index.ts",
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
  test: {
    projects: [
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: "main",
          include: ["tests/**/*.test.ts"],
          exclude: ["tests/src/lib/limiter/host/cloudflare.test.ts", "**/node_modules"],
          setupFiles: ["./tests/setup.ts"],
        },
      },
      {
        resolve: {
          tsconfigPaths: true,
        },
        test: {
          name: "cloudflare",
          include: ["tests/src/lib/limiter/host/cloudflare.test.ts"],
          setupFiles: ["./tests/setup.ts"],
        },
        plugins: [
          // This plugin conflicts with the other environment tests (probably due to shared network resources).
          // So we have a separate vitest project for it. This way it can run separately from the other tests (before or after).
          cloudflareTest({
            wrangler: {
              configPath: "./tests/fixtures/environments/cloudflare/wrangler.jsonc",
            },
          }),
        ],
      },
    ],
  },
});
