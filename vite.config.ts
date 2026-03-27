import { defineConfig } from "vite-plus";

const fmt = await import("@borrowdev/config/oxfmt.json", { with: { type: "json" } });
export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt,
  test: {
    globals: true,
  },
});
