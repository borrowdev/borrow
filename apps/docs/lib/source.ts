import { type InferPageType, loader } from "fumadocs-core/source";
import { docs } from "collections/server";
import { icons as tablerIcons } from "@tabler/icons-react";
import { icons as lucideIcons } from "lucide-react";
import { createElement } from "react";
import { openapiPlugin } from "fumadocs-openapi/server";
import { docsContentRoute, docsImageRoute, docsRoute } from "./shared";

export const source = loader({
  source: docs.toFumadocsSource(),
  baseUrl: docsRoute,
  icon(icon) {
    if (!icon) return;
    if (icon in tablerIcons) {
      return createElement(tablerIcons[icon as keyof typeof tablerIcons], { stroke: 1 });
    }
    if (icon in lucideIcons) {
      return createElement(lucideIcons[icon as keyof typeof lucideIcons], { strokeWidth: 1 });
    }
    return undefined;
  },
  plugins: [openapiPlugin()],
});

export function getPageMarkdownUrl(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "content.md"];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join("/")}`,
  };
}

export async function getLLMText(page: InferPageType<typeof source>) {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})

${processed}`;
}

export function getPageImage(page: InferPageType<typeof source>) {
  const segments = [...page.slugs, "image.webp"];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join("/")}`,
  };
}
