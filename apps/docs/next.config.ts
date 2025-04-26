import { composePlugins, withNx } from "@nx/next";
import nextra from "nextra";
import type { WithNxOptions } from "@nx/next/plugins/with-nx";

const nextConfig: WithNxOptions = {
  nx: {
    svgr: false,
  },
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

const plugins = [withNextra, withNx];

module.exports = composePlugins(...plugins)(nextConfig);
