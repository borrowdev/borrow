import defaultMdxComponents from "fumadocs-ui/mdx";
import { APIPage } from "@/components/api-page";
import * as TabsComponents from "fumadocs-ui/components/tabs";
import type { MDXComponents } from "mdx/types";
import { icons as tablerIcons } from "@tabler/icons-react";

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...TabsComponents,
    ...components,
    ...tablerIcons,
    APIPage,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
