import adapters from "@/adapters";
import type { Root } from "mdast";

export type DocValOptions = {
  include?: boolean;
};

export default function remarkDocval({ include }: DocValOptions = {}) {
  return async function (tree: Root) {
    const promises: Promise<void>[] = [];
    tree.children.forEach((node) => {
      if (node.type === "code" && node.lang && node.lang in adapters) {
        const metadata = node.meta?.split(" ") ?? [];
        const docValIndex = metadata.findIndex((item) => item === "docval");
        const noDocValIndex = metadata.findIndex((item) => item === "no-docval");
        if ((include && noDocValIndex === -1) || docValIndex !== -1) {
          promises.push(adapters[node.lang as keyof typeof adapters](node.value, metadata));
        }
      } else if (node.type === "code" && process.env.DOCVAL_TEST_NO_SKIP === "true") {
        throw new Error(`Skipped code block: ${JSON.stringify(node)}`);
      }
    });
    const res = await Promise.allSettled(promises);
    if (res.some((r) => r.status === "rejected")) {
      throw JSON.stringify({
        message: "One or more code blocks failed validation.",
        originalResults: res,
      });
    }

    return tree;
  };
}
