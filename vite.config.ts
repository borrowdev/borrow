import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {
    singleQuote: false,
    printWidth: 80,
    semi: true,
    jsdoc: {},
    sortTailwindcss: {
      functions: ["cn"],
    },
    sortImports: {},
    sortPackageJson: true,
    ignorePatterns: ["/dist", "/coverage", "pnpm-lock.yaml"],
  },
  test: {
    globals: true,
  },
});
