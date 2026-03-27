import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { remarkTypeScriptToJavaScript } from "fumadocs-docgen/remark-ts2js";
import { pageSchema, metaSchema } from "fumadocs-core/source/schema";
import { docsRoute } from "./lib/shared";
import { remarkNpm } from "fumadocs-core/mdx-plugins";

export const docs = defineDocs({
  dir: "content",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

const formatOptions = (await import("@borrowdev/config/oxfmt.json", { with: { type: "json" } }))
  .default;
export default defineConfig({
  mdxOptions: {
    baseUrl: docsRoute,
    remarkCodeTabOptions: {
      Tabs: "CodeBlockTabs",
      parseMdx: true,
    },
    remarkPlugins: [
      () =>
        remarkTypeScriptToJavaScript({
          persist: {
            id: "ts2js",
          },
          defaultValue: "ts",
          formatOptions,
        }),
      () => remarkNpm({ persist: { id: "remark-npm" } }),
    ],
  },
});
