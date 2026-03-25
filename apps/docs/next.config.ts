import type { NextConfig } from "next";
import nextra from "nextra";

const nextConfig: NextConfig = {
  basePath: "/docs",
  assetPrefix: "/docs",
};

const withNextra = nextra({
  codeHighlight: true,
  defaultShowCopyCode: true,
  readingTime: false,
  search: {
    codeblocks: false,
  },
});

export default withNextra(nextConfig);
